"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { IconoChevron } from "@/Componentes/PaginaPublica/Comunes/Iconos";

const DURACION = 700;

/* Curva suave de entrada y salida, como el desplazamiento de las galerías de apple.com */
const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/*
 * Pista horizontal alineada al contenedor de 1120px: la primera tarjeta parte bajo el título
 * de la sección y el resto se asoma hacia la derecha, como en apple.com.
 *
 * Las flechas avanzan una "página" (las tarjetas que caben completas) con una animación propia:
 * durante la animación se suspende el snap del navegador, que si no corrige la posición a mitad
 * de camino y produce un salto. Al deslizar con el dedo o el trackpad manda el snap nativo.
 */
export default function Carrusel({ children, etiqueta, anchoTarjeta }) {
  const pista = useRef(null);
  const animacion = useRef(null);
  const [alInicio, setAlInicio] = useState(true);
  const [alFinal, setAlFinal] = useState(false);

  const medir = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    setAlInicio(el.scrollLeft < 8);
    setAlFinal(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => {
      observador.disconnect();
      if (animacion.current) cancelAnimationFrame(animacion.current);
    };
  }, [medir]);

  const desplazarA = (el, destino) => {
    if (animacion.current) cancelAnimationFrame(animacion.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollLeft = destino;
      return;
    }
    const origen = el.scrollLeft;
    const inicio = performance.now();
    el.style.scrollSnapType = "none";
    const paso = (ahora) => {
      const t = Math.min((ahora - inicio) / DURACION, 1);
      el.scrollLeft = origen + (destino - origen) * suavizar(t);
      if (t < 1) {
        animacion.current = requestAnimationFrame(paso);
      } else {
        el.style.scrollSnapType = "";
        animacion.current = null;
        medir();
      }
    };
    animacion.current = requestAnimationFrame(paso);
  };

  const mover = (sentido) => {
    const el = pista.current;
    if (!el) return;
    const tarjetas = Array.from(el.children);
    if (tarjetas.length === 0) return;

    // Distancia de cada tarjeta a su posición de reposo (alineada con el título)
    const margen = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const izquierda = el.getBoundingClientRect().left + margen;
    const distancias = tarjetas.map((t) => t.getBoundingClientRect().left - izquierda);

    const actual = distancias.reduce((mejor, d, i) => (Math.abs(d) < Math.abs(distancias[mejor]) ? i : mejor), 0);
    const anchoPaso = tarjetas.length > 1 ? distancias[1] - distancias[0] : tarjetas[0].offsetWidth;
    const porPagina = Math.max(1, Math.floor((el.clientWidth - margen) / anchoPaso));
    const destinoIndice = Math.min(Math.max(actual + sentido * porPagina, 0), tarjetas.length - 1);

    const maximo = el.scrollWidth - el.clientWidth;
    desplazarA(el, Math.min(Math.max(el.scrollLeft + distancias[destinoIndice], 0), maximo));
  };

  const margen = "max(1.25rem, calc((100vw - 1120px) / 2 + 1.5rem))";

  return (
    <div>
      <ul
        ref={pista}
        onScroll={medir}
        aria-label={etiqueta}
        className="sin-barra flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-8 pt-2"
        style={{ paddingInline: margen, scrollPaddingInline: margen }}
      >
        {Children.map(children, (hijo) => (
          <li className={`shrink-0 snap-start ${anchoTarjeta}`}>{hijo}</li>
        ))}
      </ul>

      {!(alInicio && alFinal) && (
        <div className="mx-auto flex max-w-[1120px] justify-end gap-3 px-5 md:px-6">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={alInicio}
            aria-label={`${etiqueta}: anteriores`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e8ed] text-tinta transition-[background-color,opacity] duration-300 hover:bg-[#dcdce1] disabled:opacity-40"
          >
            <IconoChevron direccion="izquierda" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={alFinal}
            aria-label={`${etiqueta}: siguientes`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e8ed] text-tinta transition-[background-color,opacity] duration-300 hover:bg-[#dcdce1] disabled:opacity-40"
          >
            <IconoChevron className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
