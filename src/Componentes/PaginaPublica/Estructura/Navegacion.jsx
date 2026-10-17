"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconoCerrar, IconoMenu } from "@/Componentes/PaginaPublica/Comunes/Iconos";

const enlaces = [
  { href: "/#inicio", texto: "Inicio" },
  { href: "/#servicios", texto: "Servicios" },
  { href: "/#sobre-nosotros", texto: "Sobre nosotros" },
  { href: "/#publicaciones", texto: "Publicaciones" },
  { href: "/#testimonios", texto: "Testimonios" },
  { href: "/#contacto", texto: "Contacto" },
];

export default function Navegacion() {
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
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          conFondo || abierto
            ? "border-b border-black/[0.06] bg-white/80 backdrop-blur-xl backdrop-saturate-180"
            : "border-b border-transparent bg-white/0"
        }`}
      >
        <nav
          className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5 md:justify-center md:px-6"
          aria-label="Principal"
        >
          <ul className="hidden items-center gap-8 text-[13px] text-tinta/80 md:flex">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="transition-colors hover:text-tinta">
                  {e.texto}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/agendaProfesionales" className="boton boton-principal !min-h-8 !px-4 !text-[13px]">
                Agendar hora
              </Link>
            </li>
          </ul>

          <Link href="/agendaProfesionales" className="boton boton-principal !min-h-8 !px-4 !text-[13px] md:hidden">
            Agendar hora
          </Link>
          <button
            type="button"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-tinta md:hidden"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <IconoCerrar className="h-5 w-5" /> : <IconoMenu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {/* Fuera del header: el backdrop-blur convierte al header en contenedor de los hijos fixed */}
      {abierto && (
        <div className="animar-velo fixed inset-x-0 bottom-0 top-14 z-30 bg-white md:hidden">
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
