import Link from "next/link";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

/*
 * Franja bajo la portada: correo y dirección.
 * Cada celda aparece solo si el dato existe en datosempresa.
 */
export default function DatosRapidos({ datosEmpresa }) {
  const enlaces = crearEnlaces(datosEmpresa);
  const correo = enlaces.correo(enlaces.mensajes.correoAsunto, enlaces.mensajes.correoCuerpo);
  const mapa = enlaces.mapa();

  const celdas = [
    datosEmpresa.contactoEmail && correo
      ? { titulo: "Correo", valor: datosEmpresa.contactoEmail, href: correo, externo: false }
      : null,
    datosEmpresa.contactoDireccion && mapa
      ? { titulo: "Dirección", valor: datosEmpresa.contactoDireccion, href: mapa, externo: true }
      : null,
  ].filter((c) => c !== null);

  if (celdas.length === 0) return null;

  const columnas = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[celdas.length];

  return (
    <dl className={`grid gap-px overflow-hidden rounded-[22px] bg-linea-suave ${columnas}`}>
      {celdas.map((c) => {
        const contenido = (
          <>
            <dt className="text-[13px] text-tinta-2">{c.titulo}</dt>
            <dd className="mt-1 truncate text-[15px] font-medium transition-colors group-hover:text-acento">{c.valor}</dd>
          </>
        );
        const clase = "group block bg-niebla px-6 py-5 transition-colors duration-300 hover:bg-[#ededf0]";
        return (
          <div key={c.titulo} className="min-w-0">
            {"interno" in c ? (
              <Link href={c.href} className={clase}>
                {contenido}
              </Link>
            ) : (
              <a href={c.href} className={clase} {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {contenido}
              </a>
            )}
          </div>
        );
      })}
    </dl>
  );
}
