/**
 * fichaPlantilla.js
 * Estructura de las plantillas de ficha clinica.
 *
 * El backend devuelve la plantilla aplanada: una fila por campo, repitiendo los
 * datos de la categoria y de la plantilla. Aqui se arma el arbol
 * plantilla > categorias > campos, y se resuelven la validacion de obligatorios y
 * el formato de envio, que antes vivian duplicados en NuevaFicha y EdicionFicha.
 */

/** Arma el arbol de la plantilla a partir de las filas planas del backend. */
export function transformarPlantilla(filas) {
  if (!Array.isArray(filas) || filas.length === 0) return null;

  const primera = filas[0];
  const categoriasMap = {};

  for (const fila of filas) {
    if (!fila.id_categoria) continue;

    if (!categoriasMap[fila.id_categoria]) {
      categoriasMap[fila.id_categoria] = {
        id_categoria: fila.id_categoria,
        nombre: fila.categoria_nombre,
        orden: fila.categoria_orden,
        campos: [],
      };
    }

    if (fila.id_campo) {
      categoriasMap[fila.id_categoria].campos.push({
        id_campo: fila.id_campo,
        nombre: fila.campo_nombre,
        requerido: fila.requerido,
        orden: fila.campo_orden,
      });
    }
  }

  const categorias = Object.values(categoriasMap).sort((a, b) => a.orden - b.orden);

  // Los campos tambien llegan desordenados dentro de cada categoria.
  for (const categoria of categorias) {
    categoria.campos.sort((a, b) => a.orden - b.orden);
  }

  return {
    id_plantilla: primera.id_plantilla,
    nombre: primera.plantilla_nombre,
    categorias,
  };
}

/** Nombres de los campos obligatorios que siguen vacios. */
export function camposObligatoriosFaltantes(plantilla, datos = {}) {
  if (!plantilla) return [];

  const faltantes = [];

  for (const categoria of plantilla.categorias) {
    for (const campo of categoria.campos) {
      if (campo.requerido === 1 && !String(datos[campo.id_campo] ?? "").trim()) {
        faltantes.push(campo.nombre);
      }
    }
  }

  return faltantes;
}

/**
 * Datos listos para enviar: cada valor viaja junto al nombre de su campo y
 * categoria, porque la ficha guardada debe poder leerse aunque la plantilla
 * cambie despues.
 */
export function enriquecerDatosFicha(plantilla, datos = {}) {
  if (!plantilla) return {};

  const enriquecidos = { _plantillaNombre: plantilla.nombre };

  for (const categoria of plantilla.categorias) {
    for (const campo of categoria.campos) {
      const valor = datos[campo.id_campo];
      if (!valor) continue;

      enriquecidos[campo.id_campo] = {
        valor,
        nombreCampo: campo.nombre,
        nombreCategoria: categoria.nombre,
        categoriaOrden: categoria.orden,
        campoOrden: campo.orden,
      };
    }
  }

  return enriquecidos;
}

/** Total de campos de la plantilla y cuantos llevan valor. */
export function progresoFicha(plantilla, datos = {}) {
  if (!plantilla) return { total: 0, completados: 0 };

  let total = 0;
  let completados = 0;

  for (const categoria of plantilla.categorias) {
    for (const campo of categoria.campos) {
      total += 1;
      if (String(datos[campo.id_campo] ?? "").trim()) completados += 1;
    }
  }

  return { total, completados };
}
