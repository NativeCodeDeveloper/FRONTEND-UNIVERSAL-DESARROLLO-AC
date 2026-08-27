"use client"

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";
import ToasterClient from "@/Componentes/ToasterClient";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import { formatCLP } from "@/lib/designTokens";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import ProgressMetricCard from "@/components/ui/progress-metric-card";
import {
    Banknote,
    CalendarCheck2,
    CalendarClock,
    ChevronDown,
    FileDown,
    FileSpreadsheet,
    Percent,
    Users,
} from "lucide-react";

const PERIODOS_EVOLUCION = [
    { label: "Últimos 6 meses", points: 6 },
    { label: "Últimos 12 meses", points: 12 },
];

dayjs.locale("es");

/**
 * Modelo financiero V1 — ver AUDITORIA_FINANZAS.md para el detalle completo.
 *
 * Ingreso reservado  = SUM(monto_reserva) de citas con estadoReserva en
 *                       {reservada, confirmada, asiste, no asiste, finalizado}
 * Ingreso confirmado = SUM(monto_reserva) de citas con estadoReserva en
 *                       {confirmada, asiste, no asiste, finalizado}
 * "anulada" y "pendiente pago" quedan fuera de ambos totales (pendiente pago
 * hasta que exista una validación real de pago — no la hay hoy en el sistema).
 * Solo se consideran reservas con estadoPeticion === 1 (excluye slots libres
 * y holds de "pago en curso" de la pasarela).
 */
const ESTADOS_INGRESO_RESERVADO = new Set(["reservada", "confirmada", "asiste", "no asiste", "finalizado"]);
const ESTADOS_INGRESO_CONFIRMADO = new Set(["confirmada", "asiste", "no asiste", "finalizado"]);

function normalizarEstado(estado = "") {
    const base = String(estado)
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
    if (base === "no asistio" || base === "no asistste") return "no asiste";
    if (base === "reservado") return "reservada";
    if (base === "confirmado") return "confirmada";
    if (base === "anulado") return "anulada";
    return base;
}

function KpiCard({ icon, label, valor, destacado }) {
    return (
        <div className={`rounded-2xl border p-4 ${destacado ? "border-slate-900 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${destacado ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                {icon}
            </div>
            <p className={`mt-3 text-[10px] font-bold uppercase tracking-[0.14em] ${destacado ? "text-white/60" : "text-slate-400"}`}>
                {label}
            </p>
            <p className={`mt-1 text-xl font-bold tracking-tight ${destacado ? "text-white" : "text-slate-900"}`}>
                {valor}
            </p>
        </div>
    );
}

export default function Finanzas() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [periodo, setPeriodo] = useState("actual"); // actual | anterior | personalizado
    const [fechaDesdeCustom, setFechaDesdeCustom] = useState("");
    const [fechaHastaCustom, setFechaHastaCustom] = useState("");

    const [distribucion, setDistribucion] = useState({}); // { [id_profesional]: pctProfesional }

    const [datosEmpresa, setDatosEmpresa] = useState(null);

    useEffect(() => {
        async function cargarDatosEmpresa() {
            try {
                const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    mode: "cors",
                    cache: "no-cache",
                });
                if (!res.ok) return;
                const data = await res.json();
                setDatosEmpresa(Array.isArray(data) ? data[0] : data);
            } catch (error) {
                console.log(error);
            }
        }
        cargarDatosEmpresa();
    }, [API]);

    useEffect(() => {
        async function cargarReservas() {
            try {
                const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) {
                    toast.error("No se pudieron cargar los datos financieros.");
                    return;
                }
                const data = await res.json();
                setReservas(Array.isArray(data) ? data : []);
            } catch (error) {
                console.log(error);
                toast.error("Error al cargar los datos financieros.");
            } finally {
                setCargando(false);
            }
        }
        cargarReservas();
    }, [API]);

    const rangoPeriodo = useMemo(() => {
        const hoy = dayjs();
        if (periodo === "anterior") {
            const mesAnterior = hoy.subtract(1, "month");
            return { desde: mesAnterior.startOf("month"), hasta: mesAnterior.endOf("month") };
        }
        if (periodo === "personalizado" && fechaDesdeCustom && fechaHastaCustom) {
            return { desde: dayjs(fechaDesdeCustom).startOf("day"), hasta: dayjs(fechaHastaCustom).endOf("day") };
        }
        return { desde: hoy.startOf("month"), hasta: hoy.endOf("month") };
    }, [periodo, fechaDesdeCustom, fechaHastaCustom]);

    const reservasValidas = useMemo(
        () => reservas.filter((r) => Number(r?.estadoPeticion) === 1),
        [reservas]
    );

    const reservasDelPeriodo = useMemo(() => {
        return reservasValidas.filter((r) => {
            const fecha = dayjs(r?.fechaInicio);
            if (!fecha.isValid()) return false;
            return !fecha.isBefore(rangoPeriodo.desde) && !fecha.isAfter(rangoPeriodo.hasta);
        });
    }, [reservasValidas, rangoPeriodo]);

    const resumen = useMemo(() => {
        let ingresoReservado = 0;
        let ingresoConfirmado = 0;
        let citasReservadas = 0;
        let citasConfirmadas = 0;

        for (const r of reservasDelPeriodo) {
            const estado = normalizarEstado(r?.estadoReserva);
            if (!ESTADOS_INGRESO_RESERVADO.has(estado)) continue; // excluye anulada, pendiente pago y estados desconocidos

            const monto = Number(r?.monto_reserva) || 0;
            ingresoReservado += monto;
            citasReservadas += 1;

            if (ESTADOS_INGRESO_CONFIRMADO.has(estado)) {
                ingresoConfirmado += monto;
                citasConfirmadas += 1;
            }
        }

        // La tasa de confirmación se mide contra TODAS las reservas del período (incluidas
        // las anuladas), no solo contra las que cuentan para el ingreso reservado — así
        // penaliza las cancelaciones en vez de excluirlas del cálculo.
        const totalReservasPeriodo = reservasDelPeriodo.length;
        const tasaConfirmacion = totalReservasPeriodo > 0 ? Math.round((citasConfirmadas / totalReservasPeriodo) * 100) : 0;

        return { ingresoReservado, ingresoConfirmado, citasReservadas, citasConfirmadas, totalReservasPeriodo, tasaConfirmacion };
    }, [reservasDelPeriodo]);

    const porProfesional = useMemo(() => {
        const mapa = new Map();

        for (const r of reservasDelPeriodo) {
            const estado = normalizarEstado(r?.estadoReserva);
            if (!ESTADOS_INGRESO_RESERVADO.has(estado)) continue;

            const idProf = String(r?.id_profesional ?? "sin-profesional");
            const nombreProf = r?.nombreProfesional || "Sin profesional asignado";

            if (!mapa.has(idProf)) {
                mapa.set(idProf, {
                    id_profesional: idProf,
                    nombreProfesional: nombreProf,
                    reservadas: 0,
                    confirmadas: 0,
                    ingresoConfirmado: 0,
                    servicios: new Map(),
                });
            }

            const entry = mapa.get(idProf);
            entry.reservadas += 1;

            if (ESTADOS_INGRESO_CONFIRMADO.has(estado)) {
                const monto = Number(r?.monto_reserva) || 0;
                entry.confirmadas += 1;
                entry.ingresoConfirmado += monto;

                const nombreServicio = (r?.motivo_reserva || "Sin especificar").trim();
                const claveServicio = nombreServicio.toLowerCase();
                if (!entry.servicios.has(claveServicio)) {
                    entry.servicios.set(claveServicio, { nombre: nombreServicio, citas: 0, total: 0 });
                }
                const svc = entry.servicios.get(claveServicio);
                svc.citas += 1;
                svc.total += monto;
            }
        }

        return Array.from(mapa.values())
            .map((p) => ({
                ...p,
                servicios: Array.from(p.servicios.values()).sort((a, b) => b.total - a.total),
            }))
            .sort((a, b) => b.ingresoConfirmado - a.ingresoConfirmado);
    }, [reservasDelPeriodo]);

    // Validación (sección 29 del prompt): la suma por profesional debe calzar exacto con el total de la clínica.
    const sumaProfesionales = porProfesional.reduce((acc, p) => acc + p.ingresoConfirmado, 0);
    const totalesCuadran = sumaProfesionales === resumen.ingresoConfirmado;

    // Siempre se calculan 12 meses; el propio ProgressMetricCard recorta a 6/12
    // según el período que elija el usuario en su selector interno.
    const evolucionPuntos = useMemo(() => {
        const hoy = dayjs();
        const meses = [];
        for (let i = 11; i >= 0; i--) {
            const mes = hoy.subtract(i, "month");
            meses.push({
                label: mes.format("MMM YYYY"),
                inicio: mes.startOf("month"),
                fin: mes.endOf("month"),
                value: 0,
            });
        }

        for (const r of reservasValidas) {
            const estado = normalizarEstado(r?.estadoReserva);
            if (!ESTADOS_INGRESO_CONFIRMADO.has(estado)) continue;

            const fecha = dayjs(r?.fechaInicio);
            if (!fecha.isValid()) continue;

            const bucket = meses.find((m) => !fecha.isBefore(m.inicio) && !fecha.isAfter(m.fin));
            if (bucket) bucket.value += Number(r?.monto_reserva) || 0;
        }

        return meses.map((m) => ({ value: m.value, date: m.label }));
    }, [reservasValidas]);

    // Profesionales únicos vistos en TODA la data (no solo el período actual), para que
    // la configuración de distribución no desaparezca al cambiar el filtro de período.
    const profesionalesUnicos = useMemo(() => {
        const mapa = new Map();
        for (const r of reservasValidas) {
            const estado = normalizarEstado(r?.estadoReserva);
            if (estado === "anulada") continue;
            const id = String(r?.id_profesional ?? "");
            if (!id || mapa.has(id)) continue;
            mapa.set(id, { id_profesional: id, nombreProfesional: r?.nombreProfesional || "Profesional" });
        }
        return Array.from(mapa.values()).sort((a, b) => a.nombreProfesional.localeCompare(b.nombreProfesional));
    }, [reservasValidas]);

    function actualizarPorcentaje(idProfesional, valor) {
        const numero = Math.max(0, Math.min(100, Number(valor) || 0));
        setDistribucion((prev) => ({ ...prev, [idProfesional]: numero }));
    }

    const periodoLabelTexto =
        periodo === "personalizado"
            ? "Rango personalizado"
            : rangoPeriodo.desde.format("MMMM YYYY").replace(/^./, (c) => c.toUpperCase());
    const rangoPeriodoTexto = `${rangoPeriodo.desde.format("DD/MM/YYYY")} — ${rangoPeriodo.hasta.format("DD/MM/YYYY")}`;

    function descargarInformeFinancieroPDF() {
        if (porProfesional.length === 0) {
            return toast.error("No hay datos financieros en el período seleccionado para exportar.");
        }

        // Las fuentes estándar de jsPDF (helvetica) solo soportan Latin-1: cualquier
        // emoji o símbolo fuera de ese rango se dibuja como glifos corruptos, así que
        // se limpia todo texto libre (nombre de empresa, profesional, servicio) antes de imprimirlo.
        function limpiarTextoPDF(texto) {
            return String(texto ?? "")
                .normalize("NFC")
                .split("")
                .filter((caracter) => caracter.charCodeAt(0) <= 255)
                .join("")
                .trim();
        }

        // Estima el alto que ocupará una tabla (cabecera + filas + pie opcional) para decidir
        // si conviene saltar de página ANTES de dibujarla completa, en vez de dejar que
        // autoTable corte una sola fila huérfana al final de la página actual.
        function altoEstimadoTabla(numFilas, { altoFila = 9.5, altoHeader = 10, conPie = false } = {}) {
            return altoHeader + numFilas * altoFila + (conPie ? 9.5 : 0);
        }

        const nombreEmpresa = limpiarTextoPDF(datosEmpresa?.empresaNombre) || "AgendaClínica";
        const contactoLinea = [datosEmpresa?.contactoDireccion, datosEmpresa?.contactoTelefono, datosEmpresa?.contactoEmail]
            .map((v) => limpiarTextoPDF(v))
            .filter(Boolean)
            .join("  ·  ");

        const documento = new jsPDF("p", "mm", "letter");
        const anchoPagina = documento.internal.pageSize.getWidth();
        const altoPagina = documento.internal.pageSize.getHeight();
        const margen = 20;
        const rightX = anchoPagina - margen;

        // Paleta clínica estándar Agenda Clínica: solo negro, grises y blanco. Sin gradientes.
        const BLACK = [15, 23, 42];
        const DARK = [51, 65, 85];
        const MID = [100, 116, 139];
        const LIGHT = [148, 163, 184];
        const BGLIGHT = [248, 250, 252];
        const BGMID = [241, 245, 249];
        const BORDE = [203, 213, 225];

        const fechaGeneracion = dayjs().format("DD/MM/YYYY HH:mm");

        function dibujarEncabezado() {
            documento.setFillColor(...BGLIGHT);
            documento.rect(0, 0, anchoPagina, 32, "F");
            documento.setDrawColor(...BORDE);
            documento.setLineWidth(0.4);
            documento.line(0, 32, anchoPagina, 32);

            // El nombre de la empresa puede ser largo: el tamaño de fuente se reduce
            // hasta que quepa sin invadir el recuadro "INFORME FINANCIERO" de la derecha.
            const tituloTexto = nombreEmpresa.toUpperCase();
            const anchoDisponibleTitulo = rightX - 65 - margen;
            documento.setFont("helvetica", "bold");
            let tamanoTitulo = 16;
            documento.setFontSize(tamanoTitulo);
            while (tamanoTitulo > 10 && documento.getTextWidth(tituloTexto) > anchoDisponibleTitulo) {
                tamanoTitulo -= 0.5;
                documento.setFontSize(tamanoTitulo);
            }
            documento.setTextColor(...BLACK);
            documento.text(tituloTexto, margen, 14);

            documento.setFont("helvetica", "italic");
            documento.setFontSize(7.5);
            documento.setTextColor(...MID);
            documento.text("AgendaClínica — Healthcare Information System", margen, 20);

            documento.setFont("helvetica", "normal");
            documento.setFontSize(7.5);
            documento.text(contactoLinea || "Centro de Atención Clínica", margen, 25);

            documento.setFillColor(...BGMID);
            documento.roundedRect(rightX - 60, 6, 60, 20, 1, 1, "F");
            documento.setFont("helvetica", "bold");
            documento.setFontSize(8);
            documento.setTextColor(...BLACK);
            documento.text("INFORME FINANCIERO", rightX - 30, 14, { align: "center" });
            documento.setFont("helvetica", "normal");
            documento.setFontSize(7);
            documento.setTextColor(...MID);
            documento.text(periodoLabelTexto, rightX - 30, 20, { align: "center" });
        }

        function dibujarPiePagina() {
            const posicionPie = altoPagina - 12;
            documento.setDrawColor(...BORDE);
            documento.setLineWidth(0.3);
            documento.line(margen, posicionPie - 4, rightX, posicionPie - 4);
            documento.setFont("helvetica", "normal");
            documento.setFontSize(6.5);
            documento.setTextColor(...LIGHT);
            documento.text(`Generado por AgendaClínica | ${nombreEmpresa}`, margen, posicionPie);
            documento.text(`Emitido: ${fechaGeneracion}`, rightX, posicionPie, { align: "right" });
        }

        dibujarEncabezado();

        let y = 42;
        documento.setFillColor(...BGMID);
        documento.roundedRect(margen, y, rightX - margen, 20, 1, 1, "F");
        documento.setDrawColor(...BORDE);
        documento.setLineWidth(0.3);
        documento.roundedRect(margen, y, rightX - margen, 20, 1, 1, "S");

        documento.setFont("helvetica", "bold");
        documento.setFontSize(6.5);
        documento.setTextColor(...MID);
        documento.text("PERÍODO DEL INFORME", margen + 5, y + 8);
        documento.setFont("helvetica", "normal");
        documento.setFontSize(10);
        documento.setTextColor(...BLACK);
        documento.text(`${periodoLabelTexto}  ·  ${rangoPeriodoTexto}`, margen + 5, y + 15);

        y += 28;

        documento.setFont("helvetica", "bold");
        documento.setFontSize(10);
        documento.setTextColor(...BLACK);
        documento.text("Resumen general", margen, y);
        y += 4;

        autoTable(documento, {
            head: [["Indicador", "Valor"]],
            body: [
                ["Ingreso reservado", formatCLP(resumen.ingresoReservado)],
                ["Ingreso confirmado", formatCLP(resumen.ingresoConfirmado)],
                ["Citas reservadas", String(resumen.citasReservadas)],
                ["Citas confirmadas", String(resumen.citasConfirmadas)],
                ["Tasa de confirmación", `${resumen.tasaConfirmacion}%`],
            ],
            startY: y,
            margin: { left: margen, right: margen, bottom: 26 },
            theme: "plain",
            headStyles: {
                fillColor: DARK,
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7.5,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                halign: "left",
            },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: "auto", halign: "right", fontStyle: "bold" },
            },
            bodyStyles: { fontSize: 9, cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 }, textColor: BLACK },
            alternateRowStyles: { fillColor: BGLIGHT },
            styles: { lineWidth: 0.15, lineColor: BORDE, overflow: "linebreak" },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) dibujarEncabezado();
                dibujarPiePagina();
            },
        });

        let finalY = documento.lastAutoTable.finalY + 10;

        const altoRendimiento =
            4 + altoEstimadoTabla(porProfesional.length, { altoFila: 9.5, altoHeader: 10, conPie: true });
        if (finalY + altoRendimiento > altoPagina - 30) {
            documento.addPage();
            dibujarEncabezado();
            finalY = 42;
        }

        documento.setFont("helvetica", "bold");
        documento.setFontSize(10);
        documento.setTextColor(...BLACK);
        documento.text("Rendimiento por profesional", margen, finalY);
        finalY += 4;

        autoTable(documento, {
            head: [["Profesional", "Reservadas", "Confirmadas", "Ingreso confirmado"]],
            body: porProfesional.map((p) => [
                limpiarTextoPDF(p.nombreProfesional),
                String(p.reservadas),
                String(p.confirmadas),
                formatCLP(p.ingresoConfirmado),
            ]),
            foot: [["Total", "", "", formatCLP(resumen.ingresoConfirmado)]],
            startY: finalY,
            margin: { left: margen, right: margen, bottom: 26 },
            theme: "plain",
            headStyles: {
                fillColor: DARK,
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7.5,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                halign: "left",
            },
            footStyles: {
                fillColor: BGMID,
                textColor: BLACK,
                fontStyle: "bold",
                fontSize: 8.5,
                cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
            },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 30, halign: "center", textColor: MID },
                2: { cellWidth: 30, halign: "center", textColor: MID },
                3: { cellWidth: "auto", halign: "right", fontStyle: "bold" },
            },
            bodyStyles: { fontSize: 9, cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 }, textColor: BLACK },
            alternateRowStyles: { fillColor: BGLIGHT },
            styles: { lineWidth: 0.15, lineColor: BORDE, overflow: "linebreak" },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) dibujarEncabezado();
                dibujarPiePagina();
            },
        });

        finalY = documento.lastAutoTable.finalY + 10;

        const filasServicios = porProfesional.flatMap((p) =>
            p.servicios.map((s) => [
                limpiarTextoPDF(p.nombreProfesional),
                limpiarTextoPDF(s.nombre),
                String(s.citas),
                formatCLP(s.total),
            ])
        );

        if (filasServicios.length > 0) {
            const altoDetalle = 4 + altoEstimadoTabla(filasServicios.length, { altoFila: 10, altoHeader: 11 });
            if (finalY + altoDetalle > altoPagina - 30) {
                documento.addPage();
                dibujarEncabezado();
                finalY = 42;
            }

            documento.setFont("helvetica", "bold");
            documento.setFontSize(10);
            documento.setTextColor(...BLACK);
            documento.text("Detalle por servicio", margen, finalY);
            finalY += 4;

            autoTable(documento, {
                head: [["Profesional", "Servicio", "Citas", "Total"]],
                body: filasServicios,
                startY: finalY,
                margin: { left: margen, right: margen, bottom: 26 },
                theme: "plain",
                headStyles: {
                    fillColor: DARK,
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 7.5,
                    cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                    halign: "left",
                },
                columnStyles: {
                    0: { cellWidth: 55 },
                    1: { cellWidth: 65 },
                    2: { cellWidth: 20, halign: "center", textColor: MID },
                    3: { cellWidth: "auto", halign: "right", fontStyle: "bold" },
                },
                bodyStyles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }, textColor: BLACK },
                alternateRowStyles: { fillColor: BGLIGHT },
                styles: { lineWidth: 0.15, lineColor: BORDE, overflow: "linebreak" },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1) dibujarEncabezado();
                    dibujarPiePagina();
                },
            });
        }

        const sufijoArchivo = periodo === "personalizado" ? `${fechaDesdeCustom}_a_${fechaHastaCustom}` : periodo;
        documento.save(`informe-financiero-${sufijoArchivo}.pdf`);
    }

    function exportarFinanzasExcel() {
        if (porProfesional.length === 0) {
            return toast.error("No hay datos financieros en el período seleccionado para exportar.");
        }

        const hojaResumen = XLSX.utils.json_to_sheet([
            { Indicador: "Período", Valor: `${periodoLabelTexto} (${rangoPeriodoTexto})` },
            { Indicador: "Ingreso reservado", Valor: resumen.ingresoReservado },
            { Indicador: "Ingreso confirmado", Valor: resumen.ingresoConfirmado },
            { Indicador: "Citas reservadas", Valor: resumen.citasReservadas },
            { Indicador: "Citas confirmadas", Valor: resumen.citasConfirmadas },
            { Indicador: "Tasa de confirmación (%)", Valor: resumen.tasaConfirmacion },
        ]);
        hojaResumen["!cols"] = [{ wch: 26 }, { wch: 28 }];

        const hojaProfesionales = XLSX.utils.json_to_sheet(
            porProfesional.map((p) => ({
                Profesional: p.nombreProfesional,
                "Citas reservadas": p.reservadas,
                "Citas confirmadas": p.confirmadas,
                "Ingreso confirmado (CLP)": p.ingresoConfirmado,
            }))
        );
        hojaProfesionales["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 20 }];

        const hojaServicios = XLSX.utils.json_to_sheet(
            porProfesional.flatMap((p) =>
                p.servicios.map((s) => ({
                    Profesional: p.nombreProfesional,
                    Servicio: s.nombre,
                    Citas: s.citas,
                    "Total (CLP)": s.total,
                }))
            )
        );
        hojaServicios["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 16 }];

        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");
        XLSX.utils.book_append_sheet(libro, hojaProfesionales, "Por profesional");
        XLSX.utils.book_append_sheet(libro, hojaServicios, "Detalle por servicio");

        const sufijoArchivo = periodo === "personalizado" ? `${fechaDesdeCustom}_a_${fechaHastaCustom}` : periodo;
        XLSX.writeFile(libro, `finanzas-${sufijoArchivo}.xlsx`);
        toast.success("Archivo Excel exportado correctamente.");
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

                {/* ── Header + selector de período ── */}
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Finanzas</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Resumen financiero</h1>
                        <p className="mt-1 text-[13px] text-slate-500">
                            Ingresos generados a partir de tus citas y servicios.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="inline-flex w-full items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:w-auto">
                            {[
                                { id: "actual", label: "Mes actual" },
                                { id: "anterior", label: "Mes anterior" },
                                { id: "personalizado", label: "Rango personalizado" },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setPeriodo(opt.id)}
                                    className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all sm:flex-none ${
                                        periodo === opt.id
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {periodo === "personalizado" && (
                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 [&_[data-slot=button]]:h-9 [&_[data-slot=label]]:hidden">
                                <ShadcnDatePicker label="" value={fechaDesdeCustom} onChange={setFechaDesdeCustom} />
                                <ShadcnDatePicker label="" value={fechaHastaCustom} onChange={setFechaHastaCustom} />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={descargarInformeFinancieroPDF}
                                disabled={cargando || porProfesional.length === 0}
                                className="h-9 flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                                title="Descargar informe en PDF"
                            >
                                <FileDown className="h-3.5 w-3.5" />
                                Descargar PDF
                            </button>
                            <button
                                type="button"
                                onClick={exportarFinanzasExcel}
                                disabled={cargando || porProfesional.length === 0}
                                className="h-9 flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                                title="Exportar a Excel"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                Exportar Excel
                            </button>
                        </div>
                    </div>
                </div>

                {cargando ? (
                    <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                        Cargando datos financieros...
                    </div>
                ) : (
                    <>
                        {/* ── Resumen ── */}
                        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
                            <KpiCard
                                icon={<CalendarClock className="h-4 w-4" />}
                                label="Ingreso reservado"
                                valor={formatCLP(resumen.ingresoReservado)}
                            />
                            <KpiCard
                                icon={<Banknote className="h-4 w-4" />}
                                label="Ingreso confirmado"
                                valor={formatCLP(resumen.ingresoConfirmado)}
                                destacado
                            />
                            <KpiCard
                                icon={<CalendarClock className="h-4 w-4" />}
                                label="Citas reservadas"
                                valor={resumen.citasReservadas}
                            />
                            <KpiCard
                                icon={<CalendarCheck2 className="h-4 w-4" />}
                                label="Citas confirmadas"
                                valor={resumen.citasConfirmadas}
                            />
                            <KpiCard
                                icon={<Percent className="h-4 w-4" />}
                                label="Tasa de confirmación"
                                valor={`${resumen.tasaConfirmacion}%`}
                            />
                        </section>

                        {/* ── Evolución ── */}
                        <section className="mb-8">
                            <ProgressMetricCard
                                title="Evolución de ingresos confirmados"
                                data={evolucionPuntos}
                                periodOptions={PERIODOS_EVOLUCION}
                                period="Últimos 6 meses"
                                deltaLabel="vs. mes anterior"
                                valueFormatter={formatCLP}
                                dateFormatter={(d) => d}
                                size="sm"
                            />
                        </section>

                        {/* ── Rendimiento por profesional ── */}
                        <section className="mb-8 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">Rendimiento por profesional</h2>
                                        <p className="text-[11px] text-slate-400">Toca una fila para ver el detalle por servicio.</p>
                                    </div>
                                </div>
                                {porProfesional.length > 0 && (
                                    <span className={`text-[10px] font-semibold ${totalesCuadran ? "text-emerald-600" : "text-rose-600"}`}>
                                        {totalesCuadran ? "✓ Cuadra con el total" : "⚠ No cuadra con el total"}
                                    </span>
                                )}
                            </div>

                            {porProfesional.length === 0 ? (
                                <div className="p-10 text-center text-sm text-slate-400">
                                    No hay citas válidas en el período seleccionado.
                                </div>
                            ) : (
                                <Accordion type="single" collapsible className="divide-y divide-slate-100">
                                    {porProfesional.map((p) => (
                                        <AccordionItem key={p.id_profesional} value={p.id_profesional} className="border-0">
                                            <AccordionTrigger className="px-5 py-4 no-underline hover:no-underline sm:px-6">
                                                <div className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 pr-2 text-left sm:grid-cols-[2fr_1fr_1fr_1fr]">
                                                    <span className="truncate text-[13px] font-semibold text-slate-800">
                                                        {p.nombreProfesional}
                                                    </span>
                                                    <span className="text-right text-[12px] text-slate-500 sm:text-center">
                                                        {p.reservadas} <span className="hidden sm:inline">reservadas</span>
                                                    </span>
                                                    <span className="text-right text-[12px] text-slate-500 sm:text-center">
                                                        {p.confirmadas} <span className="hidden sm:inline">confirmadas</span>
                                                    </span>
                                                    <span className="text-right text-[13px] font-bold text-slate-900">
                                                        {formatCLP(p.ingresoConfirmado)}
                                                    </span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="bg-slate-50/60 px-5 pb-4 sm:px-6">
                                                {p.servicios.length === 0 ? (
                                                    <p className="py-2 text-[12px] text-slate-400">Sin citas confirmadas en este período.</p>
                                                ) : (
                                                    <div className="flex flex-col divide-y divide-slate-200">
                                                        {p.servicios.map((s) => (
                                                            <div key={s.nombre} className="flex items-center justify-between py-2.5">
                                                                <div>
                                                                    <p className="text-[12px] font-semibold text-slate-700">{s.nombre}</p>
                                                                    <p className="text-[11px] text-slate-400">{s.citas} {s.citas === 1 ? "cita" : "citas"}</p>
                                                                </div>
                                                                <p className="text-[12px] font-bold text-slate-800">{formatCLP(s.total)}</p>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center justify-between pt-2.5">
                                                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</p>
                                                            <p className="text-[13px] font-bold text-slate-900">{formatCLP(p.ingresoConfirmado)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </section>

                        {/* ── Distribución de ingresos ── */}
                        <details className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                        <Percent className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">Distribución de ingresos</h2>
                                        <p className="text-[11px] text-slate-400">Configura el % que le corresponde a cada profesional.</p>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                            </summary>

                            <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] leading-5 text-amber-800">
                                    Vista previa: esta configuración todavía no se guarda — falta conectar el backend
                                    (ver <span className="font-mono">AUDITORIA_FINANZAS.md</span>, sección 3.3). Los porcentajes que
                                    ingreses acá se pierden al recargar la página.
                                </div>

                                {profesionalesUnicos.length === 0 ? (
                                    <p className="py-2 text-[12px] text-slate-400">No hay profesionales con citas registradas.</p>
                                ) : (
                                    <div className="flex flex-col divide-y divide-slate-100">
                                        {profesionalesUnicos.map((p) => {
                                            const pctProfesional = distribucion[p.id_profesional] ?? 70;
                                            const pctClinica = 100 - pctProfesional;
                                            const ingresoProf = porProfesional.find((x) => x.id_profesional === p.id_profesional)?.ingresoConfirmado ?? 0;
                                            const montoProfesional = Math.round((ingresoProf * pctProfesional) / 100);
                                            const montoClinica = ingresoProf - montoProfesional;

                                            return (
                                                <div key={p.id_profesional} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-[13px] font-semibold text-slate-800">{p.nombreProfesional}</span>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[11px] font-medium text-slate-500">Profesional</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={pctProfesional}
                                                                onChange={(e) => actualizarPorcentaje(p.id_profesional, e.target.value)}
                                                                className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-slate-400"
                                                            />
                                                            <span className="text-[11px] text-slate-400">%</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[11px] font-medium text-slate-500">Clínica</label>
                                                            <span className="flex h-8 w-16 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500">
                                                                {pctClinica}%
                                                            </span>
                                                        </div>
                                                        <div className="text-right text-[11px] text-slate-500">
                                                            {formatCLP(montoProfesional)} <span className="text-slate-300">/</span> {formatCLP(montoClinica)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </details>
                    </>
                )}
            </div>
        </div>
    );
}
