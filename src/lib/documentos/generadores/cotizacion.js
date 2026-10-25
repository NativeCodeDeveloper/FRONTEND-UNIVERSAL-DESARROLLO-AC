/* Documentos valorizados (cotización y presupuesto), con el motor de documentos.
 *
 * Contenido: título, ficha del paciente y del profesional, detalle de
 * prestaciones, totales y condiciones. El motor mide cada bloque y salta de
 * página cuando hace falta. El pie de firma lo decide `modo`:
 *   - "fes": zona en blanco que el servidor completa al firmar.
 *   - "manuscrita": líneas de firma del paciente y del profesional.
 */

import { crearDocumento, PALETA } from "../motorDocumento";
import { formatRut } from "@/lib/designTokens";

export function formatearMonto(valor) {
  const numero = Number(valor) || 0;
  return `$${numero.toLocaleString("es-CL")}`;
}

/**
 * @param {object} p
 * @param {"fes"|"manuscrita"} p.modo
 * @param {boolean} p.borrador
 * @param {string} p.rotulo        "Cotización clínica" | "Presupuesto de tratamiento"
 * @param {string} p.folio         "N° 48"
 * @param {object} p.empresa       fila de datos_empresa
 * @param {{nombre:string, rut:string}} p.paciente
 * @param {Array<{servicio:string, observacion?:string, valor:number}>} p.items
 * @param {{total:number, abono?:number, saldo?:number}} p.totales
 * @param {{nombre,rut,especialidad,registroSis}} p.profesional
 * @param {string} p.fechaEmisionTexto
 * @param {string} [p.vigencia]    texto de la nota de vigencia
 */
export function generarDocumentoValorizadoPdf({ modo, borrador, rotulo, folio, empresa, paciente, items, totales, profesional, fechaEmisionTexto, vigencia }) {
  const motor = crearDocumento({ empresa, tipoDocumento: rotulo, folio, fechaEmision: fechaEmisionTexto, borrador });

  motor.titulo(rotulo);

  motor.cajaDatos([
    [
      { rotulo: "Paciente", valor: paciente.nombre, completo: true },
      { rotulo: "RUT / Documento", valor: formatRut(String(paciente.rut ?? "").trim()) || paciente.rut },
      { rotulo: "Fecha de emisión", valor: fechaEmisionTexto },
    ],
    [
      { rotulo: "Profesional responsable", valor: profesional.nombre, completo: true },
      { rotulo: "RUT", valor: profesional.rut },
      { rotulo: "Registro SIS", valor: profesional.registroSis ? `N° ${profesional.registroSis}` : "" },
      { rotulo: "Profesión / Especialidad", valor: profesional.especialidad, completo: true },
    ],
  ]);

  motor.seccion("Detalle de prestaciones", { numero: 1 });
  motor.tabla({
    head: [["#", "Prestación", "Observación", "Valor"]],
    body: items.map((item, i) => [String(i + 1), item.servicio, item.observacion?.trim() || "—", formatearMonto(item.valor)]),
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: PALETA.medio, cellPadding: { top: 3, bottom: 3, left: 1, right: 1 } },
      1: { cellWidth: 72 },
      2: { cellWidth: "auto", textColor: PALETA.oscuro },
      3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 3) data.cell.styles.halign = "right";
      if (data.section === "head" && data.column.index === 0) data.cell.styles.halign = "center";
    },
  });

  const hayAbono = Number(totales.abono) > 0;
  motor.totales(
    hayAbono
      ? [
          { etiqueta: "Subtotal", valor: formatearMonto(totales.total) },
          { etiqueta: "Abono del paciente", valor: `- ${formatearMonto(totales.abono)}` },
          { etiqueta: "Saldo pendiente", valor: formatearMonto(totales.saldo), destacado: true },
        ]
      : [{ etiqueta: "Total", valor: formatearMonto(totales.total), destacado: true }]
  );

  motor.seccion("Condiciones", { numero: 2 });
  motor.notas([
    "Valores expresados en pesos chilenos (CLP), con impuestos incluidos cuando corresponda.",
    vigencia || "Este documento tiene una vigencia de 30 días desde su fecha de emisión.",
    "Los valores pueden variar si cambia el plan de tratamiento; cualquier cambio se informará antes de realizarlo.",
    "Antes de cada procedimiento el profesional le pedirá su consentimiento informado específico.",
  ]);

  motor.zonaFirma({ modo, profesional, firmaPaciente: { nombre: paciente.nombre, rotulo: "Firma del paciente · Acepto" } });
  return motor.finalizar();
}

/** Cotización clínica (detalleCotizacion). */
export function generarCotizacionPdf({ modo, borrador, empresa, cotizacion, detalle, totales, profesional, fechaEmisionTexto }) {
  return generarDocumentoValorizadoPdf({
    modo,
    borrador,
    rotulo: "Cotización clínica",
    folio: `N° ${cotizacion.id_cotizacion_paciente}`,
    empresa,
    paciente: { nombre: `${cotizacion.nombre ?? ""} ${cotizacion.apellido ?? ""}`.trim(), rut: cotizacion.rut },
    items: detalle.map((fila) => ({
      servicio: fila.producto_servicio_cotizado,
      observacion: fila.observacion_producto_cotizado,
      valor: fila.valor_producto_cotizado,
    })),
    totales,
    profesional,
    fechaEmisionTexto,
    vigencia: "Esta cotización tiene una vigencia de 30 días desde su fecha de emisión.",
  });
}
