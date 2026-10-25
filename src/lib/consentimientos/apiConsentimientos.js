/* Endpoints PÚBLICOS de consentimientos (sin token): la página de reserva los
 * usa antes de que exista una cuenta. Contrato: docs/firma/02 §7.
 *
 * La fecha, la hora y la IP de la aceptación las fija el servidor; el front
 * nunca las envía.
 *
 * Las casillas son obligatorias SIEMPRE (Ley 21.719, vigente desde el 1 de
 * diciembre de 2026), aunque la instancia todavía no tenga el backend de
 * consentimientos: en ese caso se muestran los textos de respaldo y la
 * aceptación no se registra en el servidor (token_aceptacion: null).
 *
 * Interruptor propio, independiente de la firma electrónica: los consentimientos
 * son la primera etapa del backend (docs/firma/04 Fase 2) y se activan solos con
 * NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1. Activar la firma también los activa. */

import { MODO_MOCK, FIRMA_HABILITADA } from "@/lib/firma/apiFirma";

/** El backend de /consentimientos está disponible en esta instancia. */
export const CONSENTIMIENTOS_EN_SERVIDOR =
  !MODO_MOCK && (process.env.NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS === "1" || FIRMA_HABILITADA);
import { PLANTILLAS_RESPALDO, esObligatorio } from "./textosLegales";

const API = process.env.NEXT_PUBLIC_API_URL;

async function sha256Texto(texto) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Plantillas vigentes: [{id_plantilla, codigo, version, titulo, cuerpo, sha256}] */
export async function seleccionarVigentes() {
  if (!CONSENTIMIENTOS_EN_SERVIDOR) {
    return Promise.all(
      PLANTILLAS_RESPALDO.map(async (p) => ({ ...p, id_plantilla: `mock-${p.codigo}`, sha256: await sha256Texto(p.cuerpo) }))
    );
  }
  const res = await fetch(`${API}/consentimientos/seleccionarVigentes`, { headers: { Accept: "application/json" }, cache: "no-store" });
  const datos = await res.json().catch(() => null);
  if (!res.ok || datos?.message !== true || !Array.isArray(datos.plantillas)) throw new Error(datos?.message || "serverError");
  return datos.plantillas;
}

/**
 * Registra las dos aceptaciones. Devuelve { token_aceptacion, codigo_verificacion }.
 * El token viaja luego con la reserva para vincularlas.
 */
export async function registrarAceptacion({ plantillas, paciente, id_profesional }) {
  const cuerpo = {
    // Solo se registran los textos con casilla (la política de privacidad).
    aceptaciones: plantillas.filter((p) => esObligatorio(p.codigo)).map((p) => ({ codigo: p.codigo, id_plantilla: p.id_plantilla, version: p.version, sha256: p.sha256 })),
    paciente,
    id_profesional,
  };
  if (!MODO_MOCK && !CONSENTIMIENTOS_EN_SERVIDOR) return { token_aceptacion: null, codigo_verificacion: null };
  if (MODO_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return { token_aceptacion: `ca_mock${Date.now().toString(16)}`, codigo_verificacion: "MOCK-0000" };
  }
  const res = await fetch(`${API}/consentimientos/registrarAceptacion`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await res.json().catch(() => null);
  if (!res.ok || datos?.message !== true) {
    const error = new Error(datos?.message || "serverError");
    error.codigo = datos?.message || "serverError";
    throw error;
  }
  return datos;
}
