import { Fragment } from "react";
import Link from "next/link";
import { Mail as Correo, MapPin as Ubicacion } from "lucide-react";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

const ICONOS = { Correo, Dirección: Ubicacion };

/*
 * Detalle bajo la portada: una píldora discreta con el correo y la dirección.
 * Cada dato aparece solo si existe en datosempresa; el ícono ya lo identifica,
 * así que el título queda solo para lectores de pantalla.
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

  return (
    <dl className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-[#d4e9eb]/80 bg-white/80 px-5 py-2.5 shadow-[0_1px_10px_rgb(0_0_0/0.03)] backdrop-blur-sm sm:px-7">
      {celdas.map((c, i) => {
        const Icono = ICONOS[c.titulo];
        const contenido = (
          <>
            <Icono aria-hidden="true" className="size-4 shrink-0 text-acento" strokeWidth={1.8} />
            <dt className="sr-only">{c.titulo}</dt>
            <dd className="min-w-0 text-[13.5px] font-medium text-tinta-2 [overflow-wrap:anywhere] transition-colors duration-200 group-hover:text-acento sm:text-[14px]">
              {c.valor}
            </dd>
          </>
        );
        return (
          <Fragment key={c.titulo}>
            {i > 0 && <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-linea" />}
            <div className="group flex min-w-0 items-center gap-2">
              {"interno" in c ? (
                <Link href={c.href} className="min-w-0">
                  {contenido}
                </Link>
              ) : (
                <a
                  href={c.href}
                  className="min-w-0"
                  {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {contenido}
                </a>
              )}
            </div>
          </Fragment>
        );
      })}
    </dl>
  );
}
