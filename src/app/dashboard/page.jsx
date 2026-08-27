"use client"
import {useState, useEffect} from "react";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {useUser} from "@clerk/nextjs";
import {Calendar28} from "@/Componentes/shadcnCalendarSelector";
import {InfoButton} from "@/Componentes/InfoButton";
import {canAccessFichasClinicas, getDashboardRoleFromUser} from "@/lib/dashboard-access";

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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const STORAGE_KEYS = {
    profesional: "dashboard_reservas_profesional",
    fechaInicio: "dashboard_reservas_fecha_inicio",
    fechaFinalizacion: "dashboard_reservas_fecha_finalizacion",
    estado: "dashboard_reservas_estado",
};

export default function AgendaCitas() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const {user, isLoaded} = useUser();
    const dashboardRole = getDashboardRoleFromUser(user);
    const canSeeFichasClinicas = isLoaded && canAccessFichasClinicas(dashboardRole);
    const canSeeReservationAmounts = isLoaded && dashboardRole !== "operador-clinico";
    const [dataLista, setdataLista] = useState([]);
    const [dataListaBase, setDataListaBase] = useState([]);
    const [nombrePaciente, setnombrePaciente] = useState("");
    const [rut, setrut] = useState("");
    const [fechaInicio, setfechaInicio] = useState(null);
    const [fechaFinalizacion, setfechaFinalizacion] = useState(null);
    const [estadoReserva, setestadoReserva] = useState("");
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [id_profesional, setId_profesional] = useState("");
    const [actualizandoReservaId, setActualizandoReservaId] = useState(null);
    const [abriendoFichaReservaId, setAbriendoFichaReservaId] = useState(null);
    const [eliminandoReservaId, setEliminandoReservaId] = useState(null);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [menuEstadoAbiertoId, setMenuEstadoAbiertoId] = useState(null);
    const [monto_reserva, setMontoReserva] = useState("");
    const [motivo_reserva, setMotivoReserva] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;

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
    }, []);

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

    function formatearFechaDashboard(fecha) {
        if (!fecha) return "";

        const date = new Date(fecha);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    function formatearHoraDashboard(hora) {
        if (!hora) return "";
        return String(hora).slice(0, 5);
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
        return reservas.filter((reserva) => {
            // Solo mostrar reservas con estadoPeticion === 1
            const esEstadoCorrecto = Number(reserva?.estadoPeticion) === 1;
            if (!esEstadoCorrecto) return false;

            const coincideProfesional = !id_profesional || String(reserva?.id_profesional) === String(id_profesional);
            const coincideEstado = !estadoReserva || normalizarEstadoReserva(reserva?.estadoReserva) === normalizarEstadoReserva(estadoReserva);
            const coincideFecha = coincideConRangoFechas(reserva);

            return coincideProfesional && coincideEstado && coincideFecha;
        });
    }

    function limpiarFiltrosPersistidos() {
        setId_profesional("");
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
                } else {
                    return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                }
            }
        } catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionalesAgendaLista();
    }, []);

    async function verFichaClinicaPaciente(reserva) {
        try {
            if (!canSeeFichasClinicas) {
                return toast.error("Tu perfil no tiene acceso a fichas clínicas.");
            }

            if (!reserva?.rut) {
                return toast.error("No se ha podido identificar al paciente de esta reserva");
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
            router.push(`/dashboard/NuevaFicha/${nuevoPaciente.id_paciente}`);
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
                return toast.success("No se encontraron citas en el período seleccionado.");
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
                const filtradas = respuestaBackend.filter(r => Number(r?.estadoPeticion) === 1);
                if (filtradas.length > 0) {
                    setdataLista(filtradas);
                    return toast.success("Similitud de RUT encontrada")
                } else {
                    return toast.error("No se han encontrado similitudes")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("No ha sido posible buscar, contacte a soporte Tecnico de Medify");
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
                const filtradas = respuestaBackend.filter(r => Number(r?.estadoPeticion) === 1);
                if (filtradas.length > 0) {
                    setdataLista(filtradas);
                    return toast.success("Similitud de nombre encontrada")
                } else {
                    return toast.error("No se han encontrado similitudes de nombres")
                }
            }
        } catch (error) {
            console.log(error);
            return toast.error("No ha sido posible buscar, contacte a soporte Tecnico de Medify");
        }
    }

    async function listarTablaCitas() {
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            });

            const respuestaBackend = await res.json();
            if (respuestaBackend) {
                setDataListaBase(respuestaBackend);
                setdataLista(respuestaBackend);
            }
        } catch (err) {
            console.log(err);
            return toast.error(err.message);
        }
    }

    useEffect(() => {
        listarTablaCitas();
    }, []);

    useEffect(() => {
        if (!Array.isArray(dataListaBase) || dataListaBase.length === 0) {
            setdataLista(dataListaBase);
            return;
        }
        setdataLista(aplicarFiltrosCombinados(dataListaBase));
    }, [dataListaBase, id_profesional, fechaInicio, fechaFinalizacion, estadoReserva]);

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
        const estadoNormalizado = normalizarEstadoReserva(estadoReserva);

        if (estadoNormalizado === "reservada" || estadoNormalizado === "reservado") {
            return { backgroundColor: "rgba(110, 86, 207, 0.10)", color: "#4c1d95", accentColor: "#6E56CF", borderColor: "rgba(110, 86, 207, 0.30)" };
        }
        if (estadoNormalizado === "confirmada" || estadoNormalizado === "confirmado") {
            return { backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#065f46", accentColor: "#10B981", borderColor: "rgba(16, 185, 129, 0.30)" };
        }
        if (estadoNormalizado === "asiste") {
            return { backgroundColor: "rgba(14, 165, 233, 0.12)", color: "#0c4a6e", accentColor: "#0EA5E9", borderColor: "rgba(14, 165, 233, 0.30)" };
        }
        if (estadoNormalizado === "no asiste" || estadoNormalizado === "no asistio" || estadoNormalizado === "no asistste") {
            return { backgroundColor: "rgba(249, 115, 22, 0.12)", color: "#9a3412", accentColor: "#F97316", borderColor: "rgba(249, 115, 22, 0.30)" };
        }
        if (estadoNormalizado === "finalizado") {
            return { backgroundColor: "rgba(15, 118, 110, 0.12)", color: "#134e4a", accentColor: "#0F766E", borderColor: "rgba(15, 118, 110, 0.30)" };
        }
        if (estadoNormalizado === "anulada" || estadoNormalizado === "anulado") {
            return { backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#991b1b", accentColor: "#EF4444", borderColor: "rgba(239, 68, 68, 0.30)" };
        }
        return { backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#92400e", accentColor: "#F59E0B", borderColor: "rgba(245, 158, 11, 0.35)" };
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
                setdataLista((prev) => prev.map((item) => (item.id_reserva === id_reserva ? {...item, estadoReserva: nuevoEstado} : item)));
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
        XLSX.writeFile(workbook, `reservaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success("Archivo Excel exportado correctamente.");
    }

    function renderMenuAccionesReserva(data, opciones = {}) {
        const { menuPositionClass = "left-0 mt-2" } = opciones;
        return (
            <div className="relative">
                <button
                    onClick={() => setMenuEstadoAbiertoId(menuEstadoAbiertoId === data.id_reserva ? null : data.id_reserva)}
                    className="h-9 w-[172px] px-4 rounded-full flex items-center justify-between gap-2 transition-all hover:brightness-95 disabled:opacity-50"
                    style={obtenerEstiloBotonEstado(data.estadoReserva)}
                    disabled={actualizandoReservaId === data.id_reserva}
                >
                    <span className="truncate text-[11px] font-bold uppercase tracking-wide leading-none">
                        {actualizandoReservaId === data.id_reserva ? "Cargando..." : data.estadoReserva || "Reservada"}
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

    function renderBotonFichaReserva(data) {
        if (!canSeeFichasClinicas) {
            return null;
        }

        return (
            <button
                onClick={() => verFichaClinicaPaciente(data)}
                disabled={abriendoFichaReservaId === data.id_reserva}
                className="h-10 w-10 mx-auto rounded-xl bg-white border border-slate-200 text-[#6E56CF] hover:border-[#6E56CF] hover:bg-violet-50 transition-all flex items-center justify-center shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
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
            </button>
        );
    }

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
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                
                {/* ── Header Principal y Resumen ── */}
                <div className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 xl:gap-8">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Agenda Clínica</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Panel de <span className="text-[#6E56CF]">Citas</span>
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Control central de citas, estados de asistencia y flujo de pacientes. Filtra y gestiona la agenda clínica en tiempo real.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div data-tour="dashboard-kpis" className="flex flex-wrap items-center gap-2 xl:shrink-0 xl:flex-nowrap xl:gap-1">
                        <div className="h-11 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{dataLista.length}</span>
                            </div>
                        </div>
                        <div className="h-11 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F3F0FF] text-[#6E56CF]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Confirmadas</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.confirmadas}</span>
                            </div>
                        </div>
                        <div className="h-11 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-5-5m5 5l5-5"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Asiste</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.asiste}</span>
                            </div>
                        </div>
                        <div className="h-11 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Anuladas</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.anuladas}</span>
                            </div>
                        </div>
                        <div className="h-11 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-1 9V21h9.28a2 2 0 001.97-1.66l1.38-9A2 2 0 0020.66 8H14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3" /></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Finalizadas</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 leading-none">{resumenEstados.finalizadas}</span>
                            </div>
                        </div>
                        </div>
                        <a
                            href="https://youtu.be/ga44dJoW62c?si=7lr5NnDPFcJfgzNI"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                            aria-label="Abrir video tutorial del panel de citas"
                        >
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-px h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </span>
                            <span>Video Tutorial</span>
                        </a>
                        {canSeeFichasClinicas && (
                            <button
                                onClick={() => router.push("/dashboard/FichaClinica")}
                                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#6E56CF] px-3 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-[#5b45bc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Fichas Clínicas</span>
                            </button>
                        )}
                        <InfoButton
                            informacion={'Panel principal de la agenda: aquí ves y gestionas todas las citas registradas en el sistema.'}
                            pasos={[
                                'Abre el panel de filtros para buscar por paciente, profesional, fecha o estado.',
                                'Revisa las tarjetas superiores (Total, Confirmadas, Asiste, Anuladas, Finalizadas) para un resumen rápido.',
                                'Usa el menú de acciones de cada fila para cambiar el estado de asistencia de una cita.',
                                'Presiona "Fichas Clínicas" para ir directo al historial médico del paciente.',
                            ]}
                        />
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
                                        <Select value={String(id_profesional || "null")} onValueChange={(v) => setId_profesional(v)}>
                                            <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white"><SelectValue placeholder="Seleccionar profesional..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">Todos los profesionales</SelectItem>
                                                {listaProfesionales.map((p) => (<SelectItem key={p.id_profesional} value={String(p.id_profesional)}>{p.nombreProfesional}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
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
                                    <button onClick={() => buscarEntreFechas(fechaInicio, fechaFinalizacion)} className="h-9 w-full bg-[#6E56CF] text-white text-[13px] font-bold rounded-xl hover:bg-[#5b45bc] shadow-sm transition-all">Filtrar por Período</button>
                                    <button onClick={() => { limpiarFiltrosPersistidos(); listarTablaCitas(); }} className="h-9 w-full border border-slate-200 text-slate-500 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all">Limpiar Filtros</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabla de Resultados */}
                    <div data-tour="dashboard-tabla-citas" className="overflow-visible rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between rounded-t-[32px] border-b border-slate-100 bg-slate-50/30 px-4 py-4 md:px-8 md:py-5">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Citas Agendadas</h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-slate-400">{dataLista.length} {dataLista.length === 1 ? "cita" : "citas"}</span>
                                <button
                                    data-tour="dashboard-exportar-excel"
                                    onClick={exportarAExcel}
                                    className="h-8 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                                    title="Exportar a Excel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Exportar Excel
                                </button>
                            </div>
                        </div>

                        {/* Vista móvil: tarjetas */}
                        <div className="xl:hidden px-4 py-4 sm:px-6">
                            {dataLista.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <p className="text-[13px] text-slate-400 font-medium">No se encontraron citas para los criterios seleccionados.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                                    {dataLista.map((data) => (
                                        <article key={data.id_reserva} className="self-start overflow-visible rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[13px] font-bold text-slate-900">
                                                    {formatearFechaDashboard(data.fechaInicio)}
                                                </span>
                                                <span className="inline-flex items-center rounded-lg bg-[#F3F0FF] border border-[#EDE9FE] px-3 py-1.5 text-[13px] font-bold text-[#6E56CF]">
                                                    {formatearHoraDashboard(data.horaInicio)}
                                                </span>
                                                <span className="inline-flex min-w-[96px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold" style={obtenerEstiloBadgeEstado(data.estadoReserva)}>
                                                    {formatearEstadoVisible(data.estadoReserva)}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paciente</p>
                                                    <p className="mt-1 text-lg font-bold text-slate-900">{data.nombrePaciente + " " + data.apellidoPaciente}</p>
                                                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">{formatearRutVisible(data.rut)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Motivo de Atención</p>
                                                    <p className="mt-1 text-base font-semibold text-slate-800">{data.motivo_reserva}</p>
                                                    {canSeeReservationAmounts ? (
                                                        <p className="mt-0.5 text-[13px] font-bold text-[#6E56CF]">${data.monto_reserva}</p>
                                                    ) : null}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profesional</p>
                                                    <p className="mt-1 text-[13px] font-semibold text-slate-600">{obtenerNombreProfesionalReserva(data)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                {renderMenuAccionesReserva(data, { menuPositionClass: "left-0 mt-2" })}
                                                {renderBotonFichaReserva(data)}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Vista desktop: tabla */}
                        <div className="hidden overflow-visible [&_[data-slot=table-container]]:overflow-visible xl:block">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                        <TableHead className="w-[120px] text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5 pl-8">Horario</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Identidad Paciente</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Profesional</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Motivo</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5">Control de Estado</TableHead>
                                        {canSeeFichasClinicas && (
                                            <TableHead className="w-[100px] text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-5 pr-8">Ficha</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLista.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={canSeeFichasClinicas ? 6 : 5} className="py-32 text-center">
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
                                                        <span className="text-[13px] font-bold text-slate-800">{reserva.nombrePaciente} {reserva.apellidoPaciente}</span>
                                                        <span className="text-[11px] text-slate-400 font-medium mt-0.5">{formatearRutVisible(reserva.rut)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <span className="text-[13px] font-semibold text-slate-600">{obtenerNombreProfesionalReserva(reserva)}</span>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col max-w-[180px]">
                                                        <span className="text-[13px] font-semibold text-slate-700 truncate">{reserva.motivo_reserva}</span>
                                                        {canSeeReservationAmounts ? (
                                                            <span className="text-[13px] font-bold text-[#6E56CF] mt-0.5">${reserva.monto_reserva}</span>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 overflow-visible">
                                                    {renderMenuAccionesReserva(reserva)}
                                                </TableCell>
                                                {canSeeFichasClinicas && (
                                                    <TableCell className="py-6 pr-8 text-center">
                                                        {renderBotonFichaReserva(reserva)}
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
            </div>
        </div>
    )
}
