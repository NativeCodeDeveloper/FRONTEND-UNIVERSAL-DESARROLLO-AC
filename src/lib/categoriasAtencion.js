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
 * Backend: columna profesionales.categoriaProfesional (VARCHAR 60, NULL), validada en
 * services/categoriaProfesional.js con los mismos caracteres que errorCategoria().
 * Con menos de dos categorías distintas la reserva muestra la grilla directa.
 */

export const CAMPO_CATEGORIA = "categoriaProfesional";
export const CATEGORIA_MAX_LARGO = 60;

/*
 * Sugerencias para el dashboard, con los nombres que se usan en Chile (Superintendencia
 * de Salud, FONASA, isapres y la forma en que los pacientes las buscan). Cubren centros
 * médicos, dentales, de salud mental, rehabilitación, estética, laboratorio e imágenes.
 * El centro puede escribir cualquier otra; se ordenan alfabéticamente al mostrarlas.
 */
export const CATEGORIAS_SUGERIDAS = [
  // Medicina
  "Medicina general",
  "Medicina familiar",
  "Medicina interna",
  "Pediatría",
  "Ginecología y obstetricia",
  "Matrona",
  "Cardiología",
  "Broncopulmonar",
  "Endocrinología",
  "Diabetología",
  "Gastroenterología",
  "Nefrología",
  "Urología",
  "Neurología",
  "Neurología infantil",
  "Reumatología",
  "Dermatología",
  "Traumatología",
  "Otorrinolaringología",
  "Oftalmología",
  "Geriatría",
  "Hematología",
  "Infectología",
  "Inmunología y alergias",
  "Oncología",
  "Cirugía general",
  "Cirugía plástica",
  "Cirugía vascular",
  "Coloproctología",
  "Medicina deportiva",
  "Medicina del trabajo",
  "Medicina estética",
  "Fertilidad",
  "Sexología",
  // Odontología
  "Odontología general",
  "Ortodoncia",
  "Endodoncia",
  "Periodoncia",
  "Implantología",
  "Odontopediatría",
  "Rehabilitación oral",
  "Cirugía maxilofacial",
  "Estética dental",
  "Trastornos temporomandibulares",
  // Salud mental
  "Psicología",
  "Psicología infantojuvenil",
  "Psiquiatría",
  "Psiquiatría infantojuvenil",
  "Terapia de pareja y familia",
  "Psicopedagogía",
  // Rehabilitación y otras profesiones de la salud
  "Kinesiología",
  "Kinesiología respiratoria",
  "Kinesiología deportiva",
  "Kinesiología de piso pélvico",
  "Terapia ocupacional",
  "Fonoaudiología",
  "Nutrición y dietética",
  "Enfermería",
  "Técnico en enfermería (TENS)",
  "Podología",
  "Tecnología médica",
  "Optometría",
  "Masoterapia",
  "Acupuntura",
  "Quiropraxia",
  // Estética
  "Cosmetología",
  "Estética facial",
  "Estética corporal",
  "Depilación láser",
  // Apoyo diagnóstico y otros servicios
  "Laboratorio clínico",
  "Toma de muestras",
  "Toma de muestras a domicilio",
  "Imagenología",
  "Ecografía",
  "Radiología",
  "Vacunatorio",
  "Procedimientos de enfermería",
  "Atención domiciliaria",
];

/* Mismos caracteres que acepta el backend (services/categoriaProfesional.js) */
const CATEGORIA_PERMITIDA = /^[\p{L}\p{M}0-9 .,\-/()&+]+$/u;

/* Mensaje de error para el dashboard, o "" si sirve (vacío también sirve: es opcional) */
export function errorCategoria(texto) {
  const limpio = normalizarCategoria(texto);
  if (!limpio) return "";
  if (String(texto ?? "").replace(/\s+/g, " ").trim().length > CATEGORIA_MAX_LARGO) {
    return `Máximo ${CATEGORIA_MAX_LARGO} caracteres.`;
  }
  if (!CATEGORIA_PERMITIDA.test(limpio)) return "Usa solo letras, números y . , - / ( ) & +";
  return "";
}

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
  const comunes = CATEGORIAS_SUGERIDAS.filter((c) => !usadas.has(claveCategoria(c))).sort((a, b) => a.localeCompare(b, "es"));
  return [...propias, ...comunes];
}
