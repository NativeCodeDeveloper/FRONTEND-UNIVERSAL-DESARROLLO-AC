"use client"

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ToasterClient from "@/Componentes/ToasterClient";
import { toast } from "react-hot-toast";

import es from "date-fns/locale/es";
import { InfoButton } from "@/Componentes/InfoButton";
import { SelectDinamic } from "@/Componentes/SelectDinamic";
import { AppointmentDrawer } from "@/Componentes/AppointmentDrawer";
import { AppointmentCard } from "@/Componentes/AppointmentCard";
import { StatusFilterChips } from "@/Componentes/StatusFilterChips";
import { getStateTokens } from "@/lib/designTokens";

const locales = { es: es };
const dfStartOfWeek = (date) => startOfWeek(date, { locale: es });
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: dfStartOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);
const HORA_MINIMA_AGENDA = 8;
const HORA_MAXIMA_AGENDA = 23;

function crearHoraLimite(hora, minuto = 0, segundo = 0) {
    const fecha = new Date();
    fecha.setHours(hora, minuto, segundo, 0);
    return fecha;
}

function normalizarIdProfesional(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor);
}

function normalizarCorreoOpcional(valor) {
    const correo = (valor ?? "").trim();
    return correo || null;
}

export default function Calendario() {
    return (
        <Suspense fallback={<div className="min-h-screen grid place-items-center"><span className="text-sm text-slate-400">Cargando calendario...</span></div>}>
            <CalendarioContent />
        </Suspense>
    );
}

function CalendarioContent() {

    const API = process.env.NEXT_PUBLIC_API_URL;
    const popupRef = useRef(null);
    const popupDragStateRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
    const selectionGuardRef = useRef({ missingProfessional: false, overlap: false, past: false, outOfHours: false });

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            /* ── Base calendar ── */
            .rbc-calendar, .rbc-time-view, .rbc-month-view {
                border: 0 !important;
                background: transparent !important;
            }
            .rbc-time-header-content,
            .rbc-time-content,
            .rbc-time-view,
            .rbc-timeslot-group,
            .rbc-day-bg + .rbc-day-bg,
            .rbc-month-row + .rbc-month-row,
            .rbc-header + .rbc-header,
            .rbc-time-header-content + .rbc-time-header-content {
                border-color: #F1F5F9 !important;
            }
            .rbc-time-view .rbc-time-gutter .rbc-label {
                font-size: 11px !important;
                color: #94a3b8 !important;
                font-weight: 500 !important;
                padding-right: 8px !important;
            }
            .rbc-time-slot {
                transition: background-color 120ms ease !important;
                border-top: none !important;
            }
            .rbc-timeslot-group {
                border-bottom: 1px solid #F1F5F9 !important;
            }
            .rbc-day-slot .rbc-time-slot:hover {
                background: rgba(168, 85, 247, 0.04) !important;
            }
            .rbc-today {
                background: rgba(110, 86, 207, 0.04) !important;
            }
            .rbc-current-time-indicator {
                background-color: #6E56CF !important;
                height: 2px !important;
                z-index: 3 !important;
            }
            .rbc-current-time-indicator::before {
                content: '';
                position: absolute;
                left: -4px;
                top: -4px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #6E56CF;
            }
            .rbc-slot-selection {
                background: rgba(110, 86, 207, 0.10) !important;
                border: 1px solid rgba(110, 86, 207, 0.35) !important;
                border-radius: 12px !important;
            }
            .rbc-selected-cell {
                background: rgba(110, 86, 207, 0.04) !important;
            }
            .rbc-event,
            .rbc-background-event {
                border-radius: 10px !important;
                box-shadow: 0 1px 4px rgba(0,0,0,0.07) !important;
                overflow: hidden !important;
                border: none !important;
            }
            /* Número de día hoy en mes — círculo violeta */
            .rbc-date-cell.rbc-now > a,
            .rbc-date-cell.rbc-now > button,
            .rbc-date-cell.rbc-now > span {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 26px !important;
                height: 26px !important;
                background: #6E56CF !important;
                color: white !important;
                border-radius: 50% !important;
                font-weight: 700 !important;
                font-size: 12px !important;
            }
            .rbc-background-event {
                background-color: rgba(107, 114, 128, 0.08) !important;
                border-left: 4px solid rgba(71, 85, 105, 0.4) !important;
            }
            .rbc-addons-dnd-resizable {
                border-radius: 0 !important;
            }
            .rbc-addons-dnd-resize-anchor {
                width: 100% !important;
                height: 6px !important;
            }

            /* ── Vista Mes — flexbox equal rows, no min-height conflict ── */
            .rbc-month-view {
                display: flex !important;
                flex-direction: column !important;
            }
            .rbc-month-view .rbc-month-header {
                flex-shrink: 0 !important;
            }
            .rbc-month-view .rbc-month-row {
                flex: 1 1 0 !important;
                min-height: 0 !important;
                overflow: hidden !important;
            }
            .rbc-month-view .rbc-row-bg,
            .rbc-month-view .rbc-row-content {
                overflow: hidden !important;
            }
            /* Ocultar línea de hora actual en vista mes */
            .rbc-month-view .rbc-current-time-indicator {
                display: none !important;
            }
            .rbc-month-view .rbc-event {
                height: 22px !important;
                min-height: 22px !important;
                max-height: 22px !important;
                padding: 0 4px !important;
                line-height: 22px !important;
                overflow: hidden !important;
                font-size: 11px !important;
                border-radius: 4px !important;
                margin-bottom: 2px !important;
            }
            .rbc-row-segment {
                padding: 0 2px 1px !important;
            }

            /* ── "Ver más" link (show-more) ── */
            .rbc-show-more {
                color: #6E56CF !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                padding: 2px 6px !important;
                margin: 0 2px !important;
                cursor: pointer !important;
                background: #F3F0FF !important;
                border-radius: 4px !important;
                display: inline-block !important;
            }
            .rbc-show-more:hover {
                background: #EDE9FE !important;
                text-decoration: none !important;
            }

            /* ── Popup overlay al hacer clic en "ver más" ── */
            .rbc-overlay {
                background: white !important;
                border-radius: 14px !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12) !important;
                padding: 6px !important;
                z-index: 9999 !important;
                min-width: 220px !important;
            }
            .rbc-overlay-header {
                border-bottom: 1px solid #f1f5f9 !important;
                padding: 6px 8px 8px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                color: #334155 !important;
                text-transform: capitalize !important;
                letter-spacing: 0.02em !important;
            }
            .rbc-overlay .rbc-event {
                margin-bottom: 3px !important;
                border-radius: 6px !important;
            }

            /* ── Vista Semana / Día ── */
            .rbc-time-view .rbc-event {
                min-height: 0 !important;
                overflow: hidden !important;
            }
            .rbc-event-label {
                display: none !important;
            }
            .rbc-event-content {
                height: 100% !important;
                overflow: hidden !important;
                font-size: inherit !important;
            }
            /* Altura de slot — 40px por cada 30 min (escala natural) */
            .rbc-timeslot-group {
                min-height: 40px !important;
            }

            /* ── Header día en vista semana ── */
            .rbc-header {
                font-size: 13px !important;
                font-weight: 600 !important;
                padding: 0 !important;
                border-bottom: 1px solid #F1F5F9 !important;
            }

            /* ── Mobile ── */
            @media (max-width: 767px) {
                .rbc-time-view,
                .rbc-time-content,
                .rbc-day-slot,
                .rbc-time-column {
                    touch-action: pan-y !important;
                }
                .rbc-toolbar {
                    flex-wrap: wrap !important;
                }
                .rbc-toolbar button {
                    min-height: 38px !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState("week");
    const [esMobile, setEsMobile] = useState(false);
    const [monthPopover, setMonthPopover] = useState(null);
    const lastClickPos = useRef({ x: 0, y: 0 });

    const searchParams = useSearchParams();

    const [nombrePaciente, setNombrePaciente] = useState("");
    const [apellidoPaciente, setApellidoPaciente] = useState("");
    const [rut, setRut] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");

    // Precargar datos del paciente si vienen por query params
    useEffect(() => {
        const nombre = searchParams.get("nombre");
        if (nombre) setNombrePaciente(nombre);
        const apellido = searchParams.get("apellido");
        if (apellido) setApellidoPaciente(apellido);
        const rutParam = searchParams.get("rut");
        if (rutParam) setRut(rutParam);
        const tel = searchParams.get("telefono");
        if (tel) setTelefono(tel);
        const correo = searchParams.get("email");
        if (correo) setEmail(correo);
    }, []);
    const [fechaInicio, setfechaInicio] = useState("");
    const [fechaFinalizacion, setfechaFinalizacion] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFinalizacion, setHoraFinalizacion] = useState("");
    const [estadoReserva, setEstadoReserva] = useState("");
    const [id_reserva, setid_reserva] = useState(0);
    const [monto_reserva, setMontoReserva] = useState("");
    const [motivo_reserva, setMotivoReserva] = useState("");
    const [listaTarifasProfesional, setListaTarifasProfesional] = useState([]);
    const [dataAgenda, setDataAgenda] = useState([]);
    const [dataBloqueos, setDataBloqueos] = useState([]);
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [id_profesional, setId_profesional] = useState("");
    const [backgroundCalendarEvents, setBackgroundCalendarEvents] = useState([]);
    const [mostrarListaBloqueos, setMostrarListaBloqueos] = useState(true);
    const [mostrarFormularioAgenda, setMostrarFormularioAgenda] = useState(false);
    const [selectionPreview, setSelectionPreview] = useState(null);
    const [selectionDraft, setSelectionDraft] = useState(null);
    const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false);
    const [bloqueoSeleccionado, setBloqueoSeleccionado] = useState(null);
    const [floatingDraft, setFloatingDraft] = useState(null);
    const [popupMode, setPopupMode] = useState("create");
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [draggingPopup, setDraggingPopup] = useState(false);
    // ══════════════════════════════════════════════════════════════════════════
    // GUÍA DE MIGRACIÓN BD — ejecutar en la base de datos para activar
    // los campos "tipo de consulta" y "modalidad" en las reservas.
    //
    // PASO 1 — Agregar columnas a la tabla de reservaciones:
    //   ALTER TABLE reservaciones
    //     ADD COLUMN nombre_prestacion VARCHAR(255) NULL COMMENT 'Tipo de consulta seleccionado al agendar',
    //     ADD COLUMN modalidad VARCHAR(20) NOT NULL DEFAULT 'presencial' COMMENT 'presencial | online';
    //
    // PASO 2 — Actualizar el endpoint POST /reservaPacientes/insertarReserva para aceptar:
    //   { ..., nombre_prestacion: string|null, modalidad: 'presencial'|'online' }
    //   y guardarlos en la fila insertada.
    //
    // PASO 3 — Actualizar POST /reservaPacientes/actualizarReservacion igual que arriba.
    //
    // PASO 4 — Retornar ambos campos en los endpoints de consulta:
    //   SELECT ..., nombre_prestacion, modalidad FROM reservaciones ...
    //   en: seleccionarReservados, seleccionarPorProfesional, seleccionarEspecifica
    //
    // Una vez hecha la migración, eliminar este comentario o moverlo a la documentación.
    // ══════════════════════════════════════════════════════════════════════════

    const [popupForm, setPopupForm] = useState({
        nombrePaciente: "",
        apellidoPaciente: "",
        rut: "",
        telefono: "",
        email: "",
        motivoBloqueo: "",
        prestacion: "",     // Tipo de consulta (Ej: "Consulta inicial", "Control")
        modalidad: "presencial", // 'presencial' | 'online'
        monto_reserva: "",
        motivo_reserva: "",
    });

    // Lista de prestaciones/servicios para el dropdown del drawer
    const [listaPrestaciones, setListaPrestaciones] = useState([]);

    useEffect(() => {
        function actualizarModoMobile() {
            const mobile = window.innerWidth < 768;
            setEsMobile(mobile);
            setCurrentView((prev) => {
                if (mobile && prev !== "day") {
                    return "day";
                }
                return prev;
            });
        }

        actualizarModoMobile();
        window.addEventListener("resize", actualizarModoMobile);
        return () => window.removeEventListener("resize", actualizarModoMobile);
    }, []);

    // Carga el catálogo de servicios para el dropdown "Tipo de consulta"
    // Endpoint: GET /serviciosProfesionales/seleccionarTodosServiciosProfesionales
    // Retorna: [{ id_servicioProfesional, nombreServicio, descripcionServicio }]
    async function cargarListaPrestaciones() {
        try {
            const res = await fetch(`${API}/serviciosProfesionales/seleccionarTodosServiciosProfesionales`, {
                method: "GET",
                headers: { Accept: "application/json" },
                mode: "cors",
            });
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data)) setListaPrestaciones(data);
        } catch (err) {
            console.log("No se pudo cargar la lista de prestaciones:", err);
        }
    }

    async function cargarTarifasPorProfesional(profesionalId) {
        try {
            if (!profesionalId) {
                setListaTarifasProfesional([]);
                return;
            }
            const res = await fetch(`${API}/tarifasProfesional/seleccionarTarifasPorProfesional`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ profesional_id: Number(profesionalId) })
            });
            if (!res.ok) { setListaTarifasProfesional([]); return; }
            const data = await res.json();
            if (Array.isArray(data)) setListaTarifasProfesional(data);
            else setListaTarifasProfesional([]);
        } catch (err) {
            console.log("No se pudo cargar tarifas del profesional:", err);
            setListaTarifasProfesional([]);
        }
    }

    async function seleccionarTodosProfesionalesCalendario() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');

            } else {
                const respustaBackend = await res.json();

                if (respustaBackend && respustaBackend.length > 0) {
                    setListaProfesionales(respustaBackend);
                    setId_profesional(normalizarIdProfesional(respustaBackend[0].id_profesional));
                } else {
                    return toast.error('No hay profesionales o servicios ingresados en el sistema');
                }
            }
        } catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionalesCalendario();
        cargarListaPrestaciones(); // Carga servicios para el dropdown de tipo de consulta
    }, []);

    useEffect(() => {
        cargarTarifasPorProfesional(id_profesional);
    }, [id_profesional]);




    function formatearFechaTabla(fechaISO) {
        if (!fechaISO) return "";
        const partes = fechaISO.slice(0, 10).split("-");
        if (partes.length !== 3) return fechaISO;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function abrirModalBloqueo(bloqueo) {
        setBloqueoSeleccionado(bloqueo);
        setModalBloqueoAbierto(true);
    }

    function cerrarModalBloqueo() {
        setModalBloqueoAbierto(false);
        setBloqueoSeleccionado(null);
    }

    function formatearFechaLocal(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function manejarCambioFechaMobile(valorFecha) {
        if (!valorFecha) return;
        const [year, month, day] = valorFecha.split("-").map(Number);
        if ([year, month, day].some(Number.isNaN)) return;

        const siguienteFecha = new Date(currentDate);
        siguienteFecha.setFullYear(year, month - 1, day);
        siguienteFecha.setHours(0, 0, 0, 0);
        setCurrentDate(siguienteFecha);
        setCurrentView("day");
    }

    function convertirAFechaCalendario(fechaISO, hora) {
        const soloFecha = fechaISO.slice(0, 10);
        return new Date(`${soloFecha}T${hora}`);
    }

    function estaDentroHorarioAgenda(start, end) {
        if (!(start instanceof Date) || Number.isNaN(start.getTime())) return false;
        if (!(end instanceof Date) || Number.isNaN(end.getTime())) return false;

        const minutosInicio = start.getHours() * 60 + start.getMinutes();
        const minutosFin = end.getHours() * 60 + end.getMinutes();
        const minimo = HORA_MINIMA_AGENDA * 60;
        const maximo = HORA_MAXIMA_AGENDA * 60;

        return minutosInicio >= minimo && minutosFin <= maximo && end > start;
    }

    function esMovimientoHaciaHorarioPasado(start) {
        if (!(start instanceof Date) || Number.isNaN(start.getTime())) return false;
        return start < new Date();
    }

    function normalizarRut(valor = "") {
        return String(valor).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    function obtenerTipoSolapamiento(start, end, ignoredReservaId = null) {
        if (dataAgenda && dataAgenda.length > 0) {
            for (const cita of dataAgenda) {
                if (ignoredReservaId && cita.id_reserva === ignoredReservaId) continue;
                const evStart = convertirAFechaCalendario((cita.fechaInicio ?? "").slice(0, 10), (cita.horaInicio ?? "00:00:00"));
                const evEnd = convertirAFechaCalendario((cita.fechaFinalizacion ?? "").slice(0, 10), (cita.horaFinalizacion ?? "00:00:00"));
                if (start < evEnd && end > evStart) return "reserva";
            }
        }

        if (dataBloqueos && dataBloqueos.length > 0) {
            for (const bloqueo of dataBloqueos) {
                const horaIni = bloqueo.horaInicio ?? "00:00:00";
                const horaFin = bloqueo.horaFinalizacion ?? "23:59:00";
                const fechaIniStr = (bloqueo.fechaInicio ?? "").slice(0, 10);
                const fechaFinStr = (bloqueo.fechaFinalizacion ?? "").slice(0, 10);
                const primerDia = new Date(fechaIniStr + "T00:00:00");
                const ultimoDia = new Date(fechaFinStr + "T00:00:00");
                if (isNaN(primerDia.getTime()) || isNaN(ultimoDia.getTime())) continue;

                let cursor = new Date(primerDia);
                while (cursor <= ultimoDia) {
                    const y = cursor.getFullYear();
                    const m = String(cursor.getMonth() + 1).padStart(2, "0");
                    const d = String(cursor.getDate()).padStart(2, "0");
                    const fechaDia = `${y}-${m}-${d}`;
                    const bStart = new Date(`${fechaDia}T${horaIni}`);
                    const bEnd = new Date(`${fechaDia}T${horaFin}`);
                    if (start < bEnd && end > bStart) return "bloqueo";
                    cursor = new Date(y, cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
                }
            }
        }

        return null;
    }

    function encontrarBloqueoSolapado(start, end) {
        if (!dataBloqueos || dataBloqueos.length === 0) return null;

        for (const bloqueo of dataBloqueos) {
            const horaIni = bloqueo.horaInicio ?? "00:00:00";
            const horaFin = bloqueo.horaFinalizacion ?? "23:59:00";
            const fechaIniStr = (bloqueo.fechaInicio ?? "").slice(0, 10);
            const fechaFinStr = (bloqueo.fechaFinalizacion ?? "").slice(0, 10);
            const primerDia = new Date(fechaIniStr + "T00:00:00");
            const ultimoDia = new Date(fechaFinStr + "T00:00:00");
            if (isNaN(primerDia.getTime()) || isNaN(ultimoDia.getTime())) continue;

            let cursor = new Date(primerDia);
            while (cursor <= ultimoDia) {
                const y = cursor.getFullYear();
                const m = String(cursor.getMonth() + 1).padStart(2, "0");
                const d = String(cursor.getDate()).padStart(2, "0");
                const fechaDia = `${y}-${m}-${d}`;
                const bStart = new Date(`${fechaDia}T${horaIni}`);
                const bEnd = new Date(`${fechaDia}T${horaFin}`);
                if (start < bEnd && end > bStart) return bloqueo;
                cursor = new Date(y, cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
            }
        }

        return null;
    }

    function isOverlapping(start, end, ignoredReservaId = null) {
        return obtenerTipoSolapamiento(start, end, ignoredReservaId) !== null;
    }

    function formatHoraCorta(date) {
        return format(date, "HH:mm", { locale: es });
    }

    function formatFechaLarga(date) {
        return format(date, "EEEE d 'de' MMMM", { locale: es });
    }

    function obtenerTituloReserva(cita) {
        const nombre = (cita?.nombrePaciente ?? "").trim();
        const apellido = (cita?.apellidoPaciente ?? "").trim();
        const inicialApellido = apellido ? `${apellido.charAt(0).toUpperCase()}.` : "";
        return [nombre, inicialApellido].filter(Boolean).join(" ");
    }

    function obtenerTooltipEvento(event) {
        if (event?.tipo === "bloqueo") {
            return event.title || "Bloqueo";
        }

        if (event?.tipo === "reserva") {
            const nombre = (event.resource?.nombrePaciente ?? "").trim();
            const apellido = (event.resource?.apellidoPaciente ?? "").trim();
            const horario = event.start && event.end
                ? `${formatHoraCorta(event.start)} - ${formatHoraCorta(event.end)}`
                : "";
            return [nombre, apellido, horario].filter(Boolean).join(" | ");
        }

        return event?.title || "";
    }

    function obtenerNombreProfesionalPorId(profesionalId = id_profesional, fallback = "Sin profesional") {
        const profesionalSeleccionado = normalizarIdProfesional(profesionalId);
        if (!profesionalSeleccionado) return fallback;

        const nombre = listaProfesionales.find((p) => (
            normalizarIdProfesional(p.id_profesional) === profesionalSeleccionado
        ))?.nombreProfesional;

        return String(nombre ?? "").trim() || fallback;
    }

    function obtenerNombreProfesionalSeleccionado(profesionalId = id_profesional) {
        return obtenerNombreProfesionalPorId(profesionalId, "Sin profesional");
    }

    function obtenerNombreProfesionalParaEnvio(profesionalId = id_profesional) {
        return obtenerNombreProfesionalPorId(profesionalId, "");
    }

    function limpiarSeleccionTemporal() {
        setSelectionPreview(null);
        setSelectionDraft(null);
        setFloatingDraft(null);
        setPopupMode("create");
        setPopupForm({
            nombrePaciente: "",
            apellidoPaciente: "",
            rut: "",
            telefono: "",
            email: "",
            motivoBloqueo: "",
            prestacion: "",
            modalidad: "presencial",
            monto_reserva: "",
            motivo_reserva: "",
        });
    }

    function abrirPopupSeleccion(slotInfo) {
        const start = slotInfo.start ?? slotInfo;
        const end = slotInfo.end ?? slotInfo;
        setPopupMode("create");

        setfechaInicio(formatearFechaLocal(start));
        setHoraInicio(start.toTimeString().slice(0, 8));
        setfechaFinalizacion(formatearFechaLocal(end));
        setHoraFinalizacion(end.toTimeString().slice(0, 8));

        const nextDraft = {
            start,
            end,
            profesional: obtenerNombreProfesionalSeleccionado(),
            estadoReserva: "reservada",
            id_reserva: null,
        };

        setSelectionDraft(nextDraft);
        setPopupForm({
            nombrePaciente,
            apellidoPaciente,
            rut,
            telefono,
            email,
            motivoBloqueo: "",
            prestacion: "",          // Tipo de consulta (se llena en el drawer)
            modalidad: "presencial", // Modalidad por defecto
            monto_reserva: "",
            motivo_reserva: "",
        });
        setFloatingDraft({
            id: "draft-selection",
            title: "Nuevo agendamiento",
            start,
            end,
            tipo: "seleccion",
        });

        const bounds = slotInfo?.bounds;
        const centerX = typeof window !== "undefined" ? window.innerWidth / 2 - 140 : 320;
        const centerY = typeof window !== "undefined" ? Math.max(24, window.innerHeight / 2 - 300) : 140;

        setPopupPosition({
            x: bounds ? Math.min(bounds.left + 24, window.innerWidth - 320) : centerX,
            y: bounds ? Math.max(bounds.top - 120, 24) : centerY,
        });
    }

    function abrirPopupReservaExistente(eventoReserva) {
        const reserva = eventoReserva?.resource;
        const start = eventoReserva?.start;
        const end = eventoReserva?.end;

        if (!reserva || !start || !end) {
            toast.error("No se pudo cargar la reserva seleccionada.");
            return;
        }

        setPopupMode("edit");
        setid_reserva(reserva.id_reserva);
        setNombrePaciente(reserva.nombrePaciente ?? "");
        setApellidoPaciente(reserva.apellidoPaciente ?? "");
        setRut(reserva.rut ?? "");
        setTelefono(reserva.telefono ?? "");
        setEmail(reserva.email ?? "");
        setEstadoReserva(reserva.estadoReserva ?? "reservada");
        setfechaInicio(formatearFechaLocal(start));
        setHoraInicio(start.toTimeString().slice(0, 8));
        setfechaFinalizacion(formatearFechaLocal(end));
        setHoraFinalizacion(end.toTimeString().slice(0, 8));

        setSelectionDraft({
            start,
            end,
            profesional: obtenerNombreProfesionalSeleccionado(),
            estadoReserva: reserva.estadoReserva ?? "reservada",
            id_reserva: reserva.id_reserva,
        });

        setPopupForm({
            nombrePaciente: reserva.nombrePaciente ?? "",
            apellidoPaciente: reserva.apellidoPaciente ?? "",
            rut: reserva.rut ?? "",
            telefono: reserva.telefono ?? "",
            email: reserva.email ?? "",
            motivoBloqueo: "",
            // Si la reserva ya tiene prestación/modalidad guardada en BD, se recupera aquí
            prestacion: reserva.nombre_prestacion ?? reserva.prestacion ?? "",
            modalidad: reserva.modalidad ?? "presencial",
            monto_reserva: reserva.monto_reserva ?? "",
            motivo_reserva: reserva.motivo_reserva ?? "",
        });

        setFloatingDraft(null);
        setPopupPosition({
            x: typeof window !== "undefined" ? Math.max(16, window.innerWidth / 2 - 210) : 320,
            y: typeof window !== "undefined" ? Math.max(24, window.innerHeight / 2 - 300) : 140,
        });
    }

    // Abre el drawer de una reserva específica por id — usado cuando se llega
    // al calendario desde el clic en una notificación de "cita próxima".
    async function abrirReservaPorId(idReserva) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarEspecifica`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ id_reserva: idReserva })
            });
            if (!res.ok) return toast.error("No fue posible cargar la reserva de la notificación.");
            const data = await res.json();
            const reserva = Array.isArray(data) ? data[0] : data;
            if (!reserva) return toast.error("No se encontró la reserva de la notificación.");

            const start = convertirAFechaCalendario(reserva.fechaInicio, reserva.horaInicio);
            const end = convertirAFechaCalendario(reserva.fechaFinalizacion, reserva.horaFinalizacion);

            abrirPopupReservaExistente({ resource: reserva, start, end });
        } catch (error) {
            toast.error("No fue posible cargar la reserva de la notificación.");
        }
    }

    useEffect(() => {
        const idReservaParam = searchParams.get("id_reserva");
        if (idReservaParam) abrirReservaPorId(idReservaParam);
    }, [searchParams]);

    function actualizarBorradorSeleccion(start, end) {
        const nextDraft = {
            start,
            end,
            profesional: obtenerNombreProfesionalSeleccionado(),
            estadoReserva: selectionDraft?.estadoReserva ?? "reservada",
            id_reserva: selectionDraft?.id_reserva ?? null,
        };

        setSelectionDraft(nextDraft);
        if (popupMode === "create") {
            setFloatingDraft({
                id: "draft-selection",
                title: "Nuevo agendamiento",
                start,
                end,
                tipo: "seleccion",
            });
        }
        setfechaInicio(formatearFechaLocal(start));
        setHoraInicio(start.toTimeString().slice(0, 8));
        setfechaFinalizacion(formatearFechaLocal(end));
        setHoraFinalizacion(end.toTimeString().slice(0, 8));
    }

    function actualizarHoraSeleccionDraft(campo, valorHora) {
        if (!selectionDraft || !valorHora) return;

        const [horas, minutos] = valorHora.split(":").map(Number);
        if (Number.isNaN(horas) || Number.isNaN(minutos)) return;

        const duracion = selectionDraft.end.getTime() - selectionDraft.start.getTime();
        const nuevoInicio = new Date(selectionDraft.start);
        const nuevoFin = new Date(selectionDraft.end);

        if (campo === "start") {
            nuevoInicio.setHours(horas, minutos, 0, 0);
            // Arrastra el fin manteniendo la duración original
            nuevoFin.setTime(nuevoInicio.getTime() + duracion);
        } else {
            nuevoFin.setHours(horas, minutos, 0, 0);
            if (nuevoFin <= nuevoInicio) {
                toast.error("La hora de término debe ser posterior al inicio.");
                return;
            }
        }

        if (!estaDentroHorarioAgenda(nuevoInicio, nuevoFin)) {
            toast.error("Horario fuera del rango permitido (08:00 – 23:00).");
            return;
        }

        actualizarBorradorSeleccion(nuevoInicio, nuevoFin);
    }

    function actualizarFechaSeleccionDraft(valorFecha) {
        if (!selectionDraft || !valorFecha) return;

        const [year, month, day] = valorFecha.split("-").map(Number);
        if ([year, month, day].some(Number.isNaN)) return;

        const nuevoInicio = new Date(selectionDraft.start);
        const nuevoFin = new Date(selectionDraft.end);

        nuevoInicio.setFullYear(year, month - 1, day);
        nuevoFin.setFullYear(year, month - 1, day);

        if (!estaDentroHorarioAgenda(nuevoInicio, nuevoFin)) {
            toast.error("Solo puedes agendar entre 08:00 y 23:00 horas, con un rango valido.");
            return;
        }

        if (isOverlapping(nuevoInicio, nuevoFin, selectionDraft?.id_reserva ?? null)) {
            toast.error("Esta hora tiene un bloqueo u hora preexistente.");
            return;
        }

        actualizarBorradorSeleccion(nuevoInicio, nuevoFin);
    }

    function validarSeleccionPrevia(start, end, ignoredReservaId = null, opciones = {}) {
        const { silenciarToastSolapamiento = false } = opciones;
        if (!id_profesional) {
            if (!selectionGuardRef.current.missingProfessional) {
                selectionGuardRef.current.missingProfessional = true;
                toast.error("Primero debes seleccionar un profesional.");
                setTimeout(() => {
                    selectionGuardRef.current.missingProfessional = false;
                }, 1200);
            }
            setSelectionPreview(null);
            return false;
        }

        if (esMovimientoHaciaHorarioPasado(start)) {
            if (!selectionGuardRef.current.past) {
                selectionGuardRef.current.past = true;
                toast.error("No puedes mover ni agendar citas en horarios pasados.");
                setTimeout(() => {
                    selectionGuardRef.current.past = false;
                }, 1200);
            }
            setSelectionPreview(null);
            return false;
        }

        if (!estaDentroHorarioAgenda(start, end)) {
            if (!selectionGuardRef.current.outOfHours) {
                selectionGuardRef.current.outOfHours = true;
                toast.error("Solo puedes agendar entre 08:00 y 23:00 horas.");
                setTimeout(() => {
                    selectionGuardRef.current.outOfHours = false;
                }, 1200);
            }
            setSelectionPreview(null);
            return false;
        }

        const tipoSolapamiento = obtenerTipoSolapamiento(start, end, ignoredReservaId);
        if (tipoSolapamiento) {
            if (!silenciarToastSolapamiento && !selectionGuardRef.current.overlap) {
                selectionGuardRef.current.overlap = true;
                toast.error("Esta hora tiene un bloqueo u hora preexistente.");
                setTimeout(() => {
                    selectionGuardRef.current.overlap = false;
                }, 1200);
            }
            setSelectionPreview(null);
            return false;
        }

        return true;
    }

    async function cargarDataAgenda() {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                method: "GET",
                headers: { Accept: "application/json" }
            });
            if (!res.ok) return toast.error('No fue posible cargar las agendas, Contacte a soporte de Medify');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            return toast.error(err.message);
        }
    }

    async function cargarDataPorProfesional(idProf) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarPorProfesional`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ id_profesional: idProf })
            });
            if (!res.ok) return toast.error('No fue posible cargar las agendas del profesional');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            return toast.error(err.message);
        }
    }

    async function cargarBloqueosPorProfesional(id_profesional) {
        try {
            const res = await fetch(`${API}/bloqueoAgenda/seleccionarBloqueosPorProfesional`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                mode: "cors",
                body: JSON.stringify({ id_profesional })
            });

            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    async function refrescarCalendario() {
        if (id_profesional) {
            const [agenda, bloqueos] = await Promise.all([
                cargarDataPorProfesional(id_profesional),
                cargarBloqueosPorProfesional(id_profesional)
            ]);
            setDataAgenda(Array.isArray(agenda) ? agenda : []);
            setDataBloqueos(Array.isArray(bloqueos) ? bloqueos : []);
        }

    }

    useEffect(() => {
        if (!id_profesional) return;

        let activo = true;
        setDataAgenda([]);
        setDataBloqueos([]);

        async function cargarAgendaProfesional() {
            const [agenda, bloqueos] = await Promise.all([
                cargarDataPorProfesional(id_profesional),
                cargarBloqueosPorProfesional(id_profesional)
            ]);

            if (!activo) return;

            setDataAgenda(Array.isArray(agenda) ? agenda : []);
            setDataBloqueos(Array.isArray(bloqueos) ? bloqueos : []);
        }

        cargarAgendaProfesional();

        return () => {
            activo = false;
        };
    }, [id_profesional]);

    useEffect(() => {
        if (!draggingPopup) return;

        function actualizarPosicion(clientX, clientY) {
            const popupWidth = popupRef.current?.offsetWidth ?? 420;
            const popupHeight = popupRef.current?.offsetHeight ?? 520;
            const nextX = clientX - popupDragStateRef.current.offsetX;
            const nextY = clientY - popupDragStateRef.current.offsetY;

            setPopupPosition({
                x: Math.max(8, Math.min(nextX, window.innerWidth - popupWidth - 8)),
                y: Math.max(8, Math.min(nextY, window.innerHeight - popupHeight - 8)),
            });
        }

        function handleMove(event) {
            if (!popupDragStateRef.current.dragging) return;
            actualizarPosicion(event.clientX, event.clientY);
        }

        function handleTouchMove(event) {
            if (!popupDragStateRef.current.dragging) return;
            const touch = event.touches?.[0];
            if (!touch) return;
            event.preventDefault();
            actualizarPosicion(touch.clientX, touch.clientY);
        }

        function handleUp() {
            popupDragStateRef.current.dragging = false;
            setDraggingPopup(false);
            document.body.style.userSelect = "";
            document.body.style.touchAction = "";
        }

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleUp);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleUp);
        };
    }, [draggingPopup]);


    // prestacion y modalidad vienen del popupForm — se envían al backend cuando esté migrado
    async function insertarNuevaReserva(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, id_profesional, prestacion = "", modalidad = "presencial", monto_reserva = "", motivo_reserva = "") {
        try {
            const rutLimpio = normalizarRut(rut);
            if (
                !nombrePaciente ||
                !apellidoPaciente ||
                !rutLimpio ||
                !telefono ||
                !fechaInicio ||
                !horaInicio ||
                !fechaFinalizacion ||
                !horaFinalizacion ||
                !id_profesional ||
                !String(motivo_reserva ?? "").trim()
            ) {
                toast.error('Debe llenar todos los campos');
                return false;
            }
            const correoNormalizado = normalizarCorreoOpcional(email);
            const ahora = new Date();
            const inicio = new Date(`${fechaInicio}T${horaInicio}`);
            const final = new Date(`${fechaFinalizacion}T${horaFinalizacion}`);
            // Compara solo el día, no el minuto exacto — permite completar el form sin error si el slot es hoy
            const hoyStr = ahora.toISOString().slice(0, 10);
            if (fechaInicio < hoyStr) {
                toast.error("No es posible agendar en fechas pasadas.");
                return false;
            }
            if (!estaDentroHorarioAgenda(inicio, final)) {
                toast.error("Solo puedes agendar entre 08:00 y 23:00 horas.");
                return false;
            }
            if (final < inicio) {
                toast.error("No es posible en fechas irreales");
                return false;
            }
            if (isOverlapping(inicio, final)) {
                toast.error('Esta hora tiene un bloqueo u hora preexistente.');
                return false;
            }

            if (fechaInicio === fechaFinalizacion) {
                const nombreProfesional = obtenerNombreProfesionalParaEnvio(id_profesional);
                if (!nombreProfesional) {
                    toast.error("No fue posible identificar el profesional seleccionado. Vuelve a seleccionar la agenda.");
                    return false;
                }
                const res = await fetch(`${API}/reservaPacientes/insertarReservaPacienteFicha`, {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/json" },
                    mode: "cors",
                    // NOTA: nombre_prestacion y modalidad se envían pero el backend
                    // debe tener la migración de BD aplicada para persistirlos.
                    body: JSON.stringify({ nombrePaciente, apellidoPaciente, nombreProfesional, rut: rutLimpio, telefono, email: correoNormalizado, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, monto_reserva: monto_reserva || "", motivo_reserva: motivo_reserva || "", estadoReserva: "reservada", id_profesional, nombre_prestacion: prestacion || null, modalidad: modalidad || "presencial" })
                });
                const respuestaBackend = await res.json();
                if (!res.ok && respuestaBackend.message === "conflicto") {
                    toast.error("No puede agendar una hora que ya está ocupada.");
                    return false;
                }
                if (respuestaBackend.message === true) {
                    setNombrePaciente(""); setApellidoPaciente(""); setTelefono(""); setRut(""); setEmail("");
                    await refrescarCalendario();
                    toast.success("Se ha ingresado correctamente el agendamiento");
                    return true;
                } else if (respuestaBackend.message === "conflicto" || String(respuestaBackend.message || "").includes("conflicto")) {
                    toast.error("No puede agendar una hora que ya esta ocupada");
                    return false;
                } else if (respuestaBackend.message === false) {
                    toast.error('Asegure que no esta ocupada la Hora');
                    return false;
                }
            } else {
                toast.error("Solo se permite agendar si es en el mismo dia");
                return false;
            }
        } catch (error) {
            console.log(error);
            toast.error('Sin respuesta del servidor contacte a soporte.');
            return false;
        }
        return false;
    }

    async function ingresarPacienteDesdeAgenda() {
        try {
            const nombre = (nombrePaciente ?? "").trim();
            const apellido = (apellidoPaciente ?? "").trim();
            const rutLimpio = (rut ?? "").trim();
            const telefonoLimpio = (telefono ?? "").trim();
            const correo = normalizarCorreoOpcional(email);

            if (!nombre || !apellido || !rutLimpio || !telefonoLimpio) {
                return toast.error("Debe completar nombre, apellido, RUT y teléfono para ingresar el paciente.");
            }

            const rutNormalizado = normalizarRut(rutLimpio);
            const resBusqueda = await fetch(`${API}/pacientes/contieneRut`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ rut: rutNormalizado })
            });

            if (resBusqueda.ok) {
                const coincidencias = await resBusqueda.json();
                const yaExiste = Array.isArray(coincidencias) && coincidencias.some((paciente) => normalizarRut(paciente.rut) === rutNormalizado);
                if (yaExiste) {
                    return toast.error("Ese paciente ya existe en la lista de pacientes regulares.");
                }
            }

            const resInsercion = await fetch(`${API}/pacientes/pacientesInsercion`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({
                    nombre,
                    apellido,
                    rut: rutNormalizado,
                    nacimiento: "1900-01-01",
                    sexo: "No especifica",
                    prevision_id: 1,
                    telefono: telefonoLimpio,
                    correo,
                    direccion: "Por completar",
                    pais: "Chile",
                    observacion1: "Creado desde agenda",
                    observacion2: "NO ESPECIFICADO",
                    observacion3: "NO ESPECIFICADO",
                    apoderado: "NO ESPECIFICADO",
                    apoderado_rut: "NO ESPECIFICADO",
                    medicamentosUsados: "NO ESPECIFICADO",
                    habitos: "NO ESPECIFICADO",
                    comentariosAdicionales: "Paciente ingresado manualmente desde agenda",
                })
            });

            if (!resInsercion.ok) {
                const detalle = await resInsercion.json().catch(() => null);
                console.log("Error al ingresar paciente desde agenda:", detalle);
                return toast.error("No se pudo ingresar el paciente desde la agenda.");
            }

            const respuestaBackend = await resInsercion.json();


            if (respuestaBackend.message === "duplicado") {
                return toast.success("El paciente ya se encuentra ingresado en el sistema.");
            } else if (respuestaBackend.message === true) {
                return toast.success("Paciente ingresado correctamente. Quedó creado con datos base para completar después.");
            } else {
                return toast.error("No se pudo ingresar el paciente desde la agenda.");
            }
        } catch (error) {
            console.log(error);
            return toast.error("Ocurrió un problema al ingresar el paciente desde la agenda.");
        }
    }

    async function actualizarReservaDesdeCalendario(reservaOriginal, start, end) {
        if (!reservaOriginal?.id_reserva) return toast.error("No fue posible identificar la reserva a mover.");
        if (!validarSeleccionPrevia(start, end, reservaOriginal.id_reserva)) return;

        await actualizarInformacionReserva(
            reservaOriginal.nombrePaciente,
            reservaOriginal.apellidoPaciente,
            reservaOriginal.rut,
            reservaOriginal.telefono,
            reservaOriginal.email,
            formatearFechaLocal(start),
            start.toTimeString().slice(0, 8),
            formatearFechaLocal(end),
            end.toTimeString().slice(0, 8),
            reservaOriginal.estadoReserva,
            reservaOriginal.id_profesional,
            reservaOriginal.id_reserva,
            reservaOriginal._nombreProfesional || obtenerNombreProfesionalParaEnvio(reservaOriginal.id_profesional),
            reservaOriginal.monto_reserva || "",
            reservaOriginal.motivo_reserva || ""
        );
    }

    async function insertarBloqueoHorario(idProf, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, motivo) {
        try {
            if (!idProf) {
                return toast.error("Debe seleccionar un profesional para bloquear un horario.");
            }

            if (!fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !motivo.trim()) {
                return toast.error("Debe indicar el rango y el motivo del bloqueo.");
            }

            const inicio = new Date(`${fechaInicio}T${horaInicio}`);
            const final = new Date(`${fechaFinalizacion}T${horaFinalizacion}`);
            if (!estaDentroHorarioAgenda(inicio, final)) {
                return toast.error("Solo puedes bloquear horarios entre 08:00 y 23:00 horas.");
            }

            const res = await fetch(`${API}/bloqueoAgenda/InsertarBloqueo`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({
                    id_profesional: idProf,
                    fechaInicio,
                    horaInicio,
                    fechaFinalizacion,
                    horaFinalizacion,
                    motivo: motivo.trim(),
                })
            });

            if (!res.ok) {
                return toast.error("Verifique que no haya una hora o bloqueo previo.");
            }

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await refrescarCalendario();
                limpiarSeleccionTemporal();
                return toast.success("Se bloqueó el horario correctamente.");
            }

            if (respuestaBackend.message === "sindisponibilidad") {
                return toast.error("Verifique que no haya una hora o bloqueo previo.");
            }

            return toast.error("Verifique que no haya una hora o bloqueo previo.");
        } catch (error) {
            console.log(error);
            return toast.error("Verifique que no haya una hora o bloqueo previo.");
        }
    }

    async function eliminarBloqueo(id_bloqueo) {
        try {
            if (!id_bloqueo) {
                return toast.error("Debe seleccionar el bloqueo que desea eliminar.");
            }
            const res = await fetch(`${API}/bloqueoAgenda/eliminarBloqueo`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ id_bloqueo }),
                mode: "cors"
            });
            if (!res.ok) {
                return toast.error("No se ha podido eliminar el bloqueo. Intente más tarde.");
            }
            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await refrescarCalendario();
                cerrarModalBloqueo();
                return toast.success("Se ha eliminado el bloqueo correctamente.");
            }
            return toast.error("No se ha podido eliminar el bloqueo. Intente más tarde.");
        } catch (error) {
            console.log(error);
            return toast.error("No se ha podido eliminar el bloqueo. Contacte a soporte.");
        }
    }

    const messages = useMemo(() => ({
        next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", day: "Día", agenda: "Agenda", noEventsInRange: "No hay eventos",
    }), []);

    const vistasDisponibles = esMobile ? ["day"] : ["month", "week", "day", "agenda"];
    const vistaActiva = esMobile ? "day" : currentView;

    // Expande bloqueos multi-día en segmentos por día para que
    // react-big-calendar los muestre en la grilla horaria (no en all-day).
    // Cada día del rango usa el MISMO horario (horaInicio → horaFinalizacion).
    function expandirBloqueosPorDia(bloqueos) {
        const resultado = [];
        for (const bloqueo of bloqueos) {
            const horaIni = bloqueo.horaInicio ?? "00:00:00";
            const horaFin = bloqueo.horaFinalizacion ?? "23:59:00";
            const fechaIniStr = (bloqueo.fechaInicio ?? "").slice(0, 10);
            const fechaFinStr = (bloqueo.fechaFinalizacion ?? "").slice(0, 10);

            const primerDia = new Date(fechaIniStr + "T00:00:00");
            const ultimoDia = new Date(fechaFinStr + "T00:00:00");

            if (isNaN(primerDia.getTime()) || isNaN(ultimoDia.getTime())) continue;

            let cursor = new Date(primerDia);
            while (cursor <= ultimoDia) {
                const y = cursor.getFullYear();
                const m = String(cursor.getMonth() + 1).padStart(2, "0");
                const d = String(cursor.getDate()).padStart(2, "0");
                const fechaDia = `${y}-${m}-${d}`;

                resultado.push({
                    id_bloqueo: bloqueo.id_bloqueo,
                    title: bloqueo.motivo || "Sin motivo",
                    start: new Date(`${fechaDia}T${horaIni}`),
                    end: new Date(`${fechaDia}T${horaFin}`),
                    allDay: false,
                    tipo: "bloqueo",
                    resource: bloqueo,
                });

                cursor = new Date(y, cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
            }
        }
        return resultado;
    }

    useEffect(() => {
        // Resuelve el nombre del profesional para cada cita.
        // Primero intenta la columna del backend (si el endpoint ya la retorna),
        // luego hace lookup local en listaProfesionales por id_profesional.
        const resolverNombreProfesional = (cita) => {
            if (cita.nombreProfesional) return cita.nombreProfesional;
            // Lookup por el id de la cita, o por el profesional actualmente seleccionado
            const idBuscar = cita.id_profesional ?? id_profesional;
            return listaProfesionales.find(
                p => String(p.id_profesional) === String(idBuscar)
            )?.nombreProfesional ?? "";
        };

        const eventosReservas = (dataAgenda || []).map((cita) => ({
            id_reserva: cita.id_reserva,
            title: obtenerTituloReserva(cita),
            start: convertirAFechaCalendario(cita.fechaInicio, cita.horaInicio),
            end: convertirAFechaCalendario(cita.fechaFinalizacion, cita.horaFinalizacion),
            allDay: false,
            tipo: "reserva",
            resource: {
                ...cita,
                _nombreProfesional: resolverNombreProfesional(cita),
            },
        }));
        const eventosBloqueos = expandirBloqueosPorDia(dataBloqueos || []).map((bloqueo) => ({
            ...bloqueo,
            allDay: false,
        }));

        if (currentView === "month") {
            setEvents([...eventosReservas, ...eventosBloqueos]);
            setBackgroundCalendarEvents([]);
            return;
        }

        setEvents(eventosReservas);
        setBackgroundCalendarEvents(eventosBloqueos);
    }, [dataAgenda, dataBloqueos, currentView]);

    // Delega en getStateTokens (src/lib/designTokens.js) \u2014 \u00fanica fuente de verdad de color por
    // estado. Antes esta funci\u00f3n ten\u00eda su propia paleta, distinta a la que usa AppointmentCard.jsx
    // para pintar el interior de la tarjeta, por lo que el borde/fondo exterior del bloque no
    // combinaba con su contenido (ej. "Reservada" se ve\u00eda caf\u00e9 afuera y violeta adentro).
    function obtenerPaletaEstadoReserva(estadoReserva = "") {
        const token = getStateTokens(estadoReserva);
        return {
            backgroundColor: token.bg,
            color: token.text,
            accentColor: token.accent,
            borderColor: token.border,
        };
    }

    function obtenerEstiloBotonEstado(estadoReserva = "") {
        const paleta = obtenerPaletaEstadoReserva(estadoReserva);
        return {
            backgroundColor: paleta.backgroundColor,
            color: paleta.color,
            border: `1px solid ${paleta.borderColor}`,
            borderLeft: `4px solid ${paleta.accentColor}`,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55)",
        };
    }

    const accionesRapidasEstado = [
        { valor: "asiste", etiqueta: "Asiste" },
        { valor: "no asiste", etiqueta: "No asiste" },
        { valor: "finalizado", etiqueta: "Finalizado" },
    ];

    const leyendaEstados = [
        { valor: "reservada", etiqueta: "Reservada" },
        { valor: "confirmada", etiqueta: "Confirmada" },
        { valor: "anulada", etiqueta: "Anulada" },
        { valor: "asiste", etiqueta: "Asiste" },
        { valor: "no asiste", etiqueta: "No asiste" },
        { valor: "finalizado", etiqueta: "Finalizado" },
    ];

    const eventStyleGetter = (event) => {
        const esBloqueo = event.tipo === "bloqueo";
        const esSeleccion = event.tipo === "seleccion";
        const esVistaMes = currentView === "month";
        const paletteReserva = obtenerPaletaEstadoReserva(event.resource?.estadoReserva);

        if (esBloqueo) {
            return {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    height: esVistaMes ? 'auto' : '100%',
                    minHeight: esVistaMes ? '20px' : '0',
                    maxHeight: 'none',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'clip',
                    lineHeight: esVistaMes ? '1' : '1.3',
                    padding: esVistaMes ? '0 4px' : '0',
                    boxSizing: 'border-box',
                    borderRadius: esVistaMes ? '4px' : '8px',
                    backgroundColor: 'rgba(107, 114, 128, 0.28)',
                    color: '#334155',
                    fontWeight: '600',
                    wordBreak: 'break-word',
                    border: '1px solid rgba(107, 114, 128, 0.38)',
                    borderLeft: '4px solid rgba(71, 85, 105, 0.95)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
                },
            };
        }

        return {
            style: {
                display: 'flex',
                alignItems: 'stretch',
                height: esVistaMes ? 'auto' : '100%',
                minHeight: esVistaMes ? '20px' : '0',
                maxHeight: 'none',
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1',
                padding: esVistaMes ? '0 4px' : '0',
                boxSizing: 'border-box',
                borderRadius: esVistaMes ? '4px' : '8px',
                backgroundColor: esSeleccion ? 'rgba(124, 58, 237, 0.24)' : paletteReserva.backgroundColor,
                color: esSeleccion ? '#5b21b6' : paletteReserva.color,
                fontWeight: '600', wordBreak: 'break-word',
                border: esSeleccion ? '1px solid rgba(124, 58, 237, 0.45)' : `1px solid ${paletteReserva.borderColor}`,
                borderLeft: esSeleccion ? '4px solid rgba(91, 33, 182, 0.95)' : `4px solid ${paletteReserva.accentColor}`,
                boxShadow: esSeleccion ? 'inset 0 0 0 1px rgba(255,255,255,0.16)' : 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            },
        };
    };

    const backgroundEventStyleGetter = (event) => {
        const esBloqueo = event.tipo === "bloqueo";
        const esSeleccion = event.tipo === "seleccion";

        if (esBloqueo) {
            return {
                className: "bloqueo-calendario-bg",
                style: {
                    backgroundColor: "rgba(107, 114, 128, 0.28)",
                    border: "1px solid rgba(107, 114, 128, 0.38)",
                    borderLeft: "4px solid rgba(71, 85, 105, 0.95)",
                    borderRadius: "8px",
                    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.18)",
                },
            };
        }

        if (esSeleccion) {
            return {
                style: {
                    backgroundColor: "rgba(124, 58, 237, 0.22)",
                    border: "1px solid rgba(124, 58, 237, 0.42)",
                    borderLeft: "4px solid rgba(91, 33, 182, 0.95)",
                    borderRadius: "8px",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
                },
            };
        }

        return { style: {} };
    };

    const EventComponent = ({ event }) => (
        <div
            title={obtenerTooltipEvento(event)}
            className="truncate text-sm md:text-base leading-tight font-semibold w-full h-full flex items-center gap-1 px-1"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
            {event.tipo === "bloqueo" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )}
            {event.title}
        </div>
    );

    const TitleOnlyEvent = ({ event }) => (
        <div title={obtenerTooltipEvento(event)} className="truncate text-sm md:text-base leading-tight font-semibold w-full flex items-center gap-1 px-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.tipo === "bloqueo" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )}
            {event.title}
        </div>
    );

    async function actualizarInformacionReserva(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_profesional, id_reserva, nombreProfesional = "", monto_reserva = "", motivo_reserva = "") {
        try {
            const rutLimpio = normalizarRut(rut);
            if (!nombrePaciente || !apellidoPaciente || !rutLimpio || !telefono || !fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !estadoReserva || !id_profesional || !id_reserva) {
                toast.error("Debe llenar todos los campos para poder actualizar la reserva");
                return false;
            }
            const nombreProfesionalEnvio = String(nombreProfesional || "").trim() || obtenerNombreProfesionalParaEnvio(id_profesional);
            if (!nombreProfesionalEnvio) {
                toast.error("No fue posible identificar el profesional seleccionado. Vuelve a seleccionar la agenda.");
                return false;
            }
            const correoNormalizado = normalizarCorreoOpcional(email);
            const res = await fetch(`${API}/reservaPacientes/actualizarReservacion`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ nombrePaciente, apellidoPaciente, nombreProfesional: nombreProfesionalEnvio, rut: rutLimpio, telefono, email: correoNormalizado, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, monto_reserva: monto_reserva || "", motivo_reserva: motivo_reserva || "", estadoReserva, id_profesional, id_reserva })
            });
            const respuestaBackend = await res.json();
            if (!res.ok && respuestaBackend.message === "conflicto") {
                toast.error("No puede mover la reserva a un horario ocupado.");
                return false;
            }
            if (!res.ok) {
                toast.error("El servidor no responde");
                return false;
            }
            if (respuestaBackend.message === true) {
                setNombrePaciente(""); setApellidoPaciente(""); setTelefono(""); setRut(""); setEmail("");
                await refrescarCalendario();
                toast.success("Se ha actualizado la reserva correctamente");
                return true;
            }
            return false;
        } catch (error) {
            console.log(error);
            toast.error(error.message);
            return false;
        }
    }

    async function seleccionarReservaEspecifica(id_reserva) {
        try {
            if (!id_reserva) return toast.error("Debe seleccionar una Reserva");
            const res = await fetch(`${API}/reservaPacientes/seleccionarEspecifica`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ id_reserva })
            });
            if (!res.ok) return toast.error("El servidor no responde");
            const data = await res.json();
            let reserva = Array.isArray(data) ? data[0] : data;
            if (!reserva) return toast.error("Sin Data");

            setNombrePaciente(reserva.nombrePaciente ?? "");
            setApellidoPaciente(reserva.apellidoPaciente ?? "");
            setRut(reserva.rut ?? "");
            setEmail(reserva.email ?? "");
            setTelefono(reserva.telefono ?? "");
            setfechaInicio((reserva.fechaInicio ?? "").slice(0, 10));
            setHoraInicio(reserva.horaInicio ?? "");
            setfechaFinalizacion((reserva.fechaFinalizacion ?? "").slice(0, 10));
            setHoraFinalizacion(reserva.horaFinalizacion ?? "");
            setEstadoReserva(reserva.estadoReserva ?? "");
            setId_profesional(normalizarIdProfesional(reserva.id_profesional));
            setMontoReserva(reserva.monto_reserva ?? "");
            setMotivoReserva(reserva.motivo_reserva ?? "");
        } catch (error) {
            console.log(error);
            return toast.error("El servidor no responde");
        }
    }

    useEffect(() => {
        if (id_reserva) seleccionarReservaEspecifica(id_reserva);
    }, [id_reserva]);

    function limpiarData() {
        setNombrePaciente(""); setApellidoPaciente(""); setTelefono(""); setRut(""); setEmail("");
        setMontoReserva(""); setMotivoReserva("");
    }

    async function cambiarEstadoRapido(estadoNuevo) {
        const nombreCompleto = `${nombrePaciente ?? ""} ${apellidoPaciente ?? ""}`.trim();
        if (!id_reserva || !nombreCompleto) {
            return toast.error("Debe seleccionar un paciente para cambiar su estado");
        }

        const actualizado = await actualizarInformacionReserva(
            nombrePaciente,
            apellidoPaciente,
            rut,
            telefono,
            email,
            fechaInicio,
            horaInicio,
            fechaFinalizacion,
            horaFinalizacion,
            estadoNuevo,
            id_profesional,
            id_reserva,
            obtenerNombreProfesionalParaEnvio(id_profesional),
            monto_reserva,
            motivo_reserva
        );

        if (actualizado) {
            setEstadoReserva(estadoNuevo);
            limpiarSeleccionTemporal();
        }
    }

    function iniciarDragPopup(event) {
        if (!popupRef.current) return;
        const rect = popupRef.current.getBoundingClientRect();
        const point = "touches" in event ? event.touches[0] : event;
        if (!point) return;
        popupDragStateRef.current = {
            dragging: true,
            offsetX: point.clientX - rect.left,
            offsetY: point.clientY - rect.top,
        };
        setDraggingPopup(true);
        document.body.style.userSelect = "none";
        document.body.style.touchAction = "none";
    }

    async function confirmarAgendamientoDesdePopup() {
        if (!selectionDraft) return;
        const created = await insertarNuevaReserva(
            popupForm.nombrePaciente,
            popupForm.apellidoPaciente,
            popupForm.rut,
            popupForm.telefono,
            popupForm.email,
            formatearFechaLocal(selectionDraft.start),
            selectionDraft.start.toTimeString().slice(0, 8),
            formatearFechaLocal(selectionDraft.end),
            selectionDraft.end.toTimeString().slice(0, 8),
            id_profesional,
            popupForm.prestacion ?? "",
            popupForm.modalidad ?? "presencial",
            popupForm.monto_reserva ?? "",
            popupForm.motivo_reserva ?? ""
        );
        if (created) {
            setNombrePaciente(popupForm.nombrePaciente);
            setApellidoPaciente(popupForm.apellidoPaciente);
            setRut(popupForm.rut);
            setTelefono(popupForm.telefono);
            setEmail(popupForm.email);
            limpiarSeleccionTemporal();
        }
    }

    async function confirmarActualizacionDesdePopup() {
        if (!selectionDraft?.id_reserva) return;

        const actualizado = await actualizarInformacionReserva(
            popupForm.nombrePaciente,
            popupForm.apellidoPaciente,
            popupForm.rut,
            popupForm.telefono,
            popupForm.email,
            formatearFechaLocal(selectionDraft.start),
            selectionDraft.start.toTimeString().slice(0, 8),
            formatearFechaLocal(selectionDraft.end),
            selectionDraft.end.toTimeString().slice(0, 8),
            selectionDraft.estadoReserva || estadoReserva || "reservada",
            id_profesional,
            selectionDraft.id_reserva,
            obtenerNombreProfesionalParaEnvio(id_profesional),
            popupForm.monto_reserva ?? "",
            popupForm.motivo_reserva ?? ""
        );

        if (actualizado) {
            setNombrePaciente(popupForm.nombrePaciente);
            setApellidoPaciente(popupForm.apellidoPaciente);
            setRut(popupForm.rut);
            setTelefono(popupForm.telefono);
            setEmail(popupForm.email);
            setEstadoReserva(selectionDraft.estadoReserva || estadoReserva || "reservada");
            setid_reserva(selectionDraft.id_reserva);
            limpiarSeleccionTemporal();
        }
    }




    async function eliminadoReserva(id_reserva) {
        try {
            if (!id_reserva) {
                return toast.error("Debe seleccionar al menos una reserva valida para realizar la eliminacion")
            }

            const res = await fetch(`${API}/reservaPacientes/eliminarReserva`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id_reserva }),
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
            } else {

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    await refrescarCalendario();
                    limpiarSeleccionTemporal();
                    setid_reserva(0);
                    setNombrePaciente("");
                    setApellidoPaciente("");
                    setRut("");
                    setTelefono("");
                    setEmail("");
                    setfechaInicio("");
                    setHoraInicio("");
                    setfechaFinalizacion("");
                    setHoraFinalizacion("");
                    setEstadoReserva("");
                    return toast.success("Se ha eliminado con exito la reserva");
                } else if (respuestaBackend.message === false) {
                    return toast.success("No se ha podido eliminar la reserva. Intente mas tarde.");
                } else {
                    return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
                }
            }

        } catch (error) {
            console.log(error);
            return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
        }
    }

    // ── Atajos de teclado globales ──────────────────────────────────────────
    useEffect(() => {
        function handleKeyboard(e) {
            // No activar si el foco está en un input/textarea
            const tag = document.activeElement?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            if (e.key === "Escape") {
                limpiarSeleccionTemporal();
                return;
            }
            if (e.key === "t" || e.key === "T") {
                setCurrentDate(new Date());
                return;
            }
            if (e.key === "1") { setCurrentView(esMobile ? "day" : "month"); return; }
            if (e.key === "2") { setCurrentView(esMobile ? "day" : "week"); return; }
            if (e.key === "3") { setCurrentView("day"); return; }
            if (e.key === "4") { setCurrentView(esMobile ? "day" : "agenda"); return; }
        }
        window.addEventListener("keydown", handleKeyboard);
        return () => window.removeEventListener("keydown", handleKeyboard);
    }, [esMobile]);

    // ── Estado para filtros ─────────────────────────────────────────────────
    const [activeFilters, setActiveFilters] = useState([]);

    // Filtra eventos según chips activos (atenúa, no oculta — se maneja con opacity en eventStyleGetter)
    const filteredEvents = useMemo(() => {
        if (activeFilters.length === 0) return events;
        return events.map((ev) => {
            if (ev.tipo !== "reserva") return ev;
            // Normaliza el estado: min\u00fasculas, sin acentos, sin espacios
            const normalizar = (s) => String(s ?? "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "");
            // Unifica variantes (noasistio \u2192 noasiste, etc.)
            const unificar = (s) => {
                if (s === "noasistio" || s === "noasistste") return "noasiste";
                if (s === "reservado") return "reservada";
                if (s === "confirmado") return "confirmada";
                if (s === "anulado") return "anulada";
                return s;
            };
            const estadoNorm = unificar(normalizar(ev.resource?.estadoReserva ?? "reservada"));
            const visible = activeFilters.some((f) => unificar(normalizar(f)) === estadoNorm);
            return { ...ev, _filtered: !visible };
        });
    }, [events, activeFilters]);

    // eventStyleGetter actualizado para soportar atenuación por filtro
    const eventStyleGetterPremium = (event) => {
        const base = eventStyleGetter(event);
        if (event._filtered) {
            return {
                style: {
                    ...base.style,
                    opacity: 0.18,
                    pointerEvents: "none",
                },
            };
        }
        return base;
    };

    // ── Nuevo EventComponent premium ────────────────────────────────────────
    const PremiumEventComponent = (props) => <AppointmentCard {...props} currentView={currentView} />;

    // ── Custom Headers ──────────────────────────────────────────────────────
    const CustomHeader = ({ date }) => {
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        const dayName = format(date, "eee", { locale: es });
        const dayNumber = format(date, "d");

        return (
            <div className={`flex items-center justify-center gap-1.5 py-2.5 bg-white border-b border-slate-100 ${isToday ? "text-[#6E56CF]" : "text-slate-600"}`}>
                <span className="capitalize text-[13px] font-medium">{dayName}</span>
                <span className={`text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-[#6E56CF] text-white shadow-sm" : ""}`}>
                    {dayNumber}
                </span>
            </div>
        );
    };

    const CustomTimeGutterHeader = () => (
        <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-semibold tracking-wide bg-white border-b border-slate-100">
            GMT-3
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-none">

                {/* ── Header premium ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
                            Planificación Médica
                        </p>
                        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                            Calendario
                        </h1>
                        {/* Subtítulo dinámico con rango de semana */}
                        <p className="mt-1 text-[13px] text-slate-500">
                            {(() => {
                                try {
                                    const { format: fmt, startOfWeek: sow, endOfWeek: eow } = require("date-fns");
                                    const start = sow(currentDate, { locale: es });
                                    const end = eow(currentDate, { locale: es });
                                    if (currentView === "week") {
                                        return `Semana del ${fmt(start, "d")} al ${fmt(end, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
                                    }
                                    if (currentView === "day") {
                                        return fmt(currentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
                                    }
                                    if (currentView === "month") {
                                        return fmt(currentDate, "MMMM 'de' yyyy", { locale: es });
                                    }
                                    return "Agenda de reservas";
                                } catch {
                                    return "Agenda de reservas";
                                }
                            })()}
                        </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                        {/* Selector de profesional */}
                        <div className="relative w-full sm:min-w-[280px]">
                            <SelectDinamic
                                value={id_profesional}
                                onChange={(e) => setId_profesional(e.target.value)}
                                options={listaProfesionales.map((p) => ({
                                    value: normalizarIdProfesional(p.id_profesional),
                                    label: p.nombreProfesional,
                                }))}
                                placeholder="Seleccionar Agenda"
                                className="h-10 rounded-xl border-slate-200 bg-white pl-4 pr-8 text-[13px] font-semibold text-slate-800 shadow-sm focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                        </div>
                        {/* CTA Nueva reserva */}
                        <button
                            type="button"
                            onClick={() => {
                                const ahora = new Date();
                                const h = ahora.getHours();
                                const m = ahora.getMinutes();

                                // Próximo slot de 30 min redondeado hacia arriba
                                let sH = m < 30 ? h : h + 1;
                                let sM = m < 30 ? 30 : 0;

                                // Si cae fuera del rango 8:00–22:30, usar mañana 09:00
                                const fueraDiRango = sH < HORA_MINIMA_AGENDA || sH > 22 || (sH === 22 && sM > 30);
                                const inicio = new Date(ahora);
                                if (fueraDiRango) {
                                    inicio.setDate(inicio.getDate() + 1);
                                    inicio.setHours(9, 0, 0, 0);
                                } else {
                                    inicio.setHours(sH, sM, 0, 0);
                                }
                                const fin = new Date(inicio.getTime() + 30 * 60000);
                                abrirPopupSeleccion({ start: inicio, end: fin, bounds: null });
                            }}
                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:w-auto sm:min-w-[180px]" style={{ backgroundColor: "#6E56CF" }}
                            id="btn-nueva-reserva"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva reserva
                        </button>
                        <InfoButton informacion={"Calendario de reservas.\n\nAtajos de teclado:\n- N → Nueva reserva\n- T → Ir a hoy\n- 1 → Vista Mes\n- 2 → Vista Semana\n- 3 → Vista Día\n- 4 → Vista Agenda\n- Esc → Cerrar panel"} />
                    </div>
                </div>

                {/* ── Controles de navegación + vistas ── */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                const d = new Date(currentDate);
                                if (currentView === "week") d.setDate(d.getDate() - 7);
                                else if (currentView === "day") d.setDate(d.getDate() - 1);
                                else if (currentView === "month") d.setMonth(d.getMonth() - 1);
                                setCurrentDate(d);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentDate(new Date())}
                            className="rounded-xl border border-violet-200 bg-[#F3F0FF] px-4 py-2 text-[13px] font-semibold text-[#6E56CF] shadow-sm hover:bg-[#EDE9FE] transition-colors"
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const d = new Date(currentDate);
                                if (currentView === "week") d.setDate(d.getDate() + 7);
                                else if (currentView === "day") d.setDate(d.getDate() + 1);
                                else if (currentView === "month") d.setMonth(d.getMonth() + 1);
                                setCurrentDate(d);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            Siguiente
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        {/* Fecha mobile */}
                        {esMobile && (
                            <input
                                type="date"
                                value={formatearFechaLocal(currentDate)}
                                onChange={(e) => manejarCambioFechaMobile(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-violet-300"
                            />
                        )}
                    </div>
                    {/* Switch de vistas — iOS segmented control */}
                    <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 shadow-inner">
                        {(esMobile ? [{ key: "day", label: "Día" }] : [
                            { key: "month", label: "Mes" },
                            { key: "week", label: "Semana" },
                            { key: "day", label: "Día" },
                            { key: "agenda", label: "Agenda" },
                        ]).map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => { setCurrentView(esMobile ? "day" : key); setMonthPopover(null); }}
                                className={`px-3.5 py-1.5 text-[13px] transition-all duration-150 rounded-lg ${
                                    vistaActiva === key
                                        ? "bg-white text-[#6E56CF] font-bold shadow-sm"
                                        : "text-slate-500 font-medium hover:text-slate-700"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Filtros eliminados de aquí (movidos al footer) ── */}

                {/* ── Grilla del calendario ── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    {currentView === "agenda" ? (
                        <div className="overflow-y-auto" style={{ height: "calc(100vh - 240px)", minHeight: 520 }}>
                            {(() => {
                                const soloReservas = filteredEvents.filter(ev => ev.tipo === "reserva" && !ev._filtered);
                                if (soloReservas.length === 0) return (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm text-slate-400 font-medium">Sin reservas en el período</p>
                                    </div>
                                );
                                const grupos = soloReservas.reduce((acc, ev) => {
                                    const key = format(ev.start, "yyyy-MM-dd");
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(ev);
                                    return acc;
                                }, {});
                                return Object.keys(grupos).sort().map(key => {
                                    const fecha = new Date(key + "T00:00:00");
                                    const labelFecha = format(fecha, "EEEE, d 'de' MMMM", { locale: es }).toUpperCase();
                                    const evsDia = grupos[key].slice().sort((a, b) => a.start - b.start);
                                    return (
                                        <div key={key}>
                                            <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 px-5 py-2.5">
                                                <span className="text-[11px] font-bold tracking-widest text-slate-500">{labelFecha}</span>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {evsDia.map(ev => {
                                                    const paleta = obtenerPaletaEstadoReserva(ev.resource?.estadoReserva);
                                                    const nombrePac = [ev.resource?.nombrePaciente, ev.resource?.apellidoPaciente].filter(Boolean).join(" ");
                                                    const prof = ev.resource?._nombreProfesional || ev.resource?.nombreProfesional || "";
                                                    const estadoLabel = ev.resource?.estadoReserva || "reservada";
                                                    return (
                                                        <div key={ev.id || ev.resource?.id_reserva}
                                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                setid_reserva(ev.resource?.id_reserva);
                                                                seleccionarReservaEspecifica(ev.resource?.id_reserva);
                                                                abrirPopupReservaExistente(ev);
                                                            }}
                                                        >
                                                            <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: paleta?.color || "#6E56CF" }} />
                                                            <div className="w-16 shrink-0">
                                                                <p className="text-[12px] font-bold tabular-nums text-slate-700">{formatHoraCorta(ev.start)}</p>
                                                                <p className="text-[11px] text-slate-400 tabular-nums">{formatHoraCorta(ev.end)}</p>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-bold text-slate-800 truncate">{nombrePac || ev.title}</p>
                                                                {prof && <p className="text-[11px] text-slate-400 truncate mt-0.5">{prof}</p>}
                                                            </div>
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize"
                                                                style={{ backgroundColor: `${paleta?.color || "#6E56CF"}18`, color: paleta?.color || "#6E56CF", border: `1px solid ${paleta?.color || "#6E56CF"}35` }}>
                                                                {estadoLabel}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                    <div
                        className="relative p-3 md:p-4"
                        style={{
                            height: currentView === "month" ? "calc(100vh - 240px)" : "calc(100vh - 280px)",
                            minHeight: currentView === "month" ? "680px" : "520px",
                        }}
                        onClickCapture={(e) => { lastClickPos.current = { x: e.clientX, y: e.clientY }; }}
                    >
                        {selectionPreview && (
                            <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-xl border border-violet-200 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur">
                                <div className="font-semibold text-violet-700">Seleccionando horario</div>
                                <div className="mt-0.5 text-slate-600">{formatFechaLarga(selectionPreview.start)}</div>
                                <div className="mt-0.5 font-medium text-slate-800">
                                    {formatHoraCorta(selectionPreview.start)} – {formatHoraCorta(selectionPreview.end)}
                                </div>
                            </div>
                        )}
                        <DnDCalendar
                            localizer={localizer}
                            toolbar={false}
                            events={filteredEvents}
                            backgroundEvents={floatingDraft ? [...backgroundCalendarEvents, floatingDraft] : backgroundCalendarEvents}
                            eventPropGetter={eventStyleGetterPremium}
                            backgroundEventPropGetter={backgroundEventStyleGetter}
                            components={{
                                event: PremiumEventComponent,
                                day: { event: PremiumEventComponent },
                                agenda: { event: PremiumEventComponent },
                                header: CustomHeader,
                                timeGutterHeader: CustomTimeGutterHeader
                            }}
                            startAccessor="start"
                            endAccessor="end"
                            messages={messages}
                            culture="es"
                            date={currentDate}
                            onNavigate={(nextDate) => setCurrentDate(nextDate)}
                            view={vistaActiva}
                            onView={(nextView) => setCurrentView(esMobile ? "day" : nextView)}
                            defaultView={esMobile ? "day" : "week"}
                            views={vistasDisponibles}
                            style={{ height: "100%" }}
                            selectable
                            resizable
                            popup={false}
                            onShowMore={(evs, date) => {
                                setMonthPopover({ events: evs, date, x: lastClickPos.current.x, y: lastClickPos.current.y });
                            }}
                            min={crearHoraLimite(HORA_MINIMA_AGENDA)}
                            max={crearHoraLimite(HORA_MAXIMA_AGENDA)}
                            scrollToTime={crearHoraLimite(HORA_MINIMA_AGENDA)}
                            step={15}
                            timeslots={1}
                            draggableAccessor={(event) => event.tipo === "reserva"}
                            resizableAccessor={(event) => event.tipo === "reserva"}
                            longPressThreshold={esMobile ? 300 : 10}
                            onSelecting={(slot) => {
                                const start = slot.start ?? slot;
                                const end = slot.end ?? slot;
                                setSelectionPreview({ start, end });
                                if (!validarSeleccionPrevia(start, end, null, { silenciarToastSolapamiento: true })) return false;
                                return true;
                            }}
                            onSelectEvent={(event) => {
                                setMonthPopover(null);
                                limpiarSeleccionTemporal();
                                if (event?.tipo === "bloqueo") {
                                    abrirModalBloqueo(event.resource ?? event);
                                    return;
                                }
                                if (!event?.id_reserva) { toast.error("No se encontró el ID de la reserva"); return; }
                                setid_reserva(event.id_reserva);
                                seleccionarReservaEspecifica(event.id_reserva);
                                abrirPopupReservaExistente(event);
                            }}
                            onSelectSlot={(slotInfo) => {
                                const start = slotInfo.start ?? slotInfo;
                                const end = slotInfo.end ?? slotInfo;
                                const bloqueo = encontrarBloqueoSolapado(start, end);
                                if (bloqueo) {
                                    setSelectionPreview(null);
                                    limpiarSeleccionTemporal();
                                    abrirModalBloqueo(bloqueo);
                                    return;
                                }
                                if (!validarSeleccionPrevia(start, end)) {
                                    limpiarSeleccionTemporal();
                                    return;
                                }
                                abrirPopupSeleccion(slotInfo);
                                setSelectionPreview(null);
                            }}
                            onEventDrop={async ({ event, start, end }) => {
                                if (event.tipo === "bloqueo") {
                                    toast("Los bloqueos aún no soportan movimiento desde la grilla.", { icon: "🔒" });
                                    return;
                                }
                                await actualizarReservaDesdeCalendario(event.resource, start, end);
                            }}
                            onEventResize={async ({ event, start, end }) => {
                                if (event.tipo === "bloqueo") {
                                    toast("Los bloqueos aún no soportan redimensionamiento desde la grilla.", { icon: "🔒" });
                                    return;
                                }
                                await actualizarReservaDesdeCalendario(event.resource, start, end);
                            }}
                        />
                    </div>
                    )}
                </div>



                {/* ── Popover "Ver más" personalizado (sólo horas) ── */}
                {monthPopover && currentView === "month" && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMonthPopover(null)} />
                        <div
                            className="fixed z-50 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.18)] py-3 px-1 w-[calc(100vw-32px)] sm:w-auto sm:min-w-[230px] sm:max-w-[290px]"
                            style={{
                                top: Math.min(monthPopover.y + 10, window.innerHeight - 300),
                                left: window.innerWidth < 640
                                    ? 16
                                    : Math.min(Math.max(monthPopover.x - 115, 8), window.innerWidth - 298),
                            }}
                        >
                            {/* Cabecera */}
                            <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-slate-100">
                                <span className="text-[11px] font-bold text-slate-700 capitalize">
                                    {format(monthPopover.date, "EEEE d 'de' MMMM", { locale: es })}
                                </span>
                                <button
                                    onClick={() => setMonthPopover(null)}
                                    className="text-slate-300 hover:text-slate-500 transition-colors rounded-md p-0.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Lista de horas */}
                            <div className="flex flex-col gap-0.5 max-h-[260px] overflow-y-auto px-1">
                                {monthPopover.events.map((ev, i) => {
                                    const esBloqueo = ev.tipo === "bloqueo";
                                    const paleta = !esBloqueo ? obtenerPaletaEstadoReserva(ev.resource?.estadoReserva) : null;
                                    const dot = esBloqueo ? "#9ca3af" : paleta?.accentColor;
                                    return (
                                        <div
                                            key={ev.id_reserva || ev.id_bloqueo || i}
                                            className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer"
                                            onClick={() => {
                                                setMonthPopover(null);
                                                if (ev.tipo === "bloqueo") {
                                                    abrirModalBloqueo(ev.resource ?? ev);
                                                    return;
                                                }
                                                if (ev.id_reserva) {
                                                    limpiarSeleccionTemporal();
                                                    setid_reserva(ev.id_reserva);
                                                    seleccionarReservaEspecifica(ev.id_reserva);
                                                    abrirPopupReservaExistente(ev);
                                                }
                                            }}
                                        >
                                            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                                            <span className="text-[13px] font-bold text-slate-800 tabular-nums">
                                                {format(ev.start, "HH:mm")} – {format(ev.end, "HH:mm")}
                                            </span>
                                            <span className="text-[11px] text-slate-400 truncate flex-1">{ev.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Footer de Calendario (Leyenda + Botones) ── */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <StatusFilterChips activeFilters={activeFilters} onChange={setActiveFilters} />
                    <button
                        type="button"
                        onClick={() => {
                            setMostrarListaBloqueos(prev => !prev);
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Gestionar bloqueos
                    </button>
                </div>

                {/* ── Lista de bloqueos ── */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h2 className="text-[13px] font-semibold text-slate-700">
                                Bloqueos — {obtenerNombreProfesionalSeleccionado()}
                            </h2>
                            {dataBloqueos.length > 0 && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                    {dataBloqueos.length}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setMostrarListaBloqueos((prev) => !prev)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            {mostrarListaBloqueos ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>
                    {mostrarListaBloqueos && (
                        <div className="p-4">
                            {dataBloqueos.length === 0 ? (
                                <p className="py-6 text-center text-[13px] text-slate-400">No hay bloqueos registrados para este profesional.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-left">
                                                {["Motivo", "Fecha inicio", "Hora inicio", "Fecha fin", "Hora fin", "Acción"].map((h) => (
                                                    <th key={h} className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dataBloqueos.map((bloqueo) => (
                                                <tr
                                                    key={bloqueo.id_bloqueo}
                                                    className="cursor-pointer border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                                    onClick={() => abrirModalBloqueo(bloqueo)}
                                                >
                                                    <td className="py-2.5 pr-4 font-medium text-slate-800">{bloqueo.motivo || "Sin motivo"}</td>
                                                    <td className="py-2.5 pr-4 text-slate-500">{(bloqueo.fechaInicio ?? "").slice(0, 10)}</td>
                                                    <td className="py-2.5 pr-4 text-slate-500">{bloqueo.horaInicio ?? "--"}</td>
                                                    <td className="py-2.5 pr-4 text-slate-500">{(bloqueo.fechaFinalizacion ?? "").slice(0, 10)}</td>
                                                    <td className="py-2.5 pr-4 text-slate-500">{bloqueo.horaFinalizacion ?? "--"}</td>
                                                    <td className="py-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); abrirModalBloqueo(bloqueo); }}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                                                        >
                                                            Ver detalle
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {modalBloqueoAbierto && bloqueoSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={cerrarModalBloqueo} />
                        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Detalle del Bloqueo</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Revisa la información y elimina si corresponde</p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-4 p-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Profesional</label>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] font-semibold text-slate-700">
                                        {obtenerNombreProfesionalSeleccionado()}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] text-slate-700">
                                        {bloqueoSeleccionado.motivo || "Sin motivo"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inicio</label>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] text-slate-700">
                                            <span className="block font-semibold text-slate-800">{formatearFechaTabla(bloqueoSeleccionado.fechaInicio)}</span>
                                            <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{bloqueoSeleccionado.horaInicio ?? "--"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13px] text-slate-700">
                                            <span className="block font-semibold text-slate-800">{formatearFechaTabla(bloqueoSeleccionado.fechaFinalizacion)}</span>
                                            <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{bloqueoSeleccionado.horaFinalizacion ?? "--"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                <button
                                    onClick={cerrarModalBloqueo}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-50 active:scale-[0.98]"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => eliminarBloqueo(bloqueoSeleccionado.id_bloqueo)}
                                    className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-rose-700 active:scale-[0.98]"
                                >
                                    Eliminar Bloqueo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ DRAWER PREMIUM (reemplaza al popup flotante) ═══ */}
                {selectionDraft && (
                    <AppointmentDrawer
                        reserva={selectionDraft?.id_reserva ? {
                            nombrePaciente: popupForm.nombrePaciente,
                            apellidoPaciente: popupForm.apellidoPaciente,
                            rut: popupForm.rut,
                            telefono: popupForm.telefono,
                            email: popupForm.email,
                            estadoReserva: selectionDraft.estadoReserva ?? estadoReserva,
                        } : null}
                        start={selectionDraft.start}
                        end={selectionDraft.end}
                        mode={popupMode}
                        onClose={limpiarSeleccionTemporal}
                        onConfirmar={confirmarAgendamientoDesdePopup}
                        onActualizar={confirmarActualizacionDesdePopup}
                        onCambiarEstado={cambiarEstadoRapido}
                        onEliminar={() => eliminadoReserva(selectionDraft.id_reserva)}
                        onBloquear={(motivo) => insertarBloqueoHorario(
                            id_profesional,
                            formatearFechaLocal(selectionDraft.start),
                            selectionDraft.start.toTimeString().slice(0, 8),
                            formatearFechaLocal(selectionDraft.end),
                            selectionDraft.end.toTimeString().slice(0, 8),
                            motivo
                        )}
                        listaProfesionales={listaProfesionales}
                        listaPrestaciones={listaPrestaciones}
                        listaTarifasProfesional={listaTarifasProfesional}
                        id_profesional={id_profesional}
                        selectionDraft={selectionDraft}
                        popupForm={popupForm}
                        onPopupFormChange={(field, value) => setPopupForm((prev) => ({ ...prev, [field]: value }))}
                        actualizarHora={actualizarHoraSeleccionDraft}
                        actualizarFecha={actualizarFechaSeleccionDraft}
                        formatHora={formatHoraCorta}
                        formatFechaLarga={formatFechaLarga}
                    />
                )}

                {/*
             * ─────────────────────────────────────────────────────────────────
             * POPUP FLOTANTE ORIGINAL (draggable)
             * Comentado en Fase 1 — reemplazado por AppointmentDrawer.
             * NO ELIMINAR — conservar para referencia o rollback si necesario.
             * ─────────────────────────────────────────────────────────────────
             *
             * {selectionDraft && (
             *   <div className="fixed inset-0 z-[80] bg-transparent" onMouseDown={(e) => e.preventDefault()}>
             *     <div
             *       ref={popupRef}
             *       className="absolute w-[calc(100vw-32px)] max-w-[420px] rounded-[24px] border border-violet-200 bg-white/95 shadow-[0_28px_80px_rgba(76,29,149,0.18)] backdrop-blur-xl"
             *       style={{ left: popupPosition.x, top: popupPosition.y }}
             *       onMouseDown={(e) => e.stopPropagation()}
             *       onTouchStart={(e) => e.stopPropagation()}
             *     >
             *       ... (popup draggable completo con formulario de crear/editar/bloquear)
             *       ... Ver git history para el JSX completo del popup original.
             *     </div>
             *   </div>
             * )}
             *
             * ─────────────────────────────────────────────────────────────────
             */}
                <style jsx global>{`
            .rbc-month-view {
                border: none !important;
                background: #fff;
            }
            .rbc-month-row {
                min-height: 120px !important;
            }
            .rbc-day-bg + .rbc-day-bg {
                border-left: 1px solid #f1f5f9 !important;
            }
            .rbc-month-row + .rbc-month-row {
                border-top: 1px solid #f1f5f9 !important;
            }
            .rbc-show-more {
                background: #6E56CF !important;
                color: white !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                padding: 4px 10px !important;
                border-radius: 8px !important;
                margin-top: 4px !important;
                margin-left: 6px !important;
                display: inline-block !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                box-shadow: 0 4px 12px rgba(110, 86, 207, 0.2) !important;
                transition: all 0.2s ease !important;
            }
            .rbc-show-more:hover {
                background: #5b45bc !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 6px 16px rgba(110, 86, 207, 0.3) !important;
            }
            .rbc-overlay {
                border-radius: 20px !important;
                padding: 16px !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
                border: 1px solid #f1f5f9 !important;
                background: white !important;
                min-width: 280px !important;
                z-index: 100 !important;
            }
            .rbc-overlay-header {
                font-weight: 800 !important;
                color: #1e293b !important;
                margin-bottom: 12px !important;
                padding-bottom: 8px !important;
                border-bottom: 2px solid #f1f5f9 !important;
                text-transform: capitalize !important;
                font-size: 14px !important;
            }
            .rbc-event {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
            }
        `}</style>
            </div>
        </div>
    );
}
