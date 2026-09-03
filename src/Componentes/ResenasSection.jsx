"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RevealOnScroll from "@/Componentes/RevealOnScroll";
import TestimonialCard from "@/Componentes/TestimonialCard";
import AgregarResenaModal from "@/Componentes/AgregarResenaModal";
import { useTodasLasResenas } from "@/hooks/useResenas";

function SkeletonTestimonial() {
  return (
    <div className="h-full w-80 flex-shrink-0 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-5 w-5 rounded-full bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="space-y-2 mb-8">
        <div className="h-3 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-full animate-pulse w-4/5" />
        <div className="h-3 bg-slate-100 rounded-full animate-pulse w-3/5" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-100 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ResenasSection() {
  const { resenas, cargando, recargar } = useTodasLasResenas();
  const [modalAbierto, setModalAbierto] = useState(false);

  const carouselRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    const newScrollLeft =
      carouselRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount);
    carouselRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  const checkScrollPosition = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setIsAtStart(scrollLeft < 10);
    setIsAtEnd(scrollWidth - scrollLeft - clientWidth < 10);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();
    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition, resenas]);

  return (
    <section
      id="testimonios"
      className="scroll-mt-24 bg-slate-50 bg-cover bg-center md:bg-fixed py-20 sm:py-28"
      style={{ backgroundImage: "url('/bg-swoosh-azul.webp')" }}
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Lo que dicen nuestros pacientes
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Experiencias reales de pacientes atendidos en nuestro centro.
            </p>
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.02]"
            >
              Agregar testimonio
            </button>
          </div>

          {!cargando && resenas.length === 0 ? (
            <p className="mt-12 text-center text-sm text-slate-400">
              Todavía no hay testimonios. ¡Sé el primero en dejar el tuyo!
            </p>
          ) : (
            <div className="relative mt-12">
              <div ref={carouselRef} className="overflow-x-auto hide-scrollbar">
                <div className="flex items-stretch gap-6 px-1 py-2">
                  {cargando
                    ? [1, 2, 3].map((n) => <SkeletonTestimonial key={n} />)
                    : resenas.map((r) => {
                        const nombrePaciente = [r.nombrePaciente, r.apellidoPaciente]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                        const nombreInvitado = [r.nombre_invitado, r.apellido_invitado]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                        const nombreCompleto = nombrePaciente || nombreInvitado;

                        return (
                          <div key={r.id_resena} className="w-80 flex-shrink-0">
                            <TestimonialCard
                              nombre={nombreCompleto || "Paciente AgendaClínica"}
                              puntuacion={r.rating}
                              servicio={r.nombreProfesional ? `Paciente de ${r.nombreProfesional}` : "Paciente verificado"}
                              comentario={r.comentario}
                            />
                          </div>
                        );
                      })}
                </div>
              </div>

              {!isAtStart && (
                <button
                  onClick={() => scroll("left")}
                  aria-label="Desplazar izquierda"
                  className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white shadow-md z-10 hidden md:flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-700" />
                </button>
              )}

              {!isAtEnd && (
                <button
                  onClick={() => scroll("right")}
                  aria-label="Desplazar derecha"
                  className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white shadow-md z-10 hidden md:flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-slate-700" />
                </button>
              )}
            </div>
          )}
        </RevealOnScroll>
      </div>

      <AgregarResenaModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSuccess={recargar}
      />
    </section>
  );
}
