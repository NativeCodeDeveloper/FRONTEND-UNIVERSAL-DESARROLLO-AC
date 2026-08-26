"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "@/lib/tourSteps";

const COMPLETED_KEY = "ac_tour_completado";

const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const TOUR_GROUPS = [...new Set(TOUR_STEPS.map((step) => step.grupo))];

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

function buildTourMeta(step) {
    const currentGroupIndex = TOUR_GROUPS.indexOf(step.grupo);
    const dots = TOUR_GROUPS
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
    const driverRef = useRef(null);
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => () => {
        driverRef.current?.destroy();
        driverRef.current = null;
    }, []);

    const buildDriver = useCallback(() => {
        const steps = TOUR_STEPS.map((step, index) => {
            const isFirst = index === 0;
            const isLast = index === TOUR_STEPS.length - 1;
            const isInteractive = step.interactive === true;

            return {
                element: step.selector,
                advanceOnClick: isInteractive,
                onHighlighted: (element) => {
                    if (step.skipIfExpanded && element?.getAttribute("aria-expanded") === "true") {
                        driverRef.current?.moveNext();
                    }
                },
                popover: {
                    side: step.side || "right",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildTourMeta(step)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: isInteractive
                        ? ["close"]
                        : (isFirst || step.noPrevious) ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: isLast ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                    onNextClick: () => {
                        const next = TOUR_STEPS[index + 1];

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
                        const prev = TOUR_STEPS[index - 1];
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
            steps,
            onCloseClick: () => instance.destroy(),
            onDestroyed: () => {
                try { localStorage.setItem(COMPLETED_KEY, "1"); } catch {}
            },
        });

        driverRef.current = instance;
        return instance;
    }, [router]);

    const start = useCallback(() => {
        const instance = buildDriver();
        const firstStep = TOUR_STEPS[0];
        if (firstStep?.route && firstStep.route !== pathnameRef.current) {
            router.push(firstStep.route);
            waitForRoute(pathnameRef, firstStep.route, () => {
                waitForStableElement(firstStep.selector, () => instance.drive(0));
            });
            return;
        }
        instance.drive(0);
    }, [buildDriver, router]);

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
