import Link from "next/link";
import { Mail as Correo, MapPin as Ubicacion } from "lucide-react";
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
    <dl className={`grid overflow-hidden rounded-[28px] bg-white/85 p-2 sm:rounded-[32px] sm:p-3 ${columnas}`}>
      {celdas.map((c) => {
        const contenido = (
          <>
            <span aria-hidden="true" className="row-span-2 flex size-12 items-center justify-center self-center rounded-full bg-[#e0f0f1] text-[#007f89] sm:size-14">
              {c.titulo === "Correo" ? <Correo className="size-6" /> : <Ubicacion className="size-6" />}
            </span>
            <dt className="col-start-2 self-end text-[14px] text-slate-500 sm:text-[16px]">{c.titulo}</dt>
            <dd className="col-start-2 min-w-0 text-[15px] leading-relaxed font-medium text-[#30373a] [overflow-wrap:anywhere] transition-colors group-hover:text-[#007f89] sm:text-[17px] lg:text-[18px]">{c.valor}</dd>
          </>
        );
        const clase = "group grid h-full grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-[22px] px-3 py-4 transition-colors duration-300 hover:bg-[#edf7f8] sm:gap-x-5 sm:px-5 lg:px-7";
        return (
          <div key={c.titulo} className="min-w-0 border-[#d4e3e6] not-first:border-t sm:not-first:border-t-0 sm:not-first:border-l">
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
