/**
 * designTokens.js
 * Sistema de diseño premium — Agenda Clínica
 * Acento primario: #6E56CF (violeta)
 */

// ─── Paleta de 8 estados del sistema ────────────────────────────────────────
export const STATE_COLORS = {
  reservada: {
    bg: "rgba(110, 86, 207, 0.10)",
    text: "#4c1d95",
    accent: "#6E56CF",
    border: "rgba(110, 86, 207, 0.30)",
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "#6E56CF",
    label: "Reservada",
  },
  confirmada: {
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#065f46",
    accent: "#10B981",
    border: "rgba(16, 185, 129, 0.30)",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "#10B981",
    label: "Confirmada",
  },
  confirmado: {
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#065f46",
    accent: "#10B981",
    border: "rgba(16, 185, 129, 0.30)",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "#10B981",
    label: "Confirmada",
  },
  asiste: {
    bg: "rgba(14, 165, 233, 0.12)",
    text: "#0c4a6e",
    accent: "#0EA5E9",
    border: "rgba(14, 165, 233, 0.30)",
    pill: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "#0EA5E9",
    label: "Asiste",
  },
  "no asiste": {
    bg: "rgba(249, 115, 22, 0.12)",
    text: "#9a3412",
    accent: "#F97316",
    border: "rgba(249, 115, 22, 0.30)",
    pill: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "#F97316",
    label: "No asiste",
  },
  "no asistio": {
    bg: "rgba(249, 115, 22, 0.12)",
    text: "#9a3412",
    accent: "#F97316",
    border: "rgba(249, 115, 22, 0.30)",
    pill: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "#F97316",
    label: "No asiste",
  },
  finalizado: {
    bg: "rgba(15, 118, 110, 0.10)",
    text: "#134e4a",
    accent: "#0F766E",
    border: "rgba(15, 118, 110, 0.25)",
    pill: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "#0F766E",
    label: "Finalizado",
  },
  anulada: {
    bg: "rgba(239, 68, 68, 0.10)",
    text: "#991b1b",
    accent: "#EF4444",
    border: "rgba(239, 68, 68, 0.25)",
    pill: "bg-red-50 text-red-700 border-red-200",
    dot: "#EF4444",
    label: "Anulada",
  },
  anulado: {
    bg: "rgba(239, 68, 68, 0.10)",
    text: "#991b1b",
    accent: "#EF4444",
    border: "rgba(239, 68, 68, 0.25)",
    pill: "bg-red-50 text-red-700 border-red-200",
    dot: "#EF4444",
    label: "Anulada",
  },
  bloqueado: {
    bg: "rgba(156, 163, 175, 0.14)",
    text: "#374151",
    accent: "#9CA3AF",
    border: "rgba(156, 163, 175, 0.30)",
    pill: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "#9CA3AF",
    label: "Bloqueado",
  },
  seleccion: {
    bg: "rgba(110, 86, 207, 0.12)",
    text: "#4c1d95",
    accent: "#6E56CF",
    border: "rgba(110, 86, 207, 0.30)",
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "#6E56CF",
    label: "Selección",
  },
  // ─── Estados de Pago ───────────────────────────────────────────────────────
  pagado: {
    bg: "rgba(16, 185, 129, 0.10)",
    text: "#065f46",
    accent: "#10B981",
    border: "rgba(16, 185, 129, 0.25)",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "#10B981",
    label: "Pagado",
  },
  pagada: {
    bg: "rgba(16, 185, 129, 0.10)",
    text: "#065f46",
    accent: "#10B981",
    border: "rgba(16, 185, 129, 0.25)",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "#10B981",
    label: "Pagado",
  },
  "pend. pago": {
    bg: "rgba(245, 158, 11, 0.10)",
    text: "#92400e",
    accent: "#F59E0B",
    border: "rgba(245, 158, 11, 0.25)",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "#F59E0B",
    label: "Pend. pago",
  },
  "pendiente pago": {
    bg: "rgba(245, 158, 11, 0.10)",
    text: "#92400e",
    accent: "#F59E0B",
    border: "rgba(245, 158, 11, 0.25)",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "#F59E0B",
    label: "Pend. pago",
  },
  pendiente: {
    bg: "rgba(245, 158, 11, 0.10)",
    text: "#92400e",
    accent: "#F59E0B",
    border: "rgba(245, 158, 11, 0.25)",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "#F59E0B",
    label: "Pendiente",
  },
};

/**
 * Normaliza un estado antes de buscar en STATE_COLORS.
 * @param {string} estado
 * @returns {object} - token del estado o fallback reservada
 */
export function getStateTokens(estado = "") {
  const key = estado
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return STATE_COLORS[key] ?? STATE_COLORS.reservada;
}

// ─── Utilidad: formatRut ─────────────────────────────────────────────────────
/**
 * Formatea un RUT chileno al formato 12.345.678-9.
 * No modifica el valor almacenado; solo presentación.
 * @param {string} rut - RUT en cualquier formato (ej: "12345678K", "12.345.678-K")
 * @returns {string} - RUT formateado "12.345.678-K" o el valor original si no parseable
 */
export function formatRut(rut = "") {
  if (!rut) return "";
  const clean = String(rut).replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return rut;
  const dv = clean.slice(-1);
  let body = clean.slice(0, -1);
  let formatted = "";
  while (body.length > 3) {
    formatted = `.${body.slice(-3)}${formatted}`;
    body = body.slice(0, -3);
  }
  return `${body}${formatted}-${dv}`;
}

/**
 * Quita el formato del RUT para enviarlo al backend.
 * @param {string} rut - RUT formateado "12.345.678-9"
 * @returns {string} - RUT limpio "123456789"
 */
export function cleanRut(rut = "") {
  return String(rut).replace(/[^0-9kK]/g, "").toUpperCase();
}

// ─── Utilidad: colores de avatar por nombre ──────────────────────────────────
const AVATAR_PALETTES = [
  { bg: "#EDE9FE", text: "#5B21B6" }, // violet
  { bg: "#DBEAFE", text: "#1D4ED8" }, // blue
  { bg: "#D1FAE5", text: "#065F46" }, // emerald
  { bg: "#FEF3C7", text: "#92400E" }, // amber
  { bg: "#FCE7F3", text: "#9D174D" }, // pink
  { bg: "#E0F2FE", text: "#0369A1" }, // sky
  { bg: "#F0FDF4", text: "#166534" }, // green
  { bg: "#FFF7ED", text: "#9A3412" }, // orange
];

/**
 * Retorna un objeto {bg, text} determinístico para un nombre.
 * @param {string} name
 */
export function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

/**
 * Obtiene las iniciales de un nombre (hasta 2 caracteres).
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Utilidad: formato de moneda (CLP) ──────────────────────────────────────
/**
 * Formatea un monto como pesos chilenos, ej: 50000 -> "$50.000".
 * Misma convención ya usada en AppointmentDrawer.jsx (Number().toLocaleString("es-CL")).
 * @param {number|string} monto
 * @returns {string}
 */
export function formatCLP(monto) {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return "$0";
  return `$${numero.toLocaleString("es-CL")}`;
}

// ─── Acento primario y constantes ───────────────────────────────────────────
export const ACCENT = {
  DEFAULT: "#6E56CF",
  LIGHT: "#F3F0FF",
  DARK: "#4C3D9E",
  TEXT: "#4C1D95",
};
