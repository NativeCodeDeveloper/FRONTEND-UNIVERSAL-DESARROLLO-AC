"use client"
import {useState, useEffect} from "react";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from "react-hot-toast";
import formatearFecha from "@/FuncionesTranversales/funcionesTranversales";
import {useRouter} from "next/navigation";
import {Calendar28} from "@/Componentes/shadcnCalendarSelector";
import {InfoButton} from "@/Componentes/InfoButton";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {SelectDinamic} from "@/Componentes/SelectDinamic";
import { formatRut, cleanRut } from "@/lib/designTokens";


export default function AgendaCitas() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const [dataLista, setdataLista] = useState([]);
    const [nombrePaciente, setnombrePaciente] = useState("");
    const [rut, setrut] = useState("");
    const [fechaInicio, setfechaInicio] = useState(null);
    const [fechaFinalizacion, setfechaFinalizacion] = useState(null);
    const [estadoReserva, setestadoReserva] = useState("");
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [id_profesional, setId_profesional] = useState("");
    const [actualizandoReservaId, setActualizandoReservaId] = useState(null);



    async function buscarPorProfesional(id_profesional) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarPorProfesional`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_profesional}),
                mode: "cors"
            });

            const respuestaBackend = await res.json();

            if (respuestaBackend.length > 0) {
                setdataLista(respuestaBackend);
                return toast.success("Reservas con el profesional encontradas!")
            }


        } catch (error) {
            console.log(error);
            return toast.error("No ha sido posible buscar, contacte a soporte Tecnico de Medify");
        }
    }

    useEffect(() => {
        buscarPorProfesional(id_profesional)
    },[id_profesional])




    async function seleccionarTodosProfesionalesAgendaLista() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend){
                    setListaProfesionales(respustaBackend);

                }else{
                    return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionalesAgendaLista();
    }, []);


    function verDetalleAgenda(id_reserva) {
        router.push(`/dashboard/AgendaDetalle/${id_reserva}`);
    }

    async function buscarEntreFechas(fechaInicio, fechaFinalizacion) {
        try {
            if (!fechaInicio || !fechaFinalizacion) {
                return toast.error("Debe seleccionar un rango de fechas para filtrar")
            }

            const start = new Date(fechaInicio);
            const end = new Date(fechaFinalizacion);

            if (start > end) {
                return toast.error("La fecha de inicio no puede ser posterior a la fecha de término.");
            }

            const res = await fetch(`${API}/reservaPacientes/buscarEntreFechas`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({fechaInicio, fechaFinalizacion}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("Error al buscar citas. Por favor, intente de nuevo.");
            } else {
                const respuestaBackend = await res.json();

                if (respuestaBackend && Array.isArray(respuestaBackend) && respuestaBackend.length > 0) {
                    setdataLista(respuestaBackend);
                    return toast.success(`Se encontraron ${respuestaBackend.length} citas en el período seleccionado.`);
                } else {
                    setdataLista([]);
                    return toast.success("No se encontraron citas en el período seleccionado.");
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("Error inesperado al buscar citas. Por favor, contacte a soporte técnico.");
        }
    }

    async function buscarPorRut(rut) {
        try {
            const rutLimpio = cleanRut(rut);
            const res = await fetch(`${API}/reservaPacientes/seleccionarRut`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({rut: rutLimpio}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("Debe ingresar datos para filtrar.");
            } else {
                const respuestaBackend = await res.json();

                if (respuestaBackend.length > 0) {
                    setdataLista(respuestaBackend);
                    return toast.success("Similitud de RUT encontrada")
                } else {
                    return toast.error("No se han encontrado similitudes")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("No ha sido posible buscar, contacte a soporte Tecnico de Medify");
        }
    }

    async function buscarPorNombres(nombrePaciente) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarNombre`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({nombrePaciente}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("Debe ingresar datos para filtrar.");
            } else {
                const respuestaBackend = await res.json();

                if (respuestaBackend.length > 0) {
                    setdataLista(respuestaBackend);
                    return toast.success("Similitud de nombre encontrada")
                } else {
                    return toast.error("No se han encontrado similitudes de nombres")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("No ha sido posible buscar, contacte a soporte Tecnico de Medify");
        }
    }

    async function listarTablaCitas() {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            });

            const respuestaBackend = await res.json();
            if (respuestaBackend) {
                setdataLista(respuestaBackend);
            }
        } catch (err) {
            console.log(err);
            return toast.error(err.message);
        }
    }

    useEffect(() => {
        listarTablaCitas();
    }, []);

    async function filtrarEstados(estadoReserva) {
        try {
            if (!estadoReserva) {
                return toast.error("Debe seleccionar un estado de reserva.");
            }

            const res = await fetch(`${API}/reservaPacientes/seleccionarSegunEstado`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({estadoReserva}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error("Debe seleccionar un estado de reserva.");
            } else {
                const dataBackend = await res.json();
                if (dataBackend.length > 0) {
                    setdataLista(dataBackend);
                } else {
                    return toast.error("No se han encontrado similitudes con el estado seleccionado")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error(error.message);
        }
    }

    useEffect(() => {
        if (!estadoReserva) return;
        filtrarEstados(estadoReserva)
    }, [estadoReserva]);

    function normalizarEstadoReserva(estado = "") {
        return String(estado)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function badgeEstado(estado) {
        if (!estado) return '-';
        const lower = normalizarEstadoReserva(estado);
        if (lower === 'asiste') return 'bg-cyan-50/90 text-cyan-800 border-cyan-200';
        if (lower === 'no asiste' || lower === 'no asistio' || lower === 'no asistste') return 'bg-pink-50/90 text-pink-800 border-pink-200';
        if (lower === 'finalizado') return 'bg-orange-50/90 text-orange-800 border-orange-200';
        if (lower === 'confirmada') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (lower === 'anulada') return 'bg-red-50 text-red-600 border-red-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    async function actualizarEstadoReservaRapido(id_reserva, nuevoEstado) {
        try {
            if (!id_reserva || !nuevoEstado) {
                return toast.error("No se pudo identificar la reserva o el nuevo estado.");
            }

            setActualizandoReservaId(id_reserva);

            const res = await fetch(`${API}/reservaPacientes/actualizarEstado`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({estadoReserva: nuevoEstado, id_reserva}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("No se ha podido enviar la informacion para actualizar el estado.");
            }

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                setdataLista((prev) => prev.map((item) => (
                    item.id_reserva === id_reserva
                        ? {...item, estadoReserva: nuevoEstado}
                        : item
                )));
                return toast.success("Se ha actualizado el estado con exito");
            }

            return toast.error("No se ha podido actualizar. Intente más tarde.");
        } catch (error) {
            console.log(error);
            return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
        } finally {
            setActualizandoReservaId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Gestión de Pacientes</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Listado de Reservaciones</h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                            Monitorea y gestiona el estado de todas las citas. Puedes filtrar por profesional, fecha o datos del paciente para realizar confirmaciones rápidas.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <InfoButton informacion={'Visualiza el historial completo de citas. Puedes cambiar el estado de asistencia directamente desde la tabla o ver el detalle completo de la ficha clínica.'}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-8">

                    {/* ── Filtros Avanzados ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filtros de Búsqueda</h2>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                                {/* Búsqueda Directa */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre del Paciente</label>
                                        <div className="flex gap-2">
                                            <ShadcnInput
                                                value={nombrePaciente}
                                                placeholder="Ej: Juan Pérez..."
                                                onChange={(e) => setnombrePaciente(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => buscarPorNombres(nombrePaciente)}
                                                className="h-11 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">RUT del Paciente</label>
                                        <div className="flex gap-2">
                                            <ShadcnInput
                                                value={rut}
                                                placeholder="12.345.678-9"
                                                onChange={(e) => setrut(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => buscarPorRut(rut)}
                                                className="h-11 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Selección de Profesional y Reset */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Profesional Responsable</label>
                                        <SelectDinamic
                                            value={id_profesional}
                                            onChange={(e) => setId_profesional(e.target.value)}
                                            options={listaProfesionales.map(p => ({
                                                value: p.id_profesional,
                                                label: p.nombreProfesional
                                            }))}
                                            placeholder="Todos los profesionales"
                                        />
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            onClick={() => listarTablaCitas()}
                                            className="w-full h-11 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Restablecer Filtros
                                        </button>
                                    </div>
                                </div>

                                {/* Filtro de Fechas */}
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desde</label>
                                            <Calendar28 value={fechaInicio} onChange={setfechaInicio} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hasta</label>
                                            <Calendar28 value={fechaFinalizacion} onChange={setfechaFinalizacion} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => buscarEntreFechas(fechaInicio, fechaFinalizacion)}
                                        className="mt-4 h-11 bg-[#6E56CF] text-white text-sm font-bold rounded-xl hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100"
                                    >
                                        Filtrar por Rango
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Listado de Citas ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Reservaciones</h2>
                                <span className="h-6 px-2.5 rounded-full bg-violet-50 text-[#6E56CF] text-xs font-bold flex items-center justify-center">
                                    {dataLista.length} registros
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Select value={estadoReserva} onValueChange={setestadoReserva}>
                                    <SelectTrigger className="h-10 w-full md:w-[220px] bg-white border border-slate-200 rounded-xl text-sm font-semibold">
                                        <SelectValue placeholder="Filtrar por Estado"/>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        <SelectGroup>
                                            <SelectItem value="reservada">Reservada</SelectItem>
                                            <SelectItem value="anulada">Anulada</SelectItem>
                                            <SelectItem value="confirmada">Confirmada</SelectItem>
                                            <SelectItem value="asiste">Asiste</SelectItem>
                                            <SelectItem value="no asiste">No asiste</SelectItem>
                                            <SelectItem value="finalizado">Finalizado</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 text-center">Fecha y Hora</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5">Paciente / Profesional</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 text-center">RUT</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 text-center">Estado</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 text-center">Acciones Rápidas</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 text-center">Ficha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLista.map((data) => (
                                        <TableRow key={data.id_reserva} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                                            <TableCell className="py-5 text-center">
                                                <div className="inline-flex flex-col items-center bg-violet-50/50 px-3 py-1.5 rounded-xl border border-violet-100">
                                                    <span className="text-[13px] font-bold text-violet-700">{formatearFecha(data.fechaInicio)}</span>
                                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-tighter">{data.horaInicio || '--:--'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-slate-700 leading-tight">
                                                        {data.nombrePaciente} {data.apellidoPaciente}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                        Atiende: <span className="text-slate-500 font-semibold">{data.nombreProfesional}</span>
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center text-[12px] font-mono text-slate-500">
                                                {formatRut(data.rut)}
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-sm ${badgeEstado(data.estadoReserva)}`}>
                                                    {data.estadoReserva}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => actualizarEstadoReservaRapido(data.id_reserva, "asiste")}
                                                        className="h-9 px-3 rounded-xl bg-cyan-50 text-cyan-600 text-[10px] font-bold uppercase tracking-tight hover:bg-cyan-600 hover:text-white transition-all shadow-sm border border-cyan-100"
                                                        title="Marcar Asistencia"
                                                    >
                                                        Asiste
                                                    </button>
                                                    <button
                                                        onClick={() => actualizarEstadoReservaRapido(data.id_reserva, "no asiste")}
                                                        className="h-9 px-3 rounded-xl bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-tight hover:bg-pink-600 hover:text-white transition-all shadow-sm border border-pink-100"
                                                        title="Marcar Inasistencia"
                                                    >
                                                        Faltó
                                                    </button>
                                                    <button
                                                        onClick={() => actualizarEstadoReservaRapido(data.id_reserva, "finalizado")}
                                                        className="h-9 px-3 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-tight hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100"
                                                        title="Finalizar Atención"
                                                    >
                                                        Fin
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <button
                                                    onClick={() => verDetalleAgenda(data.id_reserva)}
                                                    className="h-10 w-10 inline-flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
