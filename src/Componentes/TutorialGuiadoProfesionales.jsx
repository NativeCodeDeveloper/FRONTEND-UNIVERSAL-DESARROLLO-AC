"use client";

// Tutorial Guiado Profesionales — recorrido breve e ILUSTRATIVO del registro
// y administración de agendas: primero señala el botón "Nuevo Profesional" y,
// al presionar "Siguiente", abre el formulario por su cuenta para mostrar sus
// campos, sin que el usuario complete nada ni guarde.
//
// Incluye una aclaración crítica: esta sección crea AGENDAS, no usuarios
// (para eso está "Crear Usuarios" en el menú lateral), y cada registro puede
// ser un profesional, un box, un horario o lo que mejor se acomode a la
// gestión del usuario.
//
// Es independiente del tour principal de TourContext: no navega a otras rutas
// ni exige condiciones de éxito (`esperar`), igual que los demás tours
// livianos. Comparte en cambio la misma librería (driver.js) y las mismas
// clases .ac-tour-* de globals.css, para que el popover se vea idéntico al del
// tutorial grande.

import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_PROFESIONALES_STEPS } from "@/lib/tourProfesionalesSteps";
import { useTour } from "@/ContextosGlobales/TourContext";

// Mismo ícono de brújula que usa "Tutorial Guiado" en el sidebar.
const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const GRUPO_LABEL = "Agendas de profesionales";

// Puntos de progreso del popover: uno por paso (el tour principal agrupa por
// sección; acá el recorrido es tan corto que cada paso merece el suyo). El
// estado "pending" no tiene clase propia: es el gris base de .ac-dot.
function buildMeta(indiceActivo) {
    const dots = TOUR_PROFESIONALES_STEPS
        .map((_, index) => {
            const state = index < indiceActivo ? "done" : index === indiceActivo ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${GRUPO_LABEL}</span></div>`;
}

// El formulario de profesional (ProfesionalModal) se cierra con Escape:
// escucha keydown a nivel de document. Despachar esa tecla equivale a
// presionar la X: descarta el borrador del tour sin registrar nada.
function cerrarModalDeTour() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
}

/**
 * Botón "Tutorial Guiado" de profesionales. Recibe las mismas clases que los
 * botones que tiene al lado en el header (`className`, `claseIcono`,
 * `claseEtiqueta`) para quedar visualmente idéntico a ellos.
 */
export default function TutorialGuiadoProfesionales({
    etiqueta = "Tutorial Guiado",
    ariaLabel,
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
}) {
    const { setTourExternoActivo } = useTour();
    const driverRef = useRef(null);
    const scrollPrevioRef = useRef(null);
    // Deja constancia de que el formulario abierto lo abrió este tour, para
    // cerrarlo al terminar y no descartar un formulario que el usuario mismo
    // tenía abierto al iniciar el recorrido.
    const modalAbiertoPorTourRef = useRef(false);

    useEffect(() => () => {
        // Si el componente se desmonta con el tour vivo (navegación a otra
        // ruta), driver.js hay que destruirlo sí o sí: su overlay y sus
        // listeners de window sobreviven al render de React. Y si el formulario
        // abierto lo abrió el tour, también se cierra: dejaría un borrador
        // huérfano encima de la página.
        driverRef.current?.destroy();
        driverRef.current = null;
        if (modalAbiertoPorTourRef.current) {
            modalAbiertoPorTourRef.current = false;
            cerrarModalDeTour();
        }
        setTourExternoActivo(false);
    }, [setTourExternoActivo]);

    const iniciarTour = useCallback(() => {
        if (driverRef.current?.isActive()) return;

        // Al presionar "Siguiente" en el paso del botón "Nuevo Profesional":
        // recién ahí se abre el formulario (primero se señala el botón, el
        // usuario avanza, y el clic programático dispara el flujo real de la
        // aplicación). Si ya estaba abierto —el usuario partió con el formulario
        // abierto, o volvió a este paso con "Atrás" y avanzó de nuevo— solo se
        // avanza. Se espera un instante por si el modal entra con animación y
        // se refresca la medición antes de avanzar al primer campo.
        const abrirModalYAvanzar = () => {
            if (!document.querySelector("[data-tour-modal]")) {
                modalAbiertoPorTourRef.current = true;
                document.querySelector('[data-tour="profesional-nuevo"]')?.click();
            }
            window.setTimeout(() => {
                driverRef.current?.refresh();
                driverRef.current?.moveNext();
            }, 340);
        };

        // Al presionar "Siguiente" en el último paso del formulario ("Guardar
        // la agenda"): el tour cierra el modal que él mismo abrió, para que los
        // pasos siguientes (buscador y listado) no queden tapados por el
        // formulario. Si el modal lo abrió el usuario, se deja abierto. Nota:
        // con onNextClick definido, driver.js ya no avanza por su cuenta, así
        // que este handler termina con moveNext().
        const cerrarModalYAvanzar = () => {
            if (modalAbiertoPorTourRef.current && document.querySelector("[data-tour-modal]")) {
                modalAbiertoPorTourRef.current = false;
                cerrarModalDeTour();
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
            // clic sobre el elemento (guardar o eliminar a mitad del tour sería
            // una acción real sobre las agendas).
            disableActiveInteraction: true,
            // Los pasos del formulario no existen hasta que el tour lo abre: con
            // este plazo, driver espera a que el ancla aparezca (MutationObserver)
            // antes de saltearse el paso. Un segundo cubre el montaje del modal
            // y su animación de entrada.
            waitForElement: 1200,
            // Si un ancla nunca llega a existir (p. ej. la tarjeta del listado
            // si todavía no hay agendas registradas), el paso se salta solo en
            // vez de dejar el tour congelado.
            skipMissingElement: true,
            onHighlightStarted: (elemento) => {
                // driver.js NO centra el elemento resaltado: lo mide donde esté
                // y, si el popover no entra del lado elegido, lo recoloca donde
                // haya espacio y puede tapar lo que el paso está explicando.
                // Centrarlo ANTES de la medición deja espacio simétrico para el
                // popover a ambos lados del elemento.
                elemento?.scrollIntoView({ block: "center", behavior: "instant" });
            },
            steps: TOUR_PROFESIONALES_STEPS.map((step, index) => ({
                element: step.selector ?? undefined,
                popover: {
                    side: step.side || "top",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildMeta(index)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: index === TOUR_PROFESIONALES_STEPS.length - 1 ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                    // Con onNextClick definido, driver.js ya no avanza por su
                    // cuenta: abrirModalYAvanzar lo hace tras abrir el formulario
                    // y cerrarModalYAvanzar tras cerrarlo.
                    ...(step.abrirModal ? { onNextClick: abrirModalYAvanzar } : {}),
                    ...(step.cerrarModal ? { onNextClick: cerrarModalYAvanzar } : {}),
                },
                abrirModal: step.abrirModal === true,
            })),
            onCloseClick: () => instancia.destroy(),
            onDestroyed: () => {
                driverRef.current = null;
                // El tour abrió el formulario para ilustrar los campos: se
                // descarta al terminar, se cierre el tour como se cierre
                // ("Finalizar", la X o Escape). Si el formulario ya estaba
                // abierto por el usuario, se respeta y se deja tal cual.
                if (modalAbiertoPorTourRef.current) {
                    modalAbiertoPorTourRef.current = false;
                    cerrarModalDeTour();
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
            aria-label={ariaLabel || "Iniciar el tutorial guiado de profesionales"}
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
