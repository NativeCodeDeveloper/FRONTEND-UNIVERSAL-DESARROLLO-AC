"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarCheck, ArrowRight, BookOpen } from "lucide-react";
import RevealOnScroll from "@/Componentes/RevealOnScroll";

const CF_BASE = "https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ";
const FALLBACK_IMAGE = "/logoagendaclinica.png";

function PublicationCard({ item }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      className="group w-64 flex-shrink-0"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
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
        <div className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 leading-tight mb-1 line-clamp-1 min-h-[1.25rem]">
            {item.titulo || " "}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 min-h-[3.75rem]">
            {item.descripcion || "Publicación del centro médico."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-64 flex-shrink-0 opacity-50">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="w-full aspect-square bg-slate-100 animate-pulse" />
        <div className="p-4 space-y-2">
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
      <section id="publicaciones" className="scroll-mt-24 bg-white py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
          <RevealOnScroll>
            <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm md:p-8">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">

                {/* ── Left: info panel ──────────────────────── */}
                <div className="flex flex-col items-center text-center lg:col-span-3 lg:items-start lg:text-left">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-slate-500 lg:hidden">Contenido del centro</p>
                  </div>
                  <p className="hidden lg:block text-sm text-slate-500 mb-1">
                    Contenido del centro
                  </p>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
                      Publicaciones
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                    Conoce más antes de agendar
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Casos clínicos, tratamientos y novedades que este centro comparte para que llegues informado a tu consulta.
                  </p>
                  <Link
                    href="/agendaProfesionales"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.02] w-full max-w-xs justify-center lg:w-auto"
                  >
                    Agendar hora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* ── Right: carousel ───────────────────────── */}
                <div className="relative lg:col-span-9">
                  <div ref={carouselRef} className="overflow-x-auto hide-scrollbar">
                    <motion.div className="flex gap-4 px-1 py-2">
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
                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white shadow-md z-10 hidden md:flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-slate-700" />
                    </button>
                  )}

                  {/* Nav right */}
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

              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* CTA block */}
      <section id="agenda" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 md:px-8">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 px-6 py-16 text-center shadow-lg sm:px-12">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white opacity-5 mix-blend-overlay blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-indigo-400 opacity-20 mix-blend-overlay blur-3xl" />
              <div className="relative z-10">
                <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white mb-6">
                  Tu próxima hora está a un clic
                </h2>
                <p className="mx-auto max-w-xl text-lg text-indigo-100 mb-10">
                  Agenda en línea las 24 horas, sin llamadas ni esperas. Elige el profesional, el día y la hora que mejor se adapte a ti.
                </p>
                <Link
                  href="/agendaProfesionales"
                  className="inline-flex rounded-full bg-white px-8 py-4 font-bold text-indigo-600 transition hover:bg-slate-50 hover:scale-105 shadow-md"
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
