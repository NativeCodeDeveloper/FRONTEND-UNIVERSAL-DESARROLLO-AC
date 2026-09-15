// Fuente única del hash de cuenta de Cloudflare Images.
//
// Tres pantallas (publicaciones, gestionStock y producto/[id]) leían
// NEXT_PUBLIC_CLOUDFLARE_HASH directamente, pero esa variable no está definida
// en ningún .env del proyecto. El resultado era distinto según la pantalla pero
// siempre roto: publicaciones caía a un placeholder gris y las otras dos
// construían URLs literales "imagedelivery.net/undefined/...".
//
// El hash NO es un secreto: es el identificador público de entrega que ya
// aparece hardcodeado en las páginas del sitio público y viaja en la URL de
// cada imagen servida. Por eso va acá como respaldo — así las imágenes
// funcionan aunque la variable de entorno no esté configurada, que es
// justamente lo que pasaba (y .env está en .gitignore, con lo que definirla
// solo habría arreglado una máquina y no el despliegue).
export const CLOUDFLARE_HASH =
    process.env.NEXT_PUBLIC_CLOUDFLARE_HASH || "aCBUhLfqUcxA2yhIBn1fNQ";

/**
 * Construye la URL de una imagen de Cloudflare Images.
 *
 * Devuelve "" cuando no hay imagen, para que quien llame pueda distinguir
 * "sin imagen" (y mostrar su placeholder) de una URL rota. Si el valor ya es
 * una URL completa se devuelve tal cual: algunos registros antiguos guardan la
 * URL entera en vez del id.
 */
export function cfImageUrl(imageId, variant = "card") {
    if (!imageId) return "";
    if (String(imageId).startsWith("http")) return imageId;
    return `https://imagedelivery.net/${CLOUDFLARE_HASH}/${imageId}/${variant}`;
}
