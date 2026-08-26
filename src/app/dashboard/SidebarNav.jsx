"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import UserMenu from "./UserMenu";
import { getDashboardRoleFromUser, getVisibleDashboardSections } from "@/lib/dashboard-access";
import { useTour } from "@/ContextosGlobales/TourContext";

const ICONS = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  document: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  folder: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  budget: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
    </svg>
  ),
  academy: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 8.5v7l6-3.5-6-3.5z" />
    </svg>
  ),
  compass: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
    </svg>
  ),
  finance: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 002 2h16M7 15l4-4 3 3 5-6" />
    </svg>
  ),
};

function getActiveAccordion(pathname, sections) {
  for (const section of sections) {
    if (!section.accordionLabel) {
      continue;
    }

    if (section.items.some((item) => pathname.startsWith(item.href))) {
      return section.id;
    }
  }

  return null;
}

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1 px-3">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300 whitespace-nowrap select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function NavItem({ href, icon, label }) {
  const pathname = usePathname();
  const isExternal = href.startsWith("http");
  const isActive = !isExternal && (pathname === href || (href !== "/dashboard" && pathname.startsWith(href)));

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all duration-150 ${
        isActive
          ? "bg-[#F3F0FF] text-[#6E56CF]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
          isActive
            ? "bg-[#EDE9FE] text-[#6E56CF]"
            : "bg-slate-100/80 text-slate-400 group-hover:bg-slate-200/60 group-hover:text-slate-600"
        }`}
      >
        {icon}
      </span>
      <span className="leading-none">{label}</span>
    </Link>
  );
}

function SubNavItem({ href, label, action }) {
  const pathname = usePathname();
  const { start: startTour } = useTour();

  if (action === "startTour") {
    return (
      <button
        type="button"
        onClick={() => startTour()}
        className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-slate-500 transition-all duration-150 hover:bg-slate-50 hover:text-slate-700"
      >
        <div className="h-1 w-1 rounded-full bg-slate-300 transition-colors group-hover:bg-slate-400" />
        <span className="leading-tight">{label}</span>
      </button>
    );
  }

  const isExternal = href.startsWith("http");
  const isActive = !isExternal && pathname.startsWith(href);

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all duration-150 ${
        isActive
          ? "bg-[#F3F0FF] text-[#6E56CF]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      <div
        className={`h-1 w-1 rounded-full transition-colors ${
          isActive ? "bg-[#6E56CF]" : "bg-slate-300 group-hover:bg-slate-400"
        }`}
      />
      <span className="leading-tight">{label}</span>
    </Link>
  );
}

function NavAccordion({ id, label, icon, children, openAccordions, onToggle, dataTour, highlight }) {
  const isOpen = openAccordions.has(id);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, children]);

  return (
    <div className="mt-1.5">
      <button
        type="button"
        data-tour={dataTour}
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className={`relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-xl border px-2.5 py-2 text-[12px] font-medium transition-all duration-200 ${
          isOpen
            ? "border-[#EDE9FE] bg-[#F4F1FF] text-slate-800"
            : highlight
              ? "border-[#EDE9FE] bg-[#FAF9FF] text-slate-700 hover:border-[#E4DEFC] hover:bg-[#F4F1FF] hover:text-slate-900"
              : "border-transparent text-slate-600 hover:border-slate-100 hover:bg-slate-50/80 hover:text-slate-900"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              isOpen || highlight ? "bg-[#EDE9FE] text-[#6E56CF] shadow-sm" : "bg-slate-50 text-slate-500"
            }`}
          >
            {icon}
          </span>
          <span className="truncate leading-none">{label}</span>
        </div>
        <svg
          className={`h-3 w-3 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#6E56CF]" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentHeight + 8}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="flex flex-col gap-px pb-1 pl-11 pr-1 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SidebarNav() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const role = getDashboardRoleFromUser(user);
  const sections = useMemo(() => getVisibleDashboardSections(role), [role]);

  const [openAccordions, setOpenAccordions] = useState(() => {
    const active = getActiveAccordion(pathname, sections);
    return new Set(active ? [active] : []);
  });

  useEffect(() => {
    const active = getActiveAccordion(pathname, sections);

    setOpenAccordions((prev) => {
      const next = new Set(prev);

      if (active) {
        next.add(active);
      }

      for (const id of [...next]) {
        if (!sections.some((section) => section.id === id && section.accordionLabel)) {
          next.delete(id);
        }
      }

      return next;
    });
  }, [pathname, sections]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("sidebar_open") || "[]");

      if (!Array.isArray(saved) || saved.length === 0) {
        return;
      }

      setOpenAccordions((prev) => {
        const next = new Set(prev);

        saved.forEach((id) => {
          if (sections.some((section) => section.id === id && section.accordionLabel)) {
            next.add(id);
          }
        });

        return next;
      });
    } catch {}
  }, [sections]);

  function toggleAccordion(id) {
    setOpenAccordions((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      try {
        sessionStorage.setItem("sidebar_open", JSON.stringify([...next]));
      } catch {}

      return next;
    });
  }

  if (!isLoaded) return null;

  if (role === "cancelado") {
    return (
      <>
        <UserMenu />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-rose-800">Cuenta suspendida</p>
                <p className="mt-0.5 text-[10px] text-rose-600/80">Suscripcion cancelada</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-[1.5] text-rose-700/90">
              Regularice sus pagos para recuperar el acceso al sistema.
            </p>
            <Link
              href="/"
              className="mt-3 flex h-8 w-full items-center justify-center rounded-lg bg-rose-600 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-rose-700"
            >
              Volver al sitio
            </Link>
          </div>
        </div>

      </>
    );
  }

  return (
    <>
      <UserMenu />
      <nav className="mx-4 flex-1 overflow-y-auto border-t border-slate-100 pb-4 pt-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => {
            if (!section.accordionLabel) {
              return (
                <div key={section.id}>
                  {section.title ? <SectionLabel label={section.title} /> : null}
                  {section.items.map((item) => (
                    <NavItem key={item.href} href={item.href} icon={ICONS[item.icon]} label={item.label} />
                  ))}
                </div>
              );
            }

            return (
              <div key={section.id} className="mt-1">
                <NavAccordion
                  id={section.id}
                  label={section.accordionLabel}
                  icon={ICONS[section.icon]}
                  openAccordions={openAccordions}
                  onToggle={toggleAccordion}
                  dataTour={`nav-${section.id}`}
                  highlight={section.id === "capacitaciones"}
                >
                  {section.items.map((item) => (
                    <SubNavItem key={item.href || item.action} href={item.href} label={item.label} action={item.action} />
                  ))}
                </NavAccordion>
              </div>
            );
          })}
      </nav>

    </>
  );
}
