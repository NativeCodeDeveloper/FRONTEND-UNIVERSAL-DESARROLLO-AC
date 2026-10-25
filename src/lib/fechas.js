/**
 * fechas.js
 * Fechas "civiles": las que representan un dia del calendario (fecha de consulta,
 * nacimiento, vencimiento) y no un instante exacto.
 *
 * El backend las entrega como "2026-09-15T00:00:00.000Z". Interpretarlas con
 * `new Date(...)` y leer getDate() las corre un dia hacia atras en cualquier zona
 * con desfase negativo: en America/Santiago (UTC-3) esa cadena es el 14 a las
 * 21:00. Aqui se leen los componentes del texto, sin convertir zona.
 */

/** Partes {anio, mes, dia} de una fecha civil, o null si no se puede leer. */
export function partesFechaCivil(valor) {
  if (!valor) return null;

  const texto = String(valor);
  const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (coincidencia) {
    return {
      anio: Number(coincidencia[1]),
      mes: Number(coincidencia[2]),
      dia: Number(coincidencia[3]),
    };
  }

  // Valores sin forma ISO (Date, timestamp): se usan en hora local.
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;

  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, dia: fecha.getDate() };
}

/** "15-09-2026". Devuelve el texto alternativo si la fecha no es legible. */
export function formatearFechaCivil(valor, vacio = "-") {
  const p = partesFechaCivil(valor);
  if (!p) return vacio;

  return `${String(p.dia).padStart(2, "0")}-${String(p.mes).padStart(2, "0")}-${p.anio}`;
}

/** Clave ordenable "2026-09-15"; cadena vacia si no es legible. */
export function claveFechaCivil(valor) {
  const p = partesFechaCivil(valor);
  if (!p) return "";

  return `${p.anio}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`;
}

/** "Septiembre de 2026" para los encabezados de la linea de tiempo. */
export function mesYAnioCivil(valor) {
  const p = partesFechaCivil(valor);
  if (!p) return "Sin fecha";

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return `${meses[p.mes - 1]} de ${p.anio}`;
}

// ── Periodos civiles ────────────────────────────────────────────────────────
// Para filtrar por mes o por rango sin que un huso horario mueva las fechas.
// Todo se maneja como texto "AAAA-MM-DD" y "AAAA-MM": con ese formato la
// comparacion alfabetica (<, >) coincide con el orden cronologico, asi que no
// hace falta construir ningun Date para saber si una fecha cae en un rango.

/** Zona de la clinica. Las fechas del negocio se leen siempre desde aca. */
export const ZONA_CLINICA = "America/Santiago";

/**
 * "AAAA-MM-DD" del dia de hoy en la zona de la clinica.
 *
 * No se usa `new Date()` a secas porque eso da el dia segun el reloj del
 * equipo: un computador con la zona mal puesta, o alguien conectandose de
 * viaje, veria "el mes actual" corrido respecto a la clinica.
 */
export function hoyCivil(zona = ZONA_CLINICA) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/** "AAAA-MM" de una fecha civil; cadena vacia si no es legible. */
export function claveMesCivil(valor) {
  const p = partesFechaCivil(valor);
  if (!p) return "";

  return `${p.anio}-${String(p.mes).padStart(2, "0")}`;
}

/** Corre una clave de mes "AAAA-MM" n meses (negativo para ir hacia atras). */
export function desplazarMesCivil(claveMes, n) {
  const [anio, mes] = String(claveMes).split("-").map(Number);
  if (!anio || !mes) return "";

  // Se cuenta en meses absolutos desde el anio 0 para que el salto de diciembre
  // a enero salga solo, sin casos especiales.
  const total = anio * 12 + (mes - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Ultimo dia de un mes civil (28-31). */
export function ultimoDiaMesCivil(claveMes) {
  const [anio, mes] = String(claveMes).split("-").map(Number);
  if (!anio || !mes) return 0;

  // Dia 0 del mes siguiente = ultimo del actual. En UTC a proposito: solo
  // interesa el numero del dia, y asi ninguna zona lo mueve.
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** { desde, hasta } en "AAAA-MM-DD" que cubre el mes completo. */
export function rangoMesCivil(claveMes) {
  const dias = ultimoDiaMesCivil(claveMes);
  if (!dias) return { desde: "", hasta: "" };

  return { desde: `${claveMes}-01`, hasta: `${claveMes}-${String(dias).padStart(2, "0")}` };
}

/** true si la fecha civil cae dentro del rango (ambos extremos incluidos). */
export function dentroDelRangoCivil(valor, desde, hasta) {
  const clave = claveFechaCivil(valor);
  if (!clave) return false;

  return (!desde || clave >= desde) && (!hasta || clave <= hasta);
}

/**
 * Edad en anios cumplidos a partir de una fecha de nacimiento civil.
 *
 * Vivia repetida en tres pantallas (ficha, recetas y cotizaciones) con tres
 * implementaciones distintas: dos leian el texto y una usaba `new Date`, que
 * corria el nacimiento un dia y devolvia un anio de mas en la vispera del
 * cumpleanios.
 *
 * El "hoy" tambien sale de la zona de la clinica, no del reloj del equipo: de
 * madrugada una maquina con otro huso podia adelantar o atrasar el cumpleanios.
 *
 * Devuelve `vacio` si la fecha no es legible, si es futura, o si es el
 * placeholder "1900-01-01" que el sistema escribe cuando se crea un paciente
 * sin fecha de nacimiento (antes se colaba como real y mostraba "126 anios").
 */
export function edadCivil(fechaNacimiento, vacio = "-") {
  const nacimiento = partesFechaCivil(fechaNacimiento);
  if (!nacimiento || nacimiento.anio <= 1901) return vacio;

  const hoy = partesFechaCivil(hoyCivil());
  if (!hoy) return vacio;

  let edad = hoy.anio - nacimiento.anio;

  // Todavia no llega el cumpleanios de este anio.
  if (hoy.mes < nacimiento.mes || (hoy.mes === nacimiento.mes && hoy.dia < nacimiento.dia)) {
    edad -= 1;
  }

  return edad < 0 ? vacio : edad;
}

/**
 * Formatea un valor que puede ser fecha civil O instante, cuando no se sabe
 * cual de los dos entrega el backend para ese campo.
 *
 * La diferencia importa: "2026-10-01T00:00:00.000Z" es el 1 de octubre (un dia
 * del calendario guardado como DATE), pero "2026-01-01T02:00:00.000Z" es un
 * instante que en Chile ocurrio el 31 de diciembre. Leer el primero con
 * `new Date` corre el dia; leer el segundo del texto tambien lo corre, en la
 * direccion contraria.
 *
 * Se distingue por la hora: medianoche exacta en UTC es, en la practica, una
 * columna DATE serializada. Un instante real (`created_at`, `fecha_subida`)
 * cae en esa milesima con probabilidad despreciable, y si ocurriera se
 * mostraria el dia UTC en vez del chileno — un dia de diferencia en un
 * registro entre millones, contra el error garantizado de no distinguir.
 *
 * Los instantes se muestran en la zona de la clinica, no en la del equipo.
 */
export function formatearFechaAuto(valor, vacio = "-") {
  if (!valor) return vacio;

  const texto = String(valor);
  const esMedianocheUTC = /T00:00:00(\.000)?Z$/.test(texto);

  if (esMedianocheUTC || !/T/.test(texto)) {
    return formatearFechaCivil(valor, vacio);
  }

  const instante = new Date(texto);
  if (Number.isNaN(instante.getTime())) return vacio;

  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_CLINICA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);

  const v = (tipo) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${v("day")}-${v("month")}-${v("year")}`;
}

// ── Instantes con desfase explícito ─────────────────────────────────────────
// Para marcas de tiempo con valor probatorio (firma electrónica, aceptación de
// consentimientos): se muestran con segundos y con el desfase de Chile a la
// vista, para que nadie tenga que adivinar si es horario de verano o invierno.

/**
 * Desfase de la zona en ese instante: "UTC-03:00" en verano, "UTC-04:00" en
 * invierno. Lo calcula Intl con las reglas de la zona; nunca se escribe a mano.
 */
export function desfaseZona(instante, zona = ZONA_CLINICA) {
  const nombre = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "longOffset" })
    .formatToParts(instante)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // "GMT" a secas significa desfase cero.
  return nombre === "GMT" ? "UTC+00:00" : nombre.replace("GMT", "UTC");
}

/**
 * Instante del backend (ISO UTC) → "22-10-2026 22:25:57 (UTC-03:00)", en la
 * zona de la clínica. Da lo mismo la zona del equipo que lo muestra.
 */
export function formatearInstanteConOffset(valor, vacio = "-") {
  if (!valor) return vacio;
  // fecha-ok: es un instante real (firmado_at, aceptado_at), no un día del calendario.
  const instante = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(instante.getTime())) return vacio;

  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_CLINICA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instante);

  const v = (tipo) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${v("day")}-${v("month")}-${v("year")} ${v("hour")}:${v("minute")}:${v("second")} (${desfaseZona(instante)})`;
}

/** "2026-10-23" (o un valor civil del backend) → "23 de octubre de 2026". Sin convertir zona. */
export function formatearFechaLargaCivil(valor, vacio = "") {
  const p = partesFechaCivil(valor);
  if (!p) return vacio;
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${p.dia} de ${meses[p.mes - 1]} de ${p.anio}`;
}
