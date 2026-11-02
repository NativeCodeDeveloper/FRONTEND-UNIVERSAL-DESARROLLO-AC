"use client";

/**
 * EmptyState.jsx
 * Ilustración SVG + título + descripción + CTA opcional.
 * Props:
 *   - title: string
 *   - description: string
 *   - ctaLabel: string
 *   - onCta: function
 *   - icon: 'calendar' | 'search' | 'patients' (default 'calendar')
 */

const ICONS = {
  calendar: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
      <rect x="8" y="16" width="64" height="54" rx="8" fill="#EBF4FF" />
      <rect x="8" y="16" width="64" height="18" rx="8" fill="#E5F0FF" />
      <rect x="26" y="8" width="4" height="16" rx="2" fill="#4DA2FF" />
      <rect x="50" y="8" width="4" height="16" rx="2" fill="#4DA2FF" />
      <rect x="18" y="42" width="12" height="10" rx="3" fill="#CCE4FF" />
      <rect x="34" y="42" width="12" height="10" rx="3" fill="#99C9FF" />
      <rect x="50" y="42" width="12" height="10" rx="3" fill="#CCE4FF" />
      <rect x="18" y="56" width="12" height="8" rx="3" fill="#E5F0FF" />
      <rect x="34" y="56" width="12" height="8" rx="3" fill="#E5F0FF" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
      <circle cx="34" cy="34" r="22" fill="#EBF4FF" stroke="#CCE4FF" strokeWidth="3" />
      <circle cx="34" cy="34" r="14" fill="#E5F0FF" />
      <line x1="50" y1="50" x2="66" y2="66" stroke="#4DA2FF" strokeWidth="5" strokeLinecap="round" />
      <circle cx="34" cy="34" r="6" fill="#99C9FF" />
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
      <circle cx="40" cy="28" r="14" fill="#E5F0FF" />
      <circle cx="40" cy="28" r="8" fill="#99C9FF" />
      <path d="M16 62c0-13.255 10.745-24 24-24s24 10.745 24 24" fill="#EBF4FF" stroke="#CCE4FF" strokeWidth="2" />
    </svg>
  ),
};

export function EmptyState({
  title = "Sin resultados",
  description = "No hay datos para mostrar.",
  ctaLabel = "",
  onCta = null,
  icon = "calendar",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="opacity-90">{ICONS[icon] ?? ICONS.calendar}</div>
      <div className="max-w-xs space-y-1.5">
        <p className="text-[15px] font-semibold text-slate-700">{title}</p>
        <p className="text-[13px] text-slate-400 leading-relaxed">{description}</p>
      </div>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0062CC] hover:shadow-md"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
