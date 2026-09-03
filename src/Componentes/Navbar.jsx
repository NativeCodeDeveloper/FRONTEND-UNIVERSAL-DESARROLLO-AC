"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Inicio", href: "/#inicio" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Sobre Nosotros", href: "/#sobre-nosotros" },
  { label: "Publicaciones", href: "/#publicaciones" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex flex-col items-center px-4 pt-4 sm:pt-6 pointer-events-none transition-all duration-300">

      {/* Navbar Pill */}
      <div
        className={[
          "pointer-events-auto flex items-center justify-between gap-8 rounded-full border transition-all duration-500 lg:gap-14",
          scrolled
            ? "bg-white/70 backdrop-blur-xl border-slate-200/40 shadow-md shadow-slate-200/10 py-2.5 px-4 sm:px-6"
            : "bg-transparent border-transparent shadow-none py-3.5 px-4 sm:px-6"
        ].join(" ")}
      >
        {/* Desktop Links */}
        <nav aria-label="Menu principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-[14px] font-semibold tracking-wide text-slate-700 transition-colors duration-300 hover:text-indigo-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
          <Link
            href="/agendaProfesionales"
            aria-label="Agendar hora"
            className="hidden rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition duration-300 hover:bg-indigo-700 hover:scale-105 sm:inline-flex"
          >
            Agendar hora
          </Link>

          <button
            type="button"
            aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Dropdown */}
      <div
        className={[
          "pointer-events-auto mt-4 w-full max-w-6xl overflow-hidden rounded-4xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out origin-top lg:hidden",
          isOpen ? "max-h-105 opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-95 border-transparent"
        ].join(" ")}
      >
        <div className="flex flex-col gap-2 p-5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-700 transition duration-300 hover:bg-slate-50 hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-slate-100 pt-4">
            <Link
              href="/agendaProfesionales"
              onClick={() => setIsOpen(false)}
              className="block w-full rounded-2xl bg-indigo-600 px-5 py-4 text-center text-[15px] font-bold text-white shadow transition duration-300 hover:bg-indigo-700"
            >
              Agendar hora
            </Link>
          </div>
        </div>
      </div>

    </header>
  );
}
