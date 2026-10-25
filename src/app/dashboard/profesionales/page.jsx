'use client'

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from 'react-hot-toast';
import ProfesionalModal from "@/Componentes/ProfesionalModal";
import TutorialGuiadoProfesionales from "@/Componentes/TutorialGuiadoProfesionales";
import { formatRut } from "@/lib/designTokens";
import { useTour } from "@/ContextosGlobales/TourContext";
import InsigniaEstado from "@/Componentes/firma/InsigniaEstado";
import SiluetaProfesional from "@/Componentes/SiluetaProfesional";
import { cfImageUrl } from "@/lib/cloudflare";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { ESTADOS_FIRMA, ESTADOS_REGISTRO_SIS } from "@/lib/firma/constantes";
import { MODO_MOCK } from "@/lib/firma/apiFirma";
import { aplicarEstadoMock } from "@/lib/firma/mockFirma";

// Fila de la lista agrupada de la tarjeta, al estilo de Ajustes de iOS: ícono
// blanco sobre un cuadrado azul redondeado y el dato a la derecha.
function FilaDato({ icono, children }) {
    return (
        <div className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-[#1D1D1F]">
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#007AFF] text-white [&_svg]:h-[15px] [&_svg]:w-[15px]">
                {icono}
            </span>
            <span className="min-w-0 truncate">{children || "—"}</span>
        </div>
    );
}

// Estado de la firma electrónica y del registro de la Superintendencia en la
// tarjeta. Al propio profesional, si le falta algo, se le ofrece completarlo:
// sin firma no puede emitir documentos firmados electrónicamente.
function EstadoDocumentosFirmados({ profesional, esPropio, onCompletar }) {
    const firmaActiva = profesional.firma_estado === "activa";
    const estadoRegistro = profesional.registro_sis_estado || "no_informado";
    const faltaRegistro = estadoRegistro === "no_informado" || estadoRegistro === "rechazado";

    return (
        <div className="mt-3.5 px-5">
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Firma</span>
                <InsigniaEstado estado={ESTADOS_FIRMA[firmaActiva ? "activa" : "ninguna"]} />
                <span className="ml-2 text-[11px] text-slate-400">Reg. SIS</span>
                <InsigniaEstado estado={ESTADOS_REGISTRO_SIS[estadoRegistro] || ESTADOS_REGISTRO_SIS.no_informado} />
            </div>
            {esPropio && (!firmaActiva || faltaRegistro) ? (
                <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-[#007AFF]/[0.07] px-3.5 py-2.5 text-[12px] text-[#1D1D1F] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {!firmaActiva
                            ? "Registra tu firma electrónica para emitir documentos firmados."
                            : "Agrega tu N° de registro de la Superintendencia para el pie de firma."}
                    </span>
                    <button
                        type="button"
                        onClick={() => onCompletar(!firmaActiva ? "firma" : "registro")}
                        className="h-8 shrink-0 rounded-full bg-[#007AFF] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#0062CC]"
                    >
                        Completar
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default function Profesionales() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const { actualizarCantidadProfesionales } = useTour();

    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [enEdicion, setEnEdicion] = useState(null);
    // Confirmacion en la propia tarjeta: evita un dialogo nativo bloqueante.
    const [confirmandoId, setConfirmandoId] = useState(null);
    const [eliminandoId, setEliminandoId] = useState(null);
    const [seccionInicial, setSeccionInicial] = useState(null);

    // Un profesional (usuario con agenda asignada) ve y edita solo su propia
    // tarjeta; la administración de la clínica ve a todo el equipo.
    const sesion = useSesionProfesional();
    const soloPropia = sesion.cargado && Boolean(sesion.idProfesional) && !sesion.esAdministrador && !sesion.esTecnico;

    async function seleccionarTodosProfesionales() {
        actualizarCantidadProfesionales(null);
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors'
            });

            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
            }

            const respuestaBackend = await res.json();

            if (!respuestaBackend) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
            }

            const profesionales = Array.isArray(respuestaBackend) ? respuestaBackend : [];
            // En modo de prueba se superpone lo registrado en el backend simulado.
            setListaProfesionales(MODO_MOCK ? aplicarEstadoMock(profesionales) : profesionales);
            actualizarCantidadProfesionales(profesionales.length);
        } catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        } finally {
            setCargando(false);
        }
    }

    async function eliminarProfesional(id_profesional) {
        if (!id_profesional) {
            return toast.error('Por favor seleccione un profesional para continuar con la eliminacion.');
        }

        setEliminandoId(id_profesional);

        try {
            const res = await fetch(`${API}/profesionales/eliminarProfesional`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_profesional }),
                mode: 'cors'
            });

            if (!res.ok) {
                return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
            }

            const respuestaBackend = await res.json();

            if (respuestaBackend?.message !== true) {
                return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
            }

            toast.success('Profesional eliminado correctamente.');
            setConfirmandoId(null);
            await seleccionarTodosProfesionales();
        } catch (error) {
            return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
        } finally {
            setEliminandoId(null);
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionales();
        return () => actualizarCantidadProfesionales(null);
    }, []);

    // /dashboard/profesionales?completar=firma|registro (aviso de la campana): abre
    // la tarjeta del propio profesional con la sección pendiente desplegada. Se lee
    // de window y no con useSearchParams para no exigir un Suspense en esta página.
    const completarAtendido = useRef(false);
    useEffect(() => {
        if (completarAtendido.current || cargando || !sesion.cargado || !sesion.idProfesional) return;
        const seccion = new URLSearchParams(window.location.search).get("completar");
        if (seccion !== "firma" && seccion !== "registro") return;
        const propio = listaProfesionales.find((p) => sesion.esDueno(p.id_profesional));
        if (!propio) return;
        completarAtendido.current = true;
        window.history.replaceState(null, "", window.location.pathname);
        abrirEdicion(propio, seccion);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargando, sesion, listaProfesionales]);

    const profesionalesFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        const visibles = soloPropia
            ? listaProfesionales.filter((p) => sesion.esDueno(p.id_profesional))
            : listaProfesionales;

        const ordenados = [...visibles].sort((a, b) =>
            String(a.nombreProfesional ?? "").localeCompare(String(b.nombreProfesional ?? ""))
        );

        if (!termino) return ordenados;

        return ordenados.filter((profesional) =>
            [
                profesional.nombreProfesional,
                profesional.descripcionProfesional,
                profesional.correoContacto,
                profesional.numeroTelefono,
                profesional.rutProfesional,
            ]
                .filter(Boolean)
                .some((campo) => String(campo).toLowerCase().includes(termino))
        );
    }, [listaProfesionales, busqueda, soloPropia, sesion]);

    function abrirNuevo() {
        setEnEdicion(null);
        setModalAbierto(true);
    }

    async function seleccionarProfesional(id_profesional) {
        if (!id_profesional) {
            toast.error("Debe seleccionar un profesional");
            return null;
        }

        try {
            const res = await fetch(`${API}/profesionales/seleccionarProfesional`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ id_profesional }),
                mode: "cors",
            });

            if (!res.ok) {
                toast.error("Mala respuesta del servidor, contacte a soporte.");
                return null;
            }

            const respuestaBackend = await res.json();
            return Array.isArray(respuestaBackend) ? respuestaBackend[0] ?? null : null;
        } catch (error) {
            toast.error("Error en el servidor, contacte a soporte de NativeCode.");
            return null;
        }
    }

    async function abrirEdicion(profesional, seccion = null) {
        setSeccionInicial(seccion);
        // Se abre de inmediato con lo que ya tenemos para que no haya espera, y se
        // refresca con lo que responda el backend.
        setEnEdicion(profesional);
        setModalAbierto(true);

        const actualizado = await seleccionarProfesional(profesional.id_profesional);
        if (actualizado) setEnEdicion(actualizado);
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10">

                {/* ── Encabezado ── */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Profesionales
                        </h1>
                        <p className="mt-1 text-[13px] text-slate-500">
                            {cargando
                                ? "Cargando equipo profesional..."
                                : soloPropia
                                ? "Tus datos profesionales, firma electrónica y registro de la Superintendencia"
                                : `${listaProfesionales.length} ${listaProfesionales.length === 1 ? "profesional registrado" : "profesionales registrados"}`}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <TutorialGuiadoProfesionales
                            ariaLabel="Iniciar el tutorial guiado de profesionales"
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            claseIcono="flex size-4 shrink-0 items-center justify-center text-[#6E56CF]"
                        />
                        {!soloPropia && (
                        <button
                            onClick={abrirNuevo}
                            data-tour="profesional-nuevo"
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo Profesional
                        </button>
                        )}
                    </div>
                </div>

                {/* ── Buscador ── */}
                <div className="relative mb-6 max-w-md">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        data-tour="profesional-buscador"
                        placeholder="Buscar por nombre, especialidad, correo o RUT..."
                        aria-label="Buscar profesional"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[13px] text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-900"
                    />
                </div>

                {/* ── Tarjetas ── */}
                {cargando ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-[232px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
                        ))}
                    </div>
                ) : profesionalesFiltrados.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <p className="text-[13px] font-medium text-slate-500">
                            {busqueda
                                ? "Ningún profesional coincide con la búsqueda."
                                : "Aún no hay profesionales registrados."}
                        </p>
                        {!busqueda && (
                            <button
                                onClick={abrirNuevo}
                                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-5 text-[12px] font-bold text-slate-600 transition-all hover:bg-slate-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Registrar el primero
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {profesionalesFiltrados.map((profesional, indice) => {
                            const confirmando = confirmandoId === profesional.id_profesional;
                            const eliminando = eliminandoId === profesional.id_profesional;

                            return (
                                <article
                                    key={profesional.id_profesional}
                                    data-tour={indice === 0 ? "profesional-lista" : undefined}
                                    className="font-system-apple group flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,40,120,0.22)] ring-1 ring-black/[0.05] transition-all duration-300 ease-[cubic-bezier(0.28,0.11,0.32,1)] hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_18px_40px_-16px_rgba(0,64,200,0.32)]"
                                >
                                    <div className="flex items-center gap-3.5 px-5 pt-5">
                                        {/* Foto del profesional o, si no tiene, la silueta de profesional de salud */}
                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(0,122,255,0.45)]">
                                            {profesional.imagenProfesional ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={cfImageUrl(profesional.imagenProfesional, "card")}
                                                    alt={`Foto de ${profesional.nombreProfesional}`}
                                                    className="h-full w-full object-cover object-[50%_20%]"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <SiluetaProfesional className="h-full w-full" etiqueta={profesional.nombreProfesional} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="truncate text-[16px] font-semibold tracking-tight text-[#1D1D1F]">
                                                {profesional.nombreProfesional}
                                            </h2>
                                            <p className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-[#007AFF]">
                                                {profesional.descripcionProfesional || "Sin especialidad registrada"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mx-4 mt-4 divide-y divide-black/[0.06] overflow-hidden rounded-2xl bg-[#F5F5F7]">
                                        <FilaDato
                                            icono={
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            }
                                        >
                                            {profesional.correoContacto}
                                        </FilaDato>
                                        <FilaDato
                                            icono={
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                                                </svg>
                                            }
                                        >
                                            {profesional.numeroTelefono}
                                        </FilaDato>
                                        <FilaDato
                                            icono={
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0h4" />
                                                </svg>
                                            }
                                        >
                                            {formatRut(profesional.rutProfesional) || profesional.rutProfesional}
                                        </FilaDato>
                                    </div>

                                    <EstadoDocumentosFirmados
                                        profesional={profesional}
                                        esPropio={sesion.esDueno(profesional.id_profesional)}
                                        onCompletar={(seccion) => abrirEdicion(profesional, seccion)}
                                    />

                                    <div className="mt-auto px-5 pb-5 pt-4">
                                        <div>
                                            {confirmando ? (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[13px] font-medium text-[#636366]">¿Eliminar?</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setConfirmandoId(null)}
                                                            disabled={eliminando}
                                                            className="h-9 rounded-full px-4 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 disabled:opacity-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarProfesional(profesional.id_profesional)}
                                                            disabled={eliminando}
                                                            className="h-9 rounded-full bg-[#FF3B30] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#E0352B] disabled:opacity-60"
                                                        >
                                                            {eliminando ? "Eliminando..." : "Sí, eliminar"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    <button
                                                        onClick={() => abrirEdicion(profesional)}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#007AFF]/10 px-4 text-[13px] font-semibold text-[#007AFF] transition-colors hover:bg-[#007AFF]/15"
                                                        aria-label={`Editar ${profesional.nombreProfesional}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    {!soloPropia && (
                                                    <button
                                                        onClick={() => setConfirmandoId(profesional.id_profesional)}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FF3B30]/10 px-4 text-[13px] font-semibold text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/15"
                                                        aria-label={`Eliminar ${profesional.nombreProfesional}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            <ProfesionalModal
                abierto={modalAbierto}
                profesional={enEdicion}
                seccionInicial={seccionInicial}
                onCerrar={() => { setModalAbierto(false); setEnEdicion(null); setSeccionInicial(null); }}
                onGuardado={seleccionarTodosProfesionales}
            />
        </div>
    );
}
