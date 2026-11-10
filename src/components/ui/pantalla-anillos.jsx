"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { iniciarCarga } from "@/lib/cargaGlobal";
import MagicRings from "@/components/ui/magic-rings";
import CloudLoader from "@/components/ui/quantum-cloud-loader";

const suscribirMontaje = () => () => {};
const obtenerMontaje = () => true;
const obtenerMontajeServidor = () => false;

// ── Pantallas a pantalla completa ───────────────────────────────────────────
// La pantalla de carga (src/app/loading.jsx) muestra el logo con las
// partículas quantum (quantum-cloud-loader.jsx); los anillos quedaron solo
// para la de 404 (src/app/not-found.jsx). La vista de carga se comparte con
// el preview de desarrollo (/dashboard/preview-carga).
//
// onClick es opcional: lo usa el preview para cerrar el overlay al hacer clic.

const PROPS_ANILLOS = {
  color: "#7C5CF0",
  colorTwo: "#C4B5FD",
  ringCount: 6,
  alphaMode: "coverage",
  noiseAmount: 0.05,
};

export function PantallaCarga({ onClick }) {
  const montada = useSyncExternalStore(suscribirMontaje, obtenerMontaje, obtenerMontajeServidor);

  useEffect(() => {
    if (!onClick) return iniciarCarga();
  }, [onClick]);

  // Los fallbacks y peticiones comparten una sola animación en CargaGlobal.
  // El preview conserva su pantalla independiente y su botón de cierre.
  return !montada || onClick ? <VistaPantallaCarga onClick={onClick} /> : null;
}

export function VistaPantallaCarga({ onClick }) {
  const montada = useSyncExternalStore(suscribirMontaje, obtenerMontaje, obtenerMontajeServidor);
  const pantalla = (
    <div
      onClick={onClick}
      // z-[90]: sobre el orbe de Cortex (z-[80], se monta en el layout del
      // dashboard y si no quedaría flotando sobre la carga) y bajo el tour (z-10000).
      // Sin fondo: antes era `bg-white`, una lamina opaca que aparecia y
      // desaparecia de golpe sobre lo que hubiera detras. Ahora la carga se
      // dibuja encima y entra con un fundido, asi el cambio no es abrupto.
      // (El 404 si conserva su fondo: es una pantalla final, no un estado
      // pasajero.)
      className="fixed inset-0 z-[90] overflow-hidden animate-in fade-in duration-500"
      role="status"
      aria-live="polite"
      aria-label="Cargando Agenda Clínica"
      aria-busy="true"
    >
      <div className="flex h-full flex-col items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* Marca de la plataforma en el azul de los botones (#007AFF), igual
            que las partículas. logo-mark-blue.png es logo-mark-purple.png con
            el mismo trazo y transparencia, solo recoloreado. */}
        <img
          src="/logo-mark-blue.png"
          alt="Agenda Clínica"
          width={552}
          height={501}
          className="block h-auto w-[min(30vw,128px)] object-contain"
        />
        {/* Partículas quantum bajo el logo */}
        <CloudLoader />
      </div>
    </div>
  );

  return montada ? createPortal(pantalla, document.body) : pantalla;
}

export function PantallaNoEncontrada({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 z-[90] overflow-hidden bg-white"
      role="status"
      aria-live="polite"
      aria-label="Página no encontrada"
    >
      <MagicRings {...PROPS_ANILLOS}>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-[#16181C]">
            404
          </span>
          <span className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#8B8F96]">
            Página no encontrada
          </span>
        </div>
      </MagicRings>
    </div>
  );
}
