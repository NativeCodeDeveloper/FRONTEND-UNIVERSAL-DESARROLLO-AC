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
                        {/* ── SIDEBAR FLOTANTE ──────────────────────────────
                            Antes iba pegado al borde con una línea dura a la
                            derecha. Ahora es una tarjeta despegada de los
                            bordes, con el mismo tratamiento del pie de
                            notificaciones: borde hairline y sombra en dos
                            capas — una de contacto (1px, casi opaca) y otra
                            difusa y muy abierta. Esa combinación da profundidad
                            sin que se vea una sombra "dibujada".

                            La columna mide 284px para que la tarjeta conserve
                            sus 260px: el respiro se gana afuera, no quitándole
                            ancho al menú. */}
                        <aside className="hidden md:flex h-screen w-[284px] shrink-0 flex-col p-3">
                            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-18px_rgba(15,23,42,0.30)]">
                                {/* ── Navegación + UserMenu (componente cliente para persistencia) ── */}
                                <SidebarNav />
                            </div>
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

                {/* Dentro de TourProvider a propósito: el banner de permisos
                    necesita saber si el tour está corriendo para no aparecer
                    sepultado bajo el overlay del tutorial (z-50 vs z-10000). */}
                <NotificationProvider />
            </TourProvider>
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
