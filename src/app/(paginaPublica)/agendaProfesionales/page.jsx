import GrillaProfesionales from "@/Componentes/PaginaPublica/Profesionales/GrillaProfesionales";
import { obtenerCategorias, obtenerDatosEmpresa, obtenerPreciosDesde, obtenerProfesionales } from "@/lib/paginaPublica/api";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

export async function generateMetadata() {
  const { empresaNombre } = await obtenerDatosEmpresa();
  return {
    title: { absolute: empresaNombre ? `Profesionales · ${empresaNombre}` : "Profesionales" },
    description: "Elige a tu profesional y agenda tu hora en línea.",
  };
}

/* Equipo del centro con filtro por categoría (si el centro las tiene) y precio "desde" de cada profesional */
export default async function AgendaProfesionales() {
  const [datosEmpresa, profesionales, categorias] = await Promise.all([obtenerDatosEmpresa(), obtenerProfesionales(), obtenerCategorias()]);
  const preciosDesde = await obtenerPreciosDesde(profesionales);
  const enlaces = crearEnlaces(datosEmpresa);
  const whatsapp = enlaces.whatsapp(enlaces.mensajes.whatsappOrientacion);

  return (
    <section className="pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-[1120px] px-5 md:px-6">
        <header className="mb-10 md:mb-12">
          <h1 className="titular-2">Elige a tu profesional</h1>
          <p className="bajada mt-4">Revisa la disponibilidad de cada especialista y reserva tu hora en tiempo real.</p>
        </header>

        {profesionales.length > 0 ? (
          <GrillaProfesionales profesionales={profesionales} categorias={categorias} preciosDesde={preciosDesde} />
        ) : (
          <p className="text-tinta-2">Pronto podrás agendar en línea con nuestro equipo.</p>
        )}

        {whatsapp && (
          <p className="mt-14 text-center text-[15px] text-tinta-2">
            ¿No sabes con quién atenderte?{" "}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="enlace">
              Escríbenos y te orientamos
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
