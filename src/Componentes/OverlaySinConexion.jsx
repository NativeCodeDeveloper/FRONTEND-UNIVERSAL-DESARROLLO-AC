"use client";

// ── Overlay global de "sin conexión" ─────────────────────────────────────────
// public/offline.html solo se muestra cuando el service worker intercepta una
// NAVEGACIÓN estando sin red. Si al usuario se le cae internet mientras ya está
// dentro de la plataforma, esa pantalla nunca aparece y las peticiones fallan en
// silencio. Este componente cubre ese caso: se monta una sola vez en el layout
// raíz y tapa la pantalla completa en cualquier ruta, pública o de dashboard.
//
// El diseño replica public/offline.html a propósito, para que el usuario vea lo
// mismo llegue por donde llegue.

import { useCallback, useEffect, useRef, useState } from "react";

// Recurso liviano y NO cacheado por el SW (no está en SHELL_ASSETS ni bajo
// /_next/static), así que un fetch acá sí toca la red de verdad.
const URL_SONDEO = "/favicon.ico";
const MS_REINTENTO = 8000;
// Espera entre el primer sondeo fallido y el de confirmación.
const MS_SEGUNDO_INTENTO = 1200;

function pad(n) {
    return String(n).padStart(2, "0");
}

function formatearDuracion(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

async function sondear() {
    try {
        await fetch(`${URL_SONDEO}?_=${Date.now()}`, {
            method: "HEAD",
            cache: "no-store",
        });
        return true;
    } catch {
        return false;
    }
}

// navigator.onLine en false es confiable (no hay red). En true puede mentir
// (wifi conectado sin salida), por eso además sondeamos la red.
//
// Un solo sondeo fallido NO basta para bloquear: este overlay tapa la
// plataforma entera, y un hipo puntual de red dejaría al usuario mirando una
// pantalla de error con internet funcionando. Se exigen dos fallos seguidos.
async function hayInternet() {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    if (await sondear()) return true;

    await new Promise((r) => setTimeout(r, MS_SEGUNDO_INTENTO));
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    return sondear();
}

export default function OverlaySinConexion() {
    // Arranca siempre "con conexión" para que el HTML del servidor y el del
    // cliente coincidan; el estado real se resuelve en el primer efecto.
    const [sinConexion, setSinConexion] = useState(false);
    const [verificando, setVerificando] = useState(false);
    const [reloj, setReloj] = useState("--:--:--");
    const [transcurrido, setTranscurrido] = useState("00:00:00");
    const inicioCaidaRef = useRef(null);

    const verificar = useCallback(async () => {
        setVerificando(true);
        const conectado = await hayInternet();
        setSinConexion(!conectado);
        setVerificando(false);
        return conectado;
    }, []);

    // Estado inicial + eventos del navegador.
    useEffect(() => {
        if (navigator.onLine === false) setSinConexion(true);
        else verificar();

        const alPerder = () => setSinConexion(true);
        const alRecuperar = () => verificar();

        window.addEventListener("offline", alPerder);
        window.addEventListener("online", alRecuperar);
        return () => {
            window.removeEventListener("offline", alPerder);
            window.removeEventListener("online", alRecuperar);
        };
    }, [verificar]);

    // Mientras estamos caídos: reintento automático, reloj y tiempo transcurrido.
    useEffect(() => {
        if (!sinConexion) {
            inicioCaidaRef.current = null;
            setTranscurrido("00:00:00");
            return;
        }

        if (inicioCaidaRef.current === null) inicioCaidaRef.current = Date.now();

        const tick = () => {
            const ahora = new Date();
            setReloj(`${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`);
            setTranscurrido(
                formatearDuracion(Math.floor((Date.now() - inicioCaidaRef.current) / 1000))
            );
        };
        tick();

        const idReloj = setInterval(tick, 1000);
        const idSondeo = setInterval(verificar, MS_REINTENTO);
        return () => {
            clearInterval(idReloj);
            clearInterval(idSondeo);
        };
    }, [sinConexion, verificar]);

    // A propósito NO se toca document.body.style.overflow acá.
    //
    // AppointmentDrawer también lo maneja, y guardar/restaurar el valor previo
    // los hace pisarse: con el drawer abierto se cae internet (el overlay
    // guarda "hidden"), se cierra el drawer (deja ""), vuelve internet y el
    // overlay restaura "hidden" — la página queda sin scroll y sin nada en
    // pantalla que lo explique. Este overlay es opaco y cubre todo, así que
    // el scroll del fondo no se ve: bloquearlo no aporta y sí rompe.
    // El overlay contiene su propio scroll con overscroll-behavior (ver CSS).

    if (!sinConexion) return null;

    return (
        <div
            className="ac-offline"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ac-offline-titulo"
            aria-describedby="ac-offline-desc"
        >
            <style>{estilos}</style>

            <div className="ac-offline__topbar">
                <div className="ac-offline__brand">
                    AGENDA CLÍNICA <span>· PANEL SEGURO</span>
                </div>
                <div className="ac-offline__reloj">{reloj}</div>
            </div>

            <main className="ac-offline__main">
                <div className="ac-offline__estado">
                    <span className="ac-offline__dot" />
                    Conexión no disponible
                </div>

                <div className="ac-offline__rings">
                    <div className="ac-offline__ring ac-offline__ring--1" />
                    <div className="ac-offline__ring ac-offline__ring--2" />
                    <div className="ac-offline__core">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                            />
                            <path strokeLinecap="round" d="M2 2l20 20" />
                        </svg>
                    </div>
                </div>

                <h1 id="ac-offline-titulo" className="ac-offline__titulo">
                    Sin conexión
                </h1>
                <p id="ac-offline-desc" className="ac-offline__desc">
                    Los datos clínicos de pacientes requieren una conexión activa a internet para
                    garantizar su seguridad e integridad.
                </p>

                <div className="ac-offline__telemetria">
                    <div className="ac-offline__cell">
                        <span className="ac-offline__label">Red</span>
                        <span className="ac-offline__value">Desconectada</span>
                    </div>
                    <div className="ac-offline__cell">
                        <span className="ac-offline__label">Datos clínicos</span>
                        <span className="ac-offline__value">Protegidos</span>
                    </div>
                    <div className="ac-offline__cell">
                        <span className="ac-offline__label">Reintento</span>
                        <span className="ac-offline__value">Automático</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="ac-offline__retry"
                    onClick={verificar}
                    disabled={verificando}
                >
                    <svg
                        className={verificando ? "ac-offline__girando" : undefined}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.836 0a8.001 8.001 0 00-15.356-2M20 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    {verificando ? "Verificando…" : "Reintentar conexión"}
                </button>

                <div className="ac-offline__elapsed">
                    Tiempo sin conexión: <span>{transcurrido}</span>
                </div>
            </main>

            <footer className="ac-offline__footer">Agenda Clínica · Sistema de gestión clínica</footer>
        </div>
    );
}

// Estilos propios y prefijados: el overlay debe verse igual en cualquier ruta,
// sin depender de las clases de Tailwind de la página que quedó debajo.
const estilos = `
.ac-offline, .ac-offline *, .ac-offline *::before, .ac-offline *::after {
  box-sizing: border-box; margin: 0; padding: 0;
}
.ac-offline {
  --ac-bg: #f3f4f6;
  --ac-bg-2: #ffffff;
  --ac-line: rgba(0, 0, 0, 0.08);
  --ac-line-strong: rgba(0, 0, 0, 0.16);
  --ac-ink: #16181c;
  --ac-ink-dim: #52565c;
  --ac-ink-faint: #8b8f96;
  --ac-glow: rgba(0, 0, 0, 0.08);

  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background-color: var(--ac-bg);
  color: var(--ac-ink);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: center;
}
.ac-offline::before {
  content: "";
  position: absolute;
  inset: -30px;
  background-color: var(--ac-bg);
  background-image: url('/bg-hero-v17.webp');
  background-size: cover;
  background-position: center;
  filter: blur(6px);
  pointer-events: none;
  z-index: 0;
}
.ac-offline::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 38%, var(--ac-glow), transparent 55%);
  pointer-events: none;
  z-index: 0;
}
.ac-offline__topbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 28px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ac-ink-faint);
}
.ac-offline__brand { color: var(--ac-ink-dim); font-weight: 600; }
.ac-offline__brand span { color: var(--ac-ink-faint); font-weight: 400; }
.ac-offline__reloj { color: var(--ac-ink-faint); font-variant-numeric: tabular-nums; }
.ac-offline__main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.ac-offline__estado {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--ac-ink-dim);
  text-transform: uppercase;
  margin-bottom: 34px;
}
.ac-offline__dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--ac-ink);
  box-shadow: 0 0 0 0 rgba(215, 222, 232, 0.5);
  animation: ac-offline-ping 2.2s ease-out infinite;
}
@keyframes ac-offline-ping {
  0%   { box-shadow: 0 0 0 0 rgba(215, 222, 232, 0.45); }
  70%  { box-shadow: 0 0 0 7px rgba(215, 222, 232, 0); }
  100% { box-shadow: 0 0 0 0 rgba(215, 222, 232, 0); }
}
.ac-offline__rings {
  position: relative;
  width: 108px; height: 108px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 32px;
}
.ac-offline__ring {
  position: absolute;
  width: 108px; height: 108px;
  border: 1px solid var(--ac-line-strong);
  border-radius: 50%;
  animation: ac-offline-expand 2.6s ease-out infinite;
}
.ac-offline__ring--2 { animation-delay: 0.9s; }
@keyframes ac-offline-expand {
  0%   { transform: scale(0.55); opacity: 0; }
  35%  { opacity: 0.6; }
  100% { transform: scale(1); opacity: 0; }
}
.ac-offline__core {
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--ac-bg-2);
  border: 1px solid var(--ac-line-strong);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 32px var(--ac-glow);
}
.ac-offline__core svg { width: 26px; height: 26px; color: var(--ac-ink); }
.ac-offline__titulo {
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 700;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--ac-ink);
}
.ac-offline__desc {
  margin-top: 14px;
  font-size: 14.5px;
  color: var(--ac-ink-dim);
  line-height: 1.65;
  max-width: 380px;
}
.ac-offline__telemetria {
  margin-top: 36px;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  border-top: 1px solid var(--ac-line);
  border-bottom: 1px solid var(--ac-line);
  padding: 14px 0;
  gap: 8px 0;
}
.ac-offline__cell { padding: 4px 22px; display: flex; flex-direction: column; gap: 5px; }
.ac-offline__cell + .ac-offline__cell { border-left: 1px solid var(--ac-line); }
.ac-offline__label {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: var(--ac-ink-faint);
  text-transform: uppercase;
}
.ac-offline__value {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--ac-ink);
  letter-spacing: 0.02em;
}
.ac-offline__retry {
  margin-top: 34px;
  padding: 13px 30px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
.ac-offline__retry svg { width: 15px; height: 15px; }
.ac-offline__retry:hover { background: #1a1a1a; box-shadow: 0 0 24px rgba(0,0,0,0.28); }
.ac-offline__retry:active { transform: scale(0.97); }
.ac-offline__retry:disabled { opacity: 0.75; cursor: progress; }
.ac-offline__girando { animation: ac-offline-spin 0.9s linear infinite; }
@keyframes ac-offline-spin { to { transform: rotate(360deg); } }
.ac-offline__elapsed {
  margin-top: 16px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--ac-ink-faint);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.ac-offline__footer {
  position: relative;
  z-index: 1;
  padding: 20px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--ac-ink-faint);
  text-transform: uppercase;
}
@media (max-width: 480px) {
  .ac-offline__topbar { padding: 16px 18px; font-size: 10px; letter-spacing: 0.08em; }
  .ac-offline__cell { padding: 4px 14px; }
  .ac-offline__footer { padding: 16px; font-size: 9px; letter-spacing: 0.08em; }
  .ac-offline__desc { max-width: 300px; }
}
`;
