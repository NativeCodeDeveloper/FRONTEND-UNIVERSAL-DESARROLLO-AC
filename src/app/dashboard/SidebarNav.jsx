"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
// Headset (auriculares con microfono) en vez del salvavidas: se lee como
// "hablar con alguien", que es lo que hace el enlace, y no como emergencia.
import { Headset } from "lucide-react";
import UserMenu from "./UserMenu";
import NotificationBell from "@/components/NotificationBell";
import { getDashboardRoleFromUser, getVisibleDashboardSections } from "@/lib/dashboard-access";
import { useTour } from "@/ContextosGlobales/TourContext";
import { useDatosSoporte } from "@/hooks/useDatosSoporte";
import { construirUrlSoporte } from "@/lib/soporteWhatsapp";

const ICONS = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  document: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  folder: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  budget: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
    </svg>
  ),
  academy: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 8.5v7l6-3.5-6-3.5z" />
    </svg>
  ),
  compass: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
    </svg>
  ),
  finance: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 002 2h16M7 15l4-4 3 3 5-6" />
    </svg>
  ),
};

// Una ruta esta activa solo si coincide exacto o es una subruta real. Comparar
// con startsWith pelado hacia que "/dashboard" (Panel de Reservas) matcheara
// toda ruta del dashboard y "/dashboard/receta" matcheara "/dashboard/recetaRapida".
function isPathActive(pathname, href) {
  if (!pathname || !href || href.startsWith("http")) {
    return false;
  }

  // "/dashboard" es la ruta indice: solo activa en coincidencia exacta.
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveAccordion(pathname, sections) {
  for (const section of sections) {
    if (!section.accordionLabel) {
      continue;
    }

    if (section.items.some((item) => isPathActive(pathname, item.href))) {
      return section.id;
    }
  }

  return null;
}

function SectionLabel({ label }) {
  return (
    <div className="mb-1 mt-4 px-2.5">
      <span className="select-none whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function NavItem({ href, icon, label }) {
  const pathname = usePathname();
  const isExternal = href.startsWith("http");
  const isActive = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`group flex items-center gap-3 rounded-[12px] px-2.5 py-2 text-[13.5px] tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isActive
          ? "vidrio-pastilla font-medium text-slate-900"
          : "text-slate-700 hover:bg-white/45 hover:text-slate-900"
      }`}
    >
      {/* Ícono suelto, sin caja: como los SF Symbols de visionOS. */}
      <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
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
        className="group flex w-full items-center rounded-[10px] px-2.5 py-1.5 text-left text-[12.5px] tracking-[-0.01em] text-slate-600 transition-all duration-150 hover:bg-white/45 hover:text-slate-900"
      >
        <span className="leading-tight">{label}</span>
      </button>
    );
  }

  const isExternal = href.startsWith("http");
  const isActive = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`group flex items-center rounded-[10px] px-2.5 py-1.5 text-[12.5px] tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isActive
          ? "vidrio-pastilla font-medium text-slate-900"
          : "text-slate-600 hover:bg-white/45 hover:text-slate-900"
      }`}
    >
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
    <div className="mt-0.5">
      <button
        type="button"
        data-tour={dataTour}
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className={`relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-[12px] px-2.5 py-2 text-[13.5px] tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen
            ? "font-medium text-slate-900"
            : highlight
              ? "text-[#6E56CF] hover:bg-white/45"
              : "text-slate-700 hover:bg-white/45 hover:text-slate-900"
        }`}
      >
        {/* Sin caja ni borde: ícono suelto + texto, como la lista de visionOS.
            La pastilla de vidrio queda solo para la opción ACTIVA. */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
            {icon}
          </span>
          <span className="truncate leading-none">{label}</span>
        </div>
        <svg
          className={`h-3 w-3 flex-shrink-0 text-slate-400 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "rotate-180 text-slate-600" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Despliegue al estilo Apple: alto y opacidad con la curva de los paneles de iOS,
          y las opciones bajan apenas mientras aparecen. */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          maxHeight: isOpen ? `${contentHeight + 8}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          className={`flex flex-col gap-px pb-1 pl-[30px] pr-0 pt-0.5 transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "translate-y-0" : "-translate-y-1.5"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}



// Capa flotante anclada a un elemento del rail.
//
// Va en un PORTAL y con `position: fixed` por una razon concreta: la tarjeta
// del sidebar tiene `overflow-hidden` (es lo que recorta sus esquinas
// redondeadas) y la lista de iconos scrollea en vertical. Cualquier panel que
// salga por el costado, dibujado dentro de ese arbol, queda RECORTADO — y un
// `overflow-x: visible` no sirve: junto a un `overflow-y: auto` el navegador lo
// degrada a `auto`. Fuera del arbol no hay nada que lo corte.
function CapaFlotante({ anclaRef, children, separacion = 8 }) {
  const [montado, setMontado] = useState(false);
  const [pos, setPos] = useState(null);
  const capaRef = useRef(null);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    const medir = () => {
      const r = anclaRef.current?.getBoundingClientRect();
      if (!r) return;

      // El panel se ACOTA al alto de la ventana. Sin esto se dibujaba a la
      // altura de su icono y punto: la ultima seccion ("Contenido web", 5
      // items, ~207px) abierta en una pantalla baja se salia por abajo y sus
      // ultimas opciones quedaban fuera de alcance. El margen deja un respiro
      // contra los bordes.
      const margen = 8;
      const alto = capaRef.current?.offsetHeight ?? 0;
      const techo = window.innerHeight - alto - margen;
      const top = alto > 0 ? Math.max(margen, Math.min(r.top, techo)) : r.top;

      setPos((previa) => (
        previa && previa.left === r.right + separacion && previa.top === top
          ? previa
          : { left: r.right + separacion, top }
      ));
    };

    medir();
    // Se remide en scroll y resize: el ancla se mueve con la lista.
    window.addEventListener("scroll", medir, true);
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir, true);
      window.removeEventListener("resize", medir);
    };
  });

  if (!montado) return null;

  // Se dibuja siempre (oculto hasta tener posicion) para poder MEDIRLO: si se
  // devolviera null sin `pos`, nunca habria altura que acotar.
  return createPortal(
    <div
      ref={capaRef}
      style={{
        position: "fixed",
        left: pos ? pos.left : -9999,
        top: pos ? pos.top : 0,
        zIndex: 95,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

// ─── MODO RAIL ───────────────────────────────────────────────────────────────
// Un icono por SECCION (10), no por item (26): en 64px no caben 26 destinos, y
// aunque cupieran, una tira de 26 iconos sin texto no se memoriza. Las opciones
// de cada seccion salen en un flyout al pasar el raton por su icono.

const RETARDO_FLYOUT_ABRIR = 150;
const RETARDO_FLYOUT_CERRAR = 320;

function IconoRail({ section, activo, abierto, onAbrir, onCerrar, onAlternar, onElegir }) {
  const esEnlaceDirecto = !section.accordionLabel && section.items.length === 1;
  const etiqueta = section.accordionLabel || section.title;
  const anclaRef = useRef(null);
  const [sobreIcono, setSobreIcono] = useState(false);

  const contenido = (
    <>
      {/* Como el rail de visionOS: íconos sueltos y el activo dentro de un
          círculo de vidrio, que es la pista de "estás aquí" cuando no hay texto. */}
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          activo ? "vidrio-pastilla text-slate-900" : "text-slate-600 group-hover:bg-white/45 group-hover:text-slate-900"
        }`}
      >
        {ICONS[section.icon]}
      </span>
    </>
  );

  return (
    <div
      ref={anclaRef}
      className="relative"
      onMouseEnter={() => { setSobreIcono(true); onAbrir(); }}
      onMouseLeave={() => { setSobreIcono(false); onCerrar(); }}
      onFocusCapture={onAbrir}
    >
      {esEnlaceDirecto ? (
        <Link
          href={section.items[0].href}
          aria-label={etiqueta}
          onClick={onElegir}
          className="group relative flex h-11 w-full items-center justify-center"
        >
          {contenido}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={etiqueta}
          aria-haspopup="menu"
          aria-expanded={abierto}
          onClick={onAlternar}
          className="group relative flex h-11 w-full items-center justify-center"
        >
          {contenido}
        </button>
      )}

      {/* Tooltip solo para los enlaces directos: los que abren flyout ya
          muestran su nombre en la cabecera del panel. */}
      {esEnlaceDirecto && sobreIcono && (
        <CapaFlotante anclaRef={anclaRef}>
          <span className="vidrio-aparecer pointer-events-none block translate-y-[10px] whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm">
            {etiqueta}
          </span>
        </CapaFlotante>
      )}

      {abierto && !esEnlaceDirecto && (
        <CapaFlotante anclaRef={anclaRef} separacion={4}>
          {/* `pl-2` hace de puente: el raton cruza del icono al panel sin pasar
              por un hueco muerto, que es lo que hace parpadear a este patron. */}
          <div className="pl-2" role="menu" onMouseEnter={onAbrir} onMouseLeave={onCerrar} onClick={onElegir}>
            <div className="vidrio vidrio-flotante vidrio-aparecer w-[236px] rounded-[20px] p-2">
              <p className="px-2.5 pb-1 pt-1 text-[12px] font-semibold tracking-[-0.01em] text-slate-500">
                {etiqueta}
              </p>
              {section.items.map((item) => (
                <SubNavItem key={item.href || item.action} href={item.href} label={item.label} action={item.action} />
              ))}
            </div>
          </div>
        </CapaFlotante>
      )}
    </div>
  );
}

function NavRail({ sections, pathname, modo, onCambiarModo, urlSoporte }) {
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const temporizador = useRef(null);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const programar = (id, retardo) => {
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setSeccionAbierta(id), retardo);
  };

  return (
    <>
      <BotonModo modo={modo} onCambiarModo={onCambiarModo} colapsado />
      <UserMenu compacto />
      <div className="mx-3 border-t border-black/[0.06]" />
      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <IconoRail
              key={section.id}
              section={section}
              activo={section.items.some((item) => isPathActive(pathname, item.href))}
              abierto={seccionAbierta === section.id}
              onAbrir={() => programar(section.id, RETARDO_FLYOUT_ABRIR)}
              onCerrar={() => programar(null, RETARDO_FLYOUT_CERRAR)}
              onAlternar={() => {
                window.clearTimeout(temporizador.current);
                setSeccionAbierta((actual) => (actual === section.id ? null : section.id));
              }}
              onElegir={() => {
                window.clearTimeout(temporizador.current);
                setSeccionAbierta(null);
              }}
            />
          ))}
        </div>
      </nav>
      <div className="shrink-0 border-t border-black/[0.06] px-2 py-2">
        <Link
          href={urlSoporte}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacto Soporte"
          title="Contacto Soporte"
          className="group relative flex h-11 w-full items-center justify-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-all duration-300 group-hover:bg-white/45 group-hover:text-slate-900">
            <Headset className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
          </span>

        </Link>
      </div>
      <div className="flex shrink-0 justify-center px-2 pb-3">
        <NotificationBell />
      </div>
    </>
  );
}

// Boton de fijar/soltar. Deja el rail como una ELECCION reversible de un clic:
// quien no se acomode a los iconos lo fija y queda como siempre.
function BotonModo({ modo, onCambiarModo, colapsado, bloqueado }) {
  const fijado = modo === "fijado";

  return (
    <div className={`flex shrink-0 pt-3 ${colapsado ? "justify-center px-2" : "justify-end px-4"}`}>
      <button
        type="button"
        onClick={onCambiarModo}
        disabled={bloqueado}
        aria-pressed={fijado}
        title={bloqueado ? "No se puede cambiar mientras el tutorial está en curso" : fijado ? "Contraer el menú a iconos" : "Fijar el menú abierto"}
        aria-label={fijado ? "Contraer el menú a iconos" : "Fijar el menú abierto"}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 4v16" strokeLinecap="round" strokeLinejoin="round" />
          {fijado
            ? <path d="M14 9l-2 3 2 3" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M13 9l2 3-2 3" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </button>
    </div>
  );
}

export default function SidebarNav({ colapsado = false, modo = "fijado", onCambiarModo = () => {}, bloqueadoPorTour = false }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const role = getDashboardRoleFromUser(user);
  const sections = useMemo(() => getVisibleDashboardSections(role), [role]);

  const datosSoporte = useDatosSoporte();
  const urlSoporte = useMemo(() => construirUrlSoporte(datosSoporte), [datosSoporte]);
  const urlSoporteSuspendido = useMemo(
    () => construirUrlSoporte({ ...datosSoporte, motivo: "Cuenta suspendida" }),
    [datosSoporte],
  );

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

  // El rail se dibuja aparte: no es el mismo arbol con clases distintas, porque
  // los acordeones (que se despliegan hacia abajo) no tienen equivalente en
  // 64px — ahi las opciones salen de lado, en un flyout.
  if (colapsado && role !== "cancelado") {
    return <NavRail sections={sections} pathname={pathname} modo={modo} onCambiarModo={onCambiarModo} urlSoporte={urlSoporte} />;
  }

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
                <p className="mt-0.5 text-[10px] text-rose-600/80">Suscripción cancelada</p>
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
        <div className="mx-4 shrink-0 border-t border-black/[0.06] py-2">
          <NavItem href={urlSoporteSuspendido} icon={<Headset className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />} label="Contacto Soporte" />
        </div>
      </>
    );
  }

  return (
    <>
      <BotonModo modo={modo} onCambiarModo={onCambiarModo} bloqueado={bloqueadoPorTour} />
      <UserMenu />
      <nav className="mx-4 flex-1 overflow-y-auto border-t border-black/[0.06] pb-4 pt-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

        <div className="mt-3 border-t border-black/[0.06] pt-2">
          <NavItem href={urlSoporte} icon={<Headset className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />} label="Contacto Soporte" />
        </div>
      </nav>

      {/* Pie de notificaciones — tarjeta flotante.
          Antes era una franja plana con una línea dura a todo el ancho. Ahora
          es una tarjeta despegada de los bordes, con esquinas muy redondeadas,
          borde hairline y sombra en dos capas: una de contacto (1px, casi
          opaca) y otra difusa y muy abierta. Esa combinación es la que da la
          sensación de profundidad suave sin que se vea una sombra "dibujada".
          Sin degradados, acorde al resto del panel. */}
      <div className="shrink-0 px-3 pb-3 pt-1.5">
        <div className="flex items-center justify-between gap-2 rounded-[18px] border border-white/80 bg-white/55 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-16px_rgba(15,23,42,0.28)] transition-shadow duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_30px_-16px_rgba(15,23,42,0.34)]">
          <span className="text-[11px] font-semibold tracking-[-0.01em] text-slate-500">Notificaciones</span>
          <NotificationBell />
        </div>
      </div>
    </>
  );
}
