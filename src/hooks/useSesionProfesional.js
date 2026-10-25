"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { esAdministradorClinica, getDashboardRoleFromUser, hasFullDashboardAccess } from "@/lib/dashboard-access";

/**
 * Quién está usando el dashboard, en términos de la firma electrónica.
 *
 * El profesional se identifica por publicMetadata.idProfesionalAgenda, el mismo
 * vínculo que asigna /dashboard/createUser y que ya usa la agenda para mostrar
 * solo lo suyo. Solo ese usuario puede dibujar la firma de ese profesional.
 */
export function useSesionProfesional() {
  const { user, isLoaded } = useUser();

  return useMemo(() => {
    const rol = getDashboardRoleFromUser(user);
    const idProfesional = String(user?.publicMetadata?.idProfesionalAgenda || "");
    return {
      cargado: isLoaded,
      clerkUserId: user?.id || "",
      nombre: user?.fullName || user?.username || "",
      rol,
      idProfesional,
      // Administra la clínica: administradores y profesionales con "También administra".
      // El técnico NativeCode ve todo (soporte) pero no verifica registros ni firma.
      esTecnico: hasFullDashboardAccess(rol),
      esAdministrador: esAdministradorClinica(rol) && !hasFullDashboardAccess(rol),
      /** true si el usuario de la sesión ES ese profesional. */
      esDueno: (id) => Boolean(idProfesional) && String(id) === idProfesional,
    };
  }, [user, isLoaded]);
}
