/**
 * camposReserva.js
 * Previsión y comentario de la reserva: lo que el front necesita saber de ellos.
 *
 * El backend guarda "No indicado" cuando la reserva viene sin previsión o sin
 * comentario (services/camposReserva.js del backend). Ese texto es un valor de
 * relleno, no algo que el usuario escribió: al editar se muestra el campo vacío
 * y en listados se pinta atenuado.
 */

const VALOR_NO_INDICADO = "No indicado";

// Mismo límite que la columna comentario VARCHAR(100) del backend.
const MAX_CARACTERES_COMENTARIO_RESERVA = 100;

function esNoIndicado(valor) {
  if (valor === null || valor === undefined) return true;
  const texto = String(valor).trim().toLowerCase();
  return texto === "" || texto === "no indicado" || texto === "no indicada";
}

/** Valor para precargar un input/select: "No indicado" se vuelve "". */
function valorEditableReserva(valor) {
  return esNoIndicado(valor) ? "" : String(valor);
}

export { VALOR_NO_INDICADO, MAX_CARACTERES_COMENTARIO_RESERVA, esNoIndicado, valorEditableReserva };
