"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "@/lib/tourSteps";
import { canAccessDashboardPath, getDashboardRoleFromUser } from "@/lib/dashboard-access";
import { limpiarReservaDeTour, obtenerRutReservaDeTour } from "@/lib/tourReserva";

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

// requestAnimationFrame NO es seguro acá: Chrome (y otros navegadores) suspenden
// casi por completo los rAF quedan en pestañas/ventanas sin foco. Si el
// profesional cambia de pestaña un momento durante el tour (algo común, por
// ejemplo para copiar un dato), un polling basado en rAF puede quedar
// congelado indefinidamente hasta que vuelva a esa pestaña. setTimeout no
// tiene ese problema — Chrome lo limita a ~1 tick/seg en pestañas de fondo,
// pero SIEMPRE sigue corriendo.
const POLL_MS = 50;

function waitForRoute(pathnameRef, target, callback) {
    if (!target || pathnameRef.current === target) {
        callback();
        return;
    }
    let attempts = 0;
    const tick = () => {
        if (pathnameRef.current === target || attempts > 100) {
            callback();
            return;
        }
        attempts += 1;
        setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
}

// Espera a que el elemento objetivo exista Y deje de moverse (layout estable)
// antes de continuar — evita resaltar un elemento que todavía está siendo
// reposicionado por datos que cargan de forma asíncrona (ej. profesionales).
//
// Además lo trae a la vista DENTRO de su contenedor scrollable antes de que
// driver.js lo mida. Esto es imprescindible en el sidebar: su <nav> es
// flex-1 + overflow-y-auto y desde que el footer de Notificaciones (shrink-0)
// le quitó altura, el contenido desborda (scrollHeight ~594 vs clientHeight
// ~353). driver.js no scrollea contenedores internos —el nav se quedaba en
// scrollTop 0— así que para ítems de acordeones bajos como "Servicios
// Agendables" o "Tarifas de Consulta" medía el rect crudo del elemento
// clipeado, ~144px por debajo del borde del nav, y dibujaba el recuadro
// encima del footer. Ese era el resaltado "corrido".
//
// El scroll se hace una sola vez, al primer tick en que el elemento existe;
// la espera de estabilidad posterior garantiza que ya terminó de moverse.
function waitForStableElement(selector, callback, checks = 4) {
    if (!selector) {
        callback();
        return;
    }
    let stableCount = 0;
    let lastKey = null;
    let attempts = 0;
    let yaCentrado = false;
    const tick = () => {
        const el = document.querySelector(selector);

        if (el && !yaCentrado) {
            yaCentrado = true;
            // block:"center" deja el elemento lejos de los bordes del nav, así
            // el recuadro y el popover nunca quedan pegados al footer ni al
            // borde superior. "instant" evita medir a mitad de una animación.
            el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
        }

        const rect = el?.getBoundingClientRect();
        const key = rect ? `${rect.top}|${rect.left}|${rect.width}|${rect.height}` : null;

        if (key && key === lastKey) {
            stableCount += 1;
        } else {
            stableCount = 0;
            lastKey = key;
        }

        if ((key && stableCount >= checks) || attempts > 150) {
            callback();
            return;
        }
        attempts += 1;
        setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
}

// Los pasos interactivos (los que exigen el clic real del usuario sobre el
// elemento, sin botón "Siguiente") no deben avanzar por el solo hecho de que
// hubo un clic: tienen que avanzar cuando la acción que pedían de verdad
// ocurrió. Antes no era así, y eso rompía el tour de formas silenciosas:
//   - "Agendar" con un campo obligatorio vacío o la hora ocupada mostraba el
//     error y NO creaba la cita, pero el tour se iba igual al paso siguiente;
//   - el clic en el ícono de ojo abría la ficha, pero si el usuario cancelaba
//     el diálogo del navegador el tour también seguía de largo.
// `esperar` describe la condición real de éxito de cada paso interactivo:
//   { tipo: "aparece",     selector }  -> el elemento tiene que existir
//   { tipo: "desaparece",  selector }  -> el elemento tiene que dejar de existir
//   { tipo: "sale-de-ruta", ruta }     -> la navegación tiene que haber ocurrido
//   { tipo: "reserva-creada" }         -> el backend confirmó la cita de prueba
// Si la condición no se cumple, el tour simplemente se queda donde está y el
// usuario puede reintentar — que es exactamente lo que el propio popover le
// está pidiendo.
const GATE_INTENTOS = 300; // 15s a 50ms por tick
// Cuando la acción sí funciona, la condición se cumple casi de inmediato (abrir
// un panel, un POST corto). Si a los ~2,5s todavía no pasó nada, es que algo
// falló —falta un dato obligatorio, la hora está ocupada, se canceló el diálogo—
// y el usuario merece que se lo digan en vez de quedarse mirando un tour que no
// reacciona. Se avisa pero se sigue esperando: si igual se cumple después, el
// tour avanza normal.
const GATE_AVISO_INTENTOS = 50;

function esperarCondicionDelPaso(step, pathnameRef, alCumplirse, alDemorarse) {
    const gate = step?.esperar;
    if (!gate) {
        alCumplirse();
        return;
    }

    const cumplida = () => {
        if (gate.tipo === "aparece") return !!document.querySelector(gate.selector);
        if (gate.tipo === "desaparece") return !document.querySelector(gate.selector);
        if (gate.tipo === "sale-de-ruta") return pathnameRef.current !== gate.ruta;
        // La marca la deja el calendario recién cuando el backend confirmó la
        // reserva. Es más exacta que "el panel se cerró": cancelar el panel
        // también lo cierra, y así el tour no confunde un "Cancelar" con un
        // agendamiento exitoso. El tour la borra al arrancar, de modo que solo
        // puede venir de esta corrida.
        if (gate.tipo === "reserva-creada") return !!obtenerRutReservaDeTour();
        return true;
    };

    if (cumplida()) {
        alCumplirse();
        return;
    }

    let attempts = 0;
    let avisado = false;
    const tick = () => {
        if (cumplida()) {
            alCumplirse();
            return;
        }
        attempts += 1;
        if (!avisado && attempts >= (gate.avisoIntentos ?? GATE_AVISO_INTENTOS)) {
            avisado = true;
            alDemorarse?.();
        }
        // Se agota el plazo: no se avanza. El paso sigue vivo y el usuario puede
        // corregir y volver a intentarlo.
        if (attempts > (gate.intentos ?? GATE_INTENTOS)) return;
        setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
}

// Algunos tramos del tour se bifurcan: al abrir la ficha desde una reserva, el
// usuario aterriza en /dashboard/NuevaFicha si el paciente todavía no tenía
// ficha, o en /dashboard/FichasPacientes si ya la tenía. Los pasos de cada rama
// se marcan `optional: true`.
//
// Intentarlos en orden no sirve: cada rama que no aplica costaría el timeout
// completo de driver.js antes de saltarse (el tour se veía congelado). Acá se
// compite entre todos los candidatos de la bifurcación y se salta directo al
// primero que exista de verdad en el DOM.
//
// La ventana de candidatos va desde `fromIndex` hasta el primer paso NO
// opcional inclusive: ese paso obligatorio es el punto donde las ramas vuelven
// a juntarse, y también el destino de respaldo si ninguna rama aplica.
function resolveBranchTarget(steps, fromIndex, callback) {
    const candidates = [];
    for (let i = fromIndex; i < steps.length; i += 1) {
        candidates.push(i);
        if (!steps[i].optional) break;
    }

    if (candidates.length <= 1) {
        callback(fromIndex);
        return;
    }

    let attempts = 0;
    const tick = () => {
        for (const i of candidates) {
            const selector = steps[i].selector;
            // Un paso sin ancla (mensaje centrado) siempre es válido.
            if (!selector || document.querySelector(selector)) {
                callback(i);
                return;
            }
        }
        attempts += 1;
        // 12s, no 5s: entrar a la ficha implica una consulta al backend, a veces
        // crear al paciente y recién después montar la pantalla nueva. Con un
        // plazo corto, una conexión lenta hacía que el tour se saltara el tramo
        // completo de "Pacientes y Fichas" sin avisar.
        if (attempts > 240) {
            callback(candidates[candidates.length - 1]);
            return;
        }
        setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
}

// driver.js solo vuelve a medir el recuadro resaltado en `window resize`. Eso
// deja el highlight "corrido" cada vez que el layout se mueve por otra causa:
// - DashboardPageTransition anima la página con motion (y: 6 -> 0, 180ms) y su
//   transform crea un containing block para el popover posicionado,
// - el <nav> del sidebar tiene overflow-y-auto y scrollea por dentro (su scroll
//   NO dispara el scroll de window),
// - el badge de la campana de notificaciones y el banner de permisos aparecen
//   de forma asíncrona y empujan el layout.
// Este watcher observa las tres cosas y reancla el recuadro con un debounce
// corto, así el resaltado sigue al elemento pase lo que pase.
const REFRESH_DEBOUNCE_MS = 80;

function attachLayoutWatchers(getDriver) {
    let timer = null;
    const schedule = () => {
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => getDriver()?.refresh(), REFRESH_DEBOUNCE_MS);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    // capture:true es imprescindible: los eventos scroll de un contenedor
    // interno (el <nav> del sidebar) no burbujean hasta window.
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
        if (timer) window.clearTimeout(timer);
        observer.disconnect();
        window.removeEventListener("scroll", schedule, true);
        window.removeEventListener("resize", schedule);
    };
}

// El aviso viaja SIEMPRE dentro de la descripción del paso, oculto por CSS, y
// se muestra agregando una clase al popover. Va así y no inyectando HTML al
// vuelo porque driver.js vuelve a dibujar el popover en cada refresh() —y el
// watcher de layout llama a refresh() cada vez que algo se mueve—, así que un
// nodo agregado a mano desaparecería al primer scroll.
function buildTourAviso(step) {
    if (!step.esperar) return "";
    const texto = step.aviso || "Este paso todavía no se completó. Termina la acción que te pide el tutorial para poder seguir.";
    return `<div class="ac-tour-aviso"><span>${texto}</span></div>`;
}

function mostrarAvisoDelPaso() {
    document.querySelector(".driver-popover.ac-tour-popover")?.classList.add("ac-tour-alerta");
}

function ocultarAvisoDelPaso() {
    document.querySelector(".driver-popover.ac-tour-popover")?.classList.remove("ac-tour-alerta");
}

function buildTourMeta(step, groups) {
    // En el paso de cierre todos los puntos quedan completos: el recorrido
    // terminó, no hay un grupo "actual" al que seguir apuntando.
    const currentGroupIndex = step.final ? groups.length : groups.indexOf(step.grupo);
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
    const detachWatchersRef = useRef(null);
    // Último paso cuyo onHighlighted ya se ejecutó. driver.js vuelve a disparar
    // onHighlighted en cada refresh(), y el watcher de layout llama a refresh()
    // cada vez que algo se mueve — sin este guard, los efectos secundarios del
    // paso se repetían: autoExpand volvía a hacer click (abriendo y cerrando el
    // acordeón en bucle) y skipIfExpanded podía saltarse pasos solo.
    // Guardar el id (y no un booleano) permite que volver al mismo paso con
    // "Atrás" sí vuelva a ejecutar la lógica, porque en el medio hubo otro.
    const lastHighlightedRef = useRef(null);
    // Cada intento de avance/retroceso toma un número. Como esperar a que la
    // acción del paso se concrete es asíncrono, dos clics seguidos (típico en
    // "Agendar": el primero falla por un campo vacío, el segundo funciona)
    // dejarían dos esperas vivas y el tour saltaría dos pasos de una. Solo la
    // última intención llega a mover el tour.
    const avanceTokenRef = useRef(0);
    // Paso que tiene el aviso "esto todavía no se completó" a la vista. Se guarda
    // acá y no solo en el DOM porque driver.js rehace el popover en cada
    // refresh(): al volver a dibujarlo hay que volver a encenderlo.
    const avisoStepIdRef = useRef(null);
    // Se expone para que la UI que flota por encima del dashboard (banner de
    // permisos de notificaciones, asistente Cortex) se oculte mientras el tour
    // corre: ambos usan z-index bajo (50 y 80) y quedarían sepultados bajo el
    // overlay de driver.js (z-10000), viéndose como manchas grises.
    const [isRunning, setIsRunning] = useState(false);
    const role = getDashboardRoleFromUser(user);
    const tourSteps = useMemo(() => getStepsForRole(role), [role]);
    const tourGroups = useMemo(() => [...new Set(tourSteps.map((step) => step.grupo))], [tourSteps]);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => () => {
        detachWatchersRef.current?.();
        detachWatchersRef.current = null;
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
                    // Antes del guard de re-entrada: el popover se vuelve a dibujar
                    // en cada refresh() y perdería el aviso encendido.
                    if (avisoStepIdRef.current === step.id) {
                        mostrarAvisoDelPaso();
                    } else if (avisoStepIdRef.current) {
                        // Se cambió de paso: el aviso del anterior ya no aplica.
                        avisoStepIdRef.current = null;
                        ocultarAvisoDelPaso();
                    }

                    // Re-entrada por refresh() sobre el MISMO paso: ya se aplicó
                    // el efecto secundario, no repetirlo.
                    if (lastHighlightedRef.current === step.id) return;
                    lastHighlightedRef.current = step.id;

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
                        // El acordeón anima su expansión en 200ms (NavAccordion usa
                        // transition-[max-height,opacity] duration-200). driver.js NO
                        // vuelve a medir el recuadro/popover cuando el layout cambia por
                        // esto — solo lo hace en window resize — así que el recuadro puede
                        // quedar desactualizado si algo se movió. Se fuerza un refresh
                        // manual una vez terminada la animación para que quede bien anclado.
                        window.setTimeout(() => driverRef.current?.refresh(), 260);
                    }
                    if (step.skipIfExpanded && contentWrapper && !isCollapsed) {
                        driverRef.current?.moveNext();
                    }

                    // autoAbrir: pasos cuyo contenido vive dentro de un modal. El tour
                    // abre el modal por su cuenta en vez de confiar en que el usuario
                    // adivine que debe pulsar el boton; sin esto, los pasos siguientes
                    // anclan a campos que todavia no estan en el DOM y se pierden en el
                    // timeout. Se comprueba que no haya ya un modal abierto para no
                    // cerrarlo al volver atras sobre el mismo paso.
                    // Si el paso apunta a algo que NO esta dentro de un modal pero
                    // quedo uno abierto de un paso anterior, se cierra: un modal
                    // abierto bloquea el scroll del fondo y atrapa el foco, y dejaria
                    // el resto del tour inutilizable.
                    const modalAbierto = document.querySelector("[data-tour-modal]");
                    if (modalAbierto && !modalAbierto.contains(element)) {
                        const cerrar = modalAbierto.querySelector('[aria-label="Cerrar"]');
                        if (cerrar) {
                            cerrar.click();
                            window.setTimeout(() => driverRef.current?.refresh(), 340);
                        }
                    }

                    if (step.autoAbrir && !document.querySelector('[role="dialog"]')) {
                        element.click();
                        // El panel entra con una animacion de 300ms; driver.js no vuelve
                        // a medir solo, asi que se refresca al terminar para que el
                        // recuadro quede bien puesto sobre el campo.
                        window.setTimeout(() => driverRef.current?.refresh(), 340);
                    }
                },
                popover: {
                    side: step.side || "right",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildTourMeta(step, tourGroups)}<p class="ac-tour-text">${step.description}</p>${buildTourAviso(step)}`,
                    // Un paso interactivo no ofrece "Siguiente" —avanzar sin
                    // hacer la acción es justamente lo que rompía el tour— pero sí
                    // "Atrás". Sin eso, quien no lograba guardar la reserva quedaba
                    // encerrado: ningún botón lo movía y tenía que cerrar el
                    // tutorial y empezarlo de nuevo para volver a ese punto.
                    showButtons: isInteractive
                        ? (isFirst || step.noPrevious) ? ["close"] : ["previous", "close"]
                        : (isFirst || step.noPrevious) ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: isLast ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                    // Antes se esperaba layout estable SOLO cuando el paso
                    // siguiente cambiaba de ruta. Pero un paso con route:null
                    // también puede aterrizar sobre un elemento que todavía se
                    // está moviendo (la animación de DashboardPageTransition, un
                    // acordeón abriéndose, datos que llegan async), y ahí driver
                    // medía antes de tiempo y dejaba el recuadro corrido. Ahora
                    // la espera de estabilidad es incondicional; lo único
                    // condicional es la navegación previa.
                    onNextClick: () => {
                        const token = (avanceTokenRef.current += 1);
                        const vigente = () => token === avanceTokenRef.current;
                        const nextIndex = index + 1;
                        const next = tourSteps[nextIndex];
                        const advance = () =>
                            resolveBranchTarget(tourSteps, nextIndex, (target) => {
                                waitForStableElement(tourSteps[target]?.selector, () => {
                                    if (!vigente()) return;
                                    if (target === nextIndex) {
                                        driverRef.current?.moveNext();
                                    } else {
                                        driverRef.current?.drive(target);
                                    }
                                });
                            });

                        const navegarYAvanzar = () => {
                            if (!vigente()) return;
                            avisoStepIdRef.current = null;
                            ocultarAvisoDelPaso();
                            if (next?.route && next.route !== pathnameRef.current) {
                                router.push(next.route);
                                waitForRoute(pathnameRef, next.route, advance);
                                return;
                            }
                            advance();
                        };

                        // Primero se comprueba que lo que este paso pedía haya
                        // ocurrido de verdad (el formulario se abrió, la cita se
                        // guardó, la ficha se abrió). Si no ocurrió, no se avanza
                        // y se le dice al usuario por qué sigue en el mismo paso.
                        esperarCondicionDelPaso(step, pathnameRef, navegarYAvanzar, () => {
                            if (!vigente()) return;
                            avisoStepIdRef.current = step.id;
                            mostrarAvisoDelPaso();
                            // El aviso cambia el alto del popover: hay que
                            // reubicarlo para que no quede pisando el elemento.
                            driverRef.current?.refresh();
                        });
                    },
                    onPrevClick: () => {
                        const token = (avanceTokenRef.current += 1);
                        avisoStepIdRef.current = null;
                        ocultarAvisoDelPaso();
                        const prev = tourSteps[index - 1];
                        const goBack = () =>
                            waitForStableElement(prev?.selector, () => {
                                if (token !== avanceTokenRef.current) return;
                                driverRef.current?.movePrevious();
                            });

                        if (prev?.route && prev.route !== pathnameRef.current) {
                            router.push(prev.route);
                            waitForRoute(pathnameRef, prev.route, goBack);
                            return;
                        }
                        goBack();
                    },
                },
            };
        });

        const instance = driver({
            showProgress: false,
            allowClose: true,
            // La capa oscura NO mueve el tour. Antes avanzaba ("nextStep") y eso
            // convertía cualquier clic fuera del recuadro en un salto de paso:
            // el usuario intentaba pulsar el elemento real, erraba por unos
            // pixeles o le pegaba a la fila de al lado, y el tour se adelantaba
            // sin que la acción hubiera pasado. El recorrido se mueve solo con
            // "Siguiente"/"Atrás" o con el clic sobre el elemento resaltado.
            overlayClickBehavior: () => {},
            overlayOpacity: 0.55,
            stagePadding: 6,
            stageRadius: 12,
            popoverClass: "ac-tour-popover",
            // 3s, no 8s: waitForStableElement ya esperó a que el elemento
            // existiera y dejara de moverse ANTES de llamar a moveNext, así que
            // este timeout es solo la red de seguridad para un anchor que no va
            // a aparecer nunca. Con 8s el tour parecía congelado; con 3s el
            // salto al siguiente paso válido se siente inmediato.
            waitForElement: 3000,
            // Si el elemento de un paso nunca aparece en el DOM (ej. el usuario
            // quedó en una ruta distinta, o un elemento condicional no se
            // renderizó), driver.js salta automáticamente al siguiente paso
            // válido en esa misma dirección en vez de dejar el tour "colgado".
            skipMissingElement: true,
            steps,
            onCloseClick: () => instance.destroy(),
            onDestroyed: (_element, _step, opts) => {
                detachWatchersRef.current?.();
                detachWatchersRef.current = null;
                setIsRunning(false);
                document.documentElement.style.scrollBehavior = scrollPrevioRef.current || "";
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

    // Guarda el valor original para devolverlo al terminar el tour.
    const scrollPrevioRef = useRef(null);

    const start = useCallback(() => {
        const instance = buildDriver();
        const firstStep = tourSteps[0];

        setIsRunning(true);
        scrollPrevioRef.current = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        lastHighlightedRef.current = null;
        avanceTokenRef.current += 1;
        avisoStepIdRef.current = null;
        // Una marca vieja (otra corrida del tour, misma pestaña) haría que el
        // paso de "Agendar" se diera por cumplido sin haber agendado nada.
        limpiarReservaDeTour();
        detachWatchersRef.current?.();
        detachWatchersRef.current = attachLayoutWatchers(() => driverRef.current);

        // El primer paso arrancaba con instance.drive(0) directo cuando no tenía
        // route (el caso de "config-clinica", que resalta el sidebar). Eso medía
        // el elemento antes de que el dashboard terminara de asentarse y dejaba
        // el primer recuadro del tour corrido — justo la primera impresión.
        // Ahora siempre se espera layout estable.
        const launch = () => waitForStableElement(firstStep?.selector, () => instance.drive(0));

        if (firstStep?.route && firstStep.route !== pathnameRef.current) {
            router.push(firstStep.route);
            waitForRoute(pathnameRef, firstStep.route, launch);
            return;
        }
        launch();
    }, [buildDriver, router, tourSteps]);

    const skip = useCallback(() => {
        driverRef.current?.destroy();
    }, []);

    return (
        <TourContext.Provider value={{ start, skip, isRunning }}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const ctx = useContext(TourContext);
    if (!ctx) throw new Error("useTour debe usarse dentro de TourProvider");
    return ctx;
}
