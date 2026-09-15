/**
 * previsiones.js
 * Fuente unica de las previsiones de salud.
 *
 * Antes cada vista repetia su propio if/else para convertir entre el nombre y el
 * prevision_id, con variaciones entre archivos. Al agregar una prevision nueva habia
 * que recordar los cinco lugares, y el que se olvidara mostraba "SIN DEFINIR".
 *
 * Los ids se envian tal cual al backend en el campo prevision_id.
 */

const PREVISIONES = [
  { id: 1, nombre: "FONASA" },
  { id: 2, nombre: "ISAPRE" },
  { id: 3, nombre: "CONVENIO" },
  { id: 4, nombre: "SIN PREVISION" },
  { id: 5, nombre: "CAPREDENA" },
  { id: 6, nombre: "DIPRECA" },
];

const NOMBRES_PREVISION = PREVISIONES.map((p) => p.nombre);

/** Nombre a mostrar para un prevision_id. Acepta number o string. */
function previsionDesdeId(id_prevision) {
  const id = Number(id_prevision);
  return PREVISIONES.find((p) => p.id === id)?.nombre ?? "SIN DEFINIR";
}

/**
 * prevision_id a partir del nombre. Devuelve null si no calza, para que quien llama
 * decida si es un error de validacion.
 *
 * Se compara por inclusion porque los formularios antiguos guardaban textos como
 * "ISAPRE CONSALUD", y "SIN PREVISION" se evalua primero para que no lo capture
 * la coincidencia de otra palabra.
 */
function previsionIdDesdeNombre(nombre) {
  if (!nombre) return null;

  const texto = String(nombre).toUpperCase();
  const exacta = PREVISIONES.find((p) => p.nombre === texto);

  if (exacta) return exacta.id;

  const porInclusion = [...PREVISIONES]
    .sort((a, b) => b.nombre.length - a.nombre.length)
    .find((p) => texto.includes(p.nombre));

  return porInclusion?.id ?? null;
}

export { PREVISIONES, NOMBRES_PREVISION, previsionDesdeId, previsionIdDesdeNombre };
