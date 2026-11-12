"use client";

/**
 * RutDisplay.jsx
 * Componente presentacional que muestra un RUT formateado como 12.345.678-9.
 * Solo formateo visual — NO modifica el valor almacenado en BD.
 * Props:
 *   - rut: string
 *   - className: string (opcional)
 */

import { formatearDocumento } from "@/lib/rut";

// `tipo` ("rut" | "pasaporte" | "dni"): un pasaporte o DNI se muestra tal cual.
export function RutDisplay({ rut = "", tipo, className = "" }) {
  const formatted = formatearDocumento(rut, tipo);
  if (!formatted) return null;

  return (
    <span className={`font-mono tabular-nums ${className}`}>{formatted}</span>
  );
}
