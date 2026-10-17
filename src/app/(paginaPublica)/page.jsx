import Link from "next/link";
import BotonAgendarMovil from "@/Componentes/PaginaPublica/Estructura/BotonAgendarMovil";
import CarruselServicios from "@/Componentes/PaginaPublica/Inicio/CarruselServicios";
import DatosRapidos from "@/Componentes/PaginaPublica/Inicio/DatosRapidos";
import Portada from "@/Componentes/PaginaPublica/Inicio/Portada";
import Publicaciones from "@/Componentes/PaginaPublica/Inicio/Publicaciones";
import Revelar from "@/Componentes/PaginaPublica/Comunes/Revelar";
import Testimonios from "@/Componentes/PaginaPublica/Inicio/Testimonios";
import {
  obtenerCategorias,
  obtenerDatosEmpresa,
  obtenerPortadas,
  obtenerProfesionales,
  obtenerPublicaciones,
  obtenerResenas,
  obtenerServicios,
} from "@/lib/paginaPublica/api";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

export async function generateMetadata() {
  const [datosEmpresa, portadas] = await Promise.all([obtenerDatosEmpresa(), obtenerPortadas()]);
  const nombre = datosEmpresa.empresaNombre;
  const descripcion = portadas[0]?.descripcionPublicacionesPortada || datosEmpresa.sobreNosotrosParrafo1;
  return {
    title: nombre ? { absolute: `${nombre} · Agenda tu hora en línea` } : undefined,
    description: descripcion || undefined,
  };
}

/* Inicio del centro: cada sección se muestra solo si el centro cargó su contenido en el dashboard */
export default async function Inicio() {
  const [datosEmpresa, portadas, servicios, publicaciones, resenas, profesionales, categorias] = await Promise.all([
    obtenerDatosEmpresa(),
    obtenerPortadas(),
    obtenerServicios(),
    obtenerPublicaciones(),
    obtenerResenas(),
    obtenerProfesionales(),
    obtenerCategorias(),
  ]);

  const enlaces = crearEnlaces(datosEmpresa);
  const parrafos = [datosEmpresa.sobreNosotrosParrafo1, datosEmpresa.sobreNosotrosParrafo2].filter(Boolean);
  const whatsapp = enlaces.whatsapp(enlaces.mensajes.whatsappGeneral);
  const mapa = enlaces.mapaEmbebido();
  const contacto = [
    { titulo: "Teléfono", texto: datosEmpresa.contactoTelefono, href: enlaces.telefono() },
    { titulo: "Correo", texto: datosEmpresa.contactoEmail, href: enlaces.correo(enlaces.mensajes.correoAsunto, enlaces.mensajes.correoCuerpo) },
    { titulo: "Dirección", texto: datosEmpresa.contactoDireccion, href: enlaces.mapa(), externo: true, ancho: true },
  ].filter((c) => c.texto && c.href);

  return (
    <>
      {/* Portada (carruselPortada) y franja de datos: en escritorio ocupan justo la primera pantalla */}
      <section
        id="inicio"
        className="flex flex-col pt-28 md:pt-36 lg:min-h-svh lg:pb-10 lg:pt-14"
      >
        {/* En escritorio la portada se centra en el espacio libre y la franja se asienta al pie de la pantalla */}
        <div className="flex lg:flex-1 lg:items-center">
          <Portada slides={portadas} datosEmpresa={datosEmpresa} />
        </div>
        <div className="mx-auto mt-16 w-full max-w-[1120px] px-5 md:mt-20 md:px-6 lg:mt-12">
          <DatosRapidos datosEmpresa={datosEmpresa} categorias={categorias} profesionales={profesionales} />
        </div>
      </section>

      {/* Servicios: publicacionesTituloDetalle */}
      {servicios.length > 0 && (
        <section id="servicios" className="pt-24 md:pt-28">
          <Revelar className="mx-auto mb-8 max-w-[1120px] px-5 md:px-6">
            <h2 className="titular-2">Servicios</h2>
            <p className="bajada mt-3">Conoce cada tratamiento y agenda directamente con el profesional indicado.</p>
          </Revelar>
          <CarruselServicios servicios={servicios} datosEmpresa={datosEmpresa} />
        </section>
      )}

      {/* Sobre nosotros: datosempresa */}
      {(datosEmpresa.sobreNosotrosTitulo || parrafos.length > 0) && (
        <section id="sobre-nosotros" className="pt-24 md:pt-32">
          <div className="mx-auto max-w-[1120px] px-5 md:px-6">
            <Revelar className="rounded-[28px] bg-niebla px-7 py-12 md:px-14 md:py-20">
              <h2 className="titular-2 max-w-[20ch]">{datosEmpresa.sobreNosotrosTitulo || "Sobre nosotros"}</h2>
              {parrafos.length > 0 && (
                <div
                  className={`mt-10 grid gap-6 text-[17px] leading-relaxed text-tinta-2 md:gap-12 ${parrafos.length > 1 ? "md:grid-cols-2" : "max-w-[62ch]"}`}
                >
                  {parrafos.map((p) => (
                    <p key={p.slice(0, 24)} className="texto-justificado whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </Revelar>
          </div>
        </section>
      )}

      {/* Publicaciones: la sección no existe si el centro no ha publicado nada */}
      {publicaciones.length > 0 && (
        <section id="publicaciones" className="pt-24 md:pt-32">
          <Revelar className="mx-auto mb-8 max-w-[1120px] px-5 md:px-6">
            <h2 className="titular-2">Publicaciones</h2>
            <p className="bajada mt-3">Casos, consejos y novedades para que llegues informado a tu consulta.</p>
          </Revelar>
          <Publicaciones publicaciones={publicaciones} />
        </section>
      )}

      {/* Testimonios: resenas */}
      <section id="testimonios" className="pt-24 md:pt-32">
        <Testimonios iniciales={resenas} profesionales={profesionales} />
      </section>

      {/* Contacto y ubicación */}
      <section id="contacto" className="py-24 md:py-32">
        <div className="mx-auto max-w-[1120px] px-5 md:px-6">
          <Revelar className={`grid overflow-hidden rounded-[28px] bg-niebla ${mapa ? "lg:grid-cols-2" : ""}`}>
            <div className="flex flex-col justify-between gap-10 p-7 md:p-12">
              <div>
                <h2 className="text-[clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight tracking-[-0.022em]">
                  Agenda tu próxima hora
                </h2>
                <p className="bajada mt-3 max-w-[40ch]">Reserva en línea en menos de un minuto, sin llamadas ni esperas.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/agendaProfesionales" className="boton boton-principal">
                    Agendar hora
                  </Link>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="boton boton-secundario">
                      Escribir por WhatsApp
                    </a>
                  )}
                </div>
              </div>
              {/* Teléfono y correo uno al lado del otro con su ancho natural; la dirección abajo */}
              {contacto.length > 0 && (
                <dl className="flex flex-wrap gap-x-12 gap-y-5 text-[15px]">
                  {contacto.map((c) => (
                    <div key={c.titulo} className={`min-w-0 ${c.ancho ? "basis-full" : ""}`}>
                      <dt className="text-[13px] text-tinta-2">{c.titulo}</dt>
                      <dd className="mt-1 font-medium">
                        <a
                          href={c.href}
                          className="[overflow-wrap:anywhere] hover:underline"
                          {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {c.texto}
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {mapa && (
              <div className="relative min-h-[320px] bg-linea-suave">
                <iframe
                  title={`Mapa de ${datosEmpresa.empresaNombre}`}
                  src={mapa}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[35%]"
                />
              </div>
            )}
          </Revelar>
        </div>
      </section>

      <BotonAgendarMovil />
    </>
  );
}
