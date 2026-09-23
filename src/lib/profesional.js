/**
 * profesional.js
 * Vinculo entre un profesional registrado y los formularios/documentos que lo citan.
 *
 * Los documentos clinicos (recetas, examenes, presupuestos) pedian el RUT del
 * profesional escrito a mano en cada emision, aunque el dato ya venia en
 * /profesionales/seleccionarTodosProfesionales. Esto resuelve la relacion en los
 * dos sentidos para que nadie reescriba lo que el sistema ya sabe:
 *   - elegir un profesional completa su RUT
 *   - escribir un RUT reconocido selecciona al profesional
 */

import { cleanRut, formatRut } from "@/lib/designTokens";

/** Profesional cuyo id coincide; null si no esta en la lista. */
export function profesionalPorId(profesionales, id_profesional) {
  if (!Array.isArray(profesionales) || !id_profesional) return null;

  return (
    profesionales.find((p) => String(p.id_profesional) === String(id_profesional)) || null
  );
}

/** Profesional cuyo RUT coincide, ignorando puntos y guion; null si no calza. */
export function profesionalPorRut(profesionales, rut) {
  if (!Array.isArray(profesionales)) return null;

  const buscado = cleanRut(rut);
  if (!buscado) return null;

  return profesionales.find((p) => cleanRut(p.rutProfesional) === buscado) || null;
}

/**
 * Datos del profesional listos para imprimir en un documento.
 * Se devuelve el RUT formateado porque el backend lo guarda sin puntos ni guion.
 */
export function datosProfesionalParaDocumento(profesional) {
  if (!profesional) {
    return { nombre: "", rut: "", rutEtiquetado: "", especialidad: "" };
  }

  const rut = formatRut(profesional.rutProfesional) || profesional.rutProfesional || "";

  return {
    nombre: (profesional.nombreProfesional || "").trim(),
    rut,
    // Etiqueta lista para el pie de firma; vacia si el profesional no tiene RUT,
    // para no imprimir un "RUT:" suelto.
    rutEtiquetado: rut ? `RUT: ${rut}` : "",
    especialidad: (profesional.descripcionProfesional || profesional.especialidad || "").trim(),
  };
}

/** RUT formateado de un profesional, o "" si no lo tiene. */
export function rutDeProfesional(profesional) {
  return datosProfesionalParaDocumento(profesional).rut;
}

/**
 * Texto con el que un profesional queda identificado dentro de un campo libre,
 * como el "Profesional a cargo" de la ficha clinica: ahi el backend solo guarda
 * una cadena, asi que el RUT tiene que viajar dentro de ella.
 */
export function etiquetaProfesionalConRut(profesional) {
  const { nombre, rut } = datosProfesionalParaDocumento(profesional);

  if (!nombre) return "";

  return rut ? `${nombre} · RUT: ${rut}` : nombre;
}

/**
 * Inverso de etiquetaProfesionalConRut: separa un texto guardado como
 * "Nombre · RUT: 12.345.678-9" en sus dos partes.
 *
 * Hace falta porque la ficha clinica guarda al profesional como texto libre en
 * un solo campo del backend. Al imprimirlo tal cual en un PDF, el "RUT:" queda
 * pegado al nombre y, si el bloque es angosto, la linea se parte en medio de la
 * etiqueta ("... · RUT:" arriba y el numero abajo).
 *
 * Tolera tanto "· RUT: 123" como "· RUT 123" y textos sin RUT, y NO cambia el
 * formato guardado: solo lo interpreta al momento de dibujar, asi que las
 * fichas antiguas se ven igual de bien que las nuevas.
 *
 * @param {string} texto
 * @returns {{nombre: string, rut: string}}
 */
export function separarNombreYRut(texto) {
  const limpio = String(texto ?? "").trim();
  if (!limpio) return { nombre: "", rut: "" };

  const coincidencia = limpio.match(/^(.*?)\s*[·|-]\s*RUT:?\s*(.+)$/i);
  if (!coincidencia) return { nombre: limpio, rut: "" };

  return {
    nombre: coincidencia[1].trim(),
    rut: coincidencia[2].trim(),
  };
}

/**
 * Profesional cuyo nombre coincide, ignorando mayusculas y espacios sobrantes.
 * Se usa cuando un documento guardo el nombre del profesional como texto y no su
 * id: permite recuperar el RUT para la firma. Devuelve null si no calza exacto,
 * para no atribuir un RUT al profesional equivocado.
 */
export function profesionalPorNombre(profesionales, nombre) {
  if (!Array.isArray(profesionales) || !nombre) return null;

  const normalizar = (texto) =>
    String(texto)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const buscado = normalizar(nombre);
  if (!buscado) return null;

  return profesionales.find((p) => normalizar(p.nombreProfesional) === buscado) || null;
}
