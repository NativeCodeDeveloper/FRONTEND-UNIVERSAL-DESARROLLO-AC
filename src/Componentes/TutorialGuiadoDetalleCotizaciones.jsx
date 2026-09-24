"use client";

// Tutorial Guiado Detalle Cotizaciones — recorrido breve y de solo lectura por
// la página de Detalle de cotización (exportar/enviar el presupuesto, catálogo
// de prestaciones, tabla del detalle y abono con sus totales).
//
// Es independiente del tour principal de TourContext: no navega a otras rutas
// ni exige condiciones de éxito (`esperar`), igual que TutorialGuiadoFichas y
// TutorialGuiadoCotizaciones. Comparte en cambio la misma librería (driver.js)
// y las mismas clases .ac-tour-* de globals.css, para que el popover se vea
// idéntico al del tutorial grande.

import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_DETALLE_COTIZACION_STEPS } from "@/lib/tourDetalleCotizacionSteps";
import { useTour } from "@/ContextosGlobales/TourContext";

// Mismo ícono de brújula que usa "Tutorial Guiado" en el sidebar.
const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const GRUPO_LABEL = "Detalle de la cotización";

// Puntos de progreso del popover: uno por paso (el tour principal agrupa por
// sección; acá el recorrido es tan corto que cada paso merece el suyo). El
// estado "pending" no tiene clase propia: es el gris base de .ac-dot.
function buildMeta(indiceActivo) {
    const dots = TOUR_DETALLE_COTIZACION_STEPS
        .map((_, index) => {
            const state = index < indiceActivo ? "done" : index === indiceActivo ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${GRUPO_LABEL}</span></div>`;
}

/**
 * Botón "Tutorial Guiado Detalle". Recibe las mismas clases que los botones
 * que tiene al lado en el header (`className`, `claseIcono`, `claseEtiqueta`)
 * para quedar visualmente idéntico a ellos.
 */
export default function TutorialGuiadoDetalleCotizaciones({
    etiqueta = "Tutorial Guiado Detalle",
    ariaLabel,
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
}) {
    const { setTourExternoActivo } = useTour();
    const driverRef = useRef(null);
    const scrollPrevioRef = useRef(null);

    useEffect(() => () => {
        // Si el componente se desmonta con el tour vivo (navegación a otra
        // ruta), driver.js hay que destruirlo sí o sí: su overlay y sus
        // listeners de window sobreviven al render de React.
        driverRef.current?.destroy();
        driverRef.current = null;
        setTourExternoActivo(false);
    }, [setTourExternoActivo]);

    const iniciarTour = useCallback(() => {
        if (driverRef.current?.isActive()) return;

        const instancia = driver({
            allowClose: true,
            // Mismo criterio que el tour principal: la capa oscura no mueve el
            // recorrido; se avanza solo con "Siguiente"/"Atrás" o Escape.
            overlayClickBehavior: () => {},
            overlayOpacity: 0.55,
            stagePadding: 6,
            stageRadius: 12,
            popoverClass: "ac-tour-popover",
            smoothScroll: false,
            // Recorrido de solo lectura: el recuadro resaltado no deja hacer
            // clic sobre el elemento (agregar prestaciones, guardar
            // observaciones o exportar el PDF a mitad del tour serían acciones
            // reales que el usuario no está pidiendo hacer).
            disableActiveInteraction: true,
            // Si un ancla no está en el DOM (los datos todavía cargan), el paso
            // se salta solo en vez de dejar el tour congelado.
            skipMissingElement: true,
            onHighlightStarted: (elemento) => {
                // driver.js NO centra el elemento resaltado: lo mide donde esté
                // y, si el popover no entra arriba (element.top < altura del
                // popover), lo voltea hacia abajo y tapa justo lo que el paso
                // está explicando (le pasó a la tarjeta del detalle, que es
                // ancha y queda a media página). Centrarlo ANTES de la medición
                // deja espacio simétrico para el popover y mantiene a la vista
                // el contenido que se explica. Corre antes de que driver mida,
                // igual que la apertura de <details> en TutorialGuiadoFichas.
                elemento?.scrollIntoView({ block: "center", behavior: "instant" });
            },
            steps: TOUR_DETALLE_COTIZACION_STEPS.map((step, index) => ({
                element: step.selector ?? undefined,
                popover: {
                    side: step.side || "top",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildMeta(index)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: index === TOUR_DETALLE_COTIZACION_STEPS.length - 1 ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                },
            })),
            onCloseClick: () => instancia.destroy(),
            onDestroyed: () => {
                driverRef.current = null;
                document.documentElement.style.scrollBehavior = scrollPrevioRef.current || "";
                setTourExternoActivo(false);
            },
        });

        driverRef.current = instancia;
        scrollPrevioRef.current = document.documentElement.style.scrollBehavior;
        // Mismo motivo que en TourContext: un scroll-behavior suave en <html>
        // desincroniza la medición del popover durante los saltos entre pasos.
        document.documentElement.style.scrollBehavior = "auto";
        // Oculta Cortex y el banner de notificaciones mientras corre, igual que
        // en el tour principal (quedarían como manchas grises bajo el overlay).
        setTourExternoActivo(true);
        instancia.drive(0);
    }, [setTourExternoActivo]);

    return (
        <button
            type="button"
            onClick={iniciarTour}
            aria-label={ariaLabel || "Iniciar el tutorial guiado del detalle de la cotización"}
            className={className}
        >
            <span className={claseIcono}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
                </svg>
            </span>
            <span className={claseEtiqueta}>{etiqueta}</span>
        </button>
    );
}
