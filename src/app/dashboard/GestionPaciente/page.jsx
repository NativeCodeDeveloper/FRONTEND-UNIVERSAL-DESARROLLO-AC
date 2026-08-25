"use client"

import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {useState, useEffect} from "react";
import ToasterClients from "@/Componentes/ToasterClient";
import ShadcnInput from "@/Componentes/shadcnInput2";
import {ShadcnSelect} from "@/Componentes/shadcnSelect";
import ShadcnButton from "@/Componentes/shadcnButton2";
import {toast} from "react-hot-toast";
import * as React from "react"
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import {useRouter} from "next/navigation";
import {UserIcon} from "@heroicons/react/24/outline";
import {InfoButton} from "@/Componentes/InfoButton";
import {Textarea} from "@/components/ui/textarea";
import { RutInput } from "@/Componentes/RutInput";
import { PhoneInput } from "@/Componentes/PhoneInput";
import { formatRut, cleanRut } from "@/lib/designTokens";


export default function GestionPaciente() {

    const API = process.env.NEXT_PUBLIC_API_URL;
    const [listaPacientes, setListaPacientes] = useState([]);
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [rut, setRut] = useState("");
    const [nacimiento, setNacimiento] = useState("");
    const [sexo, setSexo] = useState("");
    const [prevision, setPrevision] = useState("FONASA");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");
    const [direccion, setDireccion] = useState("");
    const [pais, setPais] = useState("");
    const [observacion1, setObservacion1] = useState("");
    const [apoderado, setApoderado] = useState("");
    const [apoderadoRut, setApoderadoRut] = useState("");
    const [medicamentosUsados, setMedicamentosUsados] = useState("");
    const [habitos, setHabitos] = useState("");
    const [comentariosAdicionales, setComentariosAdicionales] = useState("");

    const [nombreBuscado, setNombreBuscado] = useState("");
    const [rutBuscado, setRutBuscado] = useState("");

    const router = useRouter();
    const mensajePacienteDuplicado = "Paciente ya Existe. No se puede duplicar rut";

    function verDetallePaciente(id_paciente) {
        router.push(`/dashboard/paciente/${id_paciente}`);
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

    async function insertarPaciente(nombre, apellido, rut, nacimiento, sexo, prevision, telefono, correo, direccion, pais, observacion1, apoderado, apoderado_rut, medicamentosUsados, habitos, comentariosAdicionales) {
        try {
            let prevision_id = null;

            if (prevision.includes("FONASA")) {
                prevision_id = 1;
            } else if (prevision.includes("ISAPRE")) {
                prevision_id = 2;
            } else if (prevision.includes("CONVENIO")) {
                prevision_id = 3;
            } else if (prevision.includes("SIN PREVISION")) {
                prevision_id = 4;
            } else {
                return toast.error("Debe seleccionar al menos una previsión");
            }

            if (!nombre || !apellido || !rut || !nacimiento || !sexo || !prevision_id || !telefono || !correo || !direccion || !pais) {
                return toast.error("Debe llenar todos los campos para ingresar un nuevo paciente en las bases de datos.")
            }

            const res = await fetch(`${API}/pacientes/pacientesInsercion`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    rut,
                    nacimiento,
                    sexo,
                    prevision_id,
                    telefono,
                    correo,
                    direccion,
                    pais,
                    observacion1,
                    apoderado,
                    apoderado_rut,
                    medicamentosUsados,
                    habitos,
                    comentariosAdicionales
                }),
                mode: "cors"
            })

            const respuestaBackend = await res.json().catch(() => null);

            if (respuestaBackend?.message === "duplicado") {
                return toast.error(mensajePacienteDuplicado);
            }

            if (!res.ok) {
                return toast.error("Problema al Ingresar nuevo paciente en el servidor. Por favor contacte a soporte Tecnico de Medify")
            } else {
                if (respuestaBackend.message === true) {
                    setNombre("");
                    setApellido("");
                    setRut("");
                    setTelefono("");
                    setCorreo("");
                    setDireccion("");
                    setPais("");
                    setObservacion1("");
                    setApoderado("");
                    setApoderadoRut("");
                    setMedicamentosUsados("");
                    setHabitos("");
                    setComentariosAdicionales("");
                    await listarPacientes();
                    return toast.success("Paciente ingresado correctamente.");
                }

                return toast.error("Problema al Ingresar nuevo paciente en el servidor. Por favor contacte a soporte Tecnico de Medify")
            }
        } catch (err) {
            console.error(err);
            return toast.error("Problema al Ingresar nuevo paciente en el servidor. Por favor contacte a soporte Tecnico de Medify")
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
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Administración de Clínica</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Gestión de Pacientes</h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                            Registra y administra la base de datos de tus pacientes. La creación de un perfil es el primer paso para generar fichas clínicas y planes de tratamiento personalizados.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <InfoButton
                            informacion={'Registra pacientes nuevos en la base de datos de la clínica.'}
                            pasos={[
                                'Completa el formulario con los datos personales y de contacto del paciente.',
                                'Guarda el registro: es importante que los datos sean correctos para mantener un historial clínico preciso.',
                                'Accede a su ficha desde la sección "Ficha Clínica" una vez registrado.',
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
                    
                    {/* ── Columna Izquierda: Formulario de Ingreso (8 slots) ── */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-4 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#6E56CF] shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Nuevo Registro de Paciente</h2>
                            </div>

                            <div className="p-4 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 md:gap-x-8 md:gap-y-6">
                                    {/* Grupo: Datos Básicos */}
                                    <div className="md:col-span-2 flex items-center gap-4 mb-2">
                                        <div className="h-px flex-1 bg-slate-100"></div>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Información Personal</span>
                                        <div className="h-px flex-1 bg-slate-100"></div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombres <span className="text-red-400">*</span></label>
                                        <ShadcnInput value={nombre} placeholder="Ej: Andrea Ignacia" onChange={(e) => setNombre(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Apellidos <span className="text-red-400">*</span></label>
                                        <ShadcnInput value={apellido} placeholder="Ej: Varela Garrido" onChange={(e) => setApellido(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Identificación (RUT) <span className="text-red-400">*</span></label>
                                        <RutInput value={rut} onChange={(clean) => setRut(clean)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha de Nacimiento <span className="text-red-400">*</span></label>
                                        <ShadcnDatePicker value={nacimiento} onChange={setNacimiento} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sexo <span className="text-red-400">*</span></label>
                                        <ShadcnInput value={sexo} placeholder="Ej: Femenino" onChange={(e) => setSexo(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Previsión <span className="text-red-400">*</span></label>
                                        <ShadcnSelect
                                            nombreDefault="Seleccione Previsión"
                                            value1="FONASA" value2="ISAPRE" value3="CONVENIO" value4="SIN PREVISION"
                                            onChange={setPrevision}
                                        />
                                    </div>

                                    {/* Grupo: Contacto */}
                                    <div className="md:col-span-2 flex items-center gap-4 mt-4 mb-2">
                                        <div className="h-px flex-1 bg-slate-100"></div>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contacto y Ubicación</span>
                                        <div className="h-px flex-1 bg-slate-100"></div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono <span className="text-red-400">*</span></label>
                                        <PhoneInput value={telefono} onChange={(full) => setTelefono(full)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Correo Electrónico <span className="text-red-400">*</span></label>
                                        <ShadcnInput value={correo} placeholder="paciente@ejemplo.com" onChange={(e) => setCorreo(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dirección Residencial <span className="text-red-400">*</span></label>
                                        <ShadcnInput value={direccion} placeholder="Calle Ejemplo 123, Ciudad" onChange={(e) => setDireccion(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">País <span className="text-red-400">*</span></label>
                                        <ShadcnInput value={pais} placeholder="Chile" onChange={(e) => setPais(e.target.value)} />
                                    </div>

                                    {/* Observaciones (Ancho completo) */}
                                    <div className="md:col-span-2 space-y-4 mt-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Observaciones Generales</label>
                                            <Textarea value={observacion1} onChange={(e) => setObservacion1(e.target.value)} placeholder="Notas administrativas o alertas especiales..." className="rounded-2xl border-slate-200 focus:ring-violet-100 focus:border-[#6E56CF] min-h-[100px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Medicamentos y Hábitos</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Textarea value={medicamentosUsados} onChange={(e) => setMedicamentosUsados(e.target.value)} placeholder="Lista de medicamentos actuales..." className="rounded-2xl border-slate-200 focus:ring-violet-100 focus:border-[#6E56CF]" />
                                                <Textarea value={habitos} onChange={(e) => setHabitos(e.target.value)} placeholder="Fumador, actividad física, etc..." className="rounded-2xl border-slate-200 focus:ring-violet-100 focus:border-[#6E56CF]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end">
                                    <button
                                        onClick={() => insertarPaciente(nombre, apellido, rut, nacimiento, sexo, prevision, telefono, correo, direccion, pais, observacion1, apoderado, apoderadoRut, medicamentosUsados, habitos, comentariosAdicionales)}
                                        className="h-12 px-8 bg-[#6E56CF] text-white text-sm font-bold rounded-2xl hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Registrar Paciente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Columna Derecha: Búsqueda y Lista (4 slots) ── */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Panel de Búsqueda Rápida */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Búsqueda Rápida</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buscar por Nombre</label>
                                    <div className="flex gap-2">
                                        <ShadcnInput value={nombreBuscado} placeholder="Ej: Nicolas..." onChange={(e) => setNombreBuscado(e.target.value)} />
                                        <button onClick={() => buscarNombreSimilar(nombreBuscado)} className="h-10 px-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buscar por RUT</label>
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <RutInput value={rutBuscado} placeholder="12345678K" onChange={(clean) => setRutBuscado(clean)} />
                                        </div>
                                        <button onClick={() => buscarRutSimilar(rutBuscado)} className="h-10 px-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => listarPacientes()} className="w-full h-10 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors mt-2">
                                    Ver Todos los Pacientes
                                </button>
                            </div>
                        </div>

                        {/* Lista Compacta de Resultados */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Pacientes Registrados</h2>
                                <span className="h-5 px-2 rounded-full bg-violet-50 text-[#6E56CF] text-[10px] font-bold flex items-center">
                                    {listaPacientes.length}
                                </span>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                                {listaPacientes.map((p) => (
                                    <div key={p.id_paciente} className="px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-bold text-slate-700 truncate">{p.nombre} {p.apellido}</p>
                                                <p className="text-[11px] font-medium text-slate-400 mt-0.5 font-mono">{formatRut(p.rut)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => verDetallePaciente(p.id_paciente)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-[#6E56CF] group-hover:text-white transition-all shadow-sm"
                                                    title="Ver Ficha"
                                                >
                                                    <UserIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams({
                                                            nombre: p.nombre || "", apellido: p.apellido || "",
                                                            rut: p.rut || "", telefono: p.telefono || "", email: p.correo || "",
                                                        });
                                                        router.push(`/dashboard/calendario?${params.toString()}`);
                                                    }}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    title="Agendar Cita"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {listaPacientes.length === 0 && (
                                    <div className="p-12 text-center">
                                        <p className="text-xs text-slate-400 italic">No se encontraron pacientes registrados.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
