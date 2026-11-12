/* Agendar a un paciente desde su ficha o desde la lista de pacientes, SIN poner sus
 * datos en la URL (Ley 21.719: minimización). Antes viajaban nombre, RUT, teléfono y
 * correo como query params: quedaban en el historial del navegador, en los registros
 * del servidor y en el encabezado Referer.
 *
 * Ahora los datos se dejan en sessionStorage (solo esta pestaña, se borra al cerrarla)
 * y la URL lleva un identificador aleatorio que no dice nada del paciente. El calendario
 * los toma UNA vez y los borra; si pasaron más de 10 minutos, no se usan.
 * Si el navegador no permite sessionStorage (modo privado estricto), se abre el
 * calendario sin precargar: nunca se vuelve a la URL con datos.
 */

const CLAVE = "agendaclinica:agendarPaciente";
export const VIGENCIA_MS = 10 * 60 * 1000;

function almacenSesion() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function nuevoIdentificador() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/** Ruta del calendario para agendar a `paciente` (fila de pacienteDatos). */
export function rutaAgendarPaciente(paciente, { almacen = almacenSesion(), ahora = Date.now() } = {}) {
  if (!almacen || !paciente) return "/dashboard/calendario";
  const id = nuevoIdentificador();
  const datos = {
    nombre: paciente.nombre || "",
    apellido: paciente.apellido || "",
    rut: paciente.rut || "",
    tipo_documento: paciente.tipo_documento || "rut",
    telefono: paciente.telefono || "",
    email: paciente.correo || "",
  };
  try {
    almacen.setItem(CLAVE, JSON.stringify({ id, creado: ahora, datos }));
  } catch {
    return "/dashboard/calendario";
  }
  return `/dashboard/calendario?agendar=${encodeURIComponent(id)}`;
}

/** Datos del paciente para el identificador de la URL, o null. Los borra al leerlos. */
export function tomarPacienteParaAgendar(id, { almacen = almacenSesion(), ahora = Date.now() } = {}) {
  if (!id || !almacen) return null;
  try {
    const guardado = JSON.parse(almacen.getItem(CLAVE) || "null");
    if (!guardado || guardado.id !== id) return null;
    almacen.removeItem(CLAVE);
    if (!(ahora - Number(guardado.creado) <= VIGENCIA_MS)) return null;
    return guardado.datos || null;
  } catch {
    return null;
  }
}
