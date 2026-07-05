'use client'

import {useMemo, useState} from "react";
import jsPDF from "jspdf";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";

export default function RecetaRapida() {
    const PDF_BRAND_TITLE = "AgendaClinica";
    const PDF_BRAND_SUBTITLE = "Healthcare Information System";

    const [idFicha, setIdFicha] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [apellidoPaterno, setApellidoPaterno] = useState("");
    const [apellidoMaterno, setApellidoMaterno] = useState("");
    const [rutPaciente, setRutPaciente] = useState("");
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
    const [fechaCaducidad, setFechaCaducidad] = useState("");
    const [descripcionReceta, setDescripcionReceta] = useState("");
    const [nombreProfesional, setNombreProfesional] = useState("");
    const [diagnostico, setDiagnostico] = useState("");

    const nombreCompletoPaciente = useMemo(() => {
        return [nombrePaciente, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ").trim();
    }, [nombrePaciente, apellidoPaterno, apellidoMaterno]);

    function limpiarFormulario() {
        setIdFicha("");
        setNombrePaciente("");
        setApellidoPaterno("");
        setApellidoMaterno("");
        setRutPaciente("");
        setFechaEmision(new Date().toISOString().split("T")[0]);
        setFechaCaducidad("");
        setDescripcionReceta("");
        setNombreProfesional("");
        setDiagnostico("");
    }

    function validarFormulario() {
        if (!idFicha.trim()) return "Debe ingresar el número de ficha.";
        if (!nombrePaciente.trim()) return "Debe ingresar el nombre del paciente.";
        if (!apellidoPaterno.trim()) return "Debe ingresar el apellido paterno.";
        if (!apellidoMaterno.trim()) return "Debe ingresar el apellido materno.";
        if (!rutPaciente.trim()) return "Debe ingresar el RUT del paciente.";
        if (!fechaEmision) return "Debe seleccionar la fecha de emisión.";
        if (!fechaCaducidad) return "Debe seleccionar la fecha de caducidad.";
        if (!descripcionReceta.trim()) return "Debe ingresar la descripción de la receta.";
        if (!nombreProfesional.trim()) return "Debe ingresar el nombre del profesional.";
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

        const doc = new jsPDF("p", "mm", "letter");
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 20;
        const rightX = pageW - margin;

        try {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(20, 30, 48);
            doc.text(PDF_BRAND_TITLE, margin, 20);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(92, 108, 128);
            doc.text(PDF_BRAND_SUBTITLE, margin, 25);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("Medical prescription", margin, 29);

            doc.setDrawColor(15, 23, 42);
            doc.setLineWidth(0.45);
            doc.line(margin, 33, rightX, 33);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(`Ficha: ${idFicha}`, rightX, 20, {align: "right"});

            let y = 44;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("PACIENTE", margin, y);
            doc.text("RUT", 128, y);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text(nombreCompletoPaciente, margin, y + 7);
            doc.text(rutPaciente, 128, y + 7);

            y += 22;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("FECHA DE EMISION", margin, y);
            doc.text("FECHA DE CADUCIDAD", 84, y);
            doc.text("PROFESIONAL", 148, y);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text(new Date(`${fechaEmision}T00:00:00`).toLocaleDateString("es-CL"), margin, y + 7);
            doc.text(new Date(`${fechaCaducidad}T00:00:00`).toLocaleDateString("es-CL"), 84, y + 7);
            doc.text(nombreProfesional, 148, y + 7);

            y += 18;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("DIAGNOSTICO", margin, y);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text(doc.splitTextToSize(diagnostico.trim(), rightX - margin), margin, y + 7);

            y += 18;

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.35);
            doc.line(margin, y, rightX, y);

            y += 10;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("INDICACION / RECETA", margin, y);

            y += 8;

            doc.setFont("times", "normal");
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);

            const lineasReceta = doc.splitTextToSize(descripcionReceta.trim(), rightX - margin);
            doc.text(lineasReceta, margin, y, {maxWidth: rightX - margin, lineHeightFactor: 1.65});

            const alturaTexto = lineasReceta.length * 6.8;
            const inicioCaja = y - 6;
            const altoCaja = Math.max(88, alturaTexto + 18);
            doc.roundedRect(margin - 2, inicioCaja, rightX - margin + 4, altoCaja, 1.5, 1.5);

            const firmaY = Math.min(pageH - 36, inicioCaja + altoCaja + 34);

            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.35);
            doc.line(118, firmaY, rightX, firmaY);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(nombreProfesional, rightX, firmaY + 6, {align: "right"});
            doc.text("Firma y timbre profesional", rightX, firmaY + 11, {align: "right"});

            const footerY = pageH - 14;
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, footerY - 4, rightX, footerY - 4);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text("Generated by AgendaClinica | Healthcare Information System", margin, footerY);
            doc.text("Professional use", rightX, footerY, {align: "right"});

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
                        <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Documento médico</p>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                                Receta rápida
                            </h1>
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">RUT del paciente</label>
                                    <ShadcnInput
                                        value={rutPaciente}
                                        placeholder="Ej: 12.345.678-9"
                                        onChange={(e) => setRutPaciente(e.target.value)}
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellido paterno</label>
                                    <ShadcnInput
                                        value={apellidoPaterno}
                                        placeholder="Ej: González"
                                        onChange={(e) => setApellidoPaterno(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellido materno</label>
                                    <ShadcnInput
                                        value={apellidoMaterno}
                                        placeholder="Ej: Muñoz"
                                        onChange={(e) => setApellidoMaterno(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre del profesional</label>
                                    <ShadcnInput
                                        value={nombreProfesional}
                                        placeholder="Ej: Dr. Felipe Rojas"
                                        onChange={(e) => setNombreProfesional(e.target.value)}
                                        className="w-full"
                                    />
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
