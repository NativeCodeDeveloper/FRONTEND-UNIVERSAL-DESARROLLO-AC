'use client'
import {useState, useEffect} from 'react'
import {useParams, useRouter} from "next/navigation";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import Odontograma from "@/Componentes/Odontograma";
import { formatRut } from "@/lib/designTokens";


const ALL_TEETH = [
    18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28,
    38,37,36,35,34,33,32,31, 41,42,43,44,45,46,47,48,
    55,54,53,52,51, 61,62,63,64,65,
    75,74,73,72,71, 81,82,83,84,85,
];

function emptyTooth() {
    return {
        surfaces: { V: null, L: null, M: null, D: null, O: null },
        wholeTooth: {
            absent: false, restoRadicular: false, protesisFija: false, prosthesisExisting: false,
            corona: false, piezaExtraida: false, extraccionIndicada: false, extraidaOrtodoncia: false,
            indicadaOrtodoncia: false, indicadaSellante: false, piezaFaltante: false, piezaSana: false,
        },
    };
}

function transformarDatosBackend(filas) {
    if (!filas || filas.length === 0) return null;
    const teeth = {};
    ALL_TEETH.forEach((n) => { teeth[String(n)] = emptyTooth(); });
    for (const fila of filas) {
        teeth[String(fila.numero_diente)] = {
            surfaces: {
                V: fila.cara_V || null,
                L: fila.cara_L || null,
                M: fila.cara_M || null,
                D: fila.cara_D || null,
                O: fila.cara_O || null,
            },
            wholeTooth: {
                absent: !!fila.ausente,
                restoRadicular: !!fila.resto_radicular,
                protesisFija: !!fila.protesis_fija,
                prosthesisExisting: !!fila.protesis_existente,
                corona: !!fila.corona,
                piezaExtraida: !!fila.pieza_extraida,
                extraccionIndicada: !!fila.extraccion_indicada,
                extraidaOrtodoncia: !!fila.extraida_ortodoncia,
                indicadaOrtodoncia: !!fila.indicada_ortodoncia,
                indicadaSellante: !!fila.indicada_sellante,
                piezaFaltante: !!fila.pieza_faltante,
                piezaSana: !!fila.pieza_sana,
            },
        };
    }
    return { teeth };
}


export default function OdontogramasPaciente() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [odontogramas, setOdontogramas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [aviso, setAviso] = useState("");
    const [dataPaciente, setDataPaciente] = useState([]);
    const {id_paciente} = useParams();
    const router = useRouter();


    async function cargarTodosLosOdontogramas(id_paciente) {
        try {
            if (!id_paciente) {
                setAviso("NO SE HA SELECCIONADO NINGUN PACIENTE PARA REVISION DE ODONTOGRAMAS")
                setCargando(false);
                return;
            }

            const resLista = await fetch(`${API}/odontograma/listarOdontogramas`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ id_paciente }),
                mode: "cors"
            });

            if (!resLista.ok) {
                return toast.error("No fue posible cargar los odontogramas del paciente");
            }

            const lista = await resLista.json();

            if (!lista || lista.length === 0) {
                setOdontogramas([]);
                setCargando(false);
                return;
            }

            const odontogramasCompletos = [];
            for (const item of lista) {
                const resDientes = await fetch(`${API}/odontograma/seleccionarOdontogramaPorId`, {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ id_odontograma: item.id_odontograma }),
                    mode: "cors"
                });

                if (resDientes.ok) {
                    const dientes = await resDientes.json();
                    const datosTransformados = transformarDatosBackend(dientes);
                    odontogramasCompletos.push({
                        id_odontograma: item.id_odontograma,
                        fecha: item.fechaCreacionOdontograma,
                        initialData: datosTransformados,
                    });
                }
            }

            setOdontogramas(odontogramasCompletos);

        } catch (error) {
            return toast.error("No fue posible cargar los odontogramas del paciente");
        } finally {
            setCargando(false);
        }
    }

    async function crearOdontograma() {
        const teeth = {};
        ALL_TEETH.forEach((n) => { teeth[String(n)] = emptyTooth(); });

        const res = await fetch(`${API}/odontograma/insertarOdontograma`, {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ id_paciente, teeth }),
            mode: "cors"
        });

        if (!res.ok) {
            return toast.error("No fue posible crear el odontograma");
        }

        toast.success("Odontograma creado");
        setCargando(true);
        await cargarTodosLosOdontogramas(id_paciente);
    }

    async function cargarDatosPaciente(id_paciente) {
        try {
            const res = await fetch(`${API}/pacientes/pacientesEspecifico`,{
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({id_paciente }),
            })

            if (!res.ok) {
               return toast.error("No fue posible cargar el paciente");
            }else{
                const dataBackendPaciente = await res.json();
                setDataPaciente(dataBackendPaciente);
            }
        }catch(error) {
            return toast.error("No fue posible cargar el datos del Paciente");
        }
    }

    function irCarpetaClinica(id_paciente) {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    useEffect(() => {
        cargarDatosPaciente(id_paciente)
        cargarTodosLosOdontogramas(id_paciente)
    }, [id_paciente])

    /* ── Loading ── */
    if (cargando) {
        return (
            <div className="min-h-screen bg-[#FAFAFB] px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                <ToasterClient/>
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-200"/>
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-slate-200 rounded"/>
                                <div className="h-7 w-64 bg-slate-200 rounded-lg"/>
                            </div>
                        </div>
                        <div className="h-28 bg-slate-200 rounded-2xl"/>
                        <div className="h-96 bg-slate-200 rounded-2xl"/>
                    </div>
                </div>
            </div>
        );
    }

    const paciente = dataPaciente.length > 0 ? dataPaciente[0] : null;

    return (
        <div className="min-h-screen bg-[#FAFAFB] px-4 sm:px-6 lg:px-8 py-6 md:py-10">
            <ToasterClient/>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="mb-2">
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                        Registros de Odontogramas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Visualiza, crea y edita los odontogramas del paciente</p>
                </div>

                {/* ── Tarjeta Paciente + Acciones ── */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Datos del Paciente</h2>
                    </div>
                    <div className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            {/* Info Paciente */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </div>
                                <div>
                                    {paciente ? (
                                        <>
                                            <p className="text-lg font-bold text-slate-800">{paciente.nombre} {paciente.apellido}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/>
                                                    </svg>
                                                    RUT: <span className="font-mono font-medium text-slate-700">{formatRut(paciente.rut)}</span>
                                                </span>
                                                <span className="hidden sm:inline-flex h-4 w-px bg-slate-200"/>
                                                <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-500">
                                                    ID: <span className="font-mono font-medium text-slate-700">#{id_paciente}</span>
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400">Cargando datos del paciente...</p>
                                    )}
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <button
                                    onClick={crearOdontograma}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-black rounded-lg hover:bg-slate-800 transition-all duration-150 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                                    </svg>
                                    Nuevo Odontograma
                                </button>
                                <button
                                    onClick={() => irCarpetaClinica(id_paciente)}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-150"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                                    </svg>
                                    Volver a Carpeta Clinica
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Aviso de error ── */}
                {aviso && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-red-700">{aviso}</p>
                    </div>
                )}

                {/* ── Listado de Odontogramas ── */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Odontogramas</h2>
                            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-bold bg-violet-100 text-[#6E56CF]">
                                {odontogramas.length}
                            </span>
                        </div>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider hidden sm:block">Ordenados por fecha</span>
                    </div>

                    {/* Estado vacio */}
                    {odontogramas.length === 0 && !aviso && (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-600">Sin odontogramas registrados</p>
                            <p className="text-xs text-slate-400 mt-1">Presiona "Nuevo Odontograma" para crear el primero</p>
                        </div>
                    )}

                    {/* Lista de odontogramas */}
                    {odontogramas.length > 0 && (
                        <div className="divide-y divide-slate-100">
                            {odontogramas.map((item, idx) => (
                                <div key={item.id_odontograma} className="group">
                                    {/* Header del odontograma */}
                                    <div className="flex items-center justify-between px-5 py-4 bg-white group-hover:bg-violet-50/30 transition-colors duration-150">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6E56CF] shadow-sm">
                                                <span className="text-sm font-bold text-white">{idx + 1}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-slate-800">Odontograma</h3>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                                        ID #{item.id_odontograma}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                    </svg>
                                                    <span className="text-xs text-slate-500">
                                                        {(() => {
                                                            const raw = typeof item.fecha === "string" ? item.fecha : "";
                                                            const parts = raw.split("T")[0]?.split("-");
                                                            if (!parts || parts.length !== 3) return raw;
                                                            const local = new Date(+parts[0], +parts[1] - 1, +parts[2]);
                                                            return local.toLocaleDateString("es-CL", {
                                                                weekday: "long",
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            });
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Componente Odontograma */}
                                    <div className="px-3 pb-6">
                                        <Odontograma
                                            patientId={id_paciente}
                                            idOdontograma={item.id_odontograma}
                                            initialData={item.initialData}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    {odontogramas.length > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span className="text-[11px] text-slate-500">{odontogramas.length} odontograma{odontogramas.length !== 1 ? "s" : ""} registrado{odontogramas.length !== 1 ? "s" : ""}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">Paciente #{id_paciente}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )

}
