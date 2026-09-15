import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canAccessDashboardPath, getDashboardRoleFromClaims } from "@/lib/dashboard-access";

// TEMPORAL (dev): en true se salta el sign-in y el control de roles, entrando
// directo al dashboard. Volver a false antes de commitear / desplegar.
const BYPASS_DASHBOARD_AUTH = true;

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

  const role = getDashboardRoleFromClaims(sessionClaims);
  const pathname = req.nextUrl.pathname;

  if (isDashboardRoute(req) && role === "cancelado" && pathname !== SUBSCRIPTION_CANCELLED_PATH) {
    return NextResponse.redirect(new URL(SUBSCRIPTION_CANCELLED_PATH, req.url));
  }

  if (isDashboardRoute(req) && !canAccessDashboardPath(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard/no-access", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
