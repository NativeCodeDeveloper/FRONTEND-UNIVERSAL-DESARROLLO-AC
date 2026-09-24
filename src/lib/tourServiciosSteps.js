/**
 * tourServiciosSteps.js
 * Configuración del tutorial guiado breve de Servicios de Agendamiento
 * (serviciosAgendamiento/page.jsx): el registro y administración de los
 * servicios habilitados para agendar, de manera ILUSTRATIVA. El usuario no
 * completa campos ni guarda nada — al cerrar el recorrido no se habrá creado
 * ningún servicio.
 *
 * Mismo criterio que los demás tours livianos: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null     -> paso sin ancla (mensaje centrado): intro y cierre.
 * abrirDetalles: true -> el paso apunta al <details> colapsado del listado: el
 *                        tour lo abre ANTES de que driver mida el elemento,
 *                        para que se vea su contenido (ver
 *                        TutorialGuiadoServicios).
 *
 * Las anclas del formulario (servicio-nombre, servicio-descripcion,
 * servicio-guardar) ya existen en la página — las comparte con el tour
 * principal. El ancla del listado se agregó para este tutorial
 * (servicio-listado).
 */

export const TOUR_SERVICIOS_STEPS = [
  {
    id: "servicios-tour-intro",
    selector: null,
    title: "Tutorial Guiado Servicios",
    description: "Bienvenido a la sección de servicios de agendamiento. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo registrar y administrar los <strong>servicios habilitados para el agendamiento</strong>. <strong>No es necesario completar campos ni guardar nada</strong>: al finalizar el recorrido no se habrá creado ningún servicio. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "servicios-tour-nombre",
    selector: '[data-tour="servicio-nombre"]',
    title: "Nombre del servicio",
    description: "El <strong>nombre</strong> identifica al servicio — por ejemplo, \"Consulta general\" o \"Control ortodoncia\". Solo se permiten letras y espacios. Es el nombre que se utilizará al asignar tarifas y al agendar.",
    side: "top",
  },
  {
    id: "servicios-tour-descripcion",
    selector: '[data-tour="servicio-descripcion"]',
    title: "Descripción del servicio",
    description: "La <strong>descripción</strong> complementa el servicio y explica en qué consiste — por ejemplo, \"Consulta general con evaluación completa del paciente\".",
    side: "top",
  },
  {
    id: "servicios-tour-guardar",
    selector: '[data-tour="servicio-guardar"]',
    title: "Guardar o actualizar",
    description: "Desde aquí se administra el servicio: <strong>\"Guardar Servicio\"</strong> registra uno nuevo y <strong>\"Actualizar Servicio\"</strong> modifica el que se haya seleccionado desde el listado. En este recorrido <strong>no presionaremos ninguno</strong>.",
    side: "top",
  },
  {
    id: "servicios-tour-listado",
    selector: '[data-tour="servicio-listado"]',
    title: "Servicios disponibles",
    description: "El listado reúne los <strong>servicios habilitados para el agendamiento</strong>, con su descripción y estado. Con <strong>\"Editar\"</strong> se carga un servicio en el formulario para modificarlo y con <strong>\"Eliminar\"</strong> se retira. Estos son los servicios entre los que se elige al agendar y a los que luego se asignan tarifas.",
    side: "top",
    abrirDetalles: true,
  },
  {
    id: "servicios-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo registrar y administrar los servicios de agendamiento. Estos servicios son la base para <strong>asignar tarifas</strong> y para que los pacientes agenden. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
