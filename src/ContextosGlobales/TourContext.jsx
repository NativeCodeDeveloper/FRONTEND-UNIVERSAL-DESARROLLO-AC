"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "@/lib/tourSteps";
import { canAccessDashboardPath, getDashboardRoleFromUser } from "@/lib/dashboard-access";

const COMPLETED_KEY = "ac_tour_completado";

const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

// Pasos sin "route" (ej. resaltar un ítem del sidebar) ya se saltan solos si
// el elemento no existe en el DOM — el sidebar filtra sus secciones por rol.
// Pero un paso CON route fuerza router.push aunque el rol no tenga acceso a
// esa página (el middleware lo redirige a otra parte), dejando al usuario
// varado ahí mientras el tour espera 8s por un selector que nunca va a
// aparecer. Por eso se filtran acá antes de construir los steps del driver.
function getStepsForRole(role) {
    return TOUR_STEPS.filter((step) => !step.route || canAccessDashboardPath(role, step.route));
}

function waitForRoute(pathnameRef, target, callback) {
    if (!target || pathnameRef.current === target) {
        callback();
        return;
    }
    let attempts = 0;
    const tick = () => {
        if (pathnameRef.current === target || attempts > 200) {
            callback();
            return;
        }
        attempts += 1;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

// Espera a que el elemento objetivo exista Y deje de moverse (layout estable)
// antes de continuar — evita resaltar un elemento que todavía está siendo
// reposicionado por datos que cargan de forma asíncrona (ej. profesionales).
function waitForStableElement(selector, callback, frames = 6) {
    if (!selector) {
        callback();
        return;
    }
    let stableCount = 0;
    let lastKey = null;
    let attempts = 0;
    const tick = () => {
        const el = document.querySelector(selector);
        const rect = el?.getBoundingClientRect();
        const key = rect ? `${rect.top}|${rect.left}|${rect.width}|${rect.height}` : null;

        if (key && key === lastKey) {
            stableCount += 1;
        } else {
            stableCount = 0;
            lastKey = key;
        }

        if ((key && stableCount >= frames) || attempts > 300) {
            callback();
            return;
        }
        attempts += 1;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function buildTourMeta(step, groups) {
    const currentGroupIndex = groups.indexOf(step.grupo);
    const dots = groups
        .map((_, index) => {
            const state = index < currentGroupIndex ? "done" : index === currentGroupIndex ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${step.grupo}</span></div>`;
}

const TourContext = createContext(null);

export function TourProvider({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const driverRef = useRef(null);
    const pathnameRef = useRef(pathname);
    const role = getDashboardRoleFromUser(user);
    const tourSteps = useMemo(() => getStepsForRole(role), [role]);
    const tourGroups = useMemo(() => [...new Set(tourSteps.map((step) => step.grupo))], [tourSteps]);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => () => {
        driverRef.current?.destroy();
        driverRef.current = null;
    }, []);

    const buildDriver = useCallback(() => {
        const steps = tourSteps.map((step, index) => {
            const isFirst = index === 0;
            const isLast = index === tourSteps.length - 1;
            const isInteractive = step.interactive === true;

            return {
                element: step.selector,
                advanceOnClick: isInteractive,
                onHighlighted: (element) => {
                    // OJO: no usar aria-expanded acá — driver.js lo sobrescribe a "true"
                    // en CUALQUIER elemento que resalta (lo usa para su propio popover,
                    // sin relación con el estado real del acordeón). Se revisa en cambio
                    // el maxHeight inline del contenido (el mismo wrapper que anima la
                    // apertura en NavAccordion), que sí refleja el estado real de React.
                    const contentWrapper = element?.nextElementSibling;
                    const isCollapsed = !!contentWrapper && contentWrapper.style.maxHeight === "0px";

                    // Abre el acordeón del sidebar por sí solo en vez de esperar a que
                    // el usuario adivine que debe hacer clic exactamente ahí — evita que
                    // quede desincronizado con el estado persistido en sessionStorage
                    // (que podía dejar la opción sin mostrarse realmente).
                    if (step.autoExpand && isCollapsed) {
                        element.click();
                    }
                    if (step.skipIfExpanded && contentWrapper && !isCollapsed) {
                        driverRef.current?.moveNext();
                    }
                },
                popover: {
                    side: step.side || "right",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildTourMeta(step, tourGroups)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: isInteractive
                        ? ["close"]
                        : (isFirst || step.noPrevious) ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: isLast ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                    onNextClick: () => {
                        const next = tourSteps[index + 1];

                        if (next?.route && next.route !== pathnameRef.current) {
                            router.push(next.route);
                            waitForRoute(pathnameRef, next.route, () => {
                                waitForStableElement(next.selector, () => driverRef.current?.moveNext());
                            });
                            return;
                        }
                        driverRef.current?.moveNext();
                    },
                    onPrevClick: () => {
                        const prev = tourSteps[index - 1];
                        if (prev?.route && prev.route !== pathnameRef.current) {
                            router.push(prev.route);
                            waitForRoute(pathnameRef, prev.route, () => {
                                waitForStableElement(prev.selector, () => driverRef.current?.movePrevious());
                            });
                            return;
                        }
                        driverRef.current?.movePrevious();
                    },
                },
            };
        });

        const instance = driver({
            showProgress: false,
            allowClose: true,
            overlayClickBehavior: "nextStep",
            overlayOpacity: 0.55,
            stagePadding: 6,
            stageRadius: 12,
            popoverClass: "ac-tour-popover",
            waitForElement: 8000,
            // Si el elemento de un paso nunca aparece en el DOM (ej. el usuario
            // quedó en una ruta distinta, o un elemento condicional no se
            // renderizó), driver.js salta automáticamente al siguiente paso
            // válido en esa misma dirección en vez de dejar el tour "colgado".
            skipMissingElement: true,
            steps,
            onCloseClick: () => instance.destroy(),
            onDestroyed: (_element, _step, opts) => {
                try { localStorage.setItem(COMPLETED_KEY, "1"); } catch {}

                // Solo redirige a Panel de Reservas si el tour terminó de forma
                // natural (el usuario llegó al último paso y presionó "Finalizar").
                // Si cierra o sale antes, lo deja donde esté — no lo saca de la
                // página en la que estaba trabajando.
                const finishedLastStep = opts?.index === tourSteps.length - 1;
                if (finishedLastStep && pathnameRef.current !== "/dashboard") {
                    router.push("/dashboard");
                }
            },
        });

        driverRef.current = instance;
        return instance;
    }, [router, tourSteps, tourGroups]);

    const start = useCallback(() => {
        const instance = buildDriver();
        const firstStep = tourSteps[0];
        if (firstStep?.route && firstStep.route !== pathnameRef.current) {
            router.push(firstStep.route);
            waitForRoute(pathnameRef, firstStep.route, () => {
                waitForStableElement(firstStep.selector, () => instance.drive(0));
            });
            return;
        }
        instance.drive(0);
    }, [buildDriver, router, tourSteps]);

    const skip = useCallback(() => {
        driverRef.current?.destroy();
    }, []);

    return (
        <TourContext.Provider value={{ start, skip }}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const ctx = useContext(TourContext);
    if (!ctx) throw new Error("useTour debe usarse dentro de TourProvider");
    return ctx;
}
