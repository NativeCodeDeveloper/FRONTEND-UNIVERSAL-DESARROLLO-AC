/* Procesamiento local de la firma dibujada.
 *
 * Sirve para la VISTA PREVIA y para enviar un PNG razonable. El servidor vuelve
 * a recortar y normalizar con sharp, porque no se confía en lo que manda el
 * cliente (docs/firma/03 §5.5). Las funciones de cálculo son puras para poder
 * probarlas sin navegador.
 */

export const NORMALIZADO = { alto: 200, anchoMax: 600, margen: 7 };
export const MINIMOS = { trazos: 1, puntos: 20, anchoCss: 60, altoCss: 20 };

/** Caja de los píxeles con tinta (alfa > umbral). null si el lienzo está vacío. */
export function calcularCajaTinta({ data, width, height }, umbral = 8) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > umbral) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

/** Medidas de salida: 200 px de alto; si así excede 600 de ancho, manda el ancho. */
export function medidasNormalizadas(ancho, alto, { alto: altoObjetivo, anchoMax } = NORMALIZADO) {
  let salidaAlto = altoObjetivo;
  let salidaAncho = Math.round(ancho * (altoObjetivo / alto));
  if (salidaAncho > anchoMax) {
    salidaAncho = anchoMax;
    salidaAlto = Math.round(alto * (anchoMax / ancho));
  }
  return { ancho: Math.max(salidaAncho, 1), alto: Math.max(salidaAlto, 1) };
}

export function contarPuntos(trazos) {
  return trazos.reduce((total, trazo) => total + trazo.length, 0);
}

/** "" si la firma alcanza el mínimo; si no, el motivo. Medidas en px CSS. */
export function validarFirma(trazos) {
  if (trazos.length < MINIMOS.trazos) return "Dibuja tu firma en el recuadro.";
  if (contarPuntos(trazos) < MINIMOS.puntos) return "La firma es demasiado simple. Dibújala completa.";
  const puntos = trazos.flat();
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const ancho = Math.max(...xs) - Math.min(...xs);
  const alto = Math.max(...ys) - Math.min(...ys);
  if (ancho < MINIMOS.anchoCss || alto < MINIMOS.altoCss) return "La firma es demasiado pequeña. Usa más espacio del recuadro.";
  return "";
}

/**
 * Recorta el lienzo al área con tinta y lo normaliza. Solo navegador.
 * @returns {Promise<{blob: Blob, url: string, ancho: number, alto: number} | null>}
 */
export async function recortarYNormalizar(lienzo, opciones = NORMALIZADO) {
  const ctx = lienzo.getContext("2d");
  const caja = calcularCajaTinta(ctx.getImageData(0, 0, lienzo.width, lienzo.height));
  if (!caja) return null;

  const margen = Math.round(opciones.margen * (window.devicePixelRatio || 1));
  const x = Math.max(0, caja.x - margen);
  const y = Math.max(0, caja.y - margen);
  const ancho = Math.min(lienzo.width - x, caja.ancho + margen * 2);
  const alto = Math.min(lienzo.height - y, caja.alto + margen * 2);
  const salida = medidasNormalizadas(ancho, alto, opciones);

  const destino = document.createElement("canvas");
  destino.width = salida.ancho;
  destino.height = salida.alto;
  const dctx = destino.getContext("2d");
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = "high";
  dctx.drawImage(lienzo, x, y, ancho, alto, 0, 0, salida.ancho, salida.alto);

  const blob = await new Promise((resolver) => destino.toBlob(resolver, "image/png"));
  if (!blob) return null;
  return { blob, url: URL.createObjectURL(blob), ancho: salida.ancho, alto: salida.alto };
}
