"use client"
import {useParams} from "next/navigation";
import {useState, useEffect, useRef, useMemo} from "react";
import { useUser } from "@clerk/nextjs";
import {toast} from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ToasterClient from "@/Componentes/ToasterClient";
import formatearFecha from "@/FuncionesTranversales/funcionesTranversales.js"
import {useEmpresaNombre} from "@/hooks/useEmpresaNombre";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {useRouter} from "next/navigation";
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {ShadcnSelect} from "@/Componentes/shadcnSelect";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import * as React from "react";
import {CheckboxIcon} from "@radix-ui/react-icons";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import {InfoButton} from "@/Componentes/InfoButton";
import { formatRut } from "@/lib/designTokens";
import {
    canAccessOdontograma,
    canAccessRecetasEnFicha,
    getDashboardRoleFromUser,
} from "@/lib/dashboard-access";


function parsearDatosDinamicos(datos) {
    if (!datos) return null
    let parsed = datos
    if (typeof datos === "string") {
        try { parsed = JSON.parse(datos) } catch { return null }
    }
    if (!parsed || typeof parsed !== "object") return null
    return parsed
}

function agruparPorCategoria(datos) {
    const categoriasMap = {}

    Object.keys(datos).forEach(key => {
        if (key === "_plantillaNombre") return
        const entry = datos[key]
        if (!entry || typeof entry !== "object" || !entry.nombreCategoria) return

        const catNombre = entry.nombreCategoria
        if (!categoriasMap[catNombre]) {
            categoriasMap[catNombre] = {
                nombre: catNombre,
                orden: entry.categoriaOrden || 0,
                campos: []
            }
        }
        categoriasMap[catNombre].campos.push({
            nombre: entry.nombreCampo,
            valor: entry.valor,
            orden: entry.campoOrden || 0
        })
    })

    return Object.values(categoriasMap)
        .sort((a, b) => a.orden - b.orden)
        .map(cat => ({
            ...cat,
            campos: cat.campos.sort((a, b) => a.orden - b.orden)
        }))
}

function esDatoVisible(valor) {
    if (valor === null || valor === undefined) return false;

    const texto = String(valor).trim();
    if (!texto) return false;

    const normalizado = texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (
        normalizado === "-" ||
        normalizado === "no indicado" ||
        normalizado === "no especificado" ||
        normalizado === "no especifica" ||
        normalizado === "sin definir"
    ) {
        return false;
    }

    return true;
}

function esFechaPlaceholder(fecha) {
    if (!fecha) return true;

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return true;

    return date.getFullYear() === 1900;
}

function convertirFechaParaBackend(fecha) {
    if (!fecha) return "";

    if (typeof fecha === "string") {
        const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
        const date = new Date(fechaLimpia);

        if (!Number.isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
        }

        return fechaLimpia;
    }

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
}

function normalizarTextoPDF(valor, fallback = "-") {
    const texto = String(valor ?? "").trim();
    if (!texto) return fallback;

    return texto
        .replace(/[–—]/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");
}

function sanitizarNombreArchivo(valor) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

export default function Paciente() {

    const {id_paciente} = useParams();
    const { user } = useUser();
    const empresaNombre = useEmpresaNombre();
    const [detallePaciente, setDetallePaciente] = useState([])
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const formularioEdicionRef = useRef(null);

    function nuevaFichaClinica() {
        router.push(`/dashboard/NuevaFicha/${id_paciente}`);
    }

    function editarPaciente() {
        setMostrarFormulario((prev) => !prev);
    }

    useEffect(() => {
        if (!mostrarFormulario) return;

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = overflowAnterior;
        };
    }, [mostrarFormulario]);


    function verOdontogramas() {
        router.push(`/dashboard/odontogramasPaciente/${id_paciente}`);
    }

    function irACotizaciones() {
        router.push(`/dashboard/cotizacionesPaciente/${id_paciente}`);
    }

    function editarFichaClinica(id_ficha) {
        router.push(`/dashboard/EdicionFicha/${id_ficha}`);
    }

    function agendarPaciente() {
        const paciente = detallePaciente[0];
        if (!paciente) return;
        const params = new URLSearchParams({
            nombre: paciente.nombre || "",
            apellido: paciente.apellido || "",
            rut: paciente.rut || "",
            telefono: paciente.telefono || "",
            email: paciente.correo || "",
        });
        router.push(`/dashboard/calendario?${params.toString()}`);
    }

    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [rut, setRut] = useState("");
    const [nacimiento, setNacimiento] = useState("");
    const [sexo, setSexo] = useState("");
    const [prevision, setPrevision] = useState("");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");
    const [direccion, setDireccion] = useState("");
    const [pais, setPais] = useState("");
    const [observacion1, setObservacion1] = useState("");
    const [apoderado, setApoderado] = useState("");
    const [apoderadoRut, setApoderadoRut] = useState("");
    const [medicamentosUsados, setMedicamentosUsados] = useState("");
    const [habitos, setHabitos] = useState("");
    const [comentariosAdicionales, setComentariosAdicionales] = useState("");

    const [checked, setChecked] = useState(true);

    const [tipoAtencion, setTipoAtencion] = useState("");
    const [motivoConsulta, setMotivoConsulta] = useState("");
    const [signosVitales, setSignosVitales] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [anotacionConsulta, setAnotacionConsulta] = useState("");
    const [anamnesis, setAnamnesis] = useState("");
    const [diagnostico, setDiagnostico] = useState("");
    const [indicaciones, setIndicaciones] = useState("");
    const [archivosAdjuntos, setArchivosAdjuntos] = useState("");
    const [fechaConsulta, setFechaConsulta] = useState("");
    const [estadoFicha, setEstadoFicha] = useState("");
    const [consentimientoFirmado, setConsentimientoFirmado] = useState("");

    const [listaFichas, setListaFichas] = useState([]);
    const [filtroProfesional, setFiltroProfesional] = useState("");
    const [rutProfesionalFirma, setRutProfesionalFirma] = useState("");
    const [especialidadProfesionalFirma, setEspecialidadProfesionalFirma] = useState("");
    const [fichasExpandidas, setFichasExpandidas] = useState(new Set());
    const [ultimaAtencion, setUltimaAtencion] = useState(null);
    const pacienteAtencionRef = useRef(null);
    const primeraExpansionRef = useRef(null);

    function toggleFichaExpandida(id_ficha) {
        setFichasExpandidas(prev => {
            const next = new Set(prev);
            if (next.has(id_ficha)) {
                next.delete(id_ficha);
            } else {
                next.add(id_ficha);
            }
            return next;
        });
    }

    async function cargarUltimaAtencion(rutPaciente, idPacienteConsultado) {
        if (!rutPaciente) {
            if (pacienteAtencionRef.current === idPacienteConsultado) setUltimaAtencion(null);
            return;
        }
        pacienteAtencionRef.current = idPacienteConsultado;
        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarRut`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({rut: rutPaciente}),
                mode: "cors"
            });

            if (pacienteAtencionRef.current !== idPacienteConsultado) return;

            if (!res.ok) {
                setUltimaAtencion(null);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                setUltimaAtencion(null);
                return;
            }

            const atendidas = data
                .filter(r => ["asiste", "finalizado"].includes(String(r.estadoReserva || "").toLowerCase()))
                .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));

            setUltimaAtencion(atendidas[0]?.fechaInicio || null);
        } catch (error) {
            if (pacienteAtencionRef.current === idPacienteConsultado) setUltimaAtencion(null);
        }
    }

    async function eliminarFicha(id_ficha) {
        try {
            if (!id_ficha) {
                return toast.error("Debe seleccionar al menos una ficha clinica");
            }

            const res = await fetch(`${API}/ficha/eliminarFichaClinica`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_ficha}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error("No se puedo eliminar la ficha , contacte a soporte informatico");
            } else {
                const resultadoBackend = await res.json();
                if (resultadoBackend.message === true) {
                    await listarFichasClinicasPaciente(id_paciente)
                    return toast.success("Se ha eliminado la ficha con exito!")
                } else {
                    return toast.error("No se ha podido eliminar la ficha por favor intente mas tarde")
                }
            }
        } catch (error) {
            return toast.error("Ha ocurrido un error contacte a soporte tecnico");
        }
    }

    async function listarFichasClinicasPaciente(id_paciente) {
        try {
            if (!id_paciente) {
                return toast.error("No se ha seleccionado ningun Id, si el problema persiste contcate a soporte de Medify")
            } else {
                const res = await fetch(`${API}/ficha/seleccionarFichasPaciente`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({id_paciente}),
                    mode: "cors"
                })

                if (!res.ok) {
                    return toast.error("Ha ocurrido un error Contacte a soporte de Medify")
                }

                const dataFichasClinicas = await res.json();
                setListaFichas(dataFichasClinicas);
            }
        } catch (e) {
            console.log(e)
            return toast.error("Ha ocurrido un error en el servidor: " + e)
        }
    }

    async function buscarPorProfesional() {
        if (!filtroProfesional.trim()) {
            return toast.error("Ingrese el nombre del profesional para buscar")
        }
        try {
            const res = await fetch(`${API}/ficha/seleccionar_similitud_nombre_profesional`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({observaciones: filtroProfesional.trim()}),
                mode: "cors"
            })

            if (!res.ok) {
                setListaFichas([])
                return toast.error("No se encontraron fichas con ese profesional")
            }

            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
                setListaFichas(data)
                toast.success(`Se encontraron ${data.length} fichas`)
            } else {
                setListaFichas([])
                toast.error("No se encontraron fichas con ese profesional")
            }
        } catch (error) {
            console.log(error)
            toast.error("Error al buscar fichas por profesional")
        }
    }

    function limpiarFiltro() {
        setFiltroProfesional("")
        listarFichasClinicasPaciente(id_paciente)
    }

    function volverAFichas() {
        router.push("/dashboard/FichaClinica");
    }

    function volverAListaTrabajo() {
        router.push("/dashboard");
    }

    async function actualizarDatosPacientes(nombre, apellido, rut, nacimiento, sexo, prevision, telefono, correo, direccion, pais, id_paciente) {

        let prevision_id = null;
        const pacienteBase = detallePaciente[0] || {};
        const nacimientoNormalizado = convertirFechaParaBackend(nacimiento);
        const nombreNormalizado = String(nombre || "").trim();
        const apellidoNormalizado = String(apellido || "").trim();
        const rutNormalizado = String(rut || "").trim();
        const sexoNormalizado = String(sexo || "").trim();
        const telefonoNormalizado = String(telefono || "").trim();
        const correoNormalizado = String(correo || "").trim();
        const direccionNormalizada = String(direccion || "").trim();
        const paisNormalizado = String(pais || "").trim();

        if (prevision.includes("FONASA")) {
            prevision_id = 1;
        } else if (prevision.includes("ISAPRE")) {
            prevision_id = 2;
        } else if (prevision.includes("CONVENIO")) {
            prevision_id = 3;
        } else if (prevision.includes("SIN PREVISION")) {
            prevision_id = 4;
        } else {
            prevision_id = 0;
        }

        try {
            if (
                !nombreNormalizado ||
                !apellidoNormalizado ||
                !rutNormalizado ||
                !nacimientoNormalizado ||
                !sexoNormalizado ||
                !prevision_id ||
                !telefonoNormalizado ||
                !correoNormalizado ||
                !direccionNormalizada ||
                !paisNormalizado ||
                !id_paciente
            ) {
                return toast.error("Debe llenar todos los campos para proceder con la actualziacion")
            }

            const payload = {
                nombre: nombreNormalizado,
                apellido: apellidoNormalizado,
                rut: rutNormalizado,
                nacimiento: nacimientoNormalizado,
                sexo: sexoNormalizado,
                prevision_id,
                telefono: telefonoNormalizado,
                correo: correoNormalizado,
                direccion: direccionNormalizada,
                pais: paisNormalizado,
                observacion1,
                observacion2: pacienteBase.observacion2 ?? "",
                observacion3: pacienteBase.observacion3 ?? "",
                apoderado,
                apoderado_rut: apoderadoRut,
                medicamentosUsados,
                habitos,
                comentariosAdicionales,
                id_paciente
            };

            const res = await fetch(`${API}/pacientes/pacientesActualizar`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                mode: "cors",
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const detalle = await res.json().catch(() => null);
                console.log("Error al actualizar paciente:", detalle, payload);
                return toast.error("No se pudo actualizar el paciente. Revise los datos e intente nuevamente.")
            } else {
                const resultadoQuery = await res.json();
                if (resultadoQuery.message === true) {
                    setNombre("");
                    setApellido("");
                    setNacimiento("");
                    setTelefono("");
                    setCorreo("");
                    setDireccion("");
                    setRut("");
                    setSexo("");
                    setPais("");
                    setObservacion1("");
                    setApoderado("");
                    setApoderadoRut("");
                    setMedicamentosUsados("");
                    setHabitos("");
                    setComentariosAdicionales("");
                    setMostrarFormulario(false);
                    await buscarPacientePorId(id_paciente);
                    return toast.success("Datos del paciente actualizados con Exito!");
                } else {
                    return toast.error("No se han podido Actualizar los datos del paciente. Intente mas tarde.")
                }
            }
        } catch (err) {
            console.log(err);
            return toast.error("Ha ocurrido un problema en el servidor")
        }
    }

    async function buscarPacientePorId(id_paciente) {
        try {
            if (!id_paciente) {
                return toast.error("No se puede cargar los datos del paciente seleccionado. Debe haber seleccionado el paciente para poder ver el detalle de los datos.");
            }
            const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_paciente})
            })

            if (!res.ok) {
                return toast.error("No se puede cargar los datos del paciente seleccionado.");
            }

            const dataPaciente = await res.json();
            setDetallePaciente(Array.isArray(dataPaciente) ? dataPaciente : [dataPaciente]);

        } catch (error) {
            console.log(error);
            return toast.error("No se puede cargar los datos del paciente seleccionado. Por favor contacte a soporte de Medify");
        }
    }

    useEffect(() => {
        if (!id_paciente) return;
        buscarPacientePorId(id_paciente)
        listarFichasClinicasPaciente(id_paciente)
    }, [id_paciente]);

    useEffect(() => {
        if (detallePaciente.length === 0) return;

        const paciente = detallePaciente[0];
        setNombre(paciente.nombre || "");
        setApellido(paciente.apellido || "");
        setRut(paciente.rut || "");
        setNacimiento(paciente.nacimiento || "");
        setSexo(paciente.sexo || "");
        setPrevision(previsionDeterminacion(paciente.prevision_id));
        setTelefono(paciente.telefono || "");
        setCorreo(paciente.correo || "");
        setDireccion(paciente.direccion || "");
        setPais(paciente.pais || "");
        setObservacion1(paciente.observacion1 || "");
        setApoderado(paciente.apoderado || "");
        setApoderadoRut(paciente.apoderado_rut || "");
        setMedicamentosUsados(paciente.medicamentosUsados || "");
        setHabitos(paciente.habitos || "");
        setComentariosAdicionales(paciente.comentariosAdicionales || "");
        cargarUltimaAtencion(paciente.rut, id_paciente);
    }, [detallePaciente]);

    function calcularEdad(fechaNacimiento) {
        if (!fechaNacimiento || esFechaPlaceholder(fechaNacimiento)) return '-';
        const hoy = new Date();
        const partes = String(fechaNacimiento).split('T')[0].split('-');
        const anioNac = parseInt(partes[0], 10);
        const mesNac = parseInt(partes[1], 10);
        const diaNac = parseInt(partes[2], 10);
        if (isNaN(anioNac) || isNaN(mesNac) || isNaN(diaNac)) return '-';
        let edad = hoy.getFullYear() - anioNac;
        const mesActual = hoy.getMonth() + 1;
        if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < diaNac)) {
            edad--;
        }
        return edad;
    }

    function previsionDeterminacion(id_prevision) {
        if (id_prevision === 1) return "FONASA";
        if (id_prevision === 2) return "ISAPRE";
        if (id_prevision === 3) return "CONVENIO";
        if (id_prevision === 4) return "SIN PREVISION";
        return "SIN DEFINIR";
    }

    const pacienteActual = detallePaciente[0];
    const totalFichas = listaFichas.length;

    const listaFichasOrdenada = useMemo(() => {
        return [...listaFichas].sort((a, b) => new Date(b.fechaConsulta) - new Date(a.fechaConsulta));
    }, [listaFichas]);

    const fichasAgrupadasPorMes = useMemo(() => {
        const grupos = [];

        listaFichasOrdenada.forEach((ficha) => {
            const fechaLimpia = String(ficha.fechaConsulta || "").split("T")[0];
            const [anio, mes] = fechaLimpia.split("-").map(Number);
            const fechaValida = Number.isInteger(anio) && Number.isInteger(mes) && mes >= 1 && mes <= 12;
            const clave = fechaValida ? `${anio}-${String(mes).padStart(2, "0")}` : "sin-fecha";
            let grupo = grupos.find((item) => item.clave === clave);

            if (!grupo) {
                const etiqueta = fechaValida
                    ? new Intl.DateTimeFormat("es-CL", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                    }).format(new Date(Date.UTC(anio, mes - 1, 1)))
                    : "Sin fecha";

                grupo = {
                    clave,
                    etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
                    fichas: [],
                };
                grupos.push(grupo);
            }

            grupo.fichas.push(ficha);
        });

        return grupos;
    }, [listaFichasOrdenada]);

    useEffect(() => {
        if (listaFichasOrdenada.length === 0) return;
        // Solo auto-expandir la más reciente una vez por paciente — no en cada
        // recarga de la lista (eliminar, filtrar, limpiar filtro), para no
        // colapsar fichas que el usuario haya expandido a propósito.
        if (primeraExpansionRef.current === id_paciente) return;
        primeraExpansionRef.current = id_paciente;
        setFichasExpandidas(new Set([listaFichasOrdenada[0].id_ficha]));
    }, [listaFichasOrdenada, id_paciente]);

    const dashboardRole = getDashboardRoleFromUser(user);
    const canSeeOdontograma = canAccessOdontograma(dashboardRole);
    const canSeeRecetaMedica = canAccessRecetasEnFicha(dashboardRole);



    function irAReceta(id_paciente) {
        router.push(`/dashboard/recetaPacientes/${id_paciente}`);
    }

    function irADocumentos() {
        router.push(`/dashboard/archivosPacientes/${id_paciente}`);
    }

    function descargarFichaPDF(ficha) {
        if (!pacienteActual) {
            return toast.error("Debe existir un paciente cargado para descargar la ficha.");
        }

        if (!ficha) {
            return toast.error("Debe seleccionar una ficha clinica para descargar.");
        }

        try {
            const doc = new jsPDF("p", "mm", "letter");
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 18;
            const rightX = pageW - margin;
            const anchoContenido = rightX - margin;
            const fechaDescarga = new Date();
            const datos = parsearDatosDinamicos(ficha.datosDinamicos);
            const plantillaNombre = datos?._plantillaNombre;
            const tituloFicha = plantillaNombre || ficha.tipoAtencion || "Consulta General";
            const profesionalFicha = ficha.observaciones || "No informado";

            const dibujarEncabezado = () => {
                doc.setDrawColor(15, 23, 42);
                doc.setLineWidth(0.6);
                doc.line(margin, 18, rightX, 18);

                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.setTextColor(20, 30, 48);
                doc.text(empresaNombre, margin, 27);

                doc.setFont("helvetica", "italic");
                doc.setFontSize(8.5);
                doc.setTextColor(92, 108, 128);
                doc.text("AgendaClínica — Healthcare Information System", margin, 32);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text("Ficha clínica del paciente", margin, 36.5);
                doc.text(`Ficha #${normalizarTextoPDF(ficha.id_ficha)}`, rightX, 27, {align: "right"});
                const horaDescarga = fechaDescarga.toLocaleTimeString("es-CL", {hour: "2-digit", minute: "2-digit"});
                doc.text(`Descarga: ${formatearFecha(fechaDescarga)} ${horaDescarga}`, rightX, 32, {align: "right"});
            };

            const dibujarPie = (data) => {
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.3);
                doc.line(margin, pageH - 18, rightX, pageH - 18);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text(`Generado por AgendaClínica | ${empresaNombre}`, margin, pageH - 12);
                doc.text(`Página ${data.pageNumber}`, rightX, pageH - 12, {align: "right"});
            };

            dibujarEncabezado();

            let y = 47;

            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.35);
            doc.roundedRect(margin, y, anchoContenido, 55, 1.8, 1.8);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            doc.text("Identificación clínica", margin + 4, y + 7);

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.25);
            doc.line(margin + 4, y + 11, rightX - 4, y + 11);

            const escribirDato = (label, value, x, datoY, width = 50) => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7.2);
                doc.setTextColor(100, 116, 139);
                doc.text(label, x, datoY);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9.2);
                doc.setTextColor(15, 23, 42);
                doc.text(doc.splitTextToSize(normalizarTextoPDF(value), width), x, datoY + 5, {lineHeightFactor: 1.25});
            };

            escribirDato("PACIENTE", `${pacienteActual.nombre || ""} ${pacienteActual.apellido || ""}`, margin + 4, y + 18, 58);
            escribirDato("RUT", formatRut(pacienteActual.rut) || pacienteActual.rut || "-", margin + 74, y + 18, 38);
            escribirDato("ID PACIENTE", id_paciente, margin + 130, y + 18, 34);
            escribirDato("PROFESIONAL", profesionalFicha, margin + 4, y + 32, 58);
            escribirDato("FECHA CONSULTA", formatearFecha(ficha.fechaConsulta), margin + 74, y + 32, 38);
            escribirDato("TIPO / PLANTILLA", tituloFicha, margin + 130, y + 32, 58);
            escribirDato("NACIMIENTO", formatearFecha(pacienteActual.nacimiento), margin + 4, y + 46, 50);
            escribirDato("EDAD", calcularEdad(pacienteActual.nacimiento) === "-" ? "-" : `${calcularEdad(pacienteActual.nacimiento)} años`, margin + 74, y + 46, 35);
            escribirDato("PREVISIÓN", previsionDeterminacion(pacienteActual.prevision_id), margin + 130, y + 46, 45);

            y += 64;

            const datosPaciente = [
                ["Teléfono", pacienteActual.telefono],
                ["Correo", pacienteActual.correo],
                ["Dirección", pacienteActual.direccion],
                ["País", pacienteActual.pais],
                ["Sexo", pacienteActual.sexo],
            ].filter(([, value]) => esDatoVisible(value));

            if (datosPaciente.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [["Datos del paciente", "Información"]],
                    body: datosPaciente.map(([label, value]) => [
                        normalizarTextoPDF(label),
                        normalizarTextoPDF(value)
                    ]),
                    margin: {left: margin, right: margin, top: 38, bottom: 24},
                    theme: "plain",
                    headStyles: {
                        fillColor: [51, 65, 85],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                        fontSize: 8,
                        cellPadding: {top: 3.5, bottom: 3.5, left: 4, right: 4},
                    },
                    bodyStyles: {
                        fontSize: 8.8,
                        textColor: [15, 23, 42],
                        cellPadding: {top: 3, bottom: 3, left: 4, right: 4},
                    },
                    columnStyles: {
                        0: {cellWidth: 48, fontStyle: "bold", textColor: [71, 85, 105]},
                        1: {cellWidth: "auto"},
                    },
                    alternateRowStyles: {fillColor: [248, 250, 252]},
                    styles: {
                        lineWidth: 0.15,
                        lineColor: [203, 213, 225],
                        overflow: "linebreak",
                    },
                    didDrawPage: (data) => {
                        if (data.pageNumber > 1) dibujarEncabezado();
                        dibujarPie(data);
                    },
                });
                y = doc.lastAutoTable.finalY + 9;
            }

            const camposLegacy = [
                ["Tipo de atención", ficha.tipoAtencion],
                ["Motivo consulta", ficha.motivoConsulta],
                ["Signos vitales", ficha.signosVitales],
                ["Profesional responsable", ficha.observaciones],
                ["Anotación consulta", ficha.anotacionConsulta],
                ["Anamnesis", ficha.anamnesis],
                ["Diagnóstico", ficha.diagnostico],
                ["Indicaciones", ficha.indicaciones],
                ["Archivos adjuntos", ficha.archivosAdjuntos],
                ["Consentimiento firmado", ficha.consentimientoFirmado],
            ].filter(([, value]) => esDatoVisible(value));

            const filasFicha = [];

            if (datos && plantillaNombre) {
                agruparPorCategoria(datos).forEach((categoria) => {
                    filasFicha.push([
                        normalizarTextoPDF(categoria.nombre),
                        "",
                    ]);
                    categoria.campos
                        .filter((campo) => esDatoVisible(campo.valor))
                        .forEach((campo) => {
                            filasFicha.push([
                                normalizarTextoPDF(campo.nombre),
                                normalizarTextoPDF(campo.valor),
                            ]);
                        });
                });
            }

            camposLegacy.forEach(([label, value]) => {
                filasFicha.push([normalizarTextoPDF(label), normalizarTextoPDF(value)]);
            });

            if (filasFicha.length === 0) {
                filasFicha.push(["Sin datos clínicos registrados", "-"]);
            }

            autoTable(doc, {
                startY: y,
                head: [["Contenido de la ficha", normalizarTextoPDF(tituloFicha)]],
                body: filasFicha,
                margin: {left: margin, right: margin, top: 38, bottom: 24},
                theme: "plain",
                headStyles: {
                    fillColor: [109, 40, 217],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8,
                    cellPadding: {top: 3.5, bottom: 3.5, left: 4, right: 4},
                },
                bodyStyles: {
                    fontSize: 8.8,
                    textColor: [15, 23, 42],
                    cellPadding: {top: 3.2, bottom: 3.2, left: 4, right: 4},
                },
                columnStyles: {
                    0: {cellWidth: 55, fontStyle: "bold", textColor: [71, 85, 105]},
                    1: {cellWidth: "auto"},
                },
                alternateRowStyles: {fillColor: [248, 250, 252]},
                styles: {
                    lineWidth: 0.15,
                    lineColor: [203, 213, 225],
                    overflow: "linebreak",
                },
                didParseCell: (data) => {
                    const row = data.row.raw;
                    if (data.section === "body" && row?.[1] === "") {
                        data.cell.styles.fillColor = [237, 233, 254];
                        data.cell.styles.textColor = [91, 33, 182];
                        data.cell.styles.fontStyle = "bold";
                    }
                },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1) dibujarEncabezado();
                    dibujarPie(data);
                },
            });

            const rutProfesionalVisible = esDatoVisible(rutProfesionalFirma);
            const especialidadProfesionalVisible = esDatoVisible(especialidadProfesionalFirma);
            const altoFirma = 21 + (rutProfesionalVisible ? 5 : 0) + (especialidadProfesionalVisible ? 5 : 0);

            let firmaY = doc.lastAutoTable.finalY + 14;
            if (firmaY + altoFirma > pageH - 24) {
                doc.addPage();
                dibujarEncabezado();
                firmaY = 48 + 14;
                dibujarPie({pageNumber: doc.internal.getNumberOfPages()});
            }

            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.35);
            doc.line(rightX - 62, firmaY, rightX, firmaY);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(profesionalFicha, rightX, firmaY + 6, {align: "right"});

            let offsetFirma = 6;
            doc.setFontSize(8);
            if (rutProfesionalVisible) {
                offsetFirma += 5;
                doc.text(`RUT: ${rutProfesionalFirma.trim()}`, rightX, firmaY + offsetFirma, {align: "right"});
            }
            if (especialidadProfesionalVisible) {
                offsetFirma += 5;
                doc.text(especialidadProfesionalFirma.trim(), rightX, firmaY + offsetFirma, {align: "right"});
            }

            offsetFirma += 5;
            doc.setFontSize(9);
            doc.text("Firma y timbre profesional", rightX, firmaY + offsetFirma, {align: "right"});

            offsetFirma += 5;
            doc.setTextColor(148, 163, 184);
            doc.text(empresaNombre, rightX, firmaY + offsetFirma, {align: "right"});

            const rutPacienteArchivo = sanitizarNombreArchivo(pacienteActual.rut || id_paciente || "paciente");
            doc.save(`ficha_clinica_${rutPacienteArchivo || "paciente"}_${ficha.id_ficha}.pdf`);
            toast.success("PDF de ficha generado correctamente.");
        } catch (error) {
            console.log(error);
            return toast.error("No fue posible generar la ficha en PDF.");
        }
    }



    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header Principal ── */}
                <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Carpeta Clínica: <span className="text-[#6E56CF]">{pacienteActual ? `${pacienteActual.nombre} ${pacienteActual.apellido}` : "Paciente"}</span>
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="h-14 px-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">RUT</span>
                            <span className="text-sm font-bold text-slate-900 mt-1 leading-none font-mono">{formatRut(pacienteActual?.rut) || "-"}</span>
                        </div>
                        <div className="h-14 px-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registros</span>
                            <span className="text-sm font-bold text-slate-900 mt-1 leading-none">{totalFichas} Fichas</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => volverAFichas()}
                                className="h-14 px-5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => volverAListaTrabajo()}
                                className="h-14 px-6 rounded-2xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2"
                            >
                                Reservaciones
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Perfil del Paciente ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
                    
                    {/* Tarjeta de Datos Personales (4 slots) */}
                    <div className="xl:col-span-4">
                        {pacienteActual && (
                            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/30 px-5 py-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#6E56CF] text-base font-bold text-white shadow-lg shadow-indigo-100">
                                        {pacienteActual.nombre?.charAt(0)}{pacienteActual.apellido?.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-[14px] font-bold leading-tight text-slate-900">{pacienteActual.nombre} {pacienteActual.apellido}</h2>
                                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">ID Paciente #{id_paciente}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 px-5 py-4">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nacimiento</span>
                                            <p className="text-[12px] font-semibold text-slate-700">{formatearFecha(pacienteActual.nacimiento)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Edad</span>
                                            <p className="text-[12px] font-semibold text-slate-700">{calcularEdad(pacienteActual.nacimiento)} años</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Previsión</span>
                                            <p className="text-[12px] font-semibold text-slate-700">{previsionDeterminacion(pacienteActual.prevision_id)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sexo</span>
                                            <p className="text-[12px] font-semibold text-slate-700">{pacienteActual.sexo || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
                                        <div className="min-w-0 space-y-1">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Dirección</span>
                                            <p className="break-words text-[11px] font-semibold leading-snug text-slate-700">{pacienteActual.direccion || "Por completar"}</p>
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nacionalidad</span>
                                            <p className="break-words text-[11px] font-semibold leading-snug text-slate-700">{pacienteActual.pais || "Por completar"}</p>
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Apoderado</span>
                                            <p className="break-words text-[11px] font-semibold leading-snug text-slate-700">{pacienteActual.apoderado || "No especificado"}</p>
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">RUT. Apod.</span>
                                            <p className="break-words font-mono text-[11px] font-semibold leading-snug text-slate-700">{formatRut(pacienteActual.apoderado_rut) || pacienteActual.apoderado_rut || "No especificado"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2">
                                        <span className="text-[9px] font-bold text-[#6E56CF] uppercase tracking-widest">Última atención</span>
                                        <span className="text-[12px] font-bold text-slate-700">
                                            {ultimaAtencion ? formatearFecha(ultimaAtencion) : "Sin registro"}
                                        </span>
                                    </div>
                                    <div className="space-y-2.5 border-t border-slate-100 pt-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <span className="text-[12px] text-slate-600">{pacienteActual.telefono || "No registrado"}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <span className="text-[12px] text-slate-600 break-all">{pacienteActual.correo || "No registrado"}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button
                                            onClick={editarPaciente}
                                            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[11px] font-bold text-white transition-all hover:bg-slate-800"
                                        >
                                            Editar Información de Ingreso
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Contenido Principal (8 slots) ── */}
                    <div className="xl:col-span-8 space-y-5">
                        
                        {/* Acciones Rápidas */}
                        <div data-tour="ficha-acciones-rapidas" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <button onClick={() => nuevaFichaClinica(id_paciente)} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151A2D] text-white transition-colors duration-200 group-hover:bg-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </span>
                                <span className="text-[13px] font-semibold text-slate-800">Ficha</span>
                            </button>
                            <button onClick={agendarPaciente} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151A2D] text-white transition-colors duration-200 group-hover:bg-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </span>
                                <span className="text-[13px] font-semibold text-slate-800">Agendar</span>
                            </button>
                            {canSeeOdontograma && (
                                <button onClick={verOdontogramas} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151A2D] text-white transition-colors duration-200 group-hover:bg-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75h4.5m-4.5 4.5h4.5M7.5 3.75h9A2.25 2.25 0 0118.75 6v12A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V6A2.25 2.25 0 017.5 3.75z" /></svg>
                                    </span>
                                    <span className="text-[13px] font-semibold text-slate-800">Odontograma</span>
                                </button>
                            )}
                            {canSeeRecetaMedica && (
                                <button onClick={() => irAReceta(id_paciente)} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151A2D] text-white transition-colors duration-200 group-hover:bg-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                                    </span>
                                    <span className="text-[13px] font-semibold text-slate-800">Recetas</span>
                                </button>
                            )}
                            <button type="button" onClick={irACotizaciones} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151A2D] text-white transition-colors duration-200 group-hover:bg-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" /></svg>
                                </span>
                                <span className="text-[13px] font-semibold text-slate-800">Cotizaciones</span>
                            </button>
                            <button onClick={irADocumentos} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151A2D] text-white transition-colors duration-200 group-hover:bg-[#6E56CF]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                </span>
                                <span className="text-[13px] font-semibold text-slate-800">Documentos</span>
                            </button>
                        </div>

                        {pacienteActual && (
                            <details className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300">
                                <summary className="relative flex min-h-[88px] cursor-pointer list-none items-center gap-4 overflow-hidden px-5 py-4 transition-colors duration-300 hover:bg-white/80 [&::-webkit-details-marker]:hidden">
                                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-[#151A2D] text-white shadow-[0_12px_24px_-14px_rgba(15,23,42,0.8)] transition-colors duration-300 group-open:border-[#6E56CF] group-open:bg-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="relative min-w-0 flex-1">
                                        <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em] text-slate-900">Información de ingreso</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            editarPaciente();
                                        }}
                                        aria-label="Editar información de ingreso"
                                        title="Editar información de ingreso"
                                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 113 2.97L8.33 18.99l-4.33 1.36 1.36-4.33L16.862 4.487z" />
                                        </svg>
                                    </button>
                                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-300 group-open:rotate-180 group-open:border-violet-200 group-open:bg-violet-50 group-open:text-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </summary>
                                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-2">
                                    <div className="min-w-0 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6E56CF]">Antecedentes</p>
                                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-snug text-slate-700">{pacienteActual.observacion1 || "Sin antecedentes registrados"}</p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Medicamentos</p>
                                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-snug text-slate-700">{pacienteActual.medicamentosUsados || "Sin información"}</p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Hábitos</p>
                                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-snug text-slate-700">{pacienteActual.habitos || "Sin información"}</p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Comentarios</p>
                                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-snug text-slate-700">{pacienteActual.comentariosAdicionales || "Sin información"}</p>
                                    </div>
                                </div>
                            </details>
                        )}

                        {/* Formulario de Edición (Cerrable) */}
                        {mostrarFormulario && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm sm:p-6">
                                <div ref={formularioEdicionRef} role="dialog" aria-modal="true" aria-label="Editar información de ingreso" className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-2xl shadow-slate-950/25 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex shrink-0 items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-white px-5 py-3 sm:px-6">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E56CF]">Paciente</p>
                                        <h3 className="mt-0.5 text-sm font-bold text-slate-900">Editar Información de Ingreso</h3>
                                    </div>
                                    <button onClick={() => setMostrarFormulario(false)} aria-label="Cerrar edición" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-3 sm:p-4 [&_input]:h-9">
                                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-white p-3 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                            <ShadcnInput value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                            <ShadcnInput value={apellido} onChange={(e) => setApellido(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RUT</label>
                                            <ShadcnInput value={rut} onChange={(e) => setRut(e.target.value.replace(/[^0-9kK]/g, "").toUpperCase())} className="h-11 rounded-xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de nacimiento</label>
                                            <div className="w-full [&_button]:h-9 [&_button]:w-full [&_button]:justify-between [&_button]:rounded-xl [&_button]:border-slate-200 [&_button]:bg-white [&_button]:text-sm [&_label]:hidden">
                                                <ShadcnDatePicker
                                                    label="Fecha de nacimiento"
                                                    value={nacimiento}
                                                    onChange={(fecha) => setNacimiento(fecha)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
                                            <ShadcnInput value={sexo} onChange={(e) => setSexo(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previsión</label>
                                            <div className="w-full [&_button]:h-9 [&_button]:rounded-xl [&_button]:border-slate-200 [&_button]:bg-white [&_button]:text-sm">
                                                <ShadcnSelect
                                                    nombreDefault={prevision || "Seleccionar..."}
                                                    value1={"FONASA"} value2={"ISAPRE"} value3={"CONVENIO"} value4={"SIN PREVISION"}
                                                    onChange={(v) => setPrevision(v)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                            <ShadcnInput value={telefono} onChange={(e) => setTelefono(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-xl border border-violet-100 bg-white p-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E56CF]">Ficha de ingreso</p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-800">Información complementaria</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Dirección</label>
                                                <ShadcnInput value={direccion} onChange={(e) => setDireccion(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">País</label>
                                                <ShadcnInput value={pais} onChange={(e) => setPais(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Apoderado</label>
                                                <ShadcnInput value={apoderado} onChange={(e) => setApoderado(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">RUT del apoderado</label>
                                                <ShadcnInput value={apoderadoRut} onChange={(e) => setApoderadoRut(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Antecedentes</label>
                                                <textarea value={observacion1} onChange={(e) => setObservacion1(e.target.value)} placeholder="Antecedentes médicos relevantes del paciente..." className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Medicamentos</label>
                                                <textarea value={medicamentosUsados} onChange={(e) => setMedicamentosUsados(e.target.value)} placeholder="Medicamentos que utiliza actualmente..." className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Hábitos</label>
                                                <textarea value={habitos} onChange={(e) => setHabitos(e.target.value)} placeholder="Hábitos alimenticios, actividad física, consumo de alcohol o tabaco..." className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-50" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Comentarios</label>
                                                <textarea value={comentariosAdicionales} onChange={(e) => setComentariosAdicionales(e.target.value)} placeholder="Observaciones adicionales..." className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/95 px-4 py-2.5 sm:px-5">
                                    <button onClick={() => setMostrarFormulario(false)} className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50">Cancelar</button>
                                    <button onClick={() => actualizarDatosPacientes(nombre, apellido, rut, nacimiento, sexo, prevision, telefono, correo, direccion, pais, id_paciente)} className="h-9 rounded-lg bg-[#6E56CF] px-5 text-xs font-bold text-white shadow-md shadow-violet-200 transition-colors hover:bg-[#5b45bc]">Guardar Cambios</button>
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Listado de Fichas */}
                        <div className="space-y-6">
                            
                            {/* Filtros y firma PDF */}
                            <details className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300">
                                <summary className="relative flex min-h-[88px] cursor-pointer list-none items-center justify-between gap-4 overflow-hidden px-5 py-4 transition-colors duration-300 hover:bg-white/80 [&::-webkit-details-marker]:hidden">
                                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-[#151A2D] text-white shadow-[0_12px_24px_-14px_rgba(15,23,42,0.8)] transition-colors duration-300 group-open:border-[#6E56CF] group-open:bg-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                                        </svg>
                                    </div>
                                    <div className="relative min-w-0 flex-1">
                                        <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em] text-slate-900">Filtros</h3>
                                    </div>
                                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-300 group-open:rotate-180 group-open:border-violet-200 group-open:bg-violet-50 group-open:text-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </summary>
                                <div className="space-y-3 border-t border-slate-100 p-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-800">Buscar fichas por profesional</p>
                                        <p className="mt-0.5 text-[12px] text-slate-500">Escribe un nombre y presiona Buscar.</p>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="relative min-w-0 flex-1">
                                            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={filtroProfesional}
                                                onChange={(e) => setFiltroProfesional(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && buscarPorProfesional()}
                                                placeholder="Ej: Dra. María González"
                                                className="h-11 w-full rounded-xl border-none bg-slate-50 pl-11 pr-4 text-sm transition-all focus:ring-2 focus:ring-violet-100"
                                            />
                                        </div>
                                        <button onClick={buscarPorProfesional} className="h-11 rounded-xl bg-slate-900 px-6 text-[13px] font-bold text-white transition-all hover:bg-slate-800">Buscar</button>
                                        {filtroProfesional && <button onClick={limpiarFiltro} className="h-11 rounded-xl bg-slate-100 px-5 text-[13px] font-bold text-slate-600 hover:bg-slate-200">Limpiar</button>}
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">RUT del profesional</label>
                                    <input
                                        type="text"
                                        value={rutProfesionalFirma}
                                        onChange={(e) => setRutProfesionalFirma(e.target.value)}
                                        placeholder="Ej: 12.345.678-9"
                                        className="mt-1 h-11 w-full bg-slate-50 border-none rounded-2xl px-4 text-sm focus:ring-2 focus:ring-violet-100 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Especialidad profesional</label>
                                    <input
                                        type="text"
                                        value={especialidadProfesionalFirma}
                                        onChange={(e) => setEspecialidadProfesionalFirma(e.target.value)}
                                        placeholder="Ej: Médico Cirujano"
                                        className="mt-1 h-11 w-full bg-slate-50 border-none rounded-2xl px-4 text-sm focus:ring-2 focus:ring-violet-100 transition-all"
                                    />
                                </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>

                        <div className="xl:col-span-12">
                            <div className="mb-5 grid grid-cols-1 xl:grid-cols-12 xl:gap-8">
                                <div data-tour="ficha-registros" className="flex items-center gap-3 xl:col-start-5 xl:col-span-8">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-[#6E56CF]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h7l3 3v13H7V4z" />
                                        </svg>
                                    </span>
                                    <h2 className="whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] text-slate-700">Registros clínicos</h2>
                                    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                                </div>
                            </div>
                            {/* Fichas Propiamente Tales */}
                            {listaFichas.length === 0 ? (
                                <div className="bg-white rounded-[32px] border border-dashed border-slate-200 py-24 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">No se han encontrado registros clínicos.</p>
                                </div>
                            ) : (
                                <div className="space-y-7">
                                    {fichasAgrupadasPorMes.map((grupo, indiceGrupo) => (
                                    <section
                                        key={grupo.clave}
                                        className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-8"
                                    >
                                        <div className="relative z-30 flex items-center gap-2.5 xl:col-span-4 xl:block xl:pt-3 xl:pr-10 xl:text-right">
                                            <span className="inline-flex items-center whitespace-nowrap rounded-xl border border-violet-100 bg-white/90 px-2.5 py-1 text-[9px] font-bold tracking-[0.04em] text-violet-600 shadow-[0_8px_20px_-16px_rgba(109,40,217,0.55)]">
                                                {grupo.etiqueta}
                                            </span>
                                            <p className="text-[9px] font-medium text-slate-400 xl:mt-1.5">
                                                {grupo.fichas.length} {grupo.fichas.length === 1 ? "registro" : "registros"}
                                            </p>
                                            <span
                                                aria-hidden="true"
                                                className={`absolute -right-[17px] top-0 hidden border-l-2 border-dashed border-violet-200 xl:block ${indiceGrupo === fichasAgrupadasPorMes.length - 1 ? "bottom-0" : "-bottom-7"}`}
                                            />
                                            <span
                                                aria-hidden="true"
                                                className={`absolute -right-[25px] top-5 z-30 hidden h-4 w-4 rounded-full border-4 border-white shadow-[0_0_0_2px_rgba(139,92,246,0.28)] xl:block ${indiceGrupo === 0 ? "bg-[#6E56CF]" : "bg-violet-300"}`}
                                            />
                                        </div>

                                        <div className="space-y-4 xl:col-span-8">
                                    {grupo.fichas.map((ficha) => {
                                        const expandida = fichasExpandidas.has(ficha.id_ficha);
                                        const esMasReciente = ficha.id_ficha === listaFichasOrdenada[0]?.id_ficha;
                                        return (
                                        <div key={ficha.id_ficha} className="relative z-10">
                                        <div className="group/ficha relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-300">
                                            <div className="relative flex flex-col gap-3 overflow-hidden border-b border-slate-100 px-5 py-3.5 xl:flex-row xl:items-center xl:justify-between">
                                                <div className="relative z-10 flex min-w-0 items-center gap-3.5">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-teal-700">Prof. {ficha.observaciones || "No informado"}</p>
                                                            {esMasReciente && (
                                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm">Más reciente</span>
                                                            )}
                                                        </div>
                                                        <h4 className="mt-1 truncate text-[16px] font-extrabold tracking-[-0.02em] text-slate-900">
                                                            {parsearDatosDinamicos(ficha.datosDinamicos)?._plantillaNombre || ficha.tipoAtencion || "Consulta General"}
                                                        </h4>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2.5">
                                                            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {formatearFecha(ficha.fechaConsulta)}
                                                            </p>
                                                            <span className="inline-flex h-6 items-center rounded-lg border border-violet-100 bg-violet-50/80 px-2 text-[9px] font-bold text-[#6E56CF]">
                                                                N° Registro {ficha.id_ficha}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 flex flex-wrap items-center gap-2 xl:justify-end">
                                                    <button onClick={() => toggleFichaExpandida(ficha.id_ficha)} className="h-10 rounded-xl border border-slate-800 bg-[#151A2D] px-4 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6E56CF] hover:bg-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
                                                        {expandida ? "Ocultar" : "Ver detalle"}
                                                    </button>
                                                    <button onClick={() => descargarFichaPDF(ficha)} className="h-10 rounded-xl border border-violet-200 bg-violet-50 px-4 text-[11px] font-bold text-[#6E56CF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">PDF</button>
                                                    <button onClick={() => editarFichaClinica(ficha.id_ficha)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">Editar</button>
                                                </div>
                                            </div>
                                            {expandida && (
                                            <div className="bg-slate-50/30 p-5 sm:p-6">
                                                {(() => {
                                                    const datos = parsearDatosDinamicos(ficha.datosDinamicos)
                                                    if (datos && datos._plantillaNombre) {
                                                        const categorias = agruparPorCategoria(datos)
                                                        return (
                                                            <div className="space-y-6">
                                                                {categorias.map(cat => (
                                                                    <div key={cat.nombre} className="space-y-3.5">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="h-2 w-2 rounded-full bg-[#6E56CF] shadow-[0_0_0_4px_rgba(110,86,207,0.1)]" />
                                                                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E56CF]">{cat.nombre}</span>
                                                                            <div className="h-px flex-1 bg-gradient-to-r from-violet-200 via-slate-200 to-transparent"></div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                            {cat.campos.map((campo, idx) => (
                                                                                <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300">
                                                                                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{campo.nombre}</span>
                                                                                    <p className="mt-2 whitespace-pre-wrap text-[13px] font-semibold leading-relaxed text-slate-700">{campo.valor || "-"}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    }
                                                    return <p className="text-sm text-slate-400 italic text-center py-4">No hay datos estructurados en esta ficha.</p>
                                                })()}
                                            </div>
                                            )}
                                        </div>
                                        </div>
                                        );
                                    })}
                                        </div>
                                    </section>
                                    ))}
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </div>
    )
}
