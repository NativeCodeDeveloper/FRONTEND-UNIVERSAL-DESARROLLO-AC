"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  CalendarDays,
  ClipboardPlus,
  Compass,
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
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { getDashboardRoleFromUser, getVisibleDashboardSections } from "@/lib/dashboard-access";

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
  compass: Compass,
  finance: TrendingUp,
};

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const role = getDashboardRoleFromUser(user);
  const sections = getVisibleDashboardSections(role);
  const name = user?.fullName || user?.firstName || "Usuario";
  const avatar = user?.imageUrl;

  return (
    <div className="md:hidden sticky top-0 z-40">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#6E56CF] bg-[#EDE9FE]">
              {avatar ? (
                <img src={avatar} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-[#6E56CF]">{name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-tight text-slate-900">{name}</p>
              <p className="text-[10px] font-medium text-slate-400">Panel clínico</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === "cancelado" && (
              <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">Cancelado</span>
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

          <div className="absolute left-0 right-0 z-50 mx-3 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#6E56CF] bg-[#EDE9FE] shadow-sm">
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-[#6E56CF]">{name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-slate-900">{name}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">Accesos rápidos del dashboard</p>
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
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
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
                    className="rounded-2xl border border-slate-200 bg-white p-2"
                  >
                    <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {section.title}
                    </div>

                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = ICONS[item.icon] || Home;

                        if (item.action === "startTour") {
                          // El tour guiado depende de marcadores data-tour que solo
                          // existen en el sidebar de escritorio (SidebarNav): en
                          // mobile queda roto (elementos ocultos o sin renderizar).
                          // Se omite aquí hasta tener soporte real para mobile.
                          return null;
                        }

                        const isExternal = item.href.startsWith("http");
                        const isActive = !isExternal && pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-all ${
                              isActive
                                ? "bg-[#F3F0FF] text-[#6E56CF]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                isActive ? "bg-[#EDE9FE] text-[#6E56CF]" : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1 leading-tight">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
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
