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
      className="scroll-mt-24 bg-slate-50 bg-cover bg-center md:bg-fixed py-20 text-slate-800 sm:py-28 overflow-hidden"
      style={{ backgroundImage: "url('/bg-swoosh-azul.webp')" }}
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">

        {/* Header */}
        <RevealOnScroll>
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
              Nuestros Servicios
            </h2>
            <p className="text-lg text-slate-600">
              Explora los tratamientos y servicios disponibles en este centro. Agenda tu hora directamente en línea, de forma rápida y sin llamadas.
            </p>
          </div>
        </RevealOnScroll>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="mt-16 flex gap-8 overflow-x-auto pb-4 select-none"
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
              className="relative shrink-0 w-[80vw] sm:w-[45vw] lg:w-[30vw] aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-slate-200 shadow-md group"
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
                className="transition duration-500 ease-out group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-slate-900/80 to-transparent pointer-events-none" />

              {/* Top Right Label */}
              <div className="absolute top-6 right-6 rounded-full bg-slate-900/90 backdrop-blur-md px-5 py-2 text-sm font-semibold text-white shadow-lg max-w-[80%] text-center truncate">
                {service.name}
              </div>

              {/* Bottom Description: título fijo en su posición original (no se mueve, no se
                  desconfigura la imagen). La descripción queda en una caja de alto fijo con
                  scroll interno propio: si el texto entra completo no se ve ninguna barra,
                  y solo aparece scroll cuando el texto es más largo de lo que cabe. */}
              <div className="absolute bottom-6 left-6 right-6 p-2 text-left">
                <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-md pointer-events-none">{service.name}</h3>
                <p className="text-white/80 text-sm leading-relaxed text-left max-h-24 overflow-y-auto pr-1">
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
