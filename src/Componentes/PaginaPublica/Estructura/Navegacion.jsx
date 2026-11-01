"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconoCerrar, IconoLupa, IconoMenu } from "@/Componentes/PaginaPublica/Comunes/Iconos";
import { cfImageUrl } from "@/lib/cloudflare";
import { idLogoValido } from "@/lib/logoEmpresa";

const enlaces = [
  { href: "/#inicio", texto: "Inicio" },
  { href: "/#servicios", texto: "Servicios" },
  { href: "/#sobre-nosotros", texto: "Sobre nosotros" },
  { href: "/#publicaciones", texto: "Publicaciones" },
  { href: "/#testimonios", texto: "Testimonios" },
  { href: "/#contacto", texto: "Contacto" },
];

/* `nombre` y `logo` (id de Cloudflare) vienen de datosempresa; los pasa el layout */
export default function Navegacion({ nombre, logo }) {
  const urlLogo = cfImageUrl(idLogoValido(logo), "card");
  const [abierto, setAbierto] = useState(false);
  const [conFondo, setConFondo] = useState(false);

  useEffect(() => {
    const alDesplazar = () => setConFondo(window.scrollY > 8);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      {/*
       * Diseño de Nicolás (29-10) afinado: nombre del centro a la izquierda, cápsula teal con
       * el acceso a profesionales y "Agendar hora", y el menú en una segunda fila que se pliega
       * al hacer scroll (queda solo la fila principal, 72 px).
       */}
      <header
        className={`fixed inset-x-0 top-0 z-40 rounded-b-[24px] border-b transition-[background-color,border-color,box-shadow] duration-300 md:rounded-b-[28px] ${
          conFondo || abierto
            ? "border-black/[0.06] bg-white/90 shadow-[0_8px_30px_-18px_rgb(0_0_0/0.18)] backdrop-blur-xl backdrop-saturate-180"
            : "border-transparent bg-white/80 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto max-w-[1180px] px-4 sm:px-6" aria-label="Principal">
          <div className="flex h-16 items-center gap-3 md:h-[72px] md:gap-8">
            {/* Logo (si el centro lo cargó) y nombre: cada instancia muestra los suyos */}
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2 md:max-w-[340px] md:gap-3"
            >
              {urlLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urlLogo}
                  alt=""
                  width={40}
                  height={40}
                  className="size-9 shrink-0 rounded-full bg-white object-cover ring-1 ring-black/[0.06] md:size-10"
                />
              ) : null}
              <span className={`truncate font-semibold tracking-[-0.022em] text-tinta transition-colors group-hover:text-acento md:text-[19px] ${urlLogo ? "text-[16px]" : "text-[17px]"}`}>
                {nombre || "Inicio"}
              </span>
            </Link>

            <div className="ml-auto hidden min-w-0 flex-1 items-center gap-1.5 rounded-full bg-acento p-1.5 shadow-[0_10px_24px_-16px_rgb(0_102_110/0.7)] md:flex md:max-w-[640px]">
              <Link
                href="/agendaProfesionales"
                className="group flex min-h-10 min-w-0 flex-1 items-center justify-between gap-3 rounded-full bg-white/[0.14] pl-5 pr-3.5 text-[14px] text-white/85 transition-colors duration-200 hover:bg-white/[0.22] hover:text-white focus-visible:!outline-white"
              >
                <span className="truncate">Buscar profesional o especialidad</span>
                <IconoLupa className="h-[18px] w-[18px] shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
              </Link>
              <Link
                href="/agendaProfesionales"
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-lima px-5 text-[14px] font-semibold whitespace-nowrap text-acento-hondo transition-colors duration-200 hover:bg-white focus-visible:!outline-white"
              >
                Agendar hora
              </Link>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1 md:hidden">
              <Link
                href="/agendaProfesionales"
                className="inline-flex min-h-9 items-center rounded-full bg-acento px-4 text-[14px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-acento-hondo"
              >
                Agendar hora
              </Link>
              <button
                type="button"
                className="-mr-2 flex size-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-acento-suave"
                aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={abierto}
                onClick={() => setAbierto((v) => !v)}
              >
                {abierto ? <IconoCerrar className="h-5 w-5" /> : <IconoMenu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Segunda fila: visible arriba de todo, se pliega al bajar */}
          <div
            className={`hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.28,0.11,0.32,1)] md:grid ${
              conFondo ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
            inert={conFondo || undefined}
          >
            <ul className="flex min-h-0 items-center justify-center gap-1 overflow-hidden text-[14px] text-tinta-2 lg:gap-2">
              {enlaces.map((e) => (
                <li key={e.href} className="pb-3">
                  <Link
                    href={e.href}
                    className="inline-flex min-h-9 items-center rounded-full px-3.5 transition-colors duration-200 hover:bg-acento-suave hover:text-acento-hondo lg:px-4"
                  >
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Fuera del header: el backdrop-blur convierte al header en contenedor de los hijos fixed */}
      {abierto && (
        <div className="animar-velo fixed inset-x-0 bottom-0 top-16 z-30 bg-white md:hidden">
          <ul className="flex flex-col px-6 pt-2">
            {[...enlaces, { href: "/agendaProfesionales", texto: "Profesionales" }].map((e, i) => (
              <li key={e.href} className="animar-modal border-b border-linea-suave" style={{ animationDelay: `${i * 35}ms` }}>
                <Link
                  href={e.href}
                  onClick={() => setAbierto(false)}
                  className="block py-3.5 text-[19px] font-medium tracking-tight text-tinta/90 transition-colors active:text-acento"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
