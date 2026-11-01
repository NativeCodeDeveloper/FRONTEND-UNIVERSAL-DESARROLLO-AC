import { crearEnlaces } from "@/lib/paginaPublica/enlaces";

/*
 * Datos bajo la portada: correo y dirección, cada uno en su celda con un rótulo
 * pequeño encima. Cada celda aparece solo si el dato existe en datosempresa y
 * entera es el enlace (correo o mapa). En celular se apilan.
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

  const columnas = celdas.length > 1 ? "sm:grid-cols-2 sm:divide-x sm:divide-y-0" : "";

  return (
    <dl className={`caja grid divide-y divide-linea-suave overflow-hidden ${columnas}`}>
      {celdas.map((c) => (
        <div key={c.titulo} className="group relative min-w-0 px-6 py-4 transition-colors duration-200 hover:bg-niebla/70 sm:px-7 sm:py-5">
          <dt className="text-[13px] text-tinta-3">{c.titulo}</dt>
          <dd className="mt-0.5 truncate text-[15px] font-medium text-tinta transition-colors duration-200 group-hover:text-acento">
            <a
              href={c.href}
              className="after:absolute after:inset-0 after:content-['']"
              {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {c.valor}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  );
}
