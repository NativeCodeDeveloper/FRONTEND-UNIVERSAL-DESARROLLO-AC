/**
 * Enlace de "Contacto Soporte" (WhatsApp).
 *
 * El numero y el armado del mensaje viven aqui y en ningun otro lado: el enlace
 * se pinta en cuatro sitios distintos (rail colapsado, sidebar normal, aviso de
 * cuenta suspendida y menu movil) y antes era una constante copiada en dos
 * archivos, que es justo la forma de que se desincronicen.
 *
 * El parametro ?text= de wa.me solo PRELLENA el mensaje: quien escribe puede
 * borrarlo antes de enviar. Sirve para identificar al 95% que le da a enviar
 * sin pensar, pero no es un dato de identificacion confiable.
 */

export const NUMERO_SOPORTE = "56932912943";

// Orden en que salen los campos en el mensaje. Los vacios se omiten, asi que
// durante la carga (o sin sesion) el mensaje simplemente sale mas corto en vez
// de mostrar "Nombre: " o un "Usuario" inventado.
const CAMPOS = [
  ["Nombre", "nombre"],
  ["Correo", "correo"],
  ["Empresa", "empresa"],
  ["Perfil", "perfil"],
  ["Pantalla", "pantalla"],
  ["Motivo", "motivo"],
];

function limpiar(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

export function construirMensajeSoporte(datos = {}) {
  const lineas = ["Hola, necesito soporte de AgendaClinica."];

  const detalles = CAMPOS
    .map(([etiqueta, clave]) => [etiqueta, limpiar(datos[clave])])
    .filter(([, valor]) => valor)
    .map(([etiqueta, valor]) => `${etiqueta}: ${valor}`);

  if (detalles.length > 0) {
    lineas.push("", ...detalles);
  }

  // Ultima linea a proposito vacia: deja el cursor listo para escribir y evita
  // que haya que borrar algo para responder.
  lineas.push("", "Mi consulta:", "");

  return lineas.join("\n");
}

export function construirUrlSoporte(datos = {}) {
  // encodeURIComponent convierte los saltos de linea en %0A, que WhatsApp
  // respeta como salto real.
  return `https://wa.me/${NUMERO_SOPORTE}?text=${encodeURIComponent(construirMensajeSoporte(datos))}`;
}

// Canal formal para SOLICITUDES a NativeCode (cambios, accesos, datos, reclamos): queda
// por escrito, a diferencia del WhatsApp, que es para dudas rápidas. Definido una sola
// vez aquí, igual que el número, para que todos los enlaces apunten al mismo lugar.
export const CORREO_SOPORTE = "ingenieria.software@nativecode.cl";

export function construirMailtoSoporte(datos = {}) {
  const empresa = limpiar(datos.empresa);
  const asunto = `Solicitud de soporte${empresa ? ` · ${empresa}` : ""}${limpiar(datos.motivo) ? ` · ${limpiar(datos.motivo)}` : ""}`;
  const cuerpo = construirMensajeSoporte(datos).replace("Hola, necesito soporte de AgendaClinica.", "Hola, quiero hacer una solicitud a soporte de AgendaClínica.");
  return `mailto:${CORREO_SOPORTE}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
