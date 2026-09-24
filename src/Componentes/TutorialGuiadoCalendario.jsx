"use client";

// Tutorial Guiado Calendario — recorrido breve e ILUSTRATIVO del proceso
// completo de agendamiento en el calendario de reservas: primero señala el
// botón "Nueva reserva" y, al presionar "Siguiente", abre el drawer de reserva
// por su cuenta para mostrar sus secciones (horario, paciente, servicio y
// confirmación), sin que el usuario complete campos ni guarde nada.
//
// Es independiente del tour principal de TourContext: no navega a otras rutas
// ni exige condiciones de éxito (`esperar`), igual que TutorialGuiadoFichas y
// TutorialGuiadoCotizaciones. Comparte en cambio la misma librería (driver.js)
// y las mismas clases .ac-tour-* de globals.css, para que el popover se vea
// idéntico al del tutorial grande.

import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_CALENDARIO_STEPS } from "@/lib/tourCalendarioSteps";
import { useTour } from "@/ContextosGlobales/TourContext";

// Mismo ícono de brújula que usa "Tutorial Guiado" en el sidebar.
const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const GRUPO_LABEL = "Proceso de agendamiento";

// Puntos de progreso del popover: uno por paso (el tour principal agrupa por
// sección; acá el recorrido es tan corto que cada paso merece el suyo). El
// estado "pending" no tiene clase propia: es el gris base de .ac-dot.
function buildMeta(indiceActivo) {
    const dots = TOUR_CALENDARIO_STEPS
        .map((_, index) => {
            const state = index < indiceActivo ? "done" : index === indiceActivo ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${GRUPO_LABEL}</span></div>`;
}

// El drawer de reserva (AppointmentDrawer) se cierra con Escape: escucha
// keydown a nivel de document. Despachar esa tecla equivale a presionar
// "Cancelar": descarta el borrador del tour sin agendar nada y libera el
// scroll del body que el drawer bloquea mientras está montado.
function cerrarDrawerDeTour() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
}

/**
 * Botón "Tutorial Guiado Agendamiento". Recibe las mismas clases que los
 * botones que tiene al lado en el header (`className`, `claseIcono`,
 * `claseEtiqueta`) para quedar visualmente idéntico a ellos.
 */
export default function TutorialGuiadoCalendario({
    etiqueta = "Tutorial Guiado Agendamiento",
    ariaLabel,
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
}) {
    const { setTourExternoActivo } = useTour();
    const driverRef = useRef(null);
    const scrollPrevioRef = useRef(null);
    // Deja constancia de que el drawer abierto lo abrió este tour, para
    // cerrarlo al terminar y no descartar un borrador que el usuario mismo
    // tenía abierto al iniciar el recorrido.
    const drawerAbiertoPorTourRef = useRef(false);

    useEffect(() => () => {
        // Si el componente se desmonta con el tour vivo (navegación a otra
        // ruta), driver.js hay que destruirlo sí o sí: su overlay y sus
        // listeners de window sobreviven al render de React. Y si el drawer
        // abierto lo abrió el tour, también se cierra: dejaría un borrador
        // huérfano bloqueando el scroll de la página.
        driverRef.current?.destroy();
        driverRef.current = null;
        if (drawerAbiertoPorTourRef.current) {
            drawerAbiertoPorTourRef.current = false;
            cerrarDrawerDeTour();
        }
        setTourExternoActivo(false);
    }, [setTourExternoActivo]);

    const iniciarTour = useCallback(() => {
        if (driverRef.current?.isActive()) return;

        // Al presionar "Siguiente" en el paso del botón "Nueva reserva": recién
        // ahí se abre el drawer de agendamiento (primero se señala el botón, el
        // usuario avanza, y el clic programático dispara el flujo real de la
        // aplicación). Si ya estaba abierto —p. ej. al volver con "Atrás" y
        // avanzar de nuevo— no se vuelve a pulsar. El drawer entra con una
        // animación de 220ms (slideInRight); driver.js no vuelve a medir solo,
        // así que se refresca al terminar y recién después se avanza al primer
        // paso del formulario, ya bien medido.
        const abrirDrawerYAvanzar = () => {
            if (!document.querySelector('[data-tour="reserva-drawer"]')) {
                drawerAbiertoPorTourRef.current = true;
                document.getElementById("btn-nueva-reserva")?.click();
            }
            window.setTimeout(() => {
                driverRef.current?.refresh();
                driverRef.current?.moveNext();
            }, 340);
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
            // clic sobre el elemento (agendar o editar a mitad del tour crearía
            // o cambiaría una reserva de verdad).
            disableActiveInteraction: true,
            // Los pasos del drawer no existen hasta que el tour lo abre: con
            // este plazo, driver espera a que el ancla aparezca (MutationObserver)
            // antes de saltearse el paso. Un segundo cubre el montaje del portal
            // y su animación de entrada (220ms).
            waitForElement: 1200,
            // Si un ancla nunca llega a existir, el paso se salta solo en vez
            // de dejar el tour congelado.
            skipMissingElement: true,
            onHighlightStarted: (elemento, paso) => {
                // abrirRepetir: la sección "Repetir cita en más fechas" está
                // colapsada por defecto. El tour la despliega por su cuenta
                // (clic programático en su botón —que es la ancla del paso—;
                // disableActiveInteraction solo bloquea el puntero) para que se
                // vea el mini calendario que el paso explica. El ancla es la
                // franja del título y no la sección completa: desplegada, la
                // sección es más alta que la ventana del drawer y el recuadro
                // se vería cortado. El panel montará recién con el clic, así
                // que se re-mide cuando termine de asentarse.
                if (paso?.abrirRepetir && elemento && !document.querySelector('[data-tour="reserva-repetir-panel"]')) {
                    elemento?.click();
                    window.setTimeout(() => driverRef.current?.refresh(), 320);
                }

                // driver.js NO centra el elemento resaltado: lo mide donde esté
                // y, si el popover no entra del lado elegido, lo recoloca donde
                // haya espacio y puede tapar lo que el paso está explicando.
                // Centrarlo ANTES de la medición deja espacio simétrico para el
                // popover a ambos lados del elemento. En el drawer, el scroll lo
                // hace su contenedor interno, así que la sección queda centrada
                // también ahí.
                elemento?.scrollIntoView({ block: "center", behavior: "instant" });
            },
            steps: TOUR_CALENDARIO_STEPS.map((step, index) => ({
                element: step.selector ?? undefined,
                popover: {
                    side: step.side || "top",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildMeta(index)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: index === TOUR_CALENDARIO_STEPS.length - 1 ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                    // Con onNextClick definido, driver.js ya no avanza por su
                    // cuenta: abrirDrawerYAvanzar lo hace tras abrir el drawer.
                    ...(step.abrirDrawer ? { onNextClick: abrirDrawerYAvanzar } : {}),
                },
                abrirDrawer: step.abrirDrawer === true,
                abrirRepetir: step.abrirRepetir === true,
            })),
            onCloseClick: () => instancia.destroy(),
            onDestroyed: () => {
                driverRef.current = null;
                // El tour abrió el drawer para ilustrar el formulario: se
                // descarta el borrador al terminar, se cierre el tour como se
                // cierre ("Finalizar", la X o Escape). Si el drawer ya estaba
                // abierto por el usuario, se respeta y se deja tal cual.
                if (drawerAbiertoPorTourRef.current) {
                    drawerAbiertoPorTourRef.current = false;
                    cerrarDrawerDeTour();
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
            aria-label={ariaLabel || "Iniciar el tutorial guiado del proceso de agendamiento"}
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
