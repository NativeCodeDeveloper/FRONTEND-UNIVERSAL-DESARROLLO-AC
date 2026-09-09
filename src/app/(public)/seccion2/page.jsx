'use client'

import RevealOnScroll from "@/Componentes/RevealOnScroll";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function Seccion2() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [infoData, setInfoData] = useState([]);

  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const fallbackServices = [
    {
      id: "srv-1",
      name: "Atención médica general",
      description: "Evaluación integral de salud, orientación profesional y seguimiento.",
      image: "/logoagendaclinica.png",
    },
    {
      id: "srv-2",
      name: "Tratamientos Metabólicos",
      description: "Planes personalizados para la salud a largo plazo.",
      image: "/logoagendaclinica.png",
    },
    {
      id: "srv-3",
      name: "Nutrición Clínica",
      description: "Orientación alimentaria para mejorar tu calidad de vida.",
      image: "/logoagendaclinica.png",
    },
  ];

  const services = infoData.map((item) => ({
    id: item.id_publicacionesTituloDescripcion,
    name: item.publicacionesTitulo,
    description: item.publicacionesDescripcion,
    image: `https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ/${item.publicacionesTituloDescripcionImagen}/card`,
  }));

  async function loadServices() {
    try {
      const res = await fetch(`${API}/publicacionesTituloDetalle/seleccionarPublicacionesTituloDetalle`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
      });

      if (!res.ok) return;

      const data = await res.json();
      setInfoData(data);
    } catch {
      console.warn("Could not load original seccion2 data, using fallbacks");
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const content = services.length > 0 ? services : fallbackServices;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || content.length <= 1) return undefined;

    const avanzarCarrusel = () => {
      if (isDragging.current) return;

      const primeraTarjeta = carousel.querySelector("article");
      const anchoTarjeta = primeraTarjeta?.getBoundingClientRect().width ?? carousel.clientWidth;
      const espacioEntreTarjetas = Number.parseFloat(window.getComputedStyle(carousel).gap) || 0;
      const siguientePosicion = carousel.scrollLeft + anchoTarjeta + espacioEntreTarjetas;
      const posicionFinal = carousel.scrollWidth - carousel.clientWidth;

      carousel.scrollTo({
        left: siguientePosicion >= posicionFinal - 4 ? 0 : siguientePosicion,
        behavior: "smooth",
      });
    };

    const primerAvance = window.setTimeout(avanzarCarrusel, 1200);
    const intervalo = window.setInterval(avanzarCarrusel, 3200);

    return () => {
      window.clearTimeout(primerAvance);
      window.clearInterval(intervalo);
    };
  }, [content.length]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
    carouselRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (carouselRef.current) carouselRef.current.style.cursor = "grab";
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (carouselRef.current) carouselRef.current.style.cursor = "grab";
  };

  return (
    <section
      id="servicios"
      className="relative scroll-mt-24 overflow-hidden bg-[#061a3a] py-20 font-[family-name:var(--font-outfit)] text-white sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-300/70 to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">

        {/* Header */}
        <RevealOnScroll>
          <div className="mb-12 flex flex-col justify-between gap-8 border-b border-white/15 pb-10 lg:mb-14 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold tracking-[0.18em] text-white/75 uppercase">
                  Atención diseñada para ti
                </span>
              </div>
              <h2 className="text-4xl font-extrabold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl xl:text-6xl">
                Nuestros servicios
              </h2>
            </div>
            <p className="max-w-md text-base leading-8 text-white/70 sm:text-lg">
              Explora los tratamientos y servicios disponibles en este centro. Agenda tu hora directamente en línea, de forma rápida y sin llamadas.
            </p>
          </div>
        </RevealOnScroll>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="flex gap-5 overflow-x-auto pb-10 pt-2 select-none sm:gap-6 lg:gap-8"
          style={{
            cursor: "grab",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {content.map((service, index) => (
            <article
              key={service.id ?? index}
              // aspect-[4/5] debe coincidir con SECCION2_CARD_ASPECT (FuncionesImagenCrop.js),
              // que es el ratio que usa el cropper de "Tratamientos Destacados". Con ancho responsivo
              // y aspect-ratio (en vez de un alto fijo), el recorte se ve igual en todos los breakpoints.
              className="group relative aspect-[4/5] w-[80vw] shrink-0 overflow-hidden rounded-[2rem] bg-slate-200 transition-transform duration-500 hover:-translate-y-2 sm:w-[45vw] lg:w-[30vw]"
              draggable={false}
            >
              {/* Background Full Image */}
              <Image
                src={service.image}
                alt={service.name}
                fill
                draggable={false}
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 45vw, 30vw"
                style={{ objectFit: "cover" }}
                className="transition duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-900/25 to-slate-950/10" />

              {/* Bottom Description: título fijo en su posición original (no se mueve, no se
                  desconfigura la imagen). La descripción queda en una caja de alto fijo con
                  scroll interno propio: si el texto entra completo no se ve ninguna barra,
                  y solo aparece scroll cuando el texto es más largo de lo que cabe. */}
              <div className="absolute bottom-7 left-7 right-7 text-left">
                <h3 className="pointer-events-none mb-3 text-2xl font-extrabold leading-[1.08] tracking-[-0.02em] text-white drop-shadow-md">
                  {service.name}
                </h3>
                <p className="max-h-24 overflow-y-auto pr-1 text-sm leading-6 text-white/80">
                  {service.description}
                </p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
