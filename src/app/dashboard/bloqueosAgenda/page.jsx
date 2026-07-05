'use client'
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { SelectDinamic } from "@/Componentes/SelectDinamic";
import { InputTextDinamic } from "@/Componentes/InputTextDinamic";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/TimePicker";
import { es } from "date-fns/locale";
import { format, eachDayOfInterval } from "date-fns";
import ToasterClient from "@/Componentes/ToasterClient";
import { InfoButton } from "@/Componentes/InfoButton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


export default function BloqueosAgendas() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [id_profesional, setId_profesional] = useState("");
    const [diasSeleccionados, setDiasSeleccionados] = useState([]);
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFinalizacion, setHoraFinalizacion] = useState("");
    const [motivo, setMotivo] = useState("");
    const [listaBloqueos, setListaBloqueos] = useState([]);
    const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false);
    const [bloqueoSeleccionado, setBloqueoSeleccionado] = useState(null);
    const [cargandoInsercion, setCargandoInsercion] = useState(false);
    const [modalEliminarTodos, setModalEliminarTodos] = useState(false); // false | "paso1" | "paso2"
    const [cargandoEliminarTodos, setCargandoEliminarTodos] = useState(false);

    // Modo de selección
    const [modoSeleccion, setModoSeleccion] = useState("especifico"); // "especifico" | "rango"

    // Estado modo rango
    const DIAS_SEMANA = [
        { label: "L", value: 1 },
        { label: "M", value: 2 },
        { label: "X", value: 3 },
        { label: "J", value: 4 },
        { label: "V", value: 5 },
        { label: "S", value: 6 },
        { label: "D", value: 0 },
    ];
    const [rangoDesde, setRangoDesde] = useState("");
    const [rangoHasta, setRangoHasta] = useState("");
    const [diasSemanaSeleccionados, setDiasSemanaSeleccionados] = useState([]);

    function toggleDiaSemana(value) {
        setDiasSemanaSeleccionados(prev =>
            prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
        );
    }

    function generarDiasDesdeRango() {
        if (!rangoDesde || !rangoHasta) return toast.error("Debes definir una fecha de inicio y término.");
        if (diasSemanaSeleccionados.length === 0) return toast.error("Selecciona al menos un día de la semana.");
        if (rangoHasta < rangoDesde) return toast.error("La fecha de término debe ser posterior al inicio.");
        if (rangoHasta > formatearFechaLocal(fechaLimite)) return toast.error(`Solo puedes bloquear hasta 3 meses adelante (${formatearFechaTabla(formatearFechaLocal(fechaLimite))}).`);

        // Usar T00:00:00 para crear fechas en hora local (no UTC), evitando desfase de día
        const inicio = new Date(rangoDesde + "T00:00:00");
        const fin = new Date(rangoHasta + "T00:00:00");
        const hoyLocal = new Date();
        hoyLocal.setHours(0, 0, 0, 0);

        const todosDias = eachDayOfInterval({ start: inicio, end: fin });
        const diasFiltrados = todosDias.filter(d =>
            diasSemanaSeleccionados.includes(d.getDay()) && d >= hoyLocal
        );

        if (diasFiltrados.length === 0) {
            return toast.error("No hay días disponibles en ese rango para los días seleccionados.");
        }

        // Fusionar con los ya seleccionados sin duplicar
        setDiasSeleccionados(prev => {
            const existentes = new Set(prev.map(d => d.toDateString()));
            const nuevos = diasFiltrados.filter(d => !existentes.has(d.toDateString()));
            return [...prev, ...nuevos];
        });

        toast.success(`Se agregaron ${diasFiltrados.length} día(s) al calendario.`);
    }

    function formatearFechaTabla(fechaISO) {
        if (!fechaISO) return "";
        const partes = fechaISO.slice(0, 10).split("-");
        if (partes.length !== 3) return fechaISO;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatearFechaLocal(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function abrirModalBloqueo(bloqueo) {
        setBloqueoSeleccionado(bloqueo);
        setModalBloqueoAbierto(true);
    }

    function cerrarModalBloqueo() {
        setModalBloqueoAbierto(false);
        setBloqueoSeleccionado(null);
    }

    async function buscarProfesionales() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors'
            });
            if (!res.ok) return toast.error('Error al cargar los profesionales.');
            const data = await res.json();
            if (data) setListaProfesionales(data);
        } catch {
            toast.error('Error al cargar los profesionales.');
        }
    }

    useEffect(() => { buscarProfesionales(); }, []);

    async function verTodosLosBloqueos() {
        try {
            const res = await fetch(`${API}/bloqueoAgenda/seleccionarTodos`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors'
            });
            if (!res.ok) return toast.error('Error al cargar los bloqueos.');
            const data = await res.json();
            setListaBloqueos(data);
        } catch {
            toast.error('No fue posible cargar los bloqueos.');
        }
    }

    // Recarga la lista respetando el filtro de profesional activo
    async function recargarBloqueos(profId) {
        const idActual = profId !== undefined ? profId : id_profesional;
        if (idActual) {
            await filtrarPorProfesional(idActual);
        } else {
            await verTodosLosBloqueos();
        }
    }

    useEffect(() => { verTodosLosBloqueos(); }, []);

    useEffect(() => {
        if (id_profesional) {
            filtrarPorProfesional(id_profesional);
        } else {
            verTodosLosBloqueos();
        }
    }, [id_profesional]);

    async function filtrarPorProfesional(id) {
        try {
            const res = await fetch(`${API}/bloqueoAgenda/seleccionarBloqueosPorProfesional`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_profesional: id }),
                mode: 'cors'
            });
            if (!res.ok) return toast.error("Error al cargar los bloqueos del profesional.");
            const data = await res.json();
            setListaBloqueos(data);
        } catch {
            toast.error("No fue posible cargar los bloqueos del profesional.");
        }
    }

    async function insertarBloqueosMultiples() {
        if (!id_profesional) {
            return toast.error("Debes seleccionar un profesional.");
        }

        if (!horaInicio || !horaFinalizacion || !motivo || diasSeleccionados.length === 0) {
            return toast.error("Completa todos los campos y selecciona al menos un día.");
        }

        if (horaFinalizacion <= horaInicio) {
            return toast.error("La hora de término debe ser posterior a la hora de inicio.");
        }

        const diasFueraDeRango = diasSeleccionados.filter(d => d > fechaLimite);
        if (diasFueraDeRango.length > 0) {
            return toast.error(`${diasFueraDeRango.length} día(s) superan el límite de 3 meses. Máximo hasta ${formatearFechaTabla(formatearFechaLocal(fechaLimite))}.`);
        }

        setCargandoInsercion(true);
        let exitosos = 0;
        let conflictoReserva = 0;
        let conflictoBloqueo = 0;

        // Ordenar los días seleccionados
        const diasOrdenados = [...diasSeleccionados].sort((a, b) => a - b);

        for (const dia of diasOrdenados) {
            const fecha = formatearFechaLocal(dia);
            const horaInicioFull = `${horaInicio}:00`;
            const horaFinalizacionFull = `${horaFinalizacion}:00`;

            try {
                const res = await fetch(`${API}/bloqueoAgenda/InsertarBloqueo`, {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_profesional,
                        fechaInicio: fecha,
                        horaInicio: horaInicioFull,
                        fechaFinalizacion: fecha,
                        horaFinalizacion: horaFinalizacionFull,
                        motivo
                    }),
                    mode: 'cors'
                });

                const respuesta = await res.json();
                if (respuesta.message === true) {
                    exitosos++;
                } else if (respuesta.message === "reservaExistente") {
                    conflictoReserva++;
                } else {
                    conflictoBloqueo++;
                }
            } catch {
                conflictoBloqueo++;
            }
        }

        setCargandoInsercion(false);
        await verTodosLosBloqueos();

        // Limpiar formulario
        setDiasSeleccionados([]);
        setHoraInicio("");
        setHoraFinalizacion("");
        setMotivo("");
        setId_profesional("");

        // Mostrar resultado
        if (exitosos > 0 && conflictoReserva === 0 && conflictoBloqueo === 0) {
            toast.success(`Se bloquearon ${exitosos} día(s) correctamente.`);
        } else if (exitosos > 0) {
            toast.success(`${exitosos} día(s) bloqueados. ${conflictoReserva + conflictoBloqueo} no se bloquearon por citas o bloqueos previos.`);
        } else {
            toast.error("Ya existe una cita agendada o un bloqueo previo en ese horario.");
        }
    }

    async function eliminarBloqueo(id_bloqueo) {
        try {
            if (!id_bloqueo) return toast.error('Debe seleccionar el bloqueo a eliminar.');
            const res = await fetch(`${API}/bloqueoAgenda/eliminarBloqueo`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_bloqueo }),
                mode: 'cors'
            });
            if (!res.ok) return toast.error("No se pudo eliminar el bloqueo.");
            const respuesta = await res.json();
            if (respuesta.message === true) {
                cerrarModalBloqueo();
                await recargarBloqueos();
                toast.success('Bloqueo eliminado correctamente.');
            } else {
                toast.error("No se pudo eliminar el bloqueo.");
            }
        } catch {
            toast.error("No se pudo eliminar el bloqueo. Contacte soporte.");
        }
    }

    async function eliminarTodosLosBloqueos() {
        if (listaBloqueos.length === 0) return toast.error("No hay bloqueos para eliminar.");
        setCargandoEliminarTodos(true);
        let eliminados = 0;
        let errores = 0;

        for (const bloqueo of listaBloqueos) {
            try {
                const res = await fetch(`${API}/bloqueoAgenda/eliminarBloqueo`, {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_bloqueo: bloqueo.id_bloqueo }),
                    mode: 'cors'
                });
                const respuesta = await res.json();
                if (respuesta.message === true) eliminados++;
                else errores++;
            } catch {
                errores++;
            }
        }

        setCargandoEliminarTodos(false);
        setModalEliminarTodos(false);
        await recargarBloqueos();

        if (errores === 0) {
            toast.success(`Se eliminaron ${eliminados} bloqueo(s) correctamente.`);
        } else {
            toast.success(`${eliminados} eliminado(s). ${errores} no se pudieron eliminar.`);
        }
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Límite: máximo 3 meses hacia adelante (ventana deslizante)
    const fechaLimite = new Date(hoy);
    fechaLimite.setMonth(fechaLimite.getMonth() + 3);

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient />

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuración de Disponibilidad</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Bloqueo de Agenda</h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                            Selecciona uno o varios días del calendario y define el rango horario. Cada día se bloquea de forma independiente para que puedas liberarlos por separado.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <InfoButton informacion={"Selecciona los días que deseas bloquear haciendo clic en el calendario. Puedes elegir días no consecutivos (por ejemplo, solo los miércoles del mes). Luego define la hora de inicio y término que aplicará a todos los días seleccionados."} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── Columna Izquierda: Formulario ── */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">Nuevo Bloqueo</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Selecciona días y define el horario</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">

                                {/* Profesional */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Profesional</label>
                                    <SelectDinamic
                                        value={id_profesional}
                                        onChange={(e) => setId_profesional(e.target.value)}
                                        options={listaProfesionales.map(p => ({
                                            value: p.id_profesional,
                                            label: p.nombreProfesional
                                        }))}
                                        placeholder="Selecciona un profesional"
                                    />
                                </div>

                                {/* Selector de modo */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Días a bloquear</label>
                                    <div className="flex rounded-xl border border-slate-200 bg-slate-100/60 p-1 gap-1">
                                        <button
                                            onClick={() => setModoSeleccion("especifico")}
                                            className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all ${modoSeleccion === "especifico" ? "bg-white text-[#6E56CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            Días específicos
                                        </button>
                                        <button
                                            onClick={() => setModoSeleccion("rango")}
                                            className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all ${modoSeleccion === "rango" ? "bg-white text-[#6E56CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            Rango de fechas
                                        </button>
                                    </div>
                                </div>

                                {/* Modo: Rango de fechas */}
                                {modoSeleccion === "rango" && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Desde</label>
                                                <input
                                                    type="date"
                                                    value={rangoDesde}
                                                    min={formatearFechaLocal(hoy)}
                                                    max={formatearFechaLocal(fechaLimite)}
                                                    onChange={e => setRangoDesde(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6E56CF]/30 focus:border-[#6E56CF] transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Hasta</label>
                                                <input
                                                    type="date"
                                                    value={rangoHasta}
                                                    min={rangoDesde || formatearFechaLocal(hoy)}
                                                    max={formatearFechaLocal(fechaLimite)}
                                                    onChange={e => setRangoHasta(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6E56CF]/30 focus:border-[#6E56CF] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Días de la semana</label>
                                            <div className="flex gap-1.5">
                                                {DIAS_SEMANA.map(dia => (
                                                    <button
                                                        key={dia.value}
                                                        onClick={() => toggleDiaSemana(dia.value)}
                                                        className={`flex-1 py-2 text-[12px] font-bold rounded-xl transition-all ${
                                                            diasSemanaSeleccionados.includes(dia.value)
                                                                ? "bg-[#6E56CF] text-white shadow-sm"
                                                                : "bg-white border border-slate-200 text-slate-500 hover:border-[#6E56CF] hover:text-[#6E56CF]"
                                                        }`}
                                                    >
                                                        {dia.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={generarDiasDesdeRango}
                                            className="w-full py-2.5 text-[13px] font-bold rounded-xl border-2 border-dashed border-[#6E56CF] text-[#6E56CF] hover:bg-violet-50 transition-all"
                                        >
                                            Generar días →
                                        </button>
                                    </div>
                                )}

                                {/* Modo: Días específicos — Calendario */}
                                {modoSeleccion === "especifico" && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 flex justify-center py-2">
                                    <Calendar
                                        mode="multiple"
                                        selected={diasSeleccionados}
                                        onSelect={(days) => setDiasSeleccionados(days ?? [])}
                                        locale={es}
                                        disabled={[{ before: hoy }, { after: fechaLimite }]}
                                        className="rounded-xl"
                                    />
                                </div>
                                )}

                                {/* Chips + limpiar (siempre visibles) */}
                                <div className="flex items-center justify-between ml-1 -mb-1">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {diasSeleccionados.length > 0 ? `${diasSeleccionados.length} día(s) seleccionado(s)` : ""}
                                    </span>
                                    {diasSeleccionados.length > 0 && (
                                        <button
                                            onClick={() => setDiasSeleccionados([])}
                                            className="text-[10px] font-semibold text-rose-400 hover:text-rose-600 transition-colors"
                                        >
                                            Limpiar todo
                                        </button>
                                    )}
                                </div>

                                    {/* Chips de días seleccionados */}
                                    {diasSeleccionados.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {[...diasSeleccionados]
                                                .sort((a, b) => a - b)
                                                .map((dia) => (
                                                    <span
                                                        key={dia.toISOString()}
                                                        className="inline-flex items-center gap-1 bg-violet-100 text-[#6E56CF] text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                                    >
                                                        {format(dia, "EEE d MMM", { locale: es })}
                                                        <button
                                                            onClick={() => setDiasSeleccionados(prev => prev.filter(d => d.toISOString() !== dia.toISOString()))}
                                                            className="hover:text-rose-500 transition-colors ml-0.5"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                        </div>
                                    )}

                                {/* Aviso límite de 3 meses */}
                                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-3.5">
                                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-300/60 flex items-center justify-center">
                                        <span className="text-[9px] font-black text-slate-500 leading-none select-none">i</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Límite de bloqueo:{" "}
                                        <span className="font-semibold text-slate-600">{formatearFechaTabla(formatearFechaLocal(fechaLimite))}</span>
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        La ventana de 3 meses avanza automáticamente.
                                    </p>
                                </div>

                                {/* Rango horario */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Rango horario</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-400 font-medium ml-1">Desde</label>
                                            <TimePicker
                                                value={horaInicio}
                                                onChange={setHoraInicio}
                                                placeholder="00:00"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-400 font-medium ml-1">Hasta</label>
                                            <TimePicker
                                                value={horaFinalizacion}
                                                onChange={setHoraFinalizacion}
                                                placeholder="00:00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Motivo */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Motivo del bloqueo</label>
                                    <InputTextDinamic
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        placeholder="Ej: Vacaciones, Congreso..."
                                    />
                                </div>

                                {/* Resumen antes de guardar */}
                                {diasSeleccionados.length > 0 && horaInicio && horaFinalizacion && (
                                    <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
                                        <p className="text-[12px] font-semibold text-[#6E56CF]">
                                            Se crearán <span className="text-base">{diasSeleccionados.length}</span> bloqueo(s) independiente(s)
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Horario: {horaInicio} — {horaFinalizacion} · Cada día se puede eliminar por separado
                                        </p>
                                    </div>
                                )}

                                <div className="pt-1">
                                    <button
                                        onClick={insertarBloqueosMultiples}
                                        disabled={cargandoInsercion}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#6E56CF] text-white text-sm font-bold rounded-2xl hover:bg-[#5b45bc] transition-all duration-200 shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {cargandoInsercion ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Bloqueando {diasSeleccionados.length} día(s)...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Ingresar {diasSeleccionados.length > 0 ? `${diasSeleccionados.length} ` : ""}Bloqueo(s)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Columna Derecha: Listado ── */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Bloqueos Activos</h2>
                                        <p className="text-[11px] text-slate-400 font-medium">Cada fila es un día independiente</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {id_profesional && listaBloqueos.length > 0 && (
                                        <button
                                            onClick={() => setModalEliminarTodos("paso1")}
                                            className="text-[11px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                        >
                                            Eliminar todos
                                        </button>
                                    )}
                                    <button
                                        onClick={verTodosLosBloqueos}
                                        className="text-[11px] font-bold text-[#6E56CF] uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
                                    >
                                        Refrescar
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table className="w-full table-fixed">
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 w-[28%]">Profesional</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 w-[20%]">Motivo</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 w-[20%]">Día</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 w-[24%]">Horario</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 w-[8%] text-center">Ver</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {listaBloqueos.length > 0 ? (
                                            listaBloqueos.map((bloqueo) => (
                                                <TableRow
                                                    key={bloqueo.id_bloqueo}
                                                    className="border-slate-50 hover:bg-violet-50/30 transition-colors cursor-pointer"
                                                    onClick={() => abrirModalBloqueo(bloqueo)}
                                                >
                                                    <TableCell className="py-3 pr-2">
                                                        <span className="text-[12px] font-bold text-slate-700 truncate block">{bloqueo.nombreProfesional}</span>
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-2">
                                                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg truncate block max-w-full">{bloqueo.motivo}</span>
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-2">
                                                        <span className="text-[12px] font-semibold text-slate-700 block">{formatearFechaTabla(bloqueo.fechaInicio)}</span>
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-2">
                                                        <span className="text-[11px] font-semibold text-slate-600 block">
                                                            {(bloqueo.horaInicio ?? "").slice(0, 5)} — {(bloqueo.horaFinalizacion ?? "").slice(0, 5)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); abrirModalBloqueo(bloqueo); }}
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-[#6E56CF] hover:bg-violet-50 transition-all active:scale-95"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-400">
                                                            {id_profesional
                                                                ? "No hay bloqueos registrados"
                                                                : "Selecciona un profesional para ver sus bloqueos"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal eliminar todos — Paso 1 */}
            {modalEliminarTodos === "paso1" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModalEliminarTodos(false)} />
                    <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Eliminar todos los bloqueos</h3>
                                <p className="text-[11px] text-slate-400 font-medium">{listaBloqueos.length} bloqueo(s) · {listaProfesionales.find(p => String(p.id_profesional) === String(id_profesional))?.nombreProfesional}</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                                ¿Deseas eliminar <span className="font-bold text-slate-800">todos los bloqueos</span> de{" "}
                                <span className="font-bold text-slate-800">{listaProfesionales.find(p => String(p.id_profesional) === String(id_profesional))?.nombreProfesional}</span>?
                                Los demás profesionales no serán afectados.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <button onClick={() => setModalEliminarTodos(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                                Cancelar
                            </button>
                            <button onClick={() => setModalEliminarTodos("paso2")} className="rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition-all active:scale-[0.98]">
                                Sí, continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal eliminar todos — Paso 2 */}
            {modalEliminarTodos === "paso2" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalEliminarTodos(false)} />
                    <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-rose-200 bg-white shadow-sm">
                        <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/50 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-rose-700">¿Estás completamente seguro?</h3>
                                <p className="text-[11px] text-rose-400 font-medium">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                                Se eliminarán <span className="font-bold text-rose-600">{listaBloqueos.length} bloqueo(s)</span> de forma permanente. Los horarios quedarán disponibles para nuevas reservas.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 border-t border-rose-100 bg-rose-50/30 px-6 py-4">
                            <button onClick={() => setModalEliminarTodos(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                                Cancelar
                            </button>
                            <button
                                onClick={eliminarTodosLosBloqueos}
                                disabled={cargandoEliminarTodos}
                                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-2"
                            >
                                {cargandoEliminarTodos ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Eliminando...
                                    </>
                                ) : "Sí, eliminar todo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal detalle bloqueo */}
            {modalBloqueoAbierto && bloqueoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={cerrarModalBloqueo} />
                    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-[#6E56CF]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Detalle del Bloqueo</h3>
                                <p className="text-[11px] text-slate-400 font-medium">Solo se eliminará este día</p>
                            </div>
                        </div>

                        <div className="space-y-4 p-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Profesional</label>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] font-semibold text-slate-700">
                                    {bloqueoSeleccionado.nombreProfesional}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] text-slate-700">
                                    {bloqueoSeleccionado.motivo}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Día</label>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] font-semibold text-slate-800">
                                        {formatearFechaTabla(bloqueoSeleccionado.fechaInicio)}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horario</label>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] font-semibold text-slate-800">
                                        {(bloqueoSeleccionado.horaInicio ?? "").slice(0, 5)} — {(bloqueoSeleccionado.horaFinalizacion ?? "").slice(0, 5)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <button
                                onClick={cerrarModalBloqueo}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => eliminarBloqueo(bloqueoSeleccionado.id_bloqueo)}
                                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.98]"
                            >
                                Eliminar este día
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
