// app/dashboard/layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// REDISEÑO PREMIUM FASE 1 — Sidebar estilo Apple / SaaS clínico moderno.
// El sidebar anterior (dark/collapsible) queda comentado al final de este
// archivo para referencia y mantenimiento futuro.
// ─────────────────────────────────────────────────────────────────────────────

import { ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { PantallaCarga } from "@/components/ui/pantalla-anillos";
import MobileNav from "./MobileNav";
import SidebarShell from "./SidebarShell";
import RegistroAcceso from "./RegistroAcceso";
import NotificationProvider from "@/components/NotificationProvider";
import DashboardPageTransition from "@/components/DashboardPageTransition";
import CortexAssistant from "@/Componentes/CortexAssistant";
import ProveedorTokenApi from "@/Componentes/ProveedorTokenApi";
import { TourProvider } from "@/ContextosGlobales/TourContext";
import SecretariaRouteGuard from "./SecretariaRouteGuard";

export const metadata = {
    title: "Dashboard — Agenda Clínica",
    description: "Panel de administración clínica",
};

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
    return (
        <ClerkProvider>
            <ClerkLoading><PantallaCarga /></ClerkLoading>
            {/* Telemetria del Health Score + registro de acceso para proteccion
                de datos. No renderiza nada. Ver RegistroAcceso.jsx. */}
            <RegistroAcceso />
            {/* Registra en fetchConCarga el token de Clerk para que toda llamada
                al backend desde el dashboard viaje con Authorization. Fuera del
                dashboard (sitio publico) no hay token y no se manda header. */}
            <ProveedorTokenApi />
            <SecretariaRouteGuard>
                <TourProvider>
                    <div className="h-screen w-full overflow-hidden bg-[#FAFAFB] font-system-apple">
                    <div className="flex h-full w-full">

                        {/* ═══════════════ SIDEBAR PREMIUM ═══════════════ */}
                        {/* El ancho y el modo (fijado / rail de iconos) los
                            maneja SidebarShell, que es cliente: necesita hover,
                            localStorage y saber si hay un tour corriendo. */}
                        <SidebarShell />

                        {/* ═══════════════ CONTENT ═══════════════ */}
                        <div className="flex-1 min-w-0 h-full overflow-y-auto">
                            <MobileNav />
                            <main className="min-w-0">
                                <DashboardPageTransition>
                                    {children}
                                </DashboardPageTransition>
                            </main>
                        </div>

                        <CortexAssistant />

                    </div>
                    </div>

                    {/* Dentro de TourProvider a propósito: el banner de permisos
                        necesita saber si el tour está corriendo para no aparecer
                        sepultado bajo el overlay del tutorial (z-50 vs z-10000). */}
                    <NotificationProvider />
                </TourProvider>
            </SecretariaRouteGuard>
        </ClerkProvider>
    );
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * SIDEBAR ANTERIOR (dark/collapsible con grupos <details>)
 * Comentado para referencia y mantenimiento futuro.
 * NO ELIMINAR — sirve de referencia para el diseño original.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * import { Michroma } from "next/font/google";
 * const michroma = Michroma({ weight: "400", subsets: ["latin"], display: "swap" });
 *
 * <aside className="hidden md:flex h-screen w-[240px] shrink-0 flex-col bg-gray-900 text-white border-r border-white/[0.06]">
 *   ... (381 líneas del sidebar original con <details>/<summary> colapsables)
 *   ... Grupos: Principal, Agenda, Registros, Documentos, Gestión de Contenido, Configuraciones
 *   ... Footer: sistema operativo con ping verde
 * </aside>
 *
 * Para restaurar: reemplazar el bloque <aside> de arriba por este.
 * ─────────────────────────────────────────────────────────────────────────────
 */
