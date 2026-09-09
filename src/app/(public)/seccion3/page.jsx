"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarCheck, ArrowRight, BookOpen } from "lucide-react";
import RevealOnScroll from "@/Componentes/RevealOnScroll";
import ResenasSection from "@/Componentes/ResenasSection";

const CF_BASE = "https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ";
const FALLBACK_IMAGE = "/logoagendaclinica.png";

function PublicationCard({ item }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      className="group w-[17.5rem] flex-shrink-0 sm:w-72"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="overflow-hidden rounded-[1.75rem] bg-white">
        <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
          <img
            src={imgError ? FALLBACK_IMAGE : item.image}
            alt="Publicación"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        </div>
        {/* p-4 con alto fijo: title + description siempre reservan el mismo espacio
            (título con " " si no hay dato, descripción con min-h de 3 líneas)
            para que ninguna tarjeta quede más corta o más larga que las demás. */}
        <div className="p-5">
          <h3 className="mb-2 min-h-[1.25rem] line-clamp-1 text-base font-bold leading-tight tracking-[-0.015em] text-slate-900">
            {item.titulo || " "}
          </h3>
          <p className="min-h-[3.75rem] line-clamp-3 text-sm leading-6 text-slate-500">
            {item.descripcion || "Publicación del centro médico."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-[17.5rem] flex-shrink-0 opacity-50 sm:w-72">
      <div className="overflow-hidden rounded-[1.75rem] bg-white">
        <div className="w-full aspect-square bg-slate-100 animate-pulse" />
        <div className="space-y-2 p-5">
          <div className="h-3 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function Seccion3() {
  const carouselRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [listaPublicaciones, setListaPublicaciones] = useState([]);
  const API = process.env.NEXT_PUBLIC_API_URL;

  // PRESCRIPTION: DO NOT ALTER BACKEND FETCH LOGIC
  async function listarPublicacionesSeccion3() {
    try {
      const res = await fetch(`${API}/publicaciones/seleccionarPublicaciones`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
      });

      if (!res.ok) {
        console.error("No se han podido listar publicaciones.");
        setListaPublicaciones([]);
        return [];
      }

      const publicaciones = await res.json();
      setListaPublicaciones(publicaciones);
      return publicaciones;
    } catch (err) {
      console.error("Problema al consultar backend desde la vista frontend:" + err);
      setListaPublicaciones([]);
      return [];
    }
  }

  useEffect(() => {
    listarPublicacionesSeccion3();
  }, []);

  const publicaciones = listaPublicaciones.map((p, i) => ({
    id: p.id_publicaciones ?? i,
    titulo: p.tituloPublicaciones ?? null,
    descripcion: p.descripcionPublicaciones,
    image: `${CF_BASE}/${p.imagenPublicaciones_primera}/card`,
  }));

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
  }, [checkScrollPosition, listaPublicaciones]);

  return (
    <>
      <section id="publicaciones" className="scroll-mt-24 bg-white py-20 font-[family-name:var(--font-outfit)] sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
          <RevealOnScroll>
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-[#061a3a] p-6 sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-linear-to-r from-transparent via-sky-300/70 to-transparent" />
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">

                {/* ── Left: info panel ──────────────────────── */}
                <div className="flex flex-col items-center text-center lg:col-span-3 lg:items-start lg:text-left">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-white/65 lg:hidden">Contenido del centro</p>
                  </div>
                  <p className="mb-1 hidden text-sm text-white/65 lg:block">
                    Contenido del centro
                  </p>
                  <div className="mb-1 flex items-center gap-3">
                    <span className="text-xs font-semibold tracking-[0.16em] text-sky-200 uppercase">
                      Publicaciones
                    </span>
                  </div>
                  <h2 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
                    Conoce más antes de agendar
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-white/70">
                    Casos clínicos, tratamientos y novedades que este centro comparte para que llegues informado a tu consulta.
                  </p>
                  <Link
                    href="/agendaProfesionales"
                    className="mt-7 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#061a3a] transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-50 lg:w-auto"
                  >
                    Agendar hora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* ── Right: carousel ───────────────────────── */}
                <div className="relative lg:col-span-9">
                  <div ref={carouselRef} className="overflow-x-auto hide-scrollbar">
                    <motion.div className="flex gap-5 px-1 py-2 sm:gap-6">
                      {publicaciones.length > 0
                        ? publicaciones.map((item) => (
                            <PublicationCard key={item.id} item={item} />
                          ))
                        : [1, 2, 3].map((n) => <SkeletonCard key={n} />)}
                    </motion.div>
                  </div>

                  {/* Nav left */}
                  {!isAtStart && (
                    <button
                      onClick={() => scroll("left")}
                      aria-label="Desplazar izquierda"
                      className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white text-[#061a3a] transition-colors hover:bg-sky-50 md:flex"
                    >
                      <ChevronLeft className="h-5 w-5 text-slate-700" />
                    </button>
                  )}

                  {/* Nav right */}
                  {!isAtEnd && (
                    <button
                      onClick={() => scroll("right")}
                      aria-label="Desplazar derecha"
                      className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white text-[#061a3a] transition-colors hover:bg-sky-50 md:flex"
                    >
                      <ChevronRight className="h-5 w-5 text-slate-700" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <ResenasSection />

      {/* CTA block */}
      <section id="agenda" className="bg-white py-16 font-[family-name:var(--font-outfit)] sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 md:px-8">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#061a3a] px-6 py-16 text-center sm:px-12">
              <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-linear-to-r from-transparent via-sky-300/70 to-transparent" />
              <div className="relative z-10">
                <h2 className="mx-auto mb-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
                  Tu próxima hora está a un clic
                </h2>
                <p className="mx-auto mb-10 max-w-xl text-lg leading-8 text-white/70">
                  Agenda en línea las 24 horas, sin llamadas ni esperas. Elige el profesional, el día y la hora que mejor se adapte a ti.
                </p>
                <Link
                  href="/agendaProfesionales"
                  className="inline-flex rounded-full bg-white px-8 py-4 font-bold text-[#061a3a] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  Agendar mi hora
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
