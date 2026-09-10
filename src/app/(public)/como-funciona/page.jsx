"use client";

import RevealOnScroll from "@/Componentes/RevealOnScroll";
import Link from "next/link";
import { ScanFace, Aperture, FileText, Target } from "lucide-react";

const STEPS = [
    {
        step: 1,
        title: "Diagnóstico metabólico real",
        description: "Identificamos las causas de tu aumento de peso (hormonas, insulina, hábitos)",
        icon: ScanFace,
    },
    {
        step: 2,
        title: "Inicio de tratamiento médico",
        description: "Reducimos el apetito, controlamos la ansiedad y activamos tu metabolismo",
        icon: Aperture,
    },
    {
        step: 3,
        title: "Seguimiento continuo",
        description: "Ajustamos tu tratamiento semana a semana para asegurar resultados",
        icon: FileText,
    },
    {
        step: 4,
        title: "Resultados sostenibles",
        description: "Pierdes peso sin efecto rebote y mejoras tu salud metabólica",
        icon: Target,
    },
];

export default function ComoFuncionaPage() {
    return (
        <div className="bg-slate-50 min-h-screen pt-20 pb-24 md:pt-32 md:pb-32 lg:pt-40 lg:pb-40 text-slate-900">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <RevealOnScroll>
                    <div className="text-center mb-20 md:mb-28">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-slate-900">
                            ¿Cómo funciona el tratamiento?
                        </h2>
                        <p className="text-lg md:text-xl text-slate-600 font-light max-w-2xl mx-auto">
                            Un enfoque médico que ataca la <span className="text-slate-900 font-semibold">causa real de tu peso</span>
                        </p>
                    </div>
                </RevealOnScroll>

                {/* Progress Line with Steps */}
                <RevealOnScroll>
                    <div className="mb-20 md:mb-28">
                        {/* Progress Line - Desktop */}
                        <div className="hidden lg:flex items-center justify-between mb-16 relative px-6">
                            {STEPS.map((step, index) => (
                                <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                                    {/* Step Circle */}
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-lg z-10 relative">
                                        {step.step}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Steps Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
                            {STEPS.map((step, index) => {
                                const StepIcon = step.icon;
                                return (
                                    <RevealOnScroll 
                                        key={index}
                                        delayClass={`delay-${index * 75}`}
                                    >
                                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                                            {/* Mobile Step Number */}
                                            <div className="lg:hidden mb-4">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-900 font-bold text-sm">
                                                    {step.step}
                                                </span>
                                            </div>

                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 mb-6">
                                                <StepIcon strokeWidth={1.5} className="h-7 w-7" />
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">
                                                {step.title}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm md:text-base text-slate-600 font-light leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </RevealOnScroll>
                                );
                            })}
                        </div>
                    </div>
                </RevealOnScroll>

                {/* Results Text */}
                <RevealOnScroll className="text-center mb-12 md:mb-16">
                    <p className="text-lg md:text-2xl font-semibold text-slate-700">
                        <span className="text-slate-900">baja entre un 8–10% de tu exceso de peso en 3 meses.</span>
                    </p>
                </RevealOnScroll>

                {/* CTA Section */}
                <RevealOnScroll>
                    <div className="text-center">
                        <Link
                            href="/agendaProfesionales"
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-10 py-4 md:px-12 md:py-4 text-base md:text-lg font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                            Agenda tu evaluación médica →
                        </Link>
                        
                        <p className="text-sm md:text-base text-slate-500 font-light mt-6">
                            Cupos limitados por seguimiento personalizado
                        </p>
                    </div>
                </RevealOnScroll>

            </div>
        </div>
    );
}
