"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SidebarShell — la columna del sidebar y su estado colapsado/expandido.
//
// Dos anchos distintos, y esa es la clave del comportamiento:
//
//   ancho de COLUMNA  -> el hueco que el sidebar le reserva al contenido.
//                        Depende solo del MODO (fijado o rail).
//   ancho de TARJETA  -> lo que se ve. Depende del modo O del hover.
//
// Al separarlos, el panel abierto por hover se dibuja ENCIMA del contenido en
// vez de empujarlo. Si empujara, cada pasada del raton relayoutearia la pagina
// entera: las tablas saltarian y el calendario recalcularia sus columnas. Con
// overlay el contenido no se mueve nunca.
//
// Por defecto se entra EXPANDIDO: cambiarle la navegacion de golpe a todo el
// mundo es arriesgado, asi que el rail es una eleccion, no una imposicion. La
// eleccion se recuerda en localStorage.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import SidebarNav from "./SidebarNav";
import { useTour } from "@/ContextosGlobales/TourContext";

const ANCHO_EXPANDIDO = 284;
const ANCHO_RAIL = 76;
const CLAVE_MODO = "sidebar_modo";

// Abrir rapido pero no al vuelo, y cerrar con paciencia: el cierre lento es el
// que perdona el pulso al ir del rail a una opcion del flyout.
const RETARDO_ABRIR = 150;
const RETARDO_CERRAR = 320;

// ─── Coreografia del abrir/cerrar ────────────────────────────────────────────
// Curva ease-in-out: el panel parte casi en reposo, gana velocidad en el
// centro del recorrido y vuelve a frenar hasta detenerse. Las curvas que
// arrancan a toda velocidad (por suave que sea su aterrizaje) se leen como un
// portazo; la suavidad percibida vive en el arranque tanto como en la parada.
// Ambas direcciones duran lo mismo, por decision explicita: el usuario prefirio
// esa simetria antes que el cierre mas corto.
const CURVA_ANCHO = "cubic-bezier(0.65, 0, 0.35, 1)";
const DURACION_ABRIR = 380;
const DURACION_CERRAR = 380;

// El fundido cruzado entre la capa de iconos y la capa completa acompana al
// ancho casi hasta el final: si terminara mucho antes, el contenido quedaria
// quieto y legible mientras la tarjeta todavia viaja, y el conjunto se leeria
// desparejo. Sigue acabando ANTES que el ancho a proposito.
const DURACION_FUNDIDO = 320;

// La tarjeta vive dentro de una columna con p-3 (12px por lado): estos son sus
// anchos reales. Las capas de contenido usan este ancho FINAL y constante, no
// un 100%: si se encogieran junto a la tarjeta, cada fotograma del cierre
// rearmaria las lineas de texto. A ancho fijo la tarjeta las recorta como una
// ventana y el contenido no se reflowea mientras se mueve.
const TARJETA_EXPANDIDA = ANCHO_EXPANDIDO - 24;
const TARJETA_RAIL = ANCHO_RAIL - 24;

// Quien pide menos movimiento en el sistema no deberia recibir un panel que se
// desliza cada vez que cruza el raton. Se lee en efecto (no en render) porque
// matchMedia no existe en el servidor.
function useMenosMovimiento() {
    const [activo, setActivo] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!mq) return;

        const aplicar = () => setActivo(mq.matches);
        aplicar();

        // `addEventListener` sobre un MediaQueryList llego a Safari en la 14.
        // En iOS 13 y anteriores solo existe `addListener`, y llamar al
        // primero ahi lanza un TypeError DENTRO del efecto, que tumba el
        // sidebar entero. El sidebar se ve desde `md`, o sea tambien en iPad:
        // justo donde es mas probable encontrar un Safari viejo.
        if (mq.addEventListener) {
            mq.addEventListener("change", aplicar);
            return () => mq.removeEventListener("change", aplicar);
        }

        mq.addListener(aplicar);
        return () => mq.removeListener(aplicar);
    }, []);

    return activo;
}

export default function SidebarShell() {
    // "fijado" = el sidebar de siempre, 284px empujando el contenido.
    // "rail"   = 76px de iconos que se abren al pasar el raton.
    const [modo, setModo] = useState("fijado");
    const [hover, setHover] = useState(false);
    const [foco, setFoco] = useState(false);
    const temporizador = useRef(null);
    // true mientras el ancho (o el fundido) sigue en movimiento. Sirve para una
    // sola cosa: decidir si la tarjeta ya puede soltar el `overflow-hidden`.
    const [enAnimacion, setEnAnimacion] = useState(false);
    const animacion = useRef(null);

    const menosMovimiento = useMenosMovimiento();
    const { isRunning, tourExternoActivo } = useTour();
    // Mientras un tour corre el sidebar se queda ABIERTO y quieto. El tour
    // grande ancla pasos en `[data-tour="nav-<seccion>"]`, que en modo rail no
    // existen: sin esto, driver.js saltaria esos pasos o resaltaria un hueco.
    // Tambien evita que el panel se cierre solo a mitad de una explicacion.
    const tourActivo = isRunning || tourExternoActivo;

    useEffect(() => {
        try {
            const guardado = localStorage.getItem(CLAVE_MODO);
            if (guardado === "rail" || guardado === "fijado") setModo(guardado);
        } catch {}
    }, []);

    const cambiarModo = useCallback(() => {
        setModo((previo) => {
            const siguiente = previo === "rail" ? "fijado" : "rail";
            try { localStorage.setItem(CLAVE_MODO, siguiente); } catch {}
            return siguiente;
        });
        setHover(false);
        // Tambien se suelta el foco: el boton que se acaba de pulsar se queda
        // enfocado y, sin esto, mantendria el panel abierto (ver onFocusCapture).
        setFoco(false);
    }, []);

    useEffect(() => () => window.clearTimeout(temporizador.current), []);

    const programar = useCallback((valor, retardo) => {
        window.clearTimeout(temporizador.current);
        temporizador.current = window.setTimeout(() => setHover(valor), retardo);
    }, []);

    const esRail = modo === "rail" && !tourActivo;
    // El foco de teclado tambien abre: si no, quien navega con Tab entra a un
    // rail de iconos sin texto y no sabe donde esta parado.
    const abierto = !esRail || hover || foco;

    // `overflow-visible` existe para una unica cosa: que el desplegable del
    // avatar escape de la tarjeta en el reposo cerrado del rail. Pero durante
    // la animacion hay que mantener `overflow-hidden`: si no, la capa que se
    // esta desvaneciendo (a ancho constante) se derramaria fuera de una
    // tarjeta que todavia se esta encogiendo. Se suelta cuando el movimiento
    // termino, con un margen. Con menos movimiento no hay animacion que
    // contener, asi que nunca hace falta.
    useEffect(() => {
        if (!esRail || menosMovimiento) {
            setEnAnimacion(false);
            return;
        }

        setEnAnimacion(true);
        window.clearTimeout(animacion.current);
        animacion.current = window.setTimeout(
            () => setEnAnimacion(false),
            Math.max(DURACION_ABRIR, DURACION_FUNDIDO) + 80,
        );
        return () => window.clearTimeout(animacion.current);
    }, [esRail, abierto, menosMovimiento]);

    return (
        <aside
            className="relative hidden h-screen shrink-0 md:block"
            style={{
                width: esRail ? ANCHO_RAIL : ANCHO_EXPANDIDO,
                // La transicion que manda es la del ESTADO DE DESTINO: el valor
                // que lee el navegador al empezar a animar es el que esta
                // renderizado ahora, asi que aqui `esRail` ya es el "hacia
                // donde" — por eso elegir duracion segun `esRail` elige abrir
                // o cerrar correctamente.
                transition: menosMovimiento
                    ? "none"
                    : `width ${(esRail ? DURACION_CERRAR : DURACION_ABRIR)}ms ${CURVA_ANCHO}`,
            }}
            onMouseEnter={() => esRail && programar(true, RETARDO_ABRIR)}
            onMouseLeave={() => esRail && programar(false, RETARDO_CERRAR)}
            onFocusCapture={(e) => {
                // Solo el foco de TECLADO abre el panel.
                //
                // Con cualquier foco pasaba esto: al pulsar "anclar" con el
                // raton, el modo cambiaba a rail pero el propio boton se
                // quedaba enfocado, `foco` seguia en true y la tarjeta no se
                // replegaba — parecia que el boton no hacia nada, y solo se
                // cerraba al clicar fuera (que es cuando perdia el foco).
                //
                // Safari no lo sufre porque no da foco de teclado a un <button>
                // al hacer clic; Chrome, Firefox, Edge y Opera si. De ahi que
                // el fallo apareciera en todos menos en Safari.
                //
                // `:focus-visible` es exactamente "foco que merece verse", o
                // sea teclado y no raton.
                try {
                    if (e.target.matches(":focus-visible")) setFoco(true);
                } catch {
                    // Navegador sin `:focus-visible`: mejor no abrir que romper.
                }
            }}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false);
            }}
        >
            {/* `absolute` y no `static`: asi la tarjeta puede crecer a 284px sin
                arrastrar la columna, que es lo que produce el overlay. z-[90]
                para quedar sobre el contenido y sobre CortexAssistant (z-80). */}
            <div
                className="absolute inset-y-0 left-0 z-[90] flex flex-col p-3"
                style={{
                    width: abierto ? ANCHO_EXPANDIDO : ANCHO_RAIL,
                    transition: menosMovimiento
                        ? "none"
                        : `width ${(abierto ? DURACION_ABRIR : DURACION_CERRAR)}ms ${CURVA_ANCHO}`,
                }}
            >
                {/* `overflow-hidden` salvo en el reposo cerrado del rail: es lo
                    que recorta las esquinas redondeadas (y ahora tambien lo que
                    hace de "ventana" sobre las capas de ancho constante), pero
                    en reposo recortaria el desplegable del avatar, que sale por
                    el costado. `enAnimacion` lo mantiene durante el cierre,
                    mientras la tarjeta todavia se esta encogiendo. */}
                <div
                    className={`relative flex h-full min-h-0 flex-col rounded-[24px] border border-white/65 bg-white/78 backdrop-blur-[20px] backdrop-saturate-[160%] transition-shadow duration-[380ms] motion-reduce:transition-none ${
                        esRail && !abierto && !enAnimacion ? "overflow-visible" : "overflow-hidden"
                    } ${
                        esRail && abierto
                            ? "shadow-[0_12px_36px_rgba(30,41,59,0.10)]"
                            : "shadow-[0_8px_32px_rgba(30,41,59,0.06)]"
                    }`}
                >
                    {/* ── Fundido cruzado ─────────────────────────────────
                        Antes el contenido CAMBIABA de golpe: al abrirse, el
                        arbol de iconos se desmontaba y aparecia el menu
                        completo en el mismo frame en que el ancho empezaba a
                        moverse. Ese corte seco era lo que hacia brusca la
                        animacion, no la velocidad. Ahora ambos arboles viven
                        en capas separadas y se desvanecen entre si mientras
                        el ancho viaja.

                        Cada capa mide su ancho FINAL (TARJETA_*), no 100%: el
                        texto no se rearm linea a linea durante el cierre, la
                        tarjeta simplemente lo va recortando como una ventana.

                        `visibility` con retardo: la capa que sale sigue
                        existiendo los primeros ms del fundido (para que el
                        desvanecer se vea) y DESPUES desaparece de verdad, de
                        forma que en reposo no quedan enlaces focuseables ni
                        clickables bajo la capa opuesta. Con
                        `prefers-reduced-motion` no hay transicion: el retardo
                        de `visibility` tambien desaparece y el cambio es
                        instantaneo, coherente con el ancho. */}
                    <div
                        className="absolute inset-y-0 left-0 flex min-h-0 flex-col"
                        style={{
                            width: TARJETA_RAIL,
                            opacity: abierto ? 0 : 1,
                            visibility: abierto ? "hidden" : "visible",
                            transform: abierto ? "translateX(-6px)" : "translateX(0)",
                            // `visibility` tarda DURACION_FUNDIDO en ocultar la
                            // capa que sale; sin esto, seguiria interponiendose
                            // (invisible pero clickable) sobre la capa que
                            // acaba de ganar.
                            pointerEvents: abierto ? "none" : "auto",
                            transition: menosMovimiento
                                ? "none"
                                : `opacity ${DURACION_FUNDIDO}ms ${CURVA_ANCHO}, transform ${DURACION_FUNDIDO}ms ${CURVA_ANCHO}, visibility 0s linear ${abierto ? DURACION_FUNDIDO : 0}ms`,
                        }}
                    >
                        <SidebarNav
                            colapsado
                            modo={modo}
                            onCambiarModo={cambiarModo}
                            bloqueadoPorTour={tourActivo}
                        />
                    </div>

                    <div
                        className="absolute inset-y-0 left-0 flex min-h-0 flex-col"
                        style={{
                            width: TARJETA_EXPANDIDA,
                            opacity: abierto ? 1 : 0,
                            visibility: abierto ? "visible" : "hidden",
                            transform: abierto ? "translateX(0)" : "translateX(10px)",
                            pointerEvents: abierto ? "auto" : "none",
                            transition: menosMovimiento
                                ? "none"
                                : `opacity ${DURACION_FUNDIDO}ms ${CURVA_ANCHO}, transform ${DURACION_FUNDIDO}ms ${CURVA_ANCHO}, visibility 0s linear ${abierto ? 0 : DURACION_FUNDIDO}ms`,
                        }}
                    >
                        <SidebarNav
                            colapsado={false}
                            modo={modo}
                            onCambiarModo={cambiarModo}
                            bloqueadoPorTour={tourActivo}
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
}
