"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { PROPORCION, imagenHD } from "@/lib/paginaPublica/imagenes";
import Carrusel from "@/Componentes/PaginaPublica/Comunes/Carrusel";
import ImagenTarjeta from "@/Componentes/PaginaPublica/Comunes/ImagenTarjeta";
import Modal from "@/Componentes/PaginaPublica/Comunes/Modal";

/*
 * Publicaciones del centro (GET /publicaciones/seleccionarPublicaciones).
 * El endpoint trae la descripción y hasta tres imágenes, recortadas 1:1 en el dashboard; no tiene
 * título. Si algún día se agrega tituloPublicaciones, se usa como título de la tarjeta.
 */
const imagenesDe = (p) =>
  [p.imagenPublicaciones_primera, p.imagenPublicaciones_segunda, p.imagenPublicaciones_tercera].map(imagenHD).filter(Boolean);

/*
 * Tarjeta de alto fijo: en escritorio, texto a la izquierda e imagen cuadrada a la derecha;
 * en celular, imagen cuadrada arriba y texto abajo. La descripción larga se desplaza dentro.
 */
export default function Publicaciones({ publicaciones }) {
  const [activa, setActiva] = useState(null);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const cerrar = useCallback(() => setActiva(null), []);
  const imagenesActiva = activa ? imagenesDe(activa) : [];
  const abrir = (p) => {
    setIndiceImagen(0);
    setActiva(p);
  };

  return (
    <>
      <Carrusel etiqueta="Publicaciones" anchoTarjeta="w-[80vw] max-w-[320px] sm:w-[580px] sm:max-w-none">
        {publicaciones.map((p) => {
          const [imagen] = imagenesDe(p);
          return (
            <button
              key={p.id_publicaciones}
              type="button"
              onClick={() => abrir(p)}
              className="caja caja-interactiva group flex h-[460px] w-full flex-col overflow-hidden text-left sm:grid sm:h-[290px] sm:grid-cols-[1fr_290px]"
            >
              <div className={`relative ${PROPORCION.publicacion} w-full shrink-0 overflow-hidden bg-niebla sm:order-2 sm:aspect-auto sm:h-full`}>
                <ImagenTarjeta src={imagen} sizes="(min-width: 640px) 290px, 80vw" />
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6 sm:order-1">
                {p.tituloPublicaciones && (
                  <h3 className="line-clamp-2 shrink-0 text-[18px] font-semibold leading-snug tracking-tight">{p.tituloPublicaciones}</h3>
                )}
                <p className="texto-desplazable mt-1 min-h-0 flex-1 overflow-y-auto pr-1 text-[16px] font-medium leading-[24px] tracking-tight">
                  {p.descripcionPublicaciones}
                </p>
                <span className="enlace mt-4 shrink-0 text-[15px]">Leer publicación</span>
              </div>
            </button>
          );
        })}
      </Carrusel>

      {/* Popup en dos columnas: la imagen cuadrada completa (sin recorte ni zoom) y el texto al lado */}
      <Modal
        abierto={!!activa}
        alCerrar={cerrar}
        titulo={activa?.tituloPublicaciones || String(activa?.descripcionPublicaciones ?? "Publicación").slice(0, 60)}
        ancho="max-w-[940px]"
      >
        {activa && (
          <article className="grid md:grid-cols-[minmax(0,460px)_1fr]">
            {imagenesActiva.length > 0 && (
              <div className="md:self-start">
                <div className={`relative ${PROPORCION.publicacion} w-full overflow-hidden bg-niebla`}>
                  <ImagenTarjeta src={imagenesActiva[indiceImagen]} sizes="(min-width: 768px) 460px, 100vw" zoom={false} />
                </div>
                {imagenesActiva.length > 1 && (
                  <div className="flex justify-center gap-2 py-3" role="tablist" aria-label="Imágenes de la publicación">
                    {imagenesActiva.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        role="tab"
                        aria-selected={i === indiceImagen}
                        aria-label={`Imagen ${i + 1} de ${imagenesActiva.length}`}
                        onClick={() => setIndiceImagen(i)}
                        className={`h-2 rounded-full transition-all duration-500 ${i === indiceImagen ? "w-6 bg-tinta" : "w-2 bg-linea hover:bg-tinta-3"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col p-7 sm:p-10">
              {activa.tituloPublicaciones && <h2 className="titular-2 mb-5 pr-8">{activa.tituloPublicaciones}</h2>}
              <p className="whitespace-pre-line pr-6 text-[17px] leading-relaxed text-tinta-2">{activa.descripcionPublicaciones}</p>
              <Link href="/agendaProfesionales" onClick={cerrar} className="boton boton-principal mt-8 self-start">
                Agendar hora
              </Link>
            </div>
          </article>
        )}
      </Modal>
    </>
  );
}
