"use client";

import Link from "next/link";
import { CalendarDays as Calendario } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ImagenTarjeta from "@/Componentes/PaginaPublica/Comunes/ImagenTarjeta";
import { PROPORCION, imagenHD } from "@/lib/paginaPublica/imagenes";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";
import { IconoFacebook, IconoInstagram, IconoWhatsapp } from "@/Componentes/PaginaPublica/Comunes/Iconos";

const INTERVALO = 6000;

/*
 * Portada del centro desde carruselPortada. La imagen llega recortada 1:1 desde portadaEdit,
 * así que llena su cuadro cuadrado completa, en alta resolución.
 * Si el centro todavía no publica portadas, se muestra su nombre sin columna de imagen.
 */
export default function Portada({ slides, datosEmpresa }) {
  const publicadas = slides.filter((s) => Number(s.estadoPublicacionPortada ?? 1) === 1);
  const activos = publicadas.length
    ? publicadas
    : [
        {
          id_publicacionesPortada: "sin-portada",
          tituloPortadaCarrusel: datosEmpresa.empresaNombre || "Agenda tu hora en línea",
          descripcionPublicacionesPortada: datosEmpresa.sobreNosotrosParrafo1 || "",
          imagenPortada: null,
        },
      ];
  const conImagen = activos.some((s) => imagenHD(s.imagenPortada));
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const ir = (siguiente) => setIndice(siguiente);
  const toque = useRef(null);
  const total = activos.length;

  useEffect(() => {
    if (total <= 1 || pausado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => ir((i) => (i + 1) % total), INTERVALO);
    return () => clearInterval(id);
  }, [total, pausado]);

  const enlaces = crearEnlaces(datosEmpresa);
  const whatsapp = enlaces.whatsapp(enlaces.mensajes.whatsappGeneral);
  const redes = [
    { href: datosEmpresa.socialInstagramUrl, etiqueta: "Instagram", Icono: IconoInstagram },
    { href: datosEmpresa.socialFacebookUrl, etiqueta: "Facebook", Icono: IconoFacebook },
    { href: whatsapp, etiqueta: "WhatsApp", Icono: IconoWhatsapp },
  ].filter((r) => r.href);

  return (
    <div
      className={`mx-auto grid w-full overflow-hidden rounded-[28px] bg-[#007f89] text-white shadow-[0_20px_70px_-45px_#00687366] md:rounded-[40px] ${conImagen ? "lg:grid-cols-2" : ""}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={(e) => (toque.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (toque.current === null || total <= 1) return;
        const distancia = (e.changedTouches[0]?.clientX ?? toque.current) - toque.current;
        if (Math.abs(distancia) > 45) ir((i) => (i + (distancia < 0 ? 1 : total - 1)) % total);
        toque.current = null;
      }}
    >
      <div className="order-2 flex min-w-0 flex-col justify-center bg-linear-to-br from-[#008b94] to-[#00747e] px-6 py-8 sm:px-10 sm:py-10 lg:order-1 lg:px-12 lg:py-12 xl:px-16">
        {/*
         * Todas las diapositivas en la misma celda: el bloque toma el alto de la más larga y no salta.
         * La saliente se desvanece rápido; la entrante aparece después, subiendo apenas.
         * La primera es el h1 (y el LCP): visible desde el primer render, sin animación de entrada.
         */}
        <div aria-hidden="true" className="mb-6 h-1 w-20 rounded-full bg-[#c6df76]" />
        <div className="grid">
          {activos.map((s, i) => {
            const visible = i === indice;
            const Titulo = i === 0 ? "h1" : "p";
            return (
              <div
                key={s.id_publicacionesPortada}
                aria-hidden={!visible}
                className={`col-start-1 row-start-1 min-w-0 transition-[opacity,translate,filter] ease-[cubic-bezier(0.28,0.11,0.32,1)] motion-reduce:transition-none ${
                  visible
                    ? "translate-y-0 opacity-100 blur-0 delay-300 duration-[900ms]"
                    : "pointer-events-none -translate-y-1 opacity-0 blur-[2px] duration-500"
                }`}
              >
                <Titulo className="text-[clamp(2rem,3.5vw,3.75rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-white [overflow-wrap:anywhere]">{s.tituloPortadaCarrusel || datosEmpresa.empresaNombre}</Titulo>
                {s.descripcionPublicacionesPortada && (
                  <p
                    className={`mt-4 whitespace-pre-line text-[18px] leading-relaxed text-pretty text-white/95 [overflow-wrap:anywhere] transition-[opacity,translate] ease-[cubic-bezier(0.28,0.11,0.32,1)] sm:text-[20px] lg:text-[22px] motion-reduce:transition-none ${
                      visible
                        ? "translate-y-0 opacity-100 delay-[420ms] duration-[900ms]"
                        : "translate-y-1 opacity-0 duration-500"
                    }`}
                  >
                    {s.descripcionPublicacionesPortada}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-3 lg:mt-8">
          <Link href="/agendaProfesionales" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-center text-[16px] font-semibold whitespace-nowrap text-[#007f89] transition-colors hover:bg-[#e6f6f6] focus-visible:outline-white sm:flex-none lg:min-h-14 lg:px-7 lg:text-[17px]">
            <Calendario aria-hidden="true" className="size-5 shrink-0" />
            Agendar hora
          </Link>
          <a href="#nosotros" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-white/85 px-6 py-3 text-center text-[16px] font-medium whitespace-nowrap text-white transition-colors hover:bg-white/10 focus-visible:outline-white sm:flex-none lg:min-h-14 lg:px-7 lg:text-[17px]">
            Conocer el centro
          </a>
        </div>
        {redes.length > 0 && (
          <div className="mt-6 flex items-center gap-3 border-t border-white/30 pt-5">
            {redes.map(({ href, etiqueta, Icono }) => (
              <a
                key={etiqueta}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={etiqueta}
                className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-white sm:size-12"
              >
                <Icono className="size-5" />
              </a>
            ))}
          </div>
        )}
      </div>

      {conImagen && (
      <div className="relative order-1 min-w-0 bg-[#dbe9eb] lg:order-2">
        <div className={`relative ${PROPORCION.portada} overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[430px]`}>
          {activos.map((s, i) => {
            const src = imagenHD(s.imagenPortada);
            if (!src) return null;
            const visible = i === indice;
            return (
              <div
                key={s.id_publicacionesPortada}
                className={`absolute inset-0 transition-[opacity,scale] duration-[1400ms] ease-[cubic-bezier(0.28,0.11,0.32,1)] motion-reduce:transition-none ${
                  visible ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
                }`}
                aria-hidden={!visible}
              >
                <ImagenTarjeta src={src} alt={s.tituloPortadaCarrusel || datosEmpresa.empresaNombre} sizes="(min-width: 1180px) 578px, (min-width: 1024px) 50vw, 100vw" prioridad={i === 0} zoom={false} className="object-top" />
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" role="tablist" aria-label="Portadas">
            {activos.map((s, i) => (
              <button
                key={s.id_publicacionesPortada}
                type="button"
                role="tab"
                aria-selected={i === indice}
                aria-label={`Portada ${i + 1} de ${total}`}
                onClick={() => ir(() => i)}
                className={`h-3 rounded-full border border-[#007f89]/25 shadow-sm transition-all duration-500 ${i === indice ? "w-8 bg-[#007f89]" : "w-3 bg-white/90 hover:bg-white"}`}
              />
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
