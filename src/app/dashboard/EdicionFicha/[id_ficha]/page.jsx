"use client"

import {Textarea} from "@/components/ui/textarea";
import {useState, useEffect} from "react";
import {useParams} from "next/navigation";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from "react-hot-toast";
import {ShadcnInput} from "@/Componentes/shadcnInput2";
import {useRouter} from "next/navigation";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";

function parsearDatosDinamicos(datos) {
    if (!datos) return null
    if (typeof datos === "string") {
        try { return JSON.parse(datos) } catch { return null }
    }
    return typeof datos === "object" ? datos : null
}

function agruparPorCategoria(datos) {
    const categoriasMap = {}
    Object.keys(datos).forEach(key => {
        if (key === "_plantillaNombre") return
        const entry = datos[key]
        if (!entry || typeof entry !== "object" || !entry.nombreCategoria) return
        const catNombre = entry.nombreCategoria
        if (!categoriasMap[catNombre]) {
            categoriasMap[catNombre] = { nombre: catNombre, orden: entry.categoriaOrden || 0, campos: [] }
        }
        categoriasMap[catNombre].campos.push({ nombre: entry.nombreCampo, valor: entry.valor, orden: entry.campoOrden || 0 })
    })
    return Object.values(categoriasMap)
        .sort((a, b) => a.orden - b.orden)
        .map(cat => ({ ...cat, campos: cat.campos.sort((a, b) => a.orden - b.orden) }))
}

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

export default function EdicionFichaClinica() {
    const {id_ficha} = useParams();
    const [dataFicha, setdataFicha] = useState([]);

    // Campos legacy (para fichas sin plantilla)
    const [tipoAtencion, settipoAtencion] = useState("");
    const [anotacionConsulta, setanotacionConsulta] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [diagnostico, setDiagnostico] = useState("");
    const [indicaciones, setIndicaciones] = useState("");
    const [fechaConsulta, setFechaConsulta] = useState("");

    // Plantilla dinámica
    const [plantillas, setPlantillas] = useState([])
    const [idPlantilla, setIdPlantilla] = useState(null)
    const [plantillaCompleta, setPlantillaCompleta] = useState(null)
    const [datosDinamicos, setDatosDinamicos] = useState({})

    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    function retroceder(id_paciente) {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    function formatearFecha(fecha) {
        if (!fecha) {
            return null;
        } else {
            const date = new Date(fecha);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1);
            const day = String(date.getDate());
            return `${day}-${month}-${year}`;
        }
    }

    async function listarPlantillas() {
        try {
            const res = await fetch(`${API}/fichaPlantilla/listarPlantillas`)
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data)) setPlantillas(data)
        } catch (error) {
            console.log(error)
        }
    }

    async function cargarPlantillaCompleta(id_plantilla) {
        try {
            const res = await fetch(`${API}/fichaPlantilla/obtenerPlantillaCompleta`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_plantilla})
            })

            if (!res.ok) return

            const filas = await res.json()
            const estructura = transformarPlantilla(filas)
            setPlantillaCompleta(estructura)
        } catch (error) {
            console.log(error)
        }
    }

    async function seleccionarPlantilla(id_plantilla) {
        setIdPlantilla(id_plantilla || null)
        setDatosDinamicos({})
        setPlantillaCompleta(null)
        if (!id_plantilla) return
        await cargarPlantillaCompleta(id_plantilla)
    }

    async function actualizarFicha() {
        try {
            if (!id_ficha) {
                return toast.error('Falta el identificador de la ficha');
            }

            if (!idPlantilla) {
                return toast.error('Debe seleccionar una plantilla');
            }

            if (!plantillaCompleta) {
                return toast.error('Espere a que se cargue la plantilla');
            }

            // Validar campos requeridos
            {
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

                // Construir datosDinamicos enriquecido
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

                const res = await fetch(`${API}/ficha/editarFichaPaciente`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        tipoAtencion: "",
                        motivoConsulta: "",
                        signosVitales: "",
                        observaciones,
                        anotacionConsulta: "",
                        anamnesis: "",
                        diagnostico: "",
                        indicaciones: "",
                        archivosAdjuntos: "",
                        fechaConsulta,
                        consentimientoFirmado: "",
                        id_plantilla: idPlantilla,
                        datosDinamicos: datosEnriquecidos,
                        id_ficha
                    }),
                    mode: "cors",
                    cache: "no-cache"
                });

                if (!res.ok) {
                    return toast.error("Ha ocurrido un error en la respuesta del servidor, Contacte a soporte");
                }

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    await seleccionarFichaEspecifica(id_ficha)
                    return toast.success("Ficha Clinica Actualizada!");
                } else {
                    return toast.error('No ha sido posible actualizar la ficha clinica!')
                }
            }
        } catch (error) {
            return toast.error("Ha ocurrido un error, Contacte a soporte");
        }
    }

    async function seleccionarFichaEspecifica(id_ficha) {
        try {
            const res = await fetch(`${API}/ficha/seleccionarFichaID`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_ficha}),
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("No es posible ejecutar la consulta desde la base de datos cotacte a soporte");
            } else {
                const dataFichasClinicas = await res.json();
                if (Array.isArray(dataFichasClinicas)) {
                    setdataFicha(dataFichasClinicas);
                    if (dataFichasClinicas.length > 0) {
                        const f = dataFichasClinicas[0];
                        setObservaciones(f.observaciones || "");
                        setFechaConsulta(f.fechaConsulta || "");

                        if (f.id_plantilla) {
                            // Ficha con plantilla dinámica
                            setIdPlantilla(f.id_plantilla)
                            let datosRaw = {}
                            if (f.datosDinamicos) {
                                try {
                                    datosRaw = typeof f.datosDinamicos === "string" ? JSON.parse(f.datosDinamicos) : f.datosDinamicos
                                } catch (e) {
                                    datosRaw = {}
                                }
                            }
                            // Extraer solo los valores para el formulario
                            const datosSimples = {}
                            Object.keys(datosRaw).forEach(key => {
                                if (key === "_plantillaNombre") return
                                const entry = datosRaw[key]
                                datosSimples[key] = typeof entry === "object" && entry !== null ? entry.valor || "" : entry || ""
                            })
                            setDatosDinamicos(datosSimples)
                            await cargarPlantillaCompleta(f.id_plantilla)
                        } else {
                            // Ficha legacy
                            settipoAtencion(f.tipoAtencion || "");
                            setanotacionConsulta(f.anotacionConsulta || "");
                            setDiagnostico(f.diagnostico || "");
                            setIndicaciones(f.indicaciones || "");
                        }
                    }
                } else {
                    return toast.error("No se encuentras fichas clinicas disponibles con el id seleccionado");
                }
            }
        } catch (err) {
            return toast.error("Ha ocurrido un error, Contacte a soporte");
        }
    }

    useEffect(() => {
        seleccionarFichaEspecifica(id_ficha)
        listarPlantillas()
    }, [])

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>

            <div className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Edición de Ficha Clínica</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {dataFicha.map((ficha) => (
                            <button
                                key={ficha.id_paciente ?? ficha.id_ficha}
                                onClick={() => retroceder(ficha.id_paciente)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                                Volver
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Datos actuales de la ficha ── */}
                {dataFicha.map((ficha) => (
                    <div key={ficha.id_ficha} className="mb-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">Datos Actuales</h2>
                                    <p className="text-[11px] text-slate-400 font-medium">Ficha #{ficha.id_ficha}</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-[12px] font-bold text-[#6E56CF]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                {formatearFecha(ficha.fechaConsulta)}
                            </span>
                        </div>

                        <div className="p-6">
                            {(() => {
                                const datos = parsearDatosDinamicos(ficha.datosDinamicos)
                                const plantillaNombre = datos?._plantillaNombre
                                return (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2 mb-5">
                                            {plantillaNombre ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-semibold text-[#6E56CF]">
                                                    <span className="text-slate-400 font-medium">Plantilla:</span> {plantillaNombre}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-semibold text-[#6E56CF]">
                                                    <span className="text-slate-400 font-medium">Motivo:</span> {ficha.tipoAtencion || '-'}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                                                <span className="text-slate-400 font-medium">Profesional:</span> {ficha.observaciones || '-'}
                                            </span>
                                        </div>

                                        {datos && plantillaNombre ? (
                                            <div className="space-y-4">
                                                {agruparPorCategoria(datos).map(categoria => (
                                                    <div key={categoria.nombre}>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{categoria.nombre}</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {categoria.campos.map((campo, idx) => (
                                                                <div key={idx} className="flex flex-col gap-0.5 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{campo.nombre}</span>
                                                                    <span className="text-[13px] font-medium text-slate-700 whitespace-pre-line">{campo.valor}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[13px] text-slate-400">Ficha sin plantilla asociada.</p>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                ))}

                {/* ── Formulario de edición ── */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Actualizar Información</h2>
                            <p className="text-[11px] text-slate-400 font-medium">Selecciona plantilla y completa los campos</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">

                        {/* Selector de Plantilla */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Plantilla de Ficha <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={idPlantilla || ""}
                                onChange={(e) => seleccionarPlantilla(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6E56CF]/30 focus:border-[#6E56CF] transition-all"
                            >
                                <option value="">Seleccione una plantilla...</option>
                                {plantillas.map((p) => (
                                    <option key={p.id_plantilla} value={p.id_plantilla}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha + Profesional */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Consulta</label>
                                <ShadcnDatePicker
                                    label=""
                                    value={fechaConsulta}
                                    onChange={(fecha) => setFechaConsulta(fecha)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Profesional</label>
                                <ShadcnInput
                                    value={observaciones}
                                    placeholder="Ej: Dra. Andrea Moran"
                                    onChange={e => setObservaciones(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campos dinámicos de la plantilla */}
                    {idPlantilla && plantillaCompleta && plantillaCompleta.categorias.map(categoria => (
                        <div key={categoria.id_categoria}>
                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#6E56CF]" />
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{categoria.nombre}</span>
                            </div>

                            <div className="p-6 space-y-5">
                                {categoria.campos.map(campo => (
                                    <div key={campo.id_campo} className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                            {campo.nombre}
                                            {campo.requerido === 1 && <span className="text-rose-400 ml-1">*</span>}
                                        </label>
                                        <Textarea
                                            className="min-h-[100px] resize-y rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-[#6E56CF]/20 text-[13px]"
                                            value={datosDinamicos[campo.id_campo] || ""}
                                            onChange={(e) => setDatosDinamicos(prev => ({
                                                ...prev,
                                                [campo.id_campo]: e.target.value
                                            }))}
                                            placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Formulario legacy (fichas sin plantilla) */}
                    {!idPlantilla && (
                        <>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Motivo de Consulta</label>
                                    <ShadcnInput
                                        value={tipoAtencion}
                                        placeholder="Ej: Seguimiento, Tratamiento, Evaluación..."
                                        onChange={e => settipoAtencion(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#6E56CF]" />
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Diagnóstico e Indicaciones</span>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Diagnóstico</label>
                                    <ShadcnInput
                                        value={diagnostico}
                                        placeholder="Ej: Caries dental activa en molar 3.6 (lesión oclusal)"
                                        onChange={e => setDiagnostico(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Indicaciones</label>
                                    <ShadcnInput
                                        value={indicaciones}
                                        placeholder="Ej: Cepillado suave 3 veces al día + hilo dental nocturno"
                                        onChange={e => setIndicaciones(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#6E56CF]" />
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Anotaciones Clínicas</span>
                            </div>

                            <div className="p-6">
                                <Textarea
                                    className="min-h-[140px] resize-none rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-[#6E56CF]/20 text-[13px]"
                                    value={anotacionConsulta}
                                    onChange={(e) => setanotacionConsulta(e.target.value)}
                                    placeholder="Ej: Odontograma: 3.6 caries O; se realiza resina; anestesia local; se indican cuidados y control en 7 días."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* ── Botones de acción ── */}
                <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    {dataFicha.map((ficha) => (
                        <button
                            key={ficha.id_paciente ?? ficha.id_ficha}
                            onClick={() => retroceder(ficha.id_paciente)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                            Cancelar
                        </button>
                    ))}
                    <button
                        onClick={() => actualizarFicha()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 shadow-sm transition-all active:scale-[0.98]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Actualizar Ficha
                    </button>
                </div>

            </div>
        </div>
    )
}
