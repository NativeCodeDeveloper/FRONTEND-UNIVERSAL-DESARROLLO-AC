/**
 * tourReserva.js
 * Memoria corta de "la reserva de prueba que el usuario creó durante el tour".
 *
 * El paso del tour que manda a abrir la ficha clínica necesita apuntar al ícono
 * de ojo de UNA fila concreta del Panel de Reservas — no al encabezado de la
 * tabla ni a una fila cualquiera. El backend de agendamiento responde
 * `{ message: true }` sin devolver el id de la reserva creada, así que la única
 * identidad estable que tenemos del paciente recién agendado es su RUT, que es
 * además exactamente la llave con la que el dashboard busca/crea su ficha
 * (`buscarPacientePorRut`).
 *
 * Se guarda en sessionStorage y no en un ref de React porque entre el paso que
 * crea la reserva (/dashboard/calendario) y el que abre la ficha (/dashboard)
 * hay una navegación: un recargado completo de la pestaña mataría cualquier
 * estado en memoria, y el tour quedaría otra vez sin saber qué fila marcar.
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
  if (!rutNormalizado) return;

  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ rut: rutNormalizado, ts: Date.now() }));
  } catch {}
}

export function obtenerRutReservaDeTour() {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    if (!crudo) return "";

    const { rut, ts } = JSON.parse(crudo);
    if (!rut || typeof ts !== "number" || Date.now() - ts > VIGENCIA_MS) {
      sessionStorage.removeItem(CLAVE);
      return "";
    }

    return rut;
  } catch {
    return "";
  }
}

export function limpiarReservaDeTour() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {}
}
