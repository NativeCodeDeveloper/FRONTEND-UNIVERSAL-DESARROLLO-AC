"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, CalendarCheck, Headphones } from "lucide-react";
import RevealOnScroll from "@/Componentes/RevealOnScroll";

const TIER_FEATURES = [
    "Consulta médica inicial completa",
    "Evaluación metabólica + plan de tratamiento individualizado",
    "Seguimiento médico continuo durante 3 meses",
];

const BENEFITS = [
    {
        title: "Control médico especializado",
        description: "Seguimiento seguro, profesional y basado en evidencia",
        icon: ShieldCheck,
    },
    {
        title: "Plan de 3 meses",
        description: "Baja en promedio entre 8% y 10% de tu peso corporal",
        icon: CalendarCheck,
    },
    {
        title: "Soporte continuo",
        description: "Atención y ajustes cada semana para asegurar tu progreso",
        icon: Headphones,
    },
];

const METABOLIC_QUESTIONS = [
    {
        question: "¿Has intentado bajar de peso anteriormente sin resultados sostenibles?",
        options: ["Varias veces", "Solo una vez", "Nunca he intentado formalmente"],
    },
    {
        question: "¿Sientes fatiga frecuente o falta de energía después de comer?",
        options: ["Casi siempre", "A veces", "Nunca"],
    },
    {
        question: "¿Tienes historial o diagnóstico de resistencia a la insulina o SOP?",
        options: ["Sí, diagnosticado", "Sospecho tenerlo", "No tengo"],
    },
];

export default function ProgramaPage() {
    const [testStep, setTestStep] = useState(0);
    const [testAnswers, setTestAnswers] = useState([]);
    const [testCompleted, setTestCompleted] = useState(false);

    const handleOptionSelect = (option) => {
        const newAnswers = [...testAnswers, option];
        setTestAnswers(newAnswers);
        if (testStep < METABOLIC_QUESTIONS.length - 1) {
            setTestStep(testStep + 1);
        } else {
            setTestCompleted(true);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pt-20 pb-24 md:pt-32 md:pb-32 lg:pt-40 lg:pb-40 text-slate-900">

            {/* Hero */}
            <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mb-24 lg:mb-32">
                <RevealOnScroll>
                    <div className="space-y-12">

                        <div className="space-y-6">
                            <p className="text-xs tracking-[0.2em] uppercase text-slate-400 font-medium">
                                Programa médico — 3 meses
                            </p>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.0] text-slate-900">
                                Inicia tu programa<br />
                                <span className="font-light text-slate-500">de pérdida de peso</span>
                            </h1>
                            <p className="text-base md:text-lg text-slate-500 font-light leading-relaxed max-w-lg">
                                Evaluación metabólica completa, tratamiento farmacológico avanzado y seguimiento semanal personalizado.
                            </p>
                        </div>

                        <div className="w-full h-px bg-slate-200"></div>

                        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">

                            <div className="space-y-5">
                                {TIER_FEATURES.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <span className="text-xs text-slate-400 font-mono mt-1 select-none">0{i + 1}</span>
                                        <span className="text-sm md:text-base text-slate-700 font-light leading-relaxed">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs tracking-[0.15em] uppercase text-slate-400 font-medium mb-3">Inversión</p>
                                    <div className="flex items-end gap-4">
                                        <span className="text-5xl md:text-6xl font-bold text-slate-900 leading-none">$200.000</span>
                                        <div className="pb-1 space-y-0.5">
                                            <p className="text-sm text-slate-400 line-through">$280.000</p>
                                            <p className="text-xs text-slate-900 font-semibold">— 29% off</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Link
                                        href="/agendaProfesionales"
                                        className="group inline-flex items-center justify-between w-full bg-slate-900 hover:bg-slate-800 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300"
                                    >
                                        Agendar evaluación médica
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="#test-metabolico"
                                        className="inline-flex items-center justify-center w-full rounded-lg border border-slate-200 hover:border-slate-300 bg-white px-6 py-3.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                                    >
                                        Evaluar mi elegibilidad
                                    </Link>
                                </div>

                                <p className="text-xs text-slate-400">
                                    Cupos limitados — consulta sin costo adicional
                                </p>
                            </div>
                        </div>

                    </div>
                </RevealOnScroll>
            </section>

            {/* Benefits */}
            <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mb-24 lg:mb-32">
                <RevealOnScroll>
                    <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
                        {BENEFITS.map((benefit, index) => {
                            const BenefitIcon = benefit.icon;
                            return (
                                <RevealOnScroll key={index} delayClass={`delay-${index * 100}`}>
                                    <article className="group flex flex-col h-full bg-white rounded-3xl p-7 transition-transform duration-500 ease-out hover:-translate-y-1.5">
                                        <div className="inline-flex w-11 h-11 items-center justify-center rounded-2xl bg-slate-100 mb-5">
                                            <BenefitIcon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2 leading-snug">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-light leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </article>
                                </RevealOnScroll>
                            );
                        })}
                    </div>
                </RevealOnScroll>
            </section>

            {/* Test Inteligente */}
            <section id="test-metabolico" className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
                <RevealOnScroll>
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900">
                        <Image src="/fondometa.webp" 
                        alt="fondo test metabolico" 
                        fill 
                        className="object-container opacity-40" />
                        <div className="absolute inset-0 bg-slate-900/30" />

                        <div className="relative z-10 px-8 md:px-12 pt-10 pb-8 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <p className="text-xs tracking-[0.2em] uppercase text-slate-300 font-medium mb-2">Evaluación rápida</p>
                                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1 leading-tight">
                                    Test Inteligente
                                </h2>
                            </div>
                            <p className="text-sm text-white font-light md:text-right">
                                3 preguntas para saber<br className="hidden md:block" /> si eres candidato
                            </p>
                        </div>

                        <div className="relative z-10 px-8 md:px-12 py-10">
                            <div className="w-full bg-white rounded-xl p-8 md:p-10 border border-slate-100 shadow-sm">
                                {!testCompleted ? (
                                    <div className="w-full text-center space-y-6">
                                        <div className="flex justify-center gap-2">
                                            {METABOLIC_QUESTIONS.map((_, i) => (
                                                <div key={i} className={`h-1 w-12 rounded-full transition-all duration-300 ${i <= testStep ? "bg-slate-900" : "bg-slate-100"}`} />
                                            ))}
                                        </div>

                                        <h3 className="text-lg md:text-xl font-light text-slate-900 leading-relaxed">
                                            {METABOLIC_QUESTIONS[testStep].question}
                                        </h3>

                                        <div className="flex flex-col gap-2">
                                            {METABOLIC_QUESTIONS[testStep].options.map((option, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleOptionSelect(option)}
                                                    className="w-full text-left bg-transparent border border-slate-200 hover:border-slate-900 hover:bg-slate-50 rounded-full px-6 py-3.5 text-sm font-light text-slate-700 hover:text-slate-900 transition-all duration-200 flex items-center justify-between group"
                                                >
                                                    {option}
                                                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full text-center space-y-5 py-4">
                                        <div className="space-y-2">
                                            <p className="text-xs tracking-[0.15em] uppercase text-slate-500 font-medium">Resultado</p>
                                            <h3 className="text-2xl font-semibold text-slate-900">
                                                Eres candidato al programa
                                            </h3>
                                            <p className="text-slate-500 text-sm font-light leading-relaxed max-w-xs mx-auto">
                                                Tu perfil indica alta compatibilidad. Un médico revisará tu caso en la consulta inicial.
                                            </p>
                                        </div>
                                        <Link
                                            href="/agendaProfesionales"
                                            className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 px-7 py-3 text-sm font-semibold text-white transition-all duration-300"
                                        >
                                            Agendar evaluación médica
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </RevealOnScroll>
            </section>

        </div>
    );
}
