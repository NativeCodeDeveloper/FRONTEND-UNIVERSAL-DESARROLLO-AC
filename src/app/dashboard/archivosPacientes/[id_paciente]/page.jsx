"use client"
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import { formatRut } from "@/lib/designTokens";

function formatearFechaCorta(fecha) {
    if (!fecha) return "-";
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getBadgeColor(tipo) {
    const map = {
        PDF: "bg-red-50 text-red-600 border-red-100",
        Imagen: "bg-blue-50 text-blue-600 border-blue-100",
        Word: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };
    return map[tipo] || "bg-slate-50 text-slate-600 border-slate-100";
}

const FILE_ICONS = {
    PDF: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    Imagen: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    default: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
};

function getFileIcon(tipo) {
    return FILE_ICONS[tipo] || FILE_ICONS.default;
}

// ── Visor de Imagen Profesional ────────────────────────────
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.25;

function ImageViewer({ src, nombre, onClose }) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [inverted, setInverted] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const panStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        setZoom((prev) => clampZoom(prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    function handlePointerDown(e) {
        e.preventDefault();
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        panStart.current = { ...pan };
        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e) {
        if (!dragging) return;
        setPan({
            x: panStart.current.x + (e.clientX - dragStart.current.x),
            y: panStart.current.y + (e.clientY - dragStart.current.y),
        });
    }

    function handlePointerUp() {
        setDragging(false);
    }

    function resetView() {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }

    function fitToScreen() {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }

    const zoomPct = Math.round(zoom * 100);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f]">
            <div className="flex items-center justify-between px-6 py-3 bg-[#111118] border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#6E56CF]/20 text-[#a78bfa] flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-[13px] font-semibold text-white truncate">{nombre}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors" title="Alejar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                    </button>
                    <div className="h-8 px-3 rounded-lg bg-white/5 flex items-center justify-center min-w-[64px]">
                        <span className="text-[11px] font-bold text-white/80 font-mono">{zoomPct}%</span>
                    </div>
                    <button onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors" title="Acercar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button onClick={fitToScreen} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors" title="Ajustar a pantalla">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    </button>
                    <button onClick={resetView} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors" title="Resetear vista">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button onClick={() => setInverted((v) => !v)} className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-[11px] font-bold transition-colors ${inverted ? "bg-[#6E56CF] text-white" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"}`} title="Invertir colores (negativo)">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        INV
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button onClick={onClose} className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors" title="Cerrar visor">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative select-none"
                style={{ cursor: dragging ? "grabbing" : "grab" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragging ? "none" : "transform 0.15s ease-out" }}
                >
                    <img
                        src={src}
                        alt={nombre}
                        className="max-w-none pointer-events-none"
                        style={{ filter: inverted ? "invert(1)" : "none" }}
                        draggable={false}
                    />
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="h-7 px-3 rounded-lg bg-black/50 backdrop-blur-sm flex items-center">
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Scroll = Zoom &middot; Drag = Mover</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Componente Principal ───────────────────────────────────
export default function ArchivosPaciente() {
    const { id_paciente } = useParams();
    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL;
    const fileInputRef = useRef(null);

    const [paciente, setPaciente] = useState(null);
    const [archivos, setArchivos] = useState([]);
    const [visorAbierto, setVisorAbierto] = useState(null);
    const [confirmarEliminar, setConfirmarEliminar] = useState(null);
    const [subiendo, setSubiendo] = useState(false);

    // ── Cargar datos al montar ──
    useEffect(() => {
        if (!id_paciente) return;
        cargarPaciente();
        cargarArchivos();
    }, [id_paciente]);

    async function cargarPaciente() {
        try {
            const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_paciente }),
            });
            if (!res.ok) return;
            const data = await res.json();
            const p = Array.isArray(data) ? data[0] : data;
            setPaciente(p);
        } catch (err) {
            console.error(err);
        }
    }

    async function cargarArchivos() {
        try {
            const res = await fetch(`${API}/archivoPaciente/listar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_paciente }),
            });
            if (!res.ok) return;
            const data = await res.json();
            setArchivos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    }

    // ── Subir archivo ──
    function abrirSelectorArchivo() {
        fileInputRef.current?.click();
    }

    async function handleFileSeleccionado(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setSubiendo(true);
        try {
            const formData = new FormData();
            formData.append("archivo", file);
            formData.append("id_paciente", id_paciente);
            formData.append("profesional", "Sin asignar");
            formData.append("nombre_documento", file.name);

            const res = await fetch(`${API}/archivoPaciente/subir`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.ok) {
                toast.success("Archivo subido correctamente");
                await cargarArchivos();
            } else {
                toast.error("No se pudo subir el archivo");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al subir el archivo");
        } finally {
            setSubiendo(false);
            e.target.value = "";
        }
    }

    // ── Eliminar ──
    function handleEliminar(id) {
        setConfirmarEliminar(id);
    }

    async function confirmarEliminacion() {
        try {
            const res = await fetch(`${API}/archivoPaciente/eliminar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_archivo: confirmarEliminar }),
            });
            const data = await res.json();

            if (data.message === true) {
                setArchivos((prev) => prev.filter((a) => a.id_archivo !== confirmarEliminar));
                toast.success("Documento eliminado correctamente");
            } else {
                toast.error("No se pudo eliminar el documento");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al eliminar el documento");
        }
        setConfirmarEliminar(null);
    }

    // ── Descargar ──
    async function handleDescargar(archivo) {
        try {
            const res = await fetch(`${API}/archivoPaciente/descargar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_archivo: archivo.id_archivo }),
            });
            const data = await res.json();

            if (data.ok && data.url) {
                const link = document.createElement("a");
                link.href = data.url;
                link.download = archivo.nombre_documento;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast.error("No se pudo generar la descarga");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al descargar el archivo");
        }
    }

    // ── Visualizar ──
    async function handleVisualizar(archivo) {
        try {
            const res = await fetch(`${API}/archivoPaciente/descargar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_archivo: archivo.id_archivo }),
            });
            const data = await res.json();

            if (data.ok && data.url) {
                setVisorAbierto({ ...archivo, url: data.url });
            } else {
                toast.error("No se pudo cargar la vista previa");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar la vista previa");
        }
    }

    function volverAFicha() {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    function volverAListaTrabajo() {
        router.push("/dashboard");
    }

    // ── Visor fullscreen ──
    if (visorAbierto) {
        return (
            <>
                <ToasterClient />
                <ImageViewer
                    src={visorAbierto.url}
                    nombre={visorAbierto.nombre_documento}
                    onClose={() => setVisorAbierto(null)}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient />

            {/* Input oculto para subir archivos */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSeleccionado}
            />

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header Principal ── */}
                <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Documentos del Paciente
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Repositorio centralizado de archivos clínicos, exámenes e informes asociados al paciente.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="h-14 px-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Documentos</span>
                            <span className="text-sm font-bold text-slate-900 mt-1 leading-none">{archivos.length} Archivos</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={volverAFicha}
                                className="h-14 px-5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                                title="Volver a ficha"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <button
                                onClick={volverAListaTrabajo}
                                className="h-14 px-6 rounded-2xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2"
                            >
                                Reservaciones
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tarjeta Información del Paciente ── */}
                {paciente && (
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-[20px] bg-[#6E56CF] text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-100">
                                {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">{paciente.nombre} {paciente.apellido}</h2>
                                <p className="text-[12px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">ID Paciente #{id_paciente}</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-6">
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">RUT</span>
                                    <span className="text-[13px] font-bold text-slate-900 font-mono">{formatRut(paciente.rut) || "-"}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Teléfono</span>
                                    <span className="text-[13px] font-semibold text-slate-700">{paciente.telefono || "-"}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correo</span>
                                    <span className="text-[13px] font-semibold text-slate-700">{paciente.correo || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tabla de Documentos ── */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Archivos Clínicos</h3>
                        <button
                            onClick={abrirSelectorArchivo}
                            disabled={subiendo}
                            className="h-10 px-5 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {subiendo ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Subir Archivo
                                </>
                            )}
                        </button>
                    </div>

                    {archivos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Subida</th>
                                        <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[120px]">Tipo</th>
                                        <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Documento</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[80px]">Descargar</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[80px]">Eliminar</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[80px]">Visualizar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archivos.map((archivo, idx) => (
                                        <tr
                                            key={archivo.id_archivo}
                                            className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}`}
                                        >
                                            <td className="px-8 py-4">
                                                <span className="text-[13px] font-semibold text-slate-700">{formatearFechaCorta(archivo.fecha_subida)}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center justify-center gap-1.5 w-[88px] py-1.5 rounded-lg border text-[11px] font-bold ${getBadgeColor(archivo.tipo_archivo)}`}>
                                                    {getFileIcon(archivo.tipo_archivo)}
                                                    {archivo.tipo_archivo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[13px] font-medium text-slate-900">{archivo.nombre_documento}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDescargar(archivo)}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-all hover:shadow-sm"
                                                        title="Descargar archivo"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleEliminar(archivo.id_archivo)}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all hover:shadow-sm"
                                                        title="Eliminar archivo"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleVisualizar(archivo)}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-violet-50 text-[#6E56CF] hover:bg-violet-100 border border-violet-100 transition-all hover:shadow-sm"
                                                        title="Visualizar archivo"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">No hay documentos registrados para este paciente</p>
                            <p className="text-slate-300 text-[12px] mt-1">Suba un archivo para comenzar el repositorio documental</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal Confirmar Eliminación ── */}
            {confirmarEliminar !== null && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmarEliminar(null)}>
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar documento</h3>
                            <p className="text-[13px] text-slate-500 leading-relaxed">
                                ¿Está seguro de que desea eliminar este documento? Una vez eliminado <span className="font-semibold text-slate-700">no podrá ser recuperado</span>.
                            </p>
                        </div>
                        <div className="px-8 pb-8 flex gap-3">
                            <button
                                onClick={() => setConfirmarEliminar(null)}
                                className="flex-1 h-11 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminacion}
                                className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
