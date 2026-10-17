import Image from "next/image";
import { iniciales, nombrePropio } from "@/lib/paginaPublica/formatos";
import { cfImageUrl } from "@/lib/cloudflare";

/* Foto del profesional (subida desde el dashboard) o, si no tiene, sus iniciales sobre el color del centro */
export default function Avatar({ profesional, tamano, className = "", sizes, prioridad = false }) {
  const nombre = nombrePropio(profesional.nombreProfesional);
  /*
   * imagenProfesional (columna propuesta) guarda el imageId de Cloudflare. Mientras la columna no exista
   * viene undefined y se muestran las iniciales. Se usa la variante "full" (la de mayor resolución) para que se vea en HD.
   */
  const imagen = cfImageUrl(profesional.imagenProfesional, "full");

  if (imagen) {
    return (
      <div className={`relative overflow-hidden bg-niebla ${className}`}>
        <Image
          src={imagen}
          alt={nombre}
          fill
          sizes={sizes ?? (tamano === "circulo" ? "96px" : "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw")}
          className="object-cover object-[50%_18%]"
          priority={prioridad}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-acento-suave font-semibold text-acento-hondo ${className}`}
      aria-label={nombre}
      role="img"
    >
      <span className={tamano === "circulo" ? "text-xl" : "text-5xl tracking-tight"}>{iniciales(nombre)}</span>
    </div>
  );
}
