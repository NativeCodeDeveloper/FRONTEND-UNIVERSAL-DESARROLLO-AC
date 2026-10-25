"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bloquesDeTexto } from "@/lib/consentimientos/textosLegales";

/**
 * Muestra un texto legal versionado (acta FES, política de datos,
 * derechos y deberes del paciente). Hoja inferior en móvil, diálogo centrado en escritorio.
 *
 * Puede abrirse encima de otro modal (p. ej. ProfesionalModal): escucha Escape
 * y Tab en fase de captura sobre window, que corre antes que el listener de
 * document del modal de abajo, y los detiene para que no cierre a los dos.
 */
export default function TextoLegalModal({ abierto, titulo, version, cuerpo, onCerrar, accionPrincipal }) {
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef(null);
  const botonCerrarRef = useRef(null);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!abierto) {
      setVisible(false);
      return undefined;
    }
    const focoPrevio = document.activeElement;
    const raf = requestAnimationFrame(() => {
      setVisible(true);
      botonCerrarRef.current?.focus();
    });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        event.preventDefault();
        onCerrar();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      event.stopImmediatePropagation();
      const focusables = panelRef.current.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])");
      if (!focusables.length) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (!panelRef.current.contains(document.activeElement)) {
        event.preventDefault();
        primero.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      } else if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown, true);
      if (focoPrevio instanceof HTMLElement) focoPrevio.focus();
    };
  }, [abierto, onCerrar]);

  if (!montado || !abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div
        onClick={onCerrar}
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="texto-legal-titulo"
        className={`font-system-apple relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-[24px] ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pb-4 pt-4 sm:px-8 sm:pt-6">
          <div className="min-w-0">
            <h2 id="texto-legal-titulo" className="text-[17px] font-semibold tracking-tight text-slate-900">
              {titulo}
            </h2>
            {version ? <p className="mt-0.5 text-[12px] text-slate-500">Versión {version}</p> : null}
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 text-[14px] leading-relaxed text-slate-700 sm:px-8">
          {bloquesDeTexto(cuerpo).map((bloque, i) => {
            if (bloque.tipo === "titulo") {
              return (
                <h3 key={i} className="mb-2 mt-5 text-[14px] font-semibold text-slate-900 first:mt-0">
                  {bloque.texto}
                </h3>
              );
            }
            if (bloque.tipo === "subtitulo") {
              return <h4 key={i} className="mb-1.5 mt-3 text-[13px] font-semibold text-slate-800">{bloque.texto}</h4>;
            }
            if (bloque.tipo === "lista") {
              return (
                <ul key={i} className="mb-3 list-disc space-y-1.5 pl-5 marker:text-slate-300">
                  {bloque.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              );
            }
            return <p key={i} className="mb-3 text-justify hyphens-auto" lang="es">{bloque.texto}</p>;
          })}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCerrar}
            className="h-11 rounded-xl px-5 text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Cerrar
          </button>
          {accionPrincipal ? (
            <button
              type="button"
              onClick={accionPrincipal.onClick}
              className="h-11 rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {accionPrincipal.etiqueta}
            </button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body
  );
}
