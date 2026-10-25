/* Ficha clínica del paciente, con el motor de documentos.
 *
 * Contenido: identificación clínica, datos de contacto y contenido de la ficha
 * (campos de la plantilla agrupados por categoría + campos clásicos). La
 * pantalla arma las filas (conoce el formato de datosDinamicos); aquí solo se
 * diagraman. */

import { crearDocumento, PALETA } from "../motorDocumento";

/**
 * @param {object} p
 * @param {"fes"|"manuscrita"} p.modo
 * @param {boolean} p.borrador
 * @param {object} p.empresa
 * @param {string} p.titulo              tipo de ficha (plantilla o tipo de atención)
 * @param {string|number} p.idFicha
 * @param {Array<{rotulo:string, valor:string, completo?:boolean}>} p.identificacion
 * @param {Array<[string,string]>} p.contacto
 * @param {Array<{rotulo:string, valor:string, categoria?:boolean}>} p.contenido
 * @param {{nombre,rut,especialidad,registroSis}} p.profesional
 * @param {string} p.fechaEmisionTexto
 */
export function generarFichaClinicaPdf({ modo, borrador, empresa, titulo, idFicha, identificacion, contacto, contenido, profesional, fechaEmisionTexto }) {
  const motor = crearDocumento({ empresa, tipoDocumento: "Ficha clínica", folio: `Ficha N° ${idFicha}`, fechaEmision: fechaEmisionTexto, borrador });

  motor.titulo("Ficha clínica", titulo);

  // Identificación en dos columnas, repartida en orden.
  const mitad = Math.ceil(identificacion.length / 2);
  motor.cajaDatos([identificacion.slice(0, mitad), identificacion.slice(mitad)]);

  let numero = 0;
  if (contacto.length) {
    motor.seccion("Datos de contacto", { numero: ++numero });
    motor.tabla({
      showHead: "never",
      body: contacto,
      columnStyles: { 0: { cellWidth: 50, textColor: PALETA.medio }, 1: { cellWidth: "auto" } },
    });
  }

  motor.seccion("Registro clínico", { numero: ++numero });
  const filas = contenido.length ? contenido : [{ rotulo: "Sin datos clínicos registrados", valor: "—" }];
  motor.tabla({
    showHead: "never",
    // Las filas de categoría (separadores de la plantilla) ocupan todo el ancho.
    body: filas.map((f) =>
      f.categoria
        ? [{ content: String(f.rotulo).toUpperCase(), colSpan: 2, styles: { fillColor: PALETA.fondoMedio, textColor: PALETA.medio, fontStyle: "bold", fontSize: 7.3, cellPadding: { top: 3, bottom: 3, left: 3.5, right: 3.5 } } }]
        : [f.rotulo, f.valor]
    ),
    columnStyles: { 0: { cellWidth: 55, textColor: PALETA.medio }, 1: { cellWidth: "auto" } },
  });

  motor.zonaFirma({ modo, profesional });
  return motor.finalizar();
}
