"use client";

// Visor de video tutorial propio de la plataforma.
//
// Reemplaza los <a target="_blank"> a YouTube que había repetidos en 5 rutas:
// sacaban al cliente fuera del dashboard justo cuando estaba aprendiendo a
// usarlo. Acá el video se abre en una ventana flotante que se puede arrastrar y
// redimensionar, así el cliente sigue los pasos en la plataforma MIENTRAS mira
// el video, sin perder el contexto de la pantalla en la que estaba.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ANCHO_MIN = 300;
const ALTO_CABECERA = 40;
const ALTO_MIN = ALTO_CABECERA + 130;
const ANCHO_PREFERIDO = 720;
const MARGEN = 12;
// La posición y el tamaño se recuerdan durante la sesión: el cliente acomoda la
// ventana una vez y la reencuentra igual al abrir el tutorial de otra pantalla.
const CLAVE_ESTADO = "video_tutorial_ventana";

const acotar = (valor, min, max) => Math.min(Math.max(valor, min), max);

// 16:9 sobre el área de video; la cabecera se suma aparte.
const altoDesdeAncho = (ancho) => Math.round((ancho * 9) / 16) + ALTO_CABECERA;

// Mantiene la ventana dentro de la pantalla y por sobre los mínimos. Se aplica
// en cada movimiento, en cada resize y al restaurar el estado guardado — si no,
// una ventana guardada en un monitor grande volvía fuera de vista en uno chico.
function acotarVentana({ x, y, ancho, alto }) {
    const anchoMax = Math.max(ANCHO_MIN, window.innerWidth - MARGEN * 2);
    const altoMax = Math.max(ALTO_MIN, window.innerHeight - MARGEN * 2);
    const anchoFinal = acotar(ancho, ANCHO_MIN, anchoMax);
    const altoFinal = acotar(alto, ALTO_MIN, altoMax);

    return {
        ancho: anchoFinal,
        alto: altoFinal,
        x: acotar(x, MARGEN, Math.max(MARGEN, window.innerWidth - anchoFinal - MARGEN)),
        y: acotar(y, MARGEN, Math.max(MARGEN, window.innerHeight - altoFinal - MARGEN)),
    };
}

function estadoInicial() {
    try {
        const crudo = sessionStorage.getItem(CLAVE_ESTADO);
        const guardado = crudo ? JSON.parse(crudo) : null;
        if (
            Number.isFinite(guardado?.x) && Number.isFinite(guardado?.y) &&
            Number.isFinite(guardado?.ancho) && Number.isFinite(guardado?.alto)
        ) {
            return acotarVentana(guardado);
        }
    } catch {}

    const ancho = Math.min(ANCHO_PREFERIDO, window.innerWidth - MARGEN * 2);
    const alto = altoDesdeAncho(ancho);
    return acotarVentana({
        ancho,
        alto,
        x: (window.innerWidth - ancho) / 2,
        y: (window.innerHeight - alto) / 2,
    });
}

function VentanaVideo({ videoId, inicio, titulo, alCerrar }) {
    const [ventana, setVentana] = useState(estadoInicial);
    const [minimizada, setMinimizada] = useState(false);
    // Mientras se arrastra o redimensiona, el iframe se vuelve inerte. El
    // pointer capture ya redirige los eventos, pero desactivarlo además evita
    // que el reproductor capture el gesto y muestre sus propios controles.
    const [interactuando, setInteractuando] = useState(false);
    const gestoRef = useRef(null);

    useEffect(() => {
        try { sessionStorage.setItem(CLAVE_ESTADO, JSON.stringify(ventana)); } catch {}
    }, [ventana]);

    useEffect(() => {
        const alRedimensionarPantalla = () => setVentana((v) => acotarVentana(v));
        const alPresionarTecla = (e) => { if (e.key === "Escape") alCerrar(); };
        window.addEventListener("resize", alRedimensionarPantalla);
        window.addEventListener("keydown", alPresionarTecla);
        return () => {
            window.removeEventListener("resize", alRedimensionarPantalla);
            window.removeEventListener("keydown", alPresionarTecla);
        };
    }, [alCerrar]);

    const iniciarGesto = (tipo) => (e) => {
        // Los botones de la cabecera no deben arrastrar la ventana.
        if (tipo === "mover" && e.target.closest("button")) return;
        e.preventDefault();
        // setPointerCapture es la pieza clave: sin él, apenas el cursor cruza el
        // iframe de YouTube el documento deja de recibir pointermove y el
        // arrastre se corta en seco. Con captura, los eventos siguen llegando a
        // este elemento aunque el puntero esté sobre el iframe.
        e.currentTarget.setPointerCapture(e.pointerId);
        gestoRef.current = { tipo, px: e.clientX, py: e.clientY, ...ventana };
        setInteractuando(true);
    };

    const alMoverPuntero = (e) => {
        const gesto = gestoRef.current;
        if (!gesto) return;
        const dx = e.clientX - gesto.px;
        const dy = e.clientY - gesto.py;

        setVentana(acotarVentana(
            gesto.tipo === "mover"
                ? { ...gesto, x: gesto.x + dx, y: gesto.y + dy }
                : { ...gesto, ancho: gesto.ancho + dx, alto: gesto.alto + dy },
        ));
    };

    const terminarGesto = (e) => {
        if (!gestoRef.current) return;
        gestoRef.current = null;
        setInteractuando(false);
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${inicio ? `&start=${inicio}` : ""}`;
    const altoVisible = minimizada ? ALTO_CABECERA : ventana.alto;

    return (
        <div
            role="dialog"
            aria-label={`Video tutorial: ${titulo}`}
            style={{ left: ventana.x, top: ventana.y, width: ventana.ancho, height: altoVisible }}
            className="fixed z-[90] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)]"
        >
            {/* ── Cabecera: zona de arrastre ── */}
            <div
                onPointerDown={iniciarGesto("mover")}
                onPointerMove={alMoverPuntero}
                onPointerUp={terminarGesto}
                onPointerCancel={terminarGesto}
                style={{ height: ALTO_CABECERA }}
                className="flex shrink-0 cursor-grab touch-none select-none items-center gap-2 border-b border-slate-100 bg-white px-3 active:cursor-grabbing"
            >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-300">
                    <circle cx="7" cy="5" r="1.4" fill="currentColor" />
                    <circle cx="13" cy="5" r="1.4" fill="currentColor" />
                    <circle cx="7" cy="10" r="1.4" fill="currentColor" />
                    <circle cx="13" cy="10" r="1.4" fill="currentColor" />
                    <circle cx="7" cy="15" r="1.4" fill="currentColor" />
                    <circle cx="13" cy="15" r="1.4" fill="currentColor" />
                </svg>
                <p className="min-w-0 flex-1 truncate text-[11px] font-bold tracking-[-0.01em] text-slate-900">{titulo}</p>

                <button
                    type="button"
                    onClick={() => setMinimizada((v) => !v)}
                    aria-label={minimizada ? "Expandir el video" : "Minimizar el video"}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        {minimizada ? <path d="M3 10l5-5 5 5" /> : <path d="M3 8h10" />}
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={alCerrar}
                    aria-label="Cerrar el video"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                </button>
            </div>

            {/* ── Video ──
                Se mantiene montado al minimizar (solo se colapsa la altura) para
                no reiniciar la reproducción ni perder el punto donde iba. */}
            <div className={`relative min-h-0 flex-1 bg-black ${minimizada ? "hidden" : ""}`}>
                <iframe
                    src={src}
                    title={`Video tutorial: ${titulo}`}
                    allow="accelerated-2d-canvas; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className={`h-full w-full border-0 ${interactuando ? "pointer-events-none" : ""}`}
                />
            </div>

            {/* ── Manija de redimensionado ── */}
            {!minimizada && (
                <div
                    onPointerDown={iniciarGesto("redimensionar")}
                    onPointerMove={alMoverPuntero}
                    onPointerUp={terminarGesto}
                    onPointerCancel={terminarGesto}
                    role="separator"
                    aria-label="Redimensionar el video"
                    className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize touch-none"
                >
                    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-full w-full text-slate-400">
                        <path d="M17 7 L7 17 M17 12 L12 17" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" />
                    </svg>
                </div>
            )}
        </div>
    );
}

/**
 * Botón que abre el video tutorial de la pantalla actual en una ventana
 * flotante, sin sacar al cliente del dashboard.
 *
 * `className`, `claseIcono` y `claseEtiqueta` se reciben desde cada ruta porque
 * el botón no se ve igual en todas (alturas, tipografías y, en la ficha del
 * paciente, el ícono va dentro de una pastilla); así el reemplazo de los <a>
 * existentes no cambia el aspecto de ninguna pantalla.
 */
export default function BotonVideoTutorial({
    videoId,
    inicio,
    titulo = "Video Tutorial",
    etiqueta = "Video Tutorial",
    ariaLabel,
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
}) {
    const [abierto, setAbierto] = useState(false);
    const [montado, setMontado] = useState(false);

    useEffect(() => setMontado(true), []);

    const cerrar = useCallback(() => setAbierto(false), []);

    return (
        <>
            <button
                type="button"
                onClick={() => setAbierto(true)}
                aria-label={ariaLabel || `Abrir video tutorial: ${titulo}`}
                className={className}
            >
                <span className={claseIcono}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-px h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </span>
                <span className={claseEtiqueta}>{etiqueta}</span>
            </button>

            {montado && abierto && createPortal(
                <VentanaVideo videoId={videoId} inicio={inicio} titulo={titulo} alCerrar={cerrar} />,
                document.body,
            )}
        </>
    );
}
