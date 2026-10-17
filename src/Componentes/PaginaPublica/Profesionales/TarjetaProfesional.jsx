import Link from "next/link";
import { formatoPrecio, nombrePropio } from "@/lib/paginaPublica/formatos";
import Avatar from "@/Componentes/PaginaPublica/Comunes/Avatar";

/* `desde`: precio más bajo de sus tarifas (null si aún no publica servicios) */
export default function TarjetaProfesional({ profesional, desde = null }) {
  const nombre = nombrePropio(profesional.nombreProfesional);

  return (
    <Link
      href={`/agendaEspecificaProfersional/${profesional.id_profesional}`}
      className="caja caja-interactiva group flex h-full flex-col overflow-hidden"
    >
      <Avatar profesional={profesional} tamano="retrato" className="aspect-[6/5] w-full" />
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[19px] font-semibold leading-tight tracking-tight">{nombre}</h2>
        {profesional.descripcionProfesional && (
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-tinta-2">{profesional.descripcionProfesional}</p>
        )}
        <div className="flex-1" />
        {desde !== null && (
          <p className="mt-4 border-t border-linea-suave pt-4 text-[13px] text-tinta-3">
            Desde <span className="font-medium text-tinta">{desde === 0 ? "sin costo" : formatoPrecio(desde)}</span>
          </p>
        )}
        <span className="boton boton-tenue mt-4 w-full !min-h-10 !text-[15px] transition-colors group-hover:!bg-acento group-hover:!text-white">
          Ver disponibilidad
        </span>
      </div>
    </Link>
  );
}
