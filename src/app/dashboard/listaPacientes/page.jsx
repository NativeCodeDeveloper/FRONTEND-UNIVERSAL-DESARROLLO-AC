"use client"

import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useEffect, useState} from "react";
import ToasterClients from "@/Componentes/ToasterClient";
import ShadcnInput from "@/Componentes/shadcnInput2";
import {toast} from "react-hot-toast";
import {useRouter} from "next/navigation";
import {UserIcon} from "@heroicons/react/24/outline";
import {InfoButton} from "@/Componentes/InfoButton";
import { formatRut, cleanRut } from "@/lib/designTokens";

export default function ListaPacientes() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [listaPacientes, setListaPacientes] = useState([]);
    const [nombreBuscado, setNombreBuscado] = useState("");
    const [rutBuscado, setRutBuscado] = useState("");

    const router = useRouter();

    function verDetallePaciente(id_paciente) {
        router.push(`/dashboard/paciente/${id_paciente}`);
    }

    async function buscarRutSimilar(rutBuscado) {
        try {
            if (!rutBuscado) {
                toast.error("Debe ingresar previamente un RUT para buscar similitudes.");
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
            });

            if (!res.ok) {
                return res.json();
            }

            const dataRutSimilar = await res.json();

            if (Array.isArray(dataRutSimilar) && dataRutSimilar.length > 0) {
                setListaPacientes(dataRutSimilar);
                return toast.success("Similitud encontrada!");
            }

            return toast.error("No se han encontrado similitudes.");
        } catch (err) {
            console.log(err);
            return toast.error("Ha ocurrido un problema en el servidor");
        }
    }

    async function buscarNombreSimilar(nombreBuscado) {
        try {
            const nombre = nombreBuscado.trim();

            if (!nombreBuscado) {
                toast.error("Debe ingresar previamente un nombre para buscar similitudes.");
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
            });

            if (!res.ok) {
                return res.json();
            }

            const dataSimilar = await res.json();

            if (Array.isArray(dataSimilar) && dataSimilar.length > 0) {
                setListaPacientes(dataSimilar);
                return toast.success("Similitud encontrada!");
            }

            return toast.error("No se han encontrado similitudes.");
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
            });

            if (!res.ok) {
                return toast.error("Ha ocurrido un error listando los pacientes . contacte a soporte IT de Medify");
            }

            const dataPacientes = await res.json();
            setListaPacientes(dataPacientes);
        } catch (error) {
            console.log(error);
            return toast.success("Ha ocurrido un error contacte a soporte de Medify");
        }
    }

    useEffect(() => {
        listarPacientes();
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClients/>

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                
                {/* ── Header Principal ── */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Administración de Base</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Listado de <span className="text-[#6E56CF]">Pacientes</span>
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Busca y gestiona la base de datos de pacientes. Envía registros directamente al calendario de agendamiento para optimizar el flujo de atención.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-14 px-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                            <span className="text-sm font-bold text-slate-900 mt-1 leading-none">{listaPacientes.length} Registros</span>
                        </div>
                        <InfoButton
                            informacion={'Busca pacientes registrados y agéndalos rápidamente desde este listado.'}
                            pasos={[
                                'Filtra por nombre o RUT para localizar el perfil que buscas.',
                                'Presiona "Agendar" para pre-cargar sus datos directamente en el calendario clínico.',
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-8">

                    {/* Panel de Búsqueda */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Filtros de Localización</h2>
                        </div>
                        <div className="p-4 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buscar por Nombre</label>
                                    <div className="flex gap-3">
                                        <ShadcnInput
                                            placeholder="Ej: Nicolas Andres..."
                                            value={nombreBuscado}
                                            onChange={(e) => setNombreBuscado(e.target.value)}
                                            className="h-12 rounded-2xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]"
                                        />
                                        <button
                                            onClick={() => buscarNombreSimilar(nombreBuscado)}
                                            className="h-12 px-6 rounded-2xl bg-[#6E56CF] text-white text-[13px] font-bold hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                            Buscar
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buscar por RUT</label>
                                    <div className="flex gap-3">
                                        <ShadcnInput
                                            value={rutBuscado}
                                            placeholder={"12.345.678-9"}
                                            onChange={(e) => setRutBuscado(e.target.value)}
                                            className="h-12 rounded-2xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]"
                                        />
                                        <button
                                            onClick={() => buscarRutSimilar(rutBuscado)}
                                            className="h-12 px-6 rounded-2xl bg-[#6E56CF] text-white text-[13px] font-bold hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                            Buscar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Base de Datos de Pacientes</h2>
                            <button
                                onClick={() => listarPacientes()}
                                className="h-9 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                Mostrar Todos
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                        <TableHead className="w-[100px] text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Perfil</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Nombre Completo</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Identificación (RUT)</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Contacto Principal</TableHead>
                                        <TableHead className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Acción Rápida</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listaPacientes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center">
                                                <p className="text-[13px] text-slate-400 font-medium italic">No se han encontrado pacientes con los criterios de búsqueda.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        listaPacientes.map((paciente) => (
                                            <TableRow key={paciente.id_paciente} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                <TableCell className="text-center py-4">
                                                    <button
                                                        onClick={() => verDetallePaciente(paciente.id_paciente)}
                                                        className="h-10 w-10 mx-auto rounded-xl bg-violet-50 text-[#6E56CF] hover:bg-[#6E56CF] hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                    >
                                                        <UserIcon className="w-5 h-5"/>
                                                    </button>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-[13px] font-bold text-slate-900 block">{paciente.nombre} {paciente.apellido}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">Paciente ID #{paciente.id_paciente}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-[13px] font-semibold text-slate-600 font-mono">{formatRut(paciente.rut) || "Sin registro"}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-[13px] font-semibold text-slate-600 block">{paciente.telefono || "N/A"}</span>
                                                    <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">{paciente.correo || ""}</span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <button
                                                        onClick={() => {
                                                            const params = new URLSearchParams({
                                                                nombre: paciente.nombre || "",
                                                                apellido: paciente.apellido || "",
                                                                rut: paciente.rut || "",
                                                                telefono: paciente.telefono || "",
                                                                email: paciente.correo || "",
                                                            });
                                                            router.push(`/dashboard/calendario?${params.toString()}`);
                                                        }}
                                                        className="h-10 px-5 rounded-xl bg-teal-50 text-teal-700 text-[11px] font-bold hover:bg-teal-600 hover:text-white border border-teal-100 transition-all flex items-center justify-center gap-2 mx-auto"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                        Agendar Cita
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
