/**
 * tourDetalleCotizacionSteps.js
 * Configuración del tutorial guiado breve del Detalle de cotización
 * (detalleCotizacion/[id_cotizacion_paciente]).
 *
 * Mismo criterio que tourFichasSteps.js y tourCotizacionesSteps.js: recorrido
 * de solo lectura que vive en esta página — no navega a otras rutas ni hace
 * clic por el usuario. Explica las acciones del header (PDF y correo), los
 * datos de la cotización, el catálogo de prestaciones, la tabla del detalle
 * y el manejo del abono y los totales.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 */

export const TOUR_DETALLE_COTIZACION_STEPS = [
  {
    id: "detalle-cotizacion-intro",
    selector: null,
    title: "Tutorial Guiado Detalle",
    description: "Bienvenido al detalle de la cotización. A continuación se presenta un recorrido por cada sección de esta pantalla: cómo <strong>agregar prestaciones</strong> desde el catálogo, cómo registrar el <strong>abono del paciente</strong> y cómo <strong>exportar o enviar</strong> el presupuesto. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "detalle-cotizacion-acciones",
    selector: '[data-tour="detalle-cotizacion-acciones"]',
    title: "Exportar y enviar el presupuesto",
    description: "En esta sección se concentra la documentación del presupuesto. Primero seleccione la <strong>fecha de emisión</strong>, que es la que aparecerá impresa en el documento. Luego, <strong>\"Exportar PDF\"</strong> descarga el presupuesto en formato PDF, listo para imprimir o archivar, y <strong>\"Enviar por correo\"</strong> lo remite directamente al correo electrónico registrado del paciente. El botón confirma en pantalla cuando el envío ha sido aceptado.",
    side: "bottom",
  },
  {
    id: "detalle-cotizacion-paciente",
    selector: '[data-tour="detalle-cotizacion-paciente"]',
    title: "Datos de la cotización",
    description: "Esta tarjeta reúne la información que se imprime en el presupuesto: los <strong>datos del paciente</strong> (RUT, teléfono y correo electrónico), el <strong>nombre de la cotización</strong> y el <strong>profesional solicitante</strong>, quien figura como responsable del tratamiento. Se recomienda revisar que estos datos estén correctos antes de emitir el documento.",
    side: "bottom",
  },
  {
    id: "detalle-cotizacion-observaciones",
    selector: '[data-tour="detalle-cotizacion-observaciones"]',
    title: "Observaciones generales",
    description: "Este campo es una <strong>anotación de uso interno</strong>, destinada a que el profesional registre lo que estime conveniente del tratamiento: por ejemplo, un <strong>comentario del paciente</strong>, un <strong>acuerdo</strong> o cualquier otra <strong>observación</strong>. Escriba el texto y presione <strong>\"Guardar observación\"</strong> para almacenarlo en la cotización. <strong>Esta anotación es de uso interno: no aparece en el documento PDF</strong> que se entrega al paciente.",
    side: "bottom",
  },
  {
    id: "detalle-cotizacion-catalogo",
    selector: '[data-tour="detalle-cotizacion-catalogo"]',
    title: "Listado de prestaciones y servicios",
    description: "Aquí se encuentra el <strong>catálogo completo</strong> de productos y servicios de la clínica. Localice un ítem con el <strong>buscador</strong> o filtre por <strong>categoría, subcategoría y sub-subcategoría</strong>; el botón <strong>\"Agregar\"</strong> incorpora la prestación a la cotización, sumando su valor al total. La flecha de la esquina permite contraer o desplegar el listado.",
    side: "top",
  },
  {
    id: "detalle-cotizacion-detalle",
    selector: '[data-tour="detalle-cotizacion-detalle"]',
    title: "Detalle de la cotización",
    description: "Cada prestación agregada aparece en esta tabla con su <strong>precio unitario</strong> y su campo de <strong>Observación</strong>, destinado al detalle específico de cada ítem: por ejemplo, si el servicio es una <strong>Exodoncia</strong>, en la observación se indica la pieza dental, como <strong>\"Molar 1.6\"</strong>. Presione el <strong>ícono de guardado</strong> para almacenar la observación; de lo contrario, no se guardará. También puede <strong>retirar</strong> el ítem (basurero); el <strong>total</strong> se recalcula automáticamente. A diferencia de la observación general, esta <strong>sí se imprime en el PDF</strong>.",
    side: "top",
  },
  {
    id: "detalle-cotizacion-abono",
    selector: '[data-tour="detalle-cotizacion-abono"]',
    title: "Abono y totales",
    description: "Si el paciente efectúa <strong>abonos</strong> o pagos parciales del tratamiento, el profesional puede ir registrándolos en el campo <strong>Abono del paciente</strong>. Cada abono se <strong>descuenta del total</strong> que el paciente debe cancelar: la pantalla indica en todo momento el <strong>total del tratamiento</strong>, el <strong>abono aplicado</strong> y el <strong>saldo pendiente</strong>. Los valores se guardan automáticamente en la cotización, donde también podrán consultarse más adelante.",
    side: "top",
  },
  {
    id: "detalle-cotizacion-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto ya sabe cómo confeccionar el presupuesto: agregar prestaciones desde el catálogo, registrar observaciones, ingresar el abono del paciente y compartir el documento mediante <strong>\"Exportar PDF\"</strong> o <strong>\"Enviar por correo\"</strong>. Si desea repasar alguna sección, puede reiniciar este tutorial cuando lo estime conveniente.",
  },
];
