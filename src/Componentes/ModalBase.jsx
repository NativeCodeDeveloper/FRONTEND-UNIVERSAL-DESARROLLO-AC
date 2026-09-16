"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ModalBase
 * Mecanica comun a los modales de la plataforma: portal al body, cierre con Escape
 * y con el fondo, foco atrapado dentro del panel, bloqueo del scroll de atras,
 * restitucion del foco al cerrar y animacion de entrada.
 *
 * En movil se comporta como hoja inferior y en escritorio como dialogo centrado.
 *
 * Props:
 *   abierto      visibilidad
 *   onCerrar     se llama al pedir cierre (Escape, fondo o boton)
 *   titulo       encabezado del panel
 *   descripcion  texto opcional bajo el titulo
 *   pie          contenido del pie (acciones)
 *   ancho        clase de ancho maximo (default max-w-2xl)
 *   bloquearCierre  impide cerrar mientras hay una operacion en curso
 */
export default function ModalBase({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  pie,
  ancho = "max-w-2xl",
  bloquearCierre = false,
  children,
}) {
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef(null);
  const focoPrevioRef = useRef(null);

  useEffect(() => setMontado(true), []);

  const cerrar = useCallback(() => {
    if (bloquearCierre) return;
    onCerrar?.();
  }, [bloquearCierre, onCerrar]);

  useEffect(() => {
    if (!abierto) {
      setVisible(false);
      return undefined;
    }

    focoPrevioRef.current = document.activeElement;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const raf = requestAnimationFrame(() => {
      setVisible(true);
      // Primer control enfocable del panel, para poder escribir de inmediato.
      const primero = panelRef.current?.querySelector(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
      );
      primero?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflowPrevio;
      if (focoPrevioRef.current instanceof HTMLElement) {
        focoPrevioRef.current.focus();
      }
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        cerrar();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      } else if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [abierto, cerrar]);

  if (!montado || !abierto) return null;

  return createPortal(
    <div data-tour-modal className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        onClick={cerrar}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === "string" ? titulo : undefined}
        className={`relative flex max-h-[92dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl transition-all duration-300 ease-out sm:max-h-[90dvh] sm:rounded-[24px] ${
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:scale-[0.98]"
        }`}
      >
        {/* Tirador: en movil el panel se arrastra como hoja inferior. */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <header className="flex items-start justify-between gap-4 px-6 pb-3 pt-5 sm:px-8 sm:pt-7">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">{titulo}</h2>
            {descripcion ? (
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{descripcion}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={cerrar}
            disabled={bloquearCierre}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2 sm:px-8">{children}</div>

        {pie ? (
          <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-5">
            {pie}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
