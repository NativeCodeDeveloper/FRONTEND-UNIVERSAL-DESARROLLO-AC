/* Cliente HTTP de la firma electrónica (docs/firma/02-contrato-endpoints.md).
 *
 * Primer cliente centralizado del proyecto, acotado a esta integración: todos
 * sus endpoints exigen el token de Clerk, y repetir la cabecera y el manejo de
 * errores en cada componente es justo lo que hace que uno se olvide.
 *
 * Reglas:
 * - Siempre devuelve el JSON PARSEADO (o un Blob en los endpoints binarios).
 *   useReverification de Clerk inspecciona el cuerpo para detectar la señal de
 *   reverificación; si se le pasara el Response, no la vería.
 * - Nunca envía hashes, fechas ni IP: los fija el servidor.
 * - Con NEXT_PUBLIC_FIRMA_MOCK=1 responde con mockFirma.js (mismas formas).
 */

import { fetchConCarga } from "@/lib/fetchConCarga";
import { crearMockFirma } from "./mockFirma";

import { ErrorFirma } from "./errores";

export { ErrorFirma };

const BACKEND_FIRMA_LISTO = process.env.NEXT_PUBLIC_FIRMA_HABILITADA === "1";

/**
 * Modo de prueba (backend simulado): forzado con NEXT_PUBLIC_FIRMA_MOCK=1, o
 * automático en desarrollo mientras el backend de firma no esté habilitado, para
 * poder probar todo el flujo sin servidor. En producción nunca se activa solo.
 */
export const MODO_MOCK =
  process.env.NEXT_PUBLIC_FIRMA_MOCK === "1" ||
  (process.env.NODE_ENV !== "production" && !BACKEND_FIRMA_LISTO);

/** El panel de firma se muestra con el backend listo (NEXT_PUBLIC_FIRMA_HABILITADA=1) o en modo de prueba. Sin esto, en producción las pantallas conservan su flujo anterior. */
export const FIRMA_HABILITADA = MODO_MOCK || BACKEND_FIRMA_LISTO;

export function crearApiFirma(getToken) {
  if (MODO_MOCK) return crearMockFirma();

  const base = process.env.NEXT_PUBLIC_API_URL;

  async function cabeceras() {
    const token = await getToken();
    if (!token) throw new ErrorFirma("noAutorizado", 401);
    return { Authorization: `Bearer ${token}` };
  }

  // JSON → JSON. La señal de reverificación (403 + clerk_error) se devuelve tal
  // cual para que useReverification la detecte; cualquier otro error se lanza.
  async function json(ruta, cuerpo = {}) {
    const res = await fetchConCarga(`${base}${ruta}`, {
      method: "POST",
      mode: "cors",
      headers: { ...(await cabeceras()), Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    return interpretar(res);
  }

  // multipart → JSON (imágenes, PDF, certificados)
  async function formulario(ruta, formData) {
    const res = await fetchConCarga(`${base}${ruta}`, {
      method: "POST",
      mode: "cors",
      headers: { ...(await cabeceras()), Accept: "application/json" },
      body: formData,
    });
    return interpretar(res);
  }

  // JSON → Blob (PDF o PNG). Dos formas de respuesta del servidor:
  //  - { message:true, url, sha256 }: URL firmada de R2 (60 s). El archivo se baja
  //    directo desde Cloudflare, sin pasar por el backend (docs/firma/02 §6.4), y se
  //    comprueba que su SHA-256 sea el que informa el servidor.
  //  - El archivo directo (imagen de la firma, modo de prueba).
  async function binario(ruta, cuerpo = {}) {
    const res = await fetchConCarga(`${base}${ruta}`, {
      method: "POST",
      mode: "cors",
      headers: { ...(await cabeceras()), "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const tipo = res.headers.get("content-type") || "";
    if (res.ok && !tipo.includes("application/json")) return res.blob();

    const datos = await interpretar(res);
    if (!datos?.url) return datos;
    const archivo = await fetchConCarga(datos.url, { mode: "cors" });
    if (!archivo.ok) throw new ErrorFirma("serverError", archivo.status);
    const blob = await archivo.blob();
    if (datos.sha256 && (await sha256Blob(blob)) !== datos.sha256) {
      // El archivo recibido no es el que se firmó: no se muestra.
      throw new ErrorFirma("integridad", 409);
    }
    return blob;
  }

  async function sha256Blob(blob) {
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function interpretar(res) {
    const datos = await res.json().catch(() => null);
    if (datos?.clerk_error) return datos;
    if (!res.ok || datos?.message !== true) {
      throw new ErrorFirma(typeof datos?.message === "string" ? datos.message : "serverError", res.status);
    }
    return datos;
  }

  return {
    // Firma del profesional
    seleccionarEstadoFirma: (c) => json("/firmaProfesional/seleccionarEstadoFirma", c),
    seleccionarActaVigente: () => json("/firmaProfesional/seleccionarActaVigente"),
    registrarFirma: (fd) => formulario("/firmaProfesional/registrarFirma", fd),
    seleccionarImagenFirma: (c) => binario("/firmaProfesional/seleccionarImagenFirma", c),
    revocarFirma: (c) => json("/firmaProfesional/revocarFirma", c),

    // Registro Superintendencia de Salud
    actualizarRegistroSis: (fd) => formulario("/profesionales/actualizarRegistroSis", fd),
    verificarRegistroSis: (c) => json("/profesionales/verificarRegistroSis", c),
    descargarCertificadoSis: (c) => binario("/profesionales/descargarCertificadoSis", c),

    // Documentos
    prepararDocumento: (fd) => formulario("/documentos/prepararDocumento", fd),
    seleccionarBorrador: (c) => binario("/documentos/seleccionarBorrador", c),
    firmarDocumento: (c) => json("/documentos/firmarDocumento", c),
    descargarDocumento: (c) => binario("/documentos/descargarDocumento", c),
    enviarDocumentoCorreo: (c) => json("/documentos/enviarDocumentoCorreo", c),
    listarDocumentosPaciente: (c) => json("/documentos/listarDocumentosPaciente", c),
    listarPendientesFirma: () => json("/documentos/listarPendientesFirma"),
    anularDocumento: (c) => json("/documentos/anularDocumento", c),
    // Aceptación del paciente por código (consentimiento informado)
    solicitarOtpPaciente: (c) => json("/documentos/solicitarOtpPaciente", c),
    verificarOtpPaciente: (c) => json("/documentos/verificarOtpPaciente", c),

    // Consentimientos (dashboard)
    listarConsentimientosPaciente: (c) => json("/consentimientos/listarPorPaciente", c),
    descargarConsentimiento: (c) => binario("/consentimientos/descargarAceptacion", c),
    enviarConsentimientoCorreo: (c) => json("/consentimientos/enviarAceptacionCorreo", c),
  };
}

/** true si la respuesta es la señal de reverificación de Clerk (la maneja useReverification). */
export function esSenalReverificacion(datos) {
  return Boolean(datos?.clerk_error);
}
