"use client"
import {useEffect, useState} from "react";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ShadcnButton2 from "@/Componentes/shadcnButton2";
import {useAgenda} from "@/ContextosGlobales/AgendaContext";
import {toast} from "react-hot-toast";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {SelectDinamic} from "@/Componentes/SelectDinamic";
import {RutInput} from "@/Componentes/RutInput";
import {PhoneInput} from "@/Componentes/PhoneInput";

/* ─────────────────────────────────────────────
   FORMATO CLP
───────────────────────────────────────────── */
const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
});

/* ─────────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────────── */
export default function FormularioReservaProfesional() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const {id_profesional} = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    /* ── Datos del pacientE


     ── */
    const [nombrePaciente,   setNombrePaciente]   = useState("");
    const [apellidoPaciente, setApellidoPaciente] = useState("");
    const [rut,              setRut]              = useState("");
    const [telefono,         setTelefono]         = useState("");
    const [email,            setEmail]            = useState("");

    /* ── Datos del profesional ── */
    const [profesionalNombre,      setProfesionalNombre]      = useState("");
    const [descripcionProfesional, setDescripcionProfesional] = useState("");

    /*
     * ── Servicio seleccionado ──
     * En el flujo normal viene pre-seleccionado desde el calendario (context.servicio).
     * Si el usuario llega directamente a esta URL sin pasar por el calendario,
     * se muestra el selector de servicios como fallback.
     */
    const [listaTarifas,          setListaTarifas]          = useState([]);
    const [tarifaIndexFallback,   setTarifaIndexFallback]   = useState(""); // solo para el fallback
    const [servicioNombre,        setServicioNombre]        = useState("");
    const [totalPago,             setTotalPago]             = useState("");

    /*


    Contexto global (fecha, hora y servicio vienen del calendario) ── */
    const {
        horaInicio,
        horaFin,
        fechaInicio,
        fechaFinalizacion,
        servicio,
        setHoraInicio,
        setHoraFin,
        setFechaInicio,
        setFechaFinalizacion,
    } = useAgenda();

    /*
     * Al montar, si el contexto ya tiene un servicio elegido en el calendario
     * lo usamos directamente. Si no (acceso directo a la URL), esperamos
     * a que el usuario lo elija en el selector de fallback.
     */
    useEffect(() => {
        if (servicio) {
            setServicioNombre(servicio.nombre);
            setTotalPago(servicio.precio);
        }
    }, [servicio]);

    useEffect(() => {
        const fechaInicioQuery = searchParams.get("fechaInicio");
        const fechaFinalizacionQuery = searchParams.get("fechaFinalizacion");
        const horaInicioQuery = searchParams.get("horaInicio");
        const horaFinQuery = searchParams.get("horaFin");

        if (!fechaInicio && fechaInicioQuery) setFechaInicio(fechaInicioQuery);
        if (!fechaFinalizacion && fechaFinalizacionQuery) setFechaFinalizacion(fechaFinalizacionQuery);
        if (!horaInicio && horaInicioQuery) setHoraInicio(horaInicioQuery);
        if (!horaFin && horaFinQuery) setHoraFin(horaFinQuery);
    }, [
        searchParams,
        fechaInicio,
        fechaFinalizacion,
        horaInicio,
        horaFin,
        setFechaInicio,
        setFechaFinalizacion,
        setHoraInicio,
        setHoraFin,
    ]);

    /* ── Carga datos del profesional ── */
    useEffect(() => {
        if (!id_profesional) return;
        fetch(`${API}/profesionales/seleccionarProfesional`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id_profesional}),
        })
            .then(r => r.json())
            .then(data => {
                if (data?.[0]) {
                    setProfesionalNombre(data[0].nombreProfesional ?? "");
                    setDescripcionProfesional(data[0].descripcionProfesional ?? "");
                }
            })
            .catch(err => console.error("[Formulario] profesional:", err));
    }, [id_profesional]);

    /*
     * ── Carga tarifas para el selector de fallback ──
     * Solo se usa si el usuario llega directo a esta URL sin pasar por el calendario.
     */
    useEffect(() => {
        if (!id_profesional) return;
        fetch(`${API}/tarifasProfesional/seleccionarTarifasPorProfesional`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({profesional_id: id_profesional}),
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => { if (Array.isArray(data)) setListaTarifas(data); })
            .catch(err => console.error("[Formulario] tarifas fallback:", err));
    }, [id_profesional]);

    /* ══════════════════════════════════════════
       ACCIONES
    ══════════════════════════════════════════ */

    /**
     * Navega al comprobante de confirmación.
     * La reserva ya fue guardada antes de llamar a esta función.
     */
    function irAlComprobante() {
        setNombrePaciente(""); setApellidoPaciente(""); setRut("");
        setTelefono(""); setEmail("");
        // Pasa todos los datos relevantes al comprobante vía query params
        const params = new URLSearchParams({
            fecha:      fechaInicio,
            hora:       horaInicio,
            horaFin:    horaFin,
            profesional: profesionalNombre,
            servicio:   servicio?.nombre  || servicioNombre || "",
            duracion:   String(servicio?.duracion_min || 60),
            precio:     String(servicio?.precio || totalPago || ""),
        });
        router.push(`/reserva-hora?${params.toString()}`);
    }

    /**
     * Guarda la reserva en el backend (sin pago).
     * Validaciones:
     *  1. Debe haber fecha y hora (vienen del calendario).
     *  2. Todos los campos del paciente deben estar completos.
     */


    async function agendarSinPago() {
        const motivoReserva = (servicio?.nombre || servicioNombre || "").trim();
        const montoReserva = String(servicio?.precio ?? totalPago ?? "").trim();

        /* ── Validaciones de guard ── */
        if (!fechaInicio || !horaInicio || !horaFin) {
            toast.error("Debes seleccionar fecha y hora antes de completar el formulario. Vuelve al calendario.");
            return;
        }
        if (!motivoReserva || !montoReserva) {
            toast.error("Debes seleccionar un servicio antes de continuar.");
            return;
        }
        if (!nombrePaciente.trim() || !apellidoPaciente.trim() || !rut.trim() || !telefono.trim() || !email.trim()) {
            toast.error("Completa todos los campos del formulario");
            return;
        }

        try {
            const res = await fetch(`${API}/reservaPacientes/insertarReservaPacienteFicha`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                body: JSON.stringify({
                    nombrePaciente:    nombrePaciente.trim(),
                    apellidoPaciente:  apellidoPaciente.trim(),
                    nombreProfesional: profesionalNombre || "",
                    rut:               rut.trim(),
                    telefono:          telefono.trim(),
                    email:             email.trim(),
                    fechaInicio,
                    horaInicio,
                    fechaFinalizacion,
                    horaFinalizacion:  horaFin,
                    monto_reserva:     montoReserva,
                    motivo_reserva:    motivoReserva,
                    estadoReserva:     "reservada",
                    id_profesional,
                }),
            });

            let respuesta;
            try { respuesta = await res.json(); }
            catch { respuesta = null; }

            // Conflicto de horario (otro paciente tomó el slot entre medias)
            if (!res.ok && respuesta?.message === "conflicto") {
                toast.error("Ese horario ya fue tomado. Vuelve al calendario y elige otro.");
                return;
            }
            if (!res.ok) {
                console.error("[Formulario] error backend:", res.status, respuesta);
                toast.error(`No se pudo guardar la reserva (${res.status}). Intenta nuevamente.`);
                return;
            }
            if (respuesta?.message === true) {
                toast.success("¡Cita agendada correctamente!");
                irAlComprobante();
                return;
            }
            // Respuesta inesperada del backend
            console.warn("[Formulario] respuesta inesperada:", respuesta);
            toast.error("Respuesta inesperada del servidor. Intenta nuevamente.");
        } catch (err) {
            console.error("[Formulario] error de red:", err);
            toast.error("Error de conexión. Intenta nuevamente o contáctanos por WhatsApp.");
        }
    }



    async function pagarMercadoPago(
        tituloProducto,
        precio,
        nombrePaciente,
        apellidoPaciente,
        rut,
        telefono,
        email,
        fechaInicio,
        horaInicio,
        fechaFinalizacion,
        horaFinalizacion,
        estadoReserva ,
        totalPago,
        id_profesional
    ){
     try {

         if(
             !tituloProducto ||
             !precio ||
             !nombrePaciente ||
             !apellidoPaciente ||
             !rut ||
             !telefono ||
             !email ||
             !fechaInicio ||
             !horaInicio ||
             !fechaFinalizacion ||
             !horaFinalizacion ||
             !estadoReserva ||
             !totalPago ||
             !id_profesional){
             return toast.error("Por favor completa todos los campos antes de continuar.");
         }

         const res = await fetch(`${API}/pagosMercadoPago/create-order`, {
             method: "POST",
             headers: {Accept: "application/json", "Content-Type": "application/json"},
             body: JSON.stringify({
                 tituloProducto,
                 precio,
                 nombrePaciente,
                 apellidoPaciente,
                 rut,
                 telefono,
                 email,
                 fechaInicio,
                 horaInicio,
                 fechaFinalizacion,
                 horaFinalizacion,
                 estadoReserva ,
                 totalPago,
                 id_profesional
             }),
             cors: "no-cors",
             cache: "no-cache",
         })


         if (!res.ok) {
             return toast.error("No se puede procesar el pago por favor evalue otro medio de pago contactandonos por WhatsApp");
         }

         const data = await res.json();

         const checkoutUrl = data.init_point;
         if (!checkoutUrl) {
             return toast.error("No se puede procesar el pago por favor evalue otro medio de pago contactandonos por WhatsApp")
         }

         // Redirigimos al usuario al Checkout Pro de Mercado Pago
         window.location.href = checkoutUrl;

     }catch{
         return toast.error(`Error al procesar el pago con Mercado Pago.`);
     }
    }




    // ESTA FUNCION PERMITE SABER SI EL USUARIO TIENE UNA CUENTA DE MERCADO PAGO ACTIVA ALMACENADA EN LA BASE  DE DATOS
    const [estadoPasarela, setEstadoPasarela] = useState(false);
    async function obtenerEstadoPasarelaPago() {
        try {
            const res = await fetch(`${API}/persistence/obtenerPersistencia`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"}
            });

            if(!res.ok){
                return toast.error(`Error al vincular pasarela de pago. Respuesta inadecuada del servidor`);
            }

            const respuesta = await res.json();


            if (respuesta.primeraRespuesta?.estado_pasarela === 1) {
                setEstadoPasarela(true);
            }

        }catch(error){
            return toast.error(`Error al vincular pasarela de pago. ERROR: ${error}`);
        }

    }

    useEffect(() => {
        obtenerEstadoPasarelaPago();
    }, []);


    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 px-4 pt-28 pb-12 sm:pt-32 sm:pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">

                {/* ── Header ── */}
                <header className="animate-reveal-up mb-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-slate-500 shadow-sm">
                        Reserva Online
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        {profesionalNombre || "Cargando..."}
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                        {descripcionProfesional}
                    </p>
                    <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"/>
                </header>

                <form
                    className="animate-reveal-up-delay space-y-8 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur sm:p-8"
                    onSubmit={e => e.preventDefault()}
                >
                    {/* ════════════════════════════════
                        SECCIÓN: SERVICIO
                        Si viene del calendario → card readonly.
                        Si acceso directo → selector fallback.
                    ════════════════════════════════ */}
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Servicio</h2>
                        <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"/>

                        {servicio ? (
                            /*
                             * Servicio pre-seleccionado desde el calendario.
                             * Se muestra como card informativa (no editable aquí).
                             * Para cambiarlo el paciente debe volver al paso anterior.
                             */
                            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{servicio.nombre}</p>
                                    <p className="text-xs text-slate-500">{servicio.duracion_min} min de atención</p>
                                </div>
                                {Number(servicio.precio) > 0 && (
                                    <span className="text-sm font-bold text-emerald-700">
                                        {formatoCLP.format(servicio.precio)}
                                    </span>
                                )}
                            </div>
                        ) : (
                            /*
                             * Fallback: el paciente llegó directo a esta URL sin pasar por
                             * el calendario. Puede seleccionar el servicio aquí.
                             */
                            <div className="mt-4">
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Motivo de consulta</label>
                                <SelectDinamic
                                    value={tarifaIndexFallback}
                                    onChange={e => {
                                        const idx = e.target.value;
                                        setTarifaIndexFallback(idx);
                                        const t = listaTarifas[idx];
                                        if (t) { setServicioNombre(t.nombreServicio); setTotalPago(t.precio); }
                                    }}
                                    placeholder="Seleccione un servicio"
                                    options={listaTarifas.map((t, i) => ({
                                        value: i,
                                        label: `${t.nombreServicio}${Number(t.precio) > 0 ? ` — ${formatoCLP.format(t.precio)}` : ""}`,
                                    }))}
                                    className={tarifaIndexFallback !== "" ? "border-emerald-400 bg-emerald-50/50 font-medium text-slate-900" : ""}
                                />
                            </div>
                        )}
                    </div>

                    {/* ════════════════════════════════
                        SECCIÓN: DATOS PERSONALES
                    ════════════════════════════════ */}
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Datos personales</h2>
                        <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"/>
                        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nombre</label>
                                <ShadcnInput value={nombrePaciente} onChange={e => setNombrePaciente(e.target.value)} placeholder="Ej: Ana" className="w-full"/>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Apellido</label>
                                <ShadcnInput value={apellidoPaciente} onChange={e => setApellidoPaciente(e.target.value)} placeholder="Ej: Pérez" className="w-full"/>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">RUT</label>
                                <RutInput value={rut} onChange={clean => setRut(clean)}/>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Correo electrónico</label>
                                <ShadcnInput value={email} onChange={e => setEmail(e.target.value)} placeholder="ejemplo@correo.cl" className="w-full"/>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Teléfono</label>
                                <PhoneInput value={telefono} onChange={full => setTelefono(full)}/>
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════════════════
                        SECCIÓN: RESUMEN DE CITA
                        Muestra fecha, hora (con duración real)
                        y valor. Solo aparece si hay datos.
                    ════════════════════════════════ */}
                    {(fechaInicio || horaInicio || totalPago || servicioNombre) && (
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Resumen de tu cita</h2>
                            <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"/>
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {/* Servicio */}
                                    {servicioNombre && (
                                        <div className="flex items-center gap-3 sm:col-span-2">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs text-white font-bold">S</div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Servicio</p>
                                                <p className="text-sm font-semibold text-slate-800">{servicioNombre}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Fecha */}
                                    {fechaInicio && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs text-white">D</div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Fecha</p>
                                                <p className="text-sm font-semibold text-slate-800">{fechaInicio}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Horario */}
                                    {horaInicio && horaFin && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs text-white">H</div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Horario</p>
                                                <p className="text-sm font-semibold text-slate-800">{horaInicio} – {horaFin}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Valor */}
                                    {Number(totalPago) > 0 && (
                                        <div className="flex items-center gap-3 sm:col-span-2">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">$</div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Valor consulta</p>
                                                <p className="text-sm font-bold text-emerald-700">{formatoCLP.format(totalPago)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Botones ── */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                        <ShadcnButton2 nombre="RETROCEDER" funcion={() => router.push(`/agendaEspecificaProfersional/${id_profesional}`)}/>
                        {
                            estadoPasarela ?  <ShadcnButton2 nombre="FINALIZAR"
                                                             funcion={()=>pagarMercadoPago(
                                                                 servicio.nombre,
                                                                 totalPago,
                                                                 nombrePaciente,
                                                                 apellidoPaciente,
                                                                 rut,
                                                                 telefono,
                                                                 email,
                                                                 fechaInicio,
                                                                 horaInicio,
                                                                 fechaFinalizacion,
                                                                 horaFin,
                                                                 "reservada" ,
                                                                 totalPago,
                                                                 id_profesional
                                                                 )}/> :  <ShadcnButton2 nombre="FINALIZAR"  funcion={agendarSinPago}/>
                        }
                    </div>
                </form>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Revisa que los datos sean correctos antes de confirmar tu reserva.
                </p>
            </div>
        </div>
    );
}
