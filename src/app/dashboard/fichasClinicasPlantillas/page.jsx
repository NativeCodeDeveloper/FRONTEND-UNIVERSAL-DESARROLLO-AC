"use client"

import {useEffect, useState} from "react"
import {toast} from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import {useRouter} from "next/navigation";

export default function FichasClinicasPlantillas() {

    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    // =============================================
    // ESTADOS
    // =============================================
    const [plantillas, setPlantillas] = useState([])

    // Modal nueva plantilla
    const [modalPlantilla, setModalPlantilla] = useState(false)
    const [nuevaPlantillaNombre, setNuevaPlantillaNombre] = useState("")
    const [nuevaPlantillaDescripcion, setNuevaPlantillaDescripcion] = useState("")

    // Modal editar plantilla
    const [modalEditarPlantilla, setModalEditarPlantilla] = useState(false)
    const [plantillaEditando, setPlantillaEditando] = useState(null)
    const [id_plantillaEditing, setId_plantillaEditing] = useState(null)
    const [mostrarGuia, setMostrarGuia] = useState(false)

    // =============================================
    // HANDLERS
    // =============================================
    function abrirModalNuevaPlantilla() {
        setNuevaPlantillaNombre("")
        setNuevaPlantillaDescripcion("")
        setModalPlantilla(true)
    }

    function abrirModalEditarPlantilla(plantilla) {
        setPlantillaEditando(plantilla);
        setId_plantillaEditing(plantilla.id_plantilla);
        setNuevaPlantillaNombre(plantilla.nombre);
        setNuevaPlantillaDescripcion(plantilla.descripcion);
        setModalEditarPlantilla(true);
    }

  async function insertarNuevaPlantilla(nombre,descripcion) {
        try {
            if (!nombre || !descripcion) {
                return toast.error(`Debe completar todos los campos para ingresar una nueva plantilla.`);
            }
            const res = await fetch(`${API}/fichaPlantilla/insertarPlantilla`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({nombre, descripcion})
            })
        if (!res.ok) {
            return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
        }
        const respuestaBackend = await res.json();
        if (respuestaBackend.message === true) {
            await limpiarFormularioIngreso();
            return toast.success(`Se ha ingresado correctamente una nueva plantilla de fichas clinicas.`);
        }else if (respuestaBackend.message === false) {
            return toast.error(`Ha ocurrido un error en el servidor. Informacion recibida no es correcta`);
        }else{
            return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
        }
        }catch(err) {
            console.log(err);
            return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
        }
    }

    async function editarPlantilla(nombre,descripcion, id_plantilla) {
        try {
            if (!nombre || !descripcion || !id_plantilla) {
                return toast.error(`Debe completar todos los campos para ingresar una nueva plantilla.`);
            }
            const res = await fetch(`${API}/fichaPlantilla/actualizarPlantilla`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({nombre, descripcion ,id_plantilla})
            })
            if (!res.ok) {
                return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
            }
            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await limpiarFormularioIngreso();
                return toast.success(`Se ha actualizado correctamente plantilla.`);
            }else if (respuestaBackend.message === false) {
                return toast.error(`Ha ocurrido un error en el servidor. Informacion recibida no es correcta`);
            }else{
                return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
            }
        }catch(err) {
            console.log(err);
            return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
        }
    }

    async function eliminarPlantilla(id_plantilla) {
        try {
            if (!id_plantilla) {
                return toast.error(`Debe seleccionar una platilla para eliminarla.`);
            }
            const res = await fetch(`${API}/fichaPlantilla/eliminarPlantilla`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_plantilla})
            })
            if (!res.ok) {
                return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
            }
            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await limpiarFormularioIngreso();
                return toast.success(`Se ha eliminado correctamente plantilla.`);
            }else if (respuestaBackend.message === false) {
                return toast.error(`Ha ocurrido un error en el servidor. Informacion recibida no es correcta`);
            }else{
                return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
            }
        }catch(err) {
            console.log(err);
            return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte.`);
        }
    }

    function seleccionarPlantilla(plantilla) {
        // TODO: Navegar a detalle o abrir categorías/campos
    }

    // =============================================
    // FETCH
    // =============================================
    async function listarPlantillas(){
        try {
            const res = await fetch(`${API}/fichaPlantilla/listarPlantillas`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            })
            const respuestaDataBackend = await res.json();
            if (Array.isArray(respuestaDataBackend) && respuestaDataBackend.length > 0) {
                setPlantillas(respuestaDataBackend)
            } else {
                setPlantillas([])
            }
        } catch(err) {
            console.log(err);
            return toast.error(`Ha ocurrido un problema contacte al equipo de soporte`);
        }
    }

    useEffect(() => {
        listarPlantillas()
    },[])


    async function limpiarFormularioIngreso(){
        await listarPlantillas();
        setNuevaPlantillaNombre("");
        setNuevaPlantillaDescripcion("");
    }


    function irACategoriaPlatilla(id_plantilla) {
        router.push(`/dashboard/fichasClinicasCategorias/${id_plantilla}`);
    }
    // =============================================
    // RENDER
    // =============================================
    return (
        <div className="min-h-screen bg-[#FAFAFB]">
<ToasterClient/>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

                {/* ========== HEADER ========== */}
                <div className="mb-8 sm:mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuraci&oacute;n</p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                                Plantillas de Ficha Cl&iacute;nica
                            </h1>
                            <p className="mt-1 text-[13px] text-slate-500 max-w-lg">
                                Crea y administra las plantillas que usar&aacute;n los profesionales al registrar fichas cl&iacute;nicas.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirModalNuevaPlantilla}
                            className="group inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-[#6E56CF] hover:bg-[#5B47B0] active:scale-[0.98] transition-all duration-150 shadow-sm self-start sm:self-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 transition-transform duration-200 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            Nueva Plantilla
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => setMostrarGuia((prev) => !prev)}
                        className="group inline-flex w-full items-center justify-between gap-4 rounded-[32px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#6E56CF]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 1.918-2 3.522-2 2.071 0 3.75 1.343 3.75 3 0 1.235-.934 2.296-2.267 2.75-.827.282-1.483 1.02-1.483 1.894V15m0 3h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-900">¿C&oacute;mo creo una Ficha?</p>
                                <p className="text-sm text-slate-600">Abre esta ayuda para ver los pasos recomendados.</p>
                            </div>
                        </div>

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`size-5 flex-shrink-0 text-slate-500 transition-transform duration-200 ${mostrarGuia ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {mostrarGuia && (
                        <div className="mt-3 rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-2xl">
                                    <div className="inline-flex items-center gap-2 rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E56CF]">
                                        <span className="size-2 rounded-full bg-[#6E56CF]" />
                                        Gu&iacute;a R&aacute;pida
                                    </div>
                                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                                        C&oacute;mo crear fichas cl&iacute;nicas personalizadas
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Esta secci&oacute;n te permite armar plantillas para cada especialidad o tipo de atenci&oacute;n. No necesitas conocimientos t&eacute;cnicos: primero creas la plantilla y luego agregas sus categor&iacute;as y campos.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-800">Consejo pr&aacute;ctico</p>
                                    <p className="mt-1 leading-6">
                                        Piensa en la ficha como un formulario que el profesional completar&aacute; durante la atenci&oacute;n.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#EDE9FE] text-sm font-bold text-[#6E56CF]">1</div>
                                        <h3 className="text-sm font-semibold text-slate-900">Crear la plantilla</h3>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Pulsa <span className="font-semibold text-slate-800">&quot;Nueva Plantilla&quot;</span> y escribe un nombre claro, por ejemplo: <span className="font-medium text-slate-700">&quot;Evaluaci&oacute;n Nutricional&quot;</span> o <span className="font-medium text-slate-700">&quot;Primera Atenci&oacute;n Psicol&oacute;gica&quot;</span>.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#EDE9FE] text-sm font-bold text-[#6E56CF]">2</div>
                                        <h3 className="text-sm font-semibold text-slate-900">Describir su uso</h3>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        En la descripci&oacute;n, explica para qu&eacute; servir&aacute; la ficha. Eso ayuda a que otros usuarios sepan cu&aacute;ndo usarla y evita crear plantillas duplicadas.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#EDE9FE] text-sm font-bold text-[#6E56CF]">3</div>
                                        <h3 className="text-sm font-semibold text-slate-900">Entrar a configurar</h3>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Luego pulsa <span className="font-semibold text-slate-800">&quot;Seleccionar&quot;</span>. Ah&iacute; podr&aacute;s ordenar la ficha por secciones, como <span className="font-medium text-slate-700">Antecedentes</span>, <span className="font-medium text-slate-700">Motivo de consulta</span> o <span className="font-medium text-slate-700">Indicaciones</span>.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#EDE9FE] text-sm font-bold text-[#6E56CF]">4</div>
                                        <h3 className="text-sm font-semibold text-slate-900">Agregar campos &uacute;tiles</h3>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Dentro de cada secci&oacute;n, agrega solo la informaci&oacute;n que el profesional realmente necesita registrar. Mantener la ficha simple mejora el uso diario.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">Buenas pr&aacute;cticas para usuarios no t&eacute;cnicos</h3>
                                <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
                                    <p><span className="font-semibold text-slate-800">Usa nombres simples:</span> evita abreviaturas internas si varias personas usar&aacute;n la ficha.</p>
                                    <p><span className="font-semibold text-slate-800">Piensa en el flujo real:</span> ordena las secciones como ocurre la atenci&oacute;n.</p>
                                    <p><span className="font-semibold text-slate-800">No sobrecargues:</span> si un dato casi nunca se usa, probablemente no deba ir en la plantilla base.</p>
                                    <p><span className="font-semibold text-slate-800">Revisa antes de duplicar:</span> si ya existe una plantilla parecida, ed&iacute;tala en vez de crear otra muy similar.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========== LISTA DE PLANTILLAS ========== */}
                <div className="space-y-3 sm:space-y-4">

                    {/* Empty state */}
                    {plantillas.length === 0 && (
                        <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
                            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#DDD6FE] bg-[#F3F0FF]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                            </div>
                            <p className="text-slate-600 text-sm font-medium">No hay plantillas creadas todav&iacute;a</p>
                            <p className="text-slate-400 text-xs mt-1.5">Haz clic en &quot;Nueva Plantilla&quot; para crear la primera.</p>
                        </div>
                    )}

                    {plantillas.map((plantilla) => (
                        <div
                            key={plantilla.id_plantilla}
                            className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4">

                                {/* Info de la plantilla */}
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{plantilla.nombre}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">{plantilla.descripcion}</p>
                                    </div>
                                </div>

                                {/* Botones de accion */}
                                <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pl-14 sm:pl-0">
                                    <button
                                        type="button"
                                        onClick={() => irACategoriaPlatilla(plantilla.id_plantilla)}
                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#6E56CF] px-3 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#5B47B0] active:scale-[0.97] sm:h-9 sm:px-4"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                        <span>Seleccionar</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => abrirModalEditarPlantilla(plantilla)}
                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.97] sm:h-9 sm:px-3.5"
                                        title="Editar plantilla"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                        </svg>
                                        <span className="hidden sm:inline">Editar</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => eliminarPlantilla(plantilla.id_plantilla)}
                                        className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs font-medium text-red-500 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 active:scale-[0.97] transition-all duration-150"
                                        title="Eliminar plantilla"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                        <span className="hidden sm:inline">Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========== MODAL: NUEVA PLANTILLA ========== */}
            {modalPlantilla && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar modal de nueva plantilla"
                        className="fixed inset-0 bg-slate-950/35"
                        onClick={() => setModalPlantilla(false)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                        {/* Header */}
                        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-[#EDE9FE]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">Nueva Plantilla</h3>
                                </div>
                                <p className="text-sm text-slate-500">Define el nombre y descripci&oacute;n de la plantilla</p>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="nueva-plantilla-nombre" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Nombre</label>
                                <input
                                    id="nueva-plantilla-nombre"
                                    aria-label="Nombre de la nueva plantilla"
                                    type="text"
                                    value={nuevaPlantillaNombre}
                                    onChange={(e) => setNuevaPlantillaNombre(e.target.value)}
                                    placeholder="Ej: Dermatolog&iacute;a, Pediatr&iacute;a..."
                                    className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-[#6E56CF] transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="nueva-plantilla-descripcion" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Descripci&oacute;n</label>
                                <textarea
                                    id="nueva-plantilla-descripcion"
                                    aria-label="Descripción de la nueva plantilla"
                                    value={nuevaPlantillaDescripcion}
                                    onChange={(e) => setNuevaPlantillaDescripcion(e.target.value)}
                                    placeholder="Descripci&oacute;n breve de para qu&eacute; sirve esta plantilla..."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-[#6E56CF] transition-all resize-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
                            <button
                                type="button"
                                onClick={() => setModalPlantilla(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-[0.97] transition-all duration-150"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={()=> insertarNuevaPlantilla(nuevaPlantillaNombre,nuevaPlantillaDescripcion)}
                                className="px-5 py-2 text-sm font-semibold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5B47B0] active:scale-[0.97] transition-all duration-150 shadow-sm"
                            >
                                Crear Plantilla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MODAL: EDITAR PLANTILLA ========== */}
            {modalEditarPlantilla && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar modal de editar plantilla"
                        className="fixed inset-0 bg-slate-950/35"
                        onClick={() => setModalEditarPlantilla(false)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                        {/* Header */}
                        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-[#EDE9FE]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">Editar Plantilla</h3>
                                </div>
                                <p className="text-sm text-slate-500">Modifica el nombre o descripci&oacute;n</p>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="editar-plantilla-nombre" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Nombre</label>
                                <input
                                    id="editar-plantilla-nombre"
                                    aria-label="Nombre de la plantilla"
                                    type="text"
                                    value={nuevaPlantillaNombre}
                                    onChange={(e) => setNuevaPlantillaNombre(e.target.value)}
                                    className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-[#6E56CF] transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="editar-plantilla-descripcion" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Descripci&oacute;n</label>
                                <textarea
                                    id="editar-plantilla-descripcion"
                                    aria-label="Descripción de la plantilla"
                                    value={nuevaPlantillaDescripcion}
                                    onChange={(e) => setNuevaPlantillaDescripcion(e.target.value)}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-[#6E56CF] transition-all resize-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
                            <button
                                type="button"
                                onClick={() => setModalEditarPlantilla(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-[0.97] transition-all duration-150"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={()=>  editarPlantilla(nuevaPlantillaNombre,nuevaPlantillaDescripcion,id_plantillaEditing)}
                                className="px-5 py-2 text-sm font-semibold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5B47B0] active:scale-[0.97] transition-all duration-150 shadow-sm"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
