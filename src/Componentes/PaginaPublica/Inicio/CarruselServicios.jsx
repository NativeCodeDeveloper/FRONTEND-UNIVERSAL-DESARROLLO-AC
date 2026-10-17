"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { PROPORCION, imagenHD } from "@/lib/paginaPublica/imagenes";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";
import Carrusel from "@/Componentes/PaginaPublica/Comunes/Carrusel";
import ImagenTarjeta from "@/Componentes/PaginaPublica/Comunes/ImagenTarjeta";
import { IconoMas } from "@/Componentes/PaginaPublica/Comunes/Iconos";
import Modal from "@/Componentes/PaginaPublica/Comunes/Modal";

/*
 * Servicios (GET /publicacionesTituloDetalle/seleccionarPublicacionesTituloDetalle).
 * La imagen llega recortada 4:5 desde el dashboard y llena su recuadro 4:5. Las tarjetas tienen
 * alto fijo: el título usa dos líneas como máximo y la descripción larga se desplaza dentro.
 */
export default function CarruselServicios({ servicios, datosEmpresa }) {
  const [activo, setActivo] = useState(null);
  const cerrar = useCallback(() => setActivo(null), []);
  const enlaces = crearEnlaces(datosEmpresa);
  const whatsapp = activo ? enlaces.whatsapp(enlaces.mensajes.whatsappServicio(activo.publicacionesTitulo)) : null;
  const imagenActiva = activo ? imagenHD(activo.publicacionesTituloDescripcionImagen) : null;

  return (
    <>
      <Carrusel etiqueta="Servicios" anchoTarjeta="w-[80vw] max-w-[320px] sm:w-[320px]">
        {servicios.map((s) => (
          <article key={s.id_publicacionesTituloDescripcion} className="caja flex h-[560px] flex-col overflow-hidden">
            <button
              type="button"
              onClick={() => setActivo(s)}
              tabIndex={-1}
              aria-hidden
              className={`group relative ${PROPORCION.servicio} w-full shrink-0 overflow-hidden bg-niebla`}
            >
              <ImagenTarjeta src={imagenHD(s.publicacionesTituloDescripcionImagen)} sizes="(min-width: 640px) 320px, 80vw" />
            </button>
            <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-4">
              <h3 className="line-clamp-2 shrink-0 text-[17px] font-semibold leading-[1.25] tracking-tight">{s.publicacionesTitulo}</h3>
              <div className="texto-desplazable mt-1 min-h-0 flex-1 overflow-y-auto pr-1 text-[14px] leading-[20px] text-tinta-2">
                {s.publicacionesDescripcion}
              </div>
              <div className="mt-2 flex shrink-0 items-center justify-between">
                <button type="button" onClick={() => setActivo(s)} className="enlace text-[15px]">
                  Ver más
                </button>
                <button
                  type="button"
                  onClick={() => setActivo(s)}
                  aria-label={`Ver más sobre ${s.publicacionesTitulo}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-tinta text-white transition-colors hover:bg-acento"
                >
                  <IconoMas className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </Carrusel>

      {/* Popup en dos columnas: la imagen en su proporción exacta (sin recorte ni zoom) y el texto al lado */}
      <Modal abierto={!!activo} alCerrar={cerrar} titulo={activo?.publicacionesTitulo ?? ""} ancho="max-w-[900px]">
        {activo && (
          <article className="grid md:grid-cols-[minmax(0,400px)_1fr]">
            {imagenActiva && (
              <div className={`relative ${PROPORCION.servicio} w-full overflow-hidden bg-niebla md:self-start`}>
                <ImagenTarjeta src={imagenActiva} alt={activo.publicacionesTitulo} sizes="(min-width: 768px) 400px, 100vw" zoom={false} />
              </div>
            )}
            <div className="flex flex-col p-7 sm:p-10">
              <h2 className="titular-2 pr-8">{activo.publicacionesTitulo}</h2>
              <p className="mt-4 whitespace-pre-line text-[17px] leading-relaxed text-tinta-2">{activo.publicacionesDescripcion}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/agendaProfesionales" className="boton boton-principal" onClick={cerrar}>
                  Agendar hora
                </Link>
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="boton boton-tenue">
                    Consultar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </article>
        )}
      </Modal>
    </>
  );
}
