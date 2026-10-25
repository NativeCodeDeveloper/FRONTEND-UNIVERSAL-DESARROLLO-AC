/* Documento de identidad: RUT chileno (módulo 11) y pasaporte.
 *
 * Fuente única para toda la plataforma. Antes el dígito verificador solo se
 * revisaba en la reserva pública (lib/paginaPublica/rut.js) y el dashboard
 * aceptaba cualquier RUT con el largo correcto: "12.345.678-0" pasaba igual
 * que el real. lib/paginaPublica/rut.js ahora re-exporta desde aquí.
 *
 * Los pacientes extranjeros se registran con pasaporte, que no tiene dígito
 * verificador: por eso la validación depende del tipo de documento.
 */

export const TIPOS_DOCUMENTO = { RUT: "rut", PASAPORTE: "pasaporte" };

export function limpiarRut(valor) {
  return String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
}

export function formatearRut(valor) {
  const limpio = limpiarRut(valor).slice(0, 9);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

/** Dígito verificador esperado para un cuerpo de RUT ("12345678" → "5"). */
export function calcularDv(cuerpo) {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
}

/** Cuerpo de 7 u 8 dígitos + dígito verificador correcto. */
export function rutValido(valor) {
  const limpio = limpiarRut(valor);
  if (limpio.length < 8 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  if (!/^\d+$/.test(cuerpo)) return false;
  return limpio.slice(-1) === calcularDv(cuerpo);
}

export function limpiarPasaporte(valor) {
  return String(valor ?? "").replace(/[^0-9a-zA-Z]/g, "").toUpperCase().slice(0, 20);
}

export function pasaporteValido(valor) {
  return /^[0-9A-Z]{5,20}$/.test(limpiarPasaporte(valor));
}

/** "" si es válido; si no, el mensaje para mostrar bajo el campo. */
export function validarDocumento({ tipo = TIPOS_DOCUMENTO.RUT, valor }) {
  if (tipo === TIPOS_DOCUMENTO.PASAPORTE) {
    if (!limpiarPasaporte(valor)) return "Ingresa el número de pasaporte.";
    return pasaporteValido(valor) ? "" : "El pasaporte debe tener entre 5 y 20 letras o números.";
  }
  const limpio = limpiarRut(valor);
  if (!limpio) return "Ingresa el RUT.";
  if (limpio.length < 8) return `Faltan ${8 - limpio.length} carácter(es): el RUT tiene 8 o 9 en total.`;
  return rutValido(limpio) ? "" : "El RUT no es válido (revisa el dígito verificador).";
}
