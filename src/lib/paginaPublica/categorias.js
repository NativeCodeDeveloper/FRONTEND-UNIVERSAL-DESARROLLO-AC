/*
 * Reglas de las categorías de profesionales en la página pública.
 * Datos: GET /categoriasProfesionales/seleccionarCategorias y el campo id_categoriaProfesional de cada
 * profesional (ambos propuestos; mientras no existan, estas funciones devuelven listas vacías).
 */

/* Categorías con al menos un profesional activo, ordenadas por ordenCategoria y luego por nombre */
export function categoriasConProfesionales(categorias, profesionales) {
  const conProfesionales = new Set(profesionales.map((p) => p.id_categoriaProfesional).filter((id) => id != null));
  return categorias
    .filter((c) => conProfesionales.has(c.id_categoriaProfesional))
    .sort((a, b) => (a.ordenCategoria ?? 0) - (b.ordenCategoria ?? 0) || String(a.nombreCategoria).localeCompare(String(b.nombreCategoria), "es"));
}

/*
 * Categorías del filtro de /agendaProfesionales: las que tienen profesionales y, si quedan
 * menos de dos, ninguna (no hay nada que filtrar).
 */
export function categoriasVisibles(categorias, profesionales) {
  const visibles = categoriasConProfesionales(categorias, profesionales);
  return visibles.length >= 2 ? visibles : [];
}
