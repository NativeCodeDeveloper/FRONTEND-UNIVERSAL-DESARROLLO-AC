/**
 * tourBloqueosSteps.js
 * Configuración del tutorial guiado breve de Bloqueos de Agenda
 * (bloqueosAgenda/page.jsx): el proceso completo de bloqueo, de manera
 * ILUSTRATIVA. El usuario no selecciona días ni guarda nada — al cerrar el
 * recorrido no se crea ningún bloqueo y el modo de selección queda como estaba.
 *
 * Mismo criterio que tourCalendarioSteps.js: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null   -> paso sin ancla (mensaje centrado): intro y cierre.
 * activarRango: true -> el paso apunta al botón "Rango de fechas": el panel de
 *                       rango NO se muestra todavía; recién cuando el usuario
 *                       presiona "Siguiente" el tour activa ese modo por su
 *                       cuenta (ver TutorialGuiadoBloqueos), muestra el panel
 *                       y, al cerrarse, restaura el modo original.
 *
 * Las anclas del formulario (bloqueo-profesional, bloqueo-modo-selector,
 * bloqueo-calendario, bloqueo-rango-*, bloqueo-motivo, bloqueo-guardar) ya
 * existen en la página — las comparte con el tour principal. El ancla del
 * calendario solo existe en el modo "Días específicos" y las del panel de
 * rango solo en el modo "Rango de fechas": los pasos cuya ancla no esté en el
 * DOM se saltan solos (skipMissingElement + waitForElement).
 */

export const TOUR_BLOQUEOS_STEPS = [
  {
    id: "bloqueos-tour-intro",
    selector: null,
    title: "Tutorial Guiado Bloqueos",
    description: "Bienvenido al bloqueo de agenda. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo bloquear días u horarios para que no queden disponibles en la agenda pública. <strong>No es necesario seleccionar días ni guardar nada</strong>: al finalizar el recorrido no se creará ningún bloqueo. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "bloqueos-tour-profesional",
    selector: '[data-tour="bloqueo-profesional"]',
    title: "Profesional",
    description: "En primer lugar se selecciona el <strong>profesional</strong> cuya agenda se desea bloquear; el bloqueo aplica únicamente a él. Si la cuenta tiene una <strong>agenda asignada</strong>, el profesional aparece fijado y no puede modificarse.",
    side: "right",
  },
  {
    id: "bloqueos-tour-modo",
    selector: '[data-tour="bloqueo-modo-selector"]',
    title: "Días a bloquear",
    description: "Existen dos maneras de elegir los días: <strong>\"Días específicos\"</strong>, marcándolos uno a uno en el calendario —pueden ser no consecutivos—, o <strong>\"Rango de fechas\"</strong>, definiendo un período y los días de la semana que se repetirán dentro de él. El tutorial mostrará ambos.",
    side: "right",
  },
  {
    id: "bloqueos-tour-calendario",
    selector: '[data-tour="bloqueo-calendario"]',
    title: "Calendario de días específicos",
    description: "En este calendario se marcan los <strong>días a bloquear</strong>, dentro de una <strong>ventana de 3 meses</strong> que avanza automáticamente. En este recorrido <strong>no es necesario marcar ningún día</strong>: la selección es solo ilustrativa.",
    side: "right",
  },
  {
    id: "bloqueos-tour-rango-boton",
    selector: '[data-tour="bloqueo-rango-boton"]',
    title: "Modo rango de fechas",
    description: "Bloquear por rango conviene cuando se trata de un período completo —por ejemplo, las vacaciones de verano—. Presione <strong>\"Siguiente\"</strong> y el tutorial activará este modo para mostrarle sus opciones; si ya se encuentra activo, continuará directamente.",
    side: "right",
    activarRango: true,
  },
  {
    id: "bloqueos-tour-rango-panel",
    selector: '[data-tour="bloqueo-rango-panel"]',
    title: "Rango de fechas",
    description: "En este modo se define el <strong>período</strong> (desde y hasta) y los <strong>días de la semana</strong> que se bloquearán dentro de él. El botón <strong>\"Generar días\"</strong> calcula esas fechas y las carga en la selección. En este recorrido no es necesario generar nada.",
    side: "right",
  },
  {
    id: "bloqueos-tour-horario",
    selector: '[data-tour="bloqueo-rango-horario"]',
    title: "Rango horario",
    description: "El <strong>rango horario</strong> define desde y hasta qué hora estará bloqueada la agenda, y se aplica por igual a todos los días seleccionados.",
    side: "right",
  },
  {
    id: "bloqueos-tour-motivo",
    selector: '[data-tour="bloqueo-motivo"]',
    title: "Motivo del bloqueo",
    description: "El <strong>motivo</strong> identifica el bloqueo en el listado —por ejemplo, vacaciones o congresos—. Es un <strong>campo obligatorio</strong> para poder guardar.",
    side: "right",
  },
  {
    id: "bloqueos-tour-guardar",
    selector: '[data-tour="bloqueo-guardar"]',
    title: "Confirmar el bloqueo",
    description: "El botón <strong>\"Ingresar Bloqueo(s)\"</strong> confirma la operación: se crea <strong>un bloqueo independiente por cada día seleccionado</strong>. Si un día ya tiene una cita agendada, ese día no se bloquea. En este recorrido <strong>no lo presionaremos</strong>: no se creará ningún bloqueo.",
    side: "right",
  },
  {
    id: "bloqueos-tour-listado",
    selector: '[data-tour="bloqueos-listado"]',
    title: "Bloqueos activos",
    description: "Cada bloqueo activo aparece en este listado con su <strong>profesional, motivo, día y horario</strong>. Al seleccionar una fila es posible revisarlo o <strong>liberar ese día</strong> en particular sin afectar los demás; también existen las opciones de <strong>refrescar</strong> y <strong>eliminar todos</strong>.",
    side: "left",
  },
  {
    id: "bloqueos-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo bloquear la agenda: elegir el profesional, seleccionar los días —específicos o por rango—, definir el horario y el motivo, y confirmar. Recuerde que este recorrido fue <strong>ilustrativo</strong>: no se creó ningún bloqueo. Puede repetirlo cuando lo estime conveniente.",
  },
];
