import { CLASES_TONO } from "@/lib/firma/constantes";

/** Píldora de estado (firma, registro SIS, documento). `estado` = {etiqueta, tono}. */
export default function InsigniaEstado({ estado, className = "" }) {
  if (!estado) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        CLASES_TONO[estado.tono] || CLASES_TONO.neutro
      } ${className}`}
    >
      {estado.etiqueta}
    </span>
  );
}
