"use client";

import Link from "next/link";
import { CalendarDays as Calendario, HeartPulse as Corazon, MessageCircle as Mensaje, Search as Lupa } from "lucide-react";
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

export default function Navegacion({ nombreEmpresa }) {
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
        className={`fixed inset-x-0 top-0 z-40 rounded-b-[24px] transition-colors duration-300 md:rounded-b-[28px] ${
          conFondo || abierto
            ? "border-b border-[#d4e9eb] bg-white/95 shadow-sm backdrop-blur-xl"
            : "border-b border-transparent bg-white/95"
        }`}
      >
        <nav
          className="mx-auto grid min-h-18 max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-x-8 md:px-6 md:pt-3 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-x-10 xl:px-10"
          aria-label="Principal"
        >
          <div className="flex min-w-0 items-center gap-2 py-3 text-[#00828d] md:gap-3 md:py-0">
            <Corazon aria-hidden="true" className="hidden size-10 shrink-0 stroke-[1.5] sm:block md:size-11 lg:size-12" />
            <span className="min-w-0 text-[14px] leading-tight font-semibold tracking-[-0.025em] [overflow-wrap:anywhere] md:text-[19px] lg:text-[21px]">
              {nombreEmpresa}
            </span>
          </div>

          <div className="hidden min-h-20 min-w-0 items-center justify-end gap-3 rounded-full bg-[#00858f] p-3 md:flex lg:gap-4 xl:gap-5 xl:pl-16">
            <Link href="/agendaProfesionales" className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-full bg-[#8ec2c6] px-5 py-3 text-[15px] font-medium text-[#204a50] transition-colors hover:bg-[#aad5d8] focus-visible:outline-white lg:text-[17px]">
              <span className="truncate">Profesionales</span>
              <Lupa aria-hidden="true" className="size-6 shrink-0" />
            </Link>
            <Link href="/#contacto" className="hidden min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-[#bcf0e8] px-7 py-3 text-[16px] font-semibold text-[#153c3b] transition-colors hover:bg-[#d6f8f2] focus-visible:outline-white xl:inline-flex">
              <Mensaje aria-hidden="true" className="size-6 shrink-0" />
              Contacto
            </Link>
            <Link href="/agendaProfesionales" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-[#c6df86] px-5 py-3 text-[15px] font-semibold whitespace-nowrap text-[#18352c] transition-colors hover:bg-[#d7e999] focus-visible:outline-white lg:px-7 lg:text-[17px]">
              <Calendario aria-hidden="true" className="size-6 shrink-0" />
              Agendar hora
            </Link>
          </div>

          <ul className="col-span-2 hidden min-h-14 w-full items-center justify-center gap-1 text-[14px] font-medium tracking-normal text-[#4b575b] md:flex lg:min-h-16 lg:gap-3 lg:text-[15px]">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 whitespace-nowrap transition-colors duration-200 hover:bg-[#edf6f6] hover:text-[#007f89] focus-visible:bg-[#edf6f6] focus-visible:text-[#007f89] lg:px-5">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/agendaProfesionales" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#c6df86] px-3 text-[12px] font-semibold whitespace-nowrap text-[#18352c] transition-colors hover:bg-[#d7e999] sm:px-5 sm:text-[13px] md:hidden">
            <Calendario aria-hidden="true" className="size-4 shrink-0" />
            Agendar hora
          </Link>
          <button
            type="button"
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-[#007f89] transition-colors hover:bg-[#e0f0f1] md:hidden"
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
        <div className="animar-velo fixed inset-x-0 bottom-0 top-18 z-30 bg-white md:hidden">
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
