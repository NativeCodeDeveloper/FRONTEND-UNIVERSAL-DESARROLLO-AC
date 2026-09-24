/**
 * tourCotizacionesSteps.js
 * Configuración del tutorial guiado breve de la página de Cotizaciones del
 * paciente (cotizacionesPaciente/[id_paciente]).
 *
 * Mismo criterio que tourFichasSteps.js: un recorrido de solo lectura que
 * vive completamente en esta página — no navega a otras rutas ni hace clic
 * por el usuario. Explica cómo crear una cotización, cómo filtrar el
 * historial y qué hace cada zona de una tarjeta (estado, detalle, eliminar).
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 *
 * Los pasos que apuntan a la tarjeta de cotización y sus acciones usan el
 * PRIMER artículo del listado (document.querySelector toma el primero). Si el
 * paciente no tiene cotizaciones, esas anclas no existen en el DOM y el paso
 * se salta solo (skipMissingElement en TutorialGuiadoCotizaciones).
 */

export const TOUR_COTIZACIONES_STEPS = [
  {
    id: "cotizaciones-intro",
    selector: null,
    title: "Tutorial Guiado Cotizaciones",
    description: "Bienvenido a las cotizaciones del paciente. A continuación se presenta un recorrido por esta pantalla: cómo <strong>crear una cotización</strong>, cómo <strong>filtrar</strong> el historial y qué acciones permite cada tarjeta (<strong>cambiar el estado</strong>, <strong>ver el detalle</strong> o <strong>eliminar</strong>). Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "cotizaciones-nueva",
    selector: '[data-tour="cotizaciones-boton-nueva"]',
    title: "Cómo crear una cotización",
    description: "Las cotizaciones se crean con este botón. Al presionarlo se despliega un formulario en el que se ingresa el <strong>nombre de la cotización</strong> y se selecciona el <strong>profesional solicitante</strong>; luego, el botón \"Crear Cotizacion\" la registra en el sistema. Toda cotización nace con un total de $0: los tratamientos y sus valores se incorporan posteriormente en su detalle.",
    side: "bottom",
  },
  {
    id: "cotizaciones-paciente",
    selector: '[data-tour="cotizaciones-tarjeta-paciente"]',
    title: "Datos del paciente",
    description: "Esta tarjeta concentra los antecedentes del paciente: <strong>fecha de nacimiento, edad, previsión de salud, sexo y datos de contacto</strong>. El botón <strong>\"Ver carpeta clínica\"</strong> lo devuelve a la carpeta del paciente, donde se encuentran las fichas clínicas, odontogramas y demás registros.",
    side: "right",
  },
  {
    id: "cotizaciones-filtro-estado",
    selector: '[data-tour="cotizaciones-filtro-estado"]',
    title: "Filtrar por estado",
    description: "Este filtro permite mostrar únicamente las cotizaciones cuyo tratamiento se encuentre <strong>Activo</strong>, <strong>en curso</strong> o <strong>finalizado</strong>. La opción <strong>\"Todos los estados\"</strong> restablece el listado completo.",
    side: "bottom",
  },
  {
    id: "cotizaciones-filtro-profesional",
    selector: '[data-tour="cotizaciones-filtro-profesional"]',
    title: "Buscar por profesional",
    description: "Al escribir el nombre de un profesional, el listado se filtra <strong>en tiempo real</strong> y muestra solamente sus cotizaciones. Al borrar la búsqueda se restablece el listado completo.",
    side: "bottom",
  },
  {
    id: "cotizaciones-tarjeta",
    selector: '[data-tour="cotizaciones-tarjeta"]',
    title: "La tarjeta de cotización",
    description: "Cada tarjeta corresponde a una cotización e informa su <strong>código (COT)</strong>, el <strong>estado actual</strong>, el <strong>total cotizado</strong>, el <strong>profesional solicitante</strong> y las <strong>fechas de creación</strong> y de <strong>última modificación</strong>. El total aumenta a medida que se agregan tratamientos en el detalle de la cotización.",
    side: "top",
  },
  {
    id: "cotizaciones-estado",
    selector: '[data-tour="cotizaciones-cambiar-estado"]',
    title: "Cambiar estado de la cotización",
    description: "Este selector permite actualizar el estado de la cotización: <strong>Activa</strong>, <strong>Tratamiento en curso</strong>, <strong>Tratamiento finalizado</strong> o <strong>Tratamiento abandonado</strong>. El cambio se guarda de inmediato y queda reflejado en la insignia de la tarjeta.",
    side: "top",
  },
  {
    id: "cotizaciones-acciones",
    selector: '[data-tour="cotizaciones-acciones"]',
    title: "Ver detalle y eliminar",
    description: "<strong>\"Ver detalle\"</strong> abre la cotización completa, donde se agregan y administran sus tratamientos y valores. <strong>\"Eliminar\"</strong> borra la cotización de forma definitiva; el sistema solicitará confirmación antes de ejecutar la acción.",
    side: "top",
  },
  {
    id: "cotizaciones-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto ya sabe cómo crear cotizaciones, filtrar el historial y administrar el estado de cada una. Para administrar los tratamientos y valores de una cotización, ingrese a través de <strong>\"Ver detalle\"</strong>. Si desea repasar alguna sección, puede reiniciar este tutorial cuando lo estime conveniente.",
  },
];
