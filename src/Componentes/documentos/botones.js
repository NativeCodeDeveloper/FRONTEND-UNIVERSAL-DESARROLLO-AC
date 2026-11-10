/* Botones de la firma electrónica y los documentos: un solo estilo en todas las
 * pantallas (emitir, aceptación del paciente, firma del profesional, registro SIS,
 * bandeja de documentos). Criterio del dashboard: cápsula, azul para la acción
 * principal, rótulos sin mayúsculas y en UNA línea (whitespace-nowrap), rojo solo
 * para lo destructivo.
 *
 * Uso: className={`${BOTON.primario} flex-1 sm:flex-none`}; los tamaños se combinan:
 * className={`${BOTON.primario} ${BOTON.compacto}`}. */

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
  "transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-40";

export const BOTON = {
  /** Acción principal: firmar, enviar, verificar, guardar. */
  primario: `${BASE} h-11 px-5 text-[14px] bg-[#007AFF] text-white hover:bg-[#0062CC] focus-visible:ring-[#007AFF]/25`,
  /** Acción secundaria con borde: imprimir, descargar, cambiar. */
  secundario: `${BASE} h-11 px-5 text-[14px] bg-white text-[#1D1D1F] ring-1 ring-inset ring-black/10 hover:bg-[#F2F2F7] focus-visible:ring-[#007AFF]/25`,
  /** Acción sin fondo: cancelar, reenviar, ver más. */
  texto: `${BASE} h-11 px-4 text-[14px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10 focus-visible:ring-[#007AFF]/25`,
  /** Solo para lo que no se puede deshacer: revocar, anular. */
  destructivo: `${BASE} h-11 px-5 text-[14px] bg-[#FF3B30] text-white hover:bg-[#D70015] focus-visible:ring-[#FF3B30]/25`,
  /** Variante de texto en rojo (primer paso antes de confirmar). */
  textoDestructivo: `${BASE} h-11 px-4 text-[14px] font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 focus-visible:ring-[#FF3B30]/25`,
  /** Tamaño compacto para filas de acciones (tarjetas, listas). Se combina con uno de arriba. */
  compacto: "h-9! px-4! text-[13px]!",
};
