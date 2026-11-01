/*
 * Logo del centro (datos_empresa.logoEmpresa).
 *
 * Se sube desde Dashboard → Datos de la clínica, se recorta en círculo y se
 * guarda como PNG cuadrado (conserva la transparencia) en Cloudflare Images.
 * La base guarda solo el id. La página pública lo muestra en círculo antes del
 * nombre en el navbar; sin logo se muestra solo el nombre.
 *
 * Backend: POST /datosempresa/actualizarLogo { id_empresa, logoEmpresa } (con sesión).
 */

export const LOGO_TIPOS = ["image/png", "image/jpeg", "image/webp"];
export const LOGO_PESO_MAXIMO_MB = 5;
export const LOGO_PESO_MAXIMO = LOGO_PESO_MAXIMO_MB * 1024 * 1024;
/* Debajo de esto se ve pixelado incluso en el navbar (40 px en pantallas retina = 80 px) */
export const LOGO_LADO_MINIMO = 200;
export const LOGO_LADO_RECOMENDADO = 512;
/* El PNG final: suficiente para retina en cualquier tamaño en que se muestre */
export const LOGO_LADO_SALIDA = 512;

/* Mensaje de error para el archivo elegido, o "" si sirve. `lados` = { ancho, alto } ya leídos. */
export function errorArchivoLogo({ tipo, peso }, lados) {
  if (!LOGO_TIPOS.includes(tipo)) return "El logo debe ser PNG, JPG o WebP.";
  if (!(peso > 0)) return "El archivo está vacío o dañado.";
  if (peso > LOGO_PESO_MAXIMO) return `El logo pesa más de ${LOGO_PESO_MAXIMO_MB} MB. Prueba con una versión más liviana.`;
  if (lados) {
    const lado = Math.min(lados.ancho, lados.alto);
    if (!(lado >= LOGO_LADO_MINIMO)) {
      return `El logo es muy pequeño (${lados.ancho} × ${lados.alto} px). Debe medir al menos ${LOGO_LADO_MINIMO} × ${LOGO_LADO_MINIMO} px.`;
    }
  }
  return "";
}

/* Aviso suave (no bloquea): sirve, pero se verá mejor con más resolución o cuadrado */
export function avisoArchivoLogo(lados) {
  if (!lados) return "";
  const { ancho, alto } = lados;
  if (Math.min(ancho, alto) < LOGO_LADO_RECOMENDADO) {
    return `Se puede usar, pero se verá más nítido con ${LOGO_LADO_RECOMENDADO} × ${LOGO_LADO_RECOMENDADO} px o más.`;
  }
  const proporcion = Math.max(ancho, alto) / Math.min(ancho, alto);
  if (proporcion > 1.6) {
    return "Tu logo es alargado: al recortarlo en círculo puede quedar cortado. Si tienes una versión cuadrada (solo el símbolo), úsala.";
  }
  return "";
}
