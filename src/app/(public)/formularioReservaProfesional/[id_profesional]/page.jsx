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
import {Banknote, CalendarDays, Clock, Stethoscope} from "lucide-react";

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

        if(procesando) return;

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
            setProcesando(true);
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

            try {
                respuesta = await res.json();
            } catch {
                setProcesando(false);
                respuesta = null;
            }

            // Conflicto de horario (otro paciente tomó el slot entre medias)
            if (!res.ok && respuesta?.message === "conflicto") {
                setProcesando(false);
                toast.error("Ese horario ya fue tomado. Vuelve al calendario y elige otro.");
                return;
            }
            if (!res.ok) {
                setProcesando(false);
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
            setProcesando(false);
            console.warn("[Formulario] respuesta inesperada:", respuesta);
            toast.error("Respuesta inesperada del servidor. Intenta nuevamente.");
        } catch (err) {
            setProcesando(false);
            console.error("[Formulario] error de red:", err);
            toast.error("Error de conexión. Intenta nuevamente o contáctanos por WhatsApp.");
        }
    }


    const [procesando, setProcesando] = useState(false);
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
         if(procesando) return;

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

         setProcesando(true);
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
             setProcesando(false);
             return toast.error("No se puede procesar el pago por favor evalue otro medio de pago contactandonos por WhatsApp");
         }

         const data = await res.json();

         const checkoutUrl = data.init_point;
         if (!checkoutUrl) {
             setProcesando(false);
             return toast.error("No se puede procesar el pago por favor evalue otro medio de pago contactandonos por WhatsApp")
         }

         // Redirigimos al usuario al Checkout Pro de Mercado Pago
         window.location.href = checkoutUrl;

     }catch{
         setProcesando(false);
         return toast.error(`Error al procesar el pago con Mercado Pago.`);
     }
    }




    // ESTA FUNCION PERMITE SABER SI EL USUARIO TIENE UNA CUENTA DE MERCADO PAGO ACTIVA ALMACENADA EN LA BASE  DE DATOS
    const [estadoPasarela, setEstadoPasarela] = useState(null);

    async function obtenerEstadoPasarelaPago() {
        try {
            const res = await fetch(`${API}/persistence/obtenerPersistencia`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"},
                cache: "no-cache",
            });

            if(!res.ok){
                return toast.error(`Error al vincular pasarela de pago. Respuesta inadecuada del servidor`);
            }

            const respuesta = await res.json();


            if (respuesta.primeraRespuesta?.estado_pasarela === 1) {
                return setEstadoPasarela(true);
            }

            if (respuesta.primeraRespuesta?.estado_pasarela === 0) {
                return setEstadoPasarela(false);
            }

            if (respuesta.primeraRespuesta?.estado_pasarela > 1) {
                return setEstadoPasarela(null);
            }

            if(respuesta.primeraRespuesta?.estado_pasarela === null || respuesta.primeraRespuesta?.estado_pasarela === undefined) {
                return setEstadoPasarela(null);
            }

            else {
                return setEstadoPasarela(null);
            }

        }catch(error){
            setEstadoPasarela(null);
            return toast.error(`Error al vincular pasarela de pago. ERROR: ${error}`);
        }

    }

    useEffect(() => {
        obtenerEstadoPasarelaPago();
    }, []);


    function mostrarBoton(booleanSuccess) {
        if(booleanSuccess === null){
            return(
                <ShadcnButton2
                    nombre="CARGANDO..."
                    disabled={true}
                    className="h-11 w-full rounded-lg px-6 font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                />
            )
        }
        if(booleanSuccess === true){
            return(
                <ShadcnButton2
                    nombre="FINALIZAR"
                    funcion={()=>pagarMercadoPago( servicio?.nombre || servicioNombre,
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
                        id_profesional)}
                    className="h-11 w-full rounded-lg px-6 font-semibold shadow-sm transition-colors sm:w-auto"
                />
            )
        }
        if(booleanSuccess === false){
            return(
                <ShadcnButton2
                    nombre="FINALIZAR"
                    funcion={agendarSinPago}
                    className="h-11 w-full rounded-lg px-6 font-semibold shadow-sm transition-colors sm:w-auto"
                />
            )
        }
    }



    function costoCero(totalPago) {
        let pago = Number(totalPago);
        if(pago === 0){
            return true;
        }else{
            return false;
        }
    }



    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 px-4 pt-28 pb-12 sm:pt-32 sm:pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-500 shadow-sm ring-1 ring-white">
                        Reserva Online
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        {profesionalNombre || "Cargando..."}
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                        {descripcionProfesional}
                    </p>
                    <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"/>
                </header>

                <form
                    className="flex flex-col gap-8 rounded-2xl border border-slate-200/80 border-t-2 border-t-violet-400/70 bg-white/95 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 sm:p-8"
                    onSubmit={e => e.preventDefault()}
                >
                    <div>
                        <h2 className="border-l-2 border-violet-400 pl-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Servicio</h2>
                        <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"/>

                        {servicio ? (
                            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/80 to-white px-4 py-3 shadow-sm transition-colors hover:border-violet-300">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{servicio.nombre}</p>
                                    <p className="text-xs text-slate-500">{servicio.duracion_min} min de atención</p>
                                </div>
                                {Number(servicio.precio) > 0 && (
                                    <span className="shrink-0 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-sm font-bold text-violet-700 shadow-sm">
                                        {formatoCLP.format(servicio.precio)}
                                    </span>
                                )}
                            </div>
                        ) : (
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
                                    className={tarifaIndexFallback !== "" ? "h-11 rounded-lg border-violet-400 bg-violet-50/50 font-medium text-slate-900 shadow-sm" : "h-11 rounded-lg border-slate-200 bg-slate-50/40 shadow-sm"}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 className="border-l-2 border-violet-400 pl-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Datos personales</h2>
                        <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"/>
                        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nombre</label>
                                <ShadcnInput readOnly={procesando} value={nombrePaciente} onChange={e => setNombrePaciente(e.target.value)} placeholder="Ej: Ana" className="h-11 w-full rounded-lg !border-slate-200 bg-slate-50/40 shadow-sm transition-shadow focus-visible:!border-slate-400 focus-visible:ring-slate-200"/>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Apellido</label>
                                <ShadcnInput readOnly={procesando} value={apellidoPaciente} onChange={e => setApellidoPaciente(e.target.value)} placeholder="Ej: Pérez" className="h-11 w-full rounded-lg !border-slate-200 bg-slate-50/40 shadow-sm transition-shadow focus-visible:!border-slate-400 focus-visible:ring-slate-200"/>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">RUT</label>
                                <RutInput readOnly={procesando} value={rut} onChange={clean => setRut(clean)} className="h-11 rounded-lg shadow-sm"/>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Correo electrónico</label>
                                <ShadcnInput readOnly={procesando} value={email} onChange={e => setEmail(e.target.value)} placeholder="ejemplo@correo.cl" className="h-11 w-full rounded-lg !border-slate-200 bg-slate-50/40 shadow-sm transition-shadow focus-visible:!border-slate-400 focus-visible:ring-slate-200"/>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Teléfono</label>
                                <PhoneInput readOnly={procesando} value={telefono} onChange={full => setTelefono(full)} className="h-11"/>
                            </div>
                        </div>
                    </div>

                    {(fechaInicio || horaInicio || totalPago || servicioNombre) && (
                        <div>
                            <h2 className="border-l-2 border-violet-400 pl-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Resumen de tu cita</h2>
                            <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"/>
                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                                {servicioNombre && (
                                    <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-4 sm:px-5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                                            <Stethoscope aria-hidden="true" className="size-5" strokeWidth={1.8}/>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Servicio</p>
                                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 sm:text-base">{servicioNombre}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                                    {fechaInicio && (
                                        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                                                <CalendarDays aria-hidden="true" className="size-5" strokeWidth={1.8}/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Fecha</p>
                                                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 sm:text-base">{fechaInicio}</p>
                                            </div>
                                        </div>
                                    )}
                                    {horaInicio && horaFin && (
                                        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                                                <Clock aria-hidden="true" className="size-5" strokeWidth={1.8}/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Horario</p>
                                                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 sm:text-base">{horaInicio} – {horaFin}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {Number(totalPago) > 0 && (
                                    <div className="flex items-center justify-between gap-4 border-t border-violet-100 bg-violet-50/70 px-4 py-4 sm:px-5">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200">
                                                <Banknote aria-hidden="true" className="size-5" strokeWidth={1.8}/>
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">Valor consulta</p>
                                        </div>
                                        <p className="shrink-0 text-lg font-bold tracking-tight tabular-nums text-violet-700 sm:text-xl">{formatoCLP.format(totalPago)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                        <ShadcnButton2
                            nombre="RETROCEDER"
                            funcion={() => router.push(`/agendaEspecificaProfersional/${id_profesional}`)}
                            className="h-11 w-full rounded-lg border border-slate-200 !bg-white px-6 font-semibold !text-slate-700 shadow-sm transition-colors hover:!bg-slate-50 sm:w-auto"
                        />
                        {
                           costoCero(totalPago) ? (<ShadcnButton2
                                   nombre="AGENDAR"
                                   funcion={agendarSinPago}
                                   className="h-11 w-full rounded-lg px-6 font-semibold shadow-sm transition-colors sm:w-auto"
                               />
                           ): procesando ? ( <ShadcnButton2 nombre="PROCESANDO...." disabled={true} className="h-11 w-full rounded-lg px-6 font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"/>
                            ) : mostrarBoton(estadoPasarela)
                        }
                    </div>
                </form>

                <p className="mt-6 text-center text-xs font-medium leading-5 text-slate-500">
                    Revisa que los datos sean correctos antes de confirmar tu reserva.
                </p>
            </div>
        </div>
    );
}
