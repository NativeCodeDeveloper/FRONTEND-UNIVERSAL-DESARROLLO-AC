"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {jsPDF} from "jspdf";
import {autoTable} from "jspdf-autotable";
import {toast, Toaster} from "react-hot-toast";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    ArrowLeft,
    ChevronDown,
    CircleCheck,
    ClipboardList,
    FileDown,
    LoaderCircle,
    Mail,
    Package,
    Plus,
    Save,
    Search,
    Stethoscope,
    Trash2,
    UserRound,
    WalletCards
} from "lucide-react";

function formatearMonto(valor) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(valor);
}

function obtenerFechaLocalActual() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatearFechaDocumento(fecha) {
    const [anio, mes, dia] = String(fecha ?? "").split("-");
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : "-";
}

function BotonEnviarCotizacionCorreo({
    enviando,
    envioConfirmado,
    onClick
}) {
    const procesando = enviando && !envioConfirmado;
    const claseEstado = envioConfirmado
        ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-600"
        : procesando
            ? "bg-slate-800 shadow-slate-300"
            : "bg-slate-900 shadow-slate-300 hover:bg-slate-800 active:scale-[0.98]";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={enviando}
            aria-busy={procesando}
            aria-live="polite"
            className={`relative inline-flex h-11 w-full min-w-[205px] cursor-pointer items-center justify-center overflow-hidden rounded-lg px-5 text-xs font-bold text-white shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:active:scale-100 sm:w-auto ${claseEstado}`}
        >
            {procesando ? (
                <span
                    className="absolute inset-0 bg-white/10 motion-safe:animate-pulse"
                    aria-hidden="true"
                />
            ) : null}

            <span className="relative flex items-center justify-center gap-2">
                {envioConfirmado ? (
                    <>
                        <CircleCheck
                            className="h-5 w-5 motion-safe:animate-in motion-safe:zoom-in motion-safe:duration-300"
                            aria-hidden="true"
                        />
                        <span>Envío aceptado</span>
                    </>
                ) : procesando ? (
                    <>
                        <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true"/>
                        <span>Procesando envío</span>
                        <span className="flex items-end gap-1" aria-hidden="true">
                            <span className="h-1 w-1 rounded-full bg-white motion-safe:animate-bounce [animation-delay:-0.3s]"/>
                            <span className="h-1 w-1 rounded-full bg-white motion-safe:animate-bounce [animation-delay:-0.15s]"/>
                            <span className="h-1 w-1 rounded-full bg-white motion-safe:animate-bounce"/>
                        </span>
                    </>
                ) : (
                    <>
                        <Mail className="h-4 w-4" aria-hidden="true"/>
                        <span>Enviar por correo</span>
                    </>
                )}
            </span>
        </button>
    );
}

export default function DetalleCotizacion() {
    const {id_cotizacion_paciente} = useParams();
    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL;

    const [datosEmpresa, setDatosEmpresa] = useState(null);
    const [fechaEmisionPDF, setFechaEmisionPDF] = useState(obtenerFechaLocalActual);
    const [enviandoCotizacionCorreo, setEnviandoCotizacionCorreo] = useState(false);
    const [envioCotizacionCorreoConfirmado, setEnvioCotizacionCorreoConfirmado] = useState(false);
    const [observacionesDetalle, setObservacionesDetalle] = useState("");
    const envioCotizacionCorreoEnCursoRef = useRef(false);

    async function cargarDatosEmpresaCotizacion() {
        try {
            const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                },
                mode: "cors",
                cache: "no-cache"
            });

            if (!res.ok) {
                return toast.error(`No se pudieron cargar los datos de la empresa.`);
            }

            const data = await res.json();
            const empresa = Array.isArray(data) ? data[0] : data;

            if (!empresa) {
                return toast.error(`No existen datos activos de la empresa.`);
            }

            setDatosEmpresa(empresa);
        } catch (error) {
            return toast.error(`Ocurrió un problema al cargar los datos de la empresa.`);
        }
    }

    useEffect(() => {
        cargarDatosEmpresaCotizacion();
    }, []);

    const[cotizacionSeleccionada, setCotizacionSeleccionada] = useState([]);
    async function cargarDatosCotizacion_especifica_por_id(id_cotizacion_paciente) {
        try {
            if(!id_cotizacion_paciente){
                return toast.error(`No hay se ha seleccionado ninguna categoria, por lo que no se pueden mostrar el detalle.`);
            }

            const res = await fetch(`${API}/cotizacionPaciente/seleccionarCotizacionEspecifica`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({id_cotizacion_paciente}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
            }

            const data = await res.json();
            const cotizaciones = Array.isArray(data) ? data : data ? [data] : [];
            const cotizacion = cotizaciones[0] ?? null;
            const abonoRecibido = cotizacion?.abono_paciente;
            const observacionesDetalle = cotizacion?.observacionesDetalleCotizacion;

            setCotizacionSeleccionada(cotizaciones);
            setAbonoPaciente(
                abonoRecibido === null || abonoRecibido === undefined
                    ? null
                    : Math.max(0, Number(abonoRecibido) || 0)
            );
            setObservacionesDetalle(observacionesDetalle ?? "");

        }catch(error) {
            return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
        }
    }

    useEffect(() => {
        if(id_cotizacion_paciente){
            cargarDatosCotizacion_especifica_por_id(id_cotizacion_paciente)
        }else {
            return;
        }
    }, [id_cotizacion_paciente]);






    async function insertarNuevoDetalle(
        id_cotizacion,
        producto_servicio_cotizado,
        valor_producto_cotizado,
        observacion_producto_cotizado
    ){
        try {

            if(!id_cotizacion || !producto_servicio_cotizado || !valor_producto_cotizado){
                return toast.error(`Debe completar todos los campos obligatorios.`);
            }

            if(observacion_producto_cotizado === null || observacion_producto_cotizado === ""){
                observacion_producto_cotizado = "Sin observaciones";
            }

            const res = await fetch(`${API}/detalleCotizacion/insertarDetalle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    id_cotizacion,
                    producto_servicio_cotizado,
                    valor_producto_cotizado,
                    observacion_producto_cotizado
                }),
                mode: "cors",
                cache: "no-cache"
            });

            if (!res.ok) {
                return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
            }

            const respuestaBackend = await res.json();

            if(respuestaBackend.message === true){
                await cargarDetalleCotizacion(id_cotizacion, true)
                return toast.success(`Prestacion agregada correctamente.`);
            }

            if(respuestaBackend.message === false){
                return toast.error(`No se pudo agregar la prestacion.`);
            }

            if(respuestaBackend.message === `sindata` || respuestaBackend.message.includes(`sindata`)){
                return toast.error(`Faltan datos obligatorios para añadir prestacion a la cotizacion`);

            }else {
                return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);

            }
        }catch(error) {
            return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
        }
    }




    async function eliminarDetalleEspecifico(
        id_detalle,
        id_cotizacion
    ){
        try {

            if(!id_detalle ){
                return toast.error(`Debe seleccionar al menos un elemento del detalle de la cotizacion`);
            }

            const res = await fetch(`${API}/detalleCotizacion/eliminarDetalle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    id_detalle
                }),
                mode: "cors",
                cache: "no-cache"
            });

            if (!res.ok) {
                return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte. No se pudo eliminar elemento de la lista.`);
            }

            const respuestaBackend = await res.json();

            if(respuestaBackend.message === true){
                await cargarDetalleCotizacion(id_cotizacion, true)
                return toast.success(`Elemento eliminado correctamente.`);
            }

            if(respuestaBackend.message === false){
                return toast.error(`No se pudo eliminar el elemento.`);
            }

            if(respuestaBackend.message === `sindata` || respuestaBackend.message.includes(`sindata`)){
                return toast.error(`Faltan datos obligatorios para eliminar el elemento de la cotizacion`);

            }else {
                return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);

            }
        }catch(error) {
            return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
        }
    }

    async function guardarObservacionDetalle(id_detalle, observacion_producto_cotizado, id_cotizacion) {
        try {
            if (!id_detalle || !observacion_producto_cotizado) {
                return toast.error(`No se pudo identificar el detalle de la cotización.`);
            }

            const res = await fetch(`${API}/detalleCotizacion/actualizarDetalle `, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    id_detalle,
                    observacion_producto_cotizado
                }),
                mode: "cors",
                cache: "no-cache"
            });

            if (!res.ok) {
                return toast.error(`No se pudo guardar la observación.`);
            }

            const respuestaBackend = await res.json();

            if (respuestaBackend.message === true) {
                await cargarDetalleCotizacion(id_cotizacion);
                return toast.success(`Observación guardada correctamente.`);
            }

            if(respuestaBackend.message === false){
                return toast.error(`No se pudo guardar la observación.`);
            }

            if(respuestaBackend.message === `sindata` || respuestaBackend.message.includes(`sindata`)){
                return toast.error(`Faltan datos obligatorios para guardar la observación.`);
            }

            return toast.error(`No se pudo guardar la observación.`);

        } catch (error) {
            return toast.error(`Ocurrió un problema al guardar la observación.`);
        }
    }



    const [productos, setProductos] = useState([]);
    async function obtenerListaProductos() {
        try {
            const res = await fetch(`${API}/producto/seleccionar_por_categorias`, {
                    method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
            })

            if (!res.ok) {
                return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
            }

            const data = await res.json();
            setProductos(data);

        }catch(error) {
            return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
        }
    }

    useEffect(() => {
        obtenerListaProductos();
    },[])



    const [detalleCotizacionArray, setDetalleCotizacionArray] = useState([]);
    const [detalleCotizacionCargado, setDetalleCotizacionCargado] = useState(false);
    const temporizadorActualizacionTotalRef = useRef(null);

    async function cargarDetalleCotizacion(id_cotizacion, sincronizarTotal = false) {
        try {
            if(!id_cotizacion){
                return toast.error(`No se ha seleccionado ninguna cotizacion para ver su detalle`);
            }

            setDetalleCotizacionCargado(false);

            const res = await fetch(`${API}/detalleCotizacion/seleccionarPorIdCotizacion`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ id_cotizacion }),
                cache: "no-cache"
            })

            if(!res.ok){
                return toast.error(`Ocurrio un problema al obtener el detalle de la cotizacion.`);
            }

            const dataDetalleCotizacion = await res.json();
            setDetalleCotizacionArray(dataDetalleCotizacion);
            setDetalleCotizacionCargado(true);

            let contadorTotalAcumulado = 0;

            dataDetalleCotizacion.forEach(elemento => {
                contadorTotalAcumulado += Number(elemento.valor_producto_cotizado) || 0;
            });

            if (sincronizarTotal) {
                const abonoAjustado = Math.min(
                    Math.max(0, Number(abonoAplicado) || 0),
                    contadorTotalAcumulado
                );

                setAbonoPaciente(abonoAjustado);
                programarActualizacionTotal(contadorTotalAcumulado, abonoAjustado);
            }

        }catch (e) {
            return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
        }
    }

    useEffect(() => {
        cargarDetalleCotizacion(id_cotizacion_paciente);
    }, [id_cotizacion_paciente]);





    const [abono_paciente, setAbonoPaciente] = useState(null);

    async function actualizarValorTotalAutomaticamente(
        totalTratamiento,
        abono_paciente,
        id_cotizacion_paciente
    ) {
        try {
            if(!id_cotizacion_paciente || totalTratamiento === null || totalTratamiento === undefined){
                return toast.error(`El valor total proporcionado no es válido.`);
            }

            const totalNormalizado = Math.max(0, Number(totalTratamiento) || 0);
            const abonoNormalizado = Math.min(
                Math.max(0, Number(abono_paciente) || 0),
                totalNormalizado
            );

            const totalCalculado = totalNormalizado - abonoNormalizado;

            const res = await fetch(`${API}/cotizacionPaciente/actualizarTotal`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    total_presupuesto_cotizado: totalCalculado,
                    abono_paciente: abonoNormalizado,
                    total_tratamiento: totalNormalizado,
                    id_cotizacion_paciente
                })
            })

            if(!res.ok){
                return toast.error(`Ocurrio un problema al actualizar el total de la cotizacion.`);
            }

            const respuestaBackend = await res.json();

            if(respuestaBackend.message === true){
                setCotizacionSeleccionada((cotizacionesActuales) =>
                    cotizacionesActuales.map((cotizacion) =>
                        cotizacion.id_cotizacion_paciente === Number(id_cotizacion_paciente)
                            || String(cotizacion.id_cotizacion_paciente) === String(id_cotizacion_paciente)
                            ? {
                                ...cotizacion,
                                total_presupuesto_cotizado: totalCalculado,
                                abono_paciente: abonoNormalizado
                            }
                            : cotizacion
                    )
                );
                return true;
            }

            if(respuestaBackend.message === false){
                return toast.error(`Ocurrio un problema al actualizar el total de la cotizacion.`);

            }

            if(respuestaBackend.message === `sindata` || respuestaBackend.message.includes(`sindata`)){
                return toast.error(`Faltan datos para actualizar el total`);
            }

        }catch (e) {
            return toast.error(`Ocurrio un problema en el servidor por favor contacte a soporte.`);
        }
    }

    function programarActualizacionTotal(totalTratamiento, abonoPaciente) {
        if (temporizadorActualizacionTotalRef.current) {
            clearTimeout(temporizadorActualizacionTotalRef.current);
        }

        temporizadorActualizacionTotalRef.current = setTimeout(() => {
            actualizarValorTotalAutomaticamente(
                totalTratamiento,
                abonoPaciente,
                id_cotizacion_paciente
            );
        }, 400);
    }

    useEffect(() => {
        return () => {
            if (temporizadorActualizacionTotalRef.current) {
                clearTimeout(temporizadorActualizacionTotalRef.current);
            }
        };
    }, []);



    async function enviarCotizacionCorreo(id_cotizacion_paciente, fechaEmisionPDF) {
        if (envioCotizacionCorreoEnCursoRef.current) {
            return;
        }

        if (!id_cotizacion_paciente) {
            return toast.error(`No se pudo identificar la cotización que desea enviar.`);
        }

        if (!fechaEmisionPDF) {
            return toast.error(`Debe seleccionar una fecha de emisión antes de enviar la cotización.`);
        }

        envioCotizacionCorreoEnCursoRef.current = true;
        setEnvioCotizacionCorreoConfirmado(false);
        setEnviandoCotizacionCorreo(true);

        const inicioAnimacionEnvio = Date.now();
        const esperarAnimacionMinima = async () => {
            const tiempoTranscurrido = Date.now() - inicioAnimacionEnvio;
            const tiempoRestante = Math.max(0, 700 - tiempoTranscurrido);

            if (tiempoRestante > 0) {
                await new Promise((resolve) => setTimeout(resolve, tiempoRestante));
            }
        };

        const toastEnvio = toast.loading(`Enviando cotización por correo...`);

        try {
            const res = await fetch(`${API}/envioCotizacionCorreo/enviarCotizacion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    id_cotizacion_paciente,
                    fecha_emision: fechaEmisionPDF
                }),
                mode: "cors",
                cache: "no-store"
            });

            const respuestaBackend = await res.json();
            await esperarAnimacionMinima();

            if (!res.ok || respuestaBackend.message !== true) {
                const mensajeError = typeof respuestaBackend.error === "string"
                    ? respuestaBackend.error
                    : `Ocurrió un error al enviar la cotización por correo. Consulte a soporte técnico.`;

                toast.error(mensajeError, {id: toastEnvio});
                return false;
            }

            setEnvioCotizacionCorreoConfirmado(true);

            toast.success(
                cotizacionActual?.correo
                    ? `Cotización aceptada para envío a ${cotizacionActual.correo}.`
                    : `Cotización aceptada para envío.`,
                {id: toastEnvio}
            );

            await new Promise((resolve) => setTimeout(resolve, 1200));
            return true;
        } catch (error) {
            await esperarAnimacionMinima();
            console.error("Error al enviar la cotización por correo:", error);
            toast.error(
                `Ocurrió un error al enviar la cotización por correo. Consulte a soporte técnico.`,
                {id: toastEnvio}
            );
            return false;
        } finally {
            envioCotizacionCorreoEnCursoRef.current = false;
            setEnviandoCotizacionCorreo(false);
            setEnvioCotizacionCorreoConfirmado(false);
        }
    }



    async function actualizarObservacion(
        observacionesDetalleCotizacion,
        id_cotizacion_paciente
    ) {
        try {

            if(!observacionesDetalleCotizacion || !id_cotizacion_paciente) {
                return toast.error(`Debe seleccionar una cotizacion especifica y llenar el campo de observacion con una observacion (No se admiten Campos Vacios)`);
            }


            const res = await fetch(`${API}/cotizacionPaciente/actualizarObservacion`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    observacionesDetalleCotizacion,
                    id_cotizacion_paciente
                }),
                mode: "cors",
                cache: "no-store"
            })

            if(!res.ok) {
                return toast.error(`Ocurrió un error al actualizar la observación. Consulte a soporte técnico.`);
            }

            const respuestaBackend = await res.json();

            if(respuestaBackend.message === true) {
                return toast.success(`Observación actualizada !`);
            }
            if(respuestaBackend.message === false) {
                return toast.error(`No se pudo actualizar la observación. Consulte a soporte técnico.`);
            }
            if(respuestaBackend.message === `sindata`) {
                return toast.error(`No se pudo actualizar la observación. Falta informacion.`);
            }else {
                return toast.error(`No se pudo actualizar la observación. Consulte a soporte técnico.`);
            }
        }catch(error) {
            return toast.error(`Ocurrió un error al actualizar la observación. Consulte a soporte técnico.`);
        }
    }







    //************************************************************************************************************************


    // Guarda el texto utilizado para buscar productos o servicios en el catálogo.
    const [busquedaCatalogo, actualizarBusquedaCatalogo] = useState("");

    // Guarda la categoría seleccionada para filtrar el catálogo.
    const [categoriaSeleccionada, actualizarCategoriaSeleccionada] = useState("todas");

    // Guarda la subcategoría seleccionada dentro de la categoría activa.
    const [subcategoriaSeleccionada, actualizarSubcategoriaSeleccionada] = useState("todas");

    // Guarda la sub-subcategoría seleccionada dentro de la subcategoría activa.
    const [subSubcategoriaSeleccionada, actualizarSubSubcategoriaSeleccionada] = useState("todas");

    // Indica si el listado superior de prestaciones y servicios se encuentra desplegado.
    const [listadoPrestacionesVisible, actualizarListadoPrestacionesVisible] = useState(false);

    const categoriasDisponibles = useMemo(() => {
        return [...new Set(
            productos
                .map((elemento) => elemento.categoria_nombre)
                .filter(Boolean)
        )];
    }, [productos]);

    const subcategoriasDisponibles = useMemo(() => {
        const elementosCategoria = categoriaSeleccionada === "todas"
            ? productos
            : productos.filter((elemento) => elemento.categoria_nombre === categoriaSeleccionada);

        return [...new Set(
            elementosCategoria
                .map((elemento) => elemento.subcategoria_nombre)
                .filter(Boolean)
        )];
    }, [categoriaSeleccionada, productos]);

    const subSubcategoriasDisponibles = useMemo(() => {
        const elementosSubcategoria = productos.filter((elemento) => {
            const coincideCategoria = categoriaSeleccionada === "todas"
                || elemento.categoria_nombre === categoriaSeleccionada;
            const coincideSubcategoria = subcategoriaSeleccionada === "todas"
                || elemento.subcategoria_nombre === subcategoriaSeleccionada;

            return coincideCategoria && coincideSubcategoria;
        });

        return [...new Set(
            elementosSubcategoria
                .map((elemento) => elemento.sub_sub_categoría_nombre)
                .filter(Boolean)
        )];
    }, [categoriaSeleccionada, subcategoriaSeleccionada, productos]);

    const elementosCatalogoVisibles = useMemo(() => {
        const texto = busquedaCatalogo.trim().toLowerCase();

        return productos.filter((elemento) => {
            const coincideCategoria = categoriaSeleccionada === "todas"
                || elemento.categoria_nombre === categoriaSeleccionada;
            const coincideSubcategoria = subcategoriaSeleccionada === "todas"
                || elemento.subcategoria_nombre === subcategoriaSeleccionada;
            const coincideSubSubcategoria = subSubcategoriaSeleccionada === "todas"
                || elemento.sub_sub_categoría_nombre === subSubcategoriaSeleccionada;
            const coincideBusqueda = !texto || [
                elemento.tituloProducto,
                elemento.categoria_nombre,
                elemento.subcategoria_nombre,
                elemento.sub_sub_categoría_nombre,
                elemento.descripcionProducto
            ].some((valor) => String(valor ?? "").toLowerCase().includes(texto));

            return coincideCategoria
                && coincideSubcategoria
                && coincideSubSubcategoria
                && coincideBusqueda;
        });
    }, [
        busquedaCatalogo,
        categoriaSeleccionada,
        subcategoriaSeleccionada,
        subSubcategoriaSeleccionada,
        productos
    ]);

    const totalCotizacion = useMemo(() => {
        return detalleCotizacionArray.reduce(
            (total, elemento) => total + (Number(elemento.valor_producto_cotizado) || 0),
            0
        );
    }, [detalleCotizacionArray]);

    const saldoRegistrado = Number(cotizacionSeleccionada[0]?.total_presupuesto_cotizado);
    const abonoInferido = detalleCotizacionCargado && Number.isFinite(saldoRegistrado)
        ? Math.max(totalCotizacion - saldoRegistrado, 0)
        : null;
    const abonoAplicado = abono_paciente === null
        ? abonoInferido
        : Math.max(0, Number(abono_paciente) || 0);
    const saldoPendiente = Math.max(totalCotizacion - (abonoAplicado ?? 0), 0);

    const totalItemsCotizacion = useMemo(() => {
        return detalleCotizacionArray.length;
    }, [detalleCotizacionArray]);

    const cotizacionActual = cotizacionSeleccionada[0] ?? null;

    function volverACarpetaPaciente() {
        if (cotizacionActual?.id_paciente) {
            router.push(`/dashboard/FichasPacientes/${cotizacionActual.id_paciente}`);
            return;
        }

        router.back();
    }

    function volverACotizaciones() {
        if (cotizacionActual?.id_paciente) {
            router.push(`/dashboard/cotizacionesPaciente/${cotizacionActual.id_paciente}`);
            return;
        }

        router.back();
    }

    function cambiarCategoria(nuevaCategoria) {
        actualizarCategoriaSeleccionada(nuevaCategoria);
        actualizarSubcategoriaSeleccionada("todas");
        actualizarSubSubcategoriaSeleccionada("todas");
    }

    function cambiarSubcategoria(nuevaSubcategoria) {
        actualizarSubcategoriaSeleccionada(nuevaSubcategoria);
        actualizarSubSubcategoriaSeleccionada("todas");
    }

    function actualizarObservacionElemento(idDetalle, nuevaObservacion) {
        setDetalleCotizacionArray((detallesActuales) =>
            detallesActuales.map((detalle) =>
                detalle.id_detalle === idDetalle
                    ? {...detalle, observacion_producto_cotizado: nuevaObservacion}
                    : detalle
            )
        );
    }

    function cambiarAbonoPaciente(nuevoAbono) {
        const montoIngresado = Math.max(0, Number(nuevoAbono) || 0);
        const montoNormalizado = Math.min(montoIngresado, totalCotizacion);

        if (montoIngresado > totalCotizacion) {
            toast.error(`El abono no puede ser mayor que el total del tratamiento.`);
        }

        setAbonoPaciente(montoNormalizado);
        programarActualizacionTotal(totalCotizacion, montoNormalizado);
    }

    function exportarPresupuestoPDF() {
        if (!cotizacionActual) {
            return toast.error(`No se pudieron cargar los datos de la cotización.`);
        }

        if (!datosEmpresa) {
            return toast.error(`Los datos de la empresa todavía no están disponibles.`);
        }

        if (!fechaEmisionPDF) {
            return toast.error(`Debe seleccionar una fecha para generar el PDF.`);
        }

        const documento = new jsPDF("p", "mm", "letter");
        const anchoPagina = documento.internal.pageSize.getWidth();
        const altoPagina = documento.internal.pageSize.getHeight();
        const margen = 20;
        const rightX = anchoPagina - margen;

        // Paleta clínica estándar Agenda Clínica: solo negro, grises y blanco. Sin gradientes.
        const BLACK = [15, 23, 42];
        const DARK = [51, 65, 85];
        const MID = [100, 116, 139];
        const LIGHT = [148, 163, 184];
        const BGLIGHT = [248, 250, 252];
        const BGMID = [241, 245, 249];
        const BORDE = [203, 213, 225];

        const nombreEmpresa = String(datosEmpresa.empresaNombre ?? "").trim() || "-";
        const folio = `N° ${id_cotizacion_paciente}`;
        const fechaEmisionTexto = fechaEmisionPDF
            ? new Date(`${fechaEmisionPDF}T00:00:00`).toLocaleDateString("es-CL", {day: "2-digit", month: "long", year: "numeric"})
            : "-";
        const nombrePacienteTexto = `${cotizacionActual.nombre ?? ""} ${cotizacionActual.apellido ?? ""}`.trim() || "-";
        const rutPacienteTexto = String(cotizacionActual.rut ?? "").trim();
        const profesionalTexto = String(cotizacionActual.profesional_solicitante_nombre ?? "").trim() || "-";
        const hayAbono = Number(abonoAplicado) > 0;

        function dibujarEncabezado() {
            documento.setFillColor(...BGLIGHT);
            documento.rect(0, 0, anchoPagina, 32, "F");
            documento.setDrawColor(...BORDE);
            documento.setLineWidth(0.4);
            documento.line(0, 32, anchoPagina, 32);

            documento.setFont("helvetica", "bold");
            documento.setFontSize(16);
            documento.setTextColor(...BLACK);
            documento.text(nombreEmpresa.toUpperCase(), margen, 14);

            documento.setFont("helvetica", "italic");
            documento.setFontSize(7.5);
            documento.setTextColor(...MID);
            documento.text("AgendaClínica — Healthcare Information System", margen, 20);

            documento.setFont("helvetica", "normal");
            documento.setFontSize(7.5);
            documento.text("Centro de Atención Clínica", margen, 25);

            documento.setFillColor(...BGMID);
            documento.roundedRect(rightX - 60, 6, 60, 20, 1, 1, "F");
            documento.setFont("helvetica", "bold");
            documento.setFontSize(8);
            documento.setTextColor(...BLACK);
            documento.text("COTIZACIÓN CLÍNICA", rightX - 30, 14, {align: "center"});
            documento.setFont("helvetica", "normal");
            documento.setFontSize(7);
            documento.setTextColor(...MID);
            documento.text(folio, rightX - 30, 20, {align: "center"});
        }

        function dibujarPiePagina() {
            const posicionPie = altoPagina - 12;
            documento.setDrawColor(...BORDE);
            documento.setLineWidth(0.3);
            documento.line(margen, posicionPie - 4, rightX, posicionPie - 4);
            documento.setFont("helvetica", "normal");
            documento.setFontSize(6.5);
            documento.setTextColor(...LIGHT);
            documento.text(`Generado por AgendaClínica | ${nombreEmpresa}`, margen, posicionPie);
            documento.text(`Folio ${folio}  ·  Emisión: ${fechaEmisionTexto}`, rightX, posicionPie, {align: "right"});
        }

        dibujarEncabezado();

        let y = 42;
        documento.setFillColor(...BGMID);
        documento.roundedRect(margen, y, rightX - margen, 26, 1, 1, "F");
        documento.setDrawColor(...BORDE);
        documento.setLineWidth(0.3);
        documento.roundedRect(margen, y, rightX - margen, 26, 1, 1, "S");

        const midCol = margen + (rightX - margen) / 2;
        documento.line(midCol, y + 2, midCol, y + 24);

        documento.setFont("helvetica", "bold");
        documento.setFontSize(6.5);
        documento.setTextColor(...MID);
        documento.text("PROFESIONAL RESPONSABLE", margen + 5, y + 8);
        documento.setFont("helvetica", "normal");
        documento.setFontSize(10);
        documento.setTextColor(...BLACK);
        documento.text(profesionalTexto, margen + 5, y + 14);

        documento.setFont("helvetica", "normal");
        documento.setFontSize(6.5);
        documento.setTextColor(...MID);
        documento.text(`Cotización: ${String(cotizacionActual.nombre_cotizacion ?? "-").trim() || "-"}`, margen + 5, y + 20);

        documento.setFont("helvetica", "bold");
        documento.setFontSize(6.5);
        documento.setTextColor(...MID);
        documento.text("PACIENTE", midCol + 5, y + 8);
        documento.text("FECHA DE EMISIÓN", midCol + 5, y + 19);
        documento.setFont("helvetica", "normal");
        documento.setFontSize(9);
        documento.setTextColor(...BLACK);
        documento.text(nombrePacienteTexto + (rutPacienteTexto ? `  ·  ${rutPacienteTexto}` : ""), midCol + 5, y + 14);
        documento.setFontSize(8.5);
        documento.text(fechaEmisionTexto, midCol + 5, y + 24);

        y += 32;

        autoTable(documento, {
            head: [["#", "Servicio / Procedimiento", "Observación", "Valor (CLP)"]],
            body: detalleCotizacionArray.map((elemento, index) => [
                String(index + 1),
                elemento.producto_servicio_cotizado,
                elemento.observacion_producto_cotizado?.trim() || "—",
                formatearMonto(elemento.valor_producto_cotizado)
            ]),
            startY: y,
            margin: {left: margen, right: margen, bottom: 26},
            theme: "plain",
            headStyles: {
                fillColor: DARK,
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7.5,
                cellPadding: {top: 4, bottom: 4, left: 5, right: 5},
                halign: "left"
            },
            columnStyles: {
                0: {cellWidth: 10, halign: "center", textColor: MID},
                1: {cellWidth: 76},
                2: {cellWidth: "auto", textColor: DARK},
                3: {cellWidth: 34, halign: "right", fontStyle: "bold"}
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: {top: 3.5, bottom: 3.5, left: 5, right: 5},
                textColor: BLACK
            },
            alternateRowStyles: {fillColor: BGLIGHT},
            styles: {
                lineWidth: 0.15,
                lineColor: BORDE,
                overflow: "linebreak"
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) dibujarEncabezado();
                dibujarPiePagina();
            }
        });

        let finalY = documento.lastAutoTable.finalY + 8;
        const boxW = 76;
        const boxAltura = hayAbono ? 30 : 22;
        const boxX = rightX - boxW;

        if (finalY + boxAltura > altoPagina - 55) {
            documento.addPage();
            dibujarEncabezado();
            finalY = 42;
        }

        documento.setFillColor(...BGMID);
        documento.roundedRect(boxX, finalY, boxW, boxAltura, 1, 1, "F");
        documento.setDrawColor(...BORDE);
        documento.setLineWidth(0.3);
        documento.roundedRect(boxX, finalY, boxW, boxAltura, 1, 1, "S");

        documento.setFont("helvetica", "normal");
        documento.setFontSize(8.5);
        documento.setTextColor(...MID);
        documento.text("Subtotal:", boxX + 5, finalY + 8);
        documento.text(formatearMonto(totalCotizacion), rightX - 3, finalY + 8, {align: "right"});

        let lineaTotalY = finalY + 11;
        let totalLabelY = finalY + 19;

        if (hayAbono) {
            documento.text("Abono paciente:", boxX + 5, finalY + 15);
            documento.text(`- ${formatearMonto(abonoAplicado)}`, rightX - 3, finalY + 15, {align: "right"});
            lineaTotalY = finalY + 18;
            totalLabelY = finalY + 26;
        }

        documento.setDrawColor(...BORDE);
        documento.line(boxX + 3, lineaTotalY, rightX - 3, lineaTotalY);

        documento.setFont("helvetica", "bold");
        documento.setFontSize(11);
        documento.setTextColor(...BLACK);
        documento.text(hayAbono ? "Saldo Pendiente:" : "Total Neto:", boxX + 5, totalLabelY);
        documento.text(formatearMonto(hayAbono ? saldoPendiente : totalCotizacion), rightX - 3, totalLabelY, {align: "right"});

        finalY += boxAltura + 8;
        documento.setFont("helvetica", "normal");
        documento.setFontSize(7);
        documento.setTextColor(...LIGHT);
        documento.text("• Los valores indicados están expresados en pesos chilenos (CLP) e incluyen IVA según corresponda.", margen, finalY);
        documento.text("• Esta cotización tiene vigencia de 30 días desde la fecha de emisión.", margen, finalY + 5);
        documento.text("• Para consultas comuníquese con la clínica antes de iniciar cualquier tratamiento.", margen, finalY + 10);

        finalY += 24;
        if (finalY + 14 > altoPagina - 22) {
            documento.addPage();
            dibujarEncabezado();
            finalY = 48;
        }

        const sigW = 65;
        documento.setDrawColor(...BORDE);
        documento.setLineWidth(0.3);
        documento.line(margen, finalY, margen + sigW, finalY);
        documento.setFont("helvetica", "normal");
        documento.setFontSize(7);
        documento.setTextColor(...MID);
        documento.text("Firma y Timbre Profesional", margen + sigW / 2, finalY + 5, {align: "center"});
        documento.setFontSize(6);
        documento.text(nombreEmpresa, margen + sigW / 2, finalY + 9, {align: "center"});

        documento.setFontSize(7);
        documento.line(rightX - sigW, finalY, rightX, finalY);
        documento.text("Firma Paciente / Representante", rightX - sigW / 2, finalY + 5, {align: "center"});

        dibujarPiePagina();

        const nombrePacienteArchivo = `${cotizacionActual.nombre ?? ""}-${cotizacionActual.apellido ?? ""}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        documento.save(`presupuesto-${id_cotizacion_paciente}-${nombrePacienteArchivo || "paciente"}.pdf`);
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB] text-slate-900">
            <Toaster/>
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                        <div className="mb-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                            <button
                                type="button"
                                onClick={volverACarpetaPaciente}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
                                title="Volver a la carpeta del paciente"
                                aria-label="Volver a la carpeta del paciente"
                            >
                                <UserRound className="h-4 w-4"/>
                                Volver a la carpeta del paciente
                            </button>
                            <button
                                type="button"
                                onClick={volverACotizaciones}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
                                title="Volver a cotizaciones"
                                aria-label="Volver a cotizaciones"
                            >
                                <ArrowLeft className="h-4 w-4"/>
                                Volver a cotizaciones
                            </button>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
                                Presupuesto del paciente
                            </p>
                            <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">
                                Detalle de cotización #{id_cotizacion_paciente}
                            </h1>
                            <p className="mt-2 max-w-2xl text-[13px] text-slate-500">
                                Selecciona productos y servicios para construir el detalle económico del tratamiento.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 xl:items-end">
                        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                            <label className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm sm:w-auto">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Fecha PDF
                                </span>
                                <input
                                    type="date"
                                    value={fechaEmisionPDF}
                                    onChange={(evento) => setFechaEmisionPDF(evento.target.value)}
                                    disabled={enviandoCotizacionCorreo}
                                    aria-label="Fecha de emisión del PDF"
                                    className="bg-transparent text-xs font-semibold text-slate-700 outline-none disabled:cursor-wait disabled:text-slate-400"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={exportarPresupuestoPDF}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-4 text-xs font-semibold text-[#6E56CF] shadow-sm transition hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98] sm:w-auto"
                            >
                                <FileDown className="h-4 w-4"/>
                                Exportar PDF
                            </button>
                            <BotonEnviarCotizacionCorreo
                                enviando={enviandoCotizacionCorreo}
                                envioConfirmado={envioCotizacionCorreoConfirmado}
                                onClick={() => enviarCotizacionCorreo(id_cotizacion_paciente, fechaEmisionPDF)}
                            />
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                            <div className="flex h-14 flex-col justify-center rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ítems</span>
                                <span className="mt-1 text-[12px] font-bold leading-none text-slate-900">{totalItemsCotizacion} ítems</span>
                            </div>
                            <div className="col-span-2 flex h-14 flex-col justify-center rounded-lg border border-violet-200 bg-violet-50 px-4 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Saldo pendiente</span>
                                {cotizacionSeleccionada.map((element, index) => {
                                    return(
                                        <span key={element.id_cotizacion_paciente ?? index} className="mt-1 text-[14px] font-bold leading-none text-[#6E56CF]">{formatearMonto(element.total_presupuesto_cotizado)}</span>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                <section className="mb-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/30 p-8">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#6E56CF] text-xl font-bold text-white shadow-lg shadow-indigo-100">
                            {cotizacionActual?.nombre?.charAt(0) ?? ""}{cotizacionActual?.apellido?.charAt(0) ?? ""}
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-bold leading-tight text-slate-900">
                                {cotizacionActual?.nombre} {cotizacionActual?.apellido}
                            </h2>
                            <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-slate-400">
                                ID Paciente #{cotizacionActual?.id_paciente ?? "-"}
                            </p>
                        </div>
                    </div>

                    {cotizacionSeleccionada.map((cotizacion) => (
                        <dl key={cotizacion.id_cotizacion_paciente} className="grid grid-cols-1 gap-x-8 gap-y-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="min-w-0 space-y-1">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">RUT</dt>
                                <dd className="break-words font-mono text-[13px] font-semibold text-slate-700" title={cotizacion.rut}>{cotizacion.rut}</dd>
                            </div>
                            <div className="min-w-0 space-y-1">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teléfono</dt>
                                <dd className="break-words text-[13px] font-semibold text-slate-700" title={cotizacion.telefono}>{cotizacion.telefono}</dd>
                            </div>
                            <div className="min-w-0 space-y-1">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Correo</dt>
                                <dd className="break-words text-[13px] font-semibold text-slate-700" title={cotizacion.correo}>{cotizacion.correo}</dd>
                            </div>
                            <div className="min-w-0 space-y-1">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cotización</dt>
                                <dd className="break-words text-[13px] font-semibold text-slate-700" title={cotizacion.nombre_cotizacion}>{cotizacion.nombre_cotizacion}</dd>
                            </div>
                            <div className="min-w-0 space-y-1">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profesional</dt>
                                <dd className="break-words text-[13px] font-semibold text-slate-700" title={cotizacion.profesional_solicitante_nombre}>{cotizacion.profesional_solicitante_nombre}</dd>
                            </div>
                        </dl>
                    ))}
                </section>

                <section className="mb-6 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                            Observaciones
                        </span>
                        <textarea
                            value={observacionesDetalle}
                            onChange={(evento) => setObservacionesDetalle(evento.target.value)}
                            placeholder="Escribe observaciones generales sobre esta cotización"
                            aria-label="Observaciones generales de la cotización"
                            className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100"
                        />
                        <span className="mt-1.5 block text-[10px] text-slate-400">
                            Añade notas generales relacionadas con el presupuesto o tratamiento.
                        </span>
                    </label>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => actualizarObservacion(observacionesDetalle, id_cotizacion_paciente)}
                            type="button"
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:w-auto"
                        >
                            <Save className="h-4 w-4" aria-hidden="true"/>
                            Guardar observación
                        </button>
                    </div>
                </section>

                <div className="space-y-8">
                    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6E56CF] text-white">
                                    <ClipboardList className="h-3.5 w-3.5"/>
                                </div>
                                <h2 className="text-sm font-semibold text-slate-800">Listado de prestaciones y servicios</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F3F0FF] px-2 text-[11px] font-bold text-[#6E56CF]">
                                    {elementosCatalogoVisibles.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => actualizarListadoPrestacionesVisible((visible) => !visible)}
                                    aria-expanded={listadoPrestacionesVisible}
                                    aria-controls="listado-prestaciones"
                                    title={listadoPrestacionesVisible ? "Contraer listado" : "Desplegar listado"}
                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-[#6E56CF]"
                                >
                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${listadoPrestacionesVisible ? "rotate-180" : ""}`}/>
                                </button>
                            </div>
                        </div>

                        {listadoPrestacionesVisible && (
                            <div id="listado-prestaciones">
                                <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.3fr)_repeat(3,minmax(170px,1fr))]">
                            <label className="block">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Buscar</span>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                                    <input
                                        value={busquedaCatalogo}
                                        onChange={(evento) => actualizarBusquedaCatalogo(evento.target.value)}
                                        placeholder="Nombre, categoría o descripción"
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                    />
                                </div>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Categoría</span>
                                <select
                                    value={categoriaSeleccionada}
                                    onChange={(evento) => cambiarCategoria(evento.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="todas">Todas las categorías</option>
                                    {categoriasDisponibles.map((categoria) => (
                                        <option key={categoria} value={categoria}>{categoria}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Subcategoría</span>
                                <select
                                    value={subcategoriaSeleccionada}
                                    onChange={(evento) => cambiarSubcategoria(evento.target.value)}
                                    disabled={categoriaSeleccionada === "todas"}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="todas">Todas las subcategorías</option>
                                    {subcategoriasDisponibles.map((subcategoria) => (
                                        <option key={subcategoria} value={subcategoria}>{subcategoria}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Sub-subcategoría</span>
                                <select
                                    value={subSubcategoriaSeleccionada}
                                    onChange={(evento) => actualizarSubSubcategoriaSeleccionada(evento.target.value)}
                                    disabled={subcategoriaSeleccionada === "todas"}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="todas">Todas las sub-subcategorías</option>
                                    {subSubcategoriasDisponibles.map((subSubcategoria) => (
                                        <option key={subSubcategoria} value={subSubcategoria}>{subSubcategoria}</option>
                                    ))}
                                </select>
                            </label>
                                </div>

                                <div className="max-h-[280px] overflow-y-auto">
                                    <Table className="text-sm">
                                <TableHeader className="sticky top-0 z-10 bg-white">
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nombre</TableHead>
                                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Categoria</TableHead>
                                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sub-Categoria</TableHead>
                                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sub-Sub-Categoria</TableHead>
                                        <TableHead className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Descripcion</TableHead>
                                        <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Valor</TableHead>
                                        <TableHead className="w-[140px] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {elementosCatalogoVisibles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                                                No se encontraron servicios o productos
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {elementosCatalogoVisibles.map((elemento, index) => (
                                        <TableRow
                                            key={elemento.id_producto ?? [
                                                elemento.tituloProducto,
                                                elemento.categoria_nombre,
                                                elemento.subcategoria_nombre,
                                                elemento.sub_sub_categoría_nombre,
                                                index
                                            ].join("-")}
                                            className="transition-colors duration-150 hover:bg-slate-50"
                                        >
                                            <TableCell className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-800">
                                                {elemento.tituloProducto}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-slate-500">
                                                {elemento.categoria_nombre}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-slate-500">
                                                {elemento.subcategoria_nombre}
                                            </TableCell>

                                            <TableCell className="px-4 py-3 text-slate-500">
                                                {elemento.sub_sub_categoría_nombre}
                                            </TableCell>

                                            <TableCell className="hidden max-w-[250px] truncate px-4 py-3 text-slate-500 md:table-cell">
                                                {elemento.descripcionProducto}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600">
                                                {formatearMonto(elemento.valorProducto)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertarNuevoDetalle(
                                                            id_cotizacion_paciente,
                                                            elemento.tituloProducto,
                                                            elemento.valorProducto
                                                        )}
                                                        className="inline-flex items-center justify-center gap-1 rounded-md border border-[#DDD6FE] bg-[#F3F0FF] px-2.5 py-1.5 text-xs font-semibold text-[#6E56CF] transition hover:bg-[#EDE9FE] active:scale-[0.97]"
                                                        aria-label={`Agregar ${elemento.tituloProducto} a la cotización`}
                                                    >
                                                        <Plus className="h-3.5 w-3.5"/>
                                                        Agregar
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </section>

                    <main className="min-w-0 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6E56CF] text-white">
                                    <ClipboardList className="h-3.5 w-3.5"/>
                                </div>
                                <h2 className="text-sm font-semibold text-slate-800">Detalle de la cotización</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500">ID Cotización: {id_cotizacion_paciente}</span>
                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F3F0FF] px-2 text-[11px] font-bold text-[#6E56CF]">
                                    {detalleCotizacionArray.length}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="min-w-[940px] table-fixed text-sm">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="w-[30%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Producto o servicio</TableHead>
                                        <TableHead className="w-[15%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Precio unitario</TableHead>
                                        <TableHead className="w-[32%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Observación</TableHead>
                                        <TableHead className="w-[8%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {detalleCotizacionArray.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-400">
                                                La cotización está vacía. Agrega productos o servicios desde el listado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {detalleCotizacionArray.map((elemento, index) => (
                                        <TableRow
                                            key={elemento.id_detalle}
                                            className="transition-colors duration-150 hover:bg-slate-50"
                                        >
                                            <TableCell className="px-4 py-2.5">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                                                        elemento.producto_servicio_cotizado === "producto"
                                                            ? "bg-amber-50 text-amber-600"
                                                            : "bg-sky-50 text-sky-600"
                                                    }`}>
                                                        {elemento.producto_servicio_cotizado === "producto"
                                                            ? <Package className="h-3.5 w-3.5"/>
                                                            : <Stethoscope className="h-3.5 w-3.5"/>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[13px] font-semibold text-slate-800">{elemento.producto_servicio_cotizado}</p>
                                                    </div>
                                                </div>
                                            </TableCell>



                                            <TableCell className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] font-medium text-slate-500">
                                                {formatearMonto(elemento.valor_producto_cotizado)}
                                            </TableCell>

                                            <TableCell className="px-4 py-2.5">
                                                <input
                                                    type="text"
                                                    value={elemento.observacion_producto_cotizado ?? ""}
                                                    onChange={(evento) => actualizarObservacionElemento(
                                                        elemento.id_detalle, evento.target.value, id_cotizacion_paciente)}
                                                    placeholder="Agregar observación"
                                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100"
                                                />
                                            </TableCell>





                                            <TableCell className="px-4 py-2.5">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => guardarObservacionDetalle(
                                                            elemento.id_detalle,
                                                            elemento.observacion_producto_cotizado,
                                                            id_cotizacion_paciente
                                                        )}
                                                        className="mr-2 flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 active:scale-[0.97]"
                                                        title="Guardar observación"
                                                        aria-label={`Guardar observación de ${elemento.producto_servicio_cotizado}`}
                                                    >
                                                        <Save className="h-3.5 w-3.5"/>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarDetalleEspecifico(
                                                            elemento.id_detalle,
                                                            id_cotizacion_paciente)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-[0.97]"
                                                        title="Quitar de la cotización"
                                                        aria-label={`Quitar ${elemento.producto_servicio_cotizado} de la cotización`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5"/>
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,420px)_1fr] xl:items-end">
                                <div>
                                    <div className="mb-2 flex items-center gap-2">
                                        <WalletCards className="h-4 w-4 text-[#6E56CF]"/>
                                        <div className="flex flex-wrap items-baseline gap-x-2">
                                            <p className="text-xs font-semibold text-slate-700">Abono del paciente</p>
                                            <p className="text-[10px] text-slate-400">Se descuenta del total.</p>
                                        </div>
                                    </div>
                                    <label className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-[#6E56CF] focus-within:ring-2 focus-within:ring-violet-100">
                                        <span className="flex w-9 shrink-0 items-center justify-center border-r border-slate-200 text-xs font-bold text-slate-400">$</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            max={totalCotizacion}
                                            value={abonoAplicado ?? ""}
                                            onChange={(evento) => cambiarAbonoPaciente(evento.target.value.replace(/\D/g, ""))}
                                            disabled={abonoAplicado === null}
                                            aria-label="Monto abonado por el paciente"
                                            className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-slate-700 outline-none disabled:cursor-wait disabled:text-slate-400"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
                                    <div className="sm:px-4">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Total tratamiento</p>
                                        <p className="mt-1 text-base font-semibold text-slate-700">{formatearMonto(totalCotizacion)}</p>
                                    </div>
                                    <div className="sm:px-4">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Abono paciente</p>
                                        <p className="mt-1 text-base font-semibold text-emerald-600">
                                            {abonoAplicado === null
                                                ? "Cargando..."
                                                : `- ${formatearMonto(abonoAplicado)}`}
                                        </p>
                                    </div>
                                    <div className="sm:pl-4 sm:text-right">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Saldo pendiente</p>
                                        <p className="mt-1 text-xl font-bold text-[#6E56CF]">{formatearMonto(saldoPendiente)}</p>
                                    </div>
                                </div>

                            </div>
                            <div className="mt-5 grid grid-cols-1 gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                                <label className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm sm:col-span-2 lg:w-auto">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Fecha PDF
                                    </span>
                                    <input
                                        type="date"
                                        value={fechaEmisionPDF}
                                        onChange={(evento) => setFechaEmisionPDF(evento.target.value)}
                                        disabled={enviandoCotizacionCorreo}
                                        aria-label="Fecha de emisión del PDF"
                                        className="bg-transparent text-xs font-semibold text-slate-700 outline-none disabled:cursor-wait disabled:text-slate-400"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={exportarPresupuestoPDF}
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-4 text-xs font-semibold text-[#6E56CF] shadow-sm transition hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98] lg:w-auto"
                                >
                                    <FileDown className="h-4 w-4"/>
                                    Exportar PDF
                                </button>
                                <BotonEnviarCotizacionCorreo
                                    enviando={enviandoCotizacionCorreo}
                                    envioConfirmado={envioCotizacionCorreoConfirmado}
                                    onClick={() => enviarCotizacionCorreo(id_cotizacion_paciente, fechaEmisionPDF)}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
