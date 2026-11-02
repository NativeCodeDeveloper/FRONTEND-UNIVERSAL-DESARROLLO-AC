"use client";

/**
 * StatusFilterChips.jsx
 * Chips multi-selección para filtrar reservas por estado.
 * Al desactivar un estado, las cards se atenúan (no desaparecen).
 * Props:
 *   - activeFilters: string[] — estados activos (vacío = todos activos)
 *   - onChange: (filters: string[]) => void
 */

import { STATE_COLORS } from "@/lib/designTokens";

const FILTER_ITEMS = [
  { key: "todas", label: "Todas" },
  { key: "reservada", label: "Reservada" },
  { key: "confirmada", label: "Confirmada" },
  { key: "asiste", label: "Asiste" },
  { key: "no asiste", label: "No asiste" },
  { key: "finalizado", label: "Finalizado" },
  { key: "anulada", label: "Anulada" },
  { key: "bloqueado", label: "Bloqueado" },
];

export function StatusFilterChips({ activeFilters = [], onChange }) {
  const allActive = activeFilters.length === 0;

  function handleClick(key) {
    if (key === "todas") {
      onChange([]);
      return;
    }
    if (allActive) {
      // Si todos están activos y se hace clic en uno, activa solo ese
      onChange([key]);
      return;
    }
    const isActive = activeFilters.includes(key);
    if (isActive) {
      const next = activeFilters.filter((f) => f !== key);
      onChange(next); // si queda vacío = todas
    } else {
      onChange([...activeFilters, key]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTER_ITEMS.map(({ key, label }) => {
        const isTodas = key === "todas";
        const isActive = isTodas ? allActive : activeFilters.includes(key);
        const token = isTodas ? null : STATE_COLORS[key];

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key)}
            className={`
              inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold
              transition-all duration-150
              ${isActive
                ? isTodas
                  ? "border-[#007AFF]/30 text-white shadow-sm"
                  : token?.pill // use the pill classes for proper contrast!
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }
            `} style={{ ...(isActive && isTodas ? { backgroundColor: '#007AFF', color: '#ffffff' } : {}) }}
          >
            {!isTodas && (
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isActive
                    ? "#fff"
                    : token?.dot ?? "#94A3B8",
                  opacity: isActive ? 0.9 : 1,
                }}
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
