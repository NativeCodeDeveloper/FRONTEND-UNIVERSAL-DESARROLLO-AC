"use client";

import { useUser } from "@clerk/nextjs";
import { getDashboardRoleFromUser, hasFullDashboardAccess } from "@/lib/dashboard-access";
import { useEmpresaNombre } from "@/hooks/useEmpresaNombre";

/**
 * Aviso visible para el técnico NativeCode (acceso total de soporte).
 *
 * NativeCode es encargado de tratamiento (Ley 21.719): accede a los datos de la
 * clínica por su instrucción y debe poder demostrarlo. El aviso deja siempre a
 * la vista que se está mirando como soporte, no como un usuario de la clínica;
 * los ingresos quedan además en registro_accesos (RegistroAcceso.jsx).
 *
 * Antes era una franja de ancho completo arriba del contenido: cortaba cada
 * pantalla. Ahora es una cápsula flotante abajo al centro (el asistente Cortex
 * ocupa la esquina derecha): siempre visible, sin empujar ni tapar el contenido.
 */
export default function FranjaModoSoporte() {
  const { user, isLoaded } = useUser();
  const empresa = useEmpresaNombre();

  if (!isLoaded || !hasFullDashboardAccess(getDashboardRoleFromUser(user))) return null;

  return (
    <div
      role="status"
      title={`Estás viendo ${empresa} como técnico NativeCode. Cada ingreso queda registrado.`}
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] flex justify-center px-4"
    >
      <span className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-[12px] text-[#3A3A3C] shadow-[0_6px_24px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.06] backdrop-blur-xl">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#007AFF]" aria-hidden="true" />
        <span className="truncate">
          <span className="font-semibold text-[#1D1D1F]">Modo soporte</span>
          <span className="hidden text-[#6E6E73] sm:inline"> · {empresa} · cada ingreso queda registrado</span>
        </span>
      </span>
    </div>
  );
}
