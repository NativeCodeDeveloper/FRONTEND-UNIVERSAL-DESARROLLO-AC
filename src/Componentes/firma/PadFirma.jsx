"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { TINTAS } from "@/lib/firma/constantes";
import { recortarYNormalizar } from "@/lib/firma/procesarTrazo";

const GROSOR = 2.4;

/**
 * Lienzo para dibujar la firma con mouse, dedo o lápiz (Pointer Events).
 *
 * Guarda los trazos como vectores en coordenadas CSS y redibuja desde ellos:
 * al girar el teléfono o cambiar el ancho del modal, el lienzo se ajusta sin
 * perder la firma. Cambiar la tinta redibuja todo en el nuevo color (una firma,
 * un color).
 *
 * Expone por ref `exportar()` → {blob, url, ancho, alto} | null, para la vista
 * previa y el envío. El servidor vuelve a recortar y normalizar.
 */
const PadFirma = forwardRef(function PadFirma({ tinta = "azul", onCambioTinta, onCambio, deshabilitado = false }, ref) {
  const contenedorRef = useRef(null);
  const lienzoRef = useRef(null);
  const trazosRef = useRef([]);
  const actualRef = useRef(null);
  const [cantidad, setCantidad] = useState(0);

  const color = TINTAS[tinta]?.color || TINTAS.azul.color;

  const redibujar = useCallback(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    const ctx = lienzo.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = GROSOR;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    for (const trazo of trazosRef.current) {
      if (trazo.length === 1) {
        // Un toque sin movimiento: un punto, como el de una "i".
        ctx.beginPath();
        ctx.arc(trazo[0].x, trazo[0].y, GROSOR / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      // Curvas por puntos medios: el trazo sale suave aunque el puntero reporte pocos eventos.
      ctx.beginPath();
      ctx.moveTo(trazo[0].x, trazo[0].y);
      for (let i = 1; i < trazo.length - 1; i++) {
        const medioX = (trazo[i].x + trazo[i + 1].x) / 2;
        const medioY = (trazo[i].y + trazo[i + 1].y) / 2;
        ctx.quadraticCurveTo(trazo[i].x, trazo[i].y, medioX, medioY);
      }
      const ultimo = trazo[trazo.length - 1];
      ctx.lineTo(ultimo.x, ultimo.y);
      ctx.stroke();
    }
  }, [color]);

  const notificar = useCallback(() => {
    setCantidad(trazosRef.current.length);
    onCambio?.({ vacio: trazosRef.current.length === 0, trazos: trazosRef.current });
  }, [onCambio]);

  // Ajusta el tamaño real del lienzo al del contenedor y a la densidad de la pantalla.
  useEffect(() => {
    const contenedor = contenedorRef.current;
    const lienzo = lienzoRef.current;
    if (!contenedor || !lienzo) return undefined;

    const ajustar = () => {
      const { width, height } = contenedor.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const anchoPrevio = lienzo.width / dpr || width;
      if (anchoPrevio && width && Math.abs(anchoPrevio - width) > 1 && trazosRef.current.length) {
        // Escala horizontal proporcional: la firma conserva su posición relativa.
        const factor = width / anchoPrevio;
        trazosRef.current = trazosRef.current.map((t) => t.map((p) => ({ ...p, x: p.x * factor })));
      }
      lienzo.width = Math.round(width * dpr);
      lienzo.height = Math.round(height * dpr);
      lienzo.style.width = `${width}px`;
      lienzo.style.height = `${height}px`;
      redibujar();
    };

    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, [redibujar]);

  useEffect(() => {
    redibujar();
  }, [redibujar]);

  function punto(evento) {
    const r = lienzoRef.current.getBoundingClientRect();
    return { x: evento.clientX - r.left, y: evento.clientY - r.top, t: Math.round(evento.timeStamp) };
  }

  function alPresionar(evento) {
    if (deshabilitado || (evento.pointerType === "mouse" && evento.button !== 0)) return;
    evento.preventDefault();
    lienzoRef.current.setPointerCapture(evento.pointerId);
    actualRef.current = [punto(evento)];
    trazosRef.current = [...trazosRef.current, actualRef.current];
    redibujar();
  }

  function alMover(evento) {
    if (!actualRef.current) return;
    evento.preventDefault();
    // getCoalescedEvents recupera los puntos intermedios que el navegador agrupa.
    const eventos = evento.nativeEvent.getCoalescedEvents?.() || [evento.nativeEvent];
    for (const e of eventos) actualRef.current.push(punto(e));
    redibujar();
  }

  function alSoltar() {
    if (!actualRef.current) return;
    actualRef.current = null;
    notificar();
  }

  function deshacer() {
    trazosRef.current = trazosRef.current.slice(0, -1);
    redibujar();
    notificar();
  }

  function limpiar() {
    trazosRef.current = [];
    redibujar();
    notificar();
  }

  useImperativeHandle(ref, () => ({
    exportar: () => recortarYNormalizar(lienzoRef.current),
    trazos: () => trazosRef.current,
    limpiar,
  }));

  const vacio = cantidad === 0;

  return (
    <div className="space-y-2">
      <div
        ref={contenedorRef}
        className={`relative h-44 w-full overflow-hidden rounded-xl border bg-white sm:h-52 ${
          deshabilitado ? "border-slate-200 opacity-60" : vacio ? "border-dashed border-slate-300" : "border-slate-300"
        }`}
      >
        {/* Línea guía y texto de ayuda: decorativos, no forman parte de la firma exportada */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-[70%] border-t border-dashed border-slate-200" />
        {vacio ? (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-slate-300">
            Firme aquí
          </span>
        ) : null}
        <canvas
          ref={lienzoRef}
          role="img"
          aria-label={vacio ? "Recuadro de firma vacío" : `Firma dibujada con ${cantidad} trazos`}
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          className={`absolute inset-0 touch-none select-none ${deshabilitado ? "cursor-not-allowed" : "cursor-crosshair"}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Color de tinta" className="inline-flex items-center rounded-full bg-[#F2F2F7] p-1">
          {Object.values(TINTAS).map((t) => (
            <button
              key={t.valor}
              type="button"
              role="radio"
              aria-checked={tinta === t.valor}
              title={`Tinta ${t.etiqueta.toLowerCase()}`}
              disabled={deshabilitado}
              onClick={() => onCambioTinta?.(t.valor)}
              className={`flex h-8 items-center gap-2 rounded-full px-3 text-[12px] font-medium transition-all duration-200 disabled:opacity-50 ${
                tinta === t.valor ? "bg-white text-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-[#636366] hover:text-[#1C1C1E]"
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-1 hidden text-[12px] text-slate-400 sm:inline">
            {cantidad} {cantidad === 1 ? "trazo" : "trazos"}
          </span>
          <button
            type="button"
            onClick={deshacer}
            disabled={vacio || deshabilitado}
            className="h-9 rounded-lg px-3 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 disabled:text-[#C7C7CC] disabled:hover:bg-transparent"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={limpiar}
            disabled={vacio || deshabilitado}
            className="h-9 rounded-lg px-3 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 disabled:text-[#C7C7CC] disabled:hover:bg-transparent"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
});

export default PadFirma;
