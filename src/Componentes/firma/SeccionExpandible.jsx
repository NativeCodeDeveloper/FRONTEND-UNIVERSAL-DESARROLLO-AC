"use client";

import { useId } from "react";

/**
 * Sección colapsable accesible para formularios largos. Controlada: el padre
 * decide qué está abierto (así puede abrirla desde un enlace "Completar").
 *
 * Se anima con grid-rows 0fr → 1fr, que no necesita medir alturas en JS.
 */
export default function SeccionExpandible({
  titulo,
  descripcion,
  insignia,
  abierta,
  onAlternar,
  deshabilitada = false,
  children,
  dataCampo,
}) {
  const id = useId();
  const idContenido = `${id}-contenido`;

  return (
    <section data-campo={dataCampo} className="font-system-apple rounded-2xl border border-slate-200 bg-white">
      <h3 className="m-0 font-normal tracking-normal">
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={idContenido}
          disabled={deshabilitada}
          onClick={onAlternar}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:hover:bg-transparent sm:px-5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${abierta ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="min-w-0 flex-1">
            <span className={`block text-[14px] font-semibold ${deshabilitada ? "text-slate-400" : "text-slate-900"}`}>
              {titulo}
            </span>
            {descripcion ? <span className="mt-0.5 block text-[12px] font-normal text-slate-500">{descripcion}</span> : null}
          </span>
          {insignia}
        </button>
      </h3>

      <div
        id={idContenido}
        role="region"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${abierta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={!abierta}>
          <div className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
