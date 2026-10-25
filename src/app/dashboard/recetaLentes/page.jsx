'use client'

import {useMemo, useRef, useState} from "react";
import { formatearFechaCivil, hoyCivil } from "@/lib/fechas";
import { generarRecetaLentesPdf } from "@/lib/documentos/generadores/receta";
import { useDatosEmpresa } from "@/hooks/useDatosEmpresa";
import { formatRut } from "@/lib/designTokens";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";
import {useEmpresaNombre} from "@/hooks/useEmpresaNombre";
import {useProfesionales} from "@/hooks/useProfesionales";
import {buscarPacientePorRut} from "@/lib/buscarPaciente";
import {profesionalPorId, profesionalPorRut, rutDeProfesional, registroSisDeProfesional} from "@/lib/profesional";
import ImpresionManuscrita from "@/Componentes/documentos/ImpresionManuscrita";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const emptyGraduacion = {
    esf: "",
    cyl: "",
    eje: "",
};

const emptyFormulario = {
    fechaEmision: hoyCivil(),
    nombrePaciente: "",
    rutPaciente: "",
    idProfesional: "",
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

function InputField({label, value, onChange, onBlur, placeholder, className = "", type = "text"}) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
            <ShadcnInput
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
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
    const empresaNombre = useEmpresaNombre();
    const datosEmpresa = useDatosEmpresa();
    const listaProfesionales = useProfesionales();
    const [formulario, setFormulario] = useState(emptyFormulario);
    const [buscandoPaciente, setBuscandoPaciente] = useState(false);
    const rutBuscadoRef = useRef("");

    const especialidadProfesional = useMemo(() => {
        const profesional = listaProfesionales.find(p => String(p.id_profesional) === String(formulario.idProfesional));
        return profesional?.descripcionProfesional || profesional?.especialidad || "";
    }, [listaProfesionales, formulario.idProfesional]);

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

    async function autocompletarPaciente() {
        const rutConsultado = formulario.rutPaciente.trim();
        if (!rutConsultado) return;
        rutBuscadoRef.current = rutConsultado;
        setBuscandoPaciente(true);
        try {
            const paciente = await buscarPacientePorRut(rutConsultado);
            if (rutBuscadoRef.current !== rutConsultado) return;
            if (paciente) {
                updateField("nombrePaciente", `${paciente.nombre || ""} ${paciente.apellido || ""}`.trim());
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
        setFormulario(emptyFormulario);
        toast.success("Formulario limpiado.");
    }

    function validarAntesDeExportar() {
        if (!formulario.nombrePaciente.trim()) return "Debe ingresar el nombre del paciente.";
        if (!formulario.nombreProfesional.trim()) return "Debe seleccionar el profesional.";
        if (!formulario.fechaEmision) return "Debe seleccionar la fecha de emisión.";
        return null;
    }

    // Devuelve el PDF como Blob para imprimirlo sin descargarlo (ImpresionManuscrita):
    // las recetas se firman de puño y letra, nunca con firma electrónica.
    function generarPDF() {
        const error = validarAntesDeExportar();
        if (error) {
            toast.error(error);
            return null;
        }

        try {
            const ojo = (valores) => ({
                esf: formatOpticValue(valores.esf),
                cyl: formatOpticValue(valores.cyl),
                eje: String(valores.eje ?? "").trim(),
            });
            const { blob } = generarRecetaLentesPdf({
                empresa: { ...datosEmpresa, empresaNombre: datosEmpresa.empresaNombre || empresaNombre },
                paciente: {
                    nombre: formulario.nombrePaciente.trim(),
                    documento: formatRut(formulario.rutPaciente.trim()) || formulario.rutPaciente.trim(),
                },
                profesional: {
                    nombre: formulario.nombreProfesional.trim(),
                    rut: formulario.rutProfesional.trim(),
                    especialidad: especialidadProfesional || "",
                    registroSis: registroSisDeProfesional(profesionalPorId(listaProfesionales, formulario.idProfesional)),
                },
                fechaEmisionTexto: formatearFechaCivil(formulario.fechaEmision),
                lejos: { od: ojo(formulario.lejosOd), oi: ojo(formulario.lejosOi) },
                cerca: { od: ojo(formulario.cercaOd), oi: ojo(formulario.cercaOi) },
                dpLejos: formulario.dpLejos,
                dpCerca: formulario.dpCerca,
                adicion: formatOpticValue(formulario.add),
                observaciones: formulario.observaciones.trim() || formulario.notas.trim(),
            });
            return blob;
        } catch (error) {
            console.error(error);
            toast.error("No fue posible generar el PDF.");
            return null;
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
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
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
                                        label={buscandoPaciente ? "RUT del paciente (buscando...)" : "RUT del paciente"}
                                        value={formulario.rutPaciente}
                                        onChange={(e) => updateField("rutPaciente", e.target.value)}
                                        onBlur={autocompletarPaciente}
                                        placeholder="Ej: 12.345.678-9"
                                    />
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Profesional</label>
                                        <Select
                                            value={formulario.idProfesional}
                                            onValueChange={(value) => {
                                                const prof = profesionalPorId(listaProfesionales, value);
                                                setFormulario((prev) => ({
                                                    ...prev,
                                                    idProfesional: value,
                                                    nombreProfesional: prof?.nombreProfesional || "",
                                                    rutProfesional: rutDeProfesional(prof),
                                                }));
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
                                    <InputField
                                        label="RUT profesional"
                                        value={formulario.rutProfesional}
                                        onChange={(e) => {
                                            const valor = e.target.value;
                                            const prof = profesionalPorRut(listaProfesionales, valor);
                                            setFormulario((prev) => ({
                                                ...prev,
                                                rutProfesional: valor,
                                                ...(prof
                                                    ? {
                                                          idProfesional: String(prof.id_profesional),
                                                          nombreProfesional: prof.nombreProfesional || "",
                                                      }
                                                    : {}),
                                            }));
                                        }}
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

                            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row-reverse sm:items-start md:px-6">
                                <ImpresionManuscrita generarPdf={generarPDF} titulo="Receta de lentes" className="flex-1" />
                                <button
                                    type="button"
                                    onClick={limpiarFormulario}
                                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                >
                                    Limpiar formulario
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
