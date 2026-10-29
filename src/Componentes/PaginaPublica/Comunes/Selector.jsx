"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconoCheck, IconoChevron } from "@/Componentes/PaginaPublica/Comunes/Iconos";

const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/*
 * Lista desplegable con buscador (aparece desde 8 opciones) y navegación por teclado.
 * El panel va en un portal con position fixed: así ningún contenedor con overflow lo recorta.
 *
 * compacto: el disparador mide y se ve igual que un input .campo (para usarlo dentro de
 *           un formulario junto a otros campos).
 * conBuscador: fuerza mostrar u ocultar el buscador; por defecto, desde 8 opciones.
 */

/* Barra fija inferior de la reserva (solo en celular): el panel no debe quedar debajo de ella. */
function limiteInferiorVisible() {
  const barra = document.querySelector(".barra-reserva");
  const r = barra?.getBoundingClientRect();
  return r && r.height > 0 ? Math.min(r.top, window.innerHeight) : window.innerHeight;
}

export default function Selector({ opciones, valor, alCambiar, placeholder, etiqueta, invalido = false, compacto = false, conBuscador }) {
  const id = useId();
  const disparador = useRef(null);
  const panel = useRef(null);
  const buscador = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resaltado, setResaltado] = useState(0);
  const [posicion, setPosicion] = useState(null);

  const buscable = conBuscador ?? opciones.length >= 8;
  const seleccionada = opciones.find((o) => o.valor === valor) ?? null;
  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return q ? opciones.filter((o) => normalizar(o.etiqueta).includes(q)) : opciones;
  }, [opciones, busqueda]);

  const ubicar = useCallback(() => {
    const r = disparador.current?.getBoundingClientRect();
    if (!r) return;
    const margen = 12;
    const abajo = limiteInferiorVisible() - r.bottom - margen;
    const encima = r.top - margen;
    const arriba = abajo < 280 && encima > abajo;
    setPosicion({
      top: arriba ? r.top - 8 : r.bottom + 8,
      left: r.left,
      width: r.width,
      maxHeight: Math.min(400, (arriba ? encima : abajo) - 8),
      arriba,
    });
  }, []);

  const abrir = () => {
    ubicar();
    setBusqueda("");
    setResaltado(
      Math.max(
        0,
        opciones.findIndex((o) => o.valor === valor),
      ),
    );
    setAbierto(true);
  };

  const cerrar = useCallback((devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) disparador.current?.focus();
  }, []);

  const elegir = (o) => {
    alCambiar(o.valor);
    cerrar();
  };

  useLayoutEffect(() => {
    if (!abierto) return;
    if (buscable) buscador.current?.focus();
    else panel.current?.focus();
  }, [abierto, buscable]);

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => {
      const t = e.target;
      if (!panel.current?.contains(t) && !disparador.current?.contains(t)) cerrar(false);
    };
    const alMover = (e) => {
      if (panel.current?.contains(e.target)) return;
      ubicar();
    };
    document.addEventListener("mousedown", alClicFuera);
    window.addEventListener("scroll", alMover, true);
    window.addEventListener("resize", ubicar);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      window.removeEventListener("scroll", alMover, true);
      window.removeEventListener("resize", ubicar);
    };
  }, [abierto, cerrar, ubicar]);

  /* Mantiene visible la opción resaltada al moverse con las flechas */
  useEffect(() => {
    if (!abierto) return;
    panel.current?.querySelector(`[data-indice="${resaltado}"]`)?.scrollIntoView({ block: "nearest" });
  }, [resaltado, abierto]);

  function alTeclear(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setResaltado((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setResaltado((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = filtradas[resaltado];
      if (o) elegir(o);
    } else if (e.key === "Escape") {
      /* Que el Esc cierre solo la lista y no el modal que la contiene */
      e.preventDefault();
      e.stopPropagation();
      cerrar();
    } else if (e.key === "Tab") {
      cerrar(false);
    }
  }

  return (
    <>
      <button
        ref={disparador}
        type="button"
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={(e) => {
          if (!abierto && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            abrir();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-label={seleccionada ? `${etiqueta}: ${seleccionada.etiqueta}` : etiqueta}
        className={`flex w-full items-center justify-between gap-4 bg-white text-left transition-shadow duration-200 ${
          compacto
            ? "min-h-[48px] rounded-[12px] px-4 py-3 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--pp-acento),0_0_0_4px_var(--pp-acento-suave)]"
            : "min-h-[56px] rounded-[14px] px-5 py-3"
        } ${
          abierto
            ? "shadow-[inset_0_0_0_2px_var(--pp-acento),0_0_0_4px_var(--pp-acento-suave)]"
            : invalido
              ? "shadow-[inset_0_0_0_2px_#e30000]"
              : "shadow-[inset_0_0_0_1px_var(--pp-linea)] hover:shadow-[inset_0_0_0_1px_var(--pp-tinta-3)]"
        }`}
      >
        {seleccionada ? (
          <span className="min-w-0">
            <span className={`block truncate text-[17px] ${compacto ? "" : "font-medium"}`}>{seleccionada.etiqueta}</span>
            {seleccionada.descripcion && <span className="block text-[14px] text-tinta-2">{seleccionada.descripcion}</span>}
          </span>
        ) : (
          <span className="text-[17px] text-tinta-3">{placeholder}</span>
        )}
        <span className="flex shrink-0 items-center gap-3">
          {seleccionada?.extra && <span className="text-[17px] font-semibold tabular-nums">{seleccionada.extra}</span>}
          <IconoChevron
            className={`h-4 w-4 rotate-90 text-tinta-2 transition-transform duration-300 ${abierto ? "-rotate-90" : ""}`}
          />
        </span>
      </button>

      {abierto &&
        posicion &&
        createPortal(
          <div
            ref={panel}
            tabIndex={-1}
            onKeyDown={alTeclear}
            className={`pp-tipografia animar-desplegable fixed z-[60] flex flex-col overflow-hidden rounded-[16px] bg-white/95 shadow-flotante outline-none ring-1 ring-black/[0.06] backdrop-blur-xl ${
              posicion.arriba ? "-translate-y-full origin-bottom" : "origin-top"
            }`}
            style={{ top: posicion.top, left: posicion.left, width: posicion.width, maxHeight: posicion.maxHeight }}
          >
            {buscable && (
              <div className="shrink-0 border-b border-linea-suave p-2">
                <input
                  ref={buscador}
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setResaltado(0);
                  }}
                  placeholder={`Buscar entre ${opciones.length} opciones`}
                  aria-label={`Buscar ${etiqueta.toLowerCase()}`}
                  aria-controls={`${id}-lista`}
                  aria-activedescendant={filtradas[resaltado] ? `${id}-${filtradas[resaltado].valor}` : undefined}
                  className="h-10 w-full rounded-[10px] bg-niebla px-3.5 text-[16px] outline-none placeholder:text-tinta-3"
                />
              </div>
            )}
            <ul
              id={`${id}-lista`}
              role="listbox"
              aria-label={etiqueta}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
            >
              {filtradas.length === 0 && <li className="px-4 py-6 text-center text-[15px] text-tinta-2">Sin resultados</li>}
              {filtradas.map((o, i) => {
                const activo = o.valor === valor;
                return (
                  <li
                    key={o.valor}
                    id={`${id}-${o.valor}`}
                    role="option"
                    aria-selected={activo}
                    data-indice={i}
                    onMouseEnter={() => setResaltado(i)}
                    onClick={() => elegir(o)}
                    className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-3.5 py-2.5 transition-colors ${i === resaltado ? "bg-niebla" : ""}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center text-acento ${activo ? "" : "invisible"}`}
                    >
                      <IconoCheck className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[16px] leading-snug ${activo ? "font-semibold" : "font-medium"}`}>
                        {o.etiqueta}
                      </span>
                      {o.descripcion && <span className="block text-[13px] text-tinta-2">{o.descripcion}</span>}
                    </span>
                    {o.extra && <span className="shrink-0 text-[15px] font-medium tabular-nums text-tinta-2">{o.extra}</span>}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
