// app/dashboard/layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// REDISEÑO PREMIUM FASE 1 — Sidebar estilo Apple / SaaS clínico moderno.
// El sidebar anterior (dark/collapsible) queda comentado al final de este
// archivo para referencia y mantenimiento futuro.
// ─────────────────────────────────────────────────────────────────────────────

import { ClerkProvider } from "@clerk/nextjs";
import MobileNav from "./MobileNav";
import SidebarNav from "./SidebarNav";
import NotificationProvider from "@/components/NotificationProvider";
import DashboardPageTransition from "@/components/DashboardPageTransition";
import CortexAssistant from "@/Componentes/CortexAssistant";
import { TourProvider } from "@/ContextosGlobales/TourContext";

export const metadata = {
    title: "Dashboard — Agenda Clínica",
    description: "Panel de administración clínica",
};

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
    return (
        <ClerkProvider>
            <TourProvider>
                <div className="h-screen w-full overflow-hidden bg-[#FAFAFB] font-system-apple">
                    <div className="flex h-full w-full">

                        {/* ═══════════════ SIDEBAR PREMIUM ═══════════════ */}
                        <aside className="hidden md:flex h-screen w-[260px] shrink-0 flex-col border-r border-[#EAEAEC] bg-white">

                            {/* ── Navegación + UserMenu (componente cliente para persistencia) ── */}
                            <SidebarNav />
                        </aside>

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
            </TourProvider>
            <NotificationProvider />
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
