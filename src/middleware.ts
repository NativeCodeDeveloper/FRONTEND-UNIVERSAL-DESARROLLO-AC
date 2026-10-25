import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ROL_RECEPCION,
  ROL_SUSPENDIDO,
  canAccessDashboardPath,
  getDashboardRoleFromClaims,
} from "@/lib/dashboard-access";

// TEMPORAL (dev): en true se salta el sign-in y el control de roles, entrando
// directo al dashboard. Volver a false antes de commitear / desplegar.
const BYPASS_DASHBOARD_AUTH = false;

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isDashboardApiRoute = createRouteMatcher(["/api/dashboard(.*)"]);
const SUBSCRIPTION_CANCELLED_PATH = "/dashboard/suscripcion-cancelada";

export default clerkMiddleware(async (auth, req) => {
  if (BYPASS_DASHBOARD_AUTH) {
    return NextResponse.next();
  }

  if (!isDashboardRoute(req) && !isDashboardApiRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // El rol solo viaja en el token si la plantilla de sesión de Clerk de la
  // instancia expone el publicMetadata ({"metadata": "{{user.public_metadata}}"}).
  // Sin esa plantilla no se puede decidir aquí: se deja pasar y decide el guardia
  // del cliente (DashboardRouteGuard), que lee el publicMetadata del usuario.
  // Así "sin rol, sin acceso" no bloquea a todos en una instancia sin plantilla.
  const claims = sessionClaims as Record<string, unknown> | null;
  const tokenTraeRol = Boolean(claims && (claims.metadata || claims.publicMetadata || claims.public_metadata));
  if (!tokenTraeRol) {
    return NextResponse.next();
  }

  const role = getDashboardRoleFromClaims(sessionClaims);
  const pathname = req.nextUrl.pathname;

  if (isDashboardRoute(req) && role === ROL_SUSPENDIDO) {
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL(SUBSCRIPTION_CANCELLED_PATH, req.url));
    }

    if (pathname !== SUBSCRIPTION_CANCELLED_PATH) {
      return NextResponse.redirect(new URL("/sign-in?unauthorized=1", req.url));
    }
  }

  if (isDashboardRoute(req) && role === ROL_RECEPCION && !canAccessDashboardPath(role, pathname)) {
    return NextResponse.redirect(new URL("/sign-in?unauthorized=1", req.url));
  }

  if (isDashboardRoute(req) && !canAccessDashboardPath(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard/no-access", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
