import Image from "next/image";

/*
 * Imagen que llena todo su recuadro (object-cover). El recuadro debe tener la misma proporción
 * con la que el dashboard recorta esa imagen (ver lib/paginaPublica/imagenes.js), así no se pierde nada.
 * El contenedor define el tamaño y debe ser `relative overflow-hidden`.
 */
export default function ImagenTarjeta({ src, alt = "", sizes, prioridad = false, zoom = true, className = "" }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={prioridad}
      className={`object-cover ${zoom ? "transition-transform duration-700 ease-[cubic-bezier(0.28,0.11,0.32,1)] group-hover:scale-[1.03]" : ""} ${className}`}
    />
  );
}
