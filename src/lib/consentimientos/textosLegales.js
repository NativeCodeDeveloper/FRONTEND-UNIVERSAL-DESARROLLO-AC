/* Textos legales de la reserva en la página pública.
 *
 *   1. tratamiento_datos          → CASILLA OBLIGATORIA. Política de privacidad
 *                                   (Ley 19.628 modificada por la Ley 21.719,
 *                                   vigente desde el 1 de diciembre de 2026). Los
 *                                   datos de salud son sensibles: el consentimiento
 *                                   es expreso, específico, sin premarcar y separado
 *                                   de cualquier otra aceptación. Queda registrado
 *                                   con su versión, huella, fecha e IP.
 *   2. derechos_deberes_paciente  → SOLO LECTURA (enlace, sin casilla). Resumen de
 *                                   la carta de derechos y deberes de la Ley 20.584.
 *                                   La ley exige informarlos, no aceptarlos; el
 *                                   consentimiento de cada procedimiento (art. 14)
 *                                   se firma aparte, en la consulta.
 *
 * La fuente oficial es el backend (tabla documento_plantilla, GET
 * /consentimientos/seleccionarVigentes): estos textos son la versión 1 que se
 * carga como seed y el respaldo del modo mock. Si se cambia una coma aquí, hay
 * que publicar una versión nueva en el backend: lo que el paciente aceptó queda
 * guardado con su versión y su huella SHA-256, y no puede cambiar después.
 *
 * Variables: {{empresa.nombre}}, {{empresa.direccion}}, {{empresa.correo}},
 * {{empresa.telefono}}, {{profesional.nombre}}.
 *
 * Formato del cuerpo: párrafos separados por línea en blanco; "## " inicia un
 * subtítulo; "- " inicia un ítem de lista.
 *
 * Revisión legal: redactado conforme a la legislación vigente a octubre de
 * 2026. Antes de publicar en producción, cada clínica debe completar los datos
 * de su razón social y validarlo con su asesor legal (los textos asumen el
 * modelo estándar de la plataforma: la clínica es responsable y NativeCode,
 * encargado de tratamiento).
 */

export const VERSION_TEXTOS = 1;

const TRATAMIENTO_DATOS = `Esta política le informa cómo {{empresa.nombre}} trata sus datos personales cuando reserva una hora, paga en línea o se atiende con nosotros. Se rige por la Ley N° 19.628 sobre Protección de la Vida Privada, modificada por la Ley N° 21.719, y por la Ley N° 20.584 que regula los Derechos y Deberes de los Pacientes. Léala antes de aceptar: su aceptación es libre, y la de esta política es independiente de cualquier otra.

## 1. Responsable del tratamiento
El responsable de sus datos es {{empresa.nombre}}, con domicilio en {{empresa.direccion}}, correo {{empresa.correo}} y teléfono {{empresa.telefono}}. A esos mismos datos puede dirigir cualquier consulta o solicitud sobre su información personal.

La plataforma de agenda, ficha clínica y documentos es provista por NativeCode SpA, que actúa como encargado del tratamiento: trata sus datos solo por cuenta de {{empresa.nombre}} y según sus instrucciones, bajo contrato y deber de confidencialidad, y no puede usarlos para fines propios.

## 2. Datos que tratamos
- Identificación y contacto: nombre, apellidos, RUT o número de pasaporte, correo electrónico y teléfono.
- Reserva y pago: profesional, servicio, fecha, hora, monto y estado del pago. Si paga en línea, los datos de su tarjeta los recibe directamente el procesador de pagos; nosotros no los vemos ni los guardamos.
- Salud: los antecedentes que usted entregue y los que el equipo de salud registre en su ficha clínica (diagnósticos, tratamientos, exámenes, recetas y consentimientos). La ley los califica como datos sensibles y les otorga protección reforzada.
- Respaldo de su aceptación: fecha y hora, dirección IP, navegador y la versión exacta de los textos que aceptó.

## 3. Datos obligatorios y voluntarios
Los datos de identificación y contacto son necesarios para reservar: sin ellos no podemos agendar su hora ni confirmársela. Los datos de salud son necesarios para atenderle de forma segura; si decide no entregarlos, el profesional podría no estar en condiciones de realizar ciertas prestaciones.

## 4. Finalidades
- Agendar, confirmar, reprogramar y recordarle sus horas por correo, SMS o WhatsApp.
- Procesar el pago de su reserva, cuando corresponda.
- Llevar su ficha clínica y prestarle la atención de salud que solicita.
- Emitir y enviarle los documentos de su atención: presupuestos, órdenes de exámenes, recetas, indicaciones y consentimientos, incluidos los que se firman electrónicamente.
- Cumplir las obligaciones legales y sanitarias del centro y atender los requerimientos de la autoridad.

No usamos sus datos para publicidad, no elaboramos perfiles comerciales y no tomamos decisiones que le afecten basadas únicamente en un tratamiento automatizado. No vendemos ni cedemos sus datos con fines comerciales. Si quisiéramos enviarle información promocional, le pediremos una autorización aparte, que será opcional.

## 5. Bases de licitud
- Sus datos de salud: su consentimiento expreso, que otorga al marcar la casilla correspondiente, y lo necesario para la prestación de salud que solicita.
- La reserva y el pago: la ejecución de la prestación que usted pide.
- La ficha clínica y su conservación: el cumplimiento de obligaciones legales de los prestadores de salud.

## 6. Destinatarios
Solo accede a sus datos el personal del centro que lo necesita para su función, y los proveedores que nos prestan servicios como encargados de tratamiento, obligados por contrato a protegerlos y a usarlos solo para ese fin:
- Alojamiento de la plataforma, base de datos y almacenamiento de documentos.
- Autenticación de los usuarios del centro.
- Envío de correos electrónicos, SMS y mensajes de WhatsApp.
- Procesamiento de pagos en línea, cuando usted paga al reservar.

También comunicaremos sus datos cuando una ley o una autoridad competente lo exija, o a otro prestador de salud cuando usted lo solicite o sea necesario para su atención.

## 7. Transferencia internacional
Algunos de estos proveedores almacenan o procesan datos fuera de Chile. En esos casos la transferencia se hace con las garantías que exige la ley, como cláusulas contractuales que aseguran un nivel de protección adecuado.

## 8. Plazo de conservación
La ficha clínica, y los documentos y consentimientos que forman parte de ella, se conservan por un mínimo de quince años desde la última atención, como exigen la Ley N° 20.584 y su reglamento. Los demás datos se conservan mientras sean necesarios para las finalidades indicadas y para atender reclamos, y después se eliminan o anonimizan.

## 9. Seguridad
Aplicamos medidas técnicas y organizativas proporcionales al riesgo: acceso restringido según la función de cada persona, autenticación de los usuarios, cifrado de las comunicaciones y del almacenamiento, registro de cada acceso a los documentos, respaldos y deber de confidencialidad de todo el personal. Si ocurre una vulneración de seguridad que afecte sus datos, la comunicaremos a la Agencia de Protección de Datos Personales y, cuando corresponda, a usted, en los términos que establece la ley.

## 10. Sus derechos
En cualquier momento, y en forma gratuita, puede:
- Acceder a sus datos y saber cómo los tratamos.
- Rectificarlos si son inexactos, están desactualizados o incompletos.
- Solicitar su supresión cuando ya no sean necesarios o retire su consentimiento, salvo los que la ley nos obliga a conservar, como la ficha clínica durante su plazo legal.
- Oponerse a determinados tratamientos.
- Solicitar la portabilidad de sus datos en un formato estructurado y de uso común.
- Solicitar el bloqueo temporal de sus datos mientras se resuelve una solicitud.

Para ejercerlos, escriba a {{empresa.correo}} indicando su nombre, RUT o pasaporte y lo que solicita. Podremos pedirle que acredite su identidad. Le responderemos dentro de los plazos que fija la ley. Si considera que no hemos respetado sus derechos, puede reclamar ante la Agencia de Protección de Datos Personales.

Además, como paciente, tiene derecho a acceder a su ficha clínica y a obtener copia de ella conforme a la Ley N° 20.584.

## 11. Retiro del consentimiento
Puede retirar su consentimiento en cualquier momento, sin expresión de causa, escribiendo a {{empresa.correo}}. El retiro rige desde que lo comunica: no afecta el tratamiento realizado antes ni los datos que la ley nos obliga a conservar.

## 12. Niñas, niños, adolescentes y personas representadas
Los datos de niñas y niños menores de 14 años, y los datos de salud de adolescentes menores de 16 años, solo se tratan con el consentimiento de su madre, padre o representante legal. Si reserva para otra persona, declara contar con la facultad legal para hacerlo y para otorgar este consentimiento en su nombre.

## 13. Cambios a esta política
Si modificamos esta política, publicaremos la nueva versión en este sitio y, cuando el cambio requiera un nuevo consentimiento, se lo pediremos antes de su próxima reserva. Cada aceptación queda asociada a la versión exacta que usted leyó.`;

const DERECHOS_DEBERES = `Como paciente de {{empresa.nombre}}, la Ley N° 20.584, que regula los Derechos y Deberes de las Personas en relación con acciones vinculadas a su atención en salud, le reconoce los siguientes derechos y deberes.

## Sus derechos
- Recibir una atención oportuna y sin discriminación arbitraria, con trato digno, amable y respetuoso.
- Que se resguarde su privacidad y la confidencialidad de su información de salud durante la atención.
- Conocer el nombre y la función de quienes lo atienden.
- Recibir información clara, oportuna y comprensible sobre su estado de salud, el diagnóstico, las alternativas de tratamiento disponibles, sus riesgos y el pronóstico.
- Recibir información sobre el valor de las prestaciones y la forma de pago antes de realizarlas.
- Aceptar o rechazar libremente cualquier procedimiento o tratamiento, salvo las excepciones que establece la ley. Antes de cada procedimiento se le pedirá un consentimiento informado específico.
- Que su ficha clínica sea reservada, y acceder a ella o solicitar una copia en los términos que fija la ley.
- Ser acompañado por un familiar o persona de su confianza, según las normas del centro.
- Presentar reclamos y sugerencias, y recibir una respuesta.

## Sus deberes
- Entregar información veraz y completa sobre su identidad, su salud, sus alergias y los medicamentos que usa.
- Informarse sobre el funcionamiento del centro, sus horarios y la forma de pedir y cancelar horas.
- Tratar con respeto al equipo de salud, al personal y a los demás pacientes.
- Cuidar las instalaciones y el equipamiento del centro.
- Avisar con anticipación si no puede asistir a su hora.

## Reclamos
Puede presentar un reclamo o sugerencia escribiendo a {{empresa.correo}} o en {{empresa.direccion}}. Si no queda conforme con la respuesta, puede recurrir a la Superintendencia de Salud.`;

/** Plantillas vigentes de respaldo, con la misma forma que GET /consentimientos/seleccionarVigentes. */
export const PLANTILLAS_RESPALDO = [
  {
    codigo: "tratamiento_datos",
    version: VERSION_TEXTOS,
    titulo: "Política de privacidad y tratamiento de datos personales y de salud",
    etiquetaCasilla: "Acepto la política de privacidad y autorizo el tratamiento de mis datos personales y de salud",
    etiquetaEnlace: "Leer política",
    cuerpo: TRATAMIENTO_DATOS,
  },
  {
    codigo: "derechos_deberes_paciente",
    version: VERSION_TEXTOS,
    titulo: "Derechos y deberes del paciente",
    etiquetaCasilla: null, // solo lectura: sin casilla
    etiquetaEnlace: "Derechos y deberes del paciente",
    cuerpo: DERECHOS_DEBERES,
  },
];

/** Textos que el paciente debe ACEPTAR (casilla). Los demás son solo de lectura. */
export const CODIGOS_OBLIGATORIOS = ["tratamiento_datos"];
export const esObligatorio = (codigo) => CODIGOS_OBLIGATORIOS.includes(codigo);

/** Etiquetas de cada casilla por código (el backend no las envía). */
export const ETIQUETAS_CONSENTIMIENTO = Object.fromEntries(
  PLANTILLAS_RESPALDO.map((p) => [p.codigo, { casilla: p.etiquetaCasilla, enlace: p.etiquetaEnlace }])
);

/**
 * Reemplaza las variables {{empresa.x}} / {{profesional.x}}. Una variable sin
 * valor se reemplaza por un texto neutro, nunca se deja la marca visible.
 */
export function interpolarPlantilla(cuerpo, { empresa = {}, profesional = {} } = {}) {
  const valores = {
    "empresa.nombre": empresa.empresaNombre || empresa.nombre || "el centro de salud",
    "empresa.direccion": empresa.contactoDireccion || empresa.direccion || "la dirección informada en este sitio",
    "empresa.correo": empresa.contactoEmail || empresa.correo || "el correo de contacto del centro",
    "empresa.telefono": empresa.contactoTelefono || empresa.telefono || "el teléfono de contacto del centro",
    "profesional.nombre": profesional.nombreProfesional || profesional.nombre || "el profesional seleccionado",
  };
  return String(cuerpo ?? "").replace(/\{\{\s*([a-z]+\.[a-z]+)\s*\}\}/g, (_, clave) => valores[clave] ?? "");
}

/** Divide el cuerpo en bloques para dibujarlo: {tipo:"titulo"|"subtitulo"|"parrafo"|"lista", texto|items}. */
export function bloquesDeTexto(cuerpo) {
  const bloques = [];
  for (const fragmento of String(cuerpo ?? "").split(/\n{2,}/)) {
    const lineas = fragmento.split("\n").map((l) => l.trim()).filter(Boolean);
    let lista = null;
    for (const linea of lineas) {
      if (linea.startsWith("### ")) {
        lista = null;
        bloques.push({ tipo: "subtitulo", texto: linea.slice(4) });
      } else if (linea.startsWith("## ")) {
        lista = null;
        bloques.push({ tipo: "titulo", texto: linea.slice(3) });
      } else if (linea.startsWith("- ")) {
        if (!lista) {
          lista = { tipo: "lista", items: [] };
          bloques.push(lista);
        }
        lista.items.push(linea.slice(2));
      } else {
        lista = null;
        bloques.push({ tipo: "parrafo", texto: linea });
      }
    }
  }
  return bloques;
}
