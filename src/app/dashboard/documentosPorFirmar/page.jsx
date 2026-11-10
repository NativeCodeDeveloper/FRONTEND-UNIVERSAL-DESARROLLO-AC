"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import ToasterClient from "@/Componentes/ToasterClient";
import InsigniaEstado from "@/Componentes/firma/InsigniaEstado";
import { ModalEmision } from "@/Componentes/documentos/EmisionDocumento";
import { useApiFirma } from "@/hooks/useApiFirma";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { FIRMA_HABILITADA } from "@/lib/firma/apiFirma";
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO, mensajeError } from "@/lib/firma/constantes";
import { formatearFechaAuto, formatearInstanteConOffset } from "@/lib/fechas";
import { BOTON } from "@/Componentes/documentos/botones";

/*
 * Bandeja de documentos pendientes de firma:
 *  - Para tu firma: los que otra persona (secretaría, un colega) preparó para que
 *    tú los firmes. Solo el profesional firmante puede firmarlos.
 *  - Enviados, esperando firma (administración): los que preparó para un profesional.
 *  - Pendientes del centro (administración): el resto de lo que espera firma.
 *  Reserva de la ficha (Ley 20.584): un profesional nunca ve documentos de otro.
 * Quien genera y quien firma quedan registrados por separado.
 */
export default function DocumentosPorFirmar() {
  const api = useApiFirma();
  const sesion = useSesionProfesional();
  const [documentos, setDocumentos] = useState([]);
  const [enviados, setEnviados] = useState([]);
  const [delCentro, setDelCentro] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState(null);
  const [borrador, setBorrador] = useState(null);
  const [final, setFinal] = useState(null);
  const [paso, setPaso] = useState("borrador");

  const firmar = useReverification((cuerpo) => api.firmarDocumento(cuerpo));

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const r = await api.listarPendientesFirma();
      setDocumentos(r.documentos || []);
      setEnviados(r.enviados || []);
      setDelCentro(r.clinica || []);
    } catch (e) {
      setError(mensajeError(e?.codigo));
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => {
    if (FIRMA_HABILITADA) cargar();
    else setCargando(false);
  }, [cargar]);

  async function revisar(documento) {
    setActual(documento);
    setBorrador(null);
    setFinal(null);
    setPaso("borrador");
    setAbierto(true);
    try {
      setBorrador(await api.seleccionarBorrador({ id_documento: documento.id_documento }));
    } catch (e) {
      toast.error(mensajeError(e?.codigo));
      setAbierto(false);
    }
  }

  // Quitar: saca de la bandeja un documento que no se firmó (queda en la evidencia como
  // anulado). La firmante y la administración; los vencidos se quitan solos a los 30 días.
  async function quitar(documento) {
    try {
      await api.quitarPendiente({ id_documento: documento.id_documento });
      const fuera = (lista) => lista.filter((d) => d.id_documento !== documento.id_documento);
      setDocumentos(fuera);
      setEnviados(fuera);
      setDelCentro(fuera);
      toast.success("Documento quitado de la bandeja.");
    } catch (e) {
      toast.error(mensajeError(e?.codigo));
    }
  }

  // Enviados y del centro: solo se revisan (los firma otro profesional).
  async function ver(documento) {
    try {
      const blob = await api.seleccionarBorrador({ id_documento: documento.id_documento });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error(mensajeError(e?.codigo));
    }
  }

  async function firmarActual() {
    setPaso("trabajando");
    try {
      const r = await firmar({ id_documento: actual.id_documento });
      setActual(r.documento);
      setFinal(await api.descargarDocumento({ id_documento: actual.id_documento, accion: "visto" }));
      setPaso("firmado");
      toast.success("Documento firmado electrónicamente.");
      setDocumentos((lista) => lista.filter((d) => d.id_documento !== actual.id_documento));
    } catch (e) {
      setPaso("borrador");
      if (isReverificationCancelledError(e)) toast("Firma cancelada: no se confirmó tu identidad.");
      else toast.error(mensajeError(e?.codigo));
    }
  }

  return (
    <div className="font-system-apple min-h-screen bg-[#FAFAFB]">
      <ToasterClient />
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Documentos por firmar</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Documentos que esperan tu firma electrónica. Solo ves los que firmas tú.
          </p>
        </header>

        {!FIRMA_HABILITADA ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-[13px] text-slate-500">
            La firma electrónica aún no está habilitada en este centro.
          </div>
        ) : cargando ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-[#FF3B30]/10 px-4 py-3 text-[13px] text-[#D70015]">
            {error}{" "}
            <button type="button" onClick={cargar} className={`${BOTON.texto} ${BOTON.compacto}`}>Reintentar</button>
          </div>
        ) : (
          <div className="space-y-8">
            <SeccionBandeja
              titulo="Para tu firma"
              vacio={sesion.idProfesional
                ? "No tienes documentos pendientes. Cuando alguien prepare un documento para tu firma, aparecerá aquí."
                : "Tu usuario no tiene una agenda profesional asignada, así que no firma documentos."}
              documentos={documentos}
              onQuitar={quitar}
              detalle={(d) => `Preparado por ${d.preparado_por || "—"}`}
              accion={(d) => (
                <button type="button" onClick={() => revisar(d)} className={BOTON.primario}>Revisar y firmar</button>
              )}
            />
            {enviados.length ? (
              <SeccionBandeja
                titulo="Enviados, esperando firma"
                documentos={enviados}
                onQuitar={quitar}
                detalle={(d) => `Espera la firma de ${d.firmante_nombre || "el profesional"}`}
                accion={(d) => (
                  <button type="button" onClick={() => ver(d)} className={`${BOTON.secundario} ${BOTON.compacto}`}>Ver</button>
                )}
              />
            ) : null}
            {delCentro.length ? (
              <SeccionBandeja
                titulo="Pendientes del centro"
                documentos={delCentro}
                onQuitar={quitar}
                detalle={(d) => `Espera la firma de ${d.firmante_nombre || "el profesional"} · preparado por ${d.preparado_por || "—"}`}
                accion={(d) => (
                  <button type="button" onClick={() => ver(d)} className={`${BOTON.secundario} ${BOTON.compacto}`}>Ver</button>
                )}
              />
            ) : null}
          </div>
        )}
      </div>

      <ModalEmision
        abierto={abierto}
        onCerrar={() => paso !== "trabajando" && setAbierto(false)}
        titulo={actual?.titulo || "Documento"}
        paso={paso}
        borrador={borrador}
        final={final}
        documento={actual}
        esFirmante
        firmaActiva={null}
        profesional={{ nombre: sesion.nombre }}
        paciente={{}}
        nombreArchivo={actual?.tipo_documento}
        onFirmar={firmarActual}
        api={api}
      />
    </div>
  );
}

function SeccionBandeja({ titulo, vacio, documentos, detalle, accion, onQuitar }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold text-[#6E6E73]">
        {titulo}
        {documentos.length ? <span className="ml-1.5 font-normal text-[#86868B]">{documentos.length}</span> : null}
      </h2>
      {documentos.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-[13px] text-slate-500">{vacio}</div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {documentos.map((d) => (
            <FilaBandeja key={d.id_documento} documento={d} detalle={detalle} accion={accion} onQuitar={onQuitar} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilaBandeja({ documento: d, detalle, accion, onQuitar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [quitando, setQuitando] = useState(false);
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-slate-900">{d.titulo}</p>
            <InsigniaEstado estado={ESTADOS_DOCUMENTO[d.estado]} />
          </div>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {TIPOS_DOCUMENTO[d.tipo_documento] || "Documento"}
            {d.paciente_nombre ? ` · ${d.paciente_nombre}` : ""} · {detalle(d)} · {formatearInstanteConOffset(d.preparado_at)}
          </p>
          {d.vence_at ? (
            <p className="mt-0.5 text-[12px] text-[#86868B]">Si no se firma, se quita solo el {formatearFechaAuto(d.vence_at)}.</p>
          ) : null}
        </div>
        {!confirmando ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {onQuitar ? (
              <button type="button" onClick={() => setConfirmando(true)} className={`${BOTON.textoDestructivo} ${BOTON.compacto}`}>Quitar</button>
            ) : null}
            {accion(d)}
          </div>
        ) : null}
      </div>
      {confirmando ? (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#FF3B30]/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-snug text-[#3A3A3C]">
            <span className="font-semibold text-[#1D1D1F]">¿Quitar este documento de la bandeja?</span> No se firmará y queda
            registrado como anulado. Si hace falta, se vuelve a emitir.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={() => setConfirmando(false)} disabled={quitando} className={`${BOTON.texto} ${BOTON.compacto}`}>Cancelar</button>
            <button
              type="button"
              disabled={quitando}
              onClick={async () => {
                setQuitando(true);
                await onQuitar(d);
                setQuitando(false);
                setConfirmando(false);
              }}
              className={`${BOTON.destructivo} ${BOTON.compacto}`}
            >
              {quitando ? "Quitando…" : "Quitar"}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
