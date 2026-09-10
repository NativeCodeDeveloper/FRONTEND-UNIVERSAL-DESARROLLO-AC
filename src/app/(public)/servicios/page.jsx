"use client";

import Link from "next/link";
import { Fingerprint, Hexagon, Component } from "lucide-react";
import RevealOnScroll from "@/Componentes/RevealOnScroll";

const tratamientos = [
  {
    title: "Terapia GLP-1",
    subtitle: "Regulación Metabólica Dúo",
    description: "Mediante análogos de GLP-1 (Semaglutida/Tirzepatida) regulamos directamente los centros de saciedad anatómicos, controlando el hambre fisiológico y optimizando el vaciado gástrico para una adherencia perfecta al programa.",
    icon: Component,
    colorClass: "bg-slate-100 text-slate-700",
    linkInfo: "/programa"
  },
  {
    title: "Manejo de Obesidad",
    subtitle: "Reset Estructural",
    description: "Abordamos la obesidad no como una falta de voluntad, sino como una condición biológica. Intervenimos con prescripción de última generación para revertir el almacenamiento crónico y recuperar tu peso base sano.",
    icon: Fingerprint,
    colorClass: "bg-slate-100 text-slate-700",
    linkInfo: "/programa"
  },
  {
    title: "SOP & Insulinorresistencia",
    subtitle: "Equilibrio Hormonal",
    description: "Estabilizamos el eje hormonal femenino metabólico. Controlando la sensibilidad cruzada a la insulina abordamos desde adentro la niebla mental, la fatiga y los descontroles de peso asociados al Síndrome de Ovario Poliquístico.",
    icon: Hexagon,
    colorClass: "bg-slate-100 text-slate-700",
    linkInfo: "/programa"
  }
];

export default function ServicioPage() {
  return (
    <main className="bg-[#f8f9fa] text-slate-900 pt-32 pb-32 min-h-screen">

      {/* Header Section */}
      <section className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10 mb-20 lg:mb-32 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <RevealOnScroll>
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-bold tracking-tight text-slate-900 leading-[1.05] mb-6">
              Nuestros<br />
              Tratamientos
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 font-light max-w-lg">
              Ciencia y precisión clínica para un manejo metabólico inteligente y sostenible.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayClass="delay-200">
          <Link
            href="/agendaProfesionales"
            className="inline-flex rounded-full border border-slate-900 px-8 py-3.5 text-sm md:text-base font-medium text-slate-900 transition hover:bg-slate-900 hover:text-white whitespace-nowrap"
          >
            Agendar Evaluación
          </Link>
        </RevealOnScroll>
      </section>

      {/* Treatments Grid - Staggered layout */}
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-3 lg:gap-14 lg:px-10 mb-32 items-start">
        {tratamientos.map((tratamiento, index) => {
          const Icon = tratamiento.icon;
          // Apply a staggered offset for middle items
          const staggerClass = index === 1 ? "lg:mt-24" : index === 2 ? "lg:mt-12" : "";

          return (
            <RevealOnScroll key={index} delayClass={`delay-${index * 100}`}>
              <article className={`group relative flex flex-col h-full bg-transparent ${staggerClass}`}>
                {/* Number indicator above the card mimicking the reference */}
                <span className="text-slate-500 font-medium text-lg mb-4 block">
                  0{index + 1}
                </span>

                {/* Visual Area - Clean soft background instead of aggressive borders */}
                <div className={`
                  w-full rounded-[2rem] bg-white p-16 flex items-center justify-center mb-8
                  transition-transform duration-700 ease-out group-hover:-translate-y-3
                `}>
                  <div className={`inline-flex h-24 w-24 items-center justify-center rounded-3xl ${tratamiento.colorClass}`}>
                    <Icon strokeWidth={1} className={`h-14 w-14 ${index === 1 ? 'animate-icon-beat' : 'animate-icon-bounce-slow'}`} />
                  </div>
                </div>

                {/* Minimal Typography below */}
                <h2 className="text-xl md:text-2xl font-medium text-slate-900 mb-2">
                  {tratamiento.title}
                </h2>
                <h3 className="text-[13px] md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-6">
                  {tratamiento.subtitle}
                </h3>

                <p className="text-slate-500 font-light leading-relaxed text-[15px] mb-8">
                  {tratamiento.description}
                </p>

                <div className="flex items-center text-slate-900 font-medium text-sm transition-all cursor-pointer w-fit border-b border-transparent group-hover:border-slate-900 pb-1">
                  Ver detalles
                </div>
              </article>
            </RevealOnScroll>
          );
        })}
      </section>

      {/* Bottom Conversion Block - Redesigned cleanly */}
      <section className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10 mt-20">
        <RevealOnScroll>
          <div className="flex flex-col md:flex-row gap-12 items-center justify-between rounded-[2rem] bg-white p-12 md:p-20">
            <div className="max-w-xl">
              <h3 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900 mb-4">
                Transforma tu Vida Hoy.
              </h3>
              <p className="text-slate-500 text-lg font-light">
                Conoce tu elegibilidad clínica resolviendo nuestro breve test metabólico.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/programa"
                className="rounded-full border border-slate-900 px-8 py-3.5 text-sm md:text-base font-medium text-slate-900 transition hover:bg-slate-900 hover:text-white text-center"
              >
                Hacer Test Metabólico
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

    </main>
  );
}
