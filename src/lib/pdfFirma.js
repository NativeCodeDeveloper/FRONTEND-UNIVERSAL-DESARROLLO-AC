// ── Bloque de firma de los PDF ───────────────────────────────────────────────
// Todos los PDF de la plataforma cierran con la firma del profesional, y todos
// dibujaban su nombre con un doc.text() suelto, sin ancho maximo. Un nombre
// largo ("Maria de los Angeles Fernandez Undurraga") se sale del bloque: al
// estar alineado a la derecha crece hacia la izquierda y se monta sobre el
// resto del contenido; centrado se desborda por ambos lados.
//
// Este helper parte el nombre en las lineas que quepan y devuelve cuanto creció
// el bloque, para que quien lo llama corra hacia abajo lo que viene despues
// (RUT, especialidad, leyenda, empresa) y recalcule el salto de pagina.
//
// Para un nombre que ya cabia en una linea el resultado es identico al de
// antes: devuelve 0 y no mueve nada.

/**
 * Dibuja el nombre del profesional respetando un ancho maximo.
 *
 * @param {object} doc        instancia de jsPDF
 * @param {object} opciones
 * @param {string} opciones.nombre    nombre a imprimir
 * @param {number} opciones.x         punto de anclaje horizontal
 * @param {number} opciones.y         linea base de la primera linea
 * @param {number} opciones.anchoMax  ancho disponible, en las unidades del doc
 * @param {string} [opciones.align]   "right" | "center" | "left"
 * @param {number} [opciones.salto]   separacion entre lineas
 * @returns {number} milimetros extra que ocupo el nombre (0 si cupo en una)
 */
export function dibujarNombreFirma(doc, { nombre, x, y, anchoMax, align = "right", salto = 5 }) {
    const texto = String(nombre ?? "").trim() || "-";
    const lineas = doc.splitTextToSize(texto, anchoMax);

    lineas.forEach((linea, i) => {
        doc.text(linea, x, y + i * salto, { align });
    });

    return (lineas.length - 1) * salto;
}

/**
 * Cuanto va a crecer el bloque por un nombre largo, sin dibujar nada. Sirve
 * para decidir un salto de pagina ANTES de empezar a dibujar la firma.
 *
 * Usa las medidas de fuente activas en el doc, asi que hay que llamarlo con la
 * misma fuente y tamaño con los que despues se dibujara el nombre.
 */
export function altoExtraNombreFirma(doc, { nombre, anchoMax, salto = 5 }) {
    const texto = String(nombre ?? "").trim() || "-";
    return (doc.splitTextToSize(texto, anchoMax).length - 1) * salto;
}

/**
 * Dibuja el pie de firma completo, en el orden unico que usan todos los
 * documentos de la plataforma:
 *
 *     Nombre del profesional
 *     RUT: 12.345.678-9
 *     Especialidad
 *     Firma y timbre profesional
 *     Nombre del centro
 *
 * Antes cada PDF lo armaba por su cuenta y habian quedado distintos entre si:
 * unos ponian la leyenda arriba del nombre, cuatro no mostraban la
 * especialidad y uno tampoco el centro. Con un solo dibujante, los siete
 * documentos quedan iguales y siguen iguales al cambiarlos.
 *
 * La ALINEACION si es de cada documento: los que comparten fila con la firma
 * del paciente van centrados en su columna, y los que cierran la pagina van
 * pegados al margen derecho.
 *
 * Las lineas vacias se omiten: un profesional sin RUT no deja un "RUT:" suelto.
 *
 * @returns {number} alto total ocupado, para calcular saltos de pagina
 */
export function dibujarBloqueFirma(doc, {
    x,
    y,
    anchoMax,
    align = "right",
    salto = 5,
    nombre,
    rut,
    especialidad,
    leyenda = "Firma y timbre profesional",
    empresa,
    tamanoNombre = 9,
    tamanoDetalle = 8,
    tamanoLeyenda = 9,
    colorTexto = [71, 85, 105],
    colorEmpresa = [148, 163, 184],
}) {
    let cursor = y;

    // Cada linea se dibuja por separado y en la posicion calculada. Pasarle el
    // arreglo completo a jsPDF seria mas corto, pero ahi el espaciado lo decide
    // el motor segun el tamaño de fuente, no el "salto" del bloque: los campos
    // de distinto tamaño quedarian con separaciones distintas y el cursor no
    // sabria cuanto bajo realmente.
    const escribir = (texto, tamano) => {
        doc.setFontSize(tamano);
        doc.splitTextToSize(String(texto), anchoMax).forEach((linea) => {
            doc.text(linea, x, cursor, { align });
            cursor += salto;
        });
    };

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorTexto);

    escribir(nombre || "-", tamanoNombre);
    if (rut) escribir(`RUT: ${String(rut).trim()}`, tamanoDetalle);
    if (especialidad) escribir(String(especialidad).trim(), tamanoDetalle);
    if (leyenda) escribir(leyenda, tamanoLeyenda);
    if (empresa) {
        doc.setTextColor(...colorEmpresa);
        escribir(String(empresa), tamanoDetalle);
    }

    // cursor quedo una posicion mas abajo de la ultima linea escrita.
    return cursor - salto - y;
}

/**
 * Alto que ocupara el bloque, sin dibujarlo. Para decidir saltos de pagina.
 *
 * Cuenta las lineas REALES de cada campo, no una por campo: una especialidad
 * larga ocupa dos renglones y hay que reservarlos, si no el bloque termina
 * pisando el pie de pagina.
 */
export function altoBloqueFirma(doc, {
    nombre,
    rut,
    especialidad,
    leyenda = true,
    empresa,
    anchoMax,
    salto = 5,
    tamanoNombre = 9,
    tamanoDetalle = 8,
    tamanoLeyenda = 9,
}) {
    // Cada campo se mide con el tamaño con el que se va a dibujar: un texto que
    // en 9pt ocupa tres lineas puede caber en dos a 8pt. Medir todo con la
    // misma fuente daba un alto equivocado.
    const tamanoPrevio = doc.getFontSize();
    const contar = (texto, tamano) => {
        if (!texto) return 0;
        doc.setFontSize(tamano);
        return doc.splitTextToSize(String(texto), anchoMax).length;
    };

    const lineas =
        contar(String(nombre ?? "").trim() || "-", tamanoNombre) +
        contar(rut ? `RUT: ${rut}` : "", tamanoDetalle) +
        contar(especialidad, tamanoDetalle) +
        (leyenda ? 1 : 0) +
        contar(empresa, tamanoDetalle);

    doc.setFontSize(tamanoPrevio);
    return Math.max(lineas - 1, 0) * salto;
}
