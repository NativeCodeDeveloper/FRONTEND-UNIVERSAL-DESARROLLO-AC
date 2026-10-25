"use client";

import { useUser } from "@clerk/nextjs";
import { getDashboardRoleFromUser, hasFullDashboardAccess } from "@/lib/dashboard-access";
import { useEmpresaNombre } from "@/hooks/useEmpresaNombre";

/**
 * Aviso visible para el técnico NativeCode (acceso total de soporte).
 *
 * NativeCode es encargado de tratamiento (Ley 21.719): accede a los datos de la
 * clínica por su instrucción y debe poder demostrarlo. Esta franja deja siempre
 * a la vista que se está mirando como soporte, no como un usuario de la clínica;
 * los ingresos quedan además en registro_accesos (RegistroAcceso.jsx).
 * En móvil no es fija: el menú móvil ya ocupa la parte superior fija (MobileNav).
 */
export default function FranjaModoSoporte() {
  const { user, isLoaded } = useUser();
  const empresa = useEmpresaNombre();

  if (!isLoaded || !hasFullDashboardAccess(getDashboardRoleFromUser(user))) return null;

  return (
    <div
      role="status"
      className="relative z-30 flex items-center md:sticky md:top-0 justify-center gap-2 border-b border-[#007AFF]/15 bg-[#EAF3FF]/95 px-4 py-1.5 text-center text-[12px] text-[#0A3D7A] backdrop-blur-md"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#007AFF]" aria-hidden="true" />
      <span className="truncate">
        <span className="font-semibold">Modo soporte NativeCode</span>
        <span className="hidden sm:inline"> · Estás viendo {empresa} como técnico. Cada ingreso queda registrado.</span>
      </span>
    </div>
  );
}
