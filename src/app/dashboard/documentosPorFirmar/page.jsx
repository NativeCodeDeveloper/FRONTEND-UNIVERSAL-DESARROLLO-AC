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
import { formatearInstanteConOffset } from "@/lib/fechas";

/*
 * Bandeja del profesional: documentos que otra persona (secretaría,
 * administración) preparó para que él los firme. Quien genera y quien firma
 * quedan registrados por separado; la firma solo la puede hacer el profesional.
 */
export default function DocumentosPorFirmar() {
  const api = useApiFirma();
  const sesion = useSesionProfesional();
  const [documentos, setDocumentos] = useState([]);
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
            Documentos preparados para tu firma electrónica. Revísalos antes de firmar.
          </p>
        </header>

        {!FIRMA_HABILITADA ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-[13px] text-slate-500">
            La firma electrónica aún no está habilitada en este centro.
          </div>
        ) : !sesion.idProfesional && sesion.cargado ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-[13px] text-slate-500">
            Tu usuario no tiene una agenda profesional asignada, así que no recibe documentos para firmar.
          </div>
        ) : cargando ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-[#FF3B30]/10 px-4 py-3 text-[13px] text-[#D70015]">
            {error}{" "}
            <button type="button" onClick={cargar} className="font-semibold text-[#007AFF]">Reintentar</button>
          </div>
        ) : documentos.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-[14px] font-medium text-slate-700">No tienes documentos pendientes</p>
            <p className="mt-1 text-[13px] text-slate-500">Cuando alguien prepare un documento para tu firma, aparecerá aquí.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {documentos.map((d) => (
              <li key={d.id_documento} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{d.titulo}</p>
                    <InsigniaEstado estado={ESTADOS_DOCUMENTO[d.estado]} />
                  </div>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {TIPOS_DOCUMENTO[d.tipo_documento] || "Documento"}
                    {d.paciente_nombre ? ` · ${d.paciente_nombre}` : ""} · Preparado por {d.preparado_por || "—"} ·{" "}
                    {formatearInstanteConOffset(d.preparado_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revisar(d)}
                  className="h-10 shrink-0 rounded-xl bg-black px-5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Revisar y firmar
                </button>
              </li>
            ))}
          </ul>
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
