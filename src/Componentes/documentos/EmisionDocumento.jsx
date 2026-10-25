"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import VisorPdf from "@/Componentes/documentos/VisorPdf";
import AceptacionPacienteOtp from "@/Componentes/documentos/AceptacionPacienteOtp";
import InsigniaEstado from "@/Componentes/firma/InsigniaEstado";
import { useApiFirma } from "@/hooks/useApiFirma";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { MODO_MOCK } from "@/lib/firma/apiFirma";
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO, mensajeError } from "@/lib/firma/constantes";
import { MODOS_FIRMA } from "@/lib/documentos/zonaFirma";
import { imprimirPdf } from "@/lib/documentos/imprimirPdf";
import { formatearInstanteConOffset } from "@/lib/fechas";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Panel de emisión reutilizable para todo documento firmable con FES.
 *
 * Cada pantalla solo aporta `generarCuerpoPdf({ modo, borrador })`, construido
 * con motorDocumento; aquí se resuelve una sola vez previsualizar, firmar,
 * enviar, descargar e imprimir.
 *
 * Reglas (docs/firma/01 §9):
 * - El front genera el CUERPO con la zona de firma vacía. La grafía, la hora de
 *   firma y el hash los pone el servidor. Lo que se ve después de firmar es el
 *   PDF del servidor, y ese es el que se envía, descarga e imprime: nunca se
 *   regenera.
 * - Si quien opera no es el profesional firmante, el documento se prepara y
 *   queda en la bandeja de ese profesional ("Enviar a firma").
 * - "Imprimir para firmar a mano" no pasa por la firma electrónica: genera el
 *   documento con línea de firma y lo manda a la impresora sin descargarlo.
 */
export default function EmisionDocumento({
  tipoDocumento,
  titulo,
  referencia,
  paciente = {},
  profesional = {},
  generarCuerpoPdf,
  metadatos = {},
  nombreArchivo,
  deshabilitado = false,
  motivoDeshabilitado = "",
  compacto = false, // columnas angostas: botones apilados a todo el ancho
  variante = "panel", // "panel": tarjeta con descripción · "acciones": solo los dos botones (filas de una lista)
  requiereAceptacionPaciente = false, // consentimiento informado: el paciente acepta con código (OTP) antes de firmar
}) {
  const api = useApiFirma();
  const sesion = useSesionProfesional();
  const esFirmante = Boolean(profesional?.id_profesional) && sesion.esDueno(profesional.id_profesional);

  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState("borrador"); // borrador | trabajando | firmado | enviado_a_firma
  const [borrador, setBorrador] = useState(null);
  const [final, setFinal] = useState(null);
  const [documento, setDocumento] = useState(null);
  const [firmaActiva, setFirmaActiva] = useState(null); // null = desconocido
  const [imprimiendo, setImprimiendo] = useState(false);
  const [enlaceRespaldo, setEnlaceRespaldo] = useState(null);
  const [aceptacion, setAceptacion] = useState(null);

  const firmar = useReverification((cuerpo) => api.firmarDocumento(cuerpo));

  // ¿El firmante tiene firma registrada? Solo se puede consultar siendo él (o admin).
  useEffect(() => {
    if (!abierto || !profesional?.id_profesional || !(esFirmante || sesion.esAdministrador)) return;
    let vigente = true;
    api.seleccionarEstadoFirma({ id_profesional: profesional.id_profesional })
      .then((r) => vigente && setFirmaActiva(r.firma?.estado === "activa"))
      .catch(() => vigente && setFirmaActiva(null));
    return () => {
      vigente = false;
    };
  }, [abierto, api, profesional, esFirmante, sesion.esAdministrador]);

  async function abrirVistaPrevia() {
    try {
      setDocumento(null);
      setFinal(null);
      setAceptacion(null);
      setPaso("borrador");
      setAbierto(true);
      setBorrador(null);
      const { blob } = await generarCuerpoPdf({ modo: MODOS_FIRMA.FES, borrador: true });
      setBorrador(blob);
    } catch (error) {
      console.error("[EmisionDocumento] vista previa", error);
      toast.error("No se pudo generar la vista previa del documento.");
      setAbierto(false);
    }
  }

  async function preparar() {
    // El PDF que se envía NO lleva el marco de "vista previa".
    const cuerpo = await generarCuerpoPdf({ modo: MODOS_FIRMA.FES, borrador: false });
    if (!cuerpo?.zonaFirma) throw new Error("pdfInvalido");

    const formData = new FormData();
    formData.append("pdf", cuerpo.blob, `${nombreArchivo || tipoDocumento}.pdf`);
    formData.append("tipo_documento", tipoDocumento);
    formData.append("titulo", titulo);
    formData.append("id_profesional_firmante", String(profesional.id_profesional));
    if (paciente?.id_paciente) formData.append("id_paciente", String(paciente.id_paciente));
    if (referencia?.tabla) formData.append("referencia_tabla", referencia.tabla);
    if (referencia?.id) formData.append("referencia_id", String(referencia.id));
    formData.append("zona_firma", JSON.stringify(cuerpo.zonaFirma));
    if (cuerpo.zonaPaciente) formData.append("zona_paciente", JSON.stringify(cuerpo.zonaPaciente));
    formData.append("metadatos", JSON.stringify(metadatos));
    if (requiereAceptacionPaciente) {
      // Quién acepta con el código: el paciente o su representante legal. El
      // servidor lo estampa en la zona del paciente (docs/firma/02 §6.1).
      formData.append("aceptante_nombre", paciente?.nombre || "");
      formData.append("aceptante_documento", paciente?.documento || "");
    }
    if (MODO_MOCK) {
      // Solo el mock: el backend real toma estos datos de su propia base.
      formData.append("paciente_nombre", paciente?.nombre || "");
      formData.append("firmante_nombre", profesional?.nombre || "");
      formData.append("paciente_contacto_mock", JSON.stringify({
        nombre: paciente?.nombre,
        documento: paciente?.documento,
        correo: paciente?.correo,
        telefono: paciente?.telefono,
      }));
      formData.append("firmante_mock", JSON.stringify({
        nombre: profesional?.nombre,
        rut: profesional?.rut,
        profesion: profesional?.especialidad,
        registroSis: profesional?.registroSis,
      }));
    }
    const { documento: preparado } = await api.prepararDocumento(formData);
    return preparado;
  }

  // Prepara el documento una sola vez: el código del paciente queda ligado a él.
  async function asegurarDocumento() {
    if (documento?.estado === "pendiente_firma") return documento;
    const preparado = await preparar();
    setDocumento(preparado);
    return preparado;
  }

  async function firmarDocumento() {
    setPaso("trabajando");
    try {
      const preparado = documento?.estado === "pendiente_firma" ? documento : await preparar();
      setDocumento(preparado);

      if (!esFirmante) {
        setPaso("enviado_a_firma");
        toast.success(`Documento enviado a la bandeja de ${profesional?.nombre || "el profesional"} para su firma.`);
        return;
      }

      const respuesta = await firmar({ id_documento: preparado.id_documento });
      setDocumento(respuesta.documento);
      const pdfFinal = await api.descargarDocumento({ id_documento: preparado.id_documento, accion: "visto" });
      setFinal(pdfFinal);
      setPaso("firmado");
      toast.success("Documento firmado electrónicamente.");
    } catch (error) {
      setPaso("borrador");
      if (isReverificationCancelledError(error)) {
        toast("Firma cancelada: no se confirmó tu identidad.");
      } else {
        console.error("[EmisionDocumento] firmar", error);
        toast.error(mensajeError(error?.codigo || error?.message));
      }
    }
  }

  async function imprimirManuscrita() {
    setImprimiendo(true);
    setEnlaceRespaldo(null);
    try {
      const { blob } = await generarCuerpoPdf({ modo: MODOS_FIRMA.MANUSCRITA, borrador: false });
      const resultado = await imprimirPdf(blob);
      if (resultado.modo === "bloqueado") setEnlaceRespaldo(resultado.url);
    } catch (error) {
      console.error("[EmisionDocumento] imprimir", error);
      toast.error("No se pudo preparar el documento para imprimir.");
    } finally {
      setImprimiendo(false);
    }
  }

  const deshabilitarAcciones = deshabilitado || !profesional?.id_profesional;

  const modal = (
    <ModalEmision
      abierto={abierto}
      onCerrar={() => paso !== "trabajando" && setAbierto(false)}
      titulo={titulo}
      paso={paso}
      borrador={borrador}
      final={final}
      documento={documento}
      esFirmante={esFirmante}
      firmaActiva={firmaActiva}
      profesional={profesional}
      paciente={paciente}
      nombreArchivo={nombreArchivo}
      onFirmar={firmarDocumento}
      api={api}
      requiereAceptacion={requiereAceptacionPaciente}
      aceptacion={aceptacion}
      onAceptado={setAceptacion}
      asegurarDocumento={asegurarDocumento}
    />
  );

  if (variante === "acciones") {
    return (
      <div className="font-system-apple flex flex-wrap items-center gap-1.5" title={deshabilitarAcciones ? motivoDeshabilitado : undefined}>
        <button
          type="button"
          onClick={imprimirManuscrita}
          disabled={deshabilitarAcciones || imprimiendo}
          aria-label="Imprimir para firmar a mano"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <IconoImpresora />
          {imprimiendo ? "…" : "Imprimir"}
        </button>
        <button
          type="button"
          onClick={abrirVistaPrevia}
          disabled={deshabilitarAcciones}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          Firmar
        </button>
        {enlaceRespaldo ? (
          <a href={enlaceRespaldo} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-[#007AFF]">
            Abrir para imprimir
          </a>
        ) : null}
        {modal}
      </div>
    );
  }

  return (
    <div className="font-system-apple rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`flex flex-col gap-3 ${compacto ? "" : "sm:flex-row sm:items-center sm:justify-between"}`}>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-slate-900">Emitir documento</p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {deshabilitarAcciones
              ? motivoDeshabilitado || "Selecciona el profesional responsable para emitir."
              : `Firma: ${profesional.nombre || "profesional"} · ${TIPOS_DOCUMENTO[tipoDocumento] || "Documento"}`}
          </p>
        </div>
        <div className={`flex flex-col gap-2 ${compacto ? "" : "sm:flex-row"}`}>
          <button
            type="button"
            onClick={imprimirManuscrita}
            disabled={deshabilitarAcciones || imprimiendo}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <IconoImpresora />
            {imprimiendo ? "Preparando…" : "Imprimir para firmar a mano"}
          </button>
          <button
            type="button"
            onClick={abrirVistaPrevia}
            disabled={deshabilitarAcciones}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            Previsualizar y firmar
          </button>
        </div>
      </div>
      {enlaceRespaldo ? (
        <p className="mt-3 rounded-xl bg-[#F2F2F7] px-3 py-2 text-[12px] text-[#3C3C43]">
          El navegador bloqueó la ventana de impresión.{" "}
          <a href={enlaceRespaldo} target="_blank" rel="noreferrer" className="font-semibold text-[#007AFF]">
            Abrir el documento para imprimir
          </a>
        </p>
      ) : null}

      {modal}
    </div>
  );
}

export function ModalEmision({
  abierto, onCerrar, titulo, paso, borrador, final, documento, esFirmante, firmaActiva, profesional, paciente, nombreArchivo, onFirmar, api,
  requiereAceptacion = false, aceptacion = null, onAceptado, asegurarDocumento,
}) {
  const [montado, setMontado] = useState(false);
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviadoA, setEnviadoA] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const botonCerrarRef = useRef(null);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!abierto) return undefined;
    setCorreo(paciente?.correo || "");
    setEnviadoA("");
    setErrorCorreo("");
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => botonCerrarRef.current?.focus());
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, paciente, onCerrar]);

  const registrar = useCallback(
    (accion) => api.descargarDocumento({ id_documento: documento.id_documento, accion }),
    [api, documento]
  );

  async function enviar() {
    const destino = correo.trim();
    // Vacío: el backend usa el correo registrado en la ficha del paciente.
    if (destino && !CORREO_VALIDO.test(destino)) {
      setErrorCorreo("Ingresa un correo electrónico válido.");
      return;
    }
    setEnviando(true);
    setErrorCorreo("");
    try {
      const r = await api.enviarDocumentoCorreo({ id_documento: documento.id_documento, ...(destino ? { correo: destino } : {}) });
      setEnviadoA(r.enviadoA || destino || "el correo registrado");
      toast.success("Documento enviado al correo del paciente.");
    } catch (error) {
      setErrorCorreo(mensajeError(error?.codigo));
    } finally {
      setEnviando(false);
    }
  }

  async function descargar() {
    try {
      const blob = await registrar("descargado");
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `${nombreArchivo || "documento"}-${documento.codigo_verificacion}.pdf`;
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      toast.error(mensajeError(error?.codigo));
    }
  }

  async function imprimir() {
    try {
      await imprimirPdf(await registrar("impreso"));
    } catch (error) {
      toast.error(mensajeError(error?.codigo));
    }
  }

  if (!montado || !abierto) return null;

  const sinFirma = esFirmante && firmaActiva === false;
  const faltaAceptacion = requiereAceptacion && !aceptacion;
  const firmado = paso === "firmado" && documento;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div onClick={onCerrar} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emision-titulo"
        className="font-system-apple relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]"
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pb-3 pt-3 sm:px-7 sm:pt-5">
          <div className="min-w-0">
            <h2 id="emision-titulo" className="truncate text-[16px] font-semibold tracking-tight text-slate-900">{titulo}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <InsigniaEstado
                estado={
                  firmado
                    ? ESTADOS_DOCUMENTO.firmado
                    : paso === "enviado_a_firma"
                    ? ESTADOS_DOCUMENTO.pendiente_firma
                    : { etiqueta: "Vista previa", tono: "neutro" }
                }
              />
              {documento?.codigo_verificacion ? (
                <span className="font-mono text-[11px] text-slate-500">{documento.codigo_verificacion}</span>
              ) : null}
            </div>
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            disabled={paso === "trabajando"}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7">
          <VisorPdf blob={firmado ? final : borrador} titulo={titulo} alto="62dvh" />
        </div>

        <footer className="border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
          {firmado ? (
            <div className="space-y-4">
              <div className="grid gap-1 text-[12px] text-slate-600 sm:grid-cols-3">
                <p>
                  <span className="text-slate-400">Firmado: </span>
                  {formatearInstanteConOffset(documento.firmado_at)}
                </p>
                <p>
                  <span className="text-slate-400">Código: </span>
                  <span className="font-mono">{documento.codigo_verificacion}</span>
                </p>
                <HuellaDocumento hash={documento.pdf_sha256} />
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => {
                        setCorreo(e.target.value);
                        setErrorCorreo("");
                      }}
                      placeholder={paciente?.correo ? "correo@paciente.cl" : "Correo registrado del paciente"}
                      aria-label="Correo del paciente"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      onClick={enviar}
                      disabled={enviando}
                      className="h-11 rounded-xl bg-black px-5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                    >
                      {enviando ? "Enviando…" : "Enviar al correo"}
                    </button>
                  </div>
                  {errorCorreo ? <p className="mt-1 text-[12px] font-medium text-[#FF3B30]">{errorCorreo}</p> : null}
                  {enviadoA ? <p className="mt-1 text-[12px] text-[#248A3D]">Enviado a {enviadoA}.</p> : null}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button type="button" onClick={descargar} className="h-11 rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                    Descargar
                  </button>
                  <button type="button" onClick={imprimir} className="h-11 rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          ) : paso === "enviado_a_firma" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-slate-600">
                Quedó en la bandeja de <span className="font-semibold text-slate-900">{profesional?.nombre}</span>. Cuando lo firme,
                podrás enviarlo al paciente desde su carpeta.
              </p>
              <button type="button" onClick={onCerrar} className="h-11 rounded-xl bg-black px-5 text-[13px] font-semibold text-white hover:bg-slate-800">
                Listo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
            {requiereAceptacion ? (
              <AceptacionPacienteOtp
                api={api}
                paciente={paciente}
                asegurarDocumento={asegurarDocumento}
                aceptacion={aceptacion}
                onAceptado={onAceptado}
              />
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-slate-500">
                {faltaAceptacion
                  ? "Primero el paciente debe aceptar con su código. Después firmas tú."
                  : sinFirma
                  ? "Aún no registras tu firma electrónica. Regístrala en Profesionales → Editar, o imprime para firmar a mano."
                  : esFirmante
                  ? "Revisa el documento. Al firmar se te pedirá confirmar tu identidad si pasaron más de 10 minutos."
                  : `Este documento lo firma ${profesional?.nombre || "el profesional"}. Se enviará a su bandeja.`}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={onCerrar} disabled={paso === "trabajando"} className="h-11 rounded-xl px-5 text-[13px] font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onFirmar}
                  disabled={!borrador || paso === "trabajando" || sinFirma || faltaAceptacion}
                  className="h-11 rounded-xl bg-black px-6 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {paso === "trabajando" ? "Procesando…" : esFirmante ? "Firmar con FES" : "Enviar a firma"}
                </button>
              </div>
            </div>
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}

function HuellaDocumento({ hash }) {
  if (!hash) return null;
  async function copiar() {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Huella copiada.");
    } catch {
      toast.error("No se pudo copiar.");
    }
  }
  return (
    <p className="flex items-center gap-1.5">
      <span className="text-slate-400">Huella: </span>
      <span className="font-mono">{`${hash.slice(0, 4)}…${hash.slice(-4)}`}</span>
      <button type="button" onClick={copiar} className="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:underline">
        Copiar
      </button>
    </p>
  );
}

function IconoImpresora() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}
