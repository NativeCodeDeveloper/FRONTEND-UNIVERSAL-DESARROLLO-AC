"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Facebook,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CF_BASE = "https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ";

const fallbackSlides = [
  { id: "fallback-1", image: "/logoagendaclinica.png", alt: "Centro Médico", titulo: "", descripcion: "" },
];

function normalizeWhatsAppNumber(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

export default function Portada() {
  const [dataPortada, setDataPortada] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [sobreNosotros, setSobreNosotros] = useState("");
  const [datosEmpresa, setDatosEmpresa] = useState(null);
  const touchStartX = useRef(null);
  const API = process.env.NEXT_PUBLIC_API_URL;
  const fallbackSobreNosotrosTitulo =
    process.env.NEXT_PUBLIC_ABOUT_TITLE || "Psicologia infantil integral";

  // ── Lógica original intacta ───────────────────────────
  async function cargarPortada() {
    try {
      const res = await fetch(`${API}/carruselPortada/seleccionarCarruselPortada`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
      });
      if (!res.ok) { setDataPortada([]); return; }
      const data = await res.json();
      setDataPortada(Array.isArray(data) ? data : []);
    } catch {
      setDataPortada([]);
    }
  }

  async function cargarTitulos() {
    try {
      const res = await fetch(`${API}/titulo`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const t1 = data.find((i) => Number(i.id_titulo) === 1);
      const t3 = data.find((i) => Number(i.id_titulo) === 3);
      if (t1?.titulo) setTitulo(t1.titulo);
      if (t3?.titulo) setSobreNosotros(t3.titulo);
    } catch {
      // silencioso
    }
  }

  async function cargarDatosEmpresa() {
    try {
      const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
      });

      if (!res.ok) return;

      const data = await res.json();
      const empresa = Array.isArray(data) ? data[0] : data;
      setDatosEmpresa(empresa || null);
    } catch {
      setDatosEmpresa(null);
    }
  }

  useEffect(() => {
    cargarPortada();
    cargarTitulos();
    cargarDatosEmpresa();
  }, []);

  // ── Slides desde el backend ───────────────────────────
  const backendSlides = dataPortada
    .filter((item) => Number(item.estadoPublicacionPortada ?? 1) === 1)
    .map((item, index) => ({
      id: `portada-${item.id_publicacionesPortada ?? index}`,
      image: item.imagenPortada
        ? `${CF_BASE}/${item.imagenPortada}/portada`
        : "/logoagendaclinica.png",
      alt: item.tituloPortadaCarrusel || "Centro Médico",
      titulo: item.tituloPortadaCarrusel || "",
      descripcion: item.descripcionPublicacionesPortada || "",
    }));

  const safeSlides = useMemo(
    () => (backendSlides.length > 0 ? backendSlides : fallbackSlides),
    [backendSlides]
  );

  // ── Autoplay (5.2 s) ─────────────────────────────────
  useEffect(() => {
    if (safeSlides.length <= 1) return undefined;
    const id = setInterval(() => {
      setActiveIndex((c) => (c + 1) % safeSlides.length);
    }, 5200);
    return () => clearInterval(id);
  }, [safeSlides.length]);

  // ── Navegación ────────────────────────────────────────
  const goPrev = () =>
    setActiveIndex((c) => (c - 1 + safeSlides.length) % safeSlides.length);
  const goNext = () =>
    setActiveIndex((c) => (c + 1) % safeSlides.length);

  // ── Swipe táctil ─────────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dist = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (Math.abs(dist) > 45) { if (dist > 0) goPrev(); else goNext(); }
    touchStartX.current = null;
  };

  const currentSlide = safeSlides[activeIndex] ?? fallbackSlides[0];
  const whatsappNumber = datosEmpresa?.contactoWhatsapp || datosEmpresa?.contactoTelefono || "";
  const socialLinks = [
    { icon: Instagram, href: datosEmpresa?.socialInstagramUrl, label: "Instagram" },
    { icon: Facebook, href: datosEmpresa?.socialFacebookUrl, label: "Facebook" },
    {
      icon: MessageCircle,
      href: whatsappNumber ? `https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}` : "",
      label: "WhatsApp",
    },
  ].filter((item) => item.href);

  return (
    <section
      id="inicio"
      className="relative w-full overflow-hidden bg-white bg-cover bg-center md:bg-fixed min-h-screen flex flex-col items-center justify-center pt-20 pb-10"
      style={{ backgroundImage: "url('/bg-swoosh-azul.jpg')" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mx-auto w-full max-w-5xl px-4">

        {/* ── Desktop — TestimonialCarousel layout ─────── */}
        <div className="hidden md:flex relative items-center justify-center">

          {/* Imagen izquierda */}
          <div className="w-[470px] h-[470px] rounded-3xl overflow-hidden bg-slate-200 flex-shrink-0 shadow-xl shadow-slate-200/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <img
                  src={imageErrors[currentSlide.id] ? "/logoagendaclinica.png" : currentSlide.image}
                  alt={currentSlide.alt}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={() =>
                    setImageErrors((c) => ({ ...c, [currentSlide.id]: true }))
                  }
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Card solapada derecha */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 p-8 ml-[-40px] z-10 max-w-xl flex-1">

            {/* AC badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Agenda Clínica
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + "-card"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="mb-5">
                  {/* Título viene del portadaEdit (tituloPortadaCarrusel) */}
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight mb-2">
                    {currentSlide.titulo || "Tu Centro Médico"}
                  </h1>
                </div>

                {/* Descripción del slide o sobreNosotros */}
                {(currentSlide.descripcion || sobreNosotros) && (
                  <p className="text-base text-slate-600 leading-relaxed text-justify mb-7">
                    {currentSlide.descripcion || sobreNosotros || fallbackSobreNosotrosTitulo}
                  </p>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 mb-7">
                  <Link
                    href="/agendaProfesionales"
                    className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.02]"
                  >
                    Agendar hora
                  </Link>
                  <a
                    href="#sobre-nosotros"
                    className="inline-flex items-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:text-indigo-600"
                  >
                    Sobre nosotros
                  </a>
                </div>

                {/* Social icons */}
                <div className="flex gap-3">
                  {socialLinks.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center transition-all hover:bg-indigo-600 hover:scale-105"
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile ──────────────────────────────────────── */}
        <div className="md:hidden max-w-sm mx-auto text-center">

          {/* Imagen */}
          <div className="w-full aspect-square rounded-3xl overflow-hidden mb-6 bg-slate-200 shadow-lg shadow-slate-200/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + "-mobile-img"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <img
                  src={imageErrors[currentSlide.id] ? "/logoagendaclinica.png" : currentSlide.image}
                  alt={currentSlide.alt}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={() =>
                    setImageErrors((c) => ({ ...c, [currentSlide.id]: true }))
                  }
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Card content mobile */}
          <div className="px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Agenda Clínica
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + "-mobile-card"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
                  {currentSlide.titulo || "Tu Centro Médico"}
                </h1>
                {(currentSlide.descripcion || sobreNosotros) && (
                  <p className="text-slate-600 text-sm leading-relaxed text-justify mb-6">
                    {currentSlide.descripcion || sobreNosotros || fallbackSobreNosotrosTitulo}
                  </p>
                )}
                <div className="flex justify-center flex-wrap gap-3 mb-6">
                  <Link
                    href="/agendaProfesionales"
                    className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700"
                  >
                    Agendar hora
                  </Link>
                  <a
                    href="#sobre-nosotros"
                    className="inline-flex items-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                    Sobre nosotros
                  </a>
                </div>
                <div className="flex justify-center gap-3">
                  {socialLinks.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center transition-all hover:bg-indigo-600"
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Navegación inferior — solo si hay más de 1 slide ── */}
        {safeSlides.length > 1 && (
          <div className="flex justify-center items-center gap-6 mt-10">
            <button
              onClick={goPrev}
              aria-label="Slide anterior"
              className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6 text-slate-700" />
            </button>

            <div className="flex gap-2">
              {safeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={cn(
                    "h-3 rounded-full transition-all duration-300 cursor-pointer",
                    idx === activeIndex
                      ? "bg-slate-900 w-6"
                      : "bg-slate-300 w-3 hover:bg-slate-400"
                  )}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              aria-label="Slide siguiente"
              className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-6 w-6 text-slate-700" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
