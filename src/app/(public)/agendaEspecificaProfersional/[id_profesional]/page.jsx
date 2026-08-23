"use client";
import {useMemo, useState, useEffect, useRef} from "react";
import {useAgenda} from "@/ContextosGlobales/AgendaContext";
import Link from "next/link";
import ShadcnButton2 from "@/Componentes/shadcnButton2";
import {toast} from "react-hot-toast";
import {useParams, useRouter} from "next/navigation";

/* ─────────────────────────────────────────────
   UTILIDADES PURAS (sin dependencias de React)
───────────────────────────────────────────── */

/** Convierte un Date a "YYYY-MM-DD" usando la zona horaria local */
function formatDateToYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Suma minutos a "HH:MM" y devuelve "HH:MM" */
function addMinutos(hhmm, mins) {
    const [hh, mm] = hhmm.split(":").map(Number);
    const total = hh * 60 + mm + mins;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Convierte "HH:MM" a minutos desde medianoche */
function toMinutes(hhmm) {
    const [hh, mm] = hhmm.split(":").map(Number);
    return hh * 60 + mm;
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */

export default function CalendarioMensualHoras() {
    const {id_profesional} = useParams();
    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL;

    /* ── Datos del profesional ── */
    const [nombreProfesional, setNombreProfesional] = useState("");

    /* ── Navegación de mes y fecha seleccionada ── */
    const [mesActual, setMesActual] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

    /*
     * Ref para evitar race-condition: si el usuario hace clic manualmente
     * mientras un checkBlocked async sigue corriendo, el resultado viejo
     * no debe sobrescribir la selección nueva.
     */
    const lastManualUpdateRef = useRef(0);

    /* ── Días bloqueados desde el dashboard ── */
    const [diasBloqueados, setDiasBloqueados] = useState(new Set());

    /*
     * ── Bloqueos crudos del profesional ──
     * Se conservan (además de `diasBloqueados`) para poder reanudar la grilla
     * de horarios justo al terminar un bloqueo parcial del día (ver `bloqueosDelDia`
     * y `attentionSlots` más abajo). No dispara ningún fetch adicional: se llena
     * desde la misma respuesta que ya se usa para calcular `diasBloqueados`.
     */
    const [bloqueosProfesional, setBloqueosProfesional] = useState([]);

    /*
     * ── Servicios/tarifas del profesional ──
     * Se carga al montar y al cambiar de profesional.
     * Cada item: { id_tarifaProfesional, nombreServicio, duracion_min, precio }
     */
    const [listaServicios, setListaServicios] = useState([]);
    const [cargandoServicios, setCargandoServicios] = useState(true);

    /*
     * ── Servicio activo ──
     * El paciente elige aquí su servicio ANTES de ver el calendario.
     * La duración (duracion_min) controla el tamaño de los bloques horarios.
     */
    const [servicioActivo, setServicioActivo] = useState(null);
    const [dropdownServicios, setDropdownServicios] = useState(false);
    const dropdownRef = useRef(null);
    const duracionMinutos = Number(servicioActivo?.duracion_min) || 60;

    /* ── Slots bloqueados (ya reservados) ── */
    const [blockedHours, setBlockedHours] = useState(new Set());
    const [checkingBlocked, setCheckingBlocked] = useState(false);

    /* ── Slots bloqueados por "Pago en curso" (estadoPeticion === 3) ── */
    const [pagoEnCursoSlots, setPagoEnCursoSlots] = useState(new Set());

    /* ── Contexto global de agenda (comparte datos con el formulario del paso 2) ── */
    const {
        horaInicio,
        fechaInicio,   // se usa para restaurar la fecha al volver desde el formulario
        setHoraInicio,
        setHoraFin,
        setFechaInicio,
        setFechaFinalizacion,
        setServicio,   // persiste el servicio elegido para el formulario
        servicio,      // servicio guardado; permite restaurar la selección al retroceder
    } = useAgenda();

    /* ══════════════════════════════════════════
       EFECTOS DE CARGA
    ══════════════════════════════════════════ */

    /** Nombre del profesional */
    useEffect(() => {
        if (!id_profesional) return;
        fetch(`${API}/profesionales/seleccionarProfesional`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id_profesional}),
        })
            .then(r => r.json())
            .then(data => {
                if (data?.[0]?.nombreProfesional) setNombreProfesional(data[0].nombreProfesional);
            })
            .catch(err => console.error("[Agenda] nombre profesional:", err));
    }, [id_profesional]);

    /**
     * Servicios/tarifas del profesional.
     * Si no hay tarifas configuradas se muestra un mensaje al usuario.
     */
    useEffect(() => {
        if (!id_profesional) return;
        setCargandoServicios(true);
        fetch(`${API}/tarifasProfesional/seleccionarTarifasPorProfesional`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({profesional_id: id_profesional}),
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => { if (Array.isArray(data)) setListaServicios(data); })
            .catch(err => console.error("[Agenda] servicios:", err))
            .finally(() => setCargandoServicios(false));
    }, [id_profesional]);

    /**
     * Restauración al retroceder desde el formulario.
     *
     * Cuando el usuario llega a esta página viniendo del formulario (RETROCEDER),
     * el contexto todavía tiene el servicio, fecha y hora que eligió antes.
     * Este efecto los recupera una vez que `listaServicios` termina de cargar,
     * dejando la pantalla exactamente como el usuario la dejó.
     *
     * Condiciones para activarse:
     *  - `listaServicios` ya cargó y tiene items (evita correr con array vacío)
     *  - `servicio` existe en el contexto (hay algo que restaurar)
     *  - `servicioActivo` es null (no hay selección local ya, evita sobrescribir)
     */
    useEffect(() => {
        if (cargandoServicios || listaServicios.length === 0) return;
        if (!servicio || servicioActivo) return;

        // Busca la tarifa completa en la lista usando el id guardado en contexto
        const match = listaServicios.find(t => t.id_tarifaProfesional === servicio.id);
        if (!match) return;

        setServicioActivo(match);

        // Restaura también la fecha seleccionada si había una
        if (fechaInicio) {
            const [y, m, d] = fechaInicio.split("-").map(Number);
            setFechaSeleccionada(new Date(y, m - 1, d));
        }
    }, [cargandoServicios, listaServicios]);
    // Dependencias intencionales: solo corre cuando la lista termina de cargar.
    // `servicio` y `servicioActivo` se usan como guards, no como triggers.

    /**
     * Reservas no disponibles (estadoPeticion !== 0).
     * Las reservas con estadoPeticion === 0 SÍ deben mostrarse como disponibles.
     */
    useEffect(() => {
        if (!id_profesional || !fechaSeleccionada) {
            setPagoEnCursoSlots(new Set());
            return;
        }

        const fechaYMD = formatDateToYMD(fechaSeleccionada);
        fetch(`${API}/reservaPacientes/seleccionarReservados`, {
            method: "POST",
            headers: {Accept: "application/json", "Content-Type": "application/json"},
            body: JSON.stringify({
                id_profesional,
                fechaInicio: fechaYMD,
                fechaFinalizacion: fechaYMD,
            }),
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (!Array.isArray(data)) return;
                const noDisponiblesSet = new Set();
                data.forEach(reserva => {
                    const estadoPeticion = Number(reserva.estadoPeticion);
                    // Bloquear solo si NO es estado 0 (estado 0 = disponible)
                    if (estadoPeticion !== 0) {
                        const hora = (reserva.horaInicio || "").slice(0, 5);
                        if (hora) noDisponiblesSet.add(hora);
                    }
                });
                setPagoEnCursoSlots(noDisponiblesSet);
            })
            .catch(err => {
                console.error("[Agenda] error cargando no disponibles:", err);
                setPagoEnCursoSlots(new Set());
            });
    }, [id_profesional, fechaSeleccionada]);

    /**
     * Días bloqueados por jornada completa (09:00–22:00).
     * Se pintan grises en el calendario y no son seleccionables.
     */
    useEffect(() => {
        if (!id_profesional) return;
        fetch(`${API}/bloqueoAgenda/seleccionarBloqueosPorProfesional`, {
            method: "POST",
            headers: {"Content-Type": "application/json", Accept: "application/json"},
            body: JSON.stringify({id_profesional}),
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (!Array.isArray(data)) return;
                setBloqueosProfesional(data);
                const set = new Set();
                data.forEach(b => {
                    const ini = (b.horaInicio ?? "").slice(0, 5);
                    const fin = (b.horaFinalizacion ?? "").slice(0, 5);
                    if (ini > "09:00" || fin < "22:00") return; // no es jornada completa
                    const fIni = (b.fechaInicio ?? "").slice(0, 10);
                    const fFin = (b.fechaFinalizacion ?? "").slice(0, 10);
                    if (!fIni || !fFin) return;
                    const cur = new Date(fIni + "T00:00:00");
                    const lim = new Date(fFin + "T00:00:00");
                    while (cur <= lim) { set.add(formatDateToYMD(cur)); cur.setDate(cur.getDate() + 1); }
                });
                setDiasBloqueados(set);
            })
            .catch(err => console.error("[Agenda] días bloqueados:", err));
    }, [id_profesional]);

    /** Cierra el dropdown de servicios al hacer clic fuera */
    useEffect(() => {
        function handleClickFuera(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownServicios(false);
            }
        }
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    /* ══════════════════════════════════════════
       GENERACIÓN DE BLOQUES HORARIOS
    ══════════════════════════════════════════ */

    /**
     * Bloqueos parciales que caen dentro del día seleccionado (solo horaInicio/horaFinalizacion).
     * Se usan para reanudar la grilla de horarios justo donde termina cada bloqueo,
     * en vez de perder el tiempo libre restante hasta el próximo bloque de la grilla fija.
     * No afecta el cálculo de `diasBloqueados` (jornada completa), que sigue igual.
     */
    const bloqueosDelDia = useMemo(() => {
        if (!fechaSeleccionada) return [];
        const ymd = formatDateToYMD(fechaSeleccionada);
        return bloqueosProfesional
            .filter(b => {
                const fIni = (b.fechaInicio ?? "").slice(0, 10);
                const fFin = (b.fechaFinalizacion ?? "").slice(0, 10);
                return fIni && fFin && fIni <= ymd && ymd <= fFin;
            })
            .map(b => ({
                ini: (b.horaInicio ?? "").slice(0, 5),
                fin: (b.horaFinalizacion ?? "").slice(0, 5),
            }))
            .filter(b => b.ini && b.fin);
    }, [fechaSeleccionada, bloqueosProfesional]);

    /**
     * Genera los bloques de atención para el día seleccionado.
     *
     * Reglas:
     *  - Lunes a Sábado, 09:00 – 22:00.
     *  - Duración de cada bloque = duracionMinutos (configurado en tarifaServicio).
     *  - Bloques consecutivos desde las 09:00, sin gap entre ellos.
     *    (Si se necesita buffer de limpieza, aumentar duracion_min en el dashboard.)
     *  - Además, por cada bloqueo parcial del día, se agrega una cadena extra de
     *    bloques consecutivos que arranca exactamente al minuto en que termina ese
     *    bloqueo (sin redondear a ningún horario fijo), para no perder el tiempo
     *    libre que quede hasta el próximo bloque de la grilla original. La grilla
     *    original nunca se remueve — solo se agregan candidatos adicionales, y todos
     *    (los de siempre y los nuevos) se siguen validando igual contra el backend
     *    en `checkBlocked`. Si no hay bloqueos ese día, el resultado es idéntico al
     *    de antes de este cambio.
     *
     * Se recalcula solo cuando cambia la fecha seleccionada, el servicio activo,
     * o los bloqueos del día.
     */
    const attentionSlots = useMemo(() => {
        if (!fechaSeleccionada || !servicioActivo) return [];
        if (fechaSeleccionada.getDay() === 0) return []; // domingo cerrado

        const inicio = 9 * 60;   // 09:00 en minutos
        const fin    = 22 * 60;  // 22:00 en minutos
        const dur    = duracionMinutos;

        const puntosInicio = new Set();
        for (let cur = inicio; cur + dur <= fin; cur += dur) puntosInicio.add(cur);

        bloqueosDelDia.forEach(b => {
            const finBloqueo = toMinutes(b.fin);
            if (finBloqueo <= inicio || finBloqueo >= fin) return;
            for (let cur = finBloqueo; cur + dur <= fin; cur += dur) puntosInicio.add(cur);
        });

        const pad = (n) => String(n).padStart(2, "0");
        return [...puntosInicio].sort((a, b) => a - b).map(cur => ({
            start: `${pad(Math.floor(cur / 60))}:${pad(cur % 60)}`,
            end:   `${pad(Math.floor((cur + dur) / 60))}:${pad((cur + dur) % 60)}`,
        }));
    }, [fechaSeleccionada, servicioActivo, duracionMinutos, bloqueosDelDia]);

    /* ══════════════════════════════════════════
       VALIDACIÓN DE DISPONIBILIDAD (backend)
    ══════════════════════════════════════════ */

    /**
     * Pregunta al backend si un slot específico está disponible para este profesional.
     * Retorna { available: bool } o { available: true, error: true } si hay fallo de red
     * (falla abierta para no bloquear al usuario por problemas de conectividad).
     */
    async function validarSlot(fechaYMD, horaStart, horaEnd) {
        try {
            const res = await fetch(`${API}/reservaPacientes/validar`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                body: JSON.stringify({
                    fechaInicio: fechaYMD, horaInicio: horaStart,
                    fechaFinalizacion: fechaYMD, horaFinalizacion: horaEnd,
                    id_profesional,
                }),
            });
            let body;
            try { body = await res.json(); } catch { body = null; }

            if (body?.message === true)  return {available: true};
            if (body?.message === false) return {available: false};
            return {available: res.ok};
        } catch (err) {
            console.error("[Agenda] validarSlot error:", err);
            return {available: true, error: true}; // falla abierta
        }
    }

    /**
     * Cuando cambia la fecha seleccionada, comprueba en paralelo (batches de 6)
     * qué slots ya están reservados y los marca como bloqueados.
     */
    useEffect(() => {
        let mounted = true;
        const checkStart = Date.now();

        async function checkBlocked() {
            if (!fechaSeleccionada) { if (mounted) setBlockedHours(new Set()); return; }
            setCheckingBlocked(true);
            const fechaYMD = formatDateToYMD(fechaSeleccionada);

            try {
                const BATCH = 6;
                const resultados = [];
                for (let i = 0; i < attentionSlots.length; i += BATCH) {
                    const batch = attentionSlots.slice(i, i + BATCH);
                    const rows = await Promise.all(
                        batch.map(async s => ({h: s.start, ...(await validarSlot(fechaYMD, s.start, s.end))}))
                    );
                    resultados.push(...rows);
                }

                if (!mounted || lastManualUpdateRef.current > checkStart) return;

                const blocked = new Set(resultados.filter(r => r.available === false).map(r => r.h));
                setBlockedHours(blocked);

                // Si el slot actualmente elegido quedó ocupado, limpiarlo
                if (horaInicio && blocked.has(horaInicio)) {
                    setHoraInicio(""); setHoraFin(""); setFechaInicio(""); setFechaFinalizacion("");
                    toast.error("La hora seleccionada ya no está disponible");
                }
            } catch { if (mounted) setBlockedHours(new Set()); }
            finally  { if (mounted) setCheckingBlocked(false); }
        }

        checkBlocked();
        return () => { mounted = false; };
    }, [fechaSeleccionada, attentionSlots]);

    /* ══════════════════════════════════════════
       HANDLERS
    ══════════════════════════════════════════ */

    /**
     * El paciente elige un servicio.
     * Se resetea la fecha y hora porque los bloques del nuevo servicio
     * pueden tener distinta duración.
     */
    function seleccionarServicio(tarifa) {
        setServicioActivo(tarifa);
        setServicio(tarifa);  // persiste en contexto global para el formulario
        setDropdownServicios(false);
        // Reset de selección de fecha/hora
        setFechaSeleccionada(null);
        setHoraInicio(""); setHoraFin(""); setFechaInicio(""); setFechaFinalizacion("");
        setBlockedHours(new Set());
    }

    /** Selección de un día del calendario */
    function seleccionarFecha(fecha) {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const dia = new Date(fecha); dia.setHours(0, 0, 0, 0);
        if (dia < hoy) { toast.error("No puedes agendar en fechas pasadas"); return; }
        if (fecha.getDay() === 0) {
            toast.error("No hay atención los días domingo.", {
                duration: 4000,
                style: {background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5"},
            });
            return;
        }
        setFechaSeleccionada(fecha);
        const ymd = formatDateToYMD(fecha);
        if (horaInicio) {
            // Recalcula horaFin con la duración del servicio activo
            setHoraFin(addMinutos(horaInicio, duracionMinutos));
            setFechaInicio(ymd); setFechaFinalizacion(ymd);
        } else {
            setHoraFin(""); setFechaInicio(""); setFechaFinalizacion("");
        }
    }

    /** Selección de un bloque horario */
    function seleccionarHora(hora) {
        // Bloquear horas pasadas si el día seleccionado es hoy
        if (fechaSeleccionada) {
            const hoy = new Date(); const dia = new Date(fechaSeleccionada);
            hoy.setHours(0,0,0,0); dia.setHours(0,0,0,0);
            if (dia.getTime() === hoy.getTime()) {
                const ahora = new Date();
                if (toMinutes(hora) < ahora.getHours() * 60 + ahora.getMinutes()) {
                    toast.error("No puedes agendar una hora que ya pasó");
                    return;
                }
            }
        }

        // horaFin se calcula con la duración real del servicio elegido
        const horaFin = addMinutos(hora, duracionMinutos);
        setHoraInicio(hora);
        setHoraFin(horaFin);

        if (fechaSeleccionada) {
            const ymd = formatDateToYMD(fechaSeleccionada);
            setFechaInicio(ymd); setFechaFinalizacion(ymd);
            lastManualUpdateRef.current = Date.now();

            // Revalida vecinos para evitar que aparezcan bloqueados falsamente
            (async () => {
                try {
                    const idx = attentionSlots.findIndex(s => s.start === hora);
                    if (idx === -1) return;
                    const vecinos = [attentionSlots[idx - 1], attentionSlots[idx + 1]].filter(Boolean);
                    for (const v of vecinos) {
                        const r = await validarSlot(ymd, v.start, v.end);
                        if (r?.available) {
                            setBlockedHours(prev => {
                                if (!prev.has(v.start)) return prev;
                                const copia = new Set(prev); copia.delete(v.start); return copia;
                            });
                        }
                    }
                } catch (err) { console.error("[Agenda] revalidar vecinos:", err); }
            })();

            const params = new URLSearchParams({
                fechaInicio: ymd,
                fechaFinalizacion: ymd,
                horaInicio: hora,
                horaFin,
            });

            router.push(`/formularioReservaProfesional/${id_profesional}?${params.toString()}`);
        }
    }

    /**
     * Avanza al formulario de datos del paciente (paso 2).
     * Requiere que el paciente haya elegido: servicio + fecha + hora.
     */
    function irAlFormulario() {
        if (!servicioActivo) { toast.error("Primero selecciona un servicio"); return; }
        if (!horaInicio)     { toast.error("Selecciona una fecha y horario para continuar"); return; }
        router.push(`/formularioReservaProfesional/${id_profesional}`);
    }

    /* ══════════════════════════════════════════
       DATOS PARA EL GRID DEL CALENDARIO
    ══════════════════════════════════════════ */

    const dias = (() => {
        const year = mesActual.getFullYear(), month = mesActual.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const arr = Array(firstDay).fill(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
        return arr;
    })();

    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 px-4 pt-32 pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">

                {/* ── Header ── */}
                <header className="mb-6 flex flex-col items-center gap-2 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Agenda · Online
                    </div>
                    <h1
                        className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900"
                        style={{ fontFamily: "var(--font-outfit)" }}
                    >
                        {nombreProfesional || "Cargando..."}
                    </h1>
                    <p className="max-w-md text-sm leading-6 text-slate-500">
                        Selecciona un servicio, luego elige fecha y horario disponible.
                    </p>
                </header>

                {/* ════════════════════════════════════
                    PASO 1 — Selección de servicio
                    El paciente elige aquí qué servicio
                    necesita. Esto determina la duración
                    de los bloques del calendario.
                ════════════════════════════════════ */}
                <div className="relative z-10 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/70 text-slate-800">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">Selecciona un servicio</h2>
                        <span className="text-[12px] text-slate-500">Paso 1 de 2</span>
                    </div>
                    <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"/>

                    {cargandoServicios ? (
                        <p className="mt-4 text-center text-sm text-slate-400 py-6">Cargando servicios...</p>
                    ) : listaServicios.length === 0 ? (
                        <p className="mt-4 text-center text-sm text-slate-400 py-6">
                            Este profesional aún no tiene servicios configurados.
                        </p>
                    ) : (
                        <div className="mt-3 relative" ref={dropdownRef}>
                            {/* Trigger del dropdown */}
                            <button
                                type="button"
                                onClick={() => setDropdownServicios(v => !v)}
                                className={
                                    "w-full flex items-center justify-between rounded-xl border p-3 shadow-sm transition hover:shadow-md hover:shadow-slate-900/5 " +
                                    (servicioActivo ? "bg-green-50 border-green-300" : "bg-white/90 border-slate-200 hover:border-gray-400")
                                }
                            >
                                <div className="text-left">
                                    {servicioActivo ? (
                                        <>
                                            <div className="text-sm font-medium text-slate-800">{servicioActivo.nombreServicio}</div>
                                            <div className="text-xs text-slate-500">
                                                {servicioActivo.duracion_min} min
                                                {Number(servicioActivo.precio) > 0 && ` · $${Number(servicioActivo.precio).toLocaleString("es-CL")}`}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-slate-400">Elige un servicio...</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {servicioActivo && (
                                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-green-600 text-white">
                                            Seleccionado
                                        </span>
                                    )}
                                    <svg
                                        className={"w-4 h-4 text-slate-400 transition-transform duration-200 " + (dropdownServicios ? "rotate-180" : "")}
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </div>
                            </button>

                            {/* Lista desplegable — max-h + scroll interno propio: sin esto, con muchos
                                servicios el panel crecía sin límite y terminaba superpuesto con el footer */}
                            {dropdownServicios && (
                                <div className="absolute z-20 mt-1 w-full max-h-[280px] overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
                                    {listaServicios.map((tarifa, idx) => {
                                        const activo = servicioActivo?.id_tarifaProfesional === tarifa.id_tarifaProfesional;
                                        return (
                                            <button
                                                key={tarifa.id_tarifaProfesional}
                                                type="button"
                                                onClick={() => seleccionarServicio(tarifa)}
                                                className={
                                                    "w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50 " +
                                                    (activo ? "bg-green-50" : "") +
                                                    (idx < listaServicios.length - 1 ? " border-b border-slate-100" : "")
                                                }
                                            >
                                                <div>
                                                    <div className={"text-sm font-medium " + (activo ? "text-green-700" : "text-slate-800")}>
                                                        {tarifa.nombreServicio}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{tarifa.duracion_min} min de atención</div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                                    {Number(tarifa.precio) > 0 && (
                                                        <span className={"text-sm font-semibold " + (activo ? "text-green-700" : "text-slate-600")}>
                                                            ${Number(tarifa.precio).toLocaleString("es-CL")}
                                                        </span>
                                                    )}
                                                    {activo && (
                                                        <svg className="w-4 h-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <br/>

                {/* ════════════════════════════════════
                    PASO 2 — Calendario
                    Solo se muestra cuando el paciente
                    ya eligió un servicio.
                    Los bloques son de `duracionMinutos`
                    minutos (sin gap entre ellos).
                ════════════════════════════════════ */}
                {servicioActivo && (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/70 text-slate-800">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-800">Agenda mensual</h2>
                            <span className="text-[12px] text-slate-500">Paso 2 de 2 · Selecciona un día</span>
                        </div>
                        <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"/>

                        {/* Navegación mes */}
                        <div className="mt-3 flex items-center justify-between">
                            <button
                                className="rounded-lg border border-gray-900 bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md hover:bg-gray-800 active:scale-[0.98]"
                                 onClick={() => {
                                     const nuevaFecha = new Date(mesActual);
                                     nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
                                     setMesActual(nuevaFecha);
                                     setFechaSeleccionada(null);
                                     setHoraInicio(""); setHoraFin(""); setFechaInicio(""); setFechaFinalizacion("");
                                 }}
                            >←</button>
                            <strong className="capitalize text-sm font-semibold text-slate-800">
                                {mesActual.toLocaleString("es-CL", {month: "long", year: "numeric"})}
                            </strong>
                            <button
                                className="rounded-lg border border-gray-900 bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md hover:bg-gray-800 active:scale-[0.98]"
                                 onClick={() => {
                                     const nuevaFecha = new Date(mesActual);
                                     nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
                                     setMesActual(nuevaFecha);
                                     setFechaSeleccionada(null);
                                     setHoraInicio(""); setHoraFin(""); setFechaInicio(""); setFechaFinalizacion("");
                                 }}
                            >→</button>
                        </div>

                        {/* Grid de días */}
                        <div className="mt-4 grid grid-cols-7 gap-2 rounded-xl bg-slate-900/[0.02] p-2 ring-1 ring-slate-900/5">
                            {["D","L","M","M","J","V","S"].map((d, idx) => (
                                <strong key={idx} className="text-center text-xs font-semibold text-slate-500">{d}</strong>
                            ))}
                            {dias.map((dia, i) => {
                                if (!dia) return <div key={i}/>;
                                const hoy = new Date(); hoy.setHours(0,0,0,0);
                                const d   = new Date(dia); d.setHours(0,0,0,0);
                                const pasado   = d < hoy;
                                const domingo  = dia.getDay() === 0;
                                const bloqueado= diasBloqueados.has(formatDateToYMD(dia));
                                const disabled = pasado || domingo || bloqueado;
                                const selected = fechaSeleccionada?.toDateString() === dia.toDateString();

                                return (
                                    <button
                                        key={i} type="button" disabled={disabled}
                                        title={bloqueado ? "Día no disponible" : undefined}
                                        onClick={() => { if (!disabled) seleccionarFecha(dia); }}
                                        className={
                                            "h-10 flex items-center justify-center rounded-md text-sm font-medium transition relative focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 " +
                                            (pasado || domingo
                                                ? "cursor-not-allowed border border-slate-200/70 bg-white/60 text-slate-300 opacity-50"
                                                : bloqueado
                                                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                                    : selected
                                                        ? "border border-gray-900 bg-gray-900 text-white shadow-md"
                                                        : "border border-slate-200 bg-white/90 text-slate-700 hover:bg-white hover:border-gray-400 hover:shadow-md")
                                        }
                                    >
                                        {dia.getDate()}
                                        {bloqueado && <span className="absolute inset-x-1 bottom-1 h-0.5 rounded-full bg-slate-300"/>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Slots de horario (se muestra al elegir un día) */}
                        {fechaSeleccionada && (
                            <div className="mt-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800">Agenda (09:00–22:00)</h3>
                                    <div className="flex items-center gap-3">
                                        {/* Duración dinámica según servicio elegido */}
                                        <p className="text-xs text-slate-500">Bloques de {duracionMinutos} min</p>
                                        {checkingBlocked && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                                </svg>
                                                <span>Comprobando disponibilidad...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2 max-h-96 overflow-y-auto pr-1 rounded-xl bg-slate-900/[0.02] p-2 ring-1 ring-slate-900/5">
                                    {attentionSlots
                                        .filter(s => {
                                            if (blockedHours.has(s.start)) return false;
                                            if (pagoEnCursoSlots.has(s.start)) return false; // Pago en curso
                                            // Ocultar horas pasadas si es hoy
                                            if (fechaSeleccionada) {
                                                const hoy = new Date(); const dia = new Date(fechaSeleccionada);
                                                hoy.setHours(0,0,0,0); dia.setHours(0,0,0,0);
                                                if (dia.getTime() === hoy.getTime()) {
                                                    const ahora = new Date();
                                                    if (toMinutes(s.start) < ahora.getHours() * 60 + ahora.getMinutes()) return false;
                                                }
                                            }
                                            return true;
                                        })
                                        .map(s => {
                                            const sel = horaInicio === s.start;
                                            return (
                                                <div key={s.start}
                                                    className={"flex items-center justify-between rounded-xl border p-3 shadow-sm hover:shadow-md hover:shadow-slate-900/5 transition " +
                                                        (sel ? "bg-green-50 border-green-300" : "bg-white/90 border-slate-200")}>
                                                    <div>
                                                        {/* Muestra el nombre del servicio en cada slot */}
                                                        <div className="text-sm font-medium text-slate-800">{servicioActivo.nombreServicio}</div>
                                                        <div className="text-xs text-slate-500">{s.start} – {s.end}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => seleccionarHora(s.start)}
                                                        className={"px-3 py-1 rounded-lg font-semibold shadow-sm transition active:scale-[0.98] " +
                                                            (sel ? "bg-green-600 text-white shadow-md" : "bg-gray-900 text-white hover:bg-gray-800")}
                                                    >
                                                        {sel ? "Seleccionada" : "Seleccionar"}
                                                    </button>
                                                </div>
                                            );
                                        })}

                                    {/* Sin horarios disponibles */}
                                    {!checkingBlocked && attentionSlots.filter(s => !blockedHours.has(s.start) && !pagoEnCursoSlots.has(s.start)).length === 0 && (
                                        <div className="text-center py-8 text-red-500">
                                            <p className="text-sm">No hay horarios disponibles para esta fecha</p>
                                            <p className="text-xs mt-1">Por favor selecciona otra fecha</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <br/>

                {/* Botones de navegación */}
                <div className="flex gap-5 justify-center">
                    <Link href="/agendaProfesionales">
                        <ShadcnButton2 nombre="RETROCEDER"/>
                    </Link>
                    <ShadcnButton2 nombre="SIGUIENTE" funcion={irAlFormulario}/>
                </div>

                <footer className="mt-10 text-center text-xs text-slate-600">
                    <p>Atención clínica con un servicio personalizado para cada paciente.</p>
                    {/* Horarios comentados: cada cliente tiene su propio horario en la plataforma
                    <p className="mt-2 text-[11px] text-slate-400">
                        Horarios: Lun-Sáb 9:00-22:00 | Dom Cerrado
                    </p>
                    */}
                </footer>
            </div>
        </div>
    );
}
