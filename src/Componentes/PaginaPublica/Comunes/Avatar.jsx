import Image from "next/image";
import { nombrePropio } from "@/lib/paginaPublica/formatos";
import SiluetaProfesional from "@/Componentes/SiluetaProfesional";
import { cfImageUrl } from "@/lib/cloudflare";

/* Foto del profesional (subida desde el dashboard) o, si no tiene, la silueta de profesional de salud */
export default function Avatar({ profesional, tamano, className = "", sizes, prioridad = false }) {
  const nombre = nombrePropio(profesional.nombreProfesional);
  /*
   * imagenProfesional guarda el imageId de Cloudflare (se sube desde Profesionales en el dashboard). Sin foto
   * se muestra la silueta. Se usa la variante "full" (la de mayor resolución) para que se vea en HD.
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

  return <SiluetaProfesional className={className} etiqueta={nombre} />;
}
