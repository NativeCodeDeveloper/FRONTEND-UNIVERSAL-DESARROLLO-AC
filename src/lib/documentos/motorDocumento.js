/* Motor de diagramación de los documentos clínicos (jsPDF).
 *
 * Por qué existe: cada PDF de la plataforma calculaba sus posiciones a mano, y
 * con un nombre largo, una especialidad de dos líneas o una tabla que cruzaba
 * de página, los textos terminaban montados unos sobre otros. Aquí cada bloque
 * MIDE su alto antes de dibujarse; si no cabe en lo que queda de la página,
 * salta de página primero. El encabezado y el pie se repiten solos.
 *
 * Lenguaje visual (igual en los 8 documentos): fondo blanco, una sola línea fina
 * bajo el encabezado, jerarquía por tamaño y peso (no por cajas oscuras), texto
 * justificado en los documentos de lectura y un único color de acento.
 *
 *   const motor = crearDocumento({ empresa, tipoDocumento: "Cotización", folio: "N° 48" });
 *   motor.titulo("Cotización clínica", "Tratamiento de ortodoncia");
 *   motor.cajaDatos([...]);
 *   motor.seccion("Detalle", { numero: 1 });
 *   motor.tabla({ head, body, columnStyles });
 *   motor.zonaFirma({ modo: "fes" | "manuscrita", profesional });
 *   const { blob, paginas, zonaFirma, zonaPaciente } = motor.finalizar();
 *
 * La zona de firma es SIEMPRE el último bloque. En modo "fes" queda en blanco:
 * el servidor estampa ahí la grafía, la leyenda y el QR (docs/firma/03 §5.6).
 */

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { dibujarBloqueFirma, altoBloqueFirma } from "@/lib/pdfFirma";
import { ZONA_FIRMA, ZONA_PACIENTE, MODOS_FIRMA } from "./zonaFirma";

export const PALETA = {
  negro: [29, 29, 31], // títulos y datos
  oscuro: [58, 58, 60], // cuerpo de texto
  medio: [110, 110, 115], // rótulos y texto secundario
  claro: [160, 160, 166], // pie y marcas de vista previa
  acento: [0, 102, 204], // números de sección y tipo de documento
  fondoClaro: [248, 248, 250],
  fondoMedio: [244, 244, 247],
  borde: [222, 222, 227],
  filete: [232, 232, 236],
};

const INICIO_CONTENIDO = 35;
const RESERVA_PIE = 20;
const INTERLINEADO = 1.42;
const PT_A_MM = 25.4 / 72;

/**
 * @param {object} o
 * @param {object} o.empresa         fila de datos_empresa
 * @param {string} o.tipoDocumento   rótulo del encabezado, p. ej. "Cotización clínica"
 * @param {string} [o.folio]         "N° 48"
 * @param {string} [o.fechaEmision]  texto ya formateado
 * @param {boolean} [o.borrador]     marca "Vista previa" en las zonas que estampa el servidor
 * @param {"letter"|"a5"} [o.formato]
 */
export function crearDocumento({ empresa = {}, tipoDocumento, folio = "", fechaEmision = "", borrador = false, margen, formato = "letter" }) {
  const doc = new jsPDF("p", "mm", formato);
  const compacto = formato === "a5";
  const m = margen ?? (compacto ? 13 : 20);
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const derecha = ancho - m;
  const anchoUtil = derecha - m;
  const nombreEmpresa = String(empresa.empresaNombre ?? "").trim() || "Centro de salud";
  const limiteInferior = alto - RESERVA_PIE;
  const inicio = compacto ? 32 : INICIO_CONTENIDO;

  let y = inicio;
  let zona = null;
  let zonaPaciente = null;

  const fuente = (estilo = "normal", tamano = 9, color = PALETA.negro) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamano);
    doc.setTextColor(...color);
  };
  const altoLinea = (tamano) => tamano * PT_A_MM * INTERLINEADO;

  /**
   * Texto con espaciado entre letras (rótulos en mayúsculas). jsPDF no considera
   * el espaciado al alinear a la derecha, así que el ancho se calcula aquí.
   */
  const textoEspaciado = (t, x, yTexto, { espacio = 0.4, derechaAlineado = false } = {}) => {
    const anchoTexto = doc.getTextWidth(t) + espacio * Math.max(t.length - 1, 0);
    doc.setCharSpace(espacio);
    doc.text(t, derechaAlineado ? x - anchoTexto : x, yTexto);
    doc.setCharSpace(0);
  };

  /** Recorta con "…" para que un texto de una línea nunca invada otra columna. */
  const recortar = (texto, anchoMax) => {
    let t = String(texto ?? "");
    if (doc.getTextWidth(t) <= anchoMax) return t;
    while (t.length > 1 && doc.getTextWidth(`${t}…`) > anchoMax) t = t.slice(0, -1);
    return `${t.trimEnd()}…`;
  };

  function encabezado() {
    const anchoDerecha = Math.min(62, anchoUtil * 0.4);
    const anchoNombre = anchoUtil - anchoDerecha - 6;
    const yNombre = compacto ? 13 : 16;

    // El nombre de la clínica se achica hasta 10,5 pt para caber entero; si ni así
    // cabe, termina en "…" (nunca se corta mudo).
    let tamanoNombre = compacto ? 11.5 : 14;
    fuente("bold", tamanoNombre, PALETA.negro);
    while (tamanoNombre > 10.5 && doc.getTextWidth(nombreEmpresa) > anchoNombre) {
      tamanoNombre -= 0.5;
      doc.setFontSize(tamanoNombre);
    }
    doc.text(recortar(nombreEmpresa, anchoNombre), m, yNombre);

    fuente("normal", 7.5, PALETA.medio);
    const contacto = [empresa.contactoDireccion, empresa.contactoTelefono, empresa.contactoEmail].filter(Boolean).join("   ·   ");
    if (contacto) doc.text(recortar(contacto, anchoNombre), m, yNombre + 5.2);

    // Tipo de documento y folio, alineados a la derecha.
    fuente("bold", 7, PALETA.acento);
    textoEspaciado(recortar(String(tipoDocumento).toUpperCase(), anchoDerecha - 12), derecha, yNombre - 0.6, { espacio: 0.45, derechaAlineado: true });
    const detalle = [folio, fechaEmision].filter(Boolean).join("   ·   ");
    if (detalle) {
      fuente("normal", 8, PALETA.oscuro);
      doc.text(recortar(detalle, anchoDerecha), derecha, yNombre + 5.2, { align: "right" });
    }

    doc.setDrawColor(...PALETA.borde);
    doc.setLineWidth(0.3);
    doc.line(m, yNombre + 10, derecha, yNombre + 10);
  }

  function nuevaPagina() {
    doc.addPage();
    encabezado();
    y = inicio;
  }

  /** Salta de página si `altoBloque` no cabe en lo que queda. */
  function asegurar(altoBloque) {
    if (y + altoBloque > limiteInferior) nuevaPagina();
  }

  /**
   * Escribe un texto que puede ocupar varias líneas, partiéndolo entre páginas
   * por líneas completas. Con `justificar`, cada línea menos la última de cada
   * párrafo se alinea a ambos márgenes.
   */
  function escribirLineas(texto, { x, anchoMax, tamano, justificar }) {
    const salto = altoLinea(tamano);
    for (const parrafo of String(texto ?? "").split("\n")) {
      const lineas = parrafo.trim() ? doc.splitTextToSize(parrafo.trim(), anchoMax) : [""];
      lineas.forEach((linea, i) => {
        asegurar(salto);
        const base = y + salto * 0.74;
        if (justificar && i < lineas.length - 1) {
          // jsPDF solo justifica las líneas que no son la última del arreglo.
          doc.text([linea, ""], x, base, { align: "justify", maxWidth: anchoMax });
        } else {
          doc.text(linea, x, base);
        }
        y += salto;
      });
    }
  }

  encabezado();

  return {
    doc,
    get y() { return y; },
    anchoUtil,
    margen: m,

    espacio(mm) {
      y += mm;
    },

    /** Título del documento (primera página): grande, con subtítulo opcional. */
    titulo(texto, subtitulo = "") {
      fuente("bold", compacto ? 14 : 17, PALETA.negro);
      const lineas = doc.splitTextToSize(String(texto), anchoUtil);
      const altoTitulo = lineas.length * altoLinea(compacto ? 14 : 17);
      asegurar(altoTitulo + 12);
      doc.text(lineas, m, y + altoLinea(compacto ? 14 : 17) * 0.74);
      y += altoTitulo;
      if (subtitulo) {
        fuente("normal", compacto ? 9.5 : 11, PALETA.medio);
        const sub = doc.splitTextToSize(String(subtitulo), anchoUtil);
        doc.text(sub, m, y + 4.2);
        y += sub.length * altoLinea(compacto ? 9.5 : 11) + 1.5;
      }
      y += compacto ? 4 : 5;
    },

    /**
     * Título de sección. Con `numero`, lo antecede en el color de acento.
     * Nunca queda solo al pie de una página: exige espacio para dos líneas más.
     */
    seccion(titulo, { numero } = {}) {
      y += 2;
      asegurar(8 + altoLinea(9.5) * 2);
      let x = m;
      if (numero !== undefined) {
        fuente("bold", 10.5, PALETA.acento);
        const rotulo = `${numero}.`;
        doc.text(rotulo, x, y + 4);
        x += Math.max(doc.getTextWidth(rotulo) + 2.2, 6);
      }
      fuente("bold", 10.5, PALETA.negro);
      doc.text(doc.splitTextToSize(String(titulo), derecha - x)[0], x, y + 4);
      y += 8.5;
    },

    /** Subtítulo dentro de una sección (p. ej. "Riesgos frecuentes"). */
    subseccion(titulo) {
      y += 1;
      asegurar(6 + altoLinea(9.5) * 2);
      fuente("bold", 9.5, PALETA.negro);
      doc.text(String(titulo), m, y + 3.6);
      y += 6;
    },

    /** Párrafo que se parte entre páginas por líneas, sin cortar una línea a la mitad. */
    parrafo(texto, { tamano = 9.5, color = PALETA.oscuro, estilo = "normal", sangria = 0, justificar = false } = {}) {
      fuente(estilo, tamano, color);
      escribirLineas(texto, { x: m + sangria, anchoMax: anchoUtil - sangria, tamano, justificar });
      y += 2.2;
    },

    lista(items, opciones = {}) {
      const tamano = opciones.tamano ?? 9.5;
      for (const item of items) {
        fuente("normal", tamano, opciones.color ?? PALETA.oscuro);
        asegurar(altoLinea(tamano));
        doc.setTextColor(...PALETA.medio);
        doc.text("•", m + 1.2, y + altoLinea(tamano) * 0.74);
        this.parrafo(item, { ...opciones, sangria: 5.5 });
        y -= 1.4;
      }
      y += 1.6;
    },

    /** Notas al pie del contenido (vigencia, condiciones). */
    notas(items) {
      y += 1;
      this.lista(items, { tamano: 7.5, color: PALETA.medio });
    },

    /**
     * Ficha de datos en dos columnas sobre un fondo muy claro.
     * Cada campo: {rotulo, valor, completo?}. `completo` ocupa el ancho de su
     * columna; los demás van de a dos. El alto se mide con las líneas reales.
     */
    cajaDatos(columnas) {
      const anchoColumna = anchoUtil / columnas.length;
      const relleno = compacto ? 4 : 5;
      const medidas = columnas.map((campos) => {
        const filas = [];
        let fila = [];
        for (const campo of campos) {
          if (campo.completo) {
            if (fila.length) filas.push(fila);
            filas.push([campo]);
            fila = [];
          } else {
            fila.push(campo);
            if (fila.length === 2) {
              filas.push(fila);
              fila = [];
            }
          }
        }
        if (fila.length) filas.push(fila);
        fuente("normal", 9);
        return filas.map((f) => {
          const anchoCelda = (anchoColumna - relleno * 2) / (f.length === 1 && f[0].completo ? 1 : 2) - 2;
          const lineas = Math.max(...f.map((c) => doc.splitTextToSize(String(c.valor || "—"), anchoCelda).length));
          return { campos: f, anchoCelda, alto: 4.2 + lineas * altoLinea(9) + 2.4 };
        });
      });
      const altoCaja = Math.max(...medidas.map((filas) => filas.reduce((s, f) => s + f.alto, 0))) + 5;

      asegurar(altoCaja);
      doc.setFillColor(...PALETA.fondoMedio);
      doc.roundedRect(m, y, anchoUtil, altoCaja, 2.5, 2.5, "F");
      if (columnas.length > 1) {
        doc.setDrawColor(...PALETA.borde);
        doc.setLineWidth(0.25);
        for (let c = 1; c < columnas.length; c++) doc.line(m + c * anchoColumna, y + 4, m + c * anchoColumna, y + altoCaja - 4);
      }

      medidas.forEach((filas, indiceColumna) => {
        let cursor = y + 3.5;
        const x0 = m + indiceColumna * anchoColumna + relleno;
        for (const fila of filas) {
          fila.campos.forEach((campo, i) => {
            const x = x0 + i * (fila.anchoCelda + 2);
            fuente("bold", 6.3, PALETA.medio);
            textoEspaciado(recortar(String(campo.rotulo).toUpperCase(), fila.anchoCelda - String(campo.rotulo).length * 0.3), x, cursor + 2.6, { espacio: 0.3 });
            fuente("normal", 9, PALETA.negro);
            doc.text(doc.splitTextToSize(String(campo.valor || "—"), fila.anchoCelda), x, cursor + 6.9);
          });
          cursor += fila.alto;
        }
      });
      y += altoCaja + (compacto ? 5 : 6);
    },

    /** Tabla con autoTable: solo filetes horizontales; repite el encabezado de la página al saltar. */
    tabla(opciones) {
      autoTable(doc, {
        theme: "plain",
        startY: y,
        margin: { left: m, right: m, top: inicio, bottom: RESERVA_PIE + 4 },
        headStyles: {
          fillColor: PALETA.fondoMedio, textColor: PALETA.medio, fontStyle: "bold", fontSize: 7.3,
          cellPadding: { top: 3.2, bottom: 3.2, left: 3.5, right: 3.5 },
        },
        bodyStyles: {
          fontSize: 8.8, textColor: PALETA.negro,
          cellPadding: { top: 3, bottom: 3, left: 3.5, right: 3.5 },
          lineWidth: { bottom: 0.2 }, lineColor: PALETA.filete,
        },
        styles: { overflow: "linebreak", font: "helvetica" },
        ...opciones,
        didDrawPage: (data) => {
          if (data.pageNumber > 1 && data.cursor?.y !== undefined) encabezado();
          opciones.didDrawPage?.(data);
        },
      });
      y = doc.lastAutoTable.finalY + 6;
    },

    /** Totales alineados a la derecha. lineas: [{etiqueta, valor, destacado?}] */
    totales(lineas, anchoCaja = 82) {
      const altoBloque = lineas.length * 6.5 + 4;
      asegurar(altoBloque);
      const x = derecha - anchoCaja;
      let cursor = y + 4.5;
      lineas.forEach((l) => {
        if (l.destacado) {
          doc.setDrawColor(...PALETA.borde);
          doc.setLineWidth(0.3);
          doc.line(x, cursor - 3.6, derecha, cursor - 3.6);
          cursor += 1.4;
          fuente("bold", 11, PALETA.negro);
        } else {
          fuente("normal", 8.8, PALETA.medio);
        }
        doc.text(String(l.etiqueta), x, cursor);
        if (!l.destacado) doc.setTextColor(...PALETA.negro);
        doc.text(String(l.valor), derecha, cursor, { align: "right" });
        cursor += 6.5;
      });
      y = cursor + 2;
    },

    /**
     * Firma del paciente (o su representante), antes del pie del profesional.
     *  - "fes": zona reservada que el servidor completa con la aceptación por
     *    código (OTP) enviado al correo o teléfono de la ficha.
     *  - "manuscrita": no dibuja nada aquí; la línea del paciente va junto a la
     *    del profesional en zonaFirma({ firmaPaciente: {nombre, documento} }).
     */
    firmaPaciente({ modo = MODOS_FIRMA.MANUSCRITA } = {}) {
      if (modo !== MODOS_FIRMA.FES) return;
      // Las dos firmas (paciente y profesional) van siempre en la misma página:
      // se reserva el espacio de ambas antes de dibujar la primera.
      y += 4;
      asegurar(ZONA_PACIENTE.alto + 6 + ZONA_FIRMA.alto);
      zonaPaciente = { pagina: doc.internal.getCurrentPageInfo().pageNumber, x: m, y, ancho: anchoUtil, alto: ZONA_PACIENTE.alto };
      if (borrador) marcoVistaPrevia(zonaPaciente, "Vista previa — la aceptación del paciente se completa con su código");
      y += ZONA_PACIENTE.alto;
    },

    /**
     * Pie de firma. Siempre el último bloque.
     *  - "fes": reserva ZONA_FIRMA.alto en blanco (el servidor estampa). En vista
     *    previa (`borrador`) dibuja un marco tenue que NO va en el PDF enviado.
     *  - "manuscrita": línea para firma de puño y letra + datos del profesional.
     *    `firmaPaciente`: true (línea simple) o {nombre, documento, rotulo}; va a
     *    la izquierda y la del profesional a la derecha.
     */
    zonaFirma({ modo, profesional = {}, firmaPaciente = false, imagenPaciente = null, imagenProfesional = null, leyendaManuscrita = "Firma y timbre del profesional" }) {
      if (modo === MODOS_FIRMA.FES) {
        y += 4;
        asegurar(ZONA_FIRMA.alto);
        zona = { pagina: doc.internal.getCurrentPageInfo().pageNumber, x: m, y, ancho: anchoUtil, alto: ZONA_FIRMA.alto };
        if (borrador) marcoVistaPrevia(zona, "Vista previa — la firma electrónica se completa al firmar");
        y += ZONA_FIRMA.alto;
        return;
      }

      const anchoFirma = Math.min(72, anchoUtil / 2 - 8);
      const datos = {
        nombre: profesional.nombre,
        rut: profesional.rut,
        especialidad: profesional.especialidad,
        registroSis: profesional.registroSis,
        // El nombre de la clínica ya va en el encabezado y el pie.
        anchoMax: anchoFirma,
        salto: compacto ? 3.6 : 4.2,
        tamanoNombre: compacto ? 8 : 8.8,
        tamanoDetalle: compacto ? 7 : 7.6,
        tamanoLeyenda: compacto ? 7 : 7.6,
      };
      fuente("normal", 8);
      const altoProfesional = altoBloqueFirma(doc, datos);
      const espacioFirma = compacto ? 11 : 15; // alto libre sobre la línea para firmar
      const altoBloque = espacioFirma + 4.6 + altoProfesional + 4;
      y += 5;
      asegurar(altoBloque);
      const yLinea = y + espacioFirma;
      const xProfesional = firmaPaciente ? derecha - anchoFirma : m;

      doc.setDrawColor(...PALETA.oscuro);
      doc.setLineWidth(0.35);
      doc.line(xProfesional, yLinea, xProfesional + anchoFirma, yLinea);
      const dibujarImagen = (imagen, xFirma) => {
        if (!imagen?.datos || !imagen.ancho || !imagen.alto) return;
        const altoMaximo = espacioFirma - 2;
        const ancho = Math.min(anchoFirma - 4, altoMaximo * imagen.ancho / imagen.alto);
        const alto = ancho * imagen.alto / imagen.ancho;
        doc.addImage(imagen.datos, "PNG", xFirma + (anchoFirma - ancho) / 2, yLinea - alto - 0.5, ancho, alto);
      };
      dibujarImagen(imagenProfesional, xProfesional);
      fuente("bold", datos.tamanoNombre, PALETA.negro);
      dibujarBloqueFirma(doc, {
        ...datos,
        x: xProfesional + anchoFirma / 2,
        y: yLinea + 4.6,
        align: "center",
        leyenda: leyendaManuscrita,
        colorTexto: PALETA.oscuro,
        colorEmpresa: PALETA.medio,
      });

      if (firmaPaciente) {
        const paciente = typeof firmaPaciente === "object" ? firmaPaciente : {};
        const centro = m + anchoFirma / 2;
        doc.setDrawColor(...PALETA.oscuro);
        doc.line(m, yLinea, m + anchoFirma, yLinea);
        dibujarImagen(imagenPaciente, m);
        let cursor = yLinea + 4.6;
        if (paciente.nombre) {
          fuente("normal", datos.tamanoNombre, PALETA.oscuro);
          doc.text(recortar(paciente.nombre, anchoFirma), centro, cursor, { align: "center" });
          cursor += datos.salto;
        }
        fuente("normal", datos.tamanoDetalle, PALETA.oscuro);
        if (paciente.documento) {
          doc.text(recortar(paciente.documento, anchoFirma), centro, cursor, { align: "center" });
          cursor += datos.salto;
        }
        doc.text(paciente.rotulo || "Firma del paciente o representante legal", centro, cursor, { align: "center" });
      }
      y += altoBloque;
    },

    /**
     * Cierra el documento: dibuja el pie de cada página con "Página n de N"
     * (al final, cuando ya se sabe N) y devuelve el Blob.
     */
    finalizar({ pieIzquierdo = "", codigo = "" } = {}) {
      const total = doc.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        const yPie = alto - (compacto ? 9 : 12);
        doc.setDrawColor(...PALETA.filete);
        doc.setLineWidth(0.25);
        doc.line(m, yPie - 4, derecha, yPie - 4);
        fuente("normal", 6.6, PALETA.claro);
        const izquierda = pieIzquierdo || `${nombreEmpresa}   ·   Documento generado con AgendaClínica`;
        doc.text(recortar(izquierda, anchoUtil - 42), m, yPie);
        doc.text(`${codigo ? `Código ${codigo}   ·   ` : ""}Página ${p} de ${total}`, derecha, yPie, { align: "right" });
      }
      return { blob: doc.output("blob"), paginas: total, zonaFirma: zona, zonaPaciente };
    },
  };

  function marcoVistaPrevia(z, texto) {
    doc.setDrawColor(...PALETA.borde);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(z.x, z.y, z.ancho, z.alto, 2.5, 2.5, "S");
    doc.setLineDashPattern([], 0);
    fuente("normal", 8, PALETA.claro);
    doc.text(texto, z.x + z.ancho / 2, z.y + z.alto / 2 + 1, { align: "center" });
  }
}
