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

export const metadata = {
    title: "Dashboard — Agenda Clínica",
    description: "Panel de administración clínica",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function NavAccordion({ label, icon, defaultOpen = false, children }) {
    return (
        <details className="group mt-1" open={defaultOpen}>
            <summary className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition-all duration-150 hover:bg-[#F3F0FF] hover:text-[#6E56CF] group-open:bg-[#F3F0FF] group-open:text-[#6E56CF] select-none list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-150 group-hover:bg-[#EDE9FE] group-hover:text-[#6E56CF] group-open:bg-[#EDE9FE] group-open:text-[#6E56CF]">
                        {icon}
                    </span>
                    <span className="leading-none">{label}</span>
                </div>
                <svg className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <div className="mt-1 flex flex-col gap-0.5 pl-[3.25rem] pr-2 pb-1">
                {children}
            </div>
        </details>
    );
}

function SubNavItem({ href, label }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-2 rounded-lg px-2 py-2 text-[12px] font-medium text-slate-500 transition-all duration-150 hover:bg-[#F3F0FF] hover:text-[#6E56CF]"
        >
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-[#6E56CF]" />
            <span className="leading-tight">{label}</span>
        </Link>
    );
}



function NavGroup({ label }) {
    return (
        <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 select-none first:mt-2">
            {label}
        </p>
    );
}

function NavItem({ href, icon, label, badge = null }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition-all duration-150 hover:bg-[#F3F0FF] hover:text-[#6E56CF]"
        >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-150 group-hover:bg-[#EDE9FE] group-hover:text-[#6E56CF]">
                {icon}
            </span>
            <span className="flex-1 leading-none">{label}</span>
            {badge && (
                <span className="rounded-full bg-[#6E56CF] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}

// ─── Iconos inline (SVG) ──────────────────────────────────────────────────────
const IcoHome = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
const IcoCalendar = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const IcoReservas = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);
const IcoPacientes = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IcoProfesionales = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const IcoServicios = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);
const IcoPagos = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);
const IcoAjustes = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IcoUsuarios = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const IcoBloq = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);
const IcoDocumentos = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const IcoContenido = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const IcoCarpeta = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
);
const IcoFichas = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);
// ─── Layout principal ─────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
    return (
        <ClerkProvider>
            <div className="h-screen w-full overflow-hidden bg-[#FAFAFB]">
                <div className="flex h-full w-full">

                    {/* ═══════════════ SIDEBAR PREMIUM ═══════════════ */}
                    <aside className="hidden md:flex h-screen w-[260px] shrink-0 flex-col bg-[#FCFCFD] border-r border-[#EAEAEC]">

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
