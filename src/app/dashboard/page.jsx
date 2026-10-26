"use client"
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import {useState, useEffect} from "react";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {useUser} from "@clerk/nextjs";
import {Calendar28} from "@/Componentes/shadcnCalendarSelector";
import { canAccessFichasClinicas, getDashboardRoleFromUser, agendaRestringidaDe, canSeeReservationAmounts as puedeVerMontos } from "@/lib/dashboard-access";
import {getStateTokens} from "@/lib/designTokens";
import {useTour} from "@/ContextosGlobales/TourContext";
import {obtenerRutReservaDeTour} from "@/lib/tourReserva";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import * as React from "react"
import * as XLSX from "xlsx";
import BotonAyuda from "@/Componentes/BotonAyuda";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { hoyCivil } from "@/lib/fechas";

const STORAGE_KEYS = {
    profesional: "dashboard_reservas_profesional",
    fechaInicio: "dashboard_reservas_fecha_inicio",
    fechaFinalizacion: "dashboard_reservas_fecha_finalizacion",
    estado: "dashboard_reservas_estado",
};

// Límite del comentario por cita, compartido por el textarea y el contador.
const MAX_CARACTERES_COMENTARIO = 100;

export default function AgendaCitas() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const {user, isLoaded} = useUser();
    // Solo el profesional que no administra la clínica queda restringido a su agenda.
    const idProfesionalAgendaAsignada = agendaRestringidaDe(user);
    const dashboardRole = getDashboardRoleFromUser(user);
    const canSeeFichasClinicas = isLoaded && canAccessFichasClinicas(dashboardRole);
    const canSeeReservationAmounts = isLoaded && puedeVerMontos(dashboardRole);
    const {isRunning: tourEnCurso} = useTour();
    // RUT de la reserva de prueba creada durante el tour. Se lee al montar y cada
    // vez que el tour arranca; lo dejó marcado el paso anterior (el "Agendar" del
    // calendario) justo antes de navegar hasta aquí.
    const [rutReservaTour, setRutReservaTour] = useState("");
    const [dataListaCruda, setdataLista] = useState([]);
    // Siempre una lista: si el backend responde un error ({ message }) o algo
    // inesperado, la agenda queda vacía en vez de romper la pantalla.
    const dataLista = Array.isArray(dataListaCruda) ? dataListaCruda : [];
    const [dataListaBase, setDataListaBase] = useState([]);
    const [nombrePaciente, setnombrePaciente] = useState("");
    const [rut, setrut] = useState("");
    const [fechaInicio, setfechaInicio] = useState(null);
    const [fechaFinalizacion, setfechaFinalizacion] = useState(null);
    const [estadoReserva, setestadoReserva] = useState("");
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [id_profesional, setId_profesional] = useState("");
    const agendaAsignadaDisponible = Boolean(
        idProfesionalAgendaAsignada && listaProfesionales.some(
            (profesional) => String(profesional.id_profesional) === idProfesionalAgendaAsignada
        )
    );
    const idProfesionalAgendaActiva = agendaAsignadaDisponible ? idProfesionalAgendaAsignada : "";
    const [actualizandoReservaId, setActualizandoReservaId] = useState(null);
    const [abriendoFichaReservaId, setAbriendoFichaReservaId] = useState(null);
    const [eliminandoReservaId, setEliminandoReservaId] = useState(null);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [menuEstadoAbiertoId, setMenuEstadoAbiertoId] = useState(null);
    const [monto_reserva, setMontoReserva] = useState("");
    const [motivo_reserva, setMotivoReserva] = useState("");
    // Comentarios por reserva. El campo aún no existe en la base de datos:
    // mientras tanto vive solo en el cliente (se pierde al recargar la página).
    const [comentariosReservas, setComentariosReservas] = useState({});
    const [idReservaComentario, setIdReservaComentario] = useState(null);
    const [comentarioBorrador, setComentarioBorrador] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!isLoaded) return;

        const profesionalGuardado = window.localStorage.getItem(STORAGE_KEYS.profesional);
        const fechaInicioGuardada = window.localStorage.getItem(STORAGE_KEYS.fechaInicio);
        const fechaFinalGuardada = window.localStorage.getItem(STORAGE_KEYS.fechaFinalizacion);
        const estadoGuardado = window.localStorage.getItem(STORAGE_KEYS.estado);

        if (profesionalGuardado) {
            setId_profesional(profesionalGuardado);
        }

        if (fechaInicioGuardada) {
            setfechaInicio(fechaInicioGuardada);
        }

        if (fechaFinalGuardada) {
            setfechaFinalizacion(fechaFinalGuardada);
        }

        if (estadoGuardado) {
            setestadoReserva(estadoGuardado);
        }
    }, [isLoaded, idProfesionalAgendaAsignada]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (id_profesional) {
            window.localStorage.setItem(STORAGE_KEYS.profesional, id_profesional);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.profesional);
        }
    }, [id_profesional]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (fechaInicio) {
            window.localStorage.setItem(STORAGE_KEYS.fechaInicio, fechaInicio);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.fechaInicio);
        }
    }, [fechaInicio]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (fechaFinalizacion) {
            window.localStorage.setItem(STORAGE_KEYS.fechaFinalizacion, fechaFinalizacion);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.fechaFinalizacion);
        }
    }, [fechaFinalizacion]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (estadoReserva) {
            window.localStorage.setItem(STORAGE_KEYS.estado, estadoReserva);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.estado);
        }
    }, [estadoReserva]);

    // Se relee también cuando llega el listado de citas: entre que esta pantalla
    // monta y que el tour deja la marca (al agendar en el calendario) puede no
    // haber un remontaje de por medio, y el ancla del paso quedaría sin fila.
    useEffect(() => {
        setRutReservaTour(tourEnCurso ? obtenerRutReservaDeTour() : "");
    }, [tourEnCurso, dataLista]);

    function formatearFechaDashboard(fecha) {
        if (!fecha) return "";

        const fechaCalendario = String(fecha).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (fechaCalendario) {
            const [, year, month, day] = fechaCalendario;
            return `${day}-${month}-${year}`;
        }

        // fecha-ok: solo se llega aca si el valor NO tiene forma ISO; las que si
        // la tienen se leen del texto en el bloque de arriba.
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return "";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    function formatearHoraDashboard(hora) {
        if (!hora) return "";
        return String(hora).slice(0, 5);
    }

    const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const DIAS_SEMANA_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

    // Día, mes corto, año y día de la semana para la insignia de fecha de la tarjeta.
    function descomponerFechaDashboard(fecha) {
        if (!fecha) return null;

        const coincidencia = String(fecha).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (coincidencia) {
            const [, anio, mes, dia] = coincidencia;
            // Construida con partes locales para que el día de la semana no se corra por zona horaria.
            const fechaLocal = new Date(Number(anio), Number(mes) - 1, Number(dia));
            return {
                dia,
                mesCorto: MESES_CORTOS[Number(mes) - 1] || "",
                anio,
                diaSemana: Number.isNaN(fechaLocal.getTime()) ? "" : DIAS_SEMANA[fechaLocal.getDay()],
                diaCorto: Number.isNaN(fechaLocal.getTime()) ? "" : DIAS_SEMANA_CORTOS[fechaLocal.getDay()],
            };
        }

        // fecha-ok: mismo caso, respaldo para valores sin forma ISO.
        const fechaLocal = new Date(fecha);
        if (Number.isNaN(fechaLocal.getTime())) return null;

        return {
            dia: String(fechaLocal.getDate()).padStart(2, "0"),
            mesCorto: MESES_CORTOS[fechaLocal.getMonth()] || "",
            anio: String(fechaLocal.getFullYear()),
            diaSemana: DIAS_SEMANA[fechaLocal.getDay()],
            diaCorto: DIAS_SEMANA_CORTOS[fechaLocal.getDay()],
        };
    }

    function obtenerNombreProfesionalReserva(reserva) {
        if (reserva?.nombreProfesional) return reserva.nombreProfesional;
        const profesional = listaProfesionales.find(
            (item) => String(item.id_profesional) === String(reserva?.id_profesional)
        );
        return profesional?.nombreProfesional ?? "Sin profesional";
    }

    function normalizarRut(rutValor) {
        return String(rutValor || "")
            .replace(/[^0-9kK]/g, "")
            .toUpperCase();
    }

    function esRutDesconocido(rutValor) {
        return String(rutValor || "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase() === "RUTDESCONOCIDO";
    }

    function formatearRutVisible(rutValor) {
        const rutNormalizado = normalizarRut(rutValor);
        return rutNormalizado ? `RUT: ${rutNormalizado}` : "RUT: Sin registro";
    }

    function formatearEstadoVisible(estadoValor) {
        return String(estadoValor || "").trim().toLowerCase();
    }

    function formatearRutBusqueda(rutValor) {
        const rutNormalizado = normalizarRut(rutValor);

        if (rutNormalizado.length < 2) return "";

        const dv = rutNormalizado.slice(-1);
        let cuerpo = rutNormalizado.slice(0, -1);
        let rutFormateado = "";

        while (cuerpo.length > 3) {
            rutFormateado = `.${cuerpo.slice(-3)}${rutFormateado}`;
            cuerpo = cuerpo.slice(0, -3);
        }

        rutFormateado = `${cuerpo}${rutFormateado}-${dv}`;
        return rutFormateado;
    }

    // RUT con puntos y guión para la tarjeta (ej: 8.881.516-1); cae al formato simple si no aplica.
    function formatearRutTarjeta(rutValor) {
        if (esRutDesconocido(rutValor)) return formatearRutVisible(rutValor);
        return `RUT: ${formatearRutBusqueda(rutValor) || "Sin registro"}`;
    }

    async function buscarPacientePorRut(rutPaciente) {
        const rutOriginal = String(rutPaciente || "").trim();
        const rutFormateado = formatearRutBusqueda(rutOriginal);
        const rutNormalizado = normalizarRut(rutOriginal);
        const variantes = [...new Set([rutOriginal, rutFormateado, rutNormalizado].filter(Boolean))];

        for (const rutBusqueda of variantes) {
            const resPaciente = await fetch(`${API}/pacientes/contieneRut`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({rut: rutBusqueda}),
                mode: "cors"
            });

            if (!resPaciente.ok) {
                continue;
            }

            const pacientes = await resPaciente.json();
            if (!Array.isArray(pacientes) || pacientes.length === 0) {
                continue;
            }

            const pacienteExacto = pacientes.find((paciente) =>
                normalizarRut(paciente.rut) === rutNormalizado
            );

            if (pacienteExacto?.id_paciente) {
                return pacienteExacto;
            }

            if (pacientes[0]?.id_paciente) {
                return pacientes[0];
            }
        }

        return null;
    }

    async function crearPacienteDesdeReserva(reserva) {
        if (esRutDesconocido(reserva?.rut)) {
            throw new Error("No se puede generar una ficha con un RUT desconocido.");
        }

        const rutNormalizado = normalizarRut(reserva?.rut);
        const telefonoNormalizado = String(reserva?.telefono || "").trim() || "NO INDICADO";
        const correoNormalizado = String(reserva?.email || "").trim() || null;

        const resInsercion = await fetch(`${API}/pacientes/pacientesInsercion`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            mode: "cors",
            body: JSON.stringify({
                nombre: reserva?.nombrePaciente || "NO INDICADO",
                apellido: reserva?.apellidoPaciente || "NO INDICADO",
                rut: rutNormalizado || "NO INDICADO",
                nacimiento: "1900-01-01",
                sexo: "No especifica",
                prevision_id: 4,
                telefono: telefonoNormalizado,
                correo: correoNormalizado,
                direccion: "NO INDICADO",
                pais: "Chile",
                observacion1: "Paciente creado desde reservaciones",
                observacion2: "NO INDICADO",
                observacion3: "NO INDICADO",
                apoderado: "NO INDICADO",
                apoderado_rut: "NO INDICADO",
                medicamentosUsados: "NO INDICADO",
                habitos: "NO INDICADO",
                comentariosAdicionales: "Creado desde agenda con los datos disponibles de la reservacion"
            })
        });

        if (!resInsercion.ok) {
            throw new Error("No se pudo crear el paciente desde la reservacion");
        }

        const respuestaBackend = await resInsercion.json();

        if (respuestaBackend.message !== true && respuestaBackend.message !== "duplicado") {
            throw new Error("La creacion del paciente no fue aceptada por el servidor");
        }

        const pacienteCreado = await buscarPacientePorRut(rutNormalizado || reserva?.rut);

        if (!pacienteCreado?.id_paciente) {
            throw new Error("No se pudo recuperar el paciente recien creado");
        }

        return pacienteCreado;
    }

    function coincideConRangoFechas(reserva) {
        if (!fechaInicio || !fechaFinalizacion) return true;

        const fechaReserva = String(reserva?.fechaInicio || "").slice(0, 10);
        if (!fechaReserva) return false;

        return fechaReserva >= fechaInicio && fechaReserva <= fechaFinalizacion;
    }

    function aplicarFiltrosCombinados(reservas = []) {
        // El backend responde un objeto ({ message }) cuando falla: nunca se filtra eso como lista.
        if (!Array.isArray(reservas)) return [];
        return reservas.filter((reserva) => {
            // Solo mostrar reservas con estadoPeticion === 1
            const esEstadoCorrecto = Number(reserva?.estadoPeticion) === 1;
            if (!esEstadoCorrecto) return false;

            const profesionalFiltrado = idProfesionalAgendaActiva || id_profesional;
            const coincideProfesional = !profesionalFiltrado || String(reserva?.id_profesional) === String(profesionalFiltrado);
            const coincideEstado = !estadoReserva || normalizarEstadoReserva(reserva?.estadoReserva) === normalizarEstadoReserva(estadoReserva);
            const coincideFecha = coincideConRangoFechas(reserva);

            return coincideProfesional && coincideEstado && coincideFecha;
        });
    }

    function limpiarFiltrosPersistidos() {
        setId_profesional(idProfesionalAgendaActiva || "");
        setestadoReserva("");
        setfechaInicio(null);
        setfechaFinalizacion(null);
    }

    async function seleccionarTodosProfesionalesAgendaLista() {
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
                if(respustaBackend){
                    setListaProfesionales(respustaBackend);
                    const agendaAsignadaExiste = respustaBackend.some(
                        (profesional) => String(profesional.id_profesional) === idProfesionalAgendaAsignada
                    );
                    if (idProfesionalAgendaAsignada) {
                        setId_profesional(agendaAsignadaExiste ? idProfesionalAgendaAsignada : "");
                    }
                } else {
                    return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                }
            }
        } catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        if (!isLoaded) return;
        seleccionarTodosProfesionalesAgendaLista();
    }, [isLoaded, idProfesionalAgendaAsignada]);

    async function verFichaClinicaPaciente(reserva) {
        try {
            if (!canSeeFichasClinicas) {
                return toast.error("Tu perfil no tiene acceso a fichas clínicas.");
            }

            if (!reserva?.rut) {
                return toast.error("No se ha podido identificar al paciente de esta reserva");
            }

            if (esRutDesconocido(reserva.rut)) {
                return toast.error("No se puede generar una ficha con un RUT desconocido.");
            }

            setAbriendoFichaReservaId(reserva.id_reserva);
            const pacienteEncontrado = await buscarPacientePorRut(reserva.rut);

            if (pacienteEncontrado?.id_paciente) {
                router.push(`/dashboard/FichasPacientes/${pacienteEncontrado.id_paciente}`);
                return;
            }

            const confirmarCreacion = window.confirm(
                "No existe una ficha para este paciente. ¿Desea crearla ahora con los datos disponibles de la reservación?"
            );

            if (!confirmarCreacion) {
                return;
            }

            const nuevoPaciente = await crearPacienteDesdeReserva(reserva);
            toast.success("Paciente creado correctamente. Complete ahora la ficha clínica.");
            router.push(`/dashboard/FichasPacientes/${nuevoPaciente.id_paciente}`);
        } catch (error) {
            console.log(error);
            return toast.error("No se ha podido abrir o crear la ficha clinica de este paciente");
        } finally {
            setAbriendoFichaReservaId(null);
        }
    }

    async function buscarEntreFechas(fechaInicio, fechaFinalizacion, opciones = {}) {
        const {silencioso = false} = opciones;
        try {
            if (!fechaInicio || !fechaFinalizacion) {
                return toast.error("Debe seleccionar un rango de fechas para filtrar")
            }

            // fecha-ok: solo se comparan entre si. Las dos cargan el mismo
            // desfase, asi que cual es mayor no cambia.
            const start = new Date(fechaInicio);
            const end = new Date(fechaFinalizacion);

            if (start > end) {
                return toast.error("La fecha de inicio no puede ser posterior a la fecha de término.");
            }

            const reservasFiltradas = aplicarFiltrosCombinados(dataListaBase);
            setdataLista(reservasFiltradas);

            if (!silencioso) {
                if (reservasFiltradas.length > 0) {
                    return toast.success(`Se encontraron ${reservasFiltradas.length} citas en el período seleccionado.`);
                }
                return toast("No se encontraron citas en el período seleccionado.");
            }

            return true;
        } catch (error) {
            console.log(error);
            return toast.error("Error inesperado al buscar citas. Por favor, contacte a soporte técnico.");
        }
    }

    async function buscarPorRut(rut) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarRut`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({rut}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("Debe ingresar datos para filtrar.");
            } else {
                const respuestaBackend = await res.json();
                // Filtrar solo estadoPeticion === 1
                const filtradas = aplicarFiltrosCombinados(respuestaBackend);
                if (filtradas.length > 0) {
                    setdataLista(filtradas);
                    return toast.success("Similitud de RUT encontrada")
                } else {
                    return toast.error("No se han encontrado similitudes")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("No fue posible realizar la búsqueda. Intenta nuevamente o contacta a soporte.");
        }
    }

    async function buscarPorNombres(nombrePaciente) {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarNombre`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({nombrePaciente}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("Debe ingresar datos para filtrar.");
            } else {
                const respuestaBackend = await res.json();
                // Filtrar solo estadoPeticion === 1
                const filtradas = aplicarFiltrosCombinados(respuestaBackend);
                if (filtradas.length > 0) {
                    setdataLista(filtradas);
                    return toast.success("Similitud de nombre encontrada")
                } else {
                    return toast.error("No se han encontrado similitudes de nombres")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("No fue posible realizar la búsqueda. Intenta nuevamente o contacta a soporte.");
        }
    }

    async function listarTablaCitas() {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            });

            // El gate responde 401 con un objeto ({message}), no con la lista:
            // solo una lista es válida; cualquier otra respuesta deja la agenda vacía.
            const respuestaBackend = await res.json().catch(() => null);
            const reservas = Array.isArray(respuestaBackend) ? respuestaBackend : [];
            if (!res.ok || !Array.isArray(respuestaBackend)) {
                console.error("[Agenda] seleccionarReservados respondió", res.status, respuestaBackend);
            }
            setDataListaBase(reservas);
            setdataLista(aplicarFiltrosCombinados(reservas));
        } catch (err) {
            console.log(err);
            return toast.error(err.message);
        }
    }

    useEffect(() => {
        if (!isLoaded) return;
        listarTablaCitas();
    }, [isLoaded, idProfesionalAgendaAsignada]);

    useEffect(() => {
        if (!Array.isArray(dataListaBase) || dataListaBase.length === 0) {
            setdataLista([]);
            return;
        }
        setdataLista(aplicarFiltrosCombinados(dataListaBase));
    }, [dataListaBase, id_profesional, idProfesionalAgendaActiva, fechaInicio, fechaFinalizacion, estadoReserva]);

    function normalizarEstadoReserva(estado = "") {
        const base = String(estado)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        // Unifica variantes del mismo estado para que el filtro funcione
        if (base === "no asistio" || base === "no asistste" || base === "no asistio") return "no asiste";
        if (base === "reservado") return "reservada";
        if (base === "confirmado") return "confirmada";
        if (base === "anulado") return "anulada";
        return base;
    }

    function obtenerPaletaEstadoReserva(estadoReserva = "") {
        // Fuente de verdad: designTokens.js (misma paleta que usan calendario/AppointmentDrawer),
        // en vez de mantener estos valores duplicados a mano.
        const estadoNormalizado = normalizarEstadoReserva(estadoReserva);
        const token = getStateTokens(estadoNormalizado);
        return { backgroundColor: token.bg, color: token.text, accentColor: token.accent, borderColor: token.border };
    }

    function obtenerEstiloBadgeEstado(estadoReserva = "") {
        const paleta = obtenerPaletaEstadoReserva(estadoReserva);
        return { backgroundColor: paleta.backgroundColor, color: paleta.color, border: `1px solid ${paleta.borderColor}` };
    }

    function obtenerEstiloBotonEstado(estadoReserva = "") {
        const paleta = obtenerPaletaEstadoReserva(estadoReserva);
        return { backgroundColor: paleta.backgroundColor, color: paleta.color, border: `1px solid ${paleta.borderColor}` };
    }

    const accionesRapidasEstado = [
        { valor: "reservada", etiqueta: "Reservada", icono: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
        { valor: "confirmada", etiqueta: "Confirmada", icono: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> },
        { valor: "anulada", etiqueta: "Anulada", icono: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728"/></svg> },
        { valor: "asiste", etiqueta: "Asiste", icono: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-5-5m5 5l5-5"/></svg> },
        { valor: "no asiste", etiqueta: "No Asiste", icono: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> },
        { valor: "finalizado", etiqueta: "Finalizado", icono: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-1 9V21h9.28a2 2 0 001.97-1.66l1.38-9A2 2 0 0020.66 8H14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3" /></svg> }
    ];

    async function actualizarEstadoReservaRapido(id_reserva, nuevoEstado) {
        try {
            if (!id_reserva || !nuevoEstado) return toast.error("No se pudo identificar la reserva o el nuevo estado.");
            setActualizandoReservaId(id_reserva);
            const res = await fetch(`${API}/reservaPacientes/actualizarEstado`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({estadoReserva: nuevoEstado, id_reserva}),
                mode: "cors"
            });
            if (!res.ok) return toast.error("No se ha podido enviar la informacion para actualizar el estado.");
            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                setdataLista((prev) => (Array.isArray(prev) ? prev : []).map((item) => (item.id_reserva === id_reserva ? {...item, estadoReserva: nuevoEstado} : item)));
                setMenuEstadoAbiertoId(null);
                return toast.success("Se ha actualizado el estado con exito");
            }
            return toast.error("No se ha podido actualizar. Intente más tarde.");
        } catch (error) {
            console.log(error);
            return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
        } finally {
            setActualizandoReservaId(null);
        }
    }

    async function eliminarReservaDesdeListado(id_reserva) {
        try {
            if (!id_reserva) {
                return toast.error("No se pudo identificar la reservación a eliminar.");
            }

            const confirmarEliminacion = window.confirm(
                "¿Está seguro de que desea eliminar esta reserva?"
            );

            if (!confirmarEliminacion) return;

            setEliminandoReservaId(id_reserva);

            const res = await fetch(`${API}/reservaPacientes/eliminarReserva`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({id_reserva}),
                mode: "cors"
            });

            if (!res.ok) {
                return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
            }

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                setMenuEstadoAbiertoId(null);
                await listarTablaCitas();
                return toast.success("La reserva ha sido eliminada. El horario quedó disponible para nuevas citas.");
            }

            return toast.error("No se ha podido eliminar la reserva. Intente mas tarde.");
        } catch (error) {
            console.log(error);
            return toast.error("No hay conexion con el servidor por favor contacte a Soporte");
        } finally {
            setEliminandoReservaId(null);
        }
    }

    function abrirModalComentario(reserva) {
        setIdReservaComentario(reserva.id_reserva);
        setComentarioBorrador(comentariosReservas[reserva.id_reserva] || "");
    }

    function cerrarModalComentario() {
        setIdReservaComentario(null);
        setComentarioBorrador("");
    }

    function guardarComentarioReserva() {
        if (!idReservaComentario) return;
        // El textarea ya corta en 100, pero se recorta igual por si el valor
        // llega por otro camino. Texto vacío = volver a "Sin Comentarios".
        const texto = comentarioBorrador.trim().slice(0, MAX_CARACTERES_COMENTARIO);
        setComentariosReservas((prev) => ({...prev, [idReservaComentario]: texto}));
        cerrarModalComentario();
    }

    function exportarAExcel() {
        if (!dataLista || dataLista.length === 0) {
            return toast.error("No hay datos para exportar.");
        }

        const datosExportar = dataLista.map((reserva) => {
            const fila = {
                "Fecha": formatearFechaDashboard(reserva.fechaInicio),
                "Hora": formatearHoraDashboard(reserva.horaInicio),
                "Nombre Paciente": reserva.nombrePaciente || "",
                "Apellido Paciente": reserva.apellidoPaciente || "",
                "RUT": reserva.rut || "",
                "Profesional": obtenerNombreProfesionalReserva(reserva),
                "Motivo": reserva.motivo_reserva || "",
                "Estado": reserva.estadoReserva || "",
            };

            if (canSeeReservationAmounts) {
                fila.Monto = reserva.monto_reserva || "";
            }

            return fila;
        });

        const worksheet = XLSX.utils.json_to_sheet(datosExportar);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reservaciones");
        XLSX.writeFile(workbook, `reservaciones_${hoyCivil()}.xlsx`);
        toast.success("Archivo Excel exportado correctamente.");
    }

    function renderMenuAccionesReserva(data, opciones = {}) {
        // textoBoton/estiloBoton/claseBoton: variantes de presentación (la tarjeta
        // usa un botón genérico "Cambiar estado"; la tabla muestra el estado con
        // su paleta). El desplegable es idéntico en ambos casos.
        const {
            menuPositionClass = "left-0 mt-2",
            textoBoton,
            estiloBoton,
            claseBoton = "h-9 w-[172px] px-4",
        } = opciones;
        return (
            <div className="relative">
                <button
                    onClick={() => setMenuEstadoAbiertoId(menuEstadoAbiertoId === data.id_reserva ? null : data.id_reserva)}
                    className={`${claseBoton} vidrio-toque rounded-full flex items-center justify-between gap-2 transition-all hover:brightness-95 disabled:opacity-50`}
                    style={estiloBoton || obtenerEstiloBotonEstado(data.estadoReserva)}
                    disabled={actualizandoReservaId === data.id_reserva}
                >
                    <span className="truncate text-[11px] font-bold uppercase tracking-wide leading-none">
                        {actualizandoReservaId === data.id_reserva ? "Cargando..." : textoBoton || data.estadoReserva || "Reservada"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 shrink-0 opacity-60 transition-transform duration-200 ${menuEstadoAbiertoId === data.id_reserva ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {menuEstadoAbiertoId === data.id_reserva && (
                    <div className={`absolute ${menuPositionClass} w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cambiar estado</p>
                        <div className="p-2 pt-1 grid grid-cols-1 gap-1">
                            {accionesRapidasEstado.map((accion) => (
                                <button
                                    key={accion.valor}
                                    onClick={() => actualizarEstadoReservaRapido(data.id_reserva, accion.valor)}
                                    disabled={actualizandoReservaId === data.id_reserva}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={obtenerEstiloBadgeEstado(accion.valor)}>
                                        {accion.icono}
                                    </div>
                                    <span className="text-[12px] font-bold text-slate-700">{accion.etiqueta}</span>
                                </button>
                            ))}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                                <button
                                    type="button"
                                    disabled={eliminandoReservaId === data.id_reserva}
                                    onClick={() => eliminarReservaDesdeListado(data.id_reserva)}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </div>
                                    <span className="text-[12px] font-bold text-rose-700">
                                        {eliminandoReservaId === data.id_reserva ? "Eliminando..." : "Eliminar reserva"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // `esAnclaTour` marca UN solo botón de toda la pantalla como el ancla del paso
    // del tour que manda a abrir la ficha. Se activa únicamente en la tabla de
    // escritorio: las tarjetas móviles renderizan los mismos botones y, aunque
    // estén ocultas por CSS en desktop, siguen en el DOM y aparecerían primero en
    // un document.querySelector — driver.js mediría un elemento de 0x0 y dejaría
    // el recuadro y el popover tirados en una esquina.
    function renderBotonFichaReserva(data, {esAnclaTour = false, conEtiqueta = false, claseBoton} = {}) {
        if (!canSeeFichasClinicas) {
            return null;
        }

        return (
            <button
                data-tour={esAnclaTour ? "dashboard-ver-ficha" : undefined}
                onClick={() => verFichaClinicaPaciente(data)}
                disabled={abriendoFichaReservaId === data.id_reserva}
                className={claseBoton || (conEtiqueta
                    ? "h-11 px-5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    : "h-10 w-10 mx-auto rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm disabled:cursor-not-allowed disabled:opacity-60")}
                title="Ver Ficha Clínica"
            >
                {abriendoFichaReservaId === data.id_reserva ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
                {conEtiqueta ? <span>Ver ficha</span> : null}
            </button>
        );
    }

    // Mismo porte y estilo que el botón "Ver ficha": forman un par de acciones.
    // Se tiñe violeta cuando la cita ya tiene comentario guardado.
    function renderBotonComentarioReserva(reserva) {
        return (
            <button
                type="button"
                onClick={() => abrirModalComentario(reserva)}
                title="Comentario"
                aria-label="Editar comentario"
                className={`h-10 w-10 rounded-xl border transition-all flex items-center justify-center shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                    comentariosReservas[reserva.id_reserva]
                        ? "border-[#EDE9FE] bg-[#F3F0FF] text-[#6E56CF] hover:brightness-95"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        );
    }

    // Fila que el tour resalta en el paso "abre la ficha clínica desde la cita".
    // Se prefiere la reserva de prueba que el propio usuario acaba de crear —
    // misma identidad = mismo RUT, que es además la llave con la que se busca o
    // se crea su ficha. Si esa reserva no está en el listado visible (por ejemplo
    // porque quedó un filtro de fechas guardado que la deja fuera), se cae a la
    // primera fila: el paso siempre debe tener un ancla real en pantalla, o el
    // tour se quedaría esperando un selector que nunca va a aparecer.
    const idReservaAnclaTour = (() => {
        if (!tourEnCurso || !canSeeFichasClinicas || dataLista.length === 0) return null;

        const coincidencia = rutReservaTour
            ? dataLista.find((item) => normalizarRut(item?.rut) === rutReservaTour)
            : null;

        return (coincidencia ?? dataLista[0])?.id_reserva ?? null;
    })();

    // Reserva cuyo comentario está siendo editado en el modal (para el encabezado).
    const reservaComentarioModal = idReservaComentario
        ? dataLista.find((item) => item.id_reserva === idReservaComentario)
        : null;

    const resumenEstados = dataLista.reduce((acc, item) => {
        const estado = normalizarEstadoReserva(item?.estadoReserva);
        if (estado === "confirmada" || estado === "confirmado") acc.confirmadas += 1;
        if (estado === "anulada" || estado === "anulado") acc.anuladas += 1;
        if (estado === "asiste") acc.asiste += 1;
        if (estado === "finalizado") acc.finalizadas += 1;
        return acc;
    }, {confirmadas: 0, anuladas: 0, asiste: 0, finalizadas: 0});

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-3 py-4 md:px-8 md:py-10 2xl:max-w-none">
                
                {/* ── Header Principal y Resumen ── */}
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
                    <div className="shrink-0">
                        <h1 className="whitespace-nowrap text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Panel de Reservaciones
                        </h1>
                    </div>

                    <div className="flex w-full flex-col gap-2 xl:w-auto xl:shrink-0">
                        {/* Metricas en columnas iguales: antes cada tarjeta tomaba el
                            ancho de su contenido y la fila quedaba despareja. */}
                        <div data-tour="dashboard-kpis" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{dataLista.length}</span>
                            </div>
                        </div>
                        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Confirmadas</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.confirmadas}</span>
                            </div>
                        </div>
                        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-5-5m5 5l5-5"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Asiste</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.asiste}</span>
                            </div>
                        </div>
                        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Anuladas</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.anuladas}</span>
                            </div>
                        </div>
                        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-1 9V21h9.28a2 2 0 001.97-1.66l1.38-9A2 2 0 0020.66 8H14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3" /></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Finalizadas</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.finalizadas}</span>
                            </div>
                        </div>
                        </div>
                        <div className="flex flex-wrap items-stretch gap-2 [&>*]:h-11 [&>*]:flex-1 [&>*]:min-w-[140px] [&_button]:h-11 [&_button]:w-full">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/calendario")}
                            className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-black px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            aria-label="Ir al calendario para agendar un paciente"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Agendar Paciente</span>
                        </button>
                        {canSeeFichasClinicas && (
                            <button
                                onClick={() => router.push("/dashboard/FichaClinica")}
                                className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Fichas Clínicas</span>
                            </button>
                        )}
                        <BotonAyuda
                            video={{
                                videoId: "ga44dJoW62c",
                                titulo: "Panel de reservas",
                                ariaLabel: "Abrir video tutorial del panel de citas",
                            }}
                            info={{
                                informacion: 'Panel principal de la agenda: aquí ves y gestionas todas las citas registradas en el sistema.',
                                pasos: [
                                    'Abre el panel de filtros para buscar por paciente, profesional, fecha o estado.',
                                    'Revisa las tarjetas superiores (Total, Confirmadas, Asiste, Anuladas, Finalizadas) para un resumen rápido.',
                                    'Usa el menú de acciones de cada fila para cambiar el estado de asistencia de una cita.',
                                    'Presiona "Fichas Clínicas" para ir directo al historial médico del paciente.',
                                ],
                            }}
                            className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                        />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Panel de Filtros */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div data-tour="dashboard-filtros-header" onClick={() => setMostrarFiltros(!mostrarFiltros)} className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#F3F0FF] text-[#6E56CF] flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                </div>
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Filtros Avanzados y Búsqueda</h2>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        {mostrarFiltros && (
                            <div className="p-4 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                                {/* Fila 1: búsqueda por campo */}
                                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Paciente</label>
                                        <div className="flex gap-2">
                                            <ShadcnInput value={nombrePaciente} onChange={(e) => setnombrePaciente(e.target.value)} placeholder="Ej: Nicolas..." className="h-9 rounded-xl border-slate-200" />
                                            <button onClick={() => buscarPorNombres(nombrePaciente)} className="h-9 px-4 shrink-0 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all">Buscar</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RUT Paciente</label>
                                        <div className="flex gap-2">
                                            <ShadcnInput value={rut} onChange={(e) => setrut(e.target.value)} placeholder="12.345.678-9" className="h-9 rounded-xl border-slate-200" />
                                            <button onClick={() => buscarPorRut(rut)} className="h-9 px-4 shrink-0 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all">Buscar</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Profesional</label>
                                        {idProfesionalAgendaActiva ? (
                                            <div className="flex h-9 w-full items-center rounded-xl border border-violet-200 bg-violet-50 px-3 text-[12px] font-semibold text-violet-900">
                                                {listaProfesionales.find((profesional) => String(profesional.id_profesional) === idProfesionalAgendaActiva)?.nombreProfesional || "Agenda asignada"}
                                            </div>
                                        ) : (
                                            <Select value={String(id_profesional || "null")} onValueChange={(v) => setId_profesional(v === "null" ? "" : v)}>
                                                <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white"><SelectValue placeholder="Seleccionar profesional..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="null">Todos los profesionales</SelectItem>
                                                    {listaProfesionales.map((p) => (<SelectItem key={p.id_profesional} value={String(p.id_profesional)}>{p.nombreProfesional}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado Reserva</label>
                                        <Select value={estadoReserva || "null"} onValueChange={(v) => setestadoReserva(v)}>
                                            <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white"><SelectValue placeholder="Cualquier estado..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">Todos los estados</SelectItem>
                                                {accionesRapidasEstado.map((e) => (<SelectItem key={e.valor} value={e.valor}>{e.etiqueta}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Fila 2: rango de fechas + acciones */}
                                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-6 border-t border-slate-100">
                                    <Calendar28 nombre="Desde" value={fechaInicio} onChange={(v) => setfechaInicio(v)} />
                                    <Calendar28 nombre="Hasta" value={fechaFinalizacion} onChange={(v) => setfechaFinalizacion(v)} />
                                    <button onClick={() => buscarEntreFechas(fechaInicio, fechaFinalizacion)} className="h-9 w-full bg-black text-white text-[13px] font-bold rounded-xl hover:bg-slate-800 shadow-sm transition-all">Filtrar por Período</button>
                                    <button onClick={() => { limpiarFiltrosPersistidos(); listarTablaCitas(); }} className="h-9 w-full border border-slate-200 text-slate-500 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all">Limpiar Filtros</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabla de Resultados */}
                    <div data-tour="dashboard-tabla-citas" className="overflow-visible rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div data-tour="dashboard-citas-header" className="flex items-center justify-between gap-3 rounded-t-[32px] border-b border-slate-100 bg-slate-50/30 px-4 py-3.5 md:px-8 md:py-5">
                            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-slate-900 md:text-[11px] md:font-bold md:tracking-widest md:text-slate-500">Citas Agendadas</h2>
                            <div className="flex items-center gap-2.5 md:gap-3">
                                <span className="text-[13px] font-bold text-slate-400 md:text-[11px]">{dataLista.length} {dataLista.length === 1 ? "cita" : "citas"}</span>
                                <button
                                    data-tour="dashboard-exportar-excel"
                                    onClick={exportarAExcel}
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[12px] font-bold text-slate-600 transition-all hover:bg-slate-50 md:h-8 md:rounded-xl md:px-3 md:text-[11px]"
                                    title="Exportar a Excel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Exportar Excel
                                </button>
                            </div>
                        </div>

                        {/* Vista móvil: tarjetas */}
                        <div className="xl:hidden px-3 py-3 sm:px-5">
                            {dataLista.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <p className="text-[13px] text-slate-400 font-medium">No se encontraron citas para los criterios seleccionados.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-4">
                                    {dataLista.map((data) => {
                                        const fecha = descomponerFechaDashboard(data.fechaInicio);
                                        const tokenEstado = getStateTokens(normalizarEstadoReserva(data.estadoReserva));
                                        return (
                                        <article key={data.id_reserva} className="self-start overflow-visible rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm">
                                            <div className="flex items-stretch gap-3.5">
                                                {/* Insignia de fecha: abarca toda la altura de las filas */}
                                                <div className="flex w-[74px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#F3F0FF] py-4 text-center">
                                                    <span className="text-[30px] font-extrabold leading-none text-slate-900">{fecha?.dia ?? "—"}</span>
                                                    <span className="mt-2 text-[11px] font-bold tracking-[0.22em] text-[#6E56CF]">{fecha?.mesCorto ?? ""}</span>
                                                    <span className="mt-0.5 text-[10px] font-semibold text-slate-400">{fecha?.anio ?? ""}</span>
                                                    {fecha?.diaCorto ? (
                                                        <span className="mt-2 rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6E56CF]">{fecha.diaCorto}</span>
                                                    ) : null}
                                                </div>

                                                {/* Detalle de la cita */}
                                                <div className="min-w-0 flex-1 space-y-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </span>
                                                            <div className="leading-tight">
                                                                <p className="text-[16px] font-bold text-[#6E56CF]">{formatearHoraDashboard(data.horaInicio)}</p>
                                                                <p className="mt-0.5 text-[13px] font-medium text-slate-400">{fecha?.diaSemana ?? ""}</p>
                                                            </div>
                                                        </div>
                                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide" style={{ backgroundColor: tokenEstado.bg, color: tokenEstado.text, border: `1px solid ${tokenEstado.border}` }}>
                                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tokenEstado.dot }} />
                                                            {formatearEstadoVisible(data.estadoReserva) || "reservada"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </span>
                                                        <div className="min-w-0 leading-tight">
                                                            <p className="truncate text-[16px] font-bold text-slate-900">{data.nombrePaciente + " " + data.apellidoPaciente}</p>
                                                            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-400">{formatearRutTarjeta(data.rut)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </span>
                                                        <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-slate-700">{data.motivo_reserva}</p>
                                                        {canSeeReservationAmounts ? (
                                                            <span className="shrink-0 text-[17px] font-extrabold text-slate-900">
                                                                ${(Number(data.monto_reserva) || 0).toLocaleString("es-CL")}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v5a5 5 0 0010 0V3" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13v2a4 4 0 008 0v-3" />
                                                                <circle cx="18" cy="10" r="2" />
                                                            </svg>
                                                        </span>
                                                        <p className="min-w-0 truncate text-[14px] font-medium text-slate-500">Con {obtenerNombreProfesionalReserva(data)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-3">
                                                {renderMenuAccionesReserva(data, {
                                                    textoBoton: "Cambiar estado",
                                                    claseBoton: "h-12 w-[55%] min-w-[160px] max-w-[250px] px-5",
                                                    estiloBoton: { backgroundColor: "#F3F0FF", color: "#6E56CF", border: "1px solid #EDE9FE" },
                                                })}
                                                {renderBotonFichaReserva(data, {
                                                    conEtiqueta: true,
                                                    claseBoton: "ml-auto flex h-12 min-w-[120px] max-w-[210px] flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
                                                })}
                                            </div>
                                        </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Vista desktop: tabla. `table-fixed` + anchos por columna:
                            la tabla SIEMPRE cabe en el ancho disponible (con el
                            sidebar fijado quedan ~930px) y se compacta recortando
                            texto, sin desplazarse ni desbordar la tarjeta. */}
                        <div className="hidden overflow-visible [&_[data-slot=table-container]]:overflow-visible xl:block">
                            <Table className="table-fixed">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                        <TableHead className="w-[112px] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5 pl-8">Horario</TableHead>
                                        <TableHead className="w-[17%] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Identidad Paciente</TableHead>
                                        <TableHead className="w-[136px] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Profesional</TableHead>
                                        <TableHead className="w-[13%] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Motivo</TableHead>
                                        <TableHead className="w-[84px] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Previsión</TableHead>
                                        <TableHead className="w-[11%] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Comentario</TableHead>
                                        <TableHead className="w-[150px] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Control de Estado</TableHead>
                                        {canSeeFichasClinicas && (
                                            <TableHead className="w-[128px] text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5 pr-6">Ficha</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLista.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={canSeeFichasClinicas ? 8 : 7} className="py-32 text-center">
                                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                                <p className="text-[13px] text-slate-400 font-medium">No se encontraron citas para los criterios seleccionados.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dataLista.map((reserva) => (
                                            <TableRow key={reserva.id_reserva} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                <TableCell className="py-6 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-slate-900">{formatearHoraDashboard(reserva.horaInicio)} hrs</span>
                                                        <span className="text-[11px] text-slate-400 font-medium mt-1">{formatearFechaDashboard(reserva.fechaInicio)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="truncate text-[13px] font-bold text-slate-800">{reserva.nombrePaciente} {reserva.apellidoPaciente}</span>
                                                        <span className="mt-0.5 truncate text-[11px] text-slate-400 font-medium">{formatearRutVisible(reserva.rut)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <span className="block truncate text-[13px] font-semibold text-slate-600">{obtenerNombreProfesionalReserva(reserva)}</span>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-semibold text-slate-700 truncate">{reserva.motivo_reserva}</span>
                                                        {canSeeReservationAmounts ? (
                                                            <span className="text-[13px] font-bold text-[#6E56CF] mt-0.5">${reserva.monto_reserva}</span>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                {/* Previsión y Comentario aún no existen en la base de
                                                    datos: se muestran valores fijos hasta que lleguen. */}
                                                <TableCell className="py-6">
                                                    <span className="block truncate text-[13px] font-semibold text-slate-400">NO INDICADA</span>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    {comentariosReservas[reserva.id_reserva] ? (
                                                        <span
                                                            className="block truncate text-[13px] font-semibold text-slate-700"
                                                            title={comentariosReservas[reserva.id_reserva]}
                                                        >
                                                            {comentariosReservas[reserva.id_reserva]}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[13px] font-medium text-slate-400">Sin Comentarios</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-6 overflow-visible">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Ancho FIJO: la pastilla mide lo mismo con el
                                                            sidebar fijado que en rail (con `w-full` seguía
                                                            el ancho de la columna y cambiaba de porte). */}
                                                        {renderMenuAccionesReserva(reserva, { claseBoton: "h-9 w-[120px] px-3" })}
                                                        {/* Sin acceso a fichas, el lápiz del comentario
                                                            vuelve aquí para no perder la función. */}
                                                        {!canSeeFichasClinicas && renderBotonComentarioReserva(reserva)}
                                                    </div>
                                                </TableCell>
                                                {canSeeFichasClinicas && (
                                                    <TableCell className="py-6 pr-6">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {renderBotonFichaReserva(reserva, {
                                                                esAnclaTour: reserva.id_reserva === idReservaAnclaTour,
                                                            })}
                                                            {renderBotonComentarioReserva(reserva)}
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Modal: editar el comentario de una cita (máx. 100 caracteres). */}
                {idReservaComentario && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={cerrarModalComentario} />
                        <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F0FF] text-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-bold text-slate-900">Comentario de la cita</h3>
                                    {reservaComentarioModal && (
                                        <p className="mt-0.5 truncate text-[12px] font-medium text-slate-400">
                                            {reservaComentarioModal.nombrePaciente} {reservaComentarioModal.apellidoPaciente} · {formatearFechaDashboard(reservaComentarioModal.fechaInicio)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 px-6 py-5">
                                <textarea
                                    value={comentarioBorrador}
                                    onChange={(e) => setComentarioBorrador(e.target.value.slice(0, MAX_CARACTERES_COMENTARIO))}
                                    maxLength={MAX_CARACTERES_COMENTARIO}
                                    rows={4}
                                    autoFocus
                                    placeholder="Escribe un comentario para esta cita..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-[13px] font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-[#6E56CF]/20"
                                />
                                <p className="text-right text-[11px] font-bold text-slate-400">
                                    {comentarioBorrador.length}/{MAX_CARACTERES_COMENTARIO}
                                </p>
                            </div>
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={cerrarModalComentario}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-500 transition-all hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={guardarComentarioReserva}
                                    className="h-10 rounded-xl bg-black px-5 text-[13px] font-bold text-white transition-all hover:bg-slate-800"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
