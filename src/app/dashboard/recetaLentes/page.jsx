'use client'

import {useMemo, useState} from "react";
import jsPDF from "jspdf";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";

const emptyGraduacion = {
    esf: "",
    cyl: "",
    eje: "",
};

const emptyFormulario = {
    fechaEmision: new Date().toISOString().split("T")[0],
    nombrePaciente: "",
    rutPaciente: "",
    nombreProfesional: "",
    rutProfesional: "",
    lejosOd: {...emptyGraduacion},
    lejosOi: {...emptyGraduacion},
    cercaOd: {...emptyGraduacion},
    cercaOi: {...emptyGraduacion},
    add: "",
    dpLejos: "",
    dpCerca: "",
    observaciones: "",
    notas: "",
};

function formatDateDisplay(dateString) {
    if (!dateString) return "__/__/____";

    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "__/__/____";

    return date.toLocaleDateString("es-CL");
}

function formatDateDashed(dateString) {
    if (!dateString) return "__-__-____";

    const [year, month, day] = String(dateString).split("-");
    if (!year || !month || !day) return "__-__-____";

    return `${day}-${month}-${year}`;
}

function formatOpticValue(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (/^[+-]/.test(trimmed)) return trimmed;
    return /^[0-9]/.test(trimmed) ? `+${trimmed}` : trimmed;
}

function sanitizeFilename(value) {
    return (value || "paciente")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function valorVisual(value, fallback = "—") {
    return String(value || "").trim() || fallback;
}

function SectionTitle({eyebrow, title, description}) {
    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
            {description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
            )}
        </div>
    );
}

function InputField({label, value, onChange, placeholder, className = "", type = "text"}) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
            <ShadcnInput
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full"
            />
        </div>
    );
}

function PrescriptionTable({title, dataOd, dataOi, compact = false}) {
    return (
        <div>
            <h3 className="text-base font-bold uppercase tracking-[0.08em] text-slate-800">{title}</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-center">
                    <thead>
                    <tr className="bg-slate-50">
                        <th className="w-20 border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500"></th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">ESF</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">CYL</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">EJE°</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr className="bg-white">
                        <td className="border-r border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">OD</td>
                        <td className="border-r border-t border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{valorVisual(dataOd.esf, compact ? "" : " ")}</td>
                        <td className="border-r border-t border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{valorVisual(dataOd.cyl, compact ? "" : " ")}</td>
                        <td className="border-t border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{valorVisual(dataOd.eje, compact ? "" : " ")}</td>
                    </tr>
                    <tr className="bg-white">
                        <td className="border-r border-t border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">OI</td>
                        <td className="border-r border-t border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{valorVisual(dataOi.esf, compact ? "" : " ")}</td>
                        <td className="border-r border-t border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{valorVisual(dataOi.cyl, compact ? "" : " ")}</td>
                        <td className="border-t border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{valorVisual(dataOi.eje, compact ? "" : " ")}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function RecetaLentesPage() {
    const PDF_BRAND_TITLE = process.env.NEXT_PUBLIC_EMPRESA_NOMBRE || "AgendaClínica";
    const PDF_BRAND_SUBTITLE = "Healthcare Information System";
    const [formulario, setFormulario] = useState(emptyFormulario);

    const nombreArchivo = useMemo(() => {
        return `receta-lentes-${sanitizeFilename(formulario.nombrePaciente) || "paciente"}`;
    }, [formulario.nombrePaciente]);

    function updateField(field, value) {
        setFormulario((prev) => ({...prev, [field]: value}));
    }

    function updateNestedField(group, field, value) {
        setFormulario((prev) => ({
            ...prev,
            [group]: {
                ...prev[group],
                [field]: value
            }
        }));
    }

    function limpiarFormulario() {
        setFormulario(emptyFormulario);
        toast.success("Formulario limpiado.");
    }

    function validarAntesDeExportar() {
        if (!formulario.nombrePaciente.trim()) return "Debe ingresar el nombre del paciente.";
        if (!formulario.nombreProfesional.trim()) return "Debe ingresar el nombre del profesional.";
        if (!formulario.fechaEmision) return "Debe seleccionar la fecha de emisión.";
        return null;
    }

    function drawTable(doc, startX, startY, values) {
        const labelW = 18;
        const colW = 23;
        const rowH = 9;
        const totalW = labelW + (colW * 3);

        doc.setDrawColor(207, 216, 227);
        doc.setLineWidth(0.25);
        doc.roundedRect(startX, startY, totalW, rowH * 3, 1.5, 1.5);

        doc.line(startX + labelW, startY, startX + labelW, startY + (rowH * 3));
        doc.line(startX + labelW + colW, startY, startX + labelW + colW, startY + (rowH * 3));
        doc.line(startX + labelW + (colW * 2), startY, startX + labelW + (colW * 2), startY + (rowH * 3));
        doc.line(startX, startY + rowH, startX + totalW, startY + rowH);
        doc.line(startX, startY + (rowH * 2), startX + totalW, startY + (rowH * 2));

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(55, 65, 81);
        doc.text("ESF", startX + labelW + (colW / 2), startY + 6.4, {align: "center"});
        doc.text("CYL", startX + labelW + colW + (colW / 2), startY + 6.4, {align: "center"});
        doc.text("EJE°", startX + labelW + (colW * 2) + (colW / 2), startY + 6.4, {align: "center"});

        doc.text("OD", startX + (labelW / 2), startY + rowH + 6.4, {align: "center"});
        doc.text("OI", startX + (labelW / 2), startY + (rowH * 2) + 6.4, {align: "center"});

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        doc.text(valorVisual(values.od.esf, ""), startX + labelW + (colW / 2), startY + rowH + 6.4, {align: "center"});
        doc.text(valorVisual(values.od.cyl, ""), startX + labelW + colW + (colW / 2), startY + rowH + 6.4, {align: "center"});
        doc.text(valorVisual(values.od.eje, ""), startX + labelW + (colW * 2) + (colW / 2), startY + rowH + 6.4, {align: "center"});

        doc.text(valorVisual(values.oi.esf, ""), startX + labelW + (colW / 2), startY + (rowH * 2) + 6.4, {align: "center"});
        doc.text(valorVisual(values.oi.cyl, ""), startX + labelW + colW + (colW / 2), startY + (rowH * 2) + 6.4, {align: "center"});
        doc.text(valorVisual(values.oi.eje, ""), startX + labelW + (colW * 2) + (colW / 2), startY + (rowH * 2) + 6.4, {align: "center"});
    }

    function generarPDF() {
        const error = validarAntesDeExportar();
        if (error) return toast.error(error);

        try {
            const fechaGeneracion = new Date();
            const doc = new jsPDF("p", "mm", "a5");
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 14;
            const contentW = pageW - (margin * 2);
            const text = [15, 23, 42];
            const muted = [100, 116, 139];
            const line = [203, 213, 225];

            doc.setDrawColor(...line);
            doc.setLineWidth(0.25);
            doc.roundedRect(margin, 14, contentW, pageH - 28, 4, 4);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16.5);
            doc.setTextColor(...text);
            doc.text(PDF_BRAND_TITLE, margin + 6, 24);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(92, 108, 128);
            doc.text(PDF_BRAND_SUBTITLE, margin + 6, 28.5);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...text);
            doc.text("Lens prescription", pageW - margin - 6, 24.5, {align: "right"});

            doc.setDrawColor(...line);
            doc.line(margin + 6, 33.5, pageW - margin - 6, 33.5);

            let y = 41.5;
            const metaBoxY = y;
            const metaX = margin + 8;
            const metaW = contentW - 16;
            const patientX = metaX + 4;
            const rutX = metaX + 60;
            const professionalX = metaX + 94;

            doc.setFillColor(248, 250, 252);
            doc.roundedRect(metaX, metaBoxY, metaW, 24, 3, 3, "F");
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(metaX, metaBoxY, metaW, 24, 3, 3);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(...muted);
            doc.text("PACIENTE", patientX, metaBoxY + 6);
            doc.text("RUT", rutX, metaBoxY + 6);
            doc.text("PROFESIONAL", professionalX, metaBoxY + 6);
            doc.text("FECHA", patientX, metaBoxY + 17);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.2);
            doc.setTextColor(...text);
            doc.text(doc.splitTextToSize(valorVisual(formulario.nombrePaciente, "-"), 42), patientX, metaBoxY + 12.5);
            doc.text(doc.splitTextToSize(valorVisual(formulario.rutPaciente, "-"), 28), rutX, metaBoxY + 12.5);
            doc.text(doc.splitTextToSize(valorVisual(formulario.nombreProfesional, "-"), 26), professionalX, metaBoxY + 12.5);
            doc.text(`FECHA: ${formatDateDashed(formulario.fechaEmision)}`, patientX, metaBoxY + 21);

            y = 82;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(...text);
            doc.text("PARA LEJOS", margin + 6, y);
            drawTable(doc, margin + 10, y + 5, {
                od: formulario.lejosOd,
                oi: formulario.lejosOi
            });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...text);
            doc.text("DP pl:", pageW - margin - 34, y + 37);
            doc.setDrawColor(180, 187, 200);
            doc.line(pageW - margin - 18, y + 37.5, pageW - margin - 4, y + 37.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text(valorVisual(formulario.dpLejos, ""), pageW - margin - 11, y + 35.8, {align: "center"});

            y = 124;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(...text);
            doc.text("PARA CERCA", margin + 6, y);
            drawTable(doc, margin + 10, y + 5, {
                od: formulario.cercaOd,
                oi: formulario.cercaOi
            });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...text);
            doc.text("ADD", margin + 12, y + 40);
            doc.line(margin + 24, y + 40.5, margin + 48, y + 40.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text(valorVisual(formulario.add, ""), margin + 36, y + 38.8, {align: "center"});

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("DP pc:", pageW - margin - 34, y + 40);
            doc.line(pageW - margin - 18, y + 40.5, pageW - margin - 4, y + 40.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text(valorVisual(formulario.dpCerca, ""), pageW - margin - 11, y + 38.8, {align: "center"});

            y = 179;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...text);
            doc.text("OBSERVACIONES:", margin + 6, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const observaciones = formulario.observaciones.trim() || formulario.notas.trim() || " ";
            const observacionesLineas = doc.splitTextToSize(observaciones, contentW - 20);
            doc.text(observacionesLineas, margin + 6, y + 7, {lineHeightFactor: 1.5});

            const signatureY = pageH - 26;
            doc.setDrawColor(180, 187, 200);
            doc.line(pageW - margin - 54, signatureY, pageW - margin - 6, signatureY);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(...muted);
            doc.text("Firma y timbre del profesional", pageW - margin - 30, signatureY + 5, {align: "center"});
            doc.setTextColor(...text);
            doc.text(valorVisual(formulario.nombreProfesional, ""), pageW - margin - 30, signatureY + 9, {align: "center"});

            doc.setDrawColor(...line);
            doc.line(margin + 6, pageH - 16, pageW - margin - 6, pageH - 16);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...muted);
            doc.text("Generated by AgendaClínica | Healthcare Information System", margin + 6, pageH - 11);
            doc.text(
                `Generado: ${fechaGeneracion.toLocaleDateString("es-CL")} ${fechaGeneracion.toLocaleTimeString("es-CL", {hour: "2-digit", minute: "2-digit"})}`,
                pageW - margin - 6,
                pageH - 11,
                {align: "right"}
            );

            doc.save(`${nombreArchivo}.pdf`);
            toast.success("PDF generado correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("No fue posible generar el PDF.");
        }
    }

    const resumen = useMemo(() => ({
        lejosOd: {
            esf: formatOpticValue(formulario.lejosOd.esf),
            cyl: formatOpticValue(formulario.lejosOd.cyl),
            eje: formulario.lejosOd.eje.trim(),
        },
        lejosOi: {
            esf: formatOpticValue(formulario.lejosOi.esf),
            cyl: formatOpticValue(formulario.lejosOi.cyl),
            eje: formulario.lejosOi.eje.trim(),
        },
        cercaOd: {
            esf: formatOpticValue(formulario.cercaOd.esf),
            cyl: formatOpticValue(formulario.cercaOd.cyl),
            eje: formulario.cercaOd.eje.trim(),
        },
        cercaOi: {
            esf: formatOpticValue(formulario.cercaOi.esf),
            cyl: formatOpticValue(formulario.cercaOi.cyl),
            eje: formulario.cercaOi.eje.trim(),
        },
        add: formatOpticValue(formulario.add),
        dpLejos: formulario.dpLejos.trim(),
        dpCerca: formulario.dpCerca.trim(),
    }), [formulario]);

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 md:py-10">
                <div className="mb-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#6E56CF]">Optometría clínica</p>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                                Receta de lentes
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateDisplay(formulario.fechaEmision)}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Paciente</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{valorVisual(formulario.nombrePaciente, "-")}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Profesional</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{valorVisual(formulario.nombreProfesional, "-")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 md:px-6">
                                <SectionTitle
                                    eyebrow="Formulario"
                                    title="Datos base de la receta"
                                />
                            </div>

                            <div className="space-y-8 p-5 md:p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <InputField
                                        label="Fecha de emisión"
                                        type="date"
                                        value={formulario.fechaEmision}
                                        onChange={(e) => updateField("fechaEmision", e.target.value)}
                                    />
                                    <InputField
                                        label="Nombre del paciente"
                                        value={formulario.nombrePaciente}
                                        onChange={(e) => updateField("nombrePaciente", e.target.value)}
                                        placeholder="Ej: María José Pérez"
                                    />
                                    <InputField
                                        label="RUT del paciente"
                                        value={formulario.rutPaciente}
                                        onChange={(e) => updateField("rutPaciente", e.target.value)}
                                        placeholder="Ej: 12.345.678-9"
                                    />
                                    <InputField
                                        label="Nombre del profesional"
                                        value={formulario.nombreProfesional}
                                        onChange={(e) => updateField("nombreProfesional", e.target.value)}
                                        placeholder="Ej: TMO Ivonne Orellana Machuca"
                                    />
                                    <InputField
                                        label="RUT profesional"
                                        value={formulario.rutProfesional}
                                        onChange={(e) => updateField("rutProfesional", e.target.value)}
                                        placeholder="Ej: 17.517.094-4"
                                        className="md:col-span-2"
                                    />
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                                    <SectionTitle
                                        eyebrow="Graduación"
                                        title="Para lejos"
                                        description="Completa esfera, cilindro y eje para ambos ojos."
                                    />
                                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-slate-900">OD</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <InputField label="ESF" value={formulario.lejosOd.esf} onChange={(e) => updateNestedField("lejosOd", "esf", e.target.value)} placeholder="+2.00"/>
                                                <InputField label="CYL" value={formulario.lejosOd.cyl} onChange={(e) => updateNestedField("lejosOd", "cyl", e.target.value)} placeholder="-1.25"/>
                                                <InputField label="EJE" value={formulario.lejosOd.eje} onChange={(e) => updateNestedField("lejosOd", "eje", e.target.value)} placeholder="100"/>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-slate-900">OI</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <InputField label="ESF" value={formulario.lejosOi.esf} onChange={(e) => updateNestedField("lejosOi", "esf", e.target.value)} placeholder="-3.50"/>
                                                <InputField label="CYL" value={formulario.lejosOi.cyl} onChange={(e) => updateNestedField("lejosOi", "cyl", e.target.value)} placeholder="-1.25"/>
                                                <InputField label="EJE" value={formulario.lejosOi.eje} onChange={(e) => updateNestedField("lejosOi", "eje", e.target.value)} placeholder="30"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <InputField
                                            label="DP para lejos"
                                            value={formulario.dpLejos}
                                            onChange={(e) => updateField("dpLejos", e.target.value)}
                                            placeholder="Ej: 62"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                                    <SectionTitle
                                        eyebrow="Graduación"
                                        title="Para cerca"
                                        description="Ingresa los valores de cerca, adición y distancia pupilar."
                                    />
                                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-slate-900">OD</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <InputField label="ESF" value={formulario.cercaOd.esf} onChange={(e) => updateNestedField("cercaOd", "esf", e.target.value)} placeholder="+4.00"/>
                                                <InputField label="CYL" value={formulario.cercaOd.cyl} onChange={(e) => updateNestedField("cercaOd", "cyl", e.target.value)} placeholder="-2.00"/>
                                                <InputField label="EJE" value={formulario.cercaOd.eje} onChange={(e) => updateNestedField("cercaOd", "eje", e.target.value)} placeholder="100"/>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <p className="mb-3 text-sm font-semibold text-slate-900">OI</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <InputField label="ESF" value={formulario.cercaOi.esf} onChange={(e) => updateNestedField("cercaOi", "esf", e.target.value)} placeholder="-1.50"/>
                                                <InputField label="CYL" value={formulario.cercaOi.cyl} onChange={(e) => updateNestedField("cercaOi", "cyl", e.target.value)} placeholder="-1.25"/>
                                                <InputField label="EJE" value={formulario.cercaOi.eje} onChange={(e) => updateNestedField("cercaOi", "eje", e.target.value)} placeholder="30"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <InputField
                                            label="ADD"
                                            value={formulario.add}
                                            onChange={(e) => updateField("add", e.target.value)}
                                            placeholder="+2.00"
                                        />
                                        <InputField
                                            label="DP para cerca"
                                            value={formulario.dpCerca}
                                            onChange={(e) => updateField("dpCerca", e.target.value)}
                                            placeholder="Ej: 60"
                                            className="md:col-span-2"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Observaciones</label>
                                        <textarea
                                            value={formulario.observaciones}
                                            onChange={(e) => updateField("observaciones", e.target.value)}
                                            rows={4}
                                            placeholder="Ej: AR. Se sugiere control anual."
                                            className="min-h-[120px] w-full resize-y rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Notas complementarias</label>
                                        <textarea
                                            value={formulario.notas}
                                            onChange={(e) => updateField("notas", e.target.value)}
                                            rows={3}
                                            placeholder="Campo opcional para aclaraciones adicionales."
                                            className="min-h-[96px] w-full resize-y rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-slate-100 px-5 py-4 md:px-6">
                                <button
                                    type="button"
                                    onClick={limpiarFormulario}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                >
                                    Limpiar formulario
                                </button>
                                <button
                                    type="button"
                                    onClick={generarPDF}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 md:px-6">
                                <SectionTitle
                                    eyebrow="Vista previa"
                                    title="Receta lista para emitir"
                                />
                            </div>

                            <div className="bg-[#f8fafc] p-4 md:p-6">
                                <div className="mx-auto rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div></div>
                                        <div className="text-right">
                                            <h3 className="text-xl font-bold tracking-[0.04em] text-slate-900">RECETA DE LENTES</h3>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm sm:grid-cols-2">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Paciente</p>
                                            <p className="mt-1 font-semibold text-slate-900">{valorVisual(formulario.nombrePaciente, "-")}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">RUT paciente</p>
                                            <p className="mt-1 font-semibold text-slate-900">{valorVisual(formulario.rutPaciente, "-")}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Profesional</p>
                                            <p className="mt-1 font-semibold text-slate-900">{valorVisual(formulario.nombreProfesional, "-")}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">RUT profesional</p>
                                            <p className="mt-1 font-semibold text-slate-900">{valorVisual(formulario.rutProfesional, "-")}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha</p>
                                            <p className="mt-1 font-semibold text-slate-900">FECHA: {formatDateDashed(formulario.fechaEmision)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-8">
                                        <div>
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                                                <PrescriptionTable
                                                    title="Para lejos"
                                                    dataOd={resumen.lejosOd}
                                                    dataOi={resumen.lejosOi}
                                                    compact
                                                />
                                                <div className="px-2 pb-1 text-sm font-semibold text-slate-700">
                                                    DP pl: <span className="inline-block min-w-[56px] border-b border-slate-300 pb-0.5 text-center text-slate-900">{valorVisual(resumen.dpLejos, " ")}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                                                <PrescriptionTable
                                                    title="Para cerca"
                                                    dataOd={resumen.cercaOd}
                                                    dataOi={resumen.cercaOi}
                                                    compact
                                                />
                                                <div className="space-y-3 px-2 pb-1 text-sm font-semibold text-slate-700">
                                                    <div>
                                                        ADD: <span className="inline-block min-w-[56px] border-b border-slate-300 pb-0.5 text-center text-slate-900">{valorVisual(resumen.add, " ")}</span>
                                                    </div>
                                                    <div>
                                                        DP pc: <span className="inline-block min-w-[56px] border-b border-slate-300 pb-0.5 text-center text-slate-900">{valorVisual(resumen.dpCerca, " ")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-base font-bold uppercase tracking-[0.08em] text-slate-800">Observaciones</p>
                                            <div className="mt-3 min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-7 text-slate-700">
                                                {(formulario.observaciones || formulario.notas)
                                                    ? (
                                                        <div className="space-y-3 whitespace-pre-line">
                                                            {formulario.observaciones && <p>{formulario.observaciones}</p>}
                                                            {formulario.notas && <p>{formulario.notas}</p>}
                                                        </div>
                                                    )
                                                    : "Sin observaciones registradas."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
