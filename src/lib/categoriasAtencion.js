/*
 * Categorías de atención (Odontología, Psicología, Kinesiología…).
 *
 * Cada profesional lleva UNA categoría en el campo `categoriaProfesional`, que se
 * escribe al crearlo o editarlo en el dashboard. La reserva pública arma la lista de
 * categorías a partir de los profesionales que ya trae
 * /profesionales/seleccionarTodosProfesionales: no hace falta otro endpoint.
 *
 * Es texto libre (cada centro usa las suyas), así que dos escrituras de la misma
 * categoría ("Odontología", " odontologia ") se agrupan por su clave: sin tildes,
 * minúsculas y espacios simples.
 *
 * Mientras el backend no guarde el campo, ningún profesional trae categoría y la
 * reserva muestra la grilla directa, como antes. Ver docs/firma/04, Fase B.
 */

export const CAMPO_CATEGORIA = "categoriaProfesional";
export const CATEGORIA_MAX_LARGO = 60;

/* Sugerencias para el dashboard; el centro puede escribir cualquier otra */
export const CATEGORIAS_SUGERIDAS = [
  "Medicina general",
  "Odontología",
  "Psicología",
  "Psiquiatría",
  "Kinesiología",
  "Nutrición",
  "Fonoaudiología",
  "Matronería",
  "Ginecología",
  "Pediatría",
  "Terapia ocupacional",
  "Enfermería",
  "Dermatología",
  "Traumatología",
];

/* Texto listo para guardar: sin saltos de línea, espacios simples y con tope de largo */
export function normalizarCategoria(texto) {
  return String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CATEGORIA_MAX_LARGO);
}

/* Clave para agrupar y para la URL: "Odontología" → "odontologia" */
export function claveCategoria(texto) {
  return normalizarCategoria(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoriaDe(profesional) {
  return normalizarCategoria(profesional?.[CAMPO_CATEGORIA]);
}

/*
 * Categorías presentes en una lista de profesionales, ordenadas alfabéticamente:
 * [{ clave, nombre, cantidad }]. El nombre que se muestra es el más usado entre
 * las escrituras de la misma categoría (a igual uso, el primero que aparece).
 */
export function agruparCategorias(profesionales) {
  const grupos = new Map();

  for (const profesional of Array.isArray(profesionales) ? profesionales : []) {
    const nombre = categoriaDe(profesional);
    const clave = claveCategoria(nombre);
    if (!clave) continue;

    const grupo = grupos.get(clave) ?? { clave, cantidad: 0, escrituras: new Map() };
    grupo.cantidad += 1;
    grupo.escrituras.set(nombre, (grupo.escrituras.get(nombre) ?? 0) + 1);
    grupos.set(clave, grupo);
  }

  return [...grupos.values()]
    .map(({ clave, cantidad, escrituras }) => {
      let nombre = "";
      let usos = 0;
      for (const [escritura, n] of escrituras) {
        if (n > usos) {
          nombre = escritura;
          usos = n;
        }
      }
      return { clave, nombre, cantidad };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/* Profesionales de una categoría; sin clave devuelve la lista completa */
export function filtrarPorCategoria(profesionales, clave) {
  const lista = Array.isArray(profesionales) ? profesionales : [];
  if (!clave) return lista;
  return lista.filter((p) => claveCategoria(categoriaDe(p)) === clave);
}

/* Sugerencias del dashboard: las que ya usa el centro primero, luego las comunes que falten */
export function sugerenciasCategoria(profesionales) {
  const propias = agruparCategorias(profesionales).map((c) => c.nombre);
  const usadas = new Set(propias.map(claveCategoria));
  return [...propias, ...CATEGORIAS_SUGERIDAS.filter((c) => !usadas.has(claveCategoria(c)))];
}
