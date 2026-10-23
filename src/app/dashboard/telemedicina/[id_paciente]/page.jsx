"use client"

// Sala de telemedicina del paciente. Por ahora solo muestra la cámara local
// (vista previa): sin audio ni conexión remota — la señal WebRTC con el
// paciente vendrá después.
//
// Abajo del escenario va el mismo historial de fichas clínicas de la carpeta
// del paciente (mismo endpoint, mismo popup de nueva ficha), para que el
// profesional registre la consulta sin salir de la sala. El popup es el
// FichaClinicaModal compartido del repo; el resto de la pantalla sigue siendo
// un único componente a propósito.

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { formatRut } from "@/lib/designTokens";
import { claveFechaCivil, formatearFechaCivil } from "@/lib/fechas";
import FichaClinicaModal from "@/Componentes/FichaClinicaModal";
import ToasterClient from "@/Componentes/ToasterClient";

export default function Telemedicina() {

    const { id_paciente } = useParams();
    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL;
    const { user, isLoaded: usuarioCargado } = useUser();

    const [paciente, setPaciente] = useState(null);
    const [pacienteCargando, setPacienteCargando] = useState(true);

    // "inactiva" | "solicitando" | "activa" | "error"
    const [estadoCamara, setEstadoCamara] = useState("inactiva");
    const [errorCamara, setErrorCamara] = useState("");

    const videoRef = useRef(null);
    // El stream vive en un ref, no en estado: React no debe re-renderizar por
    // cada track, y así el cleanup de desmontaje tiene siempre el valor actual.
    const streamRef = useRef(null);

    // ── Historial de fichas (el mismo de la carpeta del paciente) ──
    const [listaFichas, setListaFichas] = useState([]);
    const [cargandoFichas, setCargandoFichas] = useState(true);
    const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
    const [fichasExpandidas, setFichasExpandidas] = useState(new Set());

    // Mismos helpers que la carpeta del paciente: el backend guarda los campos
    // de la plantilla como JSON en datosDinamicos, agrupados por categoría.
    function parsearDatosDinamicos(datos) {
        if (!datos) return null
        let parsed = datos
        if (typeof datos === "string") {
            try { parsed = JSON.parse(datos) } catch { return null }
        }
        if (!parsed || typeof parsed !== "object") return null
        return parsed
    }

    function agruparPorCategoria(datos) {
        const categoriasMap = {}

        Object.keys(datos).forEach(key => {
            if (key === "_plantillaNombre") return
            const entry = datos[key]
            if (!entry || typeof entry !== "object" || !entry.nombreCategoria) return

            const catNombre = entry.nombreCategoria
            if (!categoriasMap[catNombre]) {
                categoriasMap[catNombre] = {
                    nombre: catNombre,
                    orden: entry.categoriaOrden || 0,
                    campos: []
                }
            }
            categoriasMap[catNombre].campos.push({
                nombre: entry.nombreCampo,
                valor: entry.valor,
                orden: entry.campoOrden || 0
            })
        })

        return Object.values(categoriasMap)
            .sort((a, b) => a.orden - b.orden)
            .map(cat => ({
                ...cat,
                campos: cat.campos.sort((a, b) => a.orden - b.orden)
            }))
    }

    async function listarFichas() {
        if (!id_paciente) return;
        setCargandoFichas(true);
        try {
            const res = await fetch(`${API}/ficha/seleccionarFichasPaciente`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id_paciente }),
                mode: "cors"
            })

            if (!res.ok) {
                setListaFichas([]);
                return;
            }

            const data = await res.json();
            const lista = Array.isArray(data) ? data : [];
            setListaFichas(lista);

            // Auto-expandir la más reciente: en teleconsulta lo normal es querer
            // ver de inmediato la última ficha (o la recién guardada).
            if (lista.length > 0) {
                const ordenada = [...lista].sort((a, b) => {
                    const fechaA = claveFechaCivil(a.fechaConsulta);
                    const fechaB = claveFechaCivil(b.fechaConsulta);
                    if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
                    return Number(b.id_ficha) - Number(a.id_ficha);
                });
                setFichasExpandidas(new Set([ordenada[0].id_ficha]));
            }
        } catch (error) {
            console.log(error);
            setListaFichas([]);
        } finally {
            setCargandoFichas(false);
        }
    }

    function toggleFichaExpandida(id_ficha) {
        setFichasExpandidas(prev => {
            const next = new Set(prev);
            if (next.has(id_ficha)) {
                next.delete(id_ficha);
            } else {
                next.add(id_ficha);
            }
            return next;
        });
    }

    // Mismo patrón que la carpeta del paciente: pacientesEspecifico por id.
    useEffect(() => {
        if (!id_paciente) return;
        let vigente = true;
        (async () => {
            try {
                const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ id_paciente })
                });
                if (!vigente) return;
                if (!res.ok) throw new Error("respuesta no ok");
                const data = await res.json();
                setPaciente(Array.isArray(data) ? data[0] : data);
            } catch (error) {
                console.log(error);
                if (vigente) setPaciente(null);
            } finally {
                if (vigente) setPacienteCargando(false);
            }
        })();
        return () => { vigente = false; };
    }, [id_paciente]);

    useEffect(() => {
        listarFichas();
    }, [id_paciente]);

    function detenerStream() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }

    async function activarCamara() {
        if (estadoCamara === "solicitando") return;
        detenerStream();
        setErrorCamara("");
        setEstadoCamara("solicitando");

        // Sin contexto seguro (HTTPS o localhost) el navegador ni siquiera
        // expone getUserMedia: mejor explicarlo que fallar con un error críptico.
        if (!navigator.mediaDevices?.getUserMedia) {
            setEstadoCamara("error");
            setErrorCamara("Este navegador no permite acceder a la cámara. Verifica que la conexión sea segura (HTTPS) y que el navegador esté actualizado.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                audio: false, // por ahora solo video
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }
            setEstadoCamara("activa");
        } catch (error) {
            setEstadoCamara("error");
            const nombre = error?.name || "";
            if (nombre === "NotAllowedError" || nombre === "PermissionDeniedError") {
                setErrorCamara("Permiso de cámara denegado. Habilítalo en tu navegador e intenta nuevamente.");
            } else if (nombre === "NotFoundError" || nombre === "DevicesNotFoundError") {
                setErrorCamara("No se detectó ninguna cámara conectada a este equipo.");
            } else if (nombre === "NotReadableError" || nombre === "TrackStartError") {
                setErrorCamara("La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo.");
            } else if (nombre === "SecurityError") {
                setErrorCamara("El navegador bloqueó el acceso a la cámara. Se requiere conexión segura (HTTPS).");
            } else {
                setErrorCamara("No se pudo acceder a la cámara. Intenta nuevamente.");
            }
        }
    }

    function apagarCamara() {
        detenerStream();
        if (videoRef.current) videoRef.current.srcObject = null;
        setEstadoCamara("inactiva");
    }

    // Al salir de la sala hay que liberar la cámara: sin esto el indicador de
    // uso queda encendido aunque nadie esté viendo el video.
    useEffect(() => () => detenerStream(), []);

    const camaraActiva = estadoCamara === "activa";
    const nombreCompleto = paciente ? `${paciente.nombre || ""} ${paciente.apellido || ""}`.trim() : "";
    const iniciales = `${paciente?.nombre?.charAt(0) || ""}${paciente?.apellido?.charAt(0) || ""}`.toUpperCase();

    const estadoChip = {
        inactiva: { punto: "bg-slate-400", texto: "Cámara apagada" },
        solicitando: { punto: "bg-amber-400 animate-pulse", texto: "Conectando cámara…" },
        activa: { punto: "bg-emerald-400", texto: "Cámara activa" },
        error: { punto: "bg-red-400", texto: "Error de cámara" },
    }[estadoCamara];

    // Se ordenan como texto "AAAA-MM-DD" para no pasar por Date, que desplaza
    // el día según la zona horaria. Más recientes primero.
    const fichasOrdenadas = [...listaFichas].sort((a, b) => {
        const fechaA = claveFechaCivil(a.fechaConsulta);
        const fechaB = claveFechaCivil(b.fechaConsulta);
        if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
        return Number(b.id_ficha) - Number(a.id_ficha);
    });

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>

            {/* Con el cajon de ficha abierto, el contenido se corre a la izquierda
                (lg:pr-[512px]) para que la camara quede a la vista al lado del
                formulario. El padding transiciona en 300ms, junto con la entrada
                del cajon. En pantallas menores a lg el cajon cubre la pantalla:
                ahi no hay ancho de sobra. */}
            <div className={`flex-1 mx-auto w-full max-w-5xl px-4 py-6 transition-[padding] duration-300 ease-out md:px-8 md:py-10 ${modalFichaAbierto ? "lg:pr-[512px]" : ""}`}>

                {/* ── Encabezado ── */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/FichasPacientes/${id_paciente}`)}
                        aria-label="Volver a la carpeta del paciente"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E56CF]">Sala de telemedicina</p>
                        <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            {pacienteCargando ? "Cargando…" : nombreCompleto || "Paciente"}
                        </h1>
                        {!pacienteCargando && paciente && (
                            <p className="mt-1 truncate text-[12px] text-slate-400">
                                RUT <span className="font-mono font-semibold text-slate-600">{formatRut(paciente.rut) || paciente.rut || "—"}</span>
                                <span className="mx-2 text-slate-300">·</span>
                                ID #{id_paciente}
                            </p>
                        )}
                    </div>
                    {/* Avatar con las iniciales, mismo estilo que la carpeta del paciente. */}
                    {paciente && (
                        <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#6E56CF] text-base font-bold text-white shadow-lg shadow-indigo-100">
                            {iniciales}
                        </div>
                    )}
                </div>

                {/* ── Escenario de video ── */}
                <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-xl shadow-slate-200/60">
                    {/* Siempre montado: activarCamara necesita el ref para asignar
                        el stream. Cuando está apagada queda invisible con opacity. */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full -scale-x-100 object-cover transition-opacity duration-500 ${camaraActiva ? "opacity-100" : "opacity-0"}`}
                    />

                    {/* Chip de estado */}
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3.5 py-1.5 backdrop-blur-sm">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${estadoChip.punto}`} />
                        <span className="text-[11px] font-semibold text-white">{estadoChip.texto}</span>
                    </div>

                    {/* Overlay central: inactivo, solicitando o error */}
                    {!camaraActiva && (
                        <div aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
                            {estadoCamara === "error" ? (
                                <>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <p className="max-w-md text-sm font-medium leading-relaxed text-slate-200">{errorCamara}</p>
                                    <p className="text-[12px] text-slate-500">Usa el botón de abajo para intentar nuevamente.</p>
                                </>
                            ) : estadoCamara === "solicitando" ? (
                                <>
                                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                                    <p className="text-sm font-semibold text-white">Solicitando permiso de cámara…</p>
                                    <p className="text-[12px] text-slate-400">Acepta el permiso en la ventana de tu navegador.</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-white">Cámara apagada</p>
                                    <p className="text-[12px] text-slate-400">Activa tu cámara para comenzar la consulta.</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Control de cámara ── */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <button
                            onClick={camaraActiva ? apagarCamara : activarCamara}
                            disabled={estadoCamara === "solicitando"}
                            className={`flex h-11 items-center gap-2.5 rounded-full px-5 text-[12px] font-bold shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:opacity-70 ${
                                camaraActiva
                                    ? "bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-300"
                                    : "bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-white/60"
                            }`}
                        >
                            {estadoCamara === "solicitando" ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                                    Conectando…
                                </>
                            ) : camaraActiva ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM4 4l16 16" />
                                    </svg>
                                    Apagar cámara
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Activar cámara
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <p className="mt-4 text-center text-[12px] text-slate-400">
                    Vista previa local — solo tú puedes verte. La conexión con el paciente estará disponible próximamente.
                </p>

                {/* ── Historial de fichas clínicas (el mismo de la carpeta del paciente) ── */}
                <div className="mt-10">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-[#6E56CF]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h7l3 3v13H7V4z" />
                            </svg>
                        </span>
                        <h2 className="whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] text-slate-900">Historial de fichas clínicas</h2>
                        <span aria-hidden="true" className="h-px min-w-[24px] flex-1 bg-slate-200" />
                        <span className="flex h-6 items-center justify-center rounded-full bg-violet-50 px-2.5 text-[11px] font-bold text-[#6E56CF]">
                            {listaFichas.length} registro{listaFichas.length === 1 ? "" : "s"}
                        </span>
                        {/* El mismo botón de "nueva ficha" de la carpeta: abre el mismo
                            popup (FichaClinicaModal) para registrar la consulta de acá mismo. */}
                        <button
                            onClick={() => setModalFichaAbierto(true)}
                            className="flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Ficha
                        </button>
                    </div>

                    {cargandoFichas ? (
                        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
                            <p className="text-sm text-slate-400">Cargando historial de fichas…</p>
                        </div>
                    ) : fichasOrdenadas.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                            <p className="text-sm font-medium text-slate-400">Este paciente aún no tiene fichas clínicas.</p>
                            <p className="mt-1 text-[12px] text-slate-400">Usa "Nueva Ficha" para registrar esta consulta.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fichasOrdenadas.map((ficha) => {
                                const expandida = fichasExpandidas.has(ficha.id_ficha);
                                const datos = parsearDatosDinamicos(ficha.datosDinamicos);
                                return (
                                    <div key={ficha.id_ficha} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300">
                                        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-bold text-slate-900">
                                                    {datos?._plantillaNombre || ficha.tipoAtencion || "Consulta General"}
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                                    {formatearFechaCivil(ficha.fechaConsulta)}
                                                    <span className="mx-1.5 text-slate-300">·</span>
                                                    Prof. {ficha.observaciones || "No informado"}
                                                </p>
                                            </div>
                                            <span className="inline-flex h-6 shrink-0 items-center rounded-lg border border-violet-100 bg-violet-50/80 px-2 text-[9px] font-bold text-[#6E56CF]">
                                                N° Registro {ficha.id_ficha}
                                            </span>
                                            <button
                                                onClick={() => toggleFichaExpandida(ficha.id_ficha)}
                                                className="h-9 shrink-0 rounded-xl border border-slate-800 bg-black px-4 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                            >
                                                {expandida ? "Ocultar" : "Ver detalle"}
                                            </button>
                                        </div>

                                        {expandida && (
                                            <div className="border-t border-slate-100 bg-slate-50/30 p-5">
                                                {datos && datos._plantillaNombre ? (
                                                    <div className="space-y-5">
                                                        {agruparPorCategoria(datos).map((cat) => (
                                                            <div key={cat.nombre} className="space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="h-2 w-2 rounded-full bg-[#6E56CF] shadow-[0_0_0_4px_rgba(110,86,207,0.1)]" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E56CF]">{cat.nombre}</span>
                                                                    <div className="h-px flex-1 bg-slate-200" />
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    {cat.campos.map((campo, idx) => (
                                                                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{campo.nombre}</span>
                                                                            <p className="mt-1.5 whitespace-pre-wrap text-[13px] font-semibold leading-relaxed text-slate-700">{campo.valor || "-"}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="py-2 text-center text-sm italic text-slate-400">No hay datos estructurados en esta ficha.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* El mismo popup de nueva ficha que usa la carpeta del paciente,
                pero en variante lateral (cajon derecho): asi la videoconsulta
                sigue a la vista mientras se llena la ficha. */}
            <FichaClinicaModal
                abierto={modalFichaAbierto}
                lateral
                paciente={paciente}
                id_paciente={id_paciente}
                idProfesionalAgendaAsignada={String(user?.publicMetadata?.idProfesionalAgenda || "").trim()}
                usuarioCargado={usuarioCargado}
                onCerrar={() => setModalFichaAbierto(false)}
                onGuardada={() => listarFichas()}
            />
        </div>
    )
}
