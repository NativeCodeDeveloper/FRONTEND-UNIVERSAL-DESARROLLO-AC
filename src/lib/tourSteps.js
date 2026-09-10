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
 * autoExpand: true   -> para acordeones del sidebar: el tour hace clic por sí
 *                        mismo si el elemento está cerrado (aria-expanded=
 *                        "false"), sin depender de que el usuario adivine
 *                        dónde hacer clic. Determinista frente al estado de
 *                        acordeones abiertos que persiste en sessionStorage.
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
    description: "Esta es la sección de Configuración Clínica — la abrimos automáticamente para ti. Aquí vas a crear a tu profesional, tus servicios, y a unirlos. Presiona \"Siguiente\" para empezar.",
    side: "right",
    autoExpand: true,
  },
  {
    id: "config-profesionales",
    grupo: "Configuración inicial",
    route: null,
    selector: 'a[href="/dashboard/profesionales"]',
    title: "Paso 1: Crea un profesional",
    description: "Empecemos por lo más importante. Aquí creas a tus profesionales — cada uno con su propia agenda de horarios. <strong>Sin al menos un profesional creado, no vas a poder agendar ninguna cita.</strong> Presiona \"Siguiente\" y te muestro exactamente dónde escribir.",
    side: "right",
  },
  {
    id: "profesional-nombre",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-nombre"]',
    title: "Paso 1: Crea un profesional",
    description: "Escribe aquí el nombre completo del profesional (por ejemplo: <em>Dra. Andrea Moran</em>). Este nombre es el que va a aparecer para que tus pacientes elijan con quién atenderse.",
    side: "bottom",
  },
  {
    id: "profesional-descripcion",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-descripcion"]',
    title: "Paso 1: Crea un profesional",
    description: "Aquí va una descripción breve del profesional — por ejemplo su especialidad. <strong>Que sea corta, de una o dos líneas</strong>: esta descripción se muestra tal cual en tu página web, así que mientras más simple y clara, mejor se ve para tus pacientes.",
    side: "bottom",
  },
  {
    id: "profesional-guardar",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-guardar"]',
    title: "Paso 1: Crea un profesional",
    description: "Presiona <strong>\"Guardar Profesional\"</strong> para crearlo. En cuanto lo guardes, este profesional ya tiene su propia agenda lista — solo falta darle un servicio para que pueda recibir reservas. Repite este paso por cada profesional que atienda en tu clínica.",
    side: "top",
  },
  {
    id: "config-servicios",
    grupo: "Configuración inicial",
    route: null,
    selector: 'a[href="/dashboard/serviciosAgendamiento"]',
    title: "Paso 2: Crea un servicio",
    description: "Ahora los servicios que ofrece tu clínica (ej: Consulta general, Control, Evaluación). <strong>Este es el nombre que van a ver tus pacientes</strong> cuando entren a tu página a agendar una hora.",
    side: "right",
  },
  {
    id: "servicio-nombre",
    grupo: "Configuración inicial",
    route: "/dashboard/serviciosAgendamiento",
    selector: '[data-tour="servicio-nombre"]',
    title: "Paso 2: Crea un servicio",
    description: "Escribe el nombre del servicio (ej: <em>Consulta general</em>, <em>Control ortodoncia</em>). Puedes crear todos los servicios que tu clínica ofrezca, uno por uno.",
    side: "bottom",
  },
  {
    id: "servicio-descripcion",
    grupo: "Configuración inicial",
    route: "/dashboard/serviciosAgendamiento",
    selector: '[data-tour="servicio-descripcion"]',
    title: "Paso 2: Crea un servicio",
    description: "Igual que con el profesional: una descripción <strong>breve</strong> de en qué consiste el servicio. Un par de líneas es suficiente — se muestra también en tu página web.",
    side: "bottom",
  },
  {
    id: "servicio-guardar",
    grupo: "Configuración inicial",
    route: "/dashboard/serviciosAgendamiento",
    selector: '[data-tour="servicio-guardar"]',
    title: "Paso 2: Crea un servicio",
    description: "Presiona <strong>\"Guardar Servicio\"</strong>. Con el profesional y el servicio ya creados, solo falta un paso más: unirlos.",
    side: "top",
  },
  {
    id: "config-tarifa",
    grupo: "Configuración inicial",
    route: null,
    selector: 'a[href="/dashboard/tarifaServicio"]',
    title: "Paso 3: Asigna el servicio (obligatorio)",
    description: "Este es el paso que hace que todo funcione: aquí le asignas un servicio, precio y duración a un profesional. <div class=\"ac-tour-callout\"><span>Sin este paso, ese profesional <strong>no va a aparecer disponible</strong> para agendar — ni en tu calendario interno ni en tu página web.</span></div>",
    side: "right",
  },
  {
    id: "tarifa-select-profesional",
    grupo: "Configuración inicial",
    route: "/dashboard/tarifaServicio",
    selector: '[data-tour="tarifa-select-profesional"]',
    title: "Paso 3: Asigna el servicio (obligatorio)",
    description: "Primero, elige el profesional que va a ofrecer este servicio — el mismo que creaste en el Paso 1.",
    side: "bottom",
  },
  {
    id: "tarifa-select-servicio",
    grupo: "Configuración inicial",
    route: "/dashboard/tarifaServicio",
    selector: '[data-tour="tarifa-select-servicio"]',
    title: "Paso 3: Asigna el servicio (obligatorio)",
    description: "Ahora elige el servicio que este profesional va a atender — el que creaste en el Paso 2.",
    side: "bottom",
  },
  {
    id: "tarifa-precio-duracion",
    grupo: "Configuración inicial",
    route: "/dashboard/tarifaServicio",
    selector: '[data-tour="tarifa-precio-duracion"]',
    title: "Paso 3: Asigna el servicio (obligatorio)",
    description: "Define el precio de la consulta y cuántos minutos dura. La duración es importante: de eso depende cada cuánto tiempo se generan los horarios disponibles en la agenda (ej: cada 30 o 60 minutos).",
    side: "bottom",
  },
  {
    id: "tarifa-guardar",
    grupo: "Configuración inicial",
    route: "/dashboard/tarifaServicio",
    selector: '[data-tour="tarifa-guardar"]',
    title: "Paso 3: Asigna el servicio (obligatorio)",
    description: "Presiona <strong>\"Guardar Tarifa\"</strong>. <div class=\"ac-tour-callout\"><span>¡Listo! Con estos 3 pasos (profesional → servicio → asignar) ese profesional ya puede recibir reservas de verdad. Repite este proceso por cada combinación de profesional y servicio que necesites.</span></div>",
    side: "top",
  },
  {
    id: "contenido-web",
    grupo: "Configuración inicial",
    route: null,
    selector: '[data-tour="nav-contenido"]',
    title: "Configuración inicial",
    description: "Por último, aquí administras lo que tus pacientes ven en el sitio público: datos de tu clínica, banners y tratamientos destacados. No es obligatorio para empezar a agendar, pero le da un mejor aspecto a tu página.",
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
  // Los 3 pasos marcados con interactive:true exigen el clic real del usuario
  // sobre el elemento (no el botón "Siguiente" del popover) — así el tour
  // nunca avanza sin que el formulario realmente se haya abierto, llenado o
  // guardado. driver.js llama al mismo onNextClick de cada paso al detectar
  // ese clic, así que la navegación de ruta entre pasos sigue funcionando igual.
  {
    id: "calendario-nueva-reserva",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: "#btn-nueva-reserva",
    title: "Calendario y Reservas",
    description: "Haz clic en el botón morado \"Nueva reserva\" resaltado a la derecha para abrir el formulario.",
    side: "left",
    align: "start",
    interactive: true,
  },
  {
    id: "calendario-horario",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: '[data-tour="reserva-horario"]',
    title: "Calendario y Reservas",
    description: "Elige la fecha y define el horario de inicio y término de la cita.",
    side: "left",
    noPrevious: true,
  },
  {
    id: "calendario-paciente",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: '[data-tour="reserva-paciente"]',
    title: "Calendario y Reservas",
    description: "Datos del paciente. Para esta prueba, usa tu propio nombre, RUT, correo y celular — así vas a recibir de verdad las notificaciones y ver cómo funcionan.",
    side: "left",
  },
  {
    id: "calendario-servicio",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: '[data-tour="reserva-servicio"]',
    title: "Calendario y Reservas",
    description: "Elige un tipo de atención: <strong>es obligatorio</strong> para poder guardar la reserva.",
    side: "left",
  },
  {
    id: "calendario-guardar",
    grupo: "Calendario y Reservas",
    route: "/dashboard/calendario",
    selector: '[data-tour="reserva-guardar"]',
    title: "Calendario y Reservas",
    description: "Haz clic en \"Agendar\" para guardar de verdad. Si falta algún dato obligatorio o el horario ya está ocupado, el sistema te avisa antes de confirmar.",
    side: "top",
    interactive: true,
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
    description: "Este tramo es solo explicativo — no hace falta que crees un bloqueo real ahora, luego lo haces tú con calma. Elige \"Días específicos\" para marcar días sueltos en el calendario (por ejemplo, solo los miércoles), o \"Rango de fechas\" para bloquear un período completo indicando los días de la semana.",
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
    description: "Este botón guarda el bloqueo. Cada día queda bloqueado de forma independiente y se puede eliminar por separado más tarde desde la tabla de la derecha; el calendario de arriba no se marca visualmente, así que no te preocupes si se ve igual. <div class=\"ac-tour-callout\"><span>Hasta aquí llega la parte explicativa — cuando quieras, créalo tú mismo con tranquilidad para tus bloqueos reales.</span></div>",
    side: "top",
  },

  // ── Finanzas ─────────────────────────────────────────────────────────────
  {
    id: "finanzas-periodo",
    grupo: "Finanzas",
    route: "/dashboard/finanzas",
    selector: '[data-tour="finanzas-periodo"]',
    title: "Finanzas",
    description: "Aquí ves cuánto ha generado tu clínica. Elige el período que quieres revisar: mes actual, mes anterior, o un rango de fechas a tu elección.",
    side: "bottom",
  },
  {
    id: "finanzas-kpis",
    grupo: "Finanzas",
    route: "/dashboard/finanzas",
    selector: '[data-tour="finanzas-kpis"]',
    title: "Finanzas",
    description: "Estas tarjetas resumen lo esencial: cuánto llevas reservado vs. confirmado, cuántas citas tienes y qué porcentaje de tus reservas se confirma.",
    side: "bottom",
  },
  {
    id: "finanzas-evolucion",
    grupo: "Finanzas",
    route: "/dashboard/finanzas",
    selector: '[data-tour="finanzas-evolucion"]',
    title: "Finanzas",
    description: "Este gráfico muestra cómo han evolucionado tus ingresos confirmados mes a mes, para que veas de un vistazo si tu clínica va creciendo.",
    side: "top",
  },
  {
    id: "finanzas-rendimiento",
    grupo: "Finanzas",
    route: "/dashboard/finanzas",
    selector: '[data-tour="finanzas-rendimiento"]',
    title: "Finanzas",
    description: "Aquí ves cuánto ha generado cada profesional. Haz clic sobre uno para abrir el detalle por servicio — útil si trabajas con varios profesionales y quieres saber el aporte de cada uno.",
    side: "top",
  },

  // ── Cierre ───────────────────────────────────────────────────────────────
  {
    id: "tour-final",
    grupo: "Finanzas",
    route: null,
    selector: null,
    title: "Tutorial completado",
    description: "Ya viste lo esencial: crear un profesional, un servicio y asignarlos (lo más importante para empezar), agendar y guardar citas, crear fichas clínicas, bloquear horarios y revisar tus finanzas. Si te quedan dudas, visita la <a href=\"https://academia.agendaclinicas.cl/dashboard\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ac-tour-link\">Academia de Agenda Clínica</a> para más contenido.",
  },
];
