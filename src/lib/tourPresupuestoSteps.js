/**
 * tourPresupuestoSteps.js
 * Configuración del tutorial guiado breve del Presupuesto de Tratamiento
 * (presupuestoTratamiento/page.jsx): el proceso completo de armado del
 * presupuesto, de manera ILUSTRATIVA. El usuario no agrega servicios ni
 * completa campos — al cerrar el recorrido el presupuesto sigue vacío.
 *
 * Esta página es el "Presupuesto Rápido": entrega de cotizaciones inmediata,
 * sin registros, sin envío por correo. El paso "Importante" lo declara antes
 * del cierre y remite al presupuesto detallado de la carpeta clínica.
 *
 * Mismo criterio que tourCalendarioSteps.js y tourBloqueosSteps.js: recorrido
 * de solo lectura, sin pasos interactivos ni condiciones `esperar`.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 */

export const TOUR_PRESUPUESTO_STEPS = [
  {
    id: "presupuesto-tour-intro",
    selector: null,
    title: "Tutorial Guiado Presupuesto",
    description: "Bienvenido al <strong>Presupuesto Rápido</strong> de tratamiento. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo armar el presupuesto de un paciente a partir de los servicios de la clínica. <strong>No es necesario seleccionar servicios ni completar campos</strong>: al finalizar el recorrido no se habrá agregado nada. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "presupuesto-tour-datos",
    selector: '[data-tour="presupuesto-datos"]',
    title: "Datos del presupuesto",
    description: "Primero se identifican los <strong>datos que se imprimirán en el documento</strong>: el <strong>profesional</strong> responsable —seleccionándolo por nombre o por su RUT, con detección automática si está registrado— y el <strong>nombre y RUT/DNI del paciente</strong>.",
    side: "left",
  },
  {
    id: "presupuesto-tour-catalogo",
    selector: '[data-tour="presupuesto-catalogo"]',
    title: "Servicios disponibles",
    description: "Esta tabla reúne los <strong>servicios disponibles</strong> de la clínica con su valor. El botón <strong>\"Agregar\"</strong> incorpora el servicio al presupuesto y suma su valor al total. En este recorrido <strong>no agregaremos ninguno</strong>.",
    side: "top",
  },
  {
    id: "presupuesto-tour-prestaciones",
    selector: '[data-tour="presupuesto-prestaciones"]',
    title: "Agregar nuevas prestaciones",
    description: "Si desea incorporar <strong>nuevas prestaciones o servicios</strong> al catálogo, puede hacerlo desde este acceso directo —que lo lleva a la pantalla de <strong>\"Tratamientos Disponibles\"</strong>— o bien desde el <strong>menú lateral</strong>, en la sección del mismo nombre. En este recorrido no será necesario.",
    side: "bottom",
  },
  {
    id: "presupuesto-tour-listado",
    selector: '[data-tour="presupuesto-listado"]',
    title: "El presupuesto armado",
    description: "Aquí se van acumulando los servicios agregados. Cada uno admite una <strong>observación para el PDF</strong> —por ejemplo, la pieza dental, la zona o el número de sesiones— y puede quitarse del presupuesto; el <strong>total</strong> se recalcula automáticamente. Como no se agregó nada, la tarjeta muestra su estado vacío.",
    side: "right",
  },
  {
    id: "presupuesto-tour-pdf",
    selector: '[data-tour="presupuesto-pdf"]',
    title: "Descargar el documento",
    description: "Con el botón <strong>\"Descargar PDF\"</strong> se genera el documento del presupuesto, listo para entregar o enviar al paciente, con los servicios, sus observaciones, los totales y los datos del profesional y del paciente. Permanece <strong>deshabilitado</strong> hasta que el presupuesto tenga al menos un servicio; en este recorrido no lo presionaremos.",
    side: "top",
  },
  {
    id: "presupuesto-tour-importante",
    selector: null,
    title: "Importante",
    description: "Esta herramienta es el <strong>Presupuesto Rápido</strong>: su objetivo es generar una <strong>entrega de cotizaciones inmediata</strong> durante la atención. <span class=\"mt-2 block text-xs font-bold text-red-600\">1. NO DEJA REGISTROS: NADA DE LO QUE SE AGREGUE QUEDA GUARDADO.</span> <span class=\"mt-2 block text-xs font-bold text-red-600\">2. NO SE PUEDE ENVIAR POR CORREO: SOLO SE PUEDE DESCARGAR EN PDF.</span> <span class=\"mt-2 block\">Para el presupuesto <strong>más detallado</strong> —con registro y envío por correo— ingrese al <strong>presupuesto asociado a cada paciente</strong>, dentro de la <strong>carpeta clínica</strong> de cada paciente.</span>",
  },
  {
    id: "presupuesto-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo armar un presupuesto: identificar al profesional y al paciente, agregar servicios desde el catálogo, dejar la observación de cada servicio y descargar el PDF. Recuerde que el Presupuesto Rápido <strong>no deja registros</strong>: para cotizaciones formales, utilice el presupuesto asociado al paciente en su carpeta clínica. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
