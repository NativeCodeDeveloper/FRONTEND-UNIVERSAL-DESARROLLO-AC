"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconoCerrar } from "@/Componentes/PaginaPublica/Comunes/Iconos";

/* Ventana modal tipo "tarjeta expandida" de Apple. Cierra con Esc o clic fuera. */
export default function Modal({ abierto, alCerrar, titulo, children, ancho = "max-w-[720px]" }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const alTeclear = (e) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", alTeclear);
      previo?.focus();
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div className="pp-tipografia fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="animar-velo absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={alCerrar} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`animar-modal relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-flotante outline-none sm:rounded-[28px] ${ancho}`}
      >
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar"
          className="sticky right-4 top-4 z-10 float-right mr-4 mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-tinta/80 text-white backdrop-blur transition-colors hover:bg-tinta"
        >
          <IconoCerrar className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
