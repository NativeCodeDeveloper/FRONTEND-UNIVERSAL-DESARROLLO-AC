'use client'

import React, { useEffect, useMemo, useState } from 'react';
import ToasterClient from "@/Componentes/ToasterClient";
import toast from 'react-hot-toast';
import ProfesionalModal from "@/Componentes/ProfesionalModal";
import { formatRut } from "@/lib/designTokens";

// Paleta de acento por tarjeta: se elige de forma estable a partir del nombre,
// asi un mismo profesional conserva siempre su color.
const ACENTOS = [
    "bg-slate-900 text-white",
    "bg-[#EDE9FE] text-[#6E56CF]",
    "bg-teal-50 text-teal-700",
    "bg-amber-50 text-amber-700",
    "bg-sky-50 text-sky-700",
    "bg-rose-50 text-rose-700",
];

function acentoDe(nombre = "") {
    let suma = 0;
    for (const caracter of String(nombre)) suma += caracter.codePointAt(0);
    return ACENTOS[suma % ACENTOS.length];
}

function inicialesDe(nombre = "") {
    const palabras = String(nombre)
        .replace(/\b(dr|dra|don|sr|sra)\.?\b/gi, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (palabras.length === 0) return "–";

    return (palabras[0][0] + (palabras[1]?.[0] ?? "")).toUpperCase();
}

function FilaDato({ icono, children }) {
    return (
        <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
            <span className="shrink-0 text-slate-400">{icono}</span>
            <span className="min-w-0 truncate">{children || "—"}</span>
        </div>
    );
}

export default function Profesionales() {
    const API = process.env.NEXT_PUBLIC_API_URL;

    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [enEdicion, setEnEdicion] = useState(null);
    // Confirmacion en la propia tarjeta: evita un dialogo nativo bloqueante.
    const [confirmandoId, setConfirmandoId] = useState(null);
    const [eliminandoId, setEliminandoId] = useState(null);

    async function seleccionarTodosProfesionales() {
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

            setListaProfesionales(Array.isArray(respuestaBackend) ? respuestaBackend : []);
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
    }, []);

    const profesionalesFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        const ordenados = [...listaProfesionales].sort((a, b) =>
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
    }, [listaProfesionales, busqueda]);

    function abrirNuevo() {
        setEnEdicion(null);
        setModalAbierto(true);
    }

    function abrirEdicion(profesional) {
        setEnEdicion(profesional);
        setModalAbierto(true);
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
                                : `${listaProfesionales.length} ${listaProfesionales.length === 1 ? "profesional registrado" : "profesionales registrados"}`}
                        </p>
                    </div>
                    <button
                        onClick={abrirNuevo}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Profesional
                    </button>
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
                        {profesionalesFiltrados.map((profesional) => {
                            const confirmando = confirmandoId === profesional.id_profesional;
                            const eliminando = eliminandoId === profesional.id_profesional;

                            return (
                                <article
                                    key={profesional.id_profesional}
                                    className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3 px-5 pt-5">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${acentoDe(profesional.nombreProfesional)}`}>
                                            {inicialesDe(profesional.nombreProfesional)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="truncate text-[15px] font-bold text-slate-900">
                                                {profesional.nombreProfesional}
                                            </h2>
                                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">
                                                {profesional.descripcionProfesional || "Sin especialidad registrada"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2 px-5">
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

                                    <div className="mt-auto px-5 pb-5 pt-4">
                                        <div className="border-t border-slate-100 pt-4">
                                            {confirmando ? (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[12px] font-medium text-slate-500">¿Eliminar?</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setConfirmandoId(null)}
                                                            disabled={eliminando}
                                                            className="h-10 rounded-xl px-4 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarProfesional(profesional.id_profesional)}
                                                            disabled={eliminando}
                                                            className="h-10 rounded-xl bg-red-600 px-4 text-[12px] font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                                                        >
                                                            {eliminando ? "Eliminando..." : "Sí, eliminar"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    <button
                                                        onClick={() => abrirEdicion(profesional)}
                                                        className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                                        aria-label={`Editar ${profesional.nombreProfesional}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmandoId(profesional.id_profesional)}
                                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100"
                                                        aria-label={`Eliminar ${profesional.nombreProfesional}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
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
                onCerrar={() => { setModalAbierto(false); setEnEdicion(null); }}
                onGuardado={seleccionarTodosProfesionales}
            />
        </div>
    );
}
