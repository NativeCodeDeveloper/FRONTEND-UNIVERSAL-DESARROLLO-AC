/* Imprimir un PDF sin descargarlo al equipo.
 *
 * Escritorio: iframe oculto con el blob y print() → se abre el diálogo de
 * impresión del navegador directamente, sin pasar por la carpeta de descargas.
 *
 * Móvil (iOS/Android): los navegadores no imprimen PDF desde un iframe de forma
 * confiable. Se abre el documento en una pestaña, donde "Compartir → Imprimir"
 * (iOS) o el menú del visor (Android) lo imprimen.
 *
 * Nunca se crea un <a download>.
 * (Sin "noopener" en window.open: con esa opción devuelve siempre null y no se
 * podría saber si el navegador bloqueó la pestaña. Es un blob del mismo origen.)
 */

export function esDispositivoMovil() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) || window.matchMedia?.("(pointer: coarse)").matches;
}

export async function imprimirPdf(blob) {
  const url = URL.createObjectURL(blob);
  const liberar = () => setTimeout(() => URL.revokeObjectURL(url), 60_000);

  if (esDispositivoMovil()) {
    const ventana = window.open(url, "_blank");
    liberar();
    // Si el navegador bloqueó la pestaña (pasó tiempo desde el toque mientras se
    // generaba el PDF), la interfaz ofrece un enlace con esta url.
    return { modo: ventana ? "pestana" : "bloqueado", url };
  }

  return new Promise((resolver) => {
    const marco = document.createElement("iframe");
    marco.setAttribute("aria-hidden", "true");
    marco.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0";
    marco.src = url;
    marco.onload = () => {
      try {
        marco.contentWindow.focus();
        marco.contentWindow.print();
        resolver({ modo: "dialogo", url });
      } catch {
        // Algunos visores de PDF integrados bloquean print() desde el padre.
        window.open(url, "_blank");
        resolver({ modo: "pestana", url });
      }
      // El diálogo de impresión es bloqueante en la mayoría de navegadores;
      // se retira el iframe con margen para no cortar la impresión en curso.
      setTimeout(() => marco.remove(), 60_000);
      liberar();
    };
    document.body.appendChild(marco);
  });
}
