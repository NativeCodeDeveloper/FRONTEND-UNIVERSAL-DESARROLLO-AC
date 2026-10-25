"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import VisorPdf from "@/Componentes/documentos/VisorPdf";
import InsigniaEstado from "@/Componentes/firma/InsigniaEstado";
import { useApiFirma } from "@/hooks/useApiFirma";
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO, mensajeError } from "@/lib/firma/constantes";
import { ETIQUETAS_CONSENTIMIENTO, PLANTILLAS_RESPALDO } from "@/lib/consentimientos/textosLegales";
import { imprimirPdf } from "@/lib/documentos/imprimirPdf";
import { formatearInstanteConOffset } from "@/lib/fechas";

const TITULOS_CONSENTIMIENTO = Object.fromEntries(PLANTILLAS_RESPALDO.map((p) => [p.codigo, p.titulo]));

/**
 * Carpeta del paciente: documentos firmados electrónicamente y consentimientos
 * aceptados al reservar. Todo se lee del servidor (los mismos bytes firmados) y
 * cada vista, descarga, impresión o envío queda en la bitácora del backend.
 */
// puedeVerContenido: solo perfiles clínicos abren o imprimen el documento (Ley 20.584 art. 13).
// Administración y recepción ven el listado y pueden reenviarlo al paciente.
export default function ListaDocumentosPaciente({ idPaciente, correoPaciente, puedeVerContenido = false }) {
  const api = useApiFirma();
  const [pestana, setPestana] = useState("documentos");
  const [documentos, setDocumentos] = useState([]);
  const [aceptaciones, setAceptaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [visor, setVisor] = useState(null); // { titulo, blob }
  const [ocupado, setOcupado] = useState(null);

  const cargar = useCallback(async () => {
    if (!idPaciente) return;
    setCargando(true);
    setError("");
    try {
      const [d, c] = await Promise.all([
        api.listarDocumentosPaciente({ id_paciente: idPaciente }),
        api.listarConsentimientosPaciente({ id_paciente: idPaciente }),
      ]);
      setDocumentos(d.documentos || []);
      setAceptaciones(c.aceptaciones || []);
    } catch (e) {
      setError(mensajeError(e?.codigo));
    } finally {
      setCargando(false);
    }
  }, [api, idPaciente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function ejecutar(clave, tarea) {
    setOcupado(clave);
    try {
      await tarea();
    } catch (e) {
      toast.error(mensajeError(e?.codigo));
    } finally {
      setOcupado(null);
    }
  }

  const descargarDe = (item, accion) =>
    item.id_documento
      ? api.descargarDocumento({ id_documento: item.id_documento, accion })
      : api.descargarConsentimiento({ id_aceptacion: item.id_aceptacion, accion });

  const acciones = (item, titulo) => {
    const clave = item.id_documento || item.id_aceptacion;
    const firmado = item.id_aceptacion || item.estado === "firmado" || item.estado === "anulado";
    if (!firmado) return null;
    return (
      <div className="grid grid-cols-3 gap-1.5 sm:flex">
        {puedeVerContenido ? (
        <BotonAccion
          onClick={() => ejecutar(clave, async () => setVisor({ titulo, blob: await descargarDe(item, "visto") }))}
          deshabilitado={ocupado === clave}
        >
          Ver
        </BotonAccion>
        ) : null}
        <BotonAccion
          onClick={() =>
            ejecutar(clave, async () => {
              const r = item.id_documento
                ? await api.enviarDocumentoCorreo({ id_documento: item.id_documento })
                : await api.enviarConsentimientoCorreo({ id_aceptacion: item.id_aceptacion });
              toast.success(`Enviado a ${r.enviadoA || correoPaciente || "el correo del paciente"}.`);
            })
          }
          deshabilitado={ocupado === clave || item.estado === "anulado"}
        >
          Enviar
        </BotonAccion>
        {puedeVerContenido ? (
        <BotonAccion onClick={() => ejecutar(clave, async () => imprimirPdf(await descargarDe(item, "impreso")))} deshabilitado={ocupado === clave}>
          Imprimir
        </BotonAccion>
        ) : null}
      </div>
    );
  };

  const lista = pestana === "documentos" ? documentos : aceptaciones;

  return (
    <section className="font-system-apple rounded-[24px] border border-slate-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-[15px] font-semibold text-slate-900">Documentos y consentimientos</h2>
        <div role="tablist" className="inline-flex rounded-full bg-[#F2F2F7] p-1">
          {[
            ["documentos", `Firmados (${documentos.length})`],
            ["consentimientos", `Consentimientos (${aceptaciones.length})`],
          ].map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={pestana === valor}
              onClick={() => setPestana(valor)}
              className={`h-8 rounded-full px-3.5 text-[12px] font-medium transition-all ${
                pestana === valor ? "bg-white text-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-[#636366]"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-3 sm:px-6">
        {cargando ? (
          <div className="space-y-2 py-2">
            {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : error ? (
          <p className="py-4 text-[13px] text-[#D70015]">
            {error}{" "}
            <button type="button" onClick={cargar} className="font-semibold text-[#007AFF]">Reintentar</button>
          </p>
        ) : lista.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-slate-500">
            {pestana === "documentos"
              ? "Este paciente aún no tiene documentos firmados electrónicamente."
              : "Este paciente no tiene consentimientos registrados desde la reserva en línea."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lista.map((item) => {
              const esDoc = Boolean(item.id_documento);
              const titulo = esDoc ? item.titulo : TITULOS_CONSENTIMIENTO[item.codigo] || item.titulo || "Consentimiento";
              return (
                <li key={item.id_documento || item.id_aceptacion} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-medium text-slate-900">{titulo}</p>
                      {esDoc ? (
                        <InsigniaEstado estado={ESTADOS_DOCUMENTO[item.estado]} />
                      ) : (
                        <InsigniaEstado estado={item.revocado_at ? { etiqueta: "Revocado", tono: "rojo" } : { etiqueta: "Aceptado", tono: "verde" }} />
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {esDoc
                        ? `${TIPOS_DOCUMENTO[item.tipo_documento] || "Documento"} · ${item.firmante_nombre || ""} · ${formatearInstanteConOffset(item.firmado_at || item.preparado_at)}`
                        : `${ETIQUETAS_CONSENTIMIENTO[item.codigo]?.casilla ? "Reserva en línea" : "Consentimiento"} · v${item.version} · ${formatearInstanteConOffset(item.aceptado_at)}`}
                      {item.codigo_verificacion ? <span className="ml-1 font-mono">· {item.codigo_verificacion}</span> : null}
                    </p>
                  </div>
                  {acciones(item, titulo)}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ModalVisor visor={visor} onCerrar={() => setVisor(null)} />
    </section>
  );
}

function BotonAccion({ onClick, deshabilitado, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      className="h-9 rounded-lg px-3 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 disabled:text-[#C7C7CC]"
    >
      {children}
    </button>
  );
}

function ModalVisor({ visor, onCerrar }) {
  useEffect(() => {
    if (!visor) return undefined;
    const onKey = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visor, onCerrar]);

  if (!visor) return null;
  return createPortal(
    <div className="font-system-apple fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div onClick={onCerrar} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={visor.titulo} className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3 sm:px-7">
          <h2 className="truncate text-[15px] font-semibold text-slate-900">{visor.titulo}</h2>
          <button type="button" onClick={onCerrar} className="h-9 rounded-lg px-3 text-[14px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10">
            Cerrar
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-7">
          <VisorPdf blob={visor.blob} titulo={visor.titulo} alto="72dvh" />
        </div>
      </div>
    </div>,
    document.body
  );
}
