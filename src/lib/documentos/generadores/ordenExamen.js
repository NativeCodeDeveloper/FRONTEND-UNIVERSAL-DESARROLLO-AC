/* Orden de exámenes clínicos, con el motor de documentos.
 *
 * Contenido: título, ficha del paciente y del profesional solicitante,
 * exámenes numerados en dos columnas, indicaciones y el pie de firma FES o
 * manuscrito según `modo`. */

import { crearDocumento, PALETA } from "../motorDocumento";
import { formatRut } from "@/lib/designTokens";

/**
 * @param {object} p
 * @param {"fes"|"manuscrita"} p.modo
 * @param {boolean} p.borrador
 * @param {object} p.empresa
 * @param {{nombre:string, rut:string}} p.paciente
 * @param {{nombre,rut,especialidad,registroSis}} p.profesional
 * @param {Array<{nombre_examen:string}>} p.examenes
 * @param {string} p.fechaEmisionTexto
 * @param {string} [p.indicaciones]  texto libre opcional (ayuno, preparación…)
 */
export function generarOrdenExamenPdf({ modo, borrador, empresa, paciente, profesional, examenes, fechaEmisionTexto, indicaciones }) {
  const motor = crearDocumento({ empresa, tipoDocumento: "Orden de exámenes", fechaEmision: fechaEmisionTexto, borrador });

  motor.titulo("Orden de exámenes", `${examenes.length} ${examenes.length === 1 ? "examen solicitado" : "exámenes solicitados"}`);

  motor.cajaDatos([
    [
      { rotulo: "Paciente", valor: paciente.nombre, completo: true },
      { rotulo: "RUT / Documento", valor: formatRut(String(paciente.rut ?? "").trim()) || paciente.rut },
      { rotulo: "Fecha de emisión", valor: fechaEmisionTexto },
    ],
    [
      { rotulo: "Profesional solicitante", valor: profesional.nombre, completo: true },
      { rotulo: "RUT", valor: profesional.rut },
      { rotulo: "Registro SIS", valor: profesional.registroSis ? `N° ${profesional.registroSis}` : "" },
      { rotulo: "Profesión / Especialidad", valor: profesional.especialidad, completo: true },
    ],
  ]);

  motor.seccion("Exámenes solicitados", { numero: 1 });
  // Dos columnas, numeradas de arriba hacia abajo en cada columna.
  const mitad = Math.ceil(examenes.length / 2);
  const celda = (i) => (examenes[i] ? `${i + 1}.  ${examenes[i].nombre_examen || "—"}` : "");
  const filas = Array.from({ length: mitad }, (_, i) => [celda(i), celda(i + mitad)]);
  motor.tabla({
    showHead: "never",
    body: filas,
    columnStyles: { 0: { cellWidth: motor.anchoUtil / 2 }, 1: { cellWidth: motor.anchoUtil / 2 } },
    bodyStyles: { fontSize: 9, textColor: PALETA.negro, cellPadding: { top: 3.2, bottom: 3.2, left: 2, right: 4 }, lineWidth: { bottom: 0.2 }, lineColor: PALETA.filete },
  });

  if (indicaciones?.trim()) {
    motor.seccion("Indicaciones", { numero: 2 });
    motor.parrafo(indicaciones.trim(), { justificar: true });
  }

  motor.notas([
    "Presente esta orden en el laboratorio o centro de toma de muestras junto a su cédula de identidad.",
    "Consulte en el laboratorio las condiciones de preparación de cada examen (ayuno, horario, suspensión de medicamentos).",
  ]);

  motor.zonaFirma({ modo, profesional });
  return motor.finalizar();
}
