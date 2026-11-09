const suscriptores = new Set();
let pendientes = 0;
let visible = false;
let aperturaPendiente;
let cierrePendiente;
// Solo se muestra el loader si la carga real supera este umbral; navegaciones
// y peticiones más rápidas no llegan a verlo.
const ESPERA_PARA_MOSTRAR = 600;
// Tope por carga: si quien la abrió nunca la cierra (petición colgada, fallback
// retenido por una animación de salida, Clerk que no termina), el overlay no puede
// quedar pegado hasta recargar. La petición sigue su curso; solo deja de taparse la app.
const DURACION_MAXIMA = 15000;

function publicar(valor) {
  if (visible === valor) return;
  visible = valor;
  suscriptores.forEach((notificar) => notificar());
}

export function suscribirCarga(notificar) {
  suscriptores.add(notificar);
  return () => suscriptores.delete(notificar);
}

export function obtenerCarga() {
  return visible;
}

export function iniciarCarga() {
  if (typeof window === "undefined") return () => {};

  clearTimeout(cierrePendiente);
  pendientes += 1;
  if (pendientes === 1 && !visible) {
    aperturaPendiente = setTimeout(() => {
      aperturaPendiente = undefined;
      if (pendientes > 0) publicar(true);
    }, ESPERA_PARA_MOSTRAR);
  }
  let finalizada = false;
  const tope = setTimeout(() => finalizar(), DURACION_MAXIMA);

  function finalizar() {
    if (finalizada) return;
    finalizada = true;
    clearTimeout(tope);
    pendientes -= 1;

    if (pendientes === 0) {
      clearTimeout(aperturaPendiente);
      aperturaPendiente = undefined;
      // Une peticiones encadenadas y permite que React pinte los datos recibidos.
      if (visible) cierrePendiente = setTimeout(() => publicar(false), 100);
    }
  }

  return finalizar;
}
