/**
 * tourReserva.js
 * Memoria corta de "la reserva de prueba que el usuario creó durante el tour".
 *
 * La marca confirma que el backend guardó la cita, incluso si el paciente no
 * informó RUT. Cuando hay RUT, también permite identificar esa reserva en el
 * Panel de Reservas.
 *
 * Se guarda en sessionStorage y no en un ref de React porque entre el paso que
 * crea la reserva (/dashboard/calendario) y los pasos siguientes puede haber
 * navegación. Un recargado completo de la pestaña perdería el estado en memoria.
 *
 * La marca caduca sola: si quedó de una corrida vieja del tour, no queremos que
 * resalte una fila al azar la próxima vez.
 */

const CLAVE = "ac_tour_reserva";
const VIGENCIA_MS = 2 * 60 * 60 * 1000; // 2 horas

// Mismo criterio que usa el Panel de Reservas para comparar RUTs: solo dígitos
// y dígito verificador, en mayúscula. Así "19.168.408-7" y "191684087" son el
// mismo paciente al momento de buscar la fila.
export function normalizarRutTour(valor) {
  return String(valor || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

export function marcarReservaDeTour(rut) {
  const rutNormalizado = normalizarRutTour(rut);
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ rut: rutNormalizado, ts: Date.now() }));
  } catch {}
}

function obtenerReservaVigente() {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    if (!crudo) return null;

    const { rut, ts } = JSON.parse(crudo);
    if (typeof rut !== "string" || typeof ts !== "number" || Date.now() - ts > VIGENCIA_MS) {
      sessionStorage.removeItem(CLAVE);
      return null;
    }

    return { rut, ts };
  } catch {
    return null;
  }
}

export function reservaConfirmadaDeTour() {
  return !!obtenerReservaVigente();
}

export function obtenerRutReservaDeTour() {
  return obtenerReservaVigente()?.rut ?? "";
}

export function limpiarReservaDeTour() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {}
}
