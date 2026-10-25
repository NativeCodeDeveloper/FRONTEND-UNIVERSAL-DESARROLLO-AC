/* Recetas, con el motor de documentos.
 *
 * Las recetas se firman SIEMPRE de puño y letra (ImpresionManuscrita): para su
 * dispensación en farmacia la normativa exige firma electrónica avanzada, que la
 * plataforma no emite. Por eso aquí no hay modo "fes".
 *
 *  - generarRecetaPdf: receta médica (receta rápida y receta desde la carpeta
 *    del paciente).
 *  - generarRecetaLentesPdf: receta óptica en media carta (A5).
 */

import { crearDocumento, PALETA } from "../motorDocumento";
import { MODOS_FIRMA } from "../zonaFirma";

const texto = (valor) => String(valor ?? "").trim();

/**
 * @param {object} p
 * @param {object} p.empresa
 * @param {string} [p.folio]                 "Ficha N° 120"
 * @param {{nombre, documento, nacimiento?, edad?, prevision?}} p.paciente
 * @param {{nombre,rut,especialidad,registroSis}} p.profesional
 * @param {string} p.fechaEmisionTexto
 * @param {string} [p.fechaCaducidadTexto]
 * @param {string} [p.diagnostico]
 * @param {string} p.indicaciones            texto libre, respeta los saltos de línea
 */
export function generarRecetaPdf({ empresa, folio = "", paciente, profesional, fechaEmisionTexto, fechaCaducidadTexto, diagnostico, indicaciones }) {
  const motor = crearDocumento({ empresa, tipoDocumento: "Receta médica", folio, fechaEmision: fechaEmisionTexto });

  motor.titulo("Receta médica", fechaCaducidadTexto ? `Válida hasta el ${fechaCaducidadTexto}` : "");

  const datosPaciente = [
    { rotulo: "Paciente", valor: paciente.nombre, completo: true },
    { rotulo: "RUT / Documento", valor: paciente.documento },
    { rotulo: "Fecha de emisión", valor: fechaEmisionTexto },
  ];
  if (texto(paciente.nacimiento) || texto(paciente.edad)) {
    datosPaciente.push({ rotulo: "Nacimiento", valor: paciente.nacimiento }, { rotulo: "Edad", valor: paciente.edad });
  }
  if (texto(paciente.prevision)) datosPaciente.push({ rotulo: "Previsión", valor: paciente.prevision, completo: true });

  motor.cajaDatos([
    datosPaciente,
    [
      { rotulo: "Profesional", valor: profesional.nombre, completo: true },
      { rotulo: "RUT", valor: profesional.rut },
      { rotulo: "Registro SIS", valor: profesional.registroSis ? `N° ${profesional.registroSis}` : "" },
      { rotulo: "Profesión / Especialidad", valor: profesional.especialidad, completo: true },
    ],
  ]);

  let numero = 0;
  if (texto(diagnostico)) {
    motor.seccion("Diagnóstico", { numero: ++numero });
    motor.parrafo(texto(diagnostico), { justificar: true });
  }

  motor.seccion("Prescripción e indicaciones", { numero: ++numero });
  motor.parrafo("Rp.", { estilo: "bold", color: PALETA.negro, tamano: 11 });
  motor.parrafo(texto(indicaciones), { tamano: 10, color: PALETA.negro, sangria: 4 });

  motor.notas([
    "Receta válida solo con la firma y el timbre del profesional.",
    ...(fechaCaducidadTexto ? [`Esta receta vence el ${fechaCaducidadTexto}.`] : []),
  ]);

  motor.zonaFirma({ modo: MODOS_FIRMA.MANUSCRITA, profesional });
  return motor.finalizar();
}

/**
 * @param {object} p
 * @param {object} p.empresa
 * @param {{nombre, documento}} p.paciente
 * @param {{nombre,rut,especialidad,registroSis}} p.profesional
 * @param {string} p.fechaEmisionTexto
 * @param {{od:{esf,cyl,eje}, oi:{esf,cyl,eje}}} p.lejos
 * @param {{od:{esf,cyl,eje}, oi:{esf,cyl,eje}}} p.cerca
 * @param {string} [p.dpLejos]
 * @param {string} [p.dpCerca]
 * @param {string} [p.adicion]
 * @param {string} [p.observaciones]
 */
export function generarRecetaLentesPdf({ empresa, paciente, profesional, fechaEmisionTexto, lejos, cerca, dpLejos, dpCerca, adicion, observaciones }) {
  const motor = crearDocumento({ empresa, tipoDocumento: "Receta óptica", fechaEmision: fechaEmisionTexto, formato: "a5" });

  // Media carta: todo en una sola página (ficha en dos columnas y una tabla).
  motor.cajaDatos([
    [
      { rotulo: "Paciente", valor: paciente.nombre, completo: true },
      { rotulo: "RUT", valor: paciente.documento },
      { rotulo: "Fecha", valor: fechaEmisionTexto },
    ],
    [
      { rotulo: "Profesional", valor: profesional.nombre, completo: true },
      { rotulo: "RUT", valor: profesional.rut },
      { rotulo: "Registro SIS", valor: profesional.registroSis },
      { rotulo: "Especialidad", valor: profesional.especialidad, completo: true },
    ],
  ]);

  const v = (x) => texto(x) || "—";
  const fila = (grupo, ojo, valores) => [grupo, ojo, v(valores?.esf), v(valores?.cyl), v(valores?.eje)];
  motor.tabla({
    head: [["", "", "Esfera", "Cilindro", "Eje"]],
    body: [
      fila("Lejos", "OD", lejos?.od),
      fila("", "OI", lejos?.oi),
      fila("Cerca", "OD", cerca?.od),
      fila("", "OI", cerca?.oi),
    ],
    styles: { halign: "center", overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 20, halign: "left", textColor: PALETA.medio, fontStyle: "normal", fontSize: 8 },
      1: { cellWidth: 14, textColor: PALETA.medio },
    },
    bodyStyles: { fontSize: 9.5, fontStyle: "bold", textColor: PALETA.negro, cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 }, lineWidth: { bottom: 0.2 }, lineColor: PALETA.filete },
  });

  const medidas = [["DP lejos", dpLejos], ["DP cerca", dpCerca], ["Adición", adicion]].filter(([, valor]) => texto(valor));
  if (medidas.length) {
    motor.parrafo(medidas.map(([rotulo, valor]) => `${rotulo}: ${texto(valor)}`).join("        "), { tamano: 8.8, color: PALETA.negro });
  }

  if (texto(observaciones)) {
    motor.subseccion("Observaciones");
    motor.parrafo(texto(observaciones), { tamano: 8.5, justificar: true });
  }

  motor.zonaFirma({ modo: MODOS_FIRMA.MANUSCRITA, profesional });
  return motor.finalizar();
}
