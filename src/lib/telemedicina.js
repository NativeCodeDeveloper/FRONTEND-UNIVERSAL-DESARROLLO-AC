/* Enlace y mensaje de la videoconsulta que el profesional envía al paciente.
 * Ley 21.719 (minimización): el mensaje no lleva motivo ni datos clínicos. */

/** Minutos que sirve cada enlace para entrar (lo valida el backend: services/telemedicina.js). */
export const MINUTOS_ENLACE = 15;

/** Enlace que abre el paciente: /telemedicina/<sala>?i=<invitación firmada>. */
export function enlaceSala(origen, nombreSala, invitacion) {
    const enlace = new URL(`/telemedicina/${encodeURIComponent(nombreSala)}`, origen);
    enlace.searchParams.set("i", invitacion);
    return enlace.toString();
}

/** Texto para WhatsApp. Solo el primer nombre del paciente. */
export function mensajeInvitacion({ nombrePaciente, nombreProfesional, nombreClinica, enlace }) {
    const nombre = String(nombrePaciente ?? "").trim().split(/\s+/)[0];
    const quien = [nombreProfesional?.trim(), nombreClinica?.trim() ? `de ${nombreClinica.trim()}` : ""].filter(Boolean).join(" ");
    return [
        `Hola${nombre ? ` ${nombre}` : ""}${quien ? `, soy ${quien}` : ""}.`,
        `Este es el enlace para tu videoconsulta: ${enlace}`,
        "",
        `Ábrelo desde tu celular o computador y permite el uso de la cámara y el micrófono. Tienes ${MINUTOS_ENLACE} minutos para entrar con este enlace.`,
    ].join("\n");
}
