"use client";

import Video from "twilio-video";
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useEffect, useRef, useState } from "react";
import { Check, Link2, Mail, MessageCircle, Mic, MicOff, PhoneOff, Video as IconoVideo, VideoOff } from "lucide-react";
import { enlaceSala, mensajeInvitacion } from "@/lib/telemedicina";
import { urlWhatsapp } from "@/lib/whatsapp";

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
    // Solo modo profesional: ficha del paciente (id_paciente, nombre, telefono, correo) y
    // nombre de la clínica, para enviarle el enlace por WhatsApp o correo.
    paciente = null,
    nombreClinica = "",
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
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);
    // Confirmación del último envío ("Enviado a j•••a@correo.cl").
    const [avisoEnvio, setAvisoEnvio] = useState("");
    // Cuenta regresiva visible mientras el profesional espera al paciente.
    // null = temporizador inactivo.
    const [segundosEspera, setSegundosEspera] = useState(null);
    const [avisoEspera, setAvisoEspera] = useState("");
    // Duración de la llamada: corre desde que llega el video de la otra persona.
    const [segundosLlamada, setSegundosLlamada] = useState(0);
    const hayVideoRemoto = pistasRemotas.some((item) => item.pista.kind === "video");
    useEffect(() => {
        if (!hayVideoRemoto) {
            setSegundosLlamada(0);
            return undefined;
        }
        const id = window.setInterval(() => setSegundosLlamada((s) => s + 1), 1000);
        return () => window.clearInterval(id);
    }, [hayVideoRemoto]);

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

    const enlacePaciente = () => enlaceSala(window.location.origin, salaDatos.nombreSala, salaDatos.invitacion);

    // WhatsApp: abre el WhatsApp del propio profesional (celular o web) con el mensaje y el
    // enlace ya escritos, dirigido al celular de la ficha. El profesional solo aprieta enviar.
    function enviarPorWhatsapp() {
        if (!salaDatos?.nombreSala || !salaDatos?.invitacion) return;
        const url = urlWhatsapp(paciente?.telefono, mensajeInvitacion({
            nombrePaciente: paciente?.nombre, nombreProfesional, nombreClinica, enlace: enlacePaciente(),
        }));
        if (!url) return setError("La ficha del paciente no tiene celular registrado.");
        setError("");
        window.open(url, "_blank", "noopener,noreferrer");
        setAvisoEnvio("Se abrió WhatsApp con el mensaje listo: solo falta enviarlo.");
    }

    // Correo: lo envía el backend al correo registrado en la ficha (nunca a uno escrito aquí).
    async function enviarPorCorreo() {
        if (!salaDatos?.nombreSala || !salaDatos?.invitacion || !paciente?.id_paciente || enviandoCorreo) return;
        setEnviandoCorreo(true);
        setError("");
        setAvisoEnvio("");
        try {
            const res = await fetch(`${API}/telemedicina/enviarInvitacionCorreo`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ id_paciente: paciente.id_paciente, nombreSala: salaDatos.nombreSala, invitacion: salaDatos.invitacion }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) return setAvisoEnvio(`Enlace enviado a ${data.destino}.`);
            setError({
                sinDatoContacto: "La ficha del paciente no tiene un correo válido.",
                invitacionInvalida: "El enlace de esta sala ya venció. Inicia una videollamada nueva.",
                demasiadasSolicitudes: "Enviaste muchos correos seguidos. Espera unos minutos.",
            }[data.message] || "No se pudo enviar el correo. Intenta de nuevo.");
        } catch {
            setError("No se pudo enviar el correo. Revisa tu conexión.");
        } finally {
            setEnviandoCorreo(false);
        }
    }

    async function copiarEnlace() {
        if (!salaDatos?.nombreSala || !salaDatos?.invitacion) return;
        try {
            await navigator.clipboard.writeText(enlacePaciente());
            setEnlaceCopiado(true);
            window.setTimeout(() => setEnlaceCopiado(false), 2500);
        } catch {
            setError("No se pudo copiar el enlace. Revisa los permisos del navegador.");
        }
    }

    const pistaLocalVideo = pistasLocales.find((item) => item.pista.kind === "video");
    const pistaRemotaVideo = pistasRemotas.find((item) => item.pista.kind === "video");
    const identidadValida = modo === "paciente" || Boolean(identidad);
    const otraPersona = modo === "profesional" ? "al paciente" : "al profesional";

    return (
        <section className="w-full">
            {/* Escenario de la llamada: todo ocurre aquí dentro, como en FaceTime */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-[#1C1C1E] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.55)] sm:aspect-video">
                {pistaRemotaVideo ? (
                    <PistaMultimedia pista={pistaRemotaVideo.pista} />
                ) : (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white ${conectado ? "pb-32 sm:pb-24" : ""}`}>
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_65%)]" />
                        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 sm:h-20 sm:w-20">
                            {conectado ? (
                                <span className="absolute inset-0 animate-ping rounded-full bg-white/10 motion-reduce:hidden" aria-hidden="true" />
                            ) : null}
                            <IconoVideo className="relative h-8 w-8 text-white/90" strokeWidth={1.5} aria-hidden="true" />
                        </span>
                        <p className="relative mt-5 text-[20px] font-semibold tracking-tight">
                            {conectado ? `Esperando ${otraPersona}` : "Listo para la videollamada"}
                        </p>
                        <p className="relative mt-1.5 max-w-sm text-[14px] leading-relaxed text-white/60">
                            {conectado
                                ? segundosEspera !== null
                                    ? `Si no se conecta en ${formatearMinutos(segundosEspera)}, la sala se cerrará sola.`
                                    : "Su video aparecerá aquí apenas se una."
                                : "El navegador te pedirá permiso para usar la cámara y el micrófono."}
                        </p>

                        {!conectado ? (
                            <button
                                type="button"
                                onClick={iniciarLlamada}
                                disabled={conectando || !identidadValida}
                                className="relative mt-7 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#34C759] px-7 text-[16px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(52,199,89,0.8)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                            >
                                <IconoVideo className="h-5 w-5" aria-hidden="true" />
                                {conectando ? "Conectando…" : modo === "paciente" ? "Unirme a la videollamada" : "Iniciar videollamada"}
                            </button>
                        ) : null}
                    </div>
                )}

                {/* Estado arriba a la izquierda */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3.5 py-1.5 text-[12px] font-medium text-white backdrop-blur-xl">
                    <span
                        aria-hidden="true"
                        className={`h-2 w-2 rounded-full ${pistaRemotaVideo ? "bg-[#34C759]" : conectado ? "bg-[#FF9F0A]" : "bg-white/50"}`}
                    />
                    {pistaRemotaVideo
                        ? `En llamada · ${formatearMinutos(segundosLlamada)}`
                        : segundosEspera !== null
                            ? `Esperando · ${formatearMinutos(segundosEspera)}`
                            : conectado ? "Conectado" : "Sala lista"}
                </div>

                {/* Tu imagen, arriba a la derecha para no chocar con los controles */}
                {conectado ? (
                    <div className="absolute right-4 top-4 h-[26%] min-h-24 w-[24%] min-w-[110px] overflow-hidden rounded-2xl bg-[#2C2C2E] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/15">
                        {pistaLocalVideo && camaraActiva ? (
                            <PistaMultimedia pista={pistaLocalVideo.pista} local />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/70">
                                <VideoOff className="h-5 w-5" aria-hidden="true" />
                                <span className="text-[11px]">Cámara apagada</span>
                            </div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                            Tú{!microfonoActivo ? " · silenciado" : ""}
                        </span>
                    </div>
                ) : null}

                <div className="sr-only" aria-hidden="true">
                    {pistasRemotas.filter((item) => item.pista.kind === "audio").map((item) => (
                        <PistaMultimedia key={item.clave} pista={item.pista} />
                    ))}
                </div>

                {/* Controles circulares flotantes sobre el video */}
                {conectado ? (
                    <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
                        <div className="flex items-start gap-3 rounded-[32px] bg-black/45 px-4 py-3 backdrop-blur-2xl ring-1 ring-white/10 sm:gap-5 sm:px-6">
                            <BotonCircular
                                etiqueta={microfonoActivo ? "Silenciar" : "Activar"}
                                descripcion={microfonoActivo ? "Silenciar micrófono" : "Activar micrófono"}
                                activo={!microfonoActivo}
                                onClick={() => alternarPista("audio", microfonoActivo, setMicrofonoActivo)}
                            >
                                {microfonoActivo ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                            </BotonCircular>
                            <BotonCircular
                                etiqueta={camaraActiva ? "Cámara" : "Encender"}
                                descripcion={camaraActiva ? "Apagar cámara" : "Encender cámara"}
                                activo={!camaraActiva}
                                onClick={() => alternarPista("video", camaraActiva, setCamaraActiva)}
                            >
                                {camaraActiva ? <IconoVideo className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                            </BotonCircular>
                            {modo === "profesional" && salaDatos ? (
                                <BotonCircular
                                    etiqueta={enlaceCopiado ? "Copiado" : "Enlace"}
                                    descripcion="Copiar enlace para el paciente"
                                    activo={enlaceCopiado}
                                    onClick={copiarEnlace}
                                >
                                    {enlaceCopiado ? <Check className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}
                                </BotonCircular>
                            ) : null}
                            <BotonCircular etiqueta="Salir" descripcion="Salir de la llamada" peligro onClick={desconectar}>
                                <PhoneOff className="h-6 w-6" />
                            </BotonCircular>
                        </div>
                    </div>
                ) : null}
            </div>

            {modo === "profesional" && salaDatos ? (
                <div className="mx-auto mt-4 max-w-xl">
                    <p className="mb-2.5 text-center text-[13px] font-medium text-[#1D1D1F]">Enviar el enlace al paciente</p>
                    <div className="grid grid-cols-3 gap-2">
                        <BotonEnvio
                            onClick={enviarPorWhatsapp}
                            deshabilitado={!paciente?.telefono}
                            ayuda={paciente?.telefono ? "Abrir WhatsApp con el mensaje listo" : "La ficha no tiene celular"}
                        >
                            <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                            WhatsApp
                        </BotonEnvio>
                        <BotonEnvio
                            onClick={enviarPorCorreo}
                            deshabilitado={!paciente?.correo || enviandoCorreo}
                            ayuda={paciente?.correo ? "Enviar al correo de la ficha" : "La ficha no tiene correo"}
                        >
                            <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                            {enviandoCorreo ? "Enviando…" : "Correo"}
                        </BotonEnvio>
                        <BotonEnvio onClick={copiarEnlace} ayuda="Copiar el enlace">
                            {enlaceCopiado ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Link2 className="h-[18px] w-[18px]" aria-hidden="true" />}
                            {enlaceCopiado ? "Copiado" : "Copiar"}
                        </BotonEnvio>
                    </div>
                    {avisoEnvio ? (
                        <p role="status" className="mt-2.5 text-center text-[13px] text-[#248A3D]">{avisoEnvio}</p>
                    ) : null}
                    <p className="mt-2 text-center text-[12px] text-[#86868B]">
                        Va al celular o correo de la ficha. Comparte el enlace solo con el paciente: permite entrar durante 4 horas.
                    </p>
                </div>
            ) : null}

            {error ? (
                <p role="alert" className="mx-auto mt-4 max-w-xl rounded-2xl bg-[#FF3B30]/10 px-4 py-3 text-center text-sm text-[#C4291D]">
                    {error}
                </p>
            ) : null}

            {avisoEspera ? (
                <p role="status" className="mx-auto mt-4 max-w-xl rounded-2xl bg-[#F2F2F7] px-4 py-3 text-center text-sm text-[#3A3A3C]">
                    {avisoEspera}
                </p>
            ) : null}
        </section>
    );
}

/* Botón de envío del enlace: píldora gris tipo iOS con icono y texto. */
function BotonEnvio({ onClick, deshabilitado = false, ayuda, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={deshabilitado}
            title={ayuda}
            aria-label={ayuda}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#F2F2F7] px-2 text-[14px] font-semibold text-[#007AFF] transition-colors hover:bg-[#E5E5EA] active:bg-[#D1D1D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:text-[#AEAEB2] disabled:hover:bg-[#F2F2F7]"
        >
            {children}
        </button>
    );
}

/* Botón redondo de la barra de llamada. activo = estado "apagado" resaltado en blanco
   (como el micrófono silenciado en FaceTime); peligro = rojo para salir. */
function BotonCircular({ etiqueta, descripcion, activo = false, peligro = false, onClick, children }) {
    const fondo = peligro
        ? "bg-[#FF3B30] text-white hover:bg-[#E0352B]"
        : activo
            ? "bg-white text-[#1D1D1F] hover:bg-white/90"
            : "bg-white/15 text-white hover:bg-white/25";
    return (
        <div className="flex w-14 flex-col items-center gap-1.5">
            <button
                type="button"
                onClick={onClick}
                aria-label={descripcion}
                aria-pressed={peligro ? undefined : activo}
                title={descripcion}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-[background-color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 [&_svg]:pointer-events-none ${fondo}`}
            >
                {children}
            </button>
            <span className="text-[11px] font-medium text-white/80">{etiqueta}</span>
        </div>
    );
}
