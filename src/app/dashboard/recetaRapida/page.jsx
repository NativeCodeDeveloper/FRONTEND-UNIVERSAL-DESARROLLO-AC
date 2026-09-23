'use client'

import {useMemo, useRef, useState} from "react";
import BotonVideoTutorial from "@/Componentes/VideoTutorial";
import jsPDF from "jspdf";
import { dibujarBloqueFirma } from "@/lib/pdfFirma";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";
import {useEmpresaNombre} from "@/hooks/useEmpresaNombre";
import {useProfesionales} from "@/hooks/useProfesionales";
import {buscarPacientePorRut} from "@/lib/buscarPaciente";
import {profesionalPorId, profesionalPorRut, rutDeProfesional} from "@/lib/profesional";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export default function RecetaRapida() {
    const empresaNombre = useEmpresaNombre();
    const listaProfesionales = useProfesionales();

    const [idFicha, setIdFicha] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [apellidoPaciente, setApellidoPaciente] = useState("");
    const [rutPaciente, setRutPaciente] = useState("");
    const [buscandoPaciente, setBuscandoPaciente] = useState(false);
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
    const [fechaCaducidad, setFechaCaducidad] = useState("");
    const [descripcionReceta, setDescripcionReceta] = useState("");
    const [idProfesional, setIdProfesional] = useState("");
    const [nombreProfesional, setNombreProfesional] = useState("");
    const [rutProfesional, setRutProfesional] = useState("");
    const [diagnostico, setDiagnostico] = useState("");
    const rutBuscadoRef = useRef("");

    function formatearGeneracionPDF(fecha) {
        const fechaTexto = fecha.toLocaleDateString("es-CL");
        const horaTexto = fecha.toLocaleTimeString("es-CL", {hour: "2-digit", minute: "2-digit"});
        return `Generado: ${fechaTexto} ${horaTexto}`;
    }

    const especialidadProfesional = useMemo(() => {
        const profesional = listaProfesionales.find(p => String(p.id_profesional) === String(idProfesional));
        const texto = (profesional?.descripcionProfesional || profesional?.especialidad || "").trim();
        // Truncado a un largo seguro: esta caja del PDF tiene alto fijo y jsPDF no
        // recorta el texto desbordado, así que una descripción muy larga del
        // profesional superpondría el diagnóstico impreso debajo.
        const MAX_LARGO_PDF = 130;
        if (texto.length <= MAX_LARGO_PDF) return texto;
        return `${texto.slice(0, MAX_LARGO_PDF - 1).trimEnd()}…`;
    }, [listaProfesionales, idProfesional]);

    const nombreCompletoPaciente = useMemo(() => {
        return [nombrePaciente, apellidoPaciente].filter(Boolean).join(" ").trim();
    }, [nombrePaciente, apellidoPaciente]);

    async function autocompletarPaciente() {
        const rutConsultado = rutPaciente.trim();
        if (!rutConsultado) return;
        rutBuscadoRef.current = rutConsultado;
        setBuscandoPaciente(true);
        try {
            const paciente = await buscarPacientePorRut(rutConsultado);
            if (rutBuscadoRef.current !== rutConsultado) return;
            if (paciente) {
                setNombrePaciente(paciente.nombre || "");
                setApellidoPaciente(paciente.apellido || "");
                toast.success("Datos del paciente completados automáticamente.");
            }
        } catch (error) {
            if (rutBuscadoRef.current === rutConsultado) {
                toast.error("No fue posible buscar los datos del paciente. Intente nuevamente.");
            }
        } finally {
            if (rutBuscadoRef.current === rutConsultado) setBuscandoPaciente(false);
        }
    }

    function limpiarFormulario() {
        rutBuscadoRef.current = "";
        setBuscandoPaciente(false);
        setIdFicha("");
        setNombrePaciente("");
        setApellidoPaciente("");
        setRutPaciente("");
        setFechaEmision(new Date().toISOString().split("T")[0]);
        setFechaCaducidad("");
        setDescripcionReceta("");
        setIdProfesional("");
        setNombreProfesional("");
        setRutProfesional("");
        setDiagnostico("");
    }

    function validarFormulario() {
        if (!idFicha.trim()) return "Debe ingresar el número de ficha.";
        if (!nombrePaciente.trim()) return "Debe ingresar el nombre del paciente.";
        if (!apellidoPaciente.trim()) return "Debe ingresar el apellido del paciente.";
        if (!rutPaciente.trim()) return "Debe ingresar el RUT del paciente.";
        if (!fechaEmision) return "Debe seleccionar la fecha de emisión.";
        if (!fechaCaducidad) return "Debe seleccionar la fecha de caducidad.";
        if (!descripcionReceta.trim()) return "Debe ingresar la descripción de la receta.";
        if (!nombreProfesional.trim()) return "Debe seleccionar el profesional.";
        if (!diagnostico.trim()) return "Debe ingresar el diagnóstico.";

        const emision = new Date(fechaEmision);
        const caducidad = new Date(fechaCaducidad);

        if (caducidad < emision) return "La fecha de caducidad no puede ser anterior a la fecha de emisión.";

        return null;
    }

    function generarPDFReceta() {
        const errorFormulario = validarFormulario();

        if (errorFormulario) {
            return toast.error(errorFormulario);
        }

        // ── Mismo sistema visual que la receta de la carpeta del paciente ──
        // (src/app/dashboard/recetaPacientes/[id_paciente]/page.jsx): mismo
        // encabezado, misma caja "Identificacion clinica", mismo bloque de
        // indicaciones con paginacion y mismo pie. Cambian solo los datos: aca
        // hay fecha de caducidad y numero de ficha, y no hay nacimiento,
        // edad ni prevision porque la receta rapida no parte de un paciente
        // registrado.
        const doc = new jsPDF("p", "mm", "letter");
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 18;
        const rightX = pageW - margin;
        const anchoContenido = rightX - margin;

        const texto = (valor, fallback = "-") => {
            const limpio = String(valor ?? "").trim();
            return limpio || fallback;
        };
        const fecha = (valor) => {
            if (!valor) return "-";
            try {
                return new Date(`${valor}T00:00:00`).toLocaleDateString("es-CL");
            } catch {
                return "-";
            }
        };

        const nombreProfesionalPDF = texto(nombreProfesional);
        const rutProfesionalPDF = texto(rutProfesional);
        const especialidadProfesionalPDF = texto(especialidadProfesional, "Profesional tratante");
        const diagnosticoPDF = diagnostico.trim();

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
                doc.text(empresaNombre, margin, 27);

                doc.setFont("helvetica", "italic");
                doc.setFontSize(8.5);
                doc.setTextColor(92, 108, 128);
                doc.text("AgendaClínica — Healthcare Information System", margin, 32);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text("Receta médica", margin, 36.5);
                doc.text(`Ficha: ${texto(idFicha)}`, rightX, 27, {align: "right"});
                doc.text("Documento clínico", rightX, 32, {align: "right"});
            };

            const dibujarPie = () => {
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.3);
                doc.line(margin, footerY - 6, rightX, footerY - 6);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text(`Generado por AgendaClínica | ${empresaNombre}`, margin, footerY - 1);
                doc.text(`Paciente: ${texto(rutPaciente)}`, rightX, footerY - 1, {align: "right"});
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
            doc.text("FECHA DE EMISIÓN", margin + 4, y + 44);
            doc.text("FECHA DE CADUCIDAD", margin + 74, y + 44);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.4);
            doc.setTextColor(15, 23, 42);
            doc.text(texto(nombreCompletoPaciente), margin + 4, y + 23);
            doc.text(texto(rutPaciente), margin + 74, y + 23);
            doc.text(doc.splitTextToSize(nombreProfesionalPDF, 66), margin + 4, y + 36);
            doc.text(rutProfesionalPDF, margin + 74, y + 36);
            doc.text(doc.splitTextToSize(especialidadProfesionalPDF, 58), margin + 130, y + 36, {lineHeightFactor: 1.3});
            doc.text(fecha(fechaEmision), margin + 4, y + 49);
            doc.text(fecha(fechaCaducidad), margin + 74, y + 49);

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

            const lineasReceta = doc.splitTextToSize(descripcionReceta.trim(), anchoContenido - 10);
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

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(9);
                    doc.setTextColor(15, 23, 42);
                    doc.text(primeraPaginaTexto ? "Indicaciones médicas (continuación)" : "Continuación de receta", margin, y);
                    y += 6;
                    primeraPaginaTexto = false;
                }
            }

            if (y + 31 > limiteContenidoY) {
                dibujarPie();
                doc.addPage();
                dibujarEncabezado();
                y = 48;
            }

            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.35);
            const anchoFirma = 62; // el mismo largo de la raya de firma
            doc.line(rightX - anchoFirma, y + 10, rightX, y + 10);

            dibujarBloqueFirma(doc, {
                x: rightX,
                y: y + 16,
                anchoMax: anchoFirma,
                align: "right",
                nombre: nombreProfesionalPDF,
                rut: rutProfesionalPDF,
                especialidad: especialidadProfesionalPDF,
                empresa: empresaNombre,
            });

            dibujarPie();

            const nombreArchivo = `receta-rapida-${nombreCompletoPaciente || "paciente"}`
                .toLowerCase()
                .replace(/\s+/g, "-");

            doc.save(`${nombreArchivo}.pdf`);
            toast.success("Receta PDF generada correctamente.");
        } catch (error) {
            console.log(error);
            return toast.error("No fue posible generar la receta en PDF.");
        }
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 md:py-10">
                <div className="mb-8 rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                                Receta rápida
                            </h1>
                            <BotonVideoTutorial
                                videoId="eZhpFPow0MA"
                                titulo="Receta rápida"
                                etiqueta="Video tutorial"
                                ariaLabel="Abrir video tutorial de receta rápida"
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ficha</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{idFicha || "-"}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Paciente</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{nombreCompletoPaciente || "-"}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Profesional</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{nombreProfesional || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Datos clínicos</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-6">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Número de ficha</label>
                                    <ShadcnInput
                                        value={idFicha}
                                        placeholder="Ej: 1458"
                                        onChange={(e) => setIdFicha(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        RUT del paciente {buscandoPaciente && <span className="text-slate-400 font-normal">(buscando...)</span>}
                                    </label>
                                    <ShadcnInput
                                        value={rutPaciente}
                                        placeholder="Ej: 12.345.678-9"
                                        onChange={(e) => setRutPaciente(e.target.value)}
                                        onBlur={autocompletarPaciente}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre del paciente</label>
                                    <ShadcnInput
                                        value={nombrePaciente}
                                        placeholder="Ej: María"
                                        onChange={(e) => setNombrePaciente(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellido</label>
                                    <ShadcnInput
                                        value={apellidoPaciente}
                                        placeholder="Ej: González Muñoz"
                                        onChange={(e) => setApellidoPaciente(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Profesional</label>
                                    <Select
                                        value={idProfesional}
                                        onValueChange={(value) => {
                                            setIdProfesional(value);
                                            const prof = profesionalPorId(listaProfesionales, value);
                                            setNombreProfesional(prof?.nombreProfesional || "");
                                            setRutProfesional(rutDeProfesional(prof));
                                        }}
                                    >
                                        <SelectTrigger className="h-10 w-full rounded-md border-slate-200 bg-white text-sm text-slate-900 shadow-none">
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">RUT del profesional</label>
                                    <ShadcnInput
                                        value={rutProfesional}
                                        placeholder="Ej: 12.345.678-9"
                                        onChange={(e) => {
                                            const valor = e.target.value;
                                            setRutProfesional(valor);
                                            const prof = profesionalPorRut(listaProfesionales, valor);
                                            if (prof) {
                                                setIdProfesional(String(prof.id_profesional));
                                                setNombreProfesional(prof.nombreProfesional || "");
                                            }
                                        }}
                                        className="w-full"
                                    />
                                    {profesionalPorRut(listaProfesionales, rutProfesional) ? (
                                        <p className="mt-1 text-[11px] font-medium text-emerald-600">
                                            Profesional registrado · datos completados automáticamente
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Diagnóstico</label>
                                    <ShadcnInput
                                        value={diagnostico}
                                        placeholder="Ej: Faringitis aguda"
                                        onChange={(e) => setDiagnostico(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha de emisión</label>
                                    <input
                                        type="date"
                                        value={fechaEmision}
                                        onChange={(e) => setFechaEmision(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha de caducidad</label>
                                    <input
                                        type="date"
                                        value={fechaCaducidad}
                                        onChange={(e) => setFechaCaducidad(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Descripción de la receta</h2>
                            </div>
                            <div className="p-5 md:p-6">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Indicación médica</label>
                                <textarea
                                    value={descripcionReceta}
                                    onChange={(e) => setDescripcionReceta(e.target.value)}
                                    placeholder="Ej: Administrar amoxicilina 500 mg cada 8 horas por 7 días. Reposo relativo e hidratación."
                                    className="min-h-[220px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Vista previa</h2>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Paciente</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{nombreCompletoPaciente || "-"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Rut</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{rutPaciente || "-"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Profesional</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{nombreProfesional || "-"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnóstico</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{diagnostico || "-"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fechas</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {fechaEmision ? new Date(`${fechaEmision}T00:00:00`).toLocaleDateString("es-CL") : "-"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Caduca: {fechaCaducidad ? new Date(`${fechaCaducidad}T00:00:00`).toLocaleDateString("es-CL") : "-"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cuerpo de receta</p>
                                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                                        {descripcionReceta || "La indicación médica aparecerá aquí en formato limpio y clínico."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={generarPDFReceta}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-slate-800"
                                >
                                    Generar PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={limpiarFormulario}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-50"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
