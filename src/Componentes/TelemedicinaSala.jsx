"use client";

import Video from "twilio-video";
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useEffect, useRef, useState } from "react";

// Espera máxima por el paciente antes de cerrar la sala automáticamente.
const MINUTOS_ESPERA = 15;

function formatearMinutos(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${String(seg).padStart(2, "0")}`;
}

function PistaMultimedia({ pista, local = false }) {
    const contenedorRef = useRef(null);

    useEffect(() => {
        if (!pista || !contenedorRef.current) return undefined;

        const elemento = pista.attach();
        elemento.autoplay = true;
        if (pista.kind === "video") {
            elemento.playsInline = true;
            elemento.muted = local;
            elemento.className = "h-full w-full object-cover";
        } else {
            elemento.className = "sr-only";
        }
        contenedorRef.current.appendChild(elemento);

        return () => {
            pista.detach(elemento);
            elemento.remove();
        };
    }, [pista, local]);

    return <div ref={contenedorRef} className="h-full w-full" />;
}

export default function TelemedicinaSala({
    modo = "profesional",
    identidad,
    nombreProfesional = "",
    nombreSalaInicial = "",
    invitacionInicial = "",
}) {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const salaRef = useRef(null);
    const [salaDatos, setSalaDatos] = useState(() => nombreSalaInicial ? {
        nombreSala: nombreSalaInicial,
        invitacion: invitacionInicial,
    } : null);
    const [conectado, setConectado] = useState(false);
    const [conectando, setConectando] = useState(false);
    const [microfonoActivo, setMicrofonoActivo] = useState(true);
    const [camaraActiva, setCamaraActiva] = useState(true);
    const [pistasLocales, setPistasLocales] = useState([]);
    const [pistasRemotas, setPistasRemotas] = useState([]);
    const [error, setError] = useState("");
    const [enlaceCopiado, setEnlaceCopiado] = useState(false);
    // Cuenta regresiva visible mientras el profesional espera al paciente.
    // null = temporizador inactivo.
    const [segundosEspera, setSegundosEspera] = useState(null);
    const [avisoEspera, setAvisoEspera] = useState("");

    // Tictac: un efecto por segundo; al llegar a cero, el efecto de abajo cierra todo.
    useEffect(() => {
        if (segundosEspera === null || segundosEspera === 0) return undefined;
        const id = window.setTimeout(() => setSegundosEspera((s) => s - 1), 1000);
        return () => window.clearTimeout(id);
    }, [segundosEspera]);

    // Se acabó la espera: cerrar la sala y dejar todo listo para una llamada nueva
    // (salaDatos en null hace que el próximo intento genere sala e invitación nuevas).
    useEffect(() => {
        if (segundosEspera !== 0) return;
        salaRef.current?.disconnect();
        salaRef.current = null;
        setConectado(false);
        setPistasLocales([]);
        setPistasRemotas([]);
        setSalaDatos(null);
        setAvisoEspera(`El paciente no se conectó en ${MINUTOS_ESPERA} minutos. La sala se cerró; puedes iniciar una nueva videollamada cuando quieras reintentar.`);
    }, [segundosEspera]);

    useEffect(() => () => {
        salaRef.current?.disconnect();
        salaRef.current = null;
    }, []);

    function agregarPista(setPistas, pista, participanteSid = "local") {
        if (pista.kind !== "audio" && pista.kind !== "video") return;
        const clave = `${participanteSid}-${pista.sid || pista.id}`;
        setPistas((actuales) => actuales.some((item) => item.clave === clave)
            ? actuales
            : [...actuales, { clave, pista, participanteSid }]);
    }

    function quitarPista(setPistas, pista, participanteSid = "local") {
        const clave = `${participanteSid}-${pista.sid || pista.id}`;
        setPistas((actuales) => actuales.filter((item) => item.clave !== clave));
    }

    async function conectarASala(datosSala, identidadParticipante) {
        if (!API) throw new Error("Falta configurar la URL de la API.");

        const respuestaToken = await fetch(`${API}/telemedicina/tokenSala`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identity: identidadParticipante,
                nombreSala: datosSala.nombreSala,
                invitacion: datosSala.invitacion,
            }),
        });
        const resultadoToken = await respuestaToken.json();

        if (!respuestaToken.ok || !resultadoToken.success) {
            throw new Error(resultadoToken.message || "No se pudo obtener el acceso a la sala.");
        }

        const token = resultadoToken.data;
        if (typeof token !== "string" || !token) {
            throw new Error("El servidor no devolvió un token de video válido.");
        }

        const sala = await Video.connect(token, {
            name: datosSala.nombreSala,
            audio: true,
            video: true,
        });

        salaRef.current = sala;
        setMicrofonoActivo(true);
        setCamaraActiva(true);
        sala.localParticipant.tracks.forEach((publicacion) => {
            if (publicacion.track) agregarPista(setPistasLocales, publicacion.track);
        });

        const registrarParticipante = (participante) => {
            participante.tracks.forEach((publicacion) => {
                if (publicacion.track) agregarPista(setPistasRemotas, publicacion.track, participante.sid);
            });
            participante.on("trackSubscribed", (pista) => {
                agregarPista(setPistasRemotas, pista, participante.sid);
            });
            participante.on("trackUnsubscribed", (pista) => {
                quitarPista(setPistasRemotas, pista, participante.sid);
            });
        };

        sala.on("participantConnected", (participante) => {
            // El paciente llegó: se cancela la espera.
            setSegundosEspera(null);
            registrarParticipante(participante);
        });
        sala.on("participantDisconnected", (participante) => {
            setPistasRemotas((actuales) => actuales.filter((item) => item.participanteSid !== participante.sid));
        });
        sala.on("disconnected", () => {
            setSegundosEspera(null);
            salaRef.current = null;
            setConectado(false);
            setPistasLocales([]);
            setPistasRemotas([]);
        });
        sala.participants.forEach(registrarParticipante);
        setConectado(true);

        // Solo se espera al paciente si la sala está vacía; si ya está adentro,
        // no hay temporizador que correr.
        if (modo === "profesional" && sala.participants.size === 0) {
            setSegundosEspera(MINUTOS_ESPERA * 60);
        }
    }

    async function iniciarLlamada() {
        if (conectando || conectado) return;
        setConectando(true);
        setError("");
        setAvisoEspera("");

        try {
            let datosSala = salaDatos;
            let identidadParticipante = identidad;

            if (modo === "profesional" && !datosSala) {
                const respuestaSala = await fetch(`${API}/telemedicina/nuevaSala`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // Viaja dentro de la invitación firmada y así llega al
                    // encabezado que ve el paciente.
                    body: JSON.stringify({ nombreProfesional }),
                });
                const resultadoSala = await respuestaSala.json();
                if (!respuestaSala.ok || !resultadoSala.success) {
                    throw new Error(resultadoSala.message || "No se pudo crear la sala.");
                }
                datosSala = resultadoSala.data;
                setSalaDatos(datosSala);
            }

            if (modo === "paciente") {
                identidadParticipante = `paciente-${window.crypto.randomUUID()}`;
            }

            if (!datosSala?.nombreSala || !datosSala?.invitacion || !identidadParticipante) {
                throw new Error("Faltan datos para unirse a la sala.");
            }

            await conectarASala(datosSala, identidadParticipante);
        } catch (errorConexion) {
            console.error("Error iniciando telemedicina:", errorConexion);
            setError(errorConexion.message || "No se pudo iniciar la videollamada.");
        } finally {
            setConectando(false);
        }
    }

    function desconectar() {
        const sala = salaRef.current;
        if (!sala) return;
        setSegundosEspera(null);
        sala.disconnect();
        salaRef.current = null;
        setConectado(false);
        setPistasLocales([]);
        setPistasRemotas([]);
    }

    function alternarPista(tipo, activa, actualizarEstado) {
        const sala = salaRef.current;
        if (!sala) return;
        const pistas = tipo === "audio"
            ? sala.localParticipant.audioTracks
            : sala.localParticipant.videoTracks;
        const siguienteEstado = !activa;
        pistas.forEach((publicacion) => publicacion.track?.enable(siguienteEstado));
        actualizarEstado(siguienteEstado);
    }

    async function copiarEnlace() {
        if (!salaDatos?.nombreSala || !salaDatos?.invitacion) return;
        const enlace = new URL(`/telemedicina/${encodeURIComponent(salaDatos.nombreSala)}`, window.location.origin);
        enlace.searchParams.set("i", salaDatos.invitacion);
        try {
            await navigator.clipboard.writeText(enlace.toString());
            setEnlaceCopiado(true);
            window.setTimeout(() => setEnlaceCopiado(false), 2500);
        } catch {
            setError("No se pudo copiar el enlace. Revisa los permisos del navegador.");
        }
    }

    const pistaLocalVideo = pistasLocales.find((item) => item.pista.kind === "video");
    const pistaRemotaVideo = pistasRemotas.find((item) => item.pista.kind === "video");
    const identidadValida = modo === "paciente" || Boolean(identidad);

    return (
        <section className="w-full">
            <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-xl shadow-slate-200/60">
                {pistaRemotaVideo ? (
                    <PistaMultimedia pista={pistaRemotaVideo.pista} />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
                            {modo === "paciente" ? "✦" : "…"}
                        </span>
                        <p className="text-base font-semibold">
                            {conectado ? "Esperando a la otra persona" : "Tu sala de videollamada"}
                        </p>
                        <p className="max-w-sm text-sm text-slate-400">
                            {conectado
                                ? segundosEspera !== null
                                    ? `Si no se conecta en los próximos ${formatearMinutos(segundosEspera)}, la llamada se cerrará automáticamente.`
                                    : "Cuando se una, su video aparecerá aquí."
                                : "Al iniciar, el navegador solicitará acceso a cámara y micrófono."}
                        </p>
                    </div>
                )}

                {pistaLocalVideo && (
                    <div className="absolute bottom-4 right-4 h-[24%] min-h-24 w-[30%] min-w-32 overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-xl">
                        <PistaMultimedia pista={pistaLocalVideo.pista} local />
                        <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold text-white">
                            Tú
                        </span>
                    </div>
                )}

                <div className="sr-only" aria-hidden="true">
                    {pistasRemotas.filter((item) => item.pista.kind === "audio").map((item) => (
                        <PistaMultimedia key={item.clave} pista={item.pista} />
                    ))}
                </div>

                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/70 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {segundosEspera !== null
                        ? `Esperando al paciente · ${formatearMinutos(segundosEspera)}`
                        : conectado ? "En llamada" : "Sala lista"}
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {conectado && (
                    <>
                        <button
                            type="button"
                            onClick={() => alternarPista("audio", microfonoActivo, setMicrofonoActivo)}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            {microfonoActivo ? "Silenciar micrófono" : "Activar micrófono"}
                        </button>
                        <button
                            type="button"
                            onClick={() => alternarPista("video", camaraActiva, setCamaraActiva)}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            {camaraActiva ? "Apagar cámara" : "Activar cámara"}
                        </button>
                    </>
                )}
                <button
                    type="button"
                    onClick={conectado ? desconectar : iniciarLlamada}
                    disabled={conectando || !identidadValida}
                    className={`rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${conectado ? "bg-rose-600 hover:bg-rose-700" : "bg-violet-600 hover:bg-violet-700"}`}
                >
                    {conectando ? "Conectando…" : conectado ? "Salir de la llamada" : modo === "paciente" ? "Unirme a la videollamada" : "Iniciar videollamada"}
                </button>

                {modo === "profesional" && salaDatos && (
                    <button
                        type="button"
                        onClick={copiarEnlace}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        {enlaceCopiado ? "Enlace copiado" : "Copiar enlace para el paciente"}
                    </button>
                )}
            </div>

            {modo === "profesional" && salaDatos && (
                <p className="mt-3 text-center text-xs text-slate-500">
                    El enlace permite entrar durante 4 horas. Compártelo directamente con el paciente.
                </p>
            )}

            {error && (
                <p role="alert" className="mx-auto mt-4 max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
                    {error}
                </p>
            )}

            {avisoEspera && (
                <p role="status" className="mx-auto mt-4 max-w-xl rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-center text-sm text-violet-700">
                    {avisoEspera}
                </p>
            )}
        </section>
    );
}
