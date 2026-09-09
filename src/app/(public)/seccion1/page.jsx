"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "@/Componentes/RevealOnScroll";

export default function Seccion1() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [sobreNosotros, setSobreNosotros] = useState("");
  const [primerParrafo, setPrimerParrafo] = useState("");
  const [segundoParrafo, setSegundoParrafo] = useState("");

  async function cargarContenido() {
    try {
      const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const datosEmpresa = Array.isArray(data) ? data[0] : data;

      setSobreNosotros(datosEmpresa?.sobreNosotrosTitulo || "");
      setPrimerParrafo(datosEmpresa?.sobreNosotrosParrafo1 || "");
      setSegundoParrafo(datosEmpresa?.sobreNosotrosParrafo2 || "");
    } catch (err) {
      console.error("Error cargando datos de empresa", err);
    }
  }

  useEffect(() => {
    cargarContenido();
  }, []);

  const tituloSobreNosotros = sobreNosotros || "Sobre Nosotros";
  const descripcionPrincipal =
    primerParrafo ||
    "Brindamos acompanamiento profesional con una mirada cercana, respetuosa y especializada.";
  const descripcionSecundaria =
    segundoParrafo ||
    "Trabajamos para fortalecer el bienestar y entregar orientacion profesional en cada etapa.";

  return (
    <section
      id="sobre-nosotros"
      className="relative scroll-mt-24 overflow-hidden bg-white py-20 font-[family-name:var(--font-outfit)] sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-200 to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <RevealOnScroll>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 xl:gap-28">

            <div className="max-w-xl">
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-sky-100 bg-slate-50 px-4 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold tracking-[0.18em] text-slate-600 uppercase">
                  Conoce nuestro centro
                </span>
              </div>
              <div className="mb-7 h-px w-16 bg-indigo-600" />
              <h2 className="max-w-lg text-4xl font-extrabold leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-5xl xl:text-6xl">
                {tituloSobreNosotros}
              </h2>
              <p className="mt-8 max-w-xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-8">
                {descripcionPrincipal}
              </p>
            </div>

            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_65px_-38px_rgba(15,23,42,0.28)] sm:p-10 lg:p-12">
              <div className="absolute left-0 top-10 h-20 w-1 rounded-r-full bg-linear-to-b from-sky-400 to-indigo-700" />
              <div className="pl-4 sm:pl-5">
                <p className="text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
                  {descripcionSecundaria}
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-5">
                  <Link
                    href="/agendaProfesionales"
                    className="group inline-flex items-center gap-3 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_24px_-12px_rgba(30,58,138,0.75)] transition-all duration-300 hover:bg-indigo-700 hover:-translate-y-0.5"
                  >
                    Reservar una hora
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <span className="text-sm font-medium text-slate-500">
                    Estamos para orientarte
                  </span>
                </div>
              </div>
            </div>

          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
