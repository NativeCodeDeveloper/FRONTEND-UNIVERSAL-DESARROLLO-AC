"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navItems = [
  { title: "Inicio", href: "/#inicio" },
  { title: "Especialidades", href: "/#servicios" },
  { title: "Casos clínicos", href: "/#casos-clinicos" },
  { title: "Agenda", href: "/reserva-hora" },
  { title: "Contacto", href: "/contacto" },
];

export function ShadcnNavBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="w-full bg-[#626468]/48 text-white backdrop-blur-2xl shadow-[0_16px_40px_-30px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex h-[82px] w-full max-w-7xl items-center justify-between px-5 md:h-[90px] md:px-10 xl:px-12">
        <Link href="/#inicio" className="flex min-w-0 items-center gap-3" aria-label="Inicio">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#c88d6d]/85 bg-white/5">
            <span className="text-[12px] font-semibold text-[#e4c5b2]">
              Logo
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white/95">
              Centro Integral ESSENZA
            </p>
            <p className="truncate text-[12px] text-white/65">
              Salud y bienestar integral
            </p>
          </div>
        </Link>

        <nav className="hidden lg:block" aria-label="Navegacion principal">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="text-[12px] font-semibold text-white/75 transition hover:text-[#f4d8c7]"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/reserva-hora"
            className="hidden rounded-full border border-[#d6a283] bg-[#c88d6d] px-6 py-2.5 text-[12px] font-semibold text-[#3f4145] transition hover:bg-[#d8a88b] sm:inline-flex"
          >
            Agendar evaluacion
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={[
          "overflow-hidden border-t border-white/15 bg-[#595b60]/82 text-white lg:hidden",
          mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
          "transition-all duration-300",
        ].join(" ")}
      >
        <div className="space-y-2 px-6 py-5">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block rounded-xl px-4 py-2.5 text-xs font-semibold text-white/85 transition hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          <Link
            href="/reserva-hora"
            className="mt-2 inline-flex rounded-full border border-[#d6a283] bg-[#c88d6d] px-5 py-2.5 text-xs font-semibold text-[#3f4145]"
            onClick={() => setMobileOpen(false)}
          >
            Agendar evaluacion
          </Link>
        </div>
      </div>
    </header>
  );
}
