import Link from "next/link";
import { notFound } from "next/navigation";
import Reserva from "@/Componentes/PaginaPublica/Reserva/Reserva";
import { obtenerDatosEmpresa, obtenerEstadoPasarela, obtenerProfesional, obtenerTarifas } from "@/lib/paginaPublica/api";
import { nombrePropio } from "@/lib/paginaPublica/formatos";

export async function generateMetadata({ params }) {
  const { id_profesional } = await params;
  const [profesional, { empresaNombre }] = await Promise.all([obtenerProfesional(id_profesional), obtenerDatosEmpresa()]);
  if (!profesional) return {};
  const nombre = nombrePropio(profesional.nombreProfesional);
  return { title: { absolute: empresaNombre ? `Agendar con ${nombre} · ${empresaNombre}` : `Agendar con ${nombre}` } };
}

/* Reserva con un profesional: servicio, día, hora y datos en una sola página */
export default async function AgendaProfesional({ params }) {
  const { id_profesional } = await params;
  const [profesional, tarifas, datosEmpresa, estadoPasarela] = await Promise.all([
    obtenerProfesional(id_profesional),
    obtenerTarifas(id_profesional),
    obtenerDatosEmpresa(),
    obtenerEstadoPasarela(),
  ]);
  if (!profesional) notFound();

  return (
    <section className="bg-niebla pb-32 pt-20 md:pt-24 lg:pb-28">
      <div className="mx-auto max-w-[1120px] px-5 md:px-6">
        <nav aria-label="Ruta" className="mb-6 text-[13px] text-tinta-2">
          <Link href="/agendaProfesionales" className="hover:text-tinta hover:underline">
            Profesionales
          </Link>
          <span className="mx-2 text-tinta-3">/</span>
          <span className="text-tinta">{nombrePropio(profesional.nombreProfesional)}</span>
        </nav>
        <Reserva profesional={profesional} tarifas={tarifas} datosEmpresa={datosEmpresa} estadoPasarela={estadoPasarela} />
      </div>
    </section>
  );
}
