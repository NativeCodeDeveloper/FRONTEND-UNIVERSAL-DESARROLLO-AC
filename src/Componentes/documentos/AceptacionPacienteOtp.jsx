"use client";

import { useEffect, useRef, useState } from "react";
import { MODO_MOCK } from "@/lib/firma/apiFirma";
import { mensajeError } from "@/lib/firma/constantes";
import { formatearInstanteConOffset } from "@/lib/fechas";

function enmascararCorreo(correo) {
  const [usuario, dominio] = String(correo || "").split("@");
  if (!usuario || !dominio) return "";
  return `${usuario[0]}${"•".repeat(Math.max(usuario.length - 2, 1))}${usuario.slice(-1)}@${dominio}`;
}

function enmascararTelefono(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");
  return digitos.length >= 4 ? `+56 9 •••• ${digitos.slice(-4)}` : "";
}

/**
 * Aceptación del consentimiento informado por el paciente, con un código de 6
 * dígitos (OTP) enviado al correo o teléfono QUE YA ESTÁ EN SU FICHA. No se puede
 * escribir otro destino: es lo que permite atribuir la aceptación al paciente
 * (una firma en tablet sin este código sería un dibujo anónimo).
 *
 * El código lo genera, envía y verifica el servidor; la aceptación queda en la
 * evidencia (otp_paciente_verificado) y se estampa en el PDF al firmar.
 */
export default function AceptacionPacienteOtp({ api, paciente, asegurarDocumento, aceptacion, onAceptado }) {
  const correo = enmascararCorreo(paciente?.correo);
  const telefono = enmascararTelefono(paciente?.telefono);
  const [canal, setCanal] = useState(telefono ? "sms" : "email");
  const [enviado, setEnviado] = useState(null); // { destino, expira_at, codigo_prueba? }
  const [codigo, setCodigo] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");
  const entradaRef = useRef(null);

  useEffect(() => {
    if (enviado) entradaRef.current?.focus();
  }, [enviado]);

  if (aceptacion) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-[#34C759]/12 px-4 py-3 text-[13px] text-[#1E7B34]">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#34C759] text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <span>
          <span className="font-semibold">El paciente aceptó.</span> Código verificado por {aceptacion.canal === "sms" ? "SMS" : "correo"} el{" "}
          {formatearInstanteConOffset(aceptacion.verificado_at)}.
        </span>
      </div>
    );
  }

  async function enviar() {
    setTrabajando(true);
    setError("");
    try {
      const documento = await asegurarDocumento();
      const r = await api.solicitarOtpPaciente({ id_documento: documento.id_documento, canal });
      setEnviado(r);
      setCodigo("");
    } catch (e) {
      setError(mensajeError(e?.codigo || e?.message));
    } finally {
      setTrabajando(false);
    }
  }

  async function verificar() {
    if (!/^\d{6}$/.test(codigo)) {
      setError("El código tiene 6 dígitos.");
      return;
    }
    setTrabajando(true);
    setError("");
    try {
      const documento = await asegurarDocumento();
      const r = await api.verificarOtpPaciente({ id_documento: documento.id_documento, codigo });
      onAceptado(r.aceptacion);
    } catch (e) {
      setError(mensajeError(e?.codigo));
    } finally {
      setTrabajando(false);
    }
  }

  const sinDatos = !correo && !telefono;

  return (
    <div className="space-y-3 rounded-2xl bg-[#F5F5F7] p-4">
      <div>
        <p className="text-[14px] font-semibold text-[#1D1D1F]">Aceptación del paciente</p>
        <p className="mt-0.5 text-[12px] leading-snug text-[#6E6E73]">
          El paciente recibe un código en el dato registrado en su ficha y lo ingresa para aceptar este consentimiento.
        </p>
      </div>

      {sinDatos ? (
        <p className="rounded-xl bg-[#FF3B30]/10 px-3 py-2 text-[12px] text-[#C4291D]">
          El paciente no tiene correo ni teléfono en su ficha. Actualízalos o imprime el consentimiento para firmar a mano.
        </p>
      ) : (
        <>
          <div role="radiogroup" aria-label="Enviar el código por" className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/[0.06]">
            {[
              ["sms", "SMS", telefono],
              ["email", "Correo", correo],
            ].map(([valor, etiqueta, destino]) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={canal === valor}
                disabled={!destino || trabajando}
                onClick={() => {
                  setCanal(valor);
                  setEnviado(null);
                  setError("");
                }}
                className={`h-8 rounded-full px-3.5 text-[12px] font-medium transition-all disabled:opacity-40 ${
                  canal === valor ? "bg-[#007AFF] text-white" : "text-[#6E6E73]"
                }`}
              >
                {etiqueta}
                {destino ? <span className="ml-1 hidden opacity-80 sm:inline">{destino}</span> : null}
              </button>
            ))}
          </div>

          {enviado ? (
            <div className="space-y-2">
              <p className="text-[12px] text-[#3A3A3C]">
                Código enviado a <span className="font-medium">{enviado.destino}</span>. Vence en 10 minutos.
              </p>
              {MODO_MOCK && enviado.codigo_prueba ? (
                <p className="rounded-lg bg-[#007AFF]/10 px-3 py-1.5 text-[12px] text-[#0062CC]">
                  Modo de prueba: el código es <span className="font-mono font-semibold tracking-widest">{enviado.codigo_prueba}</span>
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  ref={entradaRef}
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && verificar()}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-label="Código de 6 dígitos"
                  className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-center font-mono text-[20px] tracking-[0.4em] text-[#1D1D1F] outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15 sm:w-44"
                />
                <button
                  type="button"
                  onClick={verificar}
                  disabled={trabajando || codigo.length !== 6}
                  className="h-11 rounded-full bg-[#007AFF] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC] disabled:opacity-40"
                >
                  {trabajando ? "Verificando…" : "Verificar"}
                </button>
                <button type="button" onClick={enviar} disabled={trabajando} className="h-11 rounded-full px-4 text-[13px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10">
                  Reenviar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={enviar}
              disabled={trabajando}
              className="h-10 rounded-full bg-[#007AFF] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0062CC] disabled:opacity-40"
            >
              {trabajando ? "Enviando…" : "Enviar código al paciente"}
            </button>
          )}
        </>
      )}

      {error ? <p role="alert" className="text-[12px] font-medium text-[#C4291D]">{error}</p> : null}
    </div>
  );
}
