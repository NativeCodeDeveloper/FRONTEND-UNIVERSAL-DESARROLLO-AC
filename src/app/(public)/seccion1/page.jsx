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
      className="scroll-mt-24 bg-white py-20 sm:py-28 border-t border-slate-100"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <RevealOnScroll>
          <div className="rounded-[2.5rem] border border-slate-100 bg-slate-50 p-6 shadow-sm sm:p-10 lg:p-14">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-start">

              {/* Left */}
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight mb-7">
                  {tituloSobreNosotros}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed text-justify">
                  {descripcionPrincipal}
                </p>
              </div>

              {/* Right */}
              <div className="flex flex-col gap-8 lg:pt-16">
                <p className="text-lg text-slate-600 leading-relaxed text-justify">
                  {descripcionSecundaria}
                </p>
                <Link
                  href="/agendaProfesionales"
                  className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:scale-[1.02] w-fit"
                >
                  Reservar una hora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
