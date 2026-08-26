"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { ACCENTS, formatCompact, MetricChart, SERIES_COLORS } from "./metric-chart";
import { PeriodSelect, ViewToggle } from "./metric-controls";

const DEFAULT_PERIODS = [
  { label: "Past 7 days", points: 4 },
  { label: "Past 14 days", points: 7 },
  { label: "Past 30 days" },
];

// Parte de la card (desde la derecha) ocupada por el gráfico.
const REGION_W = 62; // %
// Variación bajo este umbral = "estable" -> acento neutro.
const NEUTRAL_PCT = 0.5;

const SIZES = {
  sm: { minH: "min-h-[260px]", pad: "px-6 pt-5", footer: "px-6 py-3", title: "text-[15px]", headline: "text-[46px]" },
  md: { minH: "min-h-[380px]", pad: "px-8 pt-7", footer: "px-8 py-4", title: "text-[17px]", headline: "text-[72px]" },
  lg: { minH: "min-h-[460px]", pad: "px-10 pt-9", footer: "px-10 py-5", title: "text-[19px]", headline: "text-[88px]" },
};

const sliceWindow = (points, n) => (n && n < points.length ? points.slice(-n) : points);

/**
 * Tarjeta de métrica con gráfico (curva o barras), delta y stats de período.
 * Todos los números derivan de la serie principal (`data` o `series[0]`),
 * salvo que se pasen explícitamente por props (`total`, `delta`, `percent`).
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string|number} [props.total]
 * @param {string} [props.delta]
 * @param {string} [props.deltaLabel]
 * @param {string} [props.percent]
 * @param {'up'|'down'} [props.trend]
 * @param {string} [props.unit]
 * @param {string} [props.period]
 * @param {{label:string, points?:number}[]} [props.periodOptions]
 * @param {(option: {label:string, points?:number}) => void} [props.onPeriodChange]
 * @param {'curve'|'bar'} [props.defaultView]
 * @param {keyof typeof ACCENTS} [props.accent]
 * @param {{value:number, date:string}[]} [props.data] Serie única. A proveer, O `series`.
 * @param {{name:string, data:{value:number,date:string}[], accent?:string}[]} [props.series] Varias series nombradas. Prioridad sobre `data`.
 * @param {number} [props.defaultIndex]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {boolean} [props.showStats]
 * @param {(value:number) => string} [props.valueFormatter]
 * @param {(date:string) => string} [props.dateFormatter]
 * @param {boolean} [props.loading]
 * @param {string} [props.className]
 */
export default function ProgressMetricCard({
  title,
  total,
  delta,
  deltaLabel = "today",
  percent,
  trend,
  unit,
  period = "Past 30 days",
  periodOptions,
  onPeriodChange,
  defaultView = "curve",
  accent,
  data,
  series,
  defaultIndex,
  size = "md",
  showStats = true,
  valueFormatter,
  dateFormatter,
  loading = false,
  className = "",
}) {
  const gridId = `grid-${useId().replace(/:/g, "")}`;
  const sz = SIZES[size];
  const shell = `relative flex ${sz.minH} w-full flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.04)] ${className}`;

  const periods = periodOptions ?? DEFAULT_PERIODS;
  const [selectedLabel, setSelectedLabel] = useState(period);
  const [view, setView] = useState(defaultView);

  // Normaliza la entrada a una lista de series (un `data` simple -> una sola serie).
  const baseSeries = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent]
  );

  const selectedOption = periods.find((p) => p.label === selectedLabel) ?? periods[periods.length - 1];

  // Recorta cada serie según el período elegido.
  const visibleSeries = useMemo(
    () => baseSeries.map((s) => ({ ...s, data: sliceWindow(s.data, selectedOption?.points) })),
    [baseSeries, selectedOption]
  );

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;
  const hasData = (primary?.data.length ?? 0) >= 2;

  // Todos los números derivan de la serie principal -> la card se mantiene
  // coherente y reacciona al cambio de período. Las props siguen teniendo prioridad.
  const stats = useMemo(() => {
    const vals = primary?.data.map((d) => d.value) ?? [];
    const sum = vals.reduce((a, b) => a + b, 0);
    const first = vals[0] ?? 0;
    const last = vals[vals.length - 1] ?? 0;
    const prev = vals[vals.length - 2] ?? first;
    const net = last - first;
    // Si el primer punto es 0 (ej. mes sin datos todavía), (net/first)*100 no
    // se puede calcular y quedaría en 0 -> se leería como "estable" aunque
    // haya pasado de $0 a un monto real. En ese caso el % no tiene un
    // significado matemático real, así que se satura a ±100 solo para que
    // el indicador de tendencia (arriba/abajo) sea correcto.
    const pct = first ? (net / first) * 100 : net === 0 ? 0 : net > 0 ? 100 : -100;
    return {
      sum,
      net,
      pct,
      step: last - prev,
      peak: vals.length ? Math.max(...vals) : 0,
      low: vals.length ? Math.min(...vals) : 0,
      avg: vals.length ? sum / vals.length : 0,
    };
  }, [primary]);

  // El color depende del sentido (último vs. primer punto), con una zona neutra.
  const resolvedTrend = trend ?? (Math.abs(stats.pct) < NEUTRAL_PCT ? "flat" : stats.net >= 0 ? "up" : "down");
  const resolvedAccent = accent ?? (resolvedTrend === "up" ? "emerald" : resolvedTrend === "down" ? "rose" : "neutral");
  const color = ACCENTS[resolvedAccent];
  const TrendIcon = resolvedTrend === "flat" ? ArrowRight : resolvedTrend === "down" ? ArrowDown : ArrowUp;

  const fmtCompact = valueFormatter ?? formatCompact;
  const fmtFull = valueFormatter ?? ((n) => n.toLocaleString() + (unit ? ` ${unit}` : ""));
  const fmtDate = dateFormatter ?? ((d) => d);
  const sign = (n) => (n >= 0 ? "+" : "−") + fmtCompact(Math.abs(n));

  const displayTotal = total ?? fmtCompact(stats.sum);
  const displayDelta = delta ?? sign(stats.step);
  const displayPercent = percent ?? `${Math.abs(stats.pct).toFixed(1)}%`;

  // Color de cada serie: accent definido -> paleta -> color del título.
  const chartSeries = visibleSeries.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.accent ? ACCENTS[s.accent].stroke : isMulti ? SERIES_COLORS[i % SERIES_COLORS.length] : color.stroke,
  }));

  const lastIndex = (primary?.data.length ?? 1) - 1;
  const fallback = Math.min(defaultIndex ?? lastIndex, lastIndex);

  const handlePeriodChange = (option) => {
    setSelectedLabel(option.label);
    onPeriodChange?.(option);
  };

  if (loading) {
    return (
      <div className={shell} aria-busy="true">
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 h-14 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="mt-auto h-24 w-full animate-pulse rounded-lg bg-muted/50" />
        </div>
        <div className={`border-t border-foreground/[0.06] ${sz.footer}`}>
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <h3 className={`${sz.title} font-semibold tracking-tight text-foreground`}>{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No data yet</p>
            <p className="text-xs text-muted-foreground">Metrics will appear once data is available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* Zona del gráfico (a la derecha, detrás del contenido) */}
      <div className="absolute inset-y-0 right-0 z-0" style={{ width: `${REGION_W}%` }}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to left, ${color.stroke}1f, transparent 75%)` }}
        />
        <div
          className="absolute inset-0 text-foreground/[0.13]"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)",
            maskImage: "linear-gradient(to right, transparent, black 55%)",
          }}
        >
          <svg className="h-full w-full" aria-hidden>
            <defs>
              <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridId})`} />
          </svg>
        </div>

        <MetricChart series={chartSeries} view={view} defaultIndex={fallback} valueFormatter={fmtFull} dateFormatter={fmtDate} />
      </div>

      {/* Contenido principal */}
      <div className={`pointer-events-none relative z-10 flex flex-1 flex-col ${sz.pad}`}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3">
            <h3 className={`${sz.title} font-semibold tracking-tight text-foreground`}>{title}</h3>
            <div className="pointer-events-auto">
              <ViewToggle value={view} onChange={setView} />
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-[14px]">
            <span className="flex items-center gap-1 whitespace-nowrap font-medium" style={{ color: color.text }}>
              <TrendIcon size={16} strokeWidth={2.5} />
              {displayPercent}
            </span>
            <div className="pointer-events-auto">
              <PeriodSelect value={selectedLabel} options={periods} onChange={handlePeriodChange} accentText={color.text} />
            </div>
          </div>
        </div>

        {/* Leyenda (solo en multi-serie) */}
        {isMulti && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {chartSeries.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        )}

        <div className={`mt-5 ${sz.headline} font-medium leading-none tracking-tight text-foreground`}>
          {displayTotal}
        </div>
      </div>

      {/* Footer opaco: delta a la izquierda, stats secundarias a la derecha */}
      <div className={`relative z-10 flex items-center justify-between gap-4 border-t border-foreground/[0.06] bg-card ${sz.footer} text-[14px]`}>
        <div>
          <span className="font-medium" style={{ color: color.text }}>
            {displayDelta}
          </span>{" "}
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
        {showStats && (
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <span>
              <span className="font-medium text-foreground/80">{fmtCompact(stats.peak)}</span> peak
            </span>
            <span className="opacity-40">·</span>
            <span>
              <span className="font-medium text-foreground/80">{fmtCompact(stats.low)}</span> low
            </span>
            <span className="opacity-40">·</span>
            <span>
              <span className="font-medium text-foreground/80">{fmtCompact(Math.round(stats.avg))}</span> avg
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
