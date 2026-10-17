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

// Apertura y cierre al estilo de las apps de Apple: arranca con decisión y frena muy
// largo y suave al final (como un resorte sin rebote). Más lento que una transición web típica.
const TRANSICION_ANCHO = "width 520ms cubic-bezier(0.22, 1, 0.36, 1)";
// Al cerrar, el contenido del panel se desvanece primero y recién entonces aparecen los
// iconos; así nunca se ve el texto "aplastado" mientras la tarjeta se recoge.
const SALIDA_CONTENIDO = 200;
// Ancho útil del contenido con el panel abierto: tarjeta (284) - padding (2 × 12) - borde (2 × 1).
const ANCHO_CONTENIDO = ANCHO_EXPANDIDO - 24 - 2;

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
    const colapsado = esRail && !abierto;

    // Lo que se DIBUJA va un paso atrás de lo que se PIDE al cerrar:
    //   abrir  → el panel se muestra de inmediato y entra con fundido mientras crece;
    //   cerrar → el panel se desvanece (SALIDA_CONTENIDO ms) y luego se cambia a iconos.
    const [vista, setVista] = useState(colapsado ? "rail" : "panel");
    const [saliendo, setSaliendo] = useState(false);
    useEffect(() => {
        if (!colapsado) {
            setSaliendo(false);
            setVista("panel");
            return undefined;
        }
        if (menosMovimiento) {
            setVista("rail");
            return undefined;
        }
        setSaliendo(true);
        const id = window.setTimeout(() => {
            setVista("rail");
            setSaliendo(false);
        }, SALIDA_CONTENIDO);
        return () => window.clearTimeout(id);
    }, [colapsado, menosMovimiento]);
    const muestraRail = vista === "rail";

    return (
        <aside
            className="relative hidden h-screen shrink-0 md:block"
            style={{
                width: esRail ? ANCHO_RAIL : ANCHO_EXPANDIDO,
                transition: menosMovimiento ? "none" : TRANSICION_ANCHO,
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
                    transition: menosMovimiento ? "none" : TRANSICION_ANCHO,
                }}
            >
                {/* `overflow-hidden` solo cuando esta abierto: es lo que
                    recorta las esquinas redondeadas, pero en modo rail tambien
                    recortaria el desplegable del avatar, que sale por el
                    costado. Colapsado nada roza los bordes, asi que sobra. */}
                {/* Liquid glass (clases `vidrio` en globals.css). Abierto por hover
                    flota sobre el contenido: `vidrio-flotante` le sube opacidad y
                    sombra para despegarlo de lo que tapa. */}
                <div
                    className={`vidrio flex h-full min-h-0 flex-col rounded-[26px] transition-shadow duration-500 ${
                        esRail && abierto ? "vidrio-flotante" : ""
                    } ${muestraRail ? "overflow-visible" : "overflow-hidden"}`}
                >
                    {/* El contenido se dibuja ya a su ancho final y la tarjeta lo
                        va descubriendo al crecer: así el texto no se reacomoda
                        cuadro a cuadro. La `key` lo remonta al cambiar entre rail
                        y panel: entra con fundido y, al cerrar, primero sale. */}
                    <div
                        key={muestraRail ? "rail" : "panel"}
                        className={`flex h-full min-h-0 flex-col ${menosMovimiento ? "" : saliendo ? "vidrio-salir" : "vidrio-entrar"}`}
                        style={{ width: muestraRail ? "100%" : ANCHO_CONTENIDO }}
                    >
                        <SidebarNav
                            colapsado={muestraRail}
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
