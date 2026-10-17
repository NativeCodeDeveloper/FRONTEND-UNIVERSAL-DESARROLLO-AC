import Link from "next/link";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

/* Pie de la página pública: nombre del centro, accesos, redes y contacto (datosempresa) */
export default function Pie({ datosEmpresa }) {
  const anio = new Date().getFullYear();
  const enlaces = crearEnlaces(datosEmpresa);
  const whatsapp = enlaces.whatsapp(enlaces.mensajes.whatsappGeneral);
  const redes = [...enlaces.redes(), ...(whatsapp ? [{ etiqueta: "WhatsApp", href: whatsapp }] : [])];
  const contacto = [
    { texto: datosEmpresa.contactoTelefono, href: enlaces.telefono() },
    { texto: datosEmpresa.contactoEmail, href: enlaces.correo(enlaces.mensajes.correoAsunto, enlaces.mensajes.correoCuerpo) },
    { texto: datosEmpresa.contactoDireccion, href: enlaces.mapa(), externo: true },
  ].filter((c) => c.texto && c.href);

  return (
    <footer className="bg-niebla text-[13px] text-tinta-2">
      <div className="mx-auto max-w-[1120px] px-5 pb-8 pt-14 md:px-6">
        <div className="grid gap-10 border-b border-linea pb-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="text-[17px] font-semibold tracking-tight text-tinta">{datosEmpresa.empresaNombre}</p>
            <p className="mt-2 max-w-[260px] leading-relaxed">Agenda tu hora en línea, en cualquier momento del día.</p>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-tinta">Explorar</h2>
            <ul className="space-y-2">
              <li>
                <Link className="hover:text-tinta hover:underline" href="/#servicios">
                  Servicios
                </Link>
              </li>
              <li>
                <Link className="hover:text-tinta hover:underline" href="/#publicaciones">
                  Publicaciones
                </Link>
              </li>
              <li>
                <Link className="hover:text-tinta hover:underline" href="/#testimonios">
                  Testimonios
                </Link>
              </li>
              <li>
                <Link className="hover:text-tinta hover:underline" href="/agendaProfesionales">
                  Agendar hora
                </Link>
              </li>
            </ul>
          </div>

          {redes.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-tinta">Síguenos</h2>
              <ul className="space-y-2">
                {redes.map((r) => (
                  <li key={r.etiqueta}>
                    <a className="hover:text-tinta hover:underline" href={r.href} target="_blank" rel="noopener noreferrer">
                      {r.etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contacto.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-tinta">Contacto</h2>
              <ul className="space-y-2">
                {contacto.map((c) => (
                  <li key={c.texto}>
                    <a
                      className="break-words hover:text-tinta hover:underline"
                      href={c.href}
                      {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {c.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-6 text-[12px] text-tinta-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {anio} {datosEmpresa.empresaNombre}. Todos los derechos reservados.
          </p>
          <p>
            Reservas con{" "}
            <a
              href="https://www.agendaclinicas.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-tinta-2 hover:underline"
            >
              Agenda Clínica
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
