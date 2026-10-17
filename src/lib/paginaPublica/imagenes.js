/*
 * Imágenes de la página pública.
 *
 * El dashboard recorta cada imagen antes de subirla (ImageCropperModal) con una proporción fija:
 *   portada        1:1  (portadaEdit, PORTADA_CROP_ASPECT)
 *   servicios      4:5  (publicacionesTituloDescripcion, SECCION2_CARD_ASPECT)
 *   publicaciones  1:1  (publicaciones, PUBLICACIONES_CROP_ASPECT)
 * Por eso los recuadros públicos usan exactamente esas proporciones con object-cover: la imagen
 * llena el cuadro sin bandas y sin recortes extra. Si cambia una proporción en el dashboard,
 * hay que cambiar aquí la clase aspect-* correspondiente.
 *
 * Variante "full" de Cloudflare: la de mayor resolución disponible (≈1024 px), para verse en HD.
 */
import { cfImageUrl } from "@/lib/cloudflare";

export const imagenHD = (id) => cfImageUrl(id, "full");

export const PROPORCION = {
  portada: "aspect-square",
  servicio: "aspect-[4/5]",
  publicacion: "aspect-square",
};
