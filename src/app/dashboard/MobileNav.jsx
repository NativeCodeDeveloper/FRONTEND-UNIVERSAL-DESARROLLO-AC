"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Michroma } from "next/font/google";
import {
  CalendarDays,
  ClipboardPlus,
  FileText,
  FolderKanban,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  Menu,
  MonitorSmartphone,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { getDashboardRoleFromUser, getVisibleDashboardSections } from "@/lib/dashboard-access";

const michroma = Michroma({ weight: "400", subsets: ["latin"], display: "swap" });

const ICONS = {
  home: Home,
  panels: PanelsTopLeft,
  calendarDays: CalendarDays,
  clipboard: ClipboardPlus,
  users: Users,
  fileText: FileText,
  layout: LayoutGrid,
  monitor: MonitorSmartphone,
  image: ImageIcon,
  budget: Wallet,
  settings: Settings,
  folder: FolderKanban,
  lock: Lock,
  shield: ShieldCheck,
  academy: GraduationCap,
};

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const role = getDashboardRoleFromUser(user);
  const sections = getVisibleDashboardSections(role);

  return (
    <div className="md:hidden sticky top-0 z-40">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src="/logo.png" alt="AgendaClinica" className="h-8 w-8 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700/80">
                Panel clinico
              </p>
              <div className={`${michroma.className} mt-0.5 truncate text-[11px] leading-none text-slate-900`}>
                AgendaClinica
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === "cancelado" ? (
              <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">Cancelado</span>
              </div>
            ) : (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Movil
              </div>
            )}
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              aria-label={open ? "Cerrar menu" : "Abrir menu"}
            >
              {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 top-[68px] z-40 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 z-50 mx-3 mt-2 overflow-hidden rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.98))] shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
            <div className="relative overflow-hidden border-b border-slate-200/80 px-5 py-5">
              <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.15),transparent_58%),radial-gradient(circle_at_right,rgba(99,102,241,0.12),transparent_48%)]" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <img src="/logo.png" alt="AgendaClinica" className="h-10 w-10 object-contain" />
                </div>
                <div className="min-w-0">
                  <div className={`${michroma.className} text-[12px] text-slate-900`}>
                    AgendaClinica
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Accesos rapidos del dashboard
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Navegacion principal
                  </p>
                </div>
              </div>
            </div>

            <nav className="max-h-[72vh] space-y-4 overflow-y-auto px-4 pb-4 pt-4">
              {!isLoaded ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                </div>
              ) : role === "cancelado" ? (
                <div className="rounded-2xl border border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(254,226,226,0.88))] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-rose-800">Cuenta suspendida</p>
                      <p className="mt-0.5 text-[11px] text-rose-600/80">Suscripcion cancelada</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] leading-[1.5] text-rose-700/90">
                    Regularice sus pagos para recuperar el acceso al sistema.
                  </p>
                </div>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                  >
                    <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {section.title}
                    </div>

                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isExternal = item.href.startsWith("http");
                        const isActive = !isExternal && pathname === item.href;
                        const Icon = ICONS[item.icon] || Home;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-medium transition-all ${
                              isActive
                                ? "border border-cyan-200 bg-[linear-gradient(135deg,rgba(236,254,255,1),rgba(239,246,255,0.95))] text-slate-900 shadow-sm"
                                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1 leading-tight">{item.label}</span>
                            {isActive && <span className="h-2 w-2 rounded-full bg-cyan-500" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-2xl border border-cyan-100 bg-[linear-gradient(135deg,rgba(236,254,255,0.9),rgba(248,250,252,0.95))] p-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-semibold text-cyan-800 transition-all hover:bg-white/70"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="flex-1">Volver al sitio</span>
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
