
'use client'
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {toast} from "react-hot-toast";
import jsPDF from "jspdf";
import ToasterClient from "@/Componentes/ToasterClient";
import formatearFecha from "@/FuncionesTranversales/funcionesTranversales";
import {InfoButton} from "@/Componentes/InfoButton";
import ShadcnInput from "@/Componentes/shadcnInput2";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { formatRut } from "@/lib/designTokens";

export default function ReecetasPacientes() {

    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL;
    const PDF_BRAND_TITLE = "AgendaClínica";
    const PDF_BRAND_SUBTITLE = "Healthcare Information System";

    const [detallePaciente, setDetallePaciente] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [uiOnlyProfesionalSeleccionado, setUiOnlyProfesionalSeleccionado] = useState("");


    const [listaProfesionales, setListaProfesionales] = useState([]);

    const {id_paciente} = useParams();
    const[nombre_paciente, setNombre_paciente] = useState("");
    const[apellido_paciente, setApellido_paciente] = useState("");
    const[rut_paciente, setRut_paciente] = useState("");
    const[id_profesional, setId_profesional] = useState(null);
    const[profesional_responsable, setProfesional_responsable] = useState("");
    const[rut_profesional_manual, setRut_profesional_manual] = useState("");
    const[descripcion_receta, setDescripcion_receta] = useState("");
    const[diagnostico_pdf, setDiagnostico_pdf] = useState("");

    const [listaRecetasPaciente, setListaRecetasPaciente] = useState([]);
    const[id_receta, setId_receta] = useState(null);


    const [id_profesional_filtro, setId_profesional_filtro] = useState("todas");



    async function buscarPacientePorId(idPaciente) {
        try {
            if (!idPaciente) {
                return toast.error("No se puede cargar el paciente seleccionado.");
            }

            setCargando(true);

            const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_paciente: idPaciente})
            });

            if (!res.ok) {
                return toast.error("No se pudo cargar la información del paciente.");
            }

            const dataPaciente = await res.json();
            if (Array.isArray(dataPaciente)&&dataPaciente.length > 0) {
                setDetallePaciente(dataPaciente);
                setNombre_paciente(dataPaciente[0].nombre);
                setApellido_paciente(dataPaciente[0].apellido);
                setRut_paciente(dataPaciente[0].rut);
            }else{
                setDetallePaciente([]);
                setNombre_paciente("");
                setApellido_paciente("");
                setRut_paciente("");
            }

        } catch (error) {
            console.log(error);
            return toast.error("Ha ocurrido un problema al obtener los datos del paciente.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        if (!id_paciente) return;
        buscarPacientePorId(id_paciente);
    }, [id_paciente]);

    function calcularEdad(fechaNacimiento) {
        if (!fechaNacimiento) return "-";
        const hoy = new Date();
        const partes = String(fechaNacimiento).split('T')[0].split('-');
        const anioNac = parseInt(partes[0], 10);
        const mesNac = parseInt(partes[1], 10);
        const diaNac = parseInt(partes[2], 10);
        if (isNaN(anioNac) || isNaN(mesNac) || isNaN(diaNac)) return "-";
        let edad = hoy.getFullYear() - anioNac;
        const mesActual = hoy.getMonth() + 1;
        if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < diaNac)) {
            edad--;
        }
        return edad;
    }

    function previsionDeterminacion(id_prevision) {
        if (id_prevision === 1) return "NO APLICA";
        if (id_prevision === 2) return "ISAPRE";
        return "SIN DEFINIR";
    }

    function volverAFichas() {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    const paciente = detallePaciente[0];
    const profesionalSeleccionado = listaProfesionales.find(
        (profesional) => String(profesional.id_profesional) === String(uiOnlyProfesionalSeleccionado || id_profesional || "")
    );

    function normalizarTextoPDF(valor, fallback = "-") {
        return String(valor ?? "").trim() || fallback;
    }

    function formatearFechaDocumento(fecha = new Date()) {
        return fecha.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function formatearFechaHoraDocumento(fecha = new Date()) {
        const hora = fecha.toLocaleTimeString("es-CL", {hour: "2-digit", minute: "2-digit"});
        return `${formatearFechaDocumento(fecha)} ${hora}`;
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

    function generarPDFReceta() {
        if (!paciente) {
            return toast.error("Debe existir un paciente cargado para generar la receta.");
        }

        if (!profesional_responsable.trim()) {
            return toast.error("Debe seleccionar un profesional para generar la receta.");
        }

        if (!descripcion_receta.trim()) {
            return toast.error("Debe ingresar la descripción de la receta para generar el PDF.");
        }

        const doc = new jsPDF("p", "mm", "letter");
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 18;
        const rightX = pageW - margin;
        const anchoContenido = rightX - margin;
        const fechaEmision = new Date();
        const rutPacienteArchivo = sanitizarNombreArchivo(rut_paciente || paciente?.rut || id_paciente || "paciente");
        const nombreProfesionalPDF = normalizarTextoPDF(profesional_responsable);
        const especialidadProfesionalPDF = normalizarTextoPDF(
            profesionalSeleccionado?.descripcionProfesional || profesionalSeleccionado?.especialidad,
            "Profesional tratante"
        );
        const rutProfesionalPDF = normalizarTextoPDF(
            rut_profesional_manual || profesionalSeleccionado?.rutProfesional || profesionalSeleccionado?.rut_profesional
        );
        const diagnosticoPDF = diagnostico_pdf.trim();

        try {
            const footerY = pageH - 12;
            const limiteContenidoY = pageH - 34;
            const lineHeight = 6.6;

            const dibujarEncabezado = () => {
                doc.setDrawColor(15, 23, 42);
                doc.setLineWidth(0.6);
                doc.line(margin, 18, rightX, 18);

                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.setTextColor(20, 30, 48);
                doc.text(PDF_BRAND_TITLE, margin, 27);

                doc.setFont("helvetica", "italic");
                doc.setFontSize(8.5);
                doc.setTextColor(92, 108, 128);
                doc.text(PDF_BRAND_SUBTITLE, margin, 32);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text("Medical prescription", margin, 36.5);
                doc.text(`Issue date: ${formatearFechaHoraDocumento(fechaEmision)}`, rightX, 27, {align: "right"});
                doc.text("Clinical document", rightX, 32, {align: "right"});
            };

            const dibujarPie = () => {
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.3);
                doc.line(margin, footerY - 6, rightX, footerY - 6);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text("Generated by AgendaClínica | Healthcare Information System", margin, footerY - 1);
                doc.text(`Patient: ${normalizarTextoPDF(rut_paciente)}`, rightX, footerY - 1, {align: "right"});
            };

            dibujarEncabezado();

            let y = 51;

            const altoBoxClinico = diagnosticoPDF ? 67 : 54;

            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.35);
            doc.roundedRect(margin, y, anchoContenido, altoBoxClinico, 1.8, 1.8);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            doc.text("Identificación clínica", margin + 4, y + 7);

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.25);
            doc.line(margin + 4, y + 11, rightX - 4, y + 11);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.2);
            doc.setTextColor(100, 116, 139);
            doc.text("PACIENTE", margin + 4, y + 18);
            doc.text("RUT PACIENTE", margin + 74, y + 18);
            doc.text("PROFESIONAL", margin + 4, y + 31);
            doc.text("RUT PROFESIONAL", margin + 74, y + 31);
            doc.text("ESPECIALIDAD / CARGO", margin + 130, y + 31);
            doc.text("NACIMIENTO", margin + 4, y + 44);
            doc.text("EDAD", margin + 74, y + 44);
            doc.text("PREVISIÓN", margin + 130, y + 44);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.4);
            doc.setTextColor(15, 23, 42);
            doc.text(normalizarTextoPDF(`${nombre_paciente} ${apellido_paciente}`), margin + 4, y + 23);
            doc.text(normalizarTextoPDF(rut_paciente), margin + 74, y + 23);
            doc.text(nombreProfesionalPDF, margin + 4, y + 36);
            doc.text(rutProfesionalPDF, margin + 74, y + 36);
            doc.text(doc.splitTextToSize(especialidadProfesionalPDF, 58), margin + 130, y + 36, {lineHeightFactor: 1.3});
            doc.text(normalizarTextoPDF(formatearFecha(paciente?.nacimiento)), margin + 4, y + 49);
            doc.text(`${calcularEdad(paciente?.nacimiento)} años`, margin + 74, y + 49);
            doc.text(normalizarTextoPDF(previsionDeterminacion(paciente?.prevision_id)), margin + 130, y + 49);

            if (diagnosticoPDF) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7.2);
                doc.setTextColor(100, 116, 139);
                doc.text("DIAGNÓSTICO", margin + 4, y + 57);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9.4);
                doc.setTextColor(15, 23, 42);
                doc.text(doc.splitTextToSize(diagnosticoPDF, anchoContenido - 12), margin + 4, y + 62);
            }

            y += altoBoxClinico + 7;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text("Indicaciones médicas", margin, y);

            y += 6;

            const lineasReceta = doc.splitTextToSize(descripcion_receta.trim(), anchoContenido - 10);
            let indiceLinea = 0;
            let primeraPaginaTexto = true;

            while (indiceLinea < lineasReceta.length) {
                const alturaDisponible = limiteContenidoY - y;
                const lineasPorPagina = Math.max(1, Math.floor((alturaDisponible - 10) / lineHeight));
                const bloque = lineasReceta.slice(indiceLinea, indiceLinea + lineasPorPagina);
                const altoBloque = Math.max(20, (bloque.length * lineHeight) + 8);

                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.35);
                doc.roundedRect(margin, y, anchoContenido, altoBloque, 1.8, 1.8);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(15, 23, 42);
                doc.text(bloque, margin + 5, y + 6, {
                    maxWidth: anchoContenido - 10,
                    lineHeightFactor: 1.5
                });

                indiceLinea += bloque.length;
                y += altoBloque + 10;

                if (indiceLinea < lineasReceta.length) {
                    dibujarPie();
                    doc.addPage();
                    dibujarEncabezado();
                    y = 48;

                    if (primeraPaginaTexto) {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(9);
                        doc.setTextColor(15, 23, 42);
                        doc.text("Indicaciones médicas (continuación)", margin, y);
                        y += 6;
                        primeraPaginaTexto = false;
                    } else {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(9);
                        doc.setTextColor(15, 23, 42);
                        doc.text("Continuación de receta", margin, y);
                        y += 6;
                    }
                }
            }

            if (y + 24 > limiteContenidoY) {
                dibujarPie();
                doc.addPage();
                dibujarEncabezado();
                y = 48;
            }

            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.35);
            doc.line(rightX - 62, y + 10, rightX, y + 10);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(nombreProfesionalPDF, rightX, y + 16, {align: "right"});
            doc.text(especialidadProfesionalPDF, rightX, y + 21, {align: "right"});
            doc.text("Firma y timbre profesional", rightX, y + 26, {align: "right"});

            dibujarPie();

            doc.save(`receta_medica_${rutPacienteArchivo || "paciente"}.pdf`);
            toast.success("PDF de receta generado correctamente.");
        } catch (error) {
            console.log(error);
            return toast.error("No fue posible generar la receta en PDF.");
        }
    }



    async function insertarFichasPaciente(
        nombre_paciente,
        apellido_paciente,
        rut_paciente,
        id_paciente,
        id_profesional,
        profesional_responsable,
        descripcion_receta
    ) {
        try {

            if (!nombre_paciente || !apellido_paciente ||  !rut_paciente ||  !id_paciente ||  !id_profesional || !profesional_responsable || !descripcion_receta) {
                return toast.error("Debe ingresar todos los datos!");
            }

            const res = await fetch(`${API}/recetas/insertarRecetaPaciente`,{
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    nombre_paciente,
                    apellido_paciente,
                    rut_paciente,
                    id_paciente,
                    id_profesional,
                    profesional_responsable,
                    descripcion_receta
                }),
                mode: "cors",
            })

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await seleccionarRecetasPaciente(id_paciente);
                return toast.success(`Se ha ingresado receta correctamente`);
            }else if (respuestaBackend.message.includes(`sindato`)){
                return toast.error('No se ha enviado toda la informacion al servidor')
            }else if (respuestaBackend.message === false){
                return toast.error('Sin respuesta correcta del servidor')
            }else{
                return toast.error(`Ha ocurrido un error, por favor contacte a soporte`);
            }
        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }


    async function listarProfesionales() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`,{
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            });

            const respuestaBackend = await res.json();
            if(Array.isArray(respuestaBackend)&&respuestaBackend.length>0) {
                setListaProfesionales(respuestaBackend);
            }

        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }

    useEffect(() => {
        listarProfesionales()
    },[])



    async function seleccionarRecetasPaciente(
        id_paciente
    ) {
        try {

            const res = await fetch(`${API}/recetas/seleccionar_todas_Recetas_especificas_pacientes`,{
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    id_paciente
                }),
                mode: "cors",
            })

            const respuestaBackend = await res.json();
            if (Array.isArray(respuestaBackend)) {
                setListaRecetasPaciente(respuestaBackend);
            }
        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }


    useEffect(() => {
        seleccionarRecetasPaciente(id_paciente)
    },[id_paciente])




    async function seleccionarRecetaEspecifica(
        id_receta
    ) {
        try {


            const res = await fetch(`${API}/recetas/seleccionarRecetaPaciente`,{
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    id_receta
                }),
                mode: "cors",
            })

            const respuestaBackend = await res.json();
            if (Array.isArray(respuestaBackend)&&respuestaBackend.length>0) {
                setNombre_paciente(respuestaBackend[0].nombre_paciente);
                setApellido_paciente(respuestaBackend[0].apellido_paciente);
                setRut_paciente(respuestaBackend[0].rut_paciente);
                setId_profesional(respuestaBackend[0].id_profesional);
                setUiOnlyProfesionalSeleccionado(String(respuestaBackend[0].id_profesional));
                setProfesional_responsable(respuestaBackend[0].profesional_responsable);
                setDescripcion_receta(respuestaBackend[0].descripcion_receta);
                setId_receta(respuestaBackend[0].id_receta);
                return toast.success(`Receta seleccionada para edicion!`);
            }else{
                return toast.error(`No se ha podido seleccionar recete para edicion`);
            }
        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }



    async function eliminarReceta(
        id_receta
    ) {
        try {

            if (!id_receta) {
                return toast.error("Debe seleccionar al menos una receta para eliminar.");
            }

            const res = await fetch(`${API}/recetas/eliminarRecetaPaciente`,{
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    id_receta
                }),
                mode: "cors",
            })

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await limpiarFormulario();
            }else{
                return toast.error(`No se ha podido eliminar receta, contacte a soporte`);
            }
        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }

    function formatearFechaHora(fechaIso) {
        if (!fechaIso) return "-";

        const fecha = new Date(fechaIso);

        const dia = String(fecha.getDate()).padStart(2, "0");
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    }

    async function limpiarFormulario() {
        setId_profesional(null);
        setId_receta(null);
        setProfesional_responsable("");
        setRut_profesional_manual("");
        setDescripcion_receta("");
        setDiagnostico_pdf("");
        setUiOnlyProfesionalSeleccionado("");
        await seleccionarRecetasPaciente(id_paciente);
        return toast.success(`Informacion Actualizada!`);
    }


    async function actualizarReceta_especifica_paciente(
        nombre_paciente,
        apellido_paciente,
        rut_paciente,
        id_paciente,
        id_profesional,
        profesional_responsable,
        descripcion_receta,
        id_receta
    ) {
        try {

            if (!nombre_paciente || !apellido_paciente ||  !rut_paciente ||  !id_paciente ||  !id_profesional || !profesional_responsable || !descripcion_receta || !id_receta) {
                return toast.error("Debe seleccionar al menos una receta, y completar los campos para poder editarla correctamente!");
            }

            const res = await fetch(`${API}/recetas/actualizarRecetaPaciente`,{
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    nombre_paciente,
                    apellido_paciente,
                    rut_paciente,
                    id_paciente,
                    id_profesional,
                    profesional_responsable,
                    descripcion_receta,
                    id_receta
                }),
                mode: "cors",
            })

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                await seleccionarRecetasPaciente(id_paciente);
                return toast.success(`Se ha actualizado la informacion correctamente!`);
            }else if (respuestaBackend.message.includes(`sindato`)){
                return toast.error('No se ha ingresado correctamente toda la informacion, por favor complete todos los campos! ');
            }else if (respuestaBackend.message === false){
                return toast.error('Sin respuesta correcta del servidor, contacte a soporte.')
            }else{
                return toast.error(`Ha ocurrido un error, por favor contacte a soporte`);
            }
        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }








    async function filtrar_receta_por_profesional(
        id_profesional,
        id_paciente,
    ) {
        try {

            const res = await fetch(`${API}/recetas/seleccionar_por_profesional_id`,{
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    id_profesional,
                    id_paciente,
                }),
                mode: "cors",
            })

            const respuestaBackend = await res.json();
            if (Array.isArray(respuestaBackend)&&respuestaBackend.length > 0) {
                setListaRecetasPaciente(respuestaBackend);
                return toast.success(`Recetas emitidas por el profesional encontradas para el paciente`);
            }else{
                await seleccionarRecetasPaciente(id_paciente);
            }
        }catch (error) {
            return toast.error(`Ha ocurrido un error en el servidor por favor contacte a soporte`);
        }
    }

    useEffect(() => {
        if (id_profesional_filtro === "todas" || !id_paciente) {
            seleccionarRecetasPaciente(id_paciente);
            return;
        }

        filtrar_receta_por_profesional(Number(id_profesional_filtro), id_paciente);
    }, [id_profesional_filtro, id_paciente]);

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 md:py-10">

                {/* ── Header ── */}
                <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Documentos Clínicos</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        Receta Médica
                    </h1>
                    <p className="mt-1 text-[13px] text-slate-500">
                        {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Cargando paciente..."}
                    </p>
                </div>

                {/* ── Acciones ── */}
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    <button
                        onClick={volverAFichas}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-[#6E56CF] hover:bg-[#5B47B0] shadow-sm transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                        </svg>
                        Carpeta del Paciente
                    </button>
                    <InfoButton informacion={"Registre y gestione las recetas médicas del paciente. El PDF generado incluye los datos del profesional, diagnóstico e indicaciones."}/>
                </div>

                {cargando ? (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                        Cargando datos del paciente...
                    </div>
                ) : !paciente ? (
                    <div className="rounded-[28px] border border-dashed border-rose-200 bg-white p-10 text-center text-sm text-rose-500">
                        No fue posible encontrar información del paciente.
                    </div>
                ) : (
                    <div className="space-y-5">

                        {/* ── Tarjeta del paciente ── */}
                        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE] text-base font-bold text-[#6E56CF]">
                                    {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-slate-900">{paciente.nombre} {paciente.apellido}</p>
                                    <p className="text-[13px] text-slate-500 font-mono">RUT {formatRut(paciente.rut) || "---"}</p>
                                </div>
                                <div className="ml-auto flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-lg bg-[#F3F0FF] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#6E56CF] uppercase tracking-wide">
                                        {previsionDeterminacion(paciente.prevision_id)}
                                    </span>
                                    <span className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                                        {calcularEdad(paciente.nacimiento)} años
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-slate-100 md:grid-cols-4 lg:grid-cols-6">
                                {[
                                    { label: "Nacimiento",  value: formatearFecha(paciente.nacimiento) },
                                    { label: "Sexo",        value: paciente.sexo },
                                    { label: "Teléfono",    value: paciente.telefono },
                                    { label: "Correo",      value: paciente.correo },
                                    { label: "Dirección",   value: paciente.direccion },
                                    { label: "País",        value: paciente.pais },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-white px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">{label}</p>
                                        <p className="text-[13px] font-medium text-slate-800 break-words">{value || "---"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Formulario de receta ── */}
                        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                                <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </div>
                                <h2 className="text-sm font-semibold text-slate-800">Redacción de receta médica</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[1fr_320px]">
                                {/* Columna izquierda: campos */}
                                <div className="space-y-5">
                                    {/* Profesional */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Profesional que emite la receta</p>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Profesional</label>
                                                <Select
                                                    value={uiOnlyProfesionalSeleccionado}
                                                    onValueChange={(value) => {
                                                        setUiOnlyProfesionalSeleccionado(value);
                                                        const prof = listaProfesionales.find(p => String(p.id_profesional) === value);
                                                        setId_profesional(Number(value));
                                                        setProfesional_responsable(prof?.nombreProfesional || "");
                                                    }}
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-none">
                                                        <SelectValue placeholder="Seleccionar..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200 bg-white">
                                                        {listaProfesionales.map((p) => (
                                                            <SelectItem key={p.id_profesional} value={String(p.id_profesional)} className="rounded-lg py-2">
                                                                {p.nombreProfesional}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">RUT profesional</label>
                                                <ShadcnInput value={rut_profesional_manual} onChange={(e) => setRut_profesional_manual(e.target.value)} placeholder="Opcional, para PDF" className="h-10 rounded-xl border-slate-200 bg-white shadow-none"/>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Diagnóstico</label>
                                                <ShadcnInput value={diagnostico_pdf} onChange={(e) => setDiagnostico_pdf(e.target.value)} placeholder="Opcional, para PDF" className="h-10 rounded-xl border-slate-200 bg-white shadow-none"/>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400">RUT y diagnóstico son opcionales — solo aparecen en el PDF generado.</p>
                                    </div>

                                    {/* Texto de la receta */}
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Indicaciones y contenido de la receta</label>
                                        <Textarea
                                            value={descripcion_receta}
                                            onChange={(e) => setDescripcion_receta(e.target.value)}
                                            placeholder="Ej: Administrar paracetamol 500 mg cada 8 horas por 5 días. Mantener reposo, hidratación y control en caso de persistencia de síntomas."
                                            className="min-h-[220px] resize-y border-slate-200 bg-white text-sm leading-7 text-slate-900 shadow-none focus-visible:ring-violet-100 rounded-xl"
                                        />
                                        <p className="mt-1.5 text-[11px] text-slate-400">{descripcion_receta.trim().length} caracteres</p>
                                    </div>
                                </div>

                                {/* Columna derecha: resumen */}
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                                        <div className="border-b border-slate-100 px-4 py-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Resumen de emisión</p>
                                        </div>
                                        <div className="space-y-2 p-4">
                                            {[
                                                { label: "Paciente", value: `${paciente.nombre} ${paciente.apellido}` },
                                                { label: "Profesional", value: profesional_responsable || "Pendiente" },
                                                ...(diagnostico_pdf.trim() ? [{ label: "Diagnóstico", value: diagnostico_pdf }] : []),
                                            ].map(({ label, value }) => (
                                                <div key={label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                                                    <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{value}</p>
                                                </div>
                                            ))}
                                            {descripcion_receta.trim() && (
                                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">Vista previa</p>
                                                    <p className="text-[12px] leading-5 text-slate-600 whitespace-pre-line line-clamp-6">{descripcion_receta}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                                        <div className="border-b border-slate-100 px-4 py-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Estado</p>
                                        </div>
                                        <div className="space-y-2 p-4">
                                            {[
                                                { label: "Profesional", done: !!profesional_responsable },
                                                { label: "Descripción clínica", done: !!descripcion_receta.trim() },
                                            ].map(({ label, done }) => (
                                                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px]">
                                                    <span className="text-slate-600">{label}</span>
                                                    <span className={`font-semibold text-[12px] ${done ? "text-emerald-600" : "text-slate-400"}`}>
                                                        {done ? "✓ Listo" : "Pendiente"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                                <button
                                    onClick={() => insertarFichasPaciente(nombre_paciente, apellido_paciente, rut_paciente, id_paciente, id_profesional, profesional_responsable, descripcion_receta)}
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#6E56CF] hover:bg-[#5B47B0] px-4 py-2.5 text-sm font-semibold text-white transition-all"
                                >
                                    Guardar receta
                                </button>
                                <button
                                    onClick={generarPDFReceta}
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-900 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-all"
                                >
                                    Descargar PDF
                                </button>
                                <button
                                    onClick={() => actualizarReceta_especifica_paciente(nombre_paciente, apellido_paciente, rut_paciente, id_paciente, id_profesional, profesional_responsable, descripcion_receta, id_receta)}
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all"
                                >
                                    Actualizar
                                </button>
                                <button
                                    onClick={() => eliminarReceta(id_receta)}
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all"
                                >
                                    Eliminar
                                </button>
                                <button
                                    onClick={volverAFichas}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all"
                                >
                                    Volver al historial
                                </button>
                            </div>
                        </div>

                        {/* ── Recetas registradas ── */}
                        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-sm font-semibold text-slate-800">Recetas registradas</h2>
                                <div className="w-full sm:max-w-xs">
                                    <Select value={id_profesional_filtro} onValueChange={(v) => setId_profesional_filtro(v)}>
                                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-none">
                                            <SelectValue placeholder="Filtrar por profesional" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 bg-white">
                                            <SelectItem value="todas" className="rounded-lg py-2">Todas las recetas</SelectItem>
                                            {listaProfesionales.map((p) => (
                                                <SelectItem key={`filtro-${p.id_profesional}`} value={String(p.id_profesional)} className="rounded-lg py-2">
                                                    {p.nombreProfesional}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table className="min-w-[700px]">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Fecha</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Paciente</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Profesional</TableHead>
                                            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Descripción</TableHead>
                                            <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {listaRecetasPaciente.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-400">
                                                    No hay recetas registradas para este paciente.
                                                </TableCell>
                                            </TableRow>
                                        ) : listaRecetasPaciente.map((receta) => (
                                            <TableRow key={receta.id_receta} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="px-6 py-4 text-[13px] font-medium text-slate-600">{formatearFechaHora(receta.fecha_receta)}</TableCell>
                                                <TableCell className="px-6 py-4 text-[13px] font-semibold text-slate-900">{receta.nombre_paciente} {receta.apellido_paciente}</TableCell>
                                                <TableCell className="px-6 py-4 text-[13px] text-slate-600">{receta.profesional_responsable}</TableCell>
                                                <TableCell className="max-w-[380px] px-6 py-4 text-[13px] leading-5 text-slate-600 whitespace-normal">{receta.descripcion_receta}</TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => seleccionarRecetaEspecifica(receta.id_receta)}
                                                        type="button"
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-all"
                                                    >
                                                        Editar
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-[11px] text-slate-400">
                                <span>
                                    {id_profesional_filtro === "todas" ? "Todas las recetas" : listaProfesionales.find(p => String(p.id_profesional) === String(id_profesional_filtro))?.nombreProfesional || ""}
                                </span>
                                <span>{listaRecetasPaciente.length} registros</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
