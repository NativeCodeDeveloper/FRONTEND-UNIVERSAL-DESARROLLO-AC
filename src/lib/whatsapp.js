/* Abrir WhatsApp con un mensaje ya escrito (wa.me). Sale desde el WhatsApp abierto en
 * el equipo de quien hace clic (su celular o WhatsApp Web): no usa plantillas de Meta
 * ni el número de la clínica, y el envío final lo confirma esa persona. */

// Normaliza a formato E.164 chileno (56 + 9 dígitos) para wa.me. Muchos teléfonos
// quedaron guardados en formato local ("987485226", sin el código de país) porque
// no todos los flujos de ingreso usan PhoneInput.jsx (que sí fuerza el prefijo
// +569); wa.me rechaza el número si falta el código de país, mostrando "El número
// de teléfono +987485226 no existe en WhatsApp" en vez de abrir la conversación.
export function telefonoParaWhatsapp(telefono) {
    const digits = String(telefono ?? "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("56")) return digits; // ya viene con código de país
    // 11+ dígitos sin empezar con "56": probablemente ya es un número internacional
    // válido de otro país (paciente extranjero) — no anteponer "56" y dejarlo mal.
    if (digits.length >= 11) return digits;
    if (digits.startsWith("9") && digits.length === 9) return `56${digits}`; // móvil chileno sin código de país
    if (digits.length === 8) return `569${digits}`; // móvil chileno sin el 9 inicial ni código de país
    return `56${digits}`; // fallback: asumir chileno y anteponer código de país
}

/** "https://wa.me/56912345678?text=…", o "" si no hay teléfono. */
export function urlWhatsapp(telefono, texto) {
    const numero = telefonoParaWhatsapp(telefono);
    return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : "";
}
