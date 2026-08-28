"use client"
import {useState, useEffect} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import ShadcnButton2 from "@/Componentes/shadcnButton2";
import formatearFecha from "@/FuncionesTranversales/funcionesTranversales";
import {InfoButton} from "@/Componentes/InfoButton";
import {RecordatorioPaciente} from "@/Componentes/RecordatorioPaciente";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AgendaDetalle() {
    const API = process.env.NEXT_PUBLIC_API_URL;

    const {id_reserva} = useParams();
    const [dataReservaId, setDataReservaId] = useState([]);
    const [estadoReserva, setEstadoReserva] = useState("");
    const [mensajeEliminacion, setmensajeEliminacion] = useState("");
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

    async function seleccionarEspecifica(id_reserva) {
        try {

            const res = await fetch(`${API}/reservaPacientes/seleccionarEspecifica`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_reserva}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("Ha ocurrido un error en el servidor");
            } else {

                const dataEspecifica = await res.json();

                if (Array.isArray(dataEspecifica)) {
                    setDataReservaId(dataEspecifica);
                } else {
                    return toast.error("Ha ocurrido un error en el servidor");
                }
            }
        } catch (e) {
            return toast.error("Problema en el servidor, contacte a soporte.");
        }
    }

    useEffect(() => {
        seleccionarEspecifica(id_reserva)
    }, [])


    async function eliminadoLogicoReserva(id_reserva) {
        try {

            if (!id_reserva) {
                return toast.error("Debe seleccionar al menos una reserva valida para realizar la eliminacion")
            }

            const res = await fetch(`${API}/reservaPacientes/eliminarReserva`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_reserva}),
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("No hay conexion con el servidor por favor contacte a Soporte");

            } else {

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    setmensajeEliminacion("Esta reserva ha sido eliminada. Ya no podra acceder a la informacion de esta cita.")
                    return toast.success("Se ha eliminado con exito la reserva");
                } else if (respuestaBackend.message === false) {
                    return toast.success("No se ha podido eliminar la reserva. Intente mas tarde.");
                } else {
                    return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
                }
            }

        } catch (error) {
            console.log(error);
            return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
        }
    }


    async function actualizarReservaPaciente(estadoReserva, id_reserva) {
        try {

            if (!id_reserva || !estadoReserva) {
                return toast.error("Debe seleccionar un nuevo estado")
            }

            const res = await fetch(`${API}/reservaPacientes/actualizarEstado`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({estadoReserva, id_reserva}),
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("No se ha podido enviar la informacion para actualizar el estado");

            } else {

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    await seleccionarEspecifica(id_reserva)
                    return toast.success("Se ha actualizado el estado con exito");
                } else {
                    return toast.error("No se ha podido actualizar. Intente Mas tarde.");
                }
            }
        } catch (e) {
            console.log(e);
            return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
        }
    }

    const normalizarEstadoReserva = (estado = "") =>
        String(estado)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const estadoColor = (estado) => {
        if (!estado) return "bg-slate-100 text-slate-600";
        const e = normalizarEstadoReserva(estado);
        if (e === "asiste") return "bg-cyan-50 text-cyan-800 ring-cyan-200";
        if (e === "no asiste" || e === "no asistio" || e === "no asistste") return "bg-pink-50 text-pink-800 ring-pink-200";
        if (e === "finalizado") return "bg-orange-50 text-orange-800 ring-orange-200";
        if (e === "confirmada") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
        if (e === "anulada") return "bg-red-50 text-red-700 ring-red-200";
        if (e === "pendiente pago") return "bg-amber-50 text-amber-700 ring-amber-200";
        return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
            <ToasterClient/>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 mb-1">Administracion</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Detalle de la Cita
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Visualiza, gestiona y realiza seguimiento de la reserva.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/agendaCitas">
                            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-150 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                                </svg>
                                Volver a Agenda
                            </button>
                        </Link>
                        <InfoButton
                            informacion={'Detalle de la cita: gestiona el estado, envía recordatorios y administra la reserva del paciente.'}
                            pasos={[
                                'Envía un recordatorio automático al correo que el paciente registró al agendar.',
                                'Actualiza el estado de la cita: Reservada, Confirmada, Asiste, No asiste, Finalizado, Anulada o Pendiente de pago.',
                            ]}
                            nota={'Al eliminar una cita, se borra de forma permanente y no se puede recuperar.'}
                        />
                    </div>
                </div>

                {/* Estado actual */}
                {dataReservaId.map(data => (
                    <div key={data.id_reserva} className="mb-6">
                        <span className={"inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 " + estadoColor(data.estadoReserva)}>
                            <span className={"h-1.5 w-1.5 rounded-full " + (
                                normalizarEstadoReserva(data.estadoReserva) === "asiste" ? "bg-cyan-500" :
                                normalizarEstadoReserva(data.estadoReserva) === "no asiste" || normalizarEstadoReserva(data.estadoReserva) === "no asistio" || normalizarEstadoReserva(data.estadoReserva) === "no asistste" ? "bg-pink-500" :
                                normalizarEstadoReserva(data.estadoReserva) === "finalizado" ? "bg-orange-500" :
                                normalizarEstadoReserva(data.estadoReserva) === "confirmada" ? "bg-emerald-500" :
                                normalizarEstadoReserva(data.estadoReserva) === "anulada" ? "bg-red-500" :
                                normalizarEstadoReserva(data.estadoReserva) === "pendiente pago" ? "bg-amber-500" :
                                "bg-indigo-500"
                            )} />
                            {data.estadoReserva}
                        </span>
                    </div>
                ))}

                <div className="space-y-6">

                    {/* Grid principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Informacion de la reserva */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                                </svg>
                                <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Informacion de la Reserva</h2>
                            </div>

                            <div className="p-5 md:p-6">
                                {dataReservaId.length === 0 ? (
                                    <div className="animate-pulse space-y-3">
                                        {Array.from({length: 6}).map((_, i) => (
                                            <div key={i} className="h-4 w-3/4 rounded bg-slate-200"/>
                                        ))}
                                    </div>
                                ) : (
                                    dataReservaId.map(data => (
                                        <div key={data.id_reserva} className="space-y-3">
                                            {[{label: "Profesional Solicitado", value: data.nombreProfesional},
                                                {label: "Nombre", value: data.nombrePaciente},
                                                {label: "Apellido", value: data.apellidoPaciente},
                                                {label: "RUT", value: data.rut},
                                                {label: "Telefono", value: data.telefono},
                                                {label: "Correo", value: data.email},
                                                {label: "Fecha inicio", value: formatearFecha(data.fechaInicio)},
                                                {label: "Fecha finalizacion", value: formatearFecha(data.fechaFinalizacion)},
                                                {label: "Hora", value: data.horaInicio},
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</span>
                                                    <span className="text-sm font-medium text-slate-800">{item.value || "-"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recordatorio (correo / WhatsApp) */}
                        <RecordatorioPaciente
                            key={id_reserva}
                            email={dataReservaId[0]?.email}
                            telefono={dataReservaId[0]?.telefono}
                            nombreProfesional={dataReservaId[0]?.nombreProfesional}
                        />
                    </div>

                    {/* Acciones de la reserva */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Gestionar Estado</h2>
                        </div>

                        <div className="p-5 md:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                <Select value={estadoReserva} onValueChange={(value) => setEstadoReserva(value)}>
                                    <SelectTrigger className="w-full sm:w-[280px] bg-white border border-slate-200 text-slate-800 shadow-sm rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500">
                                        <SelectValue placeholder="Selecciona un estado"/>
                                    </SelectTrigger>
                                    <SelectContent className="z-50 bg-white text-slate-800 border border-slate-200 shadow-xl rounded-xl">
                                        <SelectGroup>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="reservada">Reservada</SelectItem>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="confirmada">Confirmada</SelectItem>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="asiste">Asiste</SelectItem>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="no asiste">No Asiste</SelectItem>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="finalizado">Finalizado</SelectItem>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="anulada">Anulada</SelectItem>
                                            <SelectItem className="cursor-pointer rounded-lg focus:bg-sky-50" value="pendiente pago">Pendiente de Pago</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                <button
                                    onClick={() => actualizarReservaPaciente(estadoReserva, id_reserva)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-500 rounded-lg hover:from-sky-700 hover:to-cyan-600 transition-all duration-150 shadow-md hover:shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
                                    </svg>
                                    Actualizar Estado
                                </button>

                                <button
                                    onClick={() => setConfirmarEliminacion(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-150"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                                    </svg>
                                    Eliminar Reserva
                                </button>
                            </div>

                            {/* Confirmacion de eliminacion */}
                            {confirmarEliminacion && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-semibold text-red-800">Esta seguro de que desea eliminar esta cita?</p>
                                    <p className="mt-1 text-xs text-red-600/80">Esta accion no se puede deshacer.</p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setConfirmarEliminacion(false);
                                                eliminadoLogicoReserva(id_reserva);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-sm"
                                        >
                                            Si, eliminar
                                        </button>
                                        <button
                                            onClick={() => setConfirmarEliminacion(false)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Mensaje de eliminacion */}
                            {mensajeEliminacion && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-red-700">{mensajeEliminacion}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
