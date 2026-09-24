/**
 * tourCalendarioSteps.js
 * Configuración del tutorial guiado breve del Calendario de reservas
 * (calendario/page.jsx): el proceso completo de agendamiento, de manera
 * ILUSTRATIVA. El usuario no completa campos ni guarda nada — el tour abre el
 * formulario por su cuenta y, al cerrarse, descarta el borrador sin registrar
 * ninguna reserva.
 *
 * A diferencia del tour principal (tourSteps.js), acá no hay pasos
 * interactivos ni condiciones `esperar`: es un recorrido de solo lectura.
 *
 * selector: null    -> paso sin ancla (mensaje centrado): intro y cierre.
 * abrirDrawer: true -> el paso apunta al botón "Nueva reserva": el drawer del
 *                      agendamiento (AppointmentDrawer) NO se abre todavía;
 *                      recién cuando el usuario presiona "Siguiente" el tour
 *                      lo abre por su cuenta, y los pasos siguientes viven
 *                      dentro de él. Al cerrar el tour, el drawer se cierra
 *                      solo (ver TutorialGuiadoCalendario).
 * abrirRepetir: true -> la sección "Repetir cita en más fechas" está colapsada
 *                       por defecto: el tour la despliega por su cuenta al
 *                       llegar al paso, para que se vea el mini calendario.
 *
 * Los anclas del drawer (reserva-horario, reserva-paciente, reserva-servicio,
 * reserva-guardar) ya existen en AppointmentDrawer.jsx — las comparte con el
 * tour principal — y no están en el DOM hasta que el drawer se monta; por eso
 * el driver de este tour configura waitForElement, que espera a que aparezcan
 * (MutationObserver) antes de saltarse un paso.
 */

export const TOUR_CALENDARIO_STEPS = [
  {
    id: "calendario-tour-intro",
    selector: null,
    title: "Tutorial Guiado Agendamiento",
    description: "Bienvenido al calendario de reservas. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo se completa un agendamiento de principio a fin. <strong>No es necesario escribir ni guardar nada</strong>: al finalizar el recorrido no quedará ninguna reserva registrada. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "calendario-tour-nueva",
    selector: "#btn-nueva-reserva",
    title: "Iniciar un agendamiento",
    description: "Todo agendamiento comienza con el botón <strong>\"Nueva reserva\"</strong>, o bien seleccionando un espacio libre directamente en la grilla del calendario. Presione <strong>\"Siguiente\"</strong> y el tutorial lo abrirá de forma automática para mostrarle el formulario. <strong>No es necesario que complete ningún campo</strong>: el recorrido es solo ilustrativo.",
    side: "bottom",
    abrirDrawer: true,
  },
  {
    id: "calendario-tour-horario",
    selector: '[data-tour="reserva-horario"]',
    title: "Horario de la atención",
    description: "Primero se define el <strong>horario</strong>: la fecha y las horas de <strong>inicio y término</strong> de la consulta. Al partir de un espacio de la grilla, el sistema propone el horario seleccionado, y se indica el <strong>profesional</strong> dueño de la agenda en que se reservará.",
    side: "left",
  },
  {
    id: "calendario-tour-paciente",
    selector: '[data-tour="reserva-paciente"]',
    title: "Datos del paciente",
    description: "Luego se identifican los <strong>datos del paciente</strong>: RUT, nombre, apellido y contacto. Si el RUT ya está registrado, el sistema lo reconoce y muestra la leyenda <strong>\"Paciente encontrado\"</strong>; la opción <strong>\"RUT desconocido\"</strong> permite agendar a pacientes primerizos. <span class=\"mt-2 block text-xs font-bold text-red-600\">NO SE PUEDE CREAR FICHAS CLÍNICAS DE PACIENTES QUE NO SE CONOCE SU RUT</span>",
    side: "left",
  },
  {
    id: "calendario-tour-servicio",
    selector: '[data-tour="reserva-servicio"]',
    title: "Servicio y monto",
    description: "En esta sección se selecciona el <strong>tipo de atención</strong> a partir de los servicios y tarifas definidos para el profesional. Al elegirlo, el sistema asigna automáticamente el <strong>monto</strong> de la consulta. <span class=\"mt-2 block text-xs font-bold text-red-600\">EL SERVICIO ES OBLIGATORIO: SI NO EXISTE O NO HA SIDO CREADO, NO SE PODRÁ AGENDAR</span>",
    side: "left",
  },
  {
    id: "calendario-tour-repetir",
    selector: '[data-tour="reserva-repetir"]',
    title: "Repetir cita en más fechas (opcional)",
    description: "Esta sección <strong>opcional</strong> agenda al mismo paciente, a la <strong>misma hora</strong> y con el mismo profesional y servicio, en <strong>días adicionales</strong>: se despliega con su título, se marcan las fechas en el mini calendario —por ejemplo, todos los martes del mes— y, al confirmar la reserva, se crean todas esas citas juntas. Cada día marcado genera una <strong>reserva real</strong>, así que debe marcarse con cuidado. En este recorrido <strong>no seleccionaremos ninguna fecha</strong>.",
    side: "left",
    abrirRepetir: true,
  },
  {
    id: "calendario-tour-guardar",
    selector: '[data-tour="reserva-guardar"]',
    title: "Confirmar la reserva",
    description: "Finalmente, el botón <strong>\"Agendar\"</strong> confirma la reserva: la hora queda registrada en la agenda del profesional y se notifica al paciente. En este recorrido <strong>no lo presionaremos</strong>: al cerrar el tutorial el borrador se descarta sin agendar nada.",
    side: "left",
  },
  {
    id: "calendario-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted conoce el proceso completo de agendamiento: iniciar la reserva, definir el horario, identificar al paciente, seleccionar el servicio y confirmar con <strong>\"Agendar\"</strong>. Recuerde que este recorrido fue <strong>ilustrativo</strong>: no se registró ninguna reserva. Puede repetirlo cuando lo estime conveniente.",
  },
];
