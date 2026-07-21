"use client"

import {useState, useMemo, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {Calendar, dateFnsLocalizer} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ShadcnFechaHora from "@/Componentes/ShadcnFechaHora";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";

import es from "date-fns/locale/es";
import {SelectDinamic} from "@/Componentes/SelectDinamic";
import {AppointmentCard} from "@/Componentes/AppointmentCard";
import {InfoButton} from "@/Componentes/InfoButton";
import { formatRut, getStateTokens } from "@/lib/designTokens";

const locales = {
    es: es,
};

const dfStartOfWeek = (date) => startOfWeek(date, {locale: es});

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: dfStartOfWeek,
    getDay,
    locales,
});
const HORA_MINIMA_AGENDA = 9;
const HORA_MAXIMA_AGENDA = 20;

function crearHoraLimite(hora, minuto = 0, segundo = 0) {
    const fecha = new Date();
    fecha.setHours(hora, minuto, segundo, 0);
    return fecha;
}

export default function Calendario() {

    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const popupRef = useRef(null);
    const popupDragRef = useRef({dragging: false, offsetX: 0, offsetY: 0});
    const [reservaPopup, setReservaPopup] = useState(null);
    const [draggingPopup, setDraggingPopup] = useState(false);

    useEffect(() => {
                const style = document.createElement('style');
        style.textContent = `
            /* ── Base calendar ── */
            .rbc-calendar, .rbc-time-view, .rbc-month-view { border: 0 !important; background: transparent !important; }
            .rbc-time-header-content, .rbc-time-content, .rbc-time-view, .rbc-timeslot-group,
            .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row,
            .rbc-header + .rbc-header, .rbc-time-header-content + .rbc-time-header-content { border-color: #F1F5F9 !important; }
            .rbc-time-view .rbc-time-gutter .rbc-label { font-size: 11px !important; color: #94a3b8 !important; font-weight: 500 !important; padding-right: 8px !important; }
            .rbc-time-slot { transition: background-color 120ms ease !important; border-top: none !important; }
            .rbc-timeslot-group { border-bottom: 1px solid #F1F5F9 !important; }
            .rbc-day-slot .rbc-time-slot:hover { background: rgba(168, 85, 247, 0.04) !important; }
            .rbc-today { background: rgba(248, 250, 252, 0.5) !important; }
            .rbc-current-time-indicator { background-color: #7c3aed !important; height: 2px !important; }
            .rbc-slot-selection { background: rgba(124, 58, 237, 0.12) !important; border: 1px solid rgba(124, 58, 237, 0.3) !important; border-radius: 12px !important; }
            .rbc-selected-cell { background: rgba(124, 58, 237, 0.04) !important; }
            .rbc-event, .rbc-background-event { border-radius: 8px !important; box-shadow: none !important; overflow: hidden !important; border: none !important; background: transparent !important; }
            .rbc-background-event { background-color: rgba(107, 114, 128, 0.08) !important; border-left: 4px solid rgba(71, 85, 105, 0.4) !important; }

            /* ── Vista Mes — flexbox equal rows ── */
            .rbc-month-view { display: flex !important; flex-direction: column !important; }
            .rbc-month-view .rbc-month-header { flex-shrink: 0 !important; }
            .rbc-month-view .rbc-month-row { flex: 1 1 0 !important; min-height: 0 !important; overflow: hidden !important; }
            .rbc-month-view .rbc-row-bg, .rbc-month-view .rbc-row-content { overflow: hidden !important; }
            .rbc-month-view .rbc-current-time-indicator { display: none !important; }
            .rbc-month-view .rbc-event { height: 22px !important; min-height: 22px !important; max-height: 22px !important; padding: 0 4px !important; line-height: 22px !important; overflow: hidden !important; font-size: 11px !important; border-radius: 4px !important; margin-bottom: 2px !important; }
            .rbc-row-segment { padding: 0 2px 1px !important; }

            /* ── "Ver más" link ── */
            .rbc-show-more { color: #6E56CF !important; font-size: 11px !important; font-weight: 700 !important; padding: 2px 6px !important; margin: 0 2px !important; cursor: pointer !important; background: #F3F0FF !important; border-radius: 4px !important; display: inline-block !important; }
            .rbc-show-more:hover { background: #EDE9FE !important; text-decoration: none !important; }

            /* ── Popup overlay ── */
            .rbc-overlay { background: white !important; border-radius: 14px !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 20px 50px rgba(15,23,42,0.12) !important; padding: 6px !important; z-index: 9999 !important; min-width: 220px !important; }
            .rbc-overlay-header { border-bottom: 1px solid #f1f5f9 !important; padding: 6px 8px 8px !important; font-size: 12px !important; font-weight: 700 !important; color: #334155 !important; text-transform: capitalize !important; }
            .rbc-overlay .rbc-event { margin-bottom: 3px !important; border-radius: 6px !important; }

            /* ── Vista Semana / Día ── */
            .rbc-time-view .rbc-event { min-height: 0 !important; overflow: hidden !important; }
            .rbc-event-label { display: none !important; }
            .rbc-event-content { height: 100% !important; overflow: hidden !important; font-size: inherit !important; }
            .rbc-header { font-size: 13px !important; font-weight: 600 !important; padding: 0 !important; border-bottom: 1px solid #F1F5F9 !important; }
            /* Altura de slot — 40px por cada intervalo de 30 min (escala natural) */
            .rbc-timeslot-group { min-height: 40px !important; }
            .rbc-time-gutter .rbc-timeslot-group { min-height: 40px !important; }

            /* ── Mobile ── */
            @media (max-width: 767px) { .rbc-time-view, .rbc-time-content, .rbc-day-slot, .rbc-time-column { touch-action: pan-y !important; } .rbc-toolbar { flex-wrap: wrap !important; } .rbc-toolbar button { min-height: 38px !important; } }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState("month");
    const [esMobile, setEsMobile] = useState(false);
    const [monthPopover, setMonthPopover] = useState(null);
    const lastClickPos = useRef({ x: 0, y: 0 });


    const [nombrePaciente, setNombrePaciente] = useState("");
    const [apellidoPaciente, setApellidoPaciente] = useState("");
    const [rut, setRut] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [fechaInicio, setfechaInicio,] = useState("");
    const [fechaFinalizacion, setfechaFinalizacion,] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFinalizacion, setHoraFinalizacion] = useState("");
    const [estadoReserva, setEstadoReserva,] = useState("");
    const [id_reserva, setid_reserva] = useState(0);

    const [dataAgenda, setDataAgenda] = useState([]);
    const [dataBloqueos, setDataBloqueos] = useState([]);
    const [backgroundCalendarEvents, setBackgroundCalendarEvents] = useState([]);
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [id_profesional, setId_profesional] = useState("");

    useEffect(() => {
        function actualizarModoMobile() {
            const mobile = window.innerWidth < 768;
            setEsMobile(mobile);
            setCurrentView((prev) => {
                if (mobile && prev !== "day") {
                    return "day";
                }
                if (!mobile && prev === "week") {
                    return prev;
                }
                return prev;
            });
        }

        actualizarModoMobile();
        window.addEventListener("resize", actualizarModoMobile);
        return () => window.removeEventListener("resize", actualizarModoMobile);
    }, []);

    async function seleccionarTodosProfesionalesCalendario() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })
            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
            } else {
                const respustaBackend = await res.json();
                if (respustaBackend && respustaBackend.length > 0) {
                    setListaProfesionales(respustaBackend);
                    if (!id_profesional) {
                        setId_profesional(respustaBackend[0].id_profesional);
                    }
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
    }, []);


    function formatearFechaLocal(d) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${y}-${m}-${day}`
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

    const manejarFechaHoraInicio = (dateTime) => {
        setfechaInicio(formatearFechaLocal(dateTime))
        setHoraInicio(dateTime.toTimeString().slice(0, 8))
    }

    const manejarFechaHoraFinalizacion = (dateTime) => {
        setfechaFinalizacion(formatearFechaLocal(dateTime))
        setHoraFinalizacion(dateTime.toTimeString().slice(0, 8))
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

    // Helper: comprueba si un rango [start, end) se solapa con alguna reserva en dataAgenda
    function isOverlapping(start, end) {
        if (!dataAgenda || dataAgenda.length === 0) return false;

        // Normalizamos a Date para comparar
        for (const cita of dataAgenda) {
            const evStart = convertirAFechaCalendario((cita.fechaInicio ?? "").slice(0, 10), (cita.horaInicio ?? "00:00:00"));
            const evEnd = convertirAFechaCalendario((cita.fechaFinalizacion ?? "").slice(0, 10), (cita.horaFinalizacion ?? "00:00:00"));

            // Si cualquier parte se solapa
            if (start < evEnd && end > evStart) {
                return true;
            }
        }

        return false;
    }


    function formatHoraCorta(date) {
        return format(date, "HH:mm", {locale: es});
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

    async function cargarDataAgenda() {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                method: "GET",
                headers: {Accept: "application/json"}
            })

            if (!res.ok) {
                return toast.error('No fue posible cargar las agendas, Contacte a soporte de Medify')
            }

            const data = await res.json();
            setDataAgenda(data);

        } catch (err) {
            return toast.error(err.message)
        }
    }

    async function cargarDataPorProfesional(idProf) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarPorProfesional`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_profesional: idProf})
            });
            if (!res.ok) return toast.error('No fue posible cargar las agendas del profesional');
            const data = await res.json();
            setDataAgenda(Array.isArray(data) ? data : []);
        } catch (err) {
            return toast.error(err.message);
        }
    }

    async function cargarBloqueosPorProfesional(id_profesional) {
        try {
            const res = await fetch(`${API}/bloqueoAgenda/seleccionarBloqueosPorProfesional`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_profesional})
            });
            if (!res.ok) return;
            const data = await res.json();
            setDataBloqueos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err);
        }
    }

    async function refrescarCalendario() {
        if (id_profesional) {
            await cargarDataPorProfesional(id_profesional);
            await cargarBloqueosPorProfesional(id_profesional);
        }
    }

    useEffect(() => { cargarDataAgenda(); }, []);

    useEffect(() => {
        if (id_profesional) {
            cargarDataPorProfesional(id_profesional);
            cargarBloqueosPorProfesional(id_profesional);
        } else {
            cargarDataAgenda();
        }
    }, [id_profesional]);


    async function insertarNuevaReserva(
        nombrePaciente,
        apellidoPaciente,
        rut,
        telefono,
        email,
        fechaInicio,
        horaInicio,
        fechaFinalizacion,
        horaFinalizacion
    ) {
        try {

            if (!nombrePaciente || !apellidoPaciente || !rut || !telefono || !email || !fechaInicio || !horaInicio || !horaFinalizacion) {
                return toast.error('Debe llenar todos los campos');
            }

            const ahora = new Date();
            const inicio = new Date(`${fechaInicio}T${horaInicio}`);
            const final = new Date(`${fechaFinalizacion}T${horaFinalizacion}`);

            if (inicio < ahora) {
                return toast.error("No es posible agendar en fechas NO vigentes")
            }

            if (final < inicio) {
                return toast.error("No es posible en fechas irreales")
            }

            // Validación local: si el rango se solapa con alguna reserva ya cargada, evitar llamar al servidor
            if (isOverlapping(inicio, final)) {
                return toast.error('La hora seleccionada ya está ocupada (verifique otras horas)');
            }


            if (fechaInicio === fechaFinalizacion) {

                const res = await fetch(`${API}/reservaPacientes/insertarReserva`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    mode: "cors",
                    body: JSON.stringify({
                        nombrePaciente,
                        apellidoPaciente,
                        rut,
                        telefono,
                        email,
                        fechaInicio,
                        horaInicio,
                        fechaFinalizacion,
                        horaFinalizacion,
                        estadoReserva: "reservada"
                    })
                })


                const respuestaBackend = await res.json();

                if (respuestaBackend.message === true) {
                    setNombrePaciente("");
                    setApellidoPaciente("");
                    setTelefono("");
                    setRut("");
                    setEmail("");
                    await refrescarCalendario();
                    return toast.success("Se ha ingresado correctamente el agendamiento")

                } else if (respuestaBackend.message === "conflicto" || String(respuestaBackend.message || "").includes("conflicto")) {
                    return toast.error("No puede agendar una hora que ya esta ocupada")

                } else if (respuestaBackend.message === false) {
                    return toast.error('Asegure que no esta ocupada la Hora');

                }


            } else {
                return toast.error("Solo se permite agendar si es en el mismo dia")
            }


        } catch (error) {
            console.log(error);
            return toast.error('Sin respuesta del servidor contacte a soporte.');

        }
    }


    const messages = useMemo(
        () => ({
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            noEventsInRange: "No hay eventos",
        }),
        []
    );

    const vistasDisponibles = esMobile ? ["day"] : ["month", "week", "day", "agenda"];
    const vistaActiva = esMobile ? "day" : currentView;


    useEffect(() => {
        // Resuelve nombre de profesional por id_profesional de cada cita
        const resolverNombreProfesional = (cita) => {
            if (cita.nombreProfesional) return cita.nombreProfesional;
            return listaProfesionales.find(
                p => String(p.id_profesional) === String(cita.id_profesional)
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
        {valor: "asiste", etiqueta: "Asiste"},
        {valor: "no asiste", etiqueta: "No asiste"},
        {valor: "finalizado", etiqueta: "Finalizado"},
    ];

    const accionesPopupEstado = [
        {valor: "asiste", etiqueta: "Asiste"},
        {valor: "no asiste", etiqueta: "No asiste"},
        {valor: "finalizado", etiqueta: "Finalizado"},
        {valor: "confirmada", etiqueta: "Confirmada"},
        {valor: "anulada", etiqueta: "Anulada"},
    ];

    const leyendaEstados = [
        {valor: "reservada", etiqueta: "Reservada"},
        {valor: "confirmada", etiqueta: "Confirmada"},
        {valor: "anulada", etiqueta: "Anulada"},
        {valor: "asiste", etiqueta: "Asiste"},
        {valor: "no asiste", etiqueta: "No asiste"},
        {valor: "finalizado", etiqueta: "Finalizado"},
    ];

    const eventStyleGetter = (event) => {
        const esBloqueo = event.tipo === "bloqueo";
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
                backgroundColor: paletteReserva.backgroundColor,
                color: paletteReserva.color,
                fontWeight: '600', wordBreak: 'break-word',
                border: `1px solid ${paletteReserva.borderColor}`,
                borderLeft: `4px solid ${paletteReserva.accentColor}`,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            },
        };
    };

    const backgroundEventStyleGetter = (event) => {
        const esBloqueo = event.tipo === "bloqueo";

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

        return {style: {}};
    };

    const EventComponent = ({event}) => (
        <div
            title={obtenerTooltipEvento(event)}
            className="truncate text-[11px] leading-tight w-full h-full flex items-center gap-1 px-[3px]"
            style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
        >
            {event.tipo === "bloqueo" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )}
            {event.title}
        </div>
    );

    const TitleOnlyEvent = ({event}) => (
        <div title={obtenerTooltipEvento(event)} className="truncate text-[11px] leading-tight font-medium w-full flex items-center gap-1" style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {event.tipo === "bloqueo" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )}
            {event.title}
        </div>
    );


    async function actualizarInformacionReserva(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_profesional, id_reserva) {
        try {

            if (!nombrePaciente || !apellidoPaciente || !rut || !telefono || !email || !fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !estadoReserva || !id_profesional || !id_reserva) {
                toast.error("Debe llenar todos los campos para poder actualizar la reserva");
                return false;
            }

            const res = await fetch(`${API}/reservaPacientes/actualizarReservacion`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({
                    nombrePaciente,
                    apellidoPaciente,
                    rut,
                    telefono,
                    email,
                    fechaInicio,
                    horaInicio,
                    fechaFinalizacion,
                    horaFinalizacion,
                    estadoReserva,
                    id_profesional,
                    id_reserva
                })
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
                setNombrePaciente("");
                setApellidoPaciente("");
                setTelefono("");
                setRut("");
                setEmail("");
                await refrescarCalendario();
                toast.success("Se ha actualizado la reserva correctamente");
                return true;
            }


        } catch (error) {
            console.log(error);
            toast.error(error.message);
            return false;
        }
        return false;
    }


    async function seleccionarReservaEspecifica(id_reserva) {
        try {

            if (!id_reserva) {
                return toast.error("Debe seleccionar una Reserva");
            }

            const res = await fetch(`${API}/reservaPacientes/seleccionarEspecifica`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_reserva})
            });

            if (!res.ok) {
                return toast.error("El servidor no responde")
            }

            const data = await res.json();


            let reserva;

            if (Array.isArray(data)) {
                reserva = data[0];
            } else {
                reserva = data;
            }

            if (!reserva) {
                return toast.error("Sin Data")
            }

            // Seteamos los inputs desde la reserva (objeto)
            setNombrePaciente(reserva.nombrePaciente ?? "");
            setApellidoPaciente(reserva.apellidoPaciente ?? "");
            setRut(reserva.rut ?? "");
            setEmail(reserva.email ?? "");
            setTelefono(reserva.telefono ?? "");

            // Si tu endpoint trae estos campos, los cargamos también
            setfechaInicio((reserva.fechaInicio ?? "").slice(0, 10));
            setHoraInicio(reserva.horaInicio ?? "");
            setfechaFinalizacion((reserva.fechaFinalizacion ?? "").slice(0, 10));
            setHoraFinalizacion(reserva.horaFinalizacion ?? "");
            setEstadoReserva(reserva.estadoReserva ?? "");
            setId_profesional(reserva.id_profesional ?? "");

        } catch (error) {
            console.log(error);
            return toast.error("El servidor no responde")
        }
    }

    useEffect(() => {
        if (id_reserva) {
            seleccionarReservaEspecifica(id_reserva);
        }
    }, [id_reserva]);


    function limpiarData() {
        setNombrePaciente("");
        setApellidoPaciente("");
        setTelefono("");
        setRut("");
        setEmail("");
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
            id_reserva
        );

        if (actualizado) {
            setEstadoReserva(estadoNuevo);
            await seleccionarReservaEspecifica(id_reserva);
        }
    }

    function normalizarRut(valor = "") {
        return String(valor).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    async function buscarPacienteYNavegar(rutReserva) {
        if (!rutReserva) {
            return toast.error("La reserva no tiene RUT asociado.");
        }
        try {
            const rutNormalizado = normalizarRut(rutReserva);
            const res = await fetch(`${API}/pacientes/contieneRut`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({rut: rutNormalizado})
            });
            if (!res.ok) {
                return toast.error("No se pudo conectar al servidor para buscar el paciente.");
            }
            const coincidencias = await res.json();
            const paciente = Array.isArray(coincidencias)
                ? coincidencias.find(
                    (p) => normalizarRut(p.rut) === rutNormalizado && Number(p.estado_paciente) !== 0
                )
                : null;

            if (paciente && paciente.id_paciente) {
                router.push(`/dashboard/FichasPacientes/${paciente.id_paciente}`);
            } else {
                toast.error("El paciente no se encuentra ingresado en la lista de pacientes.");
            }
        } catch (error) {
            console.log(error);
            toast.error("Error al buscar el paciente.");
        }
    }

    async function cambiarEstadoDesdePopup(estadoNuevo) {
        if (!reservaPopup?.reserva) return;
        const r = reservaPopup.reserva;
        const actualizado = await actualizarInformacionReserva(
            r.nombrePaciente,
            r.apellidoPaciente,
            r.rut,
            r.telefono,
            r.email,
            (r.fechaInicio ?? "").slice(0, 10),
            r.horaInicio,
            (r.fechaFinalizacion ?? "").slice(0, 10),
            r.horaFinalizacion,
            estadoNuevo,
            r.id_profesional,
            r.id_reserva
        );
        if (actualizado) {
            setReservaPopup(null);
        }
    }

    function iniciarDragPopup(event) {
        if (!popupRef.current) return;
        const rect = popupRef.current.getBoundingClientRect();
        const point = "touches" in event ? event.touches[0] : event;
        if (!point) return;
        popupDragRef.current = {
            dragging: true,
            offsetX: point.clientX - rect.left,
            offsetY: point.clientY - rect.top,
        };
        setDraggingPopup(true);
        document.body.style.userSelect = "none";
        document.body.style.touchAction = "none";
    }

    useEffect(() => {
        if (!draggingPopup) return;

        function actualizarPosicion(clientX, clientY) {
            const popupWidth = popupRef.current?.offsetWidth ?? 380;
            const popupHeight = popupRef.current?.offsetHeight ?? 400;
            const nextX = clientX - popupDragRef.current.offsetX;
            const nextY = clientY - popupDragRef.current.offsetY;

            setReservaPopup((prev) => prev ? {
                ...prev,
                position: {
                    x: Math.max(8, Math.min(nextX, window.innerWidth - popupWidth - 8)),
                    y: Math.max(8, Math.min(nextY, window.innerHeight - popupHeight - 8)),
                },
            } : prev);
        }

        function handleMove(event) {
            if (!popupDragRef.current.dragging) return;
            actualizarPosicion(event.clientX, event.clientY);
        }

        function handleTouchMove(event) {
            if (!popupDragRef.current.dragging) return;
            const touch = event.touches?.[0];
            if (!touch) return;
            event.preventDefault();
            actualizarPosicion(touch.clientX, touch.clientY);
        }

        function handleUp() {
            popupDragRef.current.dragging = false;
            setDraggingPopup(false);
            document.body.style.userSelect = "";
            document.body.style.touchAction = "";
        }

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        window.addEventListener("touchmove", handleTouchMove, {passive: false});
        window.addEventListener("touchend", handleUp);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleUp);
        };
    }, [draggingPopup]);

    function formatFechaLarga(date) {
        return format(date, "EEEE d 'de' MMMM", {locale: es});
    }

    const CustomHeader = ({ date }) => {
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        const dayName = format(date, "eee", { locale: es });
        const dayNumber = format(date, "d");
    
        return (
            <div className={`flex items-center justify-center gap-1.5 py-2.5 bg-white border-b border-slate-100 ${isToday ? "text-[#6E56CF]" : "text-slate-600"}`}>
                <span className="capitalize text-[12px] font-medium">{dayName}</span>
                <span className={`text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#6E56CF] text-white shadow-sm" : ""}`}>
                    {dayNumber}
                </span>
            </div>
        );
    };
    
    const CustomTimeGutterHeader = () => (
        <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-bold tracking-wider bg-white border-b border-slate-100">
            HR
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>
 
            <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-none">
                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Agenda Global</p>
                        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                            Vista <span className="text-[#6E56CF]">General</span>
                        </h1>
                        <p className="mt-2 text-[14px] text-slate-500 font-medium max-w-2xl">
                            Monitoreo centralizado de todas las citas y bloqueos de la clínica.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-[#6E56CF] animate-pulse"></span>
                            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">{events.length} CITAS TOTALES</span>
                        </div>
                        
                        <div className="h-12 w-[280px]">
                            <SelectDinamic
                                label=""
                                placeholder="Filtrar por profesional..."
                                value={id_profesional}
                                onChange={(v) => setId_profesional(v)}
                                options={listaProfesionales.map(p => ({ value: p.id_profesional, label: p.nombreProfesional }))}
                                className="h-full rounded-2xl border-slate-200 shadow-sm"
                            />
                        </div>

                        <button 
                            onClick={refrescarCalendario}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-[#6E56CF] shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>

                        <InfoButton informacion={'Visualiza la disponibilidad completa. Haz clic en una cita para gestionar estados o ver el expediente.'}/>
                    </div>
                </div>

                {/* ── Calendario Principal ── */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">

                    {/* ── Controles de navegación + vistas ── */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    const d = new Date(currentDate);
                                    if (currentView === "week") d.setDate(d.getDate() - 7);
                                    else if (currentView === "day") d.setDate(d.getDate() - 1);
                                    else d.setMonth(d.getMonth() - 1);
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
                                    else d.setMonth(d.getMonth() + 1);
                                    setCurrentDate(d);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                            >
                                Siguiente
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* View switcher — iOS segmented control */}
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

                    <div
                        className="rbc-container-premium"
                        style={{
                            height: vistaActiva === "month" ? "calc(100vh - 340px)" : "calc(100vh - 320px)",
                            minHeight: vistaActiva === "month" ? "680px" : "600px",
                        }}
                        onClickCapture={(e) => { lastClickPos.current = { x: e.clientX, y: e.clientY }; }}
                    >
                        <Calendar
                            localizer={localizer}
                            toolbar={false}
                            events={events}
                            backgroundEvents={backgroundCalendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: "100%" }}
                            messages={messages}
                            culture="es"
                            views={vistasDisponibles}
                            view={vistaActiva}
                            onView={(v) => setCurrentView(v)}
                            date={currentDate}
                            onNavigate={(d) => setCurrentDate(d)}
                            min={crearHoraLimite(HORA_MINIMA_AGENDA)}
                            max={crearHoraLimite(HORA_MAXIMA_AGENDA)}
                            scrollToTime={crearHoraLimite(HORA_MINIMA_AGENDA - 1)}
                            step={15}
                            timeslots={1}
                            eventPropGetter={eventStyleGetter}
                            backgroundEventPropGetter={backgroundEventStyleGetter}
                            popup={false}
                            onShowMore={(evs, date) => {
                                setMonthPopover({ events: evs, date, x: lastClickPos.current.x, y: lastClickPos.current.y });
                            }}
                            components={{
                                event: (props) => <AppointmentCard {...props} currentView={vistaActiva} />,
                                header: CustomHeader,
                                timeGutterHeader: CustomTimeGutterHeader
                            }}
                            dayPropGetter={(date) => ({
                                style: {
                                    backgroundColor: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'rgba(110, 86, 207, 0.03)' : 'transparent'
                                }
                            })}
                            onSelectEvent={(event) => {
                                setMonthPopover(null);
                                setReservaPopup(null);
                                if (event.tipo === "bloqueo") {
                                    return toast("Bloqueo: " + (event.title || "Sin motivo"), { icon: "🔒" });
                                }
                                if (!event?.id_reserva) return;
                                setid_reserva(event.id_reserva);
                                seleccionarReservaEspecifica(event.id_reserva).then(() => {
                                    const reserva = event.resource;
                                    if (!reserva) return;
                                    setReservaPopup({ reserva, position: null });
                                }).catch(console.error);
                            }}
                        />
                    </div>
                </div>

                {/* ── Popover "Ver más" (solo horas) ── */}
                {monthPopover && vistaActiva === "month" && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMonthPopover(null)} />
                        <div
                            className="fixed z-50 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.18)] py-3 px-1 min-w-[230px] max-w-[290px]"
                            style={{
                                top: Math.min(monthPopover.y + 10, window.innerHeight - 300),
                                left: Math.min(Math.max(monthPopover.x - 115, 8), window.innerWidth - 300),
                            }}
                        >
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
                                                if (ev.id_reserva) {
                                                    setid_reserva(ev.id_reserva);
                                                    seleccionarReservaEspecifica(ev.id_reserva).then(() => {
                                                        const reserva = ev.resource;
                                                        if (reserva) setReservaPopup({ reserva, position: null });
                                                    }).catch(console.error);
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
            </div>

            {/* ── Popup de Reserva ── */}
            {reservaPopup && (() => {
                const r = reservaPopup.reserva;
                const paleta = obtenerPaletaEstadoReserva(r.estadoReserva);
                const fechaIni = (r.fechaInicio ?? "").slice(0, 10);
                const start = convertirAFechaCalendario(fechaIni, r.horaInicio ?? "00:00:00");
                const end = convertirAFechaCalendario((r.fechaFinalizacion ?? "").slice(0, 10), r.horaFinalizacion ?? "00:00:00");
                
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div
                            ref={popupRef}
                            className="w-full max-w-[420px] rounded-[32px] border border-slate-200 bg-white shadow-[0_32px_120px_rgba(15,23,42,0.25)] overflow-hidden animate-in zoom-in-95 duration-200"
                        >
                            {/* Header Popup */}
                            <div className="relative px-8 pt-8 pb-6 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6E56CF]">Detalle de Cita</span>
                                    <button onClick={() => setReservaPopup(null)} className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                    {(r.nombrePaciente ?? "").trim()} {(r.apellidoPaciente ?? "").trim()}
                                </h2>
                                <p className="text-[13px] text-slate-400 mt-1">ID Reserva: #{r.id_reserva} • RUT: {formatRut(r.rut) || "—"}</p>
                            </div>

                            {/* Body Popup */}
                            <div className="px-8 py-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-violet-50 text-[#6E56CF] flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Fecha</p>
                                            <p className="text-[13px] font-bold text-slate-700 mt-1 capitalize">{formatFechaLarga(start)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Horario</p>
                                            <p className="text-[13px] font-bold text-slate-700 mt-1">{formatHoraCorta(start)} - {formatHoraCorta(end)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Actualizar Asistencia</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {accionesPopupEstado.map((accion) => (
                                            <button
                                                key={accion.valor}
                                                type="button"
                                                onClick={() => cambiarEstadoDesdePopup(accion.valor)}
                                                className="h-10 rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold transition-all hover:brightness-95 border shadow-sm"
                                                style={obtenerEstiloBotonEstado(accion.valor)}
                                            >
                                                {accion.etiqueta}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Popup */}
                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={() => buscarPacienteYNavegar(r.rut)}
                                    className="flex-1 h-12 bg-slate-900 text-white rounded-2xl text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Expediente Clínico
                                </button>
                                <button
                                    onClick={() => setReservaPopup(null)}
                                    className="px-6 h-12 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[13px] font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style jsx global>{`
                .rbc-container-premium { font-family: inherit; }
            `}</style>
        </div>
    );
}
