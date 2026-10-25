"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Muestra un PDF (Blob). En escritorio usa el visor del navegador (iframe); en
 * pantallas angostas dibuja cada página con pdf.js, porque iOS Safari no
 * muestra PDF dentro de un iframe.
 */
export default function VisorPdf({ blob, titulo = "Documento", alto = "70dvh" }) {
  const [url, setUrl] = useState(null);
  const [angosto, setAngosto] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 767px)");
    const actualizar = () => setAngosto(consulta.matches);
    actualizar();
    consulta.addEventListener("change", actualizar);
    return () => consulta.removeEventListener("change", actualizar);
  }, []);

  useEffect(() => {
    if (!blob) return undefined;
    const nueva = URL.createObjectURL(blob);
    setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [blob]);

  if (!blob || !url) {
    return <div className="w-full animate-pulse rounded-xl bg-slate-100" style={{ height: alto }} />;
  }

  if (!angosto) {
    return (
      <iframe
        title={titulo}
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        className="w-full rounded-xl border border-slate-200 bg-slate-50"
        style={{ height: alto }}
      />
    );
  }

  return <PaginasPdf blob={blob} titulo={titulo} />;
}

function PaginasPdf({ blob, titulo }) {
  const contenedorRef = useRef(null);
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    let cancelado = false;
    let tarea = null;
    const contenedor = contenedorRef.current;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        tarea = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false });
        const pdf = await tarea.promise;
        if (cancelado || !contenedor) return;
        contenedor.replaceChildren();
        const anchoCss = contenedor.clientWidth;
        const dpr = window.devicePixelRatio || 1;

        for (let n = 1; n <= pdf.numPages; n++) {
          const pagina = await pdf.getPage(n);
          if (cancelado) return;
          const base = pagina.getViewport({ scale: 1 });
          const vista = pagina.getViewport({ scale: (anchoCss / base.width) * dpr });
          const lienzo = document.createElement("canvas");
          lienzo.width = vista.width;
          lienzo.height = vista.height;
          lienzo.style.width = "100%";
          lienzo.className = "mb-3 rounded-lg border border-slate-200 bg-white shadow-sm";
          lienzo.setAttribute("aria-label", `${titulo}, página ${n} de ${pdf.numPages}`);
          contenedor.appendChild(lienzo);
          await pagina.render({ canvasContext: lienzo.getContext("2d"), viewport: vista }).promise;
        }
        if (!cancelado) setEstado("listo");
      } catch (error) {
        console.error("[VisorPdf]", error);
        if (!cancelado) setEstado("error");
      }
    })();

    return () => {
      cancelado = true;
      tarea?.destroy?.();
    };
  }, [blob, titulo]);

  return (
    <div>
      {estado === "cargando" ? <div className="h-96 w-full animate-pulse rounded-xl bg-slate-100" /> : null}
      {estado === "error" ? (
        <p className="rounded-xl bg-[#FF3B30]/10 px-3 py-2 text-[13px] text-[#D70015]">No se pudo mostrar el documento en este dispositivo.</p>
      ) : null}
      <div ref={contenedorRef} />
    </div>
  );
}
