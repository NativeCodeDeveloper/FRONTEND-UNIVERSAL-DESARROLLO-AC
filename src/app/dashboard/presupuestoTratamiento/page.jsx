'use client'
import React, {useState, useEffect} from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {SelectDinamic} from "@/Componentes/SelectDinamic";
import {InputTextDinamic} from "@/Componentes/InputTextDinamic";




export default function PresupuestoTratamiento() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const EMPRESA_NOMBRE = process.env.NEXT_PUBLIC_EMPRESA_NOMBRE || "AgendaClinica";
    const [listaServicios, setListaServicios] = useState([]);
    const [listaPresupuesto, setListaPresupuesto] = useState([]);
    const [totalPresupuesto, setTotalPresupuesto] = useState(0);
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [nombreProfesional, setNombreProfesional] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [rutaPaciente, setRutaPaciente] = useState("");

    const formatoCLP = new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    async function getProductosServicios() {
        try {
            const res = await fetch(`${API}/producto/seleccionarProducto`,{
                method:"GET",
                headers:{Accept:"application/json"},
                mode:'cors'
            });
            if (!res.ok) {
                return toast.error("No es posible cargar los productos/Servicios, contacte a soporte");
            }else{
                const dataBackend = await res.json();
                setListaServicios(dataBackend);
            }
        }catch (error) {
            return toast.error("No es posible cargar los productos/Servicios, contacte a soporte");
        }
    }
    useEffect(() => {
        getProductosServicios();
    },[])



    function generarPresupuesto(servicioCotizado) {
        setListaPresupuesto(servicioCotizadoPrev => [...servicioCotizadoPrev, {...servicioCotizado, observacionCotizacion: ""}]);
        let valorPresupuesto = servicioCotizado.valorProducto;
        listaPresupuesto.forEach(element => {
            valorPresupuesto += element.valorProducto;
        })
        setTotalPresupuesto(valorPresupuesto);
    }

    function quitarDelPresupuesto(indexEliminar) {
        setListaPresupuesto(prev => {
            const nueva = prev.filter((_, i) => i !== indexEliminar);
            let total = 0;
            nueva.forEach(el => { total += el.valorProducto; });
            setTotalPresupuesto(total);
            return nueva;
        });
    }

    function actualizarObservacionPresupuesto(indexActualizar, observacionCotizacion) {
        setListaPresupuesto(prev => prev.map((servicio, index) => (
            index === indexActualizar ? {...servicio, observacionCotizacion} : servicio
        )));
    }




    async function descargarPresupuestoPDF() {
        const doc = new jsPDF("p", "mm", "letter");
        const pageW  = doc.internal.pageSize.getWidth();
        const pageH  = doc.internal.pageSize.getHeight();
        const margin = 20;
        const rightX = pageW - margin;
        const fechaEmision = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
        const folio = `N° ${String(Date.now()).slice(-6)}`; // folio temporal

        const profesionalLabel = listaProfesionales.find(p => String(p.id_profesional) === String(nombreProfesional));

        // ════════════════════════════════════════════════════════════
        // PALETA CLÍNICA: solo negro, grises y blanco. Sin gradientes.
        // ════════════════════════════════════════════════════════════
        const BLACK   = [15,  23,  42];   // texto principal
        const DARK    = [51,  65,  85];   // texto secundario
        const MID     = [100, 116, 139];  // etiquetas / subtítulos
        const LIGHT   = [148, 163, 184];  // pie, notas
        const BGLIGHT = [248, 250, 252];  // fondo alterno filas
        const BGMID   = [241, 245, 249];  // fondo de bloques de info
        const BORDER  = [203, 213, 225];  // líneas / bordes

        // ── ENCABEZADO ───────────────────────────────────────────────
        // Fondo blanco, borde inferior delgado
        doc.setFillColor(...BGLIGHT);
        doc.rect(0, 0, pageW, 32, "F");
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.4);
        doc.line(0, 32, pageW, 32);

        // Nombre de la clínica — izquierda
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...BLACK);
        doc.text(EMPRESA_NOMBRE.toUpperCase(), margin, 14);

        // Subtítulo clínica
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MID);
        doc.text("Centro de Atención Clínica", margin, 21);

        // Tipo de documento — derecha, en caja gris
        doc.setFillColor(...BGMID);
        doc.roundedRect(rightX - 60, 6, 60, 20, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...BLACK);
        doc.text("PRESUPUESTO DE TRATAMIENTO", rightX - 30, 14, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...MID);
        doc.text(folio, rightX - 30, 20, { align: "center" });

        // ── DATOS DEL DOCUMENTO ──────────────────────────────────────
        let y = 42;

        // Caja info: Profesional | Paciente | RUT | Fecha
        doc.setFillColor(...BGMID);
        doc.roundedRect(margin, y, rightX - margin, 26, 1, 1, "F");
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, rightX - margin, 26, 1, 1, "S");

        // Línea vertical divisoria
        const midCol = margin + (rightX - margin) / 2;
        doc.line(midCol, y + 2, midCol, y + 24);

        // Columna izquierda: Profesional
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...MID);
        doc.text("PROFESIONAL RESPONSABLE", margin + 5, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...BLACK);
        doc.text(profesionalLabel?.nombreProfesional || "—", margin + 5, y + 16);

        // Columna derecha: Paciente + RUT | Fecha
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...MID);
        doc.text("PACIENTE", midCol + 5, y + 8);
        doc.text("FECHA DE EMISIÓN", midCol + 5, y + 19);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...BLACK);
        doc.text((nombrePaciente || "—") + (rutaPaciente ? `  ·  ${rutaPaciente}` : ""), midCol + 5, y + 14);
        doc.setFontSize(8.5);
        doc.text(fechaEmision, midCol + 5, y + 24);

        // ── TABLA DE SERVICIOS ───────────────────────────────────────
        y += 32;

        const columns = ["#", "Servicio / Procedimiento", "Observación", "Valor (CLP)"];
        const rows = listaPresupuesto.map((srv, i) => [
            String(i + 1),
            srv.tituloProducto,
            srv.observacionCotizacion?.trim() || "—",
            formatoCLP.format(srv.valorProducto)
        ]);

        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: y,
            margin: { left: margin, right: margin },
            theme: "plain",
            headStyles: {
                fillColor: [51, 65, 85],   // slate-700 — oscuro neutro, NO indigo
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7.5,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                halign: "left",
            },
            columnStyles: {
                0: { cellWidth: 10, halign: "center", textColor: [...MID] },
                1: { cellWidth: 65 },
                2: { cellWidth: "auto", textColor: [...DARK] },
                3: { cellWidth: 36, halign: "right", fontStyle: "bold" },
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
                textColor: [...BLACK],
            },
            alternateRowStyles: {
                fillColor: [...BGLIGHT],
            },
            styles: {
                lineWidth: 0.15,
                lineColor: [...BORDER],
                overflow: "linebreak",
            },
        });

        // ── TOTALES ──────────────────────────────────────────────────
        let finalY = doc.lastAutoTable.finalY + 8;

        // Caja de total alineada a la derecha
        const boxW = 70;
        const boxX = rightX - boxW;

        doc.setFillColor(...BGMID);
        doc.roundedRect(boxX, finalY, boxW, 22, 1, 1, "F");
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(boxX, finalY, boxW, 22, 1, 1, "S");

        // Subtotal
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...MID);
        doc.text("Subtotal:", boxX + 5, finalY + 8);
        doc.text(formatoCLP.format(totalPresupuesto), rightX - 3, finalY + 8, { align: "right" });

        // Línea divisoria interna
        doc.setDrawColor(...BORDER);
        doc.line(boxX + 3, finalY + 11, rightX - 3, finalY + 11);

        // Total neto
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...BLACK);
        doc.text("Total Neto:", boxX + 5, finalY + 19);
        doc.text(formatoCLP.format(totalPresupuesto), rightX - 3, finalY + 19, { align: "right" });

        // ── NOTAS CLÍNICAS ────────────────────────────────────────────
        finalY += 30;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...LIGHT);
        doc.text("• Los valores indicados están expresados en pesos chilenos (CLP) e incluyen IVA según corresponda.", margin, finalY);
        doc.text("• Este presupuesto tiene vigencia de 30 días desde la fecha de emisión.", margin, finalY + 5);
        doc.text("• Para consultas comuníquese con la clínica antes de iniciar cualquier tratamiento.", margin, finalY + 10);

        // ── ÁREA DE FIRMA ─────────────────────────────────────────────
        finalY += 24;
        const sigW = 65;
        // Firma profesional
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(margin, finalY, margin + sigW, finalY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...MID);
        doc.text("Firma y Timbre Profesional", margin + sigW / 2, finalY + 5, { align: "center" });
        // Firma paciente
        doc.line(rightX - sigW, finalY, rightX, finalY);
        doc.text("Firma Paciente / Representante", rightX - sigW / 2, finalY + 5, { align: "center" });

        // ── PIE DE PÁGINA ─────────────────────────────────────────────
        const footerY = pageH - 12;
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 4, rightX, footerY - 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...LIGHT);
        doc.text(`${EMPRESA_NOMBRE}  ·  Documento generado por AgendaClinica`, margin, footerY);
        doc.text(`Folio ${folio}  ·  Emisión: ${fechaEmision}`, rightX, footerY, { align: "right" });

        doc.save(`presupuesto-${(nombrePaciente || "paciente").toLowerCase().replace(/\s+/g, "-")}.pdf`);
    }






    async function seleccionarTodosProfesionales() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend){
                    setListaProfesionales(respustaBackend);

                }else{
                    return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionales();
    }, []);




    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

                {/* Header */}
                <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Documentos</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                        Presupuesto de Tratamiento
                    </h1>
                    <p className="mt-1 text-[13px] text-slate-500">Selecciona servicios para armar el presupuesto del paciente.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Presupuesto armado - columna izquierda */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
                                    </svg>
                                    <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Presupuesto</h2>
                                </div>
                                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-bold bg-[#F3F0FF] text-[#6E56CF]">
                                    {listaPresupuesto.length}
                                </span>
                            </div>

                            <div className="p-4">
                                {listaPresupuesto.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                                        </svg>
                                        <p className="text-sm text-slate-500">Presupuesto vacio</p>
                                        <p className="text-xs text-slate-400 mt-1">Selecciona servicios de la tabla para agregarlos.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
                                        {listaPresupuesto.map((servicio, index) => (
                                            <div
                                                key={index}
                                                className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 hover:border-slate-300 hover:shadow-sm transition-all duration-150"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{servicio.tituloProducto}</p>
                                                    <p className="text-xs text-emerald-600 font-semibold">{formatoCLP.format(servicio.valorProducto)}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => quitarDelPresupuesto(index)}
                                                        className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                    Observacion para PDF
                                                </label>
                                                <textarea
                                                    value={servicio.observacionCotizacion || ""}
                                                    onChange={(event) => actualizarObservacionPresupuesto(index, event.target.value)}
                                                    placeholder="Ej: lugar anatomico, sesiones, diente, zona, frecuencia..."
                                                    className="mt-1 min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total</span>
                                <span className="text-xl font-bold text-slate-900">{formatoCLP.format(totalPresupuesto)}</span>
                            </div>

                            {/* Boton descargar PDF */}
                            <div className="px-5 py-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={descargarPresupuestoPDF}
                                    disabled={listaPresupuesto.length === 0}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5B47B0] transition-all duration-150 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                                    </svg>
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Servicios disponibles - columna derecha */}
                    <div className="lg:col-span-3">

                        {/* Datos del profesional y paciente */}
                        <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
                            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                                </svg>
                                <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Datos del Presupuesto</h2>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Profesional</label>
                                    <SelectDinamic
                                        value={nombreProfesional}
                                        onChange={(e) => setNombreProfesional(e.target.value)}
                                        className="rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-100"
                                        options={listaProfesionales.map(profesional => ({
                                            value: profesional.id_profesional,
                                            label: profesional.nombreProfesional
                                        }))}
                                        placeholder="Selecciona un profesional"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo del paciente</label>
                                        <InputTextDinamic
                                            value={nombrePaciente}
                                            onChange={(e) => setNombrePaciente(e.target.value)}
                                            placeholder="Ej: Andrea Varela Garrido"
                                            className="rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">RUT / DNI</label>
                                        <InputTextDinamic
                                            value={rutaPaciente}
                                            onChange={(e) => setRutaPaciente(e.target.value)}
                                            placeholder="Ej: 12345678-9"
                                            className="rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-violet-100"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Tabla de servicios */}
                        <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                                    </svg>
                                    <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Servicios Disponibles</h2>
                                </div>
                                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-bold bg-[#F3F0FF] text-[#6E56CF]">
                                    {listaServicios.length}
                                </span>
                            </div>

                            <div className="overflow-x-auto">

                                <Table>
                                    <TableCaption className="font-medium text-slate-400 text-xs py-4">Selecciona un servicio para agregarlo al presupuesto</TableCaption>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="text-left font-semibold text-slate-400 text-xs uppercase tracking-wider px-4 py-3">Servicio</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wider px-4 py-3">Valor</TableHead>
                                            <TableHead className="text-center font-semibold text-slate-400 text-xs uppercase tracking-wider px-4 py-3 w-[120px]">Accion</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {listaServicios.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-10 text-sm text-slate-400">
                                                    Cargando servicios...
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            listaServicios.map((servicio, index) => (
                                                <TableRow
                                                    key={index}
                                                    className={"hover:bg-slate-50 transition-colors duration-100 " + (index % 2 === 0 ? "bg-white" : "bg-slate-50/50")}
                                                >
                                                    <TableCell className="font-medium text-slate-800 text-sm px-4 py-3">{servicio.tituloProducto}</TableCell>
                                                    <TableCell className="text-right text-slate-600 text-sm px-4 py-3 font-mono">{formatoCLP.format(servicio.valorProducto)}</TableCell>
                                                    <TableCell className="text-center px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => generarPresupuesto(servicio)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6E56CF] rounded-lg hover:bg-[#5B47B0] transition-all duration-150 shadow-sm active:scale-[0.98]"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                                                            </svg>
                                                            Agregar
                                                        </button>
                                                    </TableCell>
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
        </div>
    );
}
