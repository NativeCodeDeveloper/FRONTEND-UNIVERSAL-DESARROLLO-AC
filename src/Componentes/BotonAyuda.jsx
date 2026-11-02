"use client";

// Boton "Ayuda" — reune en un solo control el video tutorial y el tutorial
// guiado de la pantalla.
//
// Antes cada ruta ponia los dos botones uno al lado del otro en la cabecera.
// En las pantallas que ya traen sus propias acciones (Volver, Ver Fichas,
// Nueva reserva, contadores) eso dejaba una hilera larga de botones del mismo
// peso visual, donde lo importante y la ayuda competian por atencion.
//
// Acá la ayuda ocupa UN boton y sus formas quedan adentro. No se toca la
// entrada "Tutorial Guiado" del sidebar: esa lanza el recorrido grande de todo
// el dashboard (TourContext), no el de la pantalla actual.
//
// La tercera forma es `info`: el mismo texto que hoy muestra <InfoButton>, pero
// como panel dentro de este popover en vez de un tooltip. No se reutiliza
// InfoButton acá porque ese abre por HOVER, y en un menu desplegable eso
// significa que en celular no se puede leer (no hay hover) y en escritorio el
// tooltip tapa las otras opciones. El panel se abre al pulsar, que funciona
// igual con dedo, mouse y teclado. InfoButton sigue intacto para las 15 rutas
// que lo usan suelto en su cabecera.
//
// Los items del menu son los MISMOS componentes de siempre
// (BotonVideoTutorial y el TutorialGuiado* de cada ruta): los dos aceptan
// `className`/`claseIcono`/`claseEtiqueta`, así que basta con vestirlos de fila
// de menu. Por eso esto no duplica la logica del visor de video ni la de
// driver.js, y cualquier arreglo en ellos sigue llegando solo.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import BotonVideoTutorial from "@/Componentes/VideoTutorial";

// Vestido de los items. Vive acá y no en cada ruta a proposito: el boton de
// afuera si cambia de una pantalla a otra (alturas y radios distintos), pero el
// menu debe verse igual en todas.
const CLASE_ITEM =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none";
const CLASE_ITEM_ICONO =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#007AFF]";

// En px y no solo en clases de Tailwind porque hay que saber cuanto mide el
// popover ANTES de pintarlo, para decidir hacia que lado abre.
const ANCHO_MENU = 232;
const ANCHO_PANEL = 288;
const MARGEN_BORDE = 8;

export default function BotonAyuda({
    // { videoId, inicio, titulo, ariaLabel } — omitir si la ruta no tiene video.
    video,
    // El componente TutorialGuiado* de la ruta — omitir si no tiene tour.
    tutorial: Tutorial,
    tutorialProps = {},
    // { informacion, pasos, nota } — mismo contrato que <InfoButton>.
    info,
    etiqueta = "Ayuda",
    ariaLabel = "Abrir las opciones de ayuda de esta pantalla",
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
    // El menu necesita un contenedor `relative` propio, asi que la ruta no
    // puede darle ancho solo con `className` (eso viste al boton, no al
    // contenedor). Esto deja pasar ese ajuste — p.ej. ancho completo en movil.
    claseContenedor = "",
}) {
    const [abierto, setAbierto] = useState(false);
    // "menu" | "info" — el popover muestra la lista o el panel de informacion.
    const [vista, setVista] = useState("menu");
    // "derecha" | "izquierda" — de que borde del boton cuelga el popover.
    const [alineacion, setAlineacion] = useState("derecha");
    const contenedorRef = useRef(null);
    const botonRef = useRef(null);
    const menuId = useId();

    const cerrar = useCallback(() => {
        setAbierto(false);
        setVista("menu");
    }, []);

    // El popover cuelga del borde derecho del boton, que es lo correcto cuando
    // vive al final de una cabecera. Pero si el boton esta cerca del borde
    // izquierdo de la pantalla, abrir hacia la izquierda deja el contenido
    // fuera de la vista y recortado. Se mide antes de abrir (no en un efecto)
    // para que no haya un fotograma mal puesto.
    const ajustarAlineacion = useCallback((anchoPopover) => {
        const caja = contenedorRef.current?.getBoundingClientRect();
        if (!caja) return;
        setAlineacion(caja.right - anchoPopover < MARGEN_BORDE ? "izquierda" : "derecha");
    }, []);

    const ladoPopover = alineacion === "derecha" ? "right-0" : "left-0";

    useEffect(() => {
        if (!abierto) return;

        // Se escucha en fase de captura: los items abren un visor en portal o
        // arrancan driver.js, y sin capturar, un handler que detenga la
        // propagacion dejaria el menu abierto detras del overlay del tour.
        const alClicFuera = (e) => {
            if (!contenedorRef.current?.contains(e.target)) cerrar();
        };
        const alPresionarTecla = (e) => {
            if (e.key !== "Escape") return;
            cerrar();
            botonRef.current?.focus();
        };

        document.addEventListener("pointerdown", alClicFuera, true);
        document.addEventListener("keydown", alPresionarTecla);
        return () => {
            document.removeEventListener("pointerdown", alClicFuera, true);
            document.removeEventListener("keydown", alPresionarTecla);
        };
    }, [abierto, cerrar]);

    const opciones = [];

    if (video) {
        opciones.push(
            <BotonVideoTutorial
                key="video"
                {...video}
                etiqueta="Video tutorial"
                className={CLASE_ITEM}
                claseIcono={CLASE_ITEM_ICONO}
            />,
        );
    }

    if (Tutorial) {
        opciones.push(
            <Tutorial
                key="tutorial"
                {...tutorialProps}
                etiqueta="Tutorial guiado"
                className={CLASE_ITEM}
                claseIcono={CLASE_ITEM_ICONO}
            />,
        );
    }

    // La informacion no es un componente clonable como los otros dos: es una
    // vista de este mismo popover, asi que su item solo cambia `vista`.
    // stopPropagation porque el contenedor del menu cierra al hacer clic, y acá
    // justamente hay que quedarse abierto para poder leer.
    if (info) {
        opciones.push(
            <button
                key="info"
                type="button"
                onClick={(e) => { e.stopPropagation(); ajustarAlineacion(ANCHO_PANEL); setVista("info"); }}
                className={CLASE_ITEM}
            >
                <span className={CLASE_ITEM_ICONO}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.6h.01" />
                    </svg>
                </span>
                <span className="flex-1">Información</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                </svg>
            </button>,
        );
    }

    // Con `info` como unica forma de ayuda no hay lista que mostrar: el boton
    // abre derecho el panel. Sin esta rama caeriamos en el clonado de abajo,
    // que le pasaria `etiqueta`/`claseIcono` a un <button> del DOM.
    const soloInfo = Boolean(info) && opciones.length === 1;

    // Con una sola forma de ayuda no se arma menu: seria un clic de mas para
    // llegar a lo unico que hay. Se devuelve esa opcion con el aspecto del
    // boton de la ruta.
    if (opciones.length <= 1 && !soloInfo) {
        const unica = opciones[0];
        if (!unica) return null;

        return (
            <unica.type
                {...unica.props}
                etiqueta={etiqueta}
                className={className}
                claseIcono={claseIcono}
                claseEtiqueta={claseEtiqueta}
            />
        );
    }

    return (
        <div ref={contenedorRef} className={`relative ${claseContenedor}`}>
            <button
                ref={botonRef}
                type="button"
                onClick={() => {
                    ajustarAlineacion(soloInfo ? ANCHO_PANEL : ANCHO_MENU);
                    setVista(soloInfo ? "info" : "menu");
                    setAbierto((v) => !v);
                }}
                aria-label={ariaLabel}
                aria-haspopup={soloInfo ? "dialog" : "menu"}
                aria-expanded={abierto}
                aria-controls={abierto ? menuId : undefined}
                className={className}
            >
                <span className={claseIcono}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.25-1 .8-1 1.45v.45" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.8h.01" />
                    </svg>
                </span>
                <span className={claseEtiqueta}>{etiqueta}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* El menu se OCULTA, no se desmonta.
                Las dos opciones son componentes con estado propio: el visor de
                video guarda en su estado si la ventana esta abierta, y el
                tutorial guiado destruye su instancia de driver.js al
                desmontarse. Con `{abierto && ...}` pasaba esto: al pulsar una
                opcion su handler corria, el clic burbujeaba hasta este
                contenedor, `cerrar()` ponia `abierto` en false y React
                desmontaba las dos — borrando el estado que el visor acababa de
                poner y destruyendo el tour recien arrancado. Resultado: las dos
                opciones parecian no hacer nada.

                `hidden` (display:none) tambien las saca del orden de tabulacion,
                y ni la ventana de video ni el overlay de driver.js se ven
                afectados por el ancestro oculto: los dos se dibujan en
                document.body por portal. */}
            <div
                id={menuId}
                role="menu"
                hidden={!abierto || vista !== "menu"}
                onClick={cerrar}
                className={`absolute ${ladoPopover} z-50 mt-2 w-[232px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5`}
            >
                {opciones}
            </div>

            {/* Panel de informacion. Mismo contenido que <InfoButton>, pero
                aqui dentro. `max-w-[calc(100vw-2rem)]` porque 288px cabe en un
                celular de 390, pero no en los de 320. */}
            {info && (
                <div
                    role="group"
                    aria-label="Información de esta pantalla"
                    hidden={!abierto || vista !== "info"}
                    className={`absolute ${ladoPopover} z-50 mt-2 w-[288px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-lg shadow-slate-900/5`}
                >
                    {!soloInfo && (
                        <button
                            type="button"
                            onClick={() => { ajustarAlineacion(ANCHO_MENU); setVista("menu"); }}
                            className="mb-3 -ml-1 flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:text-slate-900"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                            </svg>
                            Volver
                        </button>
                    )}

                    <div className="space-y-3 text-[13px] leading-relaxed">
                        {typeof info.informacion === "string"
                            ? info.informacion.split("\n\n").map((parrafo, i) => (
                                <p key={i} className="text-slate-600">{parrafo}</p>
                            ))
                            : info.informacion}

                        {Array.isArray(info.pasos) && info.pasos.length > 0 && (
                            <ol className="space-y-1.5">
                                {info.pasos.map((paso, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] text-[10px] font-bold leading-none text-[#007AFF]">
                                            {i + 1}
                                        </span>
                                        <span className="text-slate-700">{paso}</span>
                                    </li>
                                ))}
                            </ol>
                        )}

                        {info.nota && (
                            <p className="rounded-lg bg-[#F2F2F7] px-3 py-2 text-[12px] font-medium text-[#3A3A3C]">
                                {info.nota}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
