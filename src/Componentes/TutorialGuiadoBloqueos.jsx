"use client";

// Tutorial Guiado Bloqueos — recorrido breve e ILUSTRATIVO del proceso de
// bloqueo de agenda: profesional, días a bloquear (calendario Y rango de
// fechas), rango horario, motivo y el listado de bloqueos activos. El usuario
// no selecciona días ni guarda nada; al cerrar el recorrido no se creó ningún
// bloqueo y el modo de selección queda como estaba.
//
// Es independiente del tour principal de TourContext: no navega a otras rutas
// ni exige condiciones de éxito (`esperar`), igual que los demás tours
// livianos. Comparte en cambio la misma librería (driver.js) y las mismas
// clases .ac-tour-* de globals.css, para que el popover se vea idéntico al del
// tutorial grande.

import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_BLOQUEOS_STEPS } from "@/lib/tourBloqueosSteps";
import { useTour } from "@/ContextosGlobales/TourContext";

// Mismo ícono de brújula que usa "Tutorial Guiado" en el sidebar.
const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const GRUPO_LABEL = "Bloqueos de agenda";

// Puntos de progreso del popover: uno por paso (el tour principal agrupa por
// sección; acá el recorrido es tan corto que cada paso merece el suyo). El
// estado "pending" no tiene clase propia: es el gris base de .ac-dot.
function buildMeta(indiceActivo) {
    const dots = TOUR_BLOQUEOS_STEPS
        .map((_, index) => {
            const state = index < indiceActivo ? "done" : index === indiceActivo ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${GRUPO_LABEL}</span></div>`;
}

/**
 * Botón "Tutorial Guiado Bloqueos". Recibe las mismas clases que los botones
 * que tiene al lado en el header (`className`, `claseIcono`, `claseEtiqueta`)
 * para quedar visualmente idéntico a ellos.
 */
export default function TutorialGuiadoBloqueos({
    etiqueta = "Tutorial Guiado Bloqueos",
    ariaLabel,
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
}) {
    const { setTourExternoActivo } = useTour();
    const driverRef = useRef(null);
    const scrollPrevioRef = useRef(null);
    // Deja constancia de que el modo "Rango de fechas" lo activó este tour, para
    // restaurar "Días específicos" al terminar y no dejar la página en un estado
    // que el usuario no eligió.
    const rangoActivadoPorTourRef = useRef(false);

    useEffect(() => () => {
        // Si el componente se desmonta con el tour vivo (navegación a otra
        // ruta), driver.js hay que destruirlo sí o sí: su overlay y sus
        // listeners de window sobreviven al render de React. Y si el modo de
        // selección lo cambió el tour, se restaura.
        driverRef.current?.destroy();
        driverRef.current = null;
        if (rangoActivadoPorTourRef.current) {
            rangoActivadoPorTourRef.current = false;
            document.querySelector('[data-tour="bloqueo-especificos-boton"]')?.click();
        }
        setTourExternoActivo(false);
    }, [setTourExternoActivo]);

    const iniciarTour = useCallback(() => {
        if (driverRef.current?.isActive()) return;

        // Al presionar "Siguiente" en el paso del botón "Rango de fechas":
        // recién ahí el tour activa ese modo (clic programático sobre el botón
        // real del selector), para que el panel se muestre recién cuando el
        // usuario avanza. Si el panel ya está visible —el usuario partió en ese
        // modo, o volvió a este paso con "Atrás" y avanzó de nuevo— solo se
        // avanza. El cambio de modo no anima nada: moveNext puede ir de inmediato
        // y el paso siguiente espera su ancla con waitForElement.
        const activarRangoYAvanzar = () => {
            if (!document.querySelector('[data-tour="bloqueo-rango-panel"]')) {
                rangoActivadoPorTourRef.current = true;
                document.querySelector('[data-tour="bloqueo-rango-boton"]')?.click();
            }
            driverRef.current?.moveNext();
        };

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
            // clic sobre el elemento (seleccionar días o guardar a mitad del
            // tour crearía bloqueos reales).
            disableActiveInteraction: true,
            // Si un ancla no está en el DOM, driver la espera hasta este plazo
            // (MutationObserver) antes de saltarse el paso: cubre el instante
            // en que el panel de rango se monta tras activar el modo. Pasado el
            // plazo, el paso se salta solo en vez de dejar el tour congelado
            // (p. ej. el calendario si el usuario partió en modo rango).
            waitForElement: 800,
            skipMissingElement: true,
            onHighlightStarted: (elemento) => {
                // driver.js NO centra el elemento resaltado: lo mide donde esté
                // y, si el popover no entra del lado elegido, lo recoloca donde
                // haya espacio y puede tapar lo que el paso está explicando.
                // Centrarlo ANTES de la medición deja espacio simétrico para el
                // popover a ambos lados del elemento.
                elemento?.scrollIntoView({ block: "center", behavior: "instant" });
            },
            steps: TOUR_BLOQUEOS_STEPS.map((step, index) => ({
                element: step.selector ?? undefined,
                popover: {
                    side: step.side || "top",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildMeta(index)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: index === TOUR_BLOQUEOS_STEPS.length - 1 ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                    // Con onNextClick definido, driver.js ya no avanza por su
                    // cuenta: activarRangoYAvanzar lo hace tras cambiar el modo.
                    ...(step.activarRango ? { onNextClick: activarRangoYAvanzar } : {}),
                },
                activarRango: step.activarRango === true,
            })),
            onCloseClick: () => instancia.destroy(),
            onDestroyed: () => {
                driverRef.current = null;
                // Si el modo "Rango de fechas" lo activó el tour, se restaura
                // "Días específicos" al terminar, se cierre el tour como se
                // cierre ("Finalizar", la X o Escape).
                if (rangoActivadoPorTourRef.current) {
                    rangoActivadoPorTourRef.current = false;
                    document.querySelector('[data-tour="bloqueo-especificos-boton"]')?.click();
                }
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
            aria-label={ariaLabel || "Iniciar el tutorial guiado del bloqueo de agenda"}
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
