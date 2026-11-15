"use client";

import Video from "twilio-video";
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useEffect, useRef, useState } from "react";
import { Check, Link2, Mail, MessageCircle, Mic, MicOff, PhoneOff, Video as IconoVideo, VideoOff } from "lucide-react";
import { MINUTOS_ENLACE, enlaceSala, mensajeInvitacion } from "@/lib/telemedicina";
import { urlWhatsapp } from "@/lib/whatsapp";

/* Reglas del enlace (las aplica el backend; acá solo se muestran):
 *  - Cada envío (WhatsApp, correo, copiar) genera un enlace nuevo que sirve 15 minutos
 *    para entrar. Mientras el profesional espera, la cuenta regresiva parte de nuevo.
 *  - Si el paciente no entra a tiempo, la sala se cierra sola.
 *  - "Salir" del profesional termina la videollamada para los dos: el enlace pasa a
 *    decir "La videollamada finalizó". */

// Códigos de desconexión de Twilio Video.
const SALA_TERMINADA = 53118;
const IDENTIDAD_DUPLICADA = 53205;

// Pantallas finales del paciente (el backend responde el código en `message`).
const FINALES_PACIENTE = {
    salaFinalizada: { titulo: "La videollamada finalizó", detalle: "Gracias por conectarte. Ya puedes cerrar esta ventana." },
    enlaceVencido: { titulo: "Este enlace venció", detalle: `Los enlaces sirven ${MINUTOS_ENLACE} minutos para entrar. Pídele uno nuevo al profesional.` },
    enlaceUsado: { titulo: "Este enlace ya se usó", detalle: "Se abrió en otro dispositivo o navegador. Si eres el paciente, pídele un enlace nuevo al profesional." },
    invitacionInvalida: { titulo: "Enlace no válido", detalle: "Revisa que esté completo o pídele uno nuevo al profesional." },
};

const MENSAJES_PROFESIONAL = {
    sinDatoContacto: "La ficha del paciente no tiene un correo válido.",
    demasiadasSolicitudes: "Hiciste muchos envíos seguidos. Espera unos minutos.",
    sinPermiso: "No tienes permiso sobre esta videollamada.",
};

const claveLlave = (nombreSala) => `telemedicina-llave:${nombreSala}`;
function leerLlave(nombreSala) {
    try { return window.localStorage.getItem(claveLlave(nombreSala)) || undefined; } catch { return undefined; }
}
function guardarLlave(nombreSala, llave) {
    try { window.localStorage.setItem(claveLlave(nombreSala), llave); } catch { /* sin almacenamiento: no podrá volver si se le corta */ }
}

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
    // Copia para los manejadores de Twilio y la limpieza al salir de la página.
    const salaDatosRef = useRef(salaDatos);
    // Hasta cuándo sirve el último enlace enviado (reloj local, medido desde que llegó la
    // respuesta: el backend manda los segundos que le quedan, no una hora).
    const venceEnlaceRef = useRef(null);
    // El paciente ya entró alguna vez a esta sala: deja de correr la espera.
    const pacienteEntroRef = useRef(false);
    // "Salir" o cierre por espera en curso: el evento disconnected no es una caída.
    const cerrandoRef = useRef(false);
    const [conectado, setConectado] = useState(false);
    const [conectando, setConectando] = useState(false);
    const [microfonoActivo, setMicrofonoActivo] = useState(true);
    const [camaraActiva, setCamaraActiva] = useState(true);
    const [pistasLocales, setPistasLocales] = useState([]);
    const [pistasRemotas, setPistasRemotas] = useState([]);
    const [error, setError] = useState("");
    const [enlaceCopiado, setEnlaceCopiado] = useState(false);
    const [enviando, setEnviando] = useState("");
    // Confirmación del último envío ("Enviado a j•••a@correo.cl").
    const [avisoEnvio, setAvisoEnvio] = useState("");
    // Paciente: el enlace ya no sirve (finalizó, venció, ya se usó). Reemplaza el botón de entrar.
    const [estadoFinal, setEstadoFinal] = useState(null);
    // Cuenta regresiva mientras el profesional espera al paciente. null = inactiva.
    const [venceEspera, setVenceEspera] = useState(null);
    const [segundosEspera, setSegundosEspera] = useState(null);
    const [avisoEspera, setAvisoEspera] = useState("");
    // Duración de la llamada: corre desde que llega el video de la otra persona.
    const [segundosLlamada, setSegundosLlamada] = useState(0);
    const hayVideoRemoto = pistasRemotas.some((item) => item.pista.kind === "video");

    function definirSala(datos) {
        salaDatosRef.current = datos;
        setSalaDatos(datos);
    }

    useEffect(() => {
        if (!hayVideoRemoto) {
            setSegundosLlamada(0);
            return undefined;
        }
        const id = window.setInterval(() => setSegundosLlamada((s) => s + 1), 1000);
        return () => window.clearInterval(id);
    }, [hayVideoRemoto]);

    // Tictac de la espera, calculado contra la hora de vencimiento (no se atrasa si la
    // pestaña queda en segundo plano y el navegador frena los temporizadores).
    useEffect(() => {
        if (venceEspera === null) {
            setSegundosEspera(null);
            return undefined;
        }
        const restante = () => Math.max(0, Math.ceil((venceEspera - Date.now()) / 1000));
        setSegundosEspera(restante());
        const id = window.setInterval(() => setSegundosEspera(restante()), 1000);
        return () => window.clearInterval(id);
    }, [venceEspera]);

    // Se acabó la espera sin paciente: se cierra la sala (también en el backend, así el
    // enlace queda muerto) y todo queda listo para una videollamada nueva.
    useEffect(() => {
        if (segundosEspera !== 0) return;
        terminarVideollamada();
        setAvisoEspera(`El paciente no se conectó en ${MINUTOS_ENLACE} minutos. La videollamada se cerró; puedes iniciar una nueva cuando quieras reintentar.`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segundosEspera]);

    // Paciente: al abrir el enlace se revisa si todavía sirve, antes de pedir la cámara.
    // El acceso que devuelve se descarta: el enlace se "usa" recién al entrar a la sala.
    useEffect(() => {
        if (modo !== "paciente" || !nombreSalaInicial || !invitacionInicial || !API) return undefined;
        let vigente = true;
        (async () => {
            try {
                const res = await fetch(`${API}/telemedicina/tokenSala`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombreSala: nombreSalaInicial, invitacion: invitacionInicial, llave: leerLlave(nombreSalaInicial) }),
                });
                const data = await res.json().catch(() => ({}));
                if (vigente && FINALES_PACIENTE[data.message]) setEstadoFinal(FINALES_PACIENTE[data.message]);
            } catch {
                // Sin conexión: se intentará de nuevo al apretar "Unirme".
            }
        })();
        return () => { vigente = false; };
    }, [modo, nombreSalaInicial, invitacionInicial, API]);

    // El profesional sale de la página con la llamada abierta: se termina para los dos.
    useEffect(() => () => {
        if (modo === "profesional" && salaRef.current) avisarFinalizacion();
        cerrandoRef.current = true;
        salaRef.current?.disconnect();
        salaRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    function limpiarConexion() {
        setVenceEspera(null);
        salaRef.current = null;
        setConectado(false);
        setPistasLocales([]);
        setPistasRemotas([]);
    }

    /** Le pide al backend que termine la sala. No se espera: si falla, Twilio la cierra
     *  sola cuando queda vacía. */
    function avisarFinalizacion() {
        const datos = salaDatosRef.current;
        if (!API || !datos?.nombreSala) return;
        fetch(`${API}/telemedicina/finalizarSala`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombreSala: datos.nombreSala, invitacion: datos.invitacion }),
            keepalive: true,
        }).catch(() => {});
    }

    /** Profesional: termina la videollamada para los dos y olvida la sala. */
    function terminarVideollamada() {
        avisarFinalizacion();
        cerrandoRef.current = true;
        salaRef.current?.disconnect();
        limpiarConexion();
        definirSala(null);
        venceEnlaceRef.current = null;
        setAvisoEnvio("");
    }

    /** Pide el acceso a la sala: el profesional con su sesión; el paciente con el enlace
     *  (y su llave, si ya había entrado). */
    async function pedirAcceso(datosSala) {
        if (modo === "profesional") {
            const res = await fetch(`${API}/telemedicina/tokenProfesional`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombreSala: datosSala.nombreSala, invitacion: datosSala.invitacion }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && typeof data.data === "string") return { token: data.data };
            if (data.message === "salaFinalizada") {
                definirSala(null);
                throw new Error("Esa videollamada ya terminó. Inicia una nueva.");
            }
            throw new Error(MENSAJES_PROFESIONAL[data.message] || "No se pudo obtener el acceso a la sala.");
        }

        const res = await fetch(`${API}/telemedicina/tokenSala`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombreSala: datosSala.nombreSala, invitacion: datosSala.invitacion, llave: leerLlave(datosSala.nombreSala) }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.data?.token === "string") return data.data;
        if (FINALES_PACIENTE[data.message]) {
            setEstadoFinal(FINALES_PACIENTE[data.message]);
            return null;
        }
        throw new Error(data.message === "demasiadasSolicitudes"
            ? "Demasiados intentos. Espera unos minutos y vuelve a intentar."
            : "No se pudo entrar a la videollamada. Intenta de nuevo.");
    }

    async function conectarASala(datosSala) {
        if (!API) throw new Error("Falta configurar la URL de la API.");

        const acceso = await pedirAcceso(datosSala);
        if (!acceso) return;

        const sala = await Video.connect(acceso.token, {
            name: datosSala.nombreSala,
            audio: true,
            video: true,
        });
        if (acceso.llave) guardarLlave(datosSala.nombreSala, acceso.llave);

        cerrandoRef.current = false;
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
            pacienteEntroRef.current = true;
            setVenceEspera(null);
            registrarParticipante(participante);
        });
        sala.on("participantDisconnected", (participante) => {
            setPistasRemotas((actuales) => actuales.filter((item) => item.participanteSid !== participante.sid));
        });
        sala.on("disconnected", (_sala, errorTwilio) => {
            limpiarConexion();
            if (cerrandoRef.current) return;
            if (errorTwilio?.code === SALA_TERMINADA) {
                if (modo === "paciente") {
                    setEstadoFinal(FINALES_PACIENTE.salaFinalizada);
                } else {
                    definirSala(null);
                    setAvisoEspera("La videollamada finalizó.");
                }
            } else if (errorTwilio?.code === IDENTIDAD_DUPLICADA) {
                setError("Entraste a esta videollamada desde otra pestaña o equipo; sigue allá.");
            } else if (errorTwilio) {
                setError("Se cortó la conexión. Vuelve a entrar con el botón verde.");
            }
        });
        sala.participants.forEach(registrarParticipante);
        if (sala.participants.size > 0) pacienteEntroRef.current = true;
        setConectado(true);

        // Solo se espera al paciente si la sala está vacía y nunca entró: corre hasta que
        // vence el último enlace.
        if (modo === "profesional" && !pacienteEntroRef.current && venceEnlaceRef.current) {
            setVenceEspera(venceEnlaceRef.current);
        }
    }

    async function iniciarLlamada() {
        if (conectando || conectado) return;
        setConectando(true);
        setError("");
        setAvisoEspera("");

        try {
            let datosSala = salaDatos;

            if (modo === "profesional" && !datosSala) {
                const respuestaSala = await fetch(`${API}/telemedicina/nuevaSala`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // Viaja dentro de la invitación firmada y así llega al
                    // encabezado que ve el paciente.
                    body: JSON.stringify({ nombreProfesional }),
                });
                const resultadoSala = await respuestaSala.json().catch(() => ({}));
                if (!respuestaSala.ok || !resultadoSala.success) {
                    throw new Error(MENSAJES_PROFESIONAL[resultadoSala.message] || "No se pudo crear la sala.");
                }
                pacienteEntroRef.current = false;
                datosSala = aplicarInvitacion(resultadoSala.data);
            }

            if (!datosSala?.nombreSala || !datosSala?.invitacion) {
                throw new Error("Faltan datos para unirse a la sala.");
            }

            await conectarASala(datosSala);
        } catch (errorConexion) {
            console.error("Error iniciando telemedicina:", errorConexion);
            setError(errorConexion.message || "No se pudo iniciar la videollamada.");
        } finally {
            setConectando(false);
        }
    }

    function desconectar() {
        if (!salaRef.current) return;
        if (modo === "profesional") {
            terminarVideollamada();
            setAvisoEspera("Terminaste la videollamada. El enlace del paciente ya no sirve.");
            return;
        }
        // El paciente puede volver a entrar con el mismo enlace mientras la llamada siga.
        cerrandoRef.current = true;
        salaRef.current.disconnect();
        limpiarConexion();
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

    /** Guarda la invitación que mandó el backend y, si se está esperando al paciente,
     *  reinicia la cuenta regresiva con los 15 minutos del enlace nuevo. */
    function aplicarInvitacion(datos) {
        const nueva = { nombreSala: datos.nombreSala, invitacion: datos.invitacion };
        definirSala(nueva);
        const vence = Date.now() + Number(datos.segundosRestantes || 0) * 1000;
        venceEnlaceRef.current = vence;
        if (!pacienteEntroRef.current) setVenceEspera((actual) => (actual === null ? null : vence));
        return nueva;
    }

    /** Enlace nuevo (15 minutos desde ahora) para enviar por WhatsApp o copiar. */
    async function renovarEnlace() {
        const datos = salaDatosRef.current;
        const res = await fetch(`${API}/telemedicina/renovarInvitacion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombreSala: datos.nombreSala, invitacion: datos.invitacion }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            const nueva = aplicarInvitacion(data);
            return enlaceSala(window.location.origin, nueva.nombreSala, nueva.invitacion);
        }
        if (data.message === "salaFinalizada") {
            terminarVideollamada();
            throw new Error("Esta videollamada ya terminó. Inicia una nueva para enviar el enlace.");
        }
        throw new Error(MENSAJES_PROFESIONAL[data.message] || "No se pudo generar el enlace. Intenta de nuevo.");
    }

    // WhatsApp: abre el WhatsApp del propio profesional (celular o web) con el mensaje y el
    // enlace ya escritos, dirigido al celular de la ficha. El profesional solo aprieta enviar.
    // La ventana se abre antes de pedir el enlace: si se abre después de esperar al backend,
    // Safari y otros navegadores la bloquean por no venir directo del clic.
    async function enviarPorWhatsapp() {
        if (!salaDatosRef.current || enviando) return;
        if (!urlWhatsapp(paciente?.telefono, "x")) return setError("La ficha del paciente no tiene celular registrado.");
        setError("");
        setAvisoEnvio("");
        setEnviando("whatsapp");
        const ventana = window.open("", "_blank");
        try {
            const enlace = await renovarEnlace();
            const url = urlWhatsapp(paciente.telefono, mensajeInvitacion({
                nombrePaciente: paciente?.nombre, nombreProfesional, nombreClinica, enlace,
            }));
            if (ventana) {
                ventana.opener = null;
                ventana.location.href = url;
            } else {
                window.open(url, "_blank", "noopener,noreferrer");
            }
            setAvisoEnvio(`Se abrió WhatsApp con un enlace nuevo: solo falta enviarlo. Sirve ${MINUTOS_ENLACE} minutos para entrar.`);
        } catch (errorEnvio) {
            ventana?.close();
            setError(errorEnvio.message);
        } finally {
            setEnviando("");
        }
    }

    // Correo: lo envía el backend al correo registrado en la ficha (nunca a uno escrito aquí),
    // con un enlace nuevo que devuelve para reiniciar la cuenta regresiva.
    async function enviarPorCorreo() {
        const datos = salaDatosRef.current;
        if (!datos || !paciente?.id_paciente || enviando) return;
        setEnviando("correo");
        setError("");
        setAvisoEnvio("");
        try {
            const res = await fetch(`${API}/telemedicina/enviarInvitacionCorreo`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ id_paciente: paciente.id_paciente, nombreSala: datos.nombreSala, invitacion: datos.invitacion }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                aplicarInvitacion(data);
                return setAvisoEnvio(`Enlace nuevo enviado a ${data.destino}. Sirve ${MINUTOS_ENLACE} minutos para entrar.`);
            }
            if (data.message === "salaFinalizada") {
                terminarVideollamada();
                return setError("Esta videollamada ya terminó. Inicia una nueva para enviar el enlace.");
            }
            setError(MENSAJES_PROFESIONAL[data.message] || "No se pudo enviar el correo. Intenta de nuevo.");
        } catch {
            setError("No se pudo enviar el correo. Revisa tu conexión.");
        } finally {
            setEnviando("");
        }
    }

    // Copiar: el enlace nuevo llega del backend después del clic. Con ClipboardItem se le
    // entrega al portapapeles una promesa, que los navegadores aceptan como parte del clic;
    // donde no existe, se copia al llegar.
    async function copiarEnlace() {
        if (!salaDatosRef.current || enviando) return;
        setError("");
        setAvisoEnvio("");
        setEnviando("copiar");
        let errorEnlace = null;
        const enlace = renovarEnlace().catch((e) => { errorEnlace = e; throw e; });
        try {
            if (typeof window.ClipboardItem === "function" && navigator.clipboard?.write) {
                await navigator.clipboard.write([new window.ClipboardItem({
                    "text/plain": enlace.then((texto) => new Blob([texto], { type: "text/plain" })),
                })]).catch(async (errorPortapapeles) => {
                    if (errorEnlace) throw errorEnlace;
                    // Navegador sin soporte de promesas en ClipboardItem: se copia como texto.
                    await navigator.clipboard.writeText(await enlace).catch(() => { throw errorPortapapeles; });
                });
            } else {
                await navigator.clipboard.writeText(await enlace);
            }
            setEnlaceCopiado(true);
            setAvisoEnvio(`Enlace nuevo copiado. Sirve ${MINUTOS_ENLACE} minutos para entrar.`);
            window.setTimeout(() => setEnlaceCopiado(false), 2500);
        } catch {
            setError(errorEnlace?.message || "No se pudo copiar el enlace. Revisa los permisos del navegador.");
        } finally {
            setEnviando("");
        }
    }

    const pistaLocalVideo = pistasLocales.find((item) => item.pista.kind === "video");
    const pistaRemotaVideo = pistasRemotas.find((item) => item.pista.kind === "video");
    const identidadValida = modo === "paciente" || Boolean(identidad);
    const otraPersona = modo === "profesional" ? "al paciente" : "al profesional";
    // El profesional se cayó de una sala que sigue abierta: vuelve a la misma.
    const puedeVolver = modo === "profesional" && Boolean(salaDatos);

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
                            {estadoFinal ? (
                                <PhoneOff className="relative h-8 w-8 text-white/90" strokeWidth={1.5} aria-hidden="true" />
                            ) : (
                                <IconoVideo className="relative h-8 w-8 text-white/90" strokeWidth={1.5} aria-hidden="true" />
                            )}
                        </span>
                        <p className="relative mt-5 text-[20px] font-semibold tracking-tight">
                            {estadoFinal ? estadoFinal.titulo : conectado ? `Esperando ${otraPersona}` : "Listo para la videollamada"}
                        </p>
                        <p className="relative mt-1.5 max-w-sm text-[14px] leading-relaxed text-white/60">
                            {estadoFinal
                                ? estadoFinal.detalle
                                : conectado
                                    ? segundosEspera !== null
                                        ? `Si no se conecta en ${formatearMinutos(segundosEspera)}, la videollamada se cerrará sola.`
                                        : "Su video aparecerá aquí apenas se una."
                                    : "El navegador te pedirá permiso para usar la cámara y el micrófono."}
                        </p>

                        {!conectado && !estadoFinal ? (
                            <button
                                type="button"
                                onClick={iniciarLlamada}
                                disabled={conectando || !identidadValida}
                                className="relative mt-7 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#34C759] px-7 text-[16px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(52,199,89,0.8)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                            >
                                <IconoVideo className="h-5 w-5" aria-hidden="true" />
                                {conectando
                                    ? "Conectando…"
                                    : modo === "paciente"
                                        ? "Unirme a la videollamada"
                                        : puedeVolver ? "Volver a la videollamada" : "Iniciar videollamada"}
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
                            : conectado ? "Conectado" : estadoFinal ? "Sin videollamada" : "Sala lista"}
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
                                    descripcion="Copiar un enlace nuevo para el paciente"
                                    activo={enlaceCopiado}
                                    onClick={copiarEnlace}
                                >
                                    {enlaceCopiado ? <Check className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}
                                </BotonCircular>
                            ) : null}
                            <BotonCircular
                                etiqueta={modo === "profesional" ? "Terminar" : "Salir"}
                                descripcion={modo === "profesional" ? "Terminar la videollamada para los dos" : "Salir de la llamada"}
                                peligro
                                onClick={desconectar}
                            >
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
                            deshabilitado={!paciente?.telefono || Boolean(enviando)}
                            ayuda={paciente?.telefono ? "Abrir WhatsApp con el mensaje listo" : "La ficha no tiene celular"}
                        >
                            <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                            {enviando === "whatsapp" ? "Abriendo…" : "WhatsApp"}
                        </BotonEnvio>
                        <BotonEnvio
                            onClick={enviarPorCorreo}
                            deshabilitado={!paciente?.correo || Boolean(enviando)}
                            ayuda={paciente?.correo ? "Enviar al correo de la ficha" : "La ficha no tiene correo"}
                        >
                            <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                            {enviando === "correo" ? "Enviando…" : "Correo"}
                        </BotonEnvio>
                        <BotonEnvio onClick={copiarEnlace} deshabilitado={Boolean(enviando)} ayuda="Copiar un enlace nuevo">
                            {enlaceCopiado ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Link2 className="h-[18px] w-[18px]" aria-hidden="true" />}
                            {enlaceCopiado ? "Copiado" : "Copiar"}
                        </BotonEnvio>
                    </div>
                    {avisoEnvio ? (
                        <p role="status" className="mt-2.5 text-center text-[13px] text-[#248A3D]">{avisoEnvio}</p>
                    ) : null}
                    <p className="mt-2 text-center text-[12px] leading-relaxed text-[#86868B]">
                        Va al celular o correo de la ficha. Cada envío es un enlace nuevo: sirve {MINUTOS_ENLACE} minutos para entrar, a una sola persona, y deja de funcionar al terminar la videollamada.
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
