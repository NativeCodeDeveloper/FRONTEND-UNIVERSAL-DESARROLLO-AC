/* Documento de identidad: RUT chileno (módulo 11), pasaporte o DNI.
 *
 * Fuente única para toda la plataforma. Antes el dígito verificador solo se
 * revisaba en la reserva pública (lib/paginaPublica/rut.js) y el dashboard
 * aceptaba cualquier RUT con el largo correcto: "12.345.678-0" pasaba igual
 * que el real. lib/paginaPublica/rut.js ahora re-exporta desde aquí.
 *
 * Los pacientes extranjeros se registran con pasaporte o DNI (cédula de su país),
 * que no tienen dígito verificador: por eso la validación depende del tipo. El DNI
 * no tiene una regla común entre países y se valida como el pasaporte (5 a 20 letras
 * o números). Misma regla en el backend (services/firma/rut.js).
 */

export const TIPOS_DOCUMENTO = { RUT: "rut", PASAPORTE: "pasaporte", DNI: "dni" };
export const ETIQUETAS_DOCUMENTO = { rut: "RUT", pasaporte: "Pasaporte", dni: "DNI" };

/** true para pasaporte y DNI (pacientes extranjeros). */
export function esDocumentoExtranjero(tipo) {
  return tipo === TIPOS_DOCUMENTO.PASAPORTE || tipo === TIPOS_DOCUMENTO.DNI;
}

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
  if (esDocumentoExtranjero(tipo)) {
    const nombre = tipo === TIPOS_DOCUMENTO.DNI ? "DNI" : "pasaporte";
    if (!limpiarPasaporte(valor)) return `Ingresa el número de ${nombre}.`;
    return pasaporteValido(valor) ? "" : `El ${nombre} debe tener entre 5 y 20 letras o números.`;
  }
  const limpio = limpiarRut(valor);
  if (!limpio) return "Ingresa el RUT.";
  if (limpio.length < 8) return `Faltan ${8 - limpio.length} carácter(es): el RUT tiene 8 o 9 en total.`;
  return rutValido(limpio) ? "" : "El RUT no es válido (revisa el dígito verificador).";
}

/**
 * Número para mostrar: el RUT con puntos y guion; pasaporte y DNI tal cual (limpios).
 * Sin tipo (registros antiguos) se trata como RUT, pero un valor con letras que no
 * puede ser RUT no se deforma ("AB1234567" no pasa a "123.456-7").
 */
export function formatearDocumento(valor, tipo = TIPOS_DOCUMENTO.RUT) {
  const texto = String(valor ?? "").trim();
  if (!texto) return "";
  if (esDocumentoExtranjero(tipo)) return limpiarPasaporte(texto);
  if (/[a-jl-z]/i.test(texto)) return texto;
  const limpio = limpiarRut(texto);
  return limpio.length < 2 ? texto : formatearRut(limpio);
}

/** "RUT 12.345.678-9", "Pasaporte AB1234567" o "DNI 30123456". */
export function textoDocumento(valor, tipo = TIPOS_DOCUMENTO.RUT) {
  const numero = formatearDocumento(valor, tipo);
  return numero ? `${ETIQUETAS_DOCUMENTO[esDocumentoExtranjero(tipo) ? tipo : TIPOS_DOCUMENTO.RUT]} ${numero}` : "";
}

/** Rótulo del campo: "RUT", "Pasaporte" o "DNI". */
export function etiquetaDocumento(tipo) {
  return ETIQUETAS_DOCUMENTO[esDocumentoExtranjero(tipo) ? tipo : TIPOS_DOCUMENTO.RUT];
}
