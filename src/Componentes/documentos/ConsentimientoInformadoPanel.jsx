"use client";

import { useEffect, useMemo, useState } from "react";
import EmisionDocumento from "@/Componentes/documentos/EmisionDocumento";
import ImpresionManuscrita from "@/Componentes/documentos/ImpresionManuscrita";
import { useDatosEmpresa } from "@/hooks/useDatosEmpresa";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { FIRMA_HABILITADA } from "@/lib/firma/apiFirma";
import { datosProfesionalParaDocumento, profesionalPorId } from "@/lib/profesional";
import { formatRut } from "@/lib/designTokens";
import { bloquesDeTexto } from "@/lib/consentimientos/textosLegales";
import { PLANTILLA_BASE, renderizarConsentimiento } from "@/lib/consentimientos/plantillasProcedimiento";
import { useProcedimientos } from "@/hooks/useProcedimientos";
import { generarConsentimientoInformadoPdf } from "@/lib/documentos/generadores/consentimientoInformado";
import { formatearFechaLargaCivil, hoyCivil } from "@/lib/fechas";

async function sha256(texto) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const campo = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15";

/**
 * Consentimiento informado de un procedimiento, desde la carpeta del paciente.
 * Plantilla base + anexo del procedimiento + observaciones del caso (Ley 20.584,
 * art. 14). Con firma electrónica, el paciente acepta con un código (OTP) enviado
 * al correo o teléfono de su ficha y luego firma el profesional; el servidor estampa
 * ambas en el PDF. También se puede imprimir para que firmen ambos de puño y letra.
 */
export default function ConsentimientoInformadoPanel({ paciente }) {
  const empresa = useDatosEmpresa();
  const profesionales = useProfesionales();
  const sesion = useSesionProfesional();
  // Procedimientos vigentes de la clínica (Configuración → Consentimientos informados).
  const { procedimientos, cargando: cargandoProcedimientos } = useProcedimientos({ respaldoSiFalla: true });
  const grupos = useMemo(
    () => [...new Set(procedimientos.map((p) => p.grupo))].sort((a, b) => a.localeCompare(b, "es")),
    [procedimientos]
  );

  const [codigoAnexo, setCodigoAnexo] = useState("");
  const [idProfesional, setIdProfesional] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [conRepresentante, setConRepresentante] = useState(false);
  const [representante, setRepresentante] = useState({ nombre: "", documento: "" });
  const [verTexto, setVerTexto] = useState(false);
  const [plantillas, setPlantillas] = useState([]);

  // Por defecto, el profesional de la sesión (el que tiene la agenda asignada).
  useEffect(() => {
    if (!idProfesional && sesion.idProfesional) setIdProfesional(sesion.idProfesional);
  }, [sesion.idProfesional, idProfesional]);

  const anexo = procedimientos.find((p) => p.codigo === codigoAnexo) || null;
  const registrado = profesionalPorId(profesionales, idProfesional);
  const profesional = registrado ? { id_profesional: registrado.id_profesional, ...datosProfesionalParaDocumento(registrado) } : null;

  const datosPaciente = useMemo(() => {
    const nombre = `${paciente?.nombre || ""} ${paciente?.apellido || ""}`.trim();
    const tipo = paciente?.tipo_documento === "pasaporte" ? "Pasaporte" : "RUT";
    const numero = tipo === "RUT" ? formatRut(paciente?.rut) || paciente?.rut : paciente?.rut;
    return {
      nombre,
      documento: numero ? `${tipo} ${numero}` : "",
      representante: conRepresentante && representante.nombre.trim()
        ? { nombre: representante.nombre.trim(), documento: representante.documento.trim() ? `RUT ${representante.documento.trim()}` : "" }
        : null,
    };
  }, [paciente, conRepresentante, representante]);

  const texto = anexo ? renderizarConsentimiento({ anexo, empresa, profesional: profesional || {}, paciente: datosPaciente, observaciones }) : "";

  // Huella de cada plantilla (sin interpolar): queda en la evidencia junto al texto renderizado.
  useEffect(() => {
    if (!anexo) {
      setPlantillas([]);
      return undefined;
    }
    let vigente = true;
    Promise.all([sha256(PLANTILLA_BASE.cuerpo), sha256(anexo.cuerpo)]).then(([hBase, hAnexo]) => {
      if (vigente) {
        setPlantillas([
          { codigo: PLANTILLA_BASE.codigo, version: PLANTILLA_BASE.version, sha256: hBase },
          { codigo: anexo.codigo, version: anexo.version, sha256: hAnexo },
        ]);
      }
    });
    return () => {
      vigente = false;
    };
  }, [anexo]);

  // "Hoy" en la zona de la clínica, no según el reloj del equipo (CLAUDE.md).
  const fechaEmisionTexto = formatearFechaLargaCivil(hoyCivil());

  async function generar({ modo, borrador }) {
    return generarConsentimientoInformadoPdf({
      modo,
      borrador,
      empresa,
      texto,
      procedimiento: anexo.nombre,
      paciente: datosPaciente,
      profesional: profesional || { nombre: "" },
      fechaEmisionTexto,
    });
  }

  const falta = !anexo
    ? "Elige el procedimiento."
    : !profesional
    ? "Selecciona el profesional tratante."
    : conRepresentante && !representante.nombre.trim()
    ? "Ingresa el nombre del representante legal."
    : "";

  return (
    <section className="font-system-apple rounded-[24px] border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold text-slate-900">Consentimiento informado</h2>
        <p className="mt-0.5 text-[12px] text-slate-500">
          Plantilla base + anexo del procedimiento con sus riesgos y alternativas (Ley 20.584, art. 14).
        </p>
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Procedimiento</span>
            <select value={codigoAnexo} onChange={(e) => setCodigoAnexo(e.target.value)} className={campo} disabled={cargandoProcedimientos}>
              <option value="">{cargandoProcedimientos ? "Cargando…" : "Selecciona…"}</option>
              {grupos.map((grupo) => (
                <optgroup key={grupo} label={grupo}>
                  {procedimientos.filter((a) => a.grupo === grupo).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((a) => (
                    <option key={a.codigo} value={a.codigo}>{a.nombre}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Profesional tratante</span>
            <select value={idProfesional} onChange={(e) => setIdProfesional(e.target.value)} className={campo}>
              <option value="">Selecciona…</option>
              {profesionales.map((p) => (
                <option key={p.id_profesional} value={String(p.id_profesional)}>{p.nombreProfesional}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Observaciones del caso <span className="font-normal text-slate-400">opcional</span>
          </span>
          <textarea
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value.slice(0, 1500))}
            placeholder="Riesgos propios de este paciente, zona tratada, número de sesiones…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] text-slate-900 outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
          />
        </label>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={conRepresentante}
              onChange={(e) => setConRepresentante(e.target.checked)}
              className="h-5 w-5 rounded accent-[#007AFF]"
            />
            <span className="text-[14px] text-slate-700">Firma un representante legal (menor de edad o persona representada)</span>
          </label>
          {conRepresentante ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={representante.nombre}
                onChange={(e) => setRepresentante((r) => ({ ...r, nombre: e.target.value }))}
                placeholder="Nombre del representante"
                className={campo}
              />
              <input
                value={representante.documento}
                onChange={(e) => setRepresentante((r) => ({ ...r, documento: e.target.value }))}
                placeholder="RUT del representante"
                className={campo}
              />
            </div>
          ) : null}
        </div>

        {anexo ? (
          <div className="rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setVerTexto((v) => !v)}
              aria-expanded={verTexto}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium text-[#007AFF]"
            >
              {verTexto ? "Ocultar texto del consentimiento" : "Revisar texto del consentimiento"}
              <span className="text-[12px] text-slate-400">
                base v{PLANTILLA_BASE.version} · anexo v{anexo.version}
              </span>
            </button>
            {verTexto ? (
              <div className="max-h-80 overflow-y-auto border-t border-slate-100 px-4 py-3 text-[13px] leading-relaxed text-slate-700">
                {bloquesDeTexto(texto).map((b, i) =>
                  b.tipo === "titulo" ? (
                    <h3 key={i} className="mb-1.5 mt-4 font-semibold text-slate-900 first:mt-0">{b.texto}</h3>
                  ) : b.tipo === "subtitulo" ? (
                    <h4 key={i} className="mb-1 mt-2.5 font-semibold text-slate-800">{b.texto}</h4>
                  ) : b.tipo === "lista" ? (
                    <ul key={i} className="mb-2 list-disc space-y-1 pl-5 marker:text-slate-300">
                      {b.items.map((it, j) => <li key={j}>{it}</li>)}
                    </ul>
                  ) : (
                    <p key={i} className="mb-2 text-justify hyphens-auto" lang="es">{b.texto}</p>
                  )
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {FIRMA_HABILITADA ? (
          <EmisionDocumento
            tipoDocumento="consentimiento_informado"
            titulo={anexo ? `Consentimiento informado · ${anexo.nombre}` : "Consentimiento informado"}
            requiereAceptacionPaciente
            paciente={{
              id_paciente: paciente?.id_paciente,
              // Si firma un representante, la aceptación por código queda a su nombre.
              nombre: datosPaciente.representante?.nombre || datosPaciente.nombre,
              documento: datosPaciente.representante?.documento || datosPaciente.documento,
              correo: paciente?.correo,
              telefono: paciente?.telefono,
            }}
            profesional={profesional}
            generarCuerpoPdf={generar}
            metadatos={{
              plantillas,
              resumen: anexo ? `Consentimiento v${PLANTILLA_BASE.version} · plantilla base + anexo ${anexo.nombre.toLowerCase()}` : "",
              texto_renderizado: texto,
            }}
            nombreArchivo={`consentimiento-${anexo?.codigo?.replace("anexo_", "") || "procedimiento"}`}
            deshabilitado={Boolean(falta) || plantillas.length === 0}
            motivoDeshabilitado={falta}
          />
        ) : (
          <ImpresionManuscrita
            generarPdf={async () => (await generar({ modo: "manuscrita", borrador: false })).blob}
            deshabilitado={Boolean(falta)}
            etiqueta="Imprimir para firmar"
            titulo="Consentimiento informado"
            nota={falta || "El paciente (o su representante) y el profesional firman de puño y letra."}
          />
        )}
      </div>
    </section>
  );
}
