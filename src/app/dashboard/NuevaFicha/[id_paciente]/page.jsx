"use client"

import {useParams} from "next/navigation";
import {useState, useEffect} from "react";
import {toast} from "react-hot-toast";
import {Textarea} from "@/components/ui/textarea";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import ToasterClient from "@/Componentes/ToasterClient";
import Link from "next/link";
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {useRouter} from "next/navigation";
import { formatRut } from "@/lib/designTokens";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Button} from "@/components/ui/button";

function transformarPlantilla(filas) {
    if (!filas || filas.length === 0) return null
    const primera = filas[0]
    const categoriasMap = {}

    filas.forEach(fila => {
        if (!fila.id_categoria) return
        if (!categoriasMap[fila.id_categoria]) {
            categoriasMap[fila.id_categoria] = {
                id_categoria: fila.id_categoria,
                nombre: fila.categoria_nombre,
                orden: fila.categoria_orden,
                campos: []
            }
        }
        if (fila.id_campo) {
            categoriasMap[fila.id_categoria].campos.push({
                id_campo: fila.id_campo,
                nombre: fila.campo_nombre,
                requerido: fila.requerido,
                orden: fila.campo_orden
            })
        }
    })

    return {
        id_plantilla: primera.id_plantilla,
        nombre: primera.plantilla_nombre,
        categorias: Object.values(categoriasMap).sort((a, b) => a.orden - b.orden)
    }
}

export default function NuevaFicha() {

    const {id_paciente} = useParams();
    const [dataPaciente, setDataPaciente] = useState([]);
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    function retroceder(id_paciente) {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    // Campos base
    const [fechaConsulta, setFechaConsulta] = useState("");
    const [observacionesPrecio, setObservacionesPrecio] = useState("");

    // Plantilla dinámica
    const [plantillas, setPlantillas] = useState([])
    const [idPlantilla, setIdPlantilla] = useState("")
    const [plantillaCompleta, setPlantillaCompleta] = useState(null)
    const [datosDinamicos, setDatosDinamicos] = useState({})

    // Cargar lista de plantillas al montar
    async function listarPlantillas() {
        try {
            const res = await fetch(`${API}/fichaPlantilla/listarPlantillas`)
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data)) {
                setPlantillas(data)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Cargar plantilla completa cuando se selecciona
    async function seleccionarPlantilla(id_plantilla) {
        setIdPlantilla(id_plantilla)
        setDatosDinamicos({})
        setPlantillaCompleta(null)

        if (!id_plantilla) return

        try {
            const res = await fetch(`${API}/fichaPlantilla/obtenerPlantillaCompleta`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_plantilla})
            })

            if (!res.ok) {
                return toast.error("No se pudo cargar la plantilla seleccionada.")
            }

            const filas = await res.json()
            const estructura = transformarPlantilla(filas)
            setPlantillaCompleta(estructura)
        } catch (error) {
            console.log(error)
            return toast.error("Error al cargar la plantilla.")
        }
    }

    async function insertarFicha() {
        try {
            if (!id_paciente) {
                return toast.error('Debe seleccionar un paciente para ingresar una nueva ficha.')
            }

            if (!idPlantilla || !plantillaCompleta) {
                return toast.error('Debe seleccionar una plantilla para la ficha.')
            }

            // Validar campos requeridos
            const camposFaltantes = []
            plantillaCompleta.categorias.forEach(cat => {
                cat.campos.forEach(campo => {
                    if (campo.requerido === 1 && !datosDinamicos[campo.id_campo]?.trim()) {
                        camposFaltantes.push(campo.nombre)
                    }
                })
            })

            if (camposFaltantes.length > 0) {
                return toast.error(`Debe completar los campos obligatorios: ${camposFaltantes.join(", ")}`)
            }

            // Construir datosDinamicos enriquecido con nombres de campo/categoría
            const datosEnriquecidos = {
                _plantillaNombre: plantillaCompleta.nombre
            }
            plantillaCompleta.categorias.forEach(cat => {
                cat.campos.forEach(campo => {
                    if (datosDinamicos[campo.id_campo]) {
                        datosEnriquecidos[campo.id_campo] = {
                            valor: datosDinamicos[campo.id_campo],
                            nombreCampo: campo.nombre,
                            nombreCategoria: cat.nombre,
                            categoriaOrden: cat.orden,
                            campoOrden: campo.orden
                        }
                    }
                })
            })

            const res = await fetch(`${API}/ficha/insertarFichaClinica`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_paciente,
                    tipoAtencion: "",
                    motivoConsulta: "",
                    signosVitales: "",
                    observaciones: observacionesPrecio,
                    anotacionConsulta: "",
                    anamnesis: "",
                    diagnostico: "",
                    indicaciones: "",
                    archivosAdjuntos: "",
                    fechaConsulta,
                    consentimientoFirmado: "",
                    id_plantilla: idPlantilla,
                    datosDinamicos: datosEnriquecidos
                }),
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("Faltan datos para ingresar la nueva ficha.");
            }

            const respuestaQuery = await res.json();
            if (respuestaQuery.message === true) {
                setObservacionesPrecio("");
                setFechaConsulta("");
                setDatosDinamicos({});
                setIdPlantilla("");
                setPlantillaCompleta(null);
                return toast.success("Nueva ficha ingresada con Exito!");
            } else {
                return toast.error("Faltan datos para ingresar la nueva ficha.");
            }
        } catch (error) {
            console.log(error);
            return toast.error("Ha ocurrido un error en el servidor, Contacte a soporte tecnico de Medify");
        }
    }

    async function buscarPacientePorId(id_paciente) {
        try {
            if (!id_paciente) {
                return toast.error(
                    "No se puede cargar los datos del paciente seleccionado. Debe haber seleccionado el paciente para poder ver el detalle de los datos."
                );
            }

            const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({id_paciente}),
            });

            if (!res.ok) {
                return toast.error("No se puede cargar los datos del paciente seleccionado.");
            }

            const data = await res.json();
            setDataPaciente(Array.isArray(data) ? data : [data]);
        } catch (error) {
            console.log(error);
            return toast.error(
                "No se puede cargar los datos del paciente seleccionado. Por favor contacte a soporte de Medify"
            );
        }
    }

    useEffect(() => {
        if (!id_paciente) return;
        buscarPacientePorId(id_paciente);
        listarPlantillas();
    }, [id_paciente]);

    const paciente = dataPaciente[0] ?? null;

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

                {/* ── Header ── */}
                <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Fichas Clínicas</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Nueva Ficha Clínica</h1>
                    <p className="mt-1 text-[13px] text-slate-500">Complete los campos para registrar la atención del paciente</p>
                </div>

                {/* ── Acciones ── */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => retroceder(id_paciente)}
                        className="w-full rounded-xl sm:w-auto"
                    >
                        <svg data-icon="inline-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        Volver
                    </Button>

                    <Button asChild size="lg" className="w-full rounded-xl bg-black text-white shadow-sm hover:bg-slate-800 sm:w-auto">
                        <Link href="/dashboard">
                            <svg data-icon="inline-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            Volver al Panel de Reservas
                        </Link>
                    </Button>
                </div>

                {/* ── Tarjeta del paciente ── */}
                {paciente && (
                    <Accordion
                        type="single"
                        collapsible
                        className="mb-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.65)]"
                    >
                        <AccordionItem value="datos-paciente" className="border-0">
                            {/* Identidad */}
                            <AccordionTrigger className="relative items-center overflow-hidden rounded-none bg-white px-4 py-4 no-underline hover:no-underline sm:px-5">
                            <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#6E56CF] text-sm font-bold text-white shadow-md shadow-violet-200">
                                {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                            </div>
                            <div className="relative min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">{paciente.nombre} {paciente.apellido}</p>
                                    <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#6E56CF]">
                                        ID #{paciente.id_paciente}
                                    </span>
                                </div>
                                <p className="mt-1 font-mono text-[11px] text-slate-500">RUT {formatRut(paciente.rut)}</p>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                            {/* Datos rápidos */}
                            <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: "Teléfono",   value: paciente.telefono },
                                { label: "Correo",     value: paciente.correo },
                                { label: "Apoderado",  value: paciente.apoderado },
                                { label: "RUT apoderado", value: paciente.apoderado_rut },
                            ].map(({ label, value }) => (
                                <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_4px_12px_-10px_rgba(15,23,42,0.35)]">
                                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                                    <p className="break-words text-[12px] font-semibold leading-snug text-slate-700">{value || "No registrado"}</p>
                                </div>
                            ))}
                            </div>
                            {/* Antecedentes */}
                            {(paciente.medicamentosUsados || paciente.habitos || paciente.comentariosAdicionales) && (
                                <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-white p-3 md:grid-cols-3">
                                {[
                                    { label: "Medicamentos usados",     value: paciente.medicamentosUsados },
                                    { label: "Hábitos",                 value: paciente.habitos },
                                    { label: "Comentarios adicionales", value: paciente.comentariosAdicionales },
                                ].map(({ label, value }) => value ? (
                                    <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                                        <p className="whitespace-pre-wrap break-words text-[12px] leading-snug text-slate-700">{value}</p>
                                    </div>
                                ) : null)}
                                </div>
                            )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}

                {/* ── Formulario de ficha ── */}
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.65)]">

                    {/* Sección: Información de la consulta */}
                    <div className="relative flex items-center gap-2.5 overflow-hidden border-b border-slate-100 bg-white px-4 py-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] text-white shadow-md shadow-violet-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Información de la consulta</h2>
                            <p className="mt-0.5 text-[10px] text-slate-500">Completa los datos esenciales antes de registrar la ficha.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 p-3.5 sm:p-4">
                        {/* Selector de plantilla */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Plantilla de ficha <span className="text-red-400 normal-case">*</span>
                            </label>
                            <select
                                value={idPlantilla}
                                onChange={(e) => seleccionarPlantilla(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 scheme-light transition-all focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-100"
                            >
                                <option value="">Seleccione una plantilla...</option>
                                {plantillas.map((p) => (
                                    <option key={p.id_plantilla} value={p.id_plantilla}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha + Profesional */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="relative overflow-hidden rounded-xl border-2 border-violet-200 bg-white p-3 shadow-[0_10px_24px_-20px_rgba(109,40,217,0.7)]">
                                <div className="relative flex items-start justify-between gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E56CF]">
                                            Fecha de consulta <span className="text-rose-500">*</span>
                                        </label>
                                        <p className="mt-0.5 text-[9px] text-slate-500">Selecciona la fecha de la atención.</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-[#6E56CF] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm">
                                        Obligatoria
                                    </span>
                                </div>
                                <div className="relative mt-2 [&_[data-slot=button]]:h-9 [&_[data-slot=button]]:w-full [&_[data-slot=button]]:rounded-lg [&_[data-slot=label]]:hidden">
                                    <ShadcnDatePicker label="" value={fechaConsulta} onChange={(fecha) => setFechaConsulta(fecha)} />
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Profesional a cargo</label>
                                <p className="mb-2 mt-0.5 text-[9px] text-slate-400">Indica quién realizó la atención.</p>
                                <ShadcnInput
                                    value={observacionesPrecio}
                                    placeholder="Ej: Dra. Andrea Morán"
                                    onChange={(e) => setObservacionesPrecio(e.target.value)}
                                    className="h-9 rounded-lg border-slate-200 bg-white text-[12px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campos dinámicos de la plantilla */}
                    {plantillaCompleta && plantillaCompleta.categorias.map(categoria => (
                        <div key={categoria.id_categoria}>
                            <div className="flex items-center gap-3 border-t border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                                    </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">{categoria.nombre}</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                {categoria.campos.map(campo => (
                                    <div key={campo.id_campo}>
                                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                            {campo.nombre}
                                            {campo.requerido === 1 && <span className="text-red-400 ml-1 normal-case">*</span>}
                                        </label>
                                        <Textarea
                                            className="min-h-[100px] resize-y border-slate-200 focus:border-[#6E56CF] focus:ring-violet-100"
                                            value={datosDinamicos[campo.id_campo] || ""}
                                            onChange={(e) => setDatosDinamicos(prev => ({ ...prev, [campo.id_campo]: e.target.value }))}
                                            placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Estado vacío: sin plantilla seleccionada */}
                    {!plantillaCompleta && (
                        <div className="border-t border-slate-100 p-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Seleccione una plantilla para ver los campos del formulario</p>
                            <p className="mt-1 text-xs text-slate-400">La plantilla determina qué datos clínicos se registrarán en esta ficha</p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 px-6 py-5 bg-slate-50/50">
                        <Link href="/dashboard/FichaClinica">
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                                Cancelar
                            </button>
                        </Link>
                        <button
                            onClick={() => insertarFicha()}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Guardar Ficha Clínica
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
