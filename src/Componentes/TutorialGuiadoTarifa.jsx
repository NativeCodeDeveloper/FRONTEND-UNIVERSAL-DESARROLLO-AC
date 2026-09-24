"use client";

// Tutorial Guiado Tarifas — recorrido breve e ILUSTRATIVO de la administración
// de tarifas de servicios agendables: profesional, servicio, precio y
// duración, y el listado de tarifas registradas. El usuario no completa campos
// ni guarda nada; al cerrar el recorrido no se registró ninguna tarifa.
//
// Incluye una advertencia crítica: esta información NO se usa para cotizar —
// es la que ven los pacientes en la web de agendamiento y al agendar en el
// calendario.
//
// Es independiente del tour principal de TourContext: no navega a otras rutas
// ni exige condiciones de éxito (`esperar`), igual que los demás tours
// livianos. Comparte en cambio la misma librería (driver.js) y las mismas
// clases .ac-tour-* de globals.css, para que el popover se vea idéntico al del
// tutorial grande.

import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_TARIFA_STEPS } from "@/lib/tourTarifaSteps";
import { useTour } from "@/ContextosGlobales/TourContext";

// Mismo ícono de brújula que usa "Tutorial Guiado" en el sidebar.
const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const GRUPO_LABEL = "Tarifas de servicios agendables";

// Puntos de progreso del popover: uno por paso (el tour principal agrupa por
// sección; acá el recorrido es tan corto que cada paso merece el suyo). El
// estado "pending" no tiene clase propia: es el gris base de .ac-dot.
function buildMeta(indiceActivo) {
    const dots = TOUR_TARIFA_STEPS
        .map((_, index) => {
            const state = index < indiceActivo ? "done" : index === indiceActivo ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${GRUPO_LABEL}</span></div>`;
}

/**
 * Botón "Tutorial Guiado" de tarifas. Recibe las mismas clases que los botones
 * que tenga al lado en el header (`className`, `claseIcono`, `claseEtiqueta`)
 * para quedar visualmente idéntico a ellos.
 */
export default function TutorialGuiadoTarifa({
    etiqueta = "Tutorial Guiado",
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
            // clic sobre el elemento (guardar, actualizar o eliminar una tarifa
            // a mitad del tour sería una acción real).
            disableActiveInteraction: true,
            // Si un ancla no está en el DOM (los datos todavía cargan), el paso
            // se salta solo en vez de dejar el tour congelado.
            skipMissingElement: true,
            onHighlightStarted: (elemento) => {
                // driver.js NO centra el elemento resaltado: lo mide donde esté
                // y, si el popover no entra del lado elegido, lo recoloca donde
                // haya espacio y puede tapar lo que el paso está explicando.
                // Centrarlo ANTES de la medición deja espacio simétrico para el
                // popover a ambos lados del elemento.
                elemento?.scrollIntoView({ block: "center", behavior: "instant" });
            },
            steps: TOUR_TARIFA_STEPS.map((step, index) => ({
                element: step.selector ?? undefined,
                popover: {
                    side: step.side || "top",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildMeta(index)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: index === TOUR_TARIFA_STEPS.length - 1 ? "Finalizar" : "Siguiente",
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
            aria-label={ariaLabel || "Iniciar el tutorial guiado de tarifas de servicios agendables"}
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
