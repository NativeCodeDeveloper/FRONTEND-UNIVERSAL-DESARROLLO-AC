/*
 * Lectura de los datos de la página pública del centro. Se ejecuta en el servidor
 * (layouts y páginas de app/(paginaPublica)), así el HTML llega con el contenido ya puesto.
 *
 * Cada función devuelve un valor seguro si el endpoint falla, tarda demasiado o todavía no
 * existe (por ejemplo categoriasProfesionales): la sección correspondiente simplemente no se
 * muestra y el resto de la página funciona igual.
 *
 * Sin caché: lo que el centro edita en el dashboard se ve en la siguiente visita.
 */

const API = process.env.NEXT_PUBLIC_API_URL;
const TIEMPO_MAXIMO_MS = 8000;

async function pedir(ruta, { metodo = "GET", cuerpo, respaldo }) {
  if (!API) return respaldo;
  try {
    const res = await fetch(`${API}${ruta}`, {
      method: metodo,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!res.ok) return respaldo;
    return await res.json();
  } catch (error) {
    console.error(`[paginaPublica] ${metodo} ${ruta}:`, error?.message ?? error);
    return respaldo;
  }
}

const comoLista = (valor) => (Array.isArray(valor) ? valor : []);

/* GET /datosempresa/seleccionartodos → primera fila (o {} si no hay datos) */
export async function obtenerDatosEmpresa() {
  const datos = await pedir("/datosempresa/seleccionartodos", { respaldo: null });
  const empresa = Array.isArray(datos) ? datos[0] : datos;
  return empresa && typeof empresa === "object" ? empresa : {};
}

/* GET /carruselPortada/seleccionarCarruselPortada → solo las portadas publicadas */
export async function obtenerPortadas() {
  const lista = comoLista(await pedir("/carruselPortada/seleccionarCarruselPortada", { respaldo: [] }));
  return lista.filter((p) => Number(p.estadoPublicacionPortada ?? 1) === 1);
}

/* GET /publicacionesTituloDetalle/seleccionarPublicacionesTituloDetalle (sección Servicios) */
export async function obtenerServicios() {
  return comoLista(await pedir("/publicacionesTituloDetalle/seleccionarPublicacionesTituloDetalle", { respaldo: [] }));
}

/* GET /publicaciones/seleccionarPublicaciones → solo las activas (estadoPublicacion distinto de 0) */
export async function obtenerPublicaciones() {
  const lista = comoLista(await pedir("/publicaciones/seleccionarPublicaciones", { respaldo: [] }));
  return lista.filter((p) => Number(p.estadoPublicacion ?? 1) !== 0);
}

/* GET /resenas/seleccionarTodas (activas, con nombre de paciente y profesional unidos) */
export async function obtenerResenas() {
  return comoLista(await pedir("/resenas/seleccionarTodas", { respaldo: [] }));
}

/* GET /profesionales/seleccionarTodosProfesionales */
export async function obtenerProfesionales() {
  return comoLista(await pedir("/profesionales/seleccionarTodosProfesionales", { respaldo: [] }));
}

/* POST /profesionales/seleccionarProfesional → el profesional o null */
export async function obtenerProfesional(id_profesional) {
  const lista = comoLista(await pedir("/profesionales/seleccionarProfesional", { metodo: "POST", cuerpo: { id_profesional }, respaldo: [] }));
  return lista[0] ?? null;
}

/* POST /tarifasProfesional/seleccionarTarifasPorProfesional → servicios con duración y precio */
export async function obtenerTarifas(id_profesional) {
  return comoLista(
    await pedir("/tarifasProfesional/seleccionarTarifasPorProfesional", {
      metodo: "POST",
      cuerpo: { profesional_id: id_profesional },
      respaldo: [],
    }),
  );
}

/*
 * Precio "desde" de cada profesional, para las tarjetas: { [id_profesional]: precioMinimo | null }.
 * Una consulta por profesional, en paralelo.
 */
export async function obtenerPreciosDesde(profesionales) {
  const pares = await Promise.all(
    profesionales.map(async (p) => {
      const tarifas = await obtenerTarifas(p.id_profesional);
      const precios = tarifas.map((t) => Number(t.precio)).filter((n) => Number.isFinite(n));
      return [p.id_profesional, precios.length ? Math.min(...precios) : null];
    }),
  );
  return Object.fromEntries(pares);
}

/*
 * GET /categoriasProfesionales/seleccionarCategorias (propuesta en PROPUESTA_CATEGORIAS_PROFESIONALES.md).
 * Mientras el endpoint no exista devuelve [] y el filtro de categorías no aparece.
 */
export async function obtenerCategorias() {
  return comoLista(await pedir("/categoriasProfesionales/seleccionarCategorias", { respaldo: [] }));
}

/*
 * GET /persistence/obtenerPersistencia → estado_pasarela.
 * true = cobra con Mercado Pago · false = agenda sin pago · null = no se pudo saber.
 */
export async function obtenerEstadoPasarela() {
  const datos = comoLista(await pedir("/persistence/obtenerPersistencia", { respaldo: [] }));
  const estado = datos[0]?.estado_pasarela;
  if (estado === 1) return true;
  if (estado === 0) return false;
  return null;
}
