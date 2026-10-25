"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { imprimirPdf } from "@/lib/documentos/imprimirPdf";
import VisorPdf from "@/Componentes/documentos/VisorPdf";

const ICONO_IMPRESORA = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

/**
 * Salida única de las recetas: ver el PDF y luego imprimirlo para firmar de puño
 * y letra.
 *
 * Las recetas NO se firman electrónicamente en la plataforma: para su
 * dispensación en farmacia la normativa exige firma electrónica avanzada (FEA),
 * y ni la firma simple ni una declaración del profesional la reemplazan.
 * El documento se manda a la impresora sin descargarse al equipo.
 */
export default function ImpresionManuscrita({
  generarPdf,
  deshabilitado = false,
  etiqueta = "Imprimir para firmar",
  titulo = "Receta",
  className = "",
  nota = "Las recetas se firman de puño y letra. La firma electrónica simple no es válida para su dispensación en farmacia.",
}) {
  const [blob, setBlob] = useState(null);
  const [preparando, setPreparando] = useState(false);
  const [enlaceRespaldo, setEnlaceRespaldo] = useState(null);

  // generarPdf valida el formulario y avisa con un toast si falta algo (devuelve null).
  async function obtenerPdf() {
    try {
      return await generarPdf();
    } catch (error) {
      console.error("[ImpresionManuscrita]", error);
      toast.error("No se pudo generar el documento.");
      return null;
    }
  }

  async function verPrevia() {
    setPreparando(true);
    const generado = await obtenerPdf();
    setPreparando(false);
    if (generado) setBlob(generado);
  }

  async function imprimir(pdf) {
    setEnlaceRespaldo(null);
    try {
      const resultado = await imprimirPdf(pdf);
      if (resultado.modo === "bloqueado") setEnlaceRespaldo(resultado.url);
    } catch (error) {
      console.error("[ImpresionManuscrita]", error);
      toast.error("No se pudo abrir la impresión.");
    }
  }

  async function imprimirDirecto() {
    setPreparando(true);
    const generado = await obtenerPdf();
    setPreparando(false);
    if (generado) await imprimir(generado);
  }

  return (
    <div className={`font-system-apple space-y-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={verPrevia}
          disabled={deshabilitado || preparando}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC] disabled:opacity-50 sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {preparando ? "Preparando…" : "Vista previa"}
        </button>
        <button
          type="button"
          onClick={imprimirDirecto}
          disabled={deshabilitado || preparando}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F2F2F7] px-5 text-[14px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#E5E5EA] disabled:opacity-50 sm:w-auto"
        >
          {ICONO_IMPRESORA}
          {etiqueta}
        </button>
      </div>
      {nota ? <p className="text-[12px] leading-snug text-[#6E6E73]">{nota}</p> : null}
      {enlaceRespaldo ? <EnlaceRespaldo url={enlaceRespaldo} /> : null}

      <ModalVistaPrevia
        blob={blob}
        titulo={titulo}
        nota={nota}
        etiqueta={etiqueta}
        onCerrar={() => setBlob(null)}
        onImprimir={() => imprimir(blob)}
        enlaceRespaldo={enlaceRespaldo}
      />
    </div>
  );
}

function EnlaceRespaldo({ url }) {
  return (
    <p className="rounded-xl bg-[#F2F2F7] px-3 py-2 text-[12px] text-[#3C3C43]">
      El navegador bloqueó la ventana de impresión.{" "}
      <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-[#007AFF]">
        Abrir el documento para imprimir
      </a>
    </p>
  );
}

function ModalVistaPrevia({ blob, titulo, nota, etiqueta, onCerrar, onImprimir, enlaceRespaldo }) {
  const botonCerrarRef = useRef(null);

  useEffect(() => {
    if (!blob) return undefined;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => botonCerrarRef.current?.focus());
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKey);
    };
  }, [blob, onCerrar]);

  if (!blob || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div onClick={onCerrar} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vista-previa-titulo"
        className="font-system-apple relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]"
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#D1D1D6]" />
        </div>
        <header className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-5 pb-3 pt-3 sm:px-7 sm:pt-5">
          <div className="min-w-0">
            <h2 id="vista-previa-titulo" className="truncate text-[16px] font-semibold tracking-tight text-[#1D1D1F]">{titulo}</h2>
            <p className="text-[12px] text-[#6E6E73]">Vista previa · para firmar de puño y letra</p>
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8E8E93] transition-colors hover:bg-[#F2F2F7] hover:text-[#1D1D1F]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7">
          <VisorPdf blob={blob} titulo={titulo} alto="66dvh" />
        </div>

        <footer className="space-y-2 border-t border-black/[0.06] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] leading-snug text-[#6E6E73] sm:max-w-md">{nota}</p>
            <button
              type="button"
              onClick={onImprimir}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC]"
            >
              {ICONO_IMPRESORA}
              {etiqueta}
            </button>
          </div>
          {enlaceRespaldo ? <EnlaceRespaldo url={enlaceRespaldo} /> : null}
        </footer>
      </div>
    </div>,
    document.body
  );
}
