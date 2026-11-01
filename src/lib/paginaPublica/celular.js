/*
 * Celular chileno en la reserva pública.
 *
 * El campo muestra "+56" fijo y el paciente escribe desde el 9, que es como lo
 * dice todo el mundo: "9 1234 5678". Antes el prefijo era "+56 9" y el campo
 * cortaba en 8 dígitos, así que quien partía con el 9 perdía el último número.
 *
 * Se aceptan también los formatos pegados desde otro lado (+56 9 1234 5678,
 * 56912345678): se descarta el 56 del país y quedan los 9 dígitos del móvil.
 */

export const DIGITOS_CELULAR = 9;

/* Solo los dígitos del móvil, como mucho 9: "+56 9 1234-5678" → "912345678" */
export function limpiarCelular(valor) {
  let digitos = String(valor ?? "").replace(/\D/g, "");
  if (digitos.startsWith("56") && digitos.length > DIGITOS_CELULAR) digitos = digitos.slice(2);
  return digitos.slice(0, DIGITOS_CELULAR);
}

/* Para mostrar mientras se escribe: "912345678" → "9 1234 5678" */
export function formatearCelular(valor) {
  const d = limpiarCelular(valor);
  return [d.slice(0, 1), d.slice(1, 5), d.slice(5)].filter(Boolean).join(" ");
}

/* Mensaje de error o "" si está bien */
export function errorCelular(valor) {
  const d = limpiarCelular(valor);
  if (!d.startsWith("9")) return d ? "El celular empieza con 9" : "Ingresa tu celular";
  if (d.length !== DIGITOS_CELULAR) return "Ingresa los 9 dígitos de tu celular, desde el 9";
  return "";
}

/* Lo que espera el backend: "+56912345678" */
export function celularParaBackend(valor) {
  return `+56${limpiarCelular(valor)}`;
}
