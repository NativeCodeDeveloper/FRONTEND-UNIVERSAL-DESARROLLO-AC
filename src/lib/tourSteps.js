/**
 * tourSteps.js
 * Configuración del tutorial guiado del dashboard.
 * Cada paso resalta un elemento real de la UI (via data-tour o un selector
 * CSS normal) y puede exigir estar en una ruta específica antes de mostrarse.
 *
 * route: null        -> el elemento vive en el layout compartido (ej. sidebar)
 *                        o en la misma página ya navegada, no hace falta
 *                        navegar a ninguna ruta en particular.
 * route: "/ruta"     -> el TourProvider navega ahí antes de resaltar el paso.
 * interactive: true  -> el usuario debe hacer clic en el elemento real (no en
 *                        "Siguiente") para que el tour avance.
 * noPrevious: true   -> oculta el botón "Atrás" en este paso (usado después
 *                        de un paso interactivo, donde volver atrás no aplica
 *                        de forma segura).
 * skipIfExpanded: true -> para pasos interactivos que abren un acordeón con
 *                        toggle: si el usuario repite el tour y ya lo dejó
 *                        abierto de una corrida anterior, el clic normal lo
 *                        cerraría en vez de abrirlo. Con esta bandera el paso
 *                        se salta solo (avanza al siguiente) si el elemento
 *                        ya está expandido (aria-expanded="true").
 * selector: null      -> paso sin elemento anclado (mensaje centrado, usado
 *                        solo para el cierre del tour).
 */

export const TOUR_STEPS = [
  // ── Configuración inicial ────────────────────────────────────────────────
  {
    id: "config-clinica",
    grupo: "Configuración inicial",
    route: null,
    selector: '[data-tour="nav-configuracion"]',
    title: "Configuración inicial",
    description: "Haz clic aquí para abrir esta sección y ver qué puedes configurar antes de empezar a operar.",
    side: "right",
    interactive: true,
    skipIfExpanded: true,
  },
  {
    id: "config-profesionales",
    grupo: "Configuración inicial",
    route: null,
    selector: 'a[href="/dashboard/profesionales"]',
    title: "Configuración inicial",
    description: "Aquí creas a tus profesionales y defines sus horarios de atención. Es el primer paso: sin al menos un profesional creado no vas a poder agendar citas.",
    side: "right",
    noPrevious: true,
  },
  {
    id: "config-servicios",
    grupo: "Configuración inicial",
    route: null,
    selector: 'a[href="/dashboard/serviciosAgendamiento"]',
    title: "Configuración inicial",
    description: "Aquí defines los servicios que ofreces. Después, en \"Tarifas de Consulta\", asígnales precio y duración: sin al menos un servicio con tarifa, no vas a poder completar una reserva más adelante en este tutorial.",
    side: "right",
  },
  {
    id: "contenido-web",
    grupo: "Configuración inicial",
    route: null,
    selector: '[data-tour="nav-contenido"]',
    title: "Configuración inicial",
    description: "Aquí administras lo que tus pacientes ven en el sitio público: datos de tu clínica, banners y tratamientos destacados.",
    side: "right",
  },

  // ── Panel de Reservas ────────────────────────────────────────────────────
  {
    id: "panel-resumen",
    grupo: "Panel de Reservas",
    route: "/dashboard",
    selector: '[data-tour="dashboard-kpis"]',
    title: "Panel de Reservas",
    description: "Estas tarjetas resumen cuántas citas tienes en total y en qué estado están: confirmadas, con asistencia registrada, anuladas o finalizadas.",
    side: "bottom",
  },
  {
    id: "panel-filtros",
    grupo: "Panel de Reservas",
    route: "/dashboard",
    selector: '[data-tour="dashboard-filtros-header"]',
    title: "Panel de Reservas",
    description: "Abre este panel para buscar citas por nombre, RUT, profesional, estado o un rango de fechas específico.",
    side: "bottom",
  },
  {
    id: "panel-exportar",
    grupo: "Panel de Reservas",
    route: "/dashboard",
    selector: '[data-tour="dashboard-exportar-excel"]',
    title: "Panel de Reservas",
    description: "Descarga el listado de citas visibles en una planilla Excel, útil para reportes o respaldos.",
    side: "left",
  },

  // ── Calendario y Reservas ────────────────────────────────────────────────
  {
    id: "calendario-nueva-reserva",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: "#btn-nueva-reserva",
    title: "Calendario y Reservas",
    description: "Haz clic en el botón morado \"Nueva reserva\" resaltado a la derecha. Cuando se abra el formulario, presiona \"Siguiente\" para continuar.",
    side: "left",
    align: "start",
  },
  {
    id: "calendario-formulario",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: '[data-tour="reserva-drawer"]',
    title: "Calendario y Reservas",
    description: "Completa la fecha y el horario. En los datos del paciente, usa tu propio nombre, RUT, correo y celular — así vas a recibir de verdad las notificaciones y ver cómo funcionan. Baja con scroll hasta \"Servicio\" y elige un tipo de atención: es obligatorio para poder guardar.",
    side: "left",
    noPrevious: true,
  },
  {
    id: "calendario-guardar",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: '[data-tour="reserva-guardar"]',
    title: "Calendario y Reservas",
    description: "Presiona \"Agendar\" para guardar. Si falta algún dato obligatorio o el horario ya está ocupado, el sistema te avisa antes de confirmar.",
    side: "top",
  },

  // ── De la reserva a la ficha clínica ─────────────────────────────────────
  {
    id: "panel-ver-ficha",
    grupo: "Pacientes y Fichas",
    route: "/dashboard",
    selector: '[data-tour="dashboard-tabla-citas"]',
    title: "Pacientes y Fichas",
    description: "Tu reserva de prueba ya aparece aquí (la vas a reconocer por tu propio nombre). Búscala y presiona el ícono de ojo: si el paciente todavía no tiene ficha, el sistema te va a preguntar si quieres crearla con esos datos.",
    side: "top",
  },
  {
    id: "fichas-detalle-acciones",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="ficha-acciones-rapidas"]',
    title: "Pacientes y Fichas",
    description: "Esta es la ficha del paciente. Desde aquí creas una nueva ficha clínica (el registro de una atención), agendas otra cita, o abres Odontograma, Receta y Documentos según tus permisos.",
    side: "bottom",
  },
  {
    id: "fichas-registros",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="ficha-registros"]',
    title: "Pacientes y Fichas",
    description: "Todo el historial clínico del paciente queda ordenado cronológicamente aquí, agrupado por mes.",
    side: "top",
  },

  // ── Bloqueos ─────────────────────────────────────────────────────────────
  {
    id: "bloqueos-modo",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-modo-selector"]',
    title: "Bloqueos",
    description: "Elige \"Días específicos\" para marcar días sueltos en el calendario (por ejemplo, solo los miércoles), o \"Rango de fechas\" para bloquear un período completo indicando los días de la semana.",
    side: "right",
  },
  {
    id: "bloqueos-calendario",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-calendario"]',
    title: "Bloqueos",
    description: "Haz clic en los días que quieres bloquear; puedes seleccionar varios días no consecutivos.",
    side: "right",
  },
  {
    id: "bloqueos-horario",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-horario"]',
    title: "Bloqueos",
    description: "Define la hora de inicio y término: se aplica a todos los días que seleccionaste.",
    side: "right",
  },
  {
    id: "bloqueos-motivo",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-motivo"]',
    title: "Bloqueos",
    description: "El motivo es obligatorio: sin él no vas a poder guardar el bloqueo. Ej: Vacaciones, Congreso, capacitación.",
    side: "right",
  },
  {
    id: "bloqueos-guardar",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-guardar"]',
    title: "Bloqueos",
    description: "Guarda el bloqueo. Cada día queda bloqueado de forma independiente y se puede eliminar por separado más tarde desde la tabla de la derecha; el calendario de arriba no se marca visualmente, así que no te preocupes si se ve igual.",
    side: "top",
  },

  // ── Cierre ───────────────────────────────────────────────────────────────
  {
    id: "tour-final",
    grupo: "Bloqueos",
    route: null,
    selector: null,
    title: "Tutorial completado",
    description: "Ya viste lo esencial: configurar tu clínica, agendar y guardar citas, crear fichas clínicas y bloquear horarios. Si te quedan dudas, visita la <a href=\"https://academia.agendaclinicas.cl/dashboard\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ac-tour-link\">Academia de Agenda Clínica</a> para más contenido.",
  },
];
