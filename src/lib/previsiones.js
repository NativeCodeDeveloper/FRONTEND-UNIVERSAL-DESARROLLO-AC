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

/*
 * "nombre" es el valor que se guarda (prevision de la reserva) y se muestra en el
 * dashboard; "etiqueta" es como se le muestra al paciente en la pagina publica.
 * Al agregar una prevision aqui, agregarla tambien en el backend
 * (services/camposReserva.js, PREVISIONES_PERMITIDAS) o la reserva se rechaza.
 */
const PREVISIONES = [
  { id: 1, nombre: "FONASA", etiqueta: "Fonasa" },
  { id: 2, nombre: "ISAPRE", etiqueta: "Isapre" },
  { id: 3, nombre: "CONVENIO", etiqueta: "Convenio" },
  { id: 4, nombre: "SIN PREVISION", etiqueta: "Sin previsión" },
  { id: 5, nombre: "CAPREDENA", etiqueta: "Capredena" },
  { id: 6, nombre: "DIPRECA", etiqueta: "Dipreca" },
  { id: 7, nombre: "PARTICULAR", etiqueta: "Particular" },
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
