"use client"

import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {useState, useEffect} from "react";
import ToasterClients from "@/Componentes/ToasterClient";
import ShadcnInput from "@/Componentes/shadcnInput2";
import {toast} from "react-hot-toast";
import * as React from "react"
import {useRouter} from "next/navigation";
import {BookOpenIcon} from "@heroicons/react/24/outline";
import { formatRut, cleanRut } from "@/lib/designTokens";


export default function FichaClinica() {

    const API = process.env.NEXT_PUBLIC_API_URL;
    const [listaPacientes, setListaPacientes] = useState([]);

    const [nombreBuscado, setNombreBuscado] = useState("");
    const [rutBuscado, setRutBuscado] = useState("");

    const router = useRouter();

    function verDetallePaciente(id_paciente) {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    async function buscarRutSimilar(rutBuscado) {
        try {
            if (!rutBuscado) {
                toast.error("Debe ingresar previamente un RUT para buscar similitudes.")
            }

            const rut = cleanRut(rutBuscado);

            const res = await fetch(`${API}/pacientes/contieneRut`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({rut}),
                mode: "cors"
            })
            if (!res.ok) {
                return res.json();
            } else {
                const dataRutSimilar = await res.json()

                if (Array.isArray(dataRutSimilar) && dataRutSimilar.length > 0) {
                    setListaPacientes(dataRutSimilar)
                    return toast.success("Similitud encontrada!")
                } else {
                    return toast.error("No se han encontrado similitudes.")
                }
            }
        } catch (err) {
            console.log(err);
            return toast.error("Ha ocurrido un problema en el servidor")
        }
    }

    async function buscarNombreSimilar(nombreBuscado) {
        try {
            let nombre = nombreBuscado.trim();

            if (!nombreBuscado) {
                toast.error("Debe ingresar previamente un nombre para buscar similitudes.")
            }

            const res = await fetch(`${API}/pacientes/contieneNombre`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({nombre}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return res.json();
            } else {
                const dataSimilar = await res.json();

                if (Array.isArray(dataSimilar) && dataSimilar.length > 0) {
                    setListaPacientes(dataSimilar);
                    return toast.success("Similitud encontrada!")
                } else {
                    return toast.error("No se han encontrado similitudes.")
                }
            }
        } catch (err) {
            console.log(err);
            return toast.error("Ha habido un problema en el servidor por favor contacte a soporte de Medify");
        }
    }

    async function listarPacientes() {
        try {
            const res = await fetch(`${API}/pacientes`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("Ha ocurrido un error listando los pacientes . contacte a soporte IT de Medify")
            } else {
                const dataPacientes = await res.json()
                setListaPacientes(dataPacientes);
            }
        } catch (error) {
            console.log(error);
            return toast.success("Ha ocurrido un error contacte a soporte de Medify");
        }
    }

    useEffect(() => {
        listarPacientes();
    }, [])

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClients/>

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Historial Médico</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Carpetas Clínicas</h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                            Accede al historial completo de atenciones, documentos y evolución de cada paciente registrado en la plataforma.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <a
                            href="https://youtu.be/KWLr1mHjhA0?si=tMWgf6nDi-VBcXpu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 items-center gap-2 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                            aria-label="Abrir video tutorial de fichas clínicas"
                        >
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-px h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </span>
                            <span className="text-[10px] font-bold">Video Tutorial</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/calendario")}
                            className="flex h-10 items-center gap-2 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                            aria-label="Ir al calendario para agendar un paciente"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-[10px] font-bold">Agendar Paciente</span>
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="h-10 px-5 rounded-2xl bg-[#6E56CF] text-white flex items-center gap-2 shadow-sm hover:bg-[#5b45bc] transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-bold">Reservaciones</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-8">

                    {/* ── Búsqueda de Paciente ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Búsqueda de Carpeta</h2>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre del Paciente</label>
                                    <div className="flex gap-2">
                                        <ShadcnInput
                                            value={nombreBuscado}
                                            placeholder="Ej: Nicolás Andrés..."
                                            onChange={(e) => setNombreBuscado(e.target.value)}
                                        />
                                        <button 
                                            onClick={() => buscarNombreSimilar(nombreBuscado)}
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
                                            value={rutBuscado}
                                            placeholder="12.345.678-9"
                                            onChange={(e) => setRutBuscado(e.target.value)}
                                        />
                                        <button 
                                            onClick={() => buscarRutSimilar(rutBuscado)}
                                            className="h-11 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => listarPacientes()}
                                        className="w-full h-11 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Ver Todos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Listado de Pacientes ── */}
                    <div data-tour="ficha-lista-pacientes" className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Pacientes Registrados</h2>
                            <span className="h-6 px-2.5 rounded-full bg-violet-50 text-[#6E56CF] text-xs font-bold flex items-center justify-center">
                                {listaPacientes.length} registros
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 px-6">Identidad del Paciente</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 px-6">RUT</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 px-6">Contacto</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-5 px-6 text-center">Carpeta Médica</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listaPacientes.map((paciente) => (
                                        <TableRow key={paciente.id_paciente} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                                            <TableCell className="py-6 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-slate-700 leading-tight">
                                                        {paciente.nombre} {paciente.apellido}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">
                                                        Paciente Activo
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 px-6">
                                                <span className="text-[12px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">
                                                    {formatRut(paciente.rut)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-6 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                        </svg>
                                                        {paciente.telefono}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 lowercase">
                                                        {paciente.correo}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 px-6">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => verDetallePaciente(paciente.id_paciente)}
                                                        data-tour="ficha-abrir-carpeta"
                                                        data-tour-href={`/dashboard/FichasPacientes/${paciente.id_paciente}`}
                                                        className="h-10 px-4 flex items-center justify-center gap-2 rounded-2xl bg-[#6E56CF]/10 text-[#6E56CF] font-bold text-xs hover:bg-[#6E56CF] hover:text-white transition-all active:scale-95 shadow-sm border border-[#6E56CF]/10"
                                                    >
                                                        <BookOpenIcon className="h-4 w-4" />
                                                        Abrir Carpeta
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {listaPacientes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-12 text-center">
                                                <p className="text-sm text-slate-400 italic">No se encontraron pacientes registrados.</p>
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
    )
}
