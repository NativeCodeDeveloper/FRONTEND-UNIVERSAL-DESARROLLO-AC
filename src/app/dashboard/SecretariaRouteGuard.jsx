"use client";

import { useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { PantallaCarga } from "@/components/ui/pantalla-anillos";
import {
  ROL_RECEPCION,
  ROL_SUSPENDIDO,
  canAccessDashboardPath,
  getDashboardRoleFromUser,
} from "@/lib/dashboard-access";

const BLOQUEO_ACCESO_RESTRINGIDO = "dashboard_acceso_restringido_denegado";

/*
 * Guardia de rutas del dashboard en el cliente. Lee el perfil desde el
 * publicMetadata del usuario, así funciona aunque el token de sesión no traiga el
 * rol (ver middleware.ts).
 *  - Suspendido: solo la pantalla de suscripción cancelada.
 *  - Recepción y suspendido sin permiso: se cierra la sesión (comportamiento previo).
 *  - Cualquier otro perfil sin permiso, o sin perfil: pantalla "sin acceso".
 */
export default function SecretariaRouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = getDashboardRoleFromUser(user);
  const sesionAusente = isLoaded && !user;
  const inicioCancelado = isLoaded && Boolean(user) && role === ROL_SUSPENDIDO && pathname === "/dashboard";
  const sinPermiso = isLoaded && Boolean(user) && !inicioCancelado && !canAccessDashboardPath(role, pathname);
  const accesoDenegado = sinPermiso && [ROL_RECEPCION, ROL_SUSPENDIDO].includes(role);
  const irANoAcceso = sinPermiso && !accesoDenegado;

  useEffect(() => {
    const bloquearRutaRestaurada = () => {
      if (window.sessionStorage.getItem(BLOQUEO_ACCESO_RESTRINGIDO) === "1") {
        window.location.replace("/sign-in");
      }
    };

    window.addEventListener("pageshow", bloquearRutaRestaurada);
  }, []);

  useEffect(() => {
    if (sesionAusente) {
      window.location.replace("/sign-in");
      return;
    }

    if (inicioCancelado) {
      window.location.replace("/dashboard/suscripcion-cancelada");
      return;
    }

    if (irANoAcceso) {
      router.replace("/dashboard/no-access");
      return;
    }

    if (!accesoDenegado) return;

    window.sessionStorage.setItem(BLOQUEO_ACCESO_RESTRINGIDO, "1");
    const irALogin = () => window.location.replace("/sign-in");

    void signOut().finally(irALogin);
  }, [accesoDenegado, irANoAcceso, inicioCancelado, sesionAusente, signOut, router]);

  if (sesionAusente || inicioCancelado || accesoDenegado || irANoAcceso) {
    return <PantallaCarga />;
  }

  return children;
}
