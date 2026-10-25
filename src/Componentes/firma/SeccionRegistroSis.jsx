"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";
import { useApiFirma } from "@/hooks/useApiFirma";
import {
  LIMITE_CERTIFICADO_BYTES,
  TIPOS_CERTIFICADO,
  URL_RNPI,
  mensajeError,
} from "@/lib/firma/constantes";
import { formatearInstanteConOffset } from "@/lib/fechas";

function pesoLegible(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * N° de inscripción en el Registro Nacional de Prestadores Individuales (RNPI)
 * de la Superintendencia de Salud. Opcional: no todas las profesiones de una
 * clínica están en el registro, y exigirlo siempre lleva a inventar números.
 *
 * Sin scraping ni consultas automáticas: la Superintendencia no tiene API
 * pública. La verificación la hace un administrador a mano contra el RNPI.
 */
export default function SeccionRegistroSis({ idProfesional, registro, puedeEditar, esAdministrador, onRegistroCambiado }) {
  const api = useApiFirma();
  const archivoRef = useRef(null);

  const [numero, setNumero] = useState(registro?.numero || "");
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");

  const sinCambios = (numero || "") === (registro?.numero || "") && !certificado;

  function elegirArchivo(archivo) {
    setError("");
    if (!archivo) return;
    if (!TIPOS_CERTIFICADO.includes(archivo.type) || archivo.size > LIMITE_CERTIFICADO_BYTES) {
      setError(mensajeError("archivoInvalido"));
      return;
    }
    setCertificado(archivo);
  }

  async function guardar() {
    if (numero && !/^\d{1,10}$/.test(numero)) {
      setError("El número de registro tiene solo dígitos (hasta 10).");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("id_profesional", String(idProfesional));
      formData.append("registro_sis_numero", numero);
      if (certificado) formData.append("certificado", certificado, certificado.name);
      const respuesta = await api.actualizarRegistroSis(formData);
      setCertificado(null);
      if (archivoRef.current) archivoRef.current.value = "";
      toast.success("Registro de la Superintendencia guardado.");
      onRegistroCambiado?.(respuesta.registroSis);
    } catch (e) {
      setError(mensajeError(e?.codigo));
    } finally {
      setGuardando(false);
    }
  }

  async function decidir(decision) {
    if (decision === "rechazado" && !motivo.trim()) {
      setError("Indica el motivo del rechazo.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const respuesta = await api.verificarRegistroSis({
        id_profesional: idProfesional,
        decision,
        ...(decision === "rechazado" ? { motivo: motivo.trim() } : {}),
      });
      setRechazando(false);
      setMotivo("");
      toast.success(decision === "verificado" ? "Registro marcado como verificado." : "Registro rechazado.");
      onRegistroCambiado?.(respuesta.registroSis);
    } catch (e) {
      setError(mensajeError(e?.codigo));
    } finally {
      setGuardando(false);
    }
  }

  const estado = registro?.estado || "no_informado";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-1.5">
          <label htmlFor="pr-registro-sis" className="block text-[13px] font-medium text-slate-700">
            N° de registro
          </label>
          <ShadcnInput
            id="pr-registro-sis"
            value={numero}
            inputMode="numeric"
            placeholder="Ej: 438291"
            disabled={!puedeEditar || guardando}
            maxLength={10}
            onChange={(e) => {
              setNumero(e.target.value.replace(/\D/g, "").slice(0, 10));
              setError("");
            }}
            className="h-11 rounded-xl border-slate-200 placeholder:text-slate-400 focus:border-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-slate-700">Certificado de inscripción</span>
          <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2">
            {certificado ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">{certificado.name}</span>
                <span className="text-[11px] text-slate-400">{pesoLegible(certificado.size)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCertificado(null);
                    if (archivoRef.current) archivoRef.current.value = "";
                  }}
                  className="text-[12px] font-medium text-[#D70015] hover:underline"
                >
                  Quitar
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 text-[12px] text-slate-400">
                  {registro?.tiene_certificado ? "Certificado adjunto" : "PDF, JPG o PNG · hasta 5 MB"}
                </span>
                <button
                  type="button"
                  disabled={!puedeEditar || guardando}
                  onClick={() => archivoRef.current?.click()}
                  className="h-8 rounded-lg bg-slate-100 px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  {registro?.tiene_certificado ? "Reemplazar" : "Adjuntar"}
                </button>
              </>
            )}
            <input
              ref={archivoRef}
              type="file"
              accept={TIPOS_CERTIFICADO.join(",")}
              className="hidden"
              onChange={(e) => elegirArchivo(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      <p className="text-[12px] text-slate-500">
        Verificable en{" "}
        <a href={URL_RNPI} target="_blank" rel="noopener noreferrer" className="font-medium text-[#007AFF] hover:text-[#0062CC]">
          rnpi.superdesalud.gob.cl
        </a>
        . Adjuntar el certificado permite marcarlo como verificado. Si la profesión no está en el registro, déjalo en blanco.
      </p>

      {estado === "verificado" && registro?.verificado_at ? (
        <p className="rounded-xl bg-[#34C759]/15 px-3 py-2 text-[12px] text-[#248A3D]">
          Verificado por {registro.verificado_por || "un administrador"} el {formatearInstanteConOffset(registro.verificado_at)}.
        </p>
      ) : null}
      {estado === "rechazado" ? (
        <p className="rounded-xl bg-[#FF3B30]/10 px-3 py-2 text-[12px] text-[#D70015]">
          Rechazado{registro?.motivo_rechazo ? `: ${registro.motivo_rechazo}` : ""}. Corrige el número para volver a declararlo.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-[12px] font-medium text-[#FF3B30]">
          {error}
        </p>
      ) : null}

      {puedeEditar ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || sinCambios}
            className="h-10 rounded-xl bg-black px-5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar registro"}
          </button>
        </div>
      ) : null}

      {esAdministrador && registro?.numero && estado !== "verificado" && sinCambios ? (
        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <p className="text-[12px] text-slate-600">
            Revisa el número en el RNPI con el RUT del profesional y deja constancia del resultado.
          </p>
          {rechazando ? (
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
              placeholder="Motivo del rechazo (obligatorio)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-slate-900"
            />
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {rechazando ? (
              <>
                <button type="button" onClick={() => setRechazando(false)} disabled={guardando} className="h-10 rounded-xl px-4 text-[13px] font-medium text-slate-500 hover:bg-slate-100">
                  Cancelar
                </button>
                <button type="button" onClick={() => decidir("rechazado")} disabled={guardando} className="h-10 rounded-xl bg-[#FF3B30] px-4 text-[13px] font-semibold text-white hover:bg-[#E0352B] disabled:opacity-60">
                  Confirmar rechazo
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setRechazando(true)} disabled={guardando} className="h-10 rounded-xl px-4 text-[13px] font-medium text-[#D70015] hover:bg-[#FF3B30]/10">
                  Rechazar
                </button>
                <button type="button" onClick={() => decidir("verificado")} disabled={guardando} className="h-10 rounded-xl bg-[#34C759] px-4 text-[13px] font-semibold text-white hover:bg-[#2DB24F] disabled:opacity-60">
                  Marcar verificado
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
