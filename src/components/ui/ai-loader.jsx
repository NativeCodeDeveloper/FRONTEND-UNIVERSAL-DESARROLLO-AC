"use client";

// ── Pantalla de carga / estado de la plataforma ──────────────────────────────
// Base monocroma (fondo #FAFAFB translúcido, pista #EAEAEC) con un acento
// violeta contenido: solo el arco de progreso y un halo muy tenue detrás.
// La usan src/app/loading.jsx (fallback de Suspense) y src/app/not-found.jsx.
//
// OJO con el porcentaje: un fallback de Suspense no tiene progreso real que
// medir — React no informa cuánto falta. El número sigue una curva que
// desacelera y se detiene en 99 hasta que la página entra y el loader se
// desmonta. Da la sensación de avance sin mentir con un 100% que no ocurrió.

import { useEffect, useRef, useState } from "react";

const ACENTO = "#7C5CF0";
const PISTA = "#EAEAEC";
const TINTA = "#16181C";

// Constante de tiempo de la curva: más alto = avanza más lento al principio.
const TAU_MS = 1500;
const TOPE = 99;

export function Component({
  size = 180,
  text = "Cargando",
  label = text,
  mostrarPorcentaje = true,
}) {
  const diametro = Math.round(size * 0.8);
  const grosor = size >= 220 ? 4 : 3;
  const radio = (diametro - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  const progreso = useProgresoSimulado(mostrarPorcentaje);

  // Sin porcentaje (404) el anillo no está "cargando": queda un arco fijo.
  const fraccion = mostrarPorcentaje ? progreso / 100 : 0.72;
  const textoCentral = mostrarPorcentaje ? null : text;

  return (
    <div
      className="fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-hidden bg-[#FAFAFB]/70 backdrop-blur-md"
      style={{ color: TINTA }}
      role="status"
      aria-live="polite"
      aria-label={mostrarPorcentaje ? `${label} ${Math.round(progreso)}%` : label}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Halo violeta: el único color fuera del arco, apenas perceptible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full blur-3xl"
          style={{
            width: diametro * 2,
            height: diametro * 2,
            background: `radial-gradient(circle, rgba(124,92,240,0.16), transparent 68%)`,
          }}
        />

        <div
          className="relative grid place-items-center select-none"
          style={{ width: diametro, height: diametro }}
        >
          <svg
            width={diametro}
            height={diametro}
            viewBox={`0 0 ${diametro} ${diametro}`}
            className={mostrarPorcentaje ? undefined : "motion-safe:animate-spin [animation-duration:2.6s]"}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={diametro / 2}
              cy={diametro / 2}
              r={radio}
              fill="none"
              stroke={PISTA}
              strokeWidth={grosor}
            />
            <circle
              cx={diametro / 2}
              cy={diametro / 2}
              r={radio}
              fill="none"
              stroke={ACENTO}
              strokeWidth={grosor}
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={circunferencia * (1 - fraccion)}
              style={{
                // Sin transition a propósito: el progreso ya se recalcula en
                // cada frame (requestAnimationFrame). Una transición encima
                // dejaba el arco corriendo ~180ms detrás del número.
                filter: `drop-shadow(0 0 6px rgba(124,92,240,0.35))`,
              }}
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            {mostrarPorcentaje ? (
              <div
                className="font-semibold tabular-nums tracking-tight"
                style={{ fontSize: diametro * 0.26, color: TINTA }}
              >
                {Math.round(progreso)}
                <span
                  className="font-medium"
                  style={{ fontSize: "0.5em", color: "#8B8F96", marginLeft: "0.06em" }}
                >
                  %
                </span>
              </div>
            ) : (
              <div
                className="font-semibold tracking-tight"
                style={{ fontSize: diametro * 0.24, color: TINTA }}
              >
                {textoCentral}
              </div>
            )}
          </div>
        </div>

        <span
          className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em]"
          style={{ color: "#8B8F96" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// Curva exponencial que desacelera: rápida al principio, lenta al final, y se
// queda en TOPE. Nunca llega a 100 porque nadie le avisó que terminó.
function useProgresoSimulado(activo) {
  const [progreso, setProgreso] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!activo) return;

    const inicio = performance.now();
    const paso = (ahora) => {
      const transcurrido = ahora - inicio;
      const valor = TOPE * (1 - Math.exp(-transcurrido / TAU_MS));
      setProgreso(valor);
      if (valor < TOPE - 0.2) rafRef.current = requestAnimationFrame(paso);
    };
    rafRef.current = requestAnimationFrame(paso);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activo]);

  return progreso;
}
