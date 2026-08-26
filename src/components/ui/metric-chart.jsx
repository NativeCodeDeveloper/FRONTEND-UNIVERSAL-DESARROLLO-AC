"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Paleta de acentos disponible para ProgressMetricCard / MetricChart.
// `stroke` y `text` son colores CSS crudos (no clases Tailwind) porque se
// usan en `style={{ color }}` / `stroke={...}` dentro del SVG.
export const ACCENTS = {
  emerald: { stroke: "#10B981", text: "#059669" },
  rose: { stroke: "#F43F5E", text: "#E11D48" },
  neutral: { stroke: "#64748B", text: "#475569" },
  blue: { stroke: "#3B82F6", text: "#2563EB" },
  amber: { stroke: "#F59E0B", text: "#D97706" },
  violet: { stroke: "#8B5CF6", text: "#7C3AED" },
};

export const SERIES_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

/**
 * Formatea un número de forma compacta: 3150 -> "3.15K", 200 -> "200".
 */
export function formatCompact(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  function trim(num) {
    return num % 1 === 0 ? String(num) : String(Number(num.toFixed(2)));
  }

  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}K`;
  return `${sign}${trim(abs)}`;
}

const VB_H = 100;
// El gráfico ocupa TODO el alto de la tarjeta (inset-y-0), mientras que el
// header (título/toggle/período) y el footer (delta + stats) de
// ProgressMetricCard tienen fondo opaco y se dibujan encima. Sin margen
// suficiente, los puntos más altos o más bajos (ej. varios meses en $0)
// terminan tapados detrás de esas franjas. 24/28 deja los datos dentro de la
// franja realmente visible entre el header y el footer.
const PAD_TOP = 24;
const PAD_BOTTOM = 28;
// Ancho mínimo por punto (px). Si con este ancho el contenido no entra en el
// contenedor (muchos meses, o pantalla angosta), el gráfico se vuelve
// horizontalmente scrolleable en vez de apretar los puntos hasta hacerlos
// ilegibles — así nunca se "pierde" un mes por falta de espacio.
const MIN_POINT_WIDTH = 46;
const TOOLTIP_MARGIN = 80;

function buildScaledPoints(points, width) {
  if (!points || points.length === 0) return [];
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const n = points.length;

  return points.map((p, i) => {
    const x = n > 1 ? (i / (n - 1)) * width : width / 2;
    const yRatio = (p.value - min) / range;
    const y = PAD_TOP + (1 - yRatio) * (VB_H - PAD_TOP - PAD_BOTTOM);
    return { value: p.value, date: p.date, x, y };
  });
}

// Curva suave (Catmull-Rom convertida a Bezier) a través de los puntos.
function smoothPath(pts) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Dibuja el gráfico (curva o barras) dentro de su contenedor padre, que debe
 * ser `position: relative` con tamaño definido.
 *
 * El eje Y usa un viewBox 0-100 (porcentaje). El eje X usa píxeles reales:
 * cada punto recibe un ancho mínimo (`MIN_POINT_WIDTH`) y, si con eso el
 * contenido no entra en el ancho disponible, el gráfico se vuelve
 * horizontalmente scrolleable (útil con 12 meses, o en pantallas angostas)
 * en vez de comprimir los puntos hasta hacerlos ilegibles.
 */
export function MetricChart({ series, view = "curve", defaultIndex, valueFormatter, dateFormatter }) {
  const scrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const primary = series?.[0];
  const points = primary?.data ?? [];
  const n = points.length;
  const contentWidth = Math.max(containerWidth, n * MIN_POINT_WIDTH);
  const isScrollable = containerWidth > 0 && contentWidth > containerWidth + 1;

  const scaled = useMemo(() => buildScaledPoints(points, contentWidth || 1), [points, contentWidth]);

  const otherSeries = view === "curve" ? (series ?? []).slice(1) : [];
  const otherScaled = useMemo(
    () => otherSeries.map((s) => ({ color: s.color, points: buildScaledPoints(s.data, contentWidth || 1) })),
    [otherSeries, contentWidth]
  );

  // Por defecto, si el gráfico es scrolleable, arranca mostrando el extremo
  // derecho (los meses más recientes) en vez del inicio del historial.
  useEffect(() => {
    if (isScrollable && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [isScrollable, contentWidth]);

  if (!primary || scaled.length < 2 || !containerWidth) {
    return <div ref={scrollRef} className="absolute inset-0" />;
  }

  const activeIndex = hoverIndex ?? Math.min(defaultIndex ?? scaled.length - 1, scaled.length - 1);
  const active = scaled[activeIndex];
  // Evita que el tooltip se corte contra el borde izquierdo/derecho del
  // contenido cuando el punto activo es el primero o el último.
  const tooltipLeftPx = Math.min(contentWidth - TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, active.x));

  function handleMove(e) {
    const rect = scrollRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const xInContent = e.clientX - rect.left + scrollRef.current.scrollLeft;
    const nearest = Math.round((xInContent / contentWidth) * (scaled.length - 1));
    setHoverIndex(Math.min(scaled.length - 1, Math.max(0, nearest)));
  }

  function handleLeave() {
    setHoverIndex(null);
  }

  const gradientId = `mc-grad-${(primary.name || "series").replace(/[^a-zA-Z0-9]/g, "")}`;
  const barSlot = contentWidth / scaled.length;

  return (
    <div
      ref={scrollRef}
      className={`absolute inset-0 ${isScrollable ? "overflow-x-auto overflow-y-hidden" : "overflow-hidden"}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="relative h-full" style={{ width: contentWidth }}>
        <svg
          width={contentWidth}
          height="100%"
          viewBox={`0 0 ${contentWidth} ${VB_H}`}
          preserveAspectRatio="none"
          className="block h-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={primary.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {view === "curve" ? (
            <>
              <path
                d={`${smoothPath(scaled)} L ${scaled[scaled.length - 1].x} ${VB_H} L ${scaled[0].x} ${VB_H} Z`}
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d={smoothPath(scaled)}
                fill="none"
                stroke={primary.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {otherScaled.map((s, i) => (
                <path
                  key={i}
                  d={smoothPath(s.points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </>
          ) : (
            scaled.map((p, i) => {
              const isActive = i === activeIndex;
              const w = barSlot * 0.55;
              const x = p.x - w / 2;
              const r = Math.min(4, w / 2);
              return (
                <path
                  key={i}
                  d={`M ${x} ${VB_H} L ${x} ${p.y + r} Q ${x} ${p.y} ${x + r} ${p.y} L ${x + w - r} ${p.y} Q ${x + w} ${p.y} ${x + w} ${p.y + r} L ${x + w} ${VB_H} Z`}
                  fill={primary.color}
                  opacity={isActive ? 1 : 0.32}
                />
              );
            })
          )}
        </svg>

        {view === "curve" && (
          <div
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-sm"
            style={{ left: `${active.x}px`, top: `${active.y}%`, background: primary.color }}
          />
        )}

        {/* La posición vertical del tooltip es fija (no sigue active.y): si siguiera
            la altura real del punto, en los valores más altos (cerca del borde
            superior de la tarjeta) el texto quedaría cortado por el
            `overflow-hidden` del contenedor raíz. Solo el eje X sigue al punto activo.
            El offset (28%) deja espacio libre debajo del header de la tarjeta
            (título, toggle de vista, % de tendencia, selector de período) para
            que el tooltip nunca se dibuje encima de ese texto. */}
        <div
          className="pointer-events-none absolute z-20 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
          style={{
            left: `${tooltipLeftPx}px`,
            top: "28%",
            transform: "translate(-50%, 0)",
          }}
        >
          <p className="text-[13px] font-bold leading-tight text-foreground">
            {valueFormatter ? valueFormatter(active.value) : active.value}
          </p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {dateFormatter ? dateFormatter(active.date) : active.date}
          </p>
        </div>
      </div>
    </div>
  );
}
