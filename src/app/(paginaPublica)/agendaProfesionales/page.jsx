import SelectorAtencion from "@/Componentes/PaginaPublica/Profesionales/SelectorAtencion";
import { obtenerDatosEmpresa, obtenerPreciosDesde, obtenerProfesionales } from "@/lib/paginaPublica/api";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

export async function generateMetadata() {
  const { empresaNombre } = await obtenerDatosEmpresa();
  return {
    title: { absolute: empresaNombre ? `Profesionales · ${empresaNombre}` : "Profesionales" },
    description: "Elige a tu profesional y agenda tu hora en línea.",
  };
}

/* Equipo del centro con el precio "desde" de cada profesional */
export default async function AgendaProfesionales() {
  const [datosEmpresa, profesionales] = await Promise.all([obtenerDatosEmpresa(), obtenerProfesionales()]);
  const preciosDesde = await obtenerPreciosDesde(profesionales);
  const enlaces = crearEnlaces(datosEmpresa);
  const whatsapp = enlaces.whatsapp(enlaces.mensajes.whatsappOrientacion);

  return (
    <section className="pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-[1120px] px-5 md:px-6">
        <header className="mb-10 md:mb-12">
          <h1 className="titular-2">Elige a tu profesional</h1>
          <p className="bajada mt-4">Elige la sucursal y el tipo de atención que necesitas; te mostramos los especialistas disponibles para reservar tu hora en línea.</p>
        </header>

        {profesionales.length > 0 ? (
          <SelectorAtencion profesionales={profesionales} preciosDesde={preciosDesde} />
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
