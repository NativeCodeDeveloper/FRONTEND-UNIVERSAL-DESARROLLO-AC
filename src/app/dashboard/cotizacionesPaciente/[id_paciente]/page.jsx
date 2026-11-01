"use client";

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import {useEffect, useState} from "react";
import { previsionDesdeId } from "@/lib/previsiones";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    ChevronRight,
    CircleDollarSign,
    ClipboardPlus,
    Clock3,
    FileText,
    Mail,
    Phone,
    Plus,
    Search,
    Stethoscope,
    Trash2,
    UserRound,
    X
} from "lucide-react";
import {toast, Toaster} from "react-hot-toast";
import formatearFecha from "@/FuncionesTranversales/funcionesTranversales.js";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import TutorialGuiadoCotizaciones from "@/Componentes/TutorialGuiadoCotizaciones";
import { edadCivil } from "@/lib/fechas";

// La edad vive en lib/fechas.js: `new Date(fechaNacimiento)` corria el dia de
// nacimiento y en la vispera del cumpleanios devolvia un anio de mas.
const calcularEdadPaciente = (fechaNacimiento) => edadCivil(fechaNacimiento);


function estadosLetra_interpretacion(estado_backend){
    switch (estado_backend) {
        case 1:
            return { etiqueta: "Activa", clases: "bg-[#007AFF]/10 text-[#0062CC]" }
        case 2:
            return { etiqueta: "Tratamiento en curso", clases: "bg-[#5856D6]/10 text-[#3634A3]" }
        case 3:
            return { etiqueta: "Tratamiento finalizado", clases: "bg-[#34C759]/12 text-[#248A3D]" }
        case 4:
            return { etiqueta: "Tratamiento abandonado", clases: "bg-[#F2F2F7] text-[#6E6E73]" }
        default:
            return { etiqueta: "Sin estado", clases: "bg-[#F2F2F7] text-[#8E8E93]" }
    }
}

function formatearMonto(valor) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearFechaHora(fechaISO) {
    if (!fechaISO) return "";

    // fecha-ok: es un instante con hora, no un dia del calendario.
    return new Date(fechaISO).toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Santiago"
    });
}



   export default function CotizacionesPaciente() {


    const API = process.env.NEXT_PUBLIC_API_URL;


    const {id_paciente} = useParams();
    const router = useRouter();

    //Estado para almacenar la información de la tabla Cotizacion Data Paciente\
    const[cotizacionesPaciente, setCotizacionesPaciente] = useState([])

    // Controla si el formulario visual de una nueva cotización está visible.
    const [mostrarFormularioCotizacion, actualizarVisibilidadFormulario] = useState(false);



    function volverACarpetaClinica() {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    async function buscarPaciente(id_paciente) {
        try {

            const res = await fetch(`${API}/cotizacionPaciente/seleccionar_cotizaciones_paciente`,{
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id_paciente
                }),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error(`No se ha podido cargar los datos del paciente`);
            }

            const dataCotizaciones_paciente = await res.json();
            setCotizacionesPaciente(dataCotizaciones_paciente);

        }catch (error) {
            console.log(error);
            return toast.error(error.message);
        }
    }


    const [nombre_cotizacion, setNombre_cotizacion] = useState("");
    const [profesional_solicitante_nombre, setProfesional_solicitante_nombre] = useState("");


    async function crearNuevaCotizacion(
        nombre_cotizacion,
        profesional_solicitante_nombre,
        id_paciente
        ) {
        try {

            const res = await fetch(`${API}/cotizacionPaciente/insertarCotizacion`,{
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_cotizacion,
                    profesional_solicitante_nombre,
                    total_presupuesto_cotizado : 0,
                    id_paciente
                }),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error(`No se ha podido crear nueva cotizacion`);
            }

            const respuestaBackend = await res.json();

            if (respuestaBackend.message === true) {
                await buscarPaciente(id_paciente);
                setNombre_cotizacion("");
                actualizarVisibilidadFormulario(false);
                return toast.success(`Cotizacion Creada!`);
            }

            if (respuestaBackend.message === false) {
                return toast.error(`No se ha podido crear nueva Cotizacion`);
            }

            if (respuestaBackend.message === `sindata`) {
                return toast.error(`Faltan datos para crear la nueva cotizacion`);
            }

            else{
                return toast.error(`Ha ocurrido un error contacte a soporte`);
            }

        }catch (error) {
            console.log(error);
            return toast.error(`Ha ocurrido un error en servidor contacte a soporte`);
        }
    }



    useEffect(() => {
        buscarPaciente(id_paciente)
    },[id_paciente])



       const [profesionales, setProfesionales] = useState([]);
       async function buscarProfesionales() {
           try {

               const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`,{
                   method: "GET",
                   headers: {
                       Accept: "application/json"
                   },
                   mode  : "cors",
                   cache : "no-cache"
               })

               if (!res.ok) {
                   return toast.error(`No se ha podido encontrar profesionales en el sistema, Problema Interno`);
               }

               const dataProfesionales = await res.json();
               setProfesionales(dataProfesionales);

           }catch (error) {
               console.log(error);
               return toast.error(error.message);
           }
       }

       useEffect(() => {
           buscarProfesionales();
       },[])

       useEffect(() => {
           if (!profesional_solicitante_nombre && profesionales.length > 0) {
               setProfesional_solicitante_nombre(profesionales[0].nombreProfesional);
           }
       },[profesionales, profesional_solicitante_nombre])


       const [paciente, setPaciente] = useState([]);
       async function buscarDatosPacientes(id_paciente){
           try {
               const res = await fetch(`${API}/pacientes/pacientesEspecifico`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_paciente
                   }),
                   mode  : "cors",
                   cache : "no-cache"
               })

               if(!res.ok) {
                   return toast.error(`No se han podido cargar los datos del paciente, Sin respuesta del Servidor`);
               }

               const dataPaciente = await res.json();
               setPaciente(dataPaciente);


           }catch (error) {
               return toast.error(`No se han podido cargar los datos del paciente. Sin respuesta del Servidor`);
           }
       }

       useEffect(() => {
           buscarDatosPacientes(id_paciente)
       },[id_paciente])




       async function eliminarCotizacion(id_cotizacion_paciente){
           try {

               if(!id_cotizacion_paciente){
                   return toast.error(`Debe seleccionar una cotizacion para que esta sea eliminada`);
               }

               const res = await fetch(`${API}/cotizacionPaciente/eliminarCotizacion`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_cotizacion_paciente,
                   }),
                   mode  : "cors",
                   cache : "no-cache"
               })

               if(!res.ok) {
                   return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
               }

               const success = await res.json();

               if(success){
                   await  buscarPaciente(id_paciente);
                   return toast.success(`Cotizacion eliminada!`);
               }else{
                   return toast.error(`No se ha podido eliminar cotizacion. Intente mas tarde`);
               }
           }catch (error) {
               return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
           }
       }


       const [estado, setEstado] = useState("");
       async function seleccionarPorEstado(id_paciente,estado_cotizacion){
           try {
               if(!id_paciente || !estado_cotizacion){
                   return toast.error(`Debe seleccionar un estado para poder aplicar el filtro por estado`);
               }

               if(estado_cotizacion ==="todas" ){
                  await buscarPaciente(id_paciente);
                   return;
               }
               const res = await fetch(`${API}/cotizacionPaciente/seleccionar_cotizaciones_paciente_porEstado`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_paciente,
                       estado_cotizacion
                   }),
                   mode  : "cors",
                   cache : "no-cache"
                   })
               if(!res.ok) {
                   return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
               }
               const dataCotizaciones = await res.json();
               setCotizacionesPaciente(dataCotizaciones);
           }catch (error) {
               return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
           }
       }


       const [profesionalSimilitud, setProfesionalSimilitud] = useState("")
       async function buscarSimilitudProfesional(id_paciente,profesional_solicitante_nombre){

           if(!profesional_solicitante_nombre || profesional_solicitante_nombre===""){
              await buscarPaciente(id_paciente);
              return;
           }

           try {
               const res = await fetch(`${API}/cotizacionPaciente/seleccionar_cotizaciones_paciente_profesional`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_paciente,
                       profesional_solicitante_nombre
                   }),
                   mode  : "cors",
                   cache : "no-cache"
               })

               const data_busqueda_profesionales = await res.json();
               setCotizacionesPaciente(data_busqueda_profesionales);

           }catch (error) {
               return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
           }
       }






       async function cambiarEstado(
           estado_cotizacion,
           id_cotizacion_paciente
       ) {
           try {

               const res = await fetch(`${API}/cotizacionPaciente/actualizarEstado`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       estado_cotizacion,
                       id_cotizacion_paciente
                   }),
                   mode: "cors",
                   cache: "no-cache"
               })

               if (!res.ok) {
                   return toast.error(`No se ha podido actualizar el estado de la cotizacion`);
               }

               const respuestaActualizacion = await res.json();

               if (respuestaActualizacion.message === true) {
                   await buscarPaciente(id_paciente);
                   actualizarVisibilidadFormulario(false);
                   return toast.success(`Cotizacion Actualizada!`);
               }

               if (respuestaActualizacion.message === false) {
                   return toast.error(`Actualizar el estado de la cotizacion`);
               }

               if (respuestaActualizacion.message === `sindata`) {
                   return toast.error(`Faltan datos para actualizar la cotizacion`);
               }

               else{
                   return toast.error(`Ha ocurrido un error contacte a soporte`);
               }

           }catch (error) {
               console.log(error);
               return toast.error(`Ha ocurrido un error en servidor contacte a soporte`);
           }
       }



       return (
        <div className="min-h-screen bg-[#FAFAFB] text-slate-900">
            <Toaster></Toaster>
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={volverACarpetaClinica}
                            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/[0.06] text-slate-500 shadow-sm transition-colors hover:border-black/10 hover:bg-[#007AFF]/10 hover:text-[#007AFF]"
                            title="Volver a la carpeta clínica"
                            aria-label="Volver a la carpeta clínica"
                        >
                            <ArrowLeft className="h-4 w-4"/>
                        </button>
                        <div>
                            {
                                paciente?.map(paciente => {
                                    return (
                                        <h1 key={paciente.id_paciente} className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                                            Cotizaciones de {paciente.nombre}
                                        </h1>
                                    )
                                })
                            }
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-[52px] sm:pl-14 xl:pl-0">
                        <div className="flex h-14 min-w-[122px] flex-col justify-center rounded-lg bg-white ring-1 ring-black/[0.06] px-4 shadow-sm">
                            <span className="text-[12px] font-medium text-[#86868B]">Cotizaciones</span>
                            <span className="mt-1 text-sm font-bold leading-none text-slate-900">{cotizacionesPaciente.length} registros</span>
                        </div>

                        <TutorialGuiadoCotizaciones
                            etiqueta="Tutorial Guiado"
                            ariaLabel="Iniciar el tutorial guiado de las cotizaciones del paciente"
                            className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white ring-1 ring-black/[0.06] px-5 text-[13px] font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            claseIcono="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#007AFF]/10 text-[#007AFF]"
                        />

                        <button
                            type="button"
                            data-tour="cotizaciones-boton-nueva"
                            onClick={() => actualizarVisibilidadFormulario((actual) => !actual)}
                            className="flex h-14 items-center gap-2 rounded-full bg-[#007AFF] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC]"
                        >
                            {mostrarFormularioCotizacion ? <X className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
                            {mostrarFormularioCotizacion ? "Cerrar" : "Nueva cotización"}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-6">
                    <aside data-tour="cotizaciones-tarjeta-paciente" className="self-start overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm lg:sticky lg:top-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/30 p-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E5E5EA] text-base font-semibold text-[#6E6E73] ">
                                {paciente[0]?.nombre?.charAt(0) ?? ""}{paciente[0]?.apellido?.charAt(0) ?? ""}
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-[15px] font-bold leading-tight text-slate-900">
                                    {paciente[0]?.nombre} {paciente[0]?.apellido}
                                </h2>
                                <p className="mt-0.5 text-[10px] font-medium  text-slate-400">
                                    ID Paciente #{id_paciente}
                                </p>
                            </div>
                        </div>

                        {paciente.map((elemento, index) => (
                            <div key={index} className="space-y-4 p-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div className="space-y-0.5">
                                        <span className="text-[12px] font-medium text-[#86868B]">Nacimiento</span>
                                        <p className="text-[12px] font-semibold text-slate-700">{formatearFecha(elemento.nacimiento) || "-"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[12px] font-medium text-[#86868B]">Edad</span>
                                        <p className="text-[12px] font-semibold text-slate-700">{calcularEdadPaciente(elemento.nacimiento)} años</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[12px] font-medium text-[#86868B]">Previsión</span>
                                        <p className="text-[12px] font-semibold text-slate-700">{previsionDesdeId(elemento.prevision_id)}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[12px] font-medium text-[#86868B]">Sexo</span>
                                        <p className="text-[12px] font-semibold text-slate-700">{elemento.sexo || "-"}</p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                            <UserRound className="h-3.5 w-3.5"/>
                                        </div>
                                        <span className="font-mono text-[12px] text-slate-600">{elemento.rut || "No registrado"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                            <Phone className="h-3.5 w-3.5"/>
                                        </div>
                                        <span className="text-[12px] text-slate-600">{elemento.telefono || "No registrado"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                            <Mail className="h-3.5 w-3.5"/>
                                        </div>
                                        <span className="break-all text-[12px] leading-snug text-slate-600">{elemento.correo || "No registrado"}</span>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={volverACarpetaClinica}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#007AFF]/10 text-[14px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/15"
                                    >
                                        Ver carpeta clínica
                                    </button>
                                </div>
                            </div>
                        ))}
                    </aside>

                    <main className="min-w-0 space-y-5">
                        {mostrarFormularioCotizacion && (
                            <section className="overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-sm">
                                <div className="flex items-center gap-3 border-b border-black/[0.06] bg-[#007AFF]/[0.06]/60 px-5 py-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#007AFF] shadow-sm">
                                        <ClipboardPlus className="h-4 w-4"/>
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-bold text-slate-800">Nueva cotización</h2>
                                        <p className="text-[11px] text-slate-500">Borrador visual para el paciente seleccionado</p>
                                    </div>
                                </div>
                                <form
                                    className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_auto] xl:items-end"
                                    onSubmit={async (event) => {
                                        event.preventDefault();
                                        await crearNuevaCotizacion(
                                            nombre_cotizacion,
                                            profesional_solicitante_nombre,
                                            id_paciente
                                        );
                                    }}
                                >
                                    <label className="space-y-1.5">
                                        <span className="text-[12px] font-medium text-[#86868B]">Nombre de la cotización</span>
                                        <input
                                            value={nombre_cotizacion}
                                            onChange={(event) => setNombre_cotizacion(event.target.value)}
                                            required
                                            placeholder="Ej: Tratamiento preventivo"
                                            className="h-10 w-full rounded-lg bg-white ring-1 ring-black/[0.06] px-3 text-[13px] text-slate-700 outline-none transition focus:border-black/[0.08] focus:ring-2 focus:ring-[#007AFF]/15"
                                        />
                                    </label>
                                    <label className="space-y-1.5">
                                        <span className="text-[12px] font-medium text-[#86868B]">Profesional</span>
                                        <select
                                            value={profesional_solicitante_nombre}
                                            onChange={(event) => setProfesional_solicitante_nombre(event.target.value)}
                                            required
                                            className="h-10 w-full rounded-lg bg-white ring-1 ring-black/[0.06] px-3 text-[13px] text-slate-700 outline-none transition focus:border-black/[0.08] focus:ring-2 focus:ring-[#007AFF]/15"
                                        >
                                            {profesionales.map((profesional) => (
                                                <option key={profesional.id_profesional} value={profesional.nombreProfesional}>
                                                    {profesional.nombreProfesional}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <button
                                        type="submit"
                                        className="h-10 rounded-full bg-[#007AFF] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC]"
                                    >
                                        Crear Cotizacion
                                    </button>
                                </form>
                            </section>
                        )}

                        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <h2 className="mt-1 text-xl font-semibold text-[#1D1D1F]">Cotizaciones del paciente</h2>
                                <p className="mt-1 text-[12px] text-slate-500">
                                    {cotizacionesPaciente.length} cotizaciones registradas
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <label data-tour="cotizaciones-filtro-estado" className="min-w-0 sm:w-52">
                                    <span className="mb-1.5 block text-[12px] font-medium text-[#86868B]">Estado</span>
                                    <select
                                        // 1. Usamos e para capturar el valor seleccionado
                                        onChange={(e) => {
                                            const nuevoEstado = e.target.value;
                                             seleccionarPorEstado(id_paciente, nuevoEstado);
                                        }}
                                        defaultValue="todas"
                                        aria_label="Buscar cotizaciones por estado"
                                        className="h-10 w-full rounded-lg bg-white ring-1 ring-black/[0.06] px-3 text-[11px] font-bold text-slate-600 outline-none transition focus:border-black/[0.08] focus:ring-2 focus:ring-[#007AFF]/15"
                                    >
                                        <option value="todas">Todos los estados</option>
                                        <option value="1">Activa</option>
                                        <option value="2">Tratamiento en curso</option>
                                        <option value="3">Tratamiento finalizado</option>
                                    </select>
                                </label>

                                <label data-tour="cotizaciones-filtro-profesional" className="min-w-0 sm:w-72">
                                    <span className="mb-1.5 block text-[12px] font-medium text-[#86868B]">Profesional</span>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                                        <input
                                            value={profesionalSimilitud}
                                            onChange={(event) => {
                                                const valor = event.target.value;
                                                setProfesionalSimilitud(valor);
                                                buscarSimilitudProfesional(id_paciente,valor);
                                            }}

                                            type="search"
                                            placeholder="Buscar por profesional"
                                            aria-label="Buscar cotizaciones por profesional"
                                            className="h-10 w-full rounded-lg bg-white ring-1 ring-black/[0.06] pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-black/[0.08] focus:ring-2 focus:ring-[#007AFF]/15"
                                        />
                                    </div>
                                </label>
                            </div>
                        </section>

                        <div className="space-y-3">
                            {cotizacionesPaciente.map((cotizacion) => {
                                const estadoActual = estadosLetra_interpretacion(cotizacion.estado_cotizacion);

                                return (
                                    <article
                                        key={cotizacion.id_cotizacion_paciente}
                                        data-tour="cotizaciones-tarjeta"
                                        className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_4px_16px_-10px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-black/10 hover:shadow-[0_14px_32px_-18px_rgba(79,70,229,0.28)]"
                                    >
                                        <div className="p-4 sm:p-5">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-[#007AFF]/[0.06] text-[#007AFF] transition-colors group-hover:bg-[#007AFF]/10">
                                                        <FileText className="h-4 w-4"/>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[12px] tabular-nums text-[#86868B]">
                                                                COT-{cotizacion.id_cotizacion_paciente}
                                                            </span>
                                                            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${estadoActual.clases}`}>
                                                                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle"/>
                                                                {estadoActual.etiqueta}
                                                            </span>
                                                        </div>
                                                        <h3 className="break-words text-[17px] font-semibold leading-snug tracking-tight text-[#1D1D1F]">
                                                            {cotizacion.nombre_cotizacion}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="flex min-w-[170px] items-center gap-2.5 lg:justify-end">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#007AFF] shadow-sm">
                                                        <CircleDollarSign className="h-4 w-4"/>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-medium text-[#86868B]">
                                                            Total cotizado
                                                        </p>
                                                        <p className="mt-0.5 text-[20px] font-semibold leading-none tracking-tight tabular-nums text-[#1D1D1F]">
                                                            {formatearMonto(cotizacion.total_presupuesto_cotizado)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-black/[0.06] pt-3 text-[13px]">
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[#8E8E93]" aria-hidden="true"/>
                                                    <dt className="sr-only">Solicitante</dt>
                                                    <dd className="truncate text-[#3A3A3C]">{cotizacion.profesional_solicitante_nombre}</dd>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#8E8E93]" aria-hidden="true"/>
                                                    <dt className="text-[#86868B]">Creada</dt>
                                                    <dd className="tabular-nums text-[#3A3A3C]">{formatearFechaHora(cotizacion.fecha_creacion)}</dd>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#8E8E93]" aria-hidden="true"/>
                                                    <dt className="text-[#86868B]">Modificada</dt>
                                                    <dd className="tabular-nums text-[#3A3A3C]">{formatearFechaHora(cotizacion.fecha_actualizacion)}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        <div className="flex flex-col gap-3 border-t border-black/[0.06] bg-[#FBFBFD] px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
                                            <label data-tour="cotizaciones-cambiar-estado" className="block w-full xl:max-w-[340px]">
                                                <span className="mb-1 block text-[12px] font-medium text-[#86868B]">
                                                    Cambiar estado de la cotización
                                                </span>
                                                {/* UI ONLY: conectar onChange con el servicio que actualiza esta cotización. */}
                                                <select
                                                    name={`estado_cotizacion_${cotizacion.id_cotizacion_paciente}`}
                                                    defaultValue={String(cotizacion.estado_cotizacion ?? "")}
                                                    onChange={(e) => cambiarEstado( e.target.value ,cotizacion.id_cotizacion_paciente,)}
                                                    data-cotizacion-id={cotizacion.id_cotizacion_paciente}
                                                    aria-label={`Cambiar estado de la cotización ${cotizacion.id_cotizacion_paciente}`}
                                                    className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15"
                                                >
                                                    <option value="" disabled>Seleccionar estado</option>
                                                    <option value="1">Activa</option>
                                                    <option value="2">Tratamiento en curso</option>
                                                    <option value="3">Tratamiento finalizado</option>
                                                    <option value="4">Tratamiento abandonado</option>
                                                </select>
                                            </label>

                                            <div data-tour="cotizaciones-acciones" className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => router.push(`/dashboard/detalleCotizacion/${cotizacion.id_cotizacion_paciente}`)}
                                                    className="flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#007AFF]/10 px-4 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/15 sm:w-auto"
                                                    aria-label={`Ver detalle de la cotización ${cotizacion.id_cotizacion_paciente}`}
                                                >
                                                    Ver detalle
                                                    <ChevronRight className="h-3.5 w-3.5"/>
                                                </button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 sm:w-auto"
                                                            aria-label={`Eliminar la cotización ${cotizacion.id_cotizacion_paciente}`}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 shrink-0"/>
                                                            Eliminar
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogMedia>
                                                                <Trash2 className="text-destructive"/>
                                                            </AlertDialogMedia>
                                                            <AlertDialogTitle>Eliminar cotización</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                ¿Está seguro de que desea eliminar esta cotización? Una vez eliminada, no podrá recuperar los datos.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                variant="destructive"
                                                                onClick={() => eliminarCotizacion(cotizacion.id_cotizacion_paciente)}
                                                            >
                                                                <Trash2 data-icon="inline-start"/>
                                                                Sí, eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}

                            {cotizacionesPaciente.length === 0 && (
                                <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
                                    <Search className="h-7 w-7 text-slate-300"/>
                                    <p className="mt-3 text-[13px] font-bold text-slate-700">No hay cotizaciones registradas</p>
                                    <p className="mt-1 text-[12px] text-slate-400">Crea una nueva cotización para este paciente.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
