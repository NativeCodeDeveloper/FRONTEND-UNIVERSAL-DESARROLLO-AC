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
 * retrocederHasta: "id" -> al presionar "Atrás", vuelve a un paso estable
 *                        específico. Es útil cuando el paso inmediatamente
 *                        anterior depende de estado local que se pierde al
 *                        cambiar de ruta.
 * omitirHasta: "id"  -> al presionar "Omitir", salta directamente al paso
 *                        indicado. Se usa cuando el paso siguiente depende de
 *                        una acción que el usuario decidió no realizar.
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
 * esperar: {...}    -> condición real de éxito de un paso interactivo. El tour
 *                        solo avanza cuando se cumple, no por el hecho de que
 *                        hubo un clic. Formas admitidas:
 *                          { tipo: "aparece", selector }     el elemento debe existir
 *                          { tipo: "desaparece", selector }  el elemento debe irse
 *                          { tipo: "sale-de-ruta", ruta }    debe haber navegado
 *                          { tipo: "atributo", selector,
 *                            atributo, valor }                el atributo debe coincidir
 *                        Si no se cumple, el paso se queda donde está y el
 *                        usuario puede corregir y volver a intentarlo.
 * aviso: "texto"    -> qué mostrar dentro del popover si la condición de
 *                        `esperar` no se cumple a los ~2,5s del clic. Sirve para
 *                        que el usuario sepa POR QUÉ el tour no avanzó en vez de
 *                        creer que se congeló. Los pasos interactivos conservan
 *                        el botón "Atrás", así que desde el aviso puede volver a
 *                        los campos anteriores y corregir.
 * optional: true     -> el paso pertenece a una rama que puede no existir en
 *                        esta corrida (ej. ficha nueva vs. ficha existente).
 *                        El tour compite entre los pasos opcionales
 *                        consecutivos y entra solo al primero cuyo ancla esté
 *                        realmente en el DOM; si ninguno aplica, cae al primer
 *                        paso NO opcional que los sigue (el punto donde las
 *                        ramas se vuelven a juntar). Sin esta bandera, cada
 *                        rama que no aplica costaría el timeout completo.
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
    id: "profesional-nuevo",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-nuevo"]',
    title: "Paso 1: Crea un profesional",
    description: "Cada profesional que registres aparece aquí como una tarjeta, con su agenda propia. Haz clic en el botón <strong>\"Nuevo Profesional\"</strong> resaltado para abrir el formulario; desde ahí te guiaremos campo por campo.",
    side: "bottom",
    interactive: true,
    esperar: { tipo: "aparece", selector: '[data-tour="profesional-nombre"]' },
    aviso: "El formulario de nuevo profesional todavía no se abrió. Haz clic en el botón <strong>\"Nuevo Profesional\"</strong> resaltado para continuar.",
    omitirHasta: "profesional-lista",
  },
  {
    id: "profesional-nombre",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-nombre"]',
    title: "Paso 1: Crea un profesional",
    description: "Este será el <strong>nombre visible del profesional en tu agenda</strong>. Escríbelo tal como quieres que lo identifiquen al reservar, por ejemplo: <em>Dr. Greg House</em>.",
    side: "bottom",
  },
  {
    id: "profesional-correo",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-correo"]',
    title: "Paso 1: Crea un profesional",
    description: "Este correo es <strong>muy importante</strong>: aquí llegarán las notificaciones de nuevos agendamientos y los avisos cuando sus agendas se creen o se actualicen. Así el profesional puede mantenerse informado de los cambios.",
    side: "bottom",
  },
  {
    id: "profesional-telefono",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-telefono"]',
    title: "Paso 1: Crea un profesional",
    description: "El <strong>teléfono</strong> es un dato de contacto relevante para otras funciones dentro del sistema. Puedes escribirlo como 12345678 o +56912345678: el campo lo ordena automáticamente y te avisa si quedó incompleto.",
    side: "bottom",
  },
  {
    id: "profesional-rut",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-rut"]',
    title: "Paso 1: Crea un profesional",
    description: "El <strong>RUT del profesional</strong> es importante si presta servicios de salud, porque esta información es requerida en las fichas clínicas. Escríbelo sin puntos ni guión: el sistema lo formatea automáticamente.",
    side: "bottom",
  },
  {
    id: "profesional-descripcion",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-descripcion"]',
    title: "Paso 1: Crea un profesional",
    description: "Aquí escribe el <strong>título o la especialidad</strong>, por ejemplo: Médico, Matrona, Cirujano Dentista, Nutricionista, Psicólogo o la especialidad que estimes pertinente. Los pacientes verán este texto al agendar desde la web, por eso debe ser claro y no demasiado largo.",
    side: "bottom",
  },
  {
    id: "profesional-guardar",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-guardar"]',
    title: "Paso 1: Crea un profesional",
    description: "Presiona <strong>\"Registrar Profesional\"</strong> para crearlo. En cuanto lo guardes aparece como tarjeta en la lista, con su agenda lista — solo falta darle un servicio para que pueda recibir reservas. Repite este paso por cada profesional de tu clínica.",
    side: "top",
    interactive: true,
    esperar: { tipo: "desaparece", selector: '[data-tour="profesional-guardar"]' },
    aviso: "El profesional <strong>todavía no se guardó</strong>. Revisa los campos obligatorios y los mensajes del formulario; luego vuelve a presionar <strong>\"Registrar Profesional\"</strong>.",
    omitirHasta: "profesional-lista",
  },
  {
    id: "profesional-lista",
    grupo: "Configuración inicial",
    route: "/dashboard/profesionales",
    selector: '[data-tour="profesional-lista"]',
    title: "Paso 1: Crea un profesional",
    description: "Así queda cada profesional: una tarjeta con su correo, teléfono y RUT a la vista. Desde aquí lo <strong>editas</strong> o lo <strong>eliminas</strong> cuando lo necesites, y el buscador de arriba te sirve cuando ya tengas varios.",
    side: "top",
    // Opcional: si todavia no hay ningun profesional creado, esta lista no existe
    // en pantalla y el tour sigue de largo sin quedarse esperando.
    optional: true,
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
    description: "Ingresa el precio y la duración en minutos (por ejemplo, 30 o 60).",
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
    // Se nombra el botón por su texto, no por su color: el resaltado del tour ya
    // lo señala y "morado" no le sirve a quien no distingue ese color.
    description: "Haz clic en el botón <strong>\"Nueva reserva\"</strong> que está resaltado para abrir el formulario de la cita. Si eliges <strong>\"Omitir\"</strong>, el tour pasará directamente a explicar los bloqueos de horarios.",
    side: "left",
    align: "start",
    interactive: true,
    // Avanza cuando el panel de la reserva está realmente en pantalla; si no se
    // abrió, los pasos siguientes anclarían a campos que no existen.
    esperar: { tipo: "aparece", selector: '[data-tour="reserva-drawer"]' },
    aviso: "El formulario de la cita todavía no se abrió, y el tutorial no puede seguir sin él. Vuelve a hacer clic en el botón <strong>\"Nueva reserva\"</strong> resaltado.",
    omitirHasta: "bloqueos-profesional",
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
    description: "Para esta prueba, usa tu propio nombre, RUT, correo y celular para recibir las notificaciones. Si no conoces el RUT, puedes marcar la casilla <strong>\"RUT desconocido\"</strong>. <div class=\"ac-tour-callout\"><span>Ten presente que el RUT se utiliza para crear la ficha clínica. Sin este dato, <strong>no podrás crear una ficha para el paciente</strong>.</span></div>",
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
    description: "Te recomendamos <strong>agendarte a ti mismo</strong> con tu correo y celular para comprobar cómo aparece la cita en la agenda y qué mensajes recibes. Haz clic en <strong>\"Agendar\"</strong> para guardarla; cuando se confirme, el tour pasará directamente a <strong>Bloqueos de agendas</strong>. Si prefieres no crear una cita, presiona <strong>\"Omitir\"</strong> para ir a esa misma sección. <div class=\"ac-tour-callout\"><span>Si falta un dato obligatorio o el horario ya está ocupado, el sistema te avisa con un mensaje en pantalla y la cita <strong>no</strong> se guarda. Si eso pasa, corrige lo que falte y vuelve a presionar \"Agendar\" antes de continuar.</span></div>",
    side: "top",
    interactive: true,
    // Avanza solo cuando el backend confirmó la cita. Si faltaba un dato o la
    // hora estaba ocupada, la reserva no se creó: el tour se queda en este paso
    // para que el usuario corrija y vuelva a presionar "Agendar". Se mira la
    // reserva creada y no "el panel se cerró", porque "Cancelar" también lo
    // cierra y eso no es haber agendado.
    esperar: { tipo: "reserva-creada" },
    aviso: "La cita <strong>todavía no se guardó</strong>, así que el tutorial se queda aquí. Mira el mensaje que salió en pantalla: suele faltar un dato obligatorio o el horario ya está ocupado. Usa <strong>\"Atrás\"</strong> para volver a los campos, corrige y presiona <strong>\"Agendar\"</strong> de nuevo.",
    omitirHasta: "bloqueos-profesional",
  },

  // ── De la reserva a la ficha clínica ─────────────────────────────────────
  // Este tramo se bifurca según si el paciente ya tenía ficha o no:
  //   sin ficha → /dashboard/NuevaFicha/{id}     (rama A, la del cliente nuevo)
  //   con ficha → /dashboard/FichasPacientes/{id} (rama B)
  // Por eso los pasos de ambas ramas van marcados `optional: true`: el tour
  // compite entre ellos y entra solo a la rama que realmente se renderizó.
  {
    id: "panel-ver-ficha",
    grupo: "Pacientes y Fichas",
    route: "/dashboard",
    // Ancla el BOTÓN de ojo de la fila correcta, no el encabezado de la tabla.
    // Antes apuntaba a '[data-tour="dashboard-citas-header"]' y el paso era
    // inservible: el recuadro resaltaba una franja donde no hay nada que pulsar,
    // mientras el ícono de ojo quedaba debajo de la capa oscura de driver.js —
    // el clic del usuario ni siquiera llegaba al botón, así que la ficha no se
    // abría y el tour se iba igual al tramo siguiente.
    //
    // El Panel de Reservas marca con este data-tour un único botón: el de la
    // reserva de prueba recién creada (se reconoce por el RUT, ver
    // src/lib/tourReserva.js) o, si esa cita no está en el listado visible, el
    // de la primera fila. Anclar al botón y no a la fila mantiene el recuadro
    // pequeño y el popover bien puesto aunque haya cientos de citas.
    selector: '[data-tour="dashboard-ver-ficha"]',
    title: "Pacientes y Fichas",
    description: "Desde cualquier cita puedes saltar a la ficha clínica del paciente. Te dejamos resaltado el <strong>ícono de ojo</strong> de tu reserva de prueba: haz clic ahí para abrirla. <div class=\"ac-tour-callout\"><span>Si el paciente todavía no tiene ficha, el navegador te va a mostrar una ventana preguntando si quieres crearla: presiona <strong>Aceptar</strong> y el tour sigue solo.</span></div>",
    side: "left",
    align: "center",
    // Interactivo a propósito: antes tenía botón "Siguiente", y quien lo
    // presionaba se quedaba en /dashboard mientras el tour buscaba anclas que
    // solo existen en la ficha — se saltaba el tramo completo sin avisar.
    interactive: true,
    // Y solo avanza cuando la ficha se abrió de verdad. Si el usuario cancela la
    // ventana del navegador, sigue en el Panel y el tour lo espera acá.
    esperar: { tipo: "sale-de-ruta", ruta: "/dashboard" },
    aviso: "La ficha todavía no se abrió. Haz clic en el <strong>ícono de ojo</strong> resaltado; si el navegador te muestra una ventana preguntando si quieres crear la ficha, presiona <strong>Aceptar</strong>.",
    omitirHasta: "bloqueos-profesional",
    // Viene después de "calendario-guardar", que es interactivo: al guardar, el
    // drawer de la reserva se cierra, así que "Atrás" apuntaría a un formulario
    // que ya no existe.
    noPrevious: true,
  },

  // ── Rama A: el paciente todavía no tenía ficha ───────────────────────────
  {
    id: "nueva-ficha-plantilla",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="nueva-ficha-plantilla"]',
    title: "Pacientes y Fichas",
    description: "El paciente quedó creado con los datos de la reserva y esta es su primera ficha clínica. Empieza eligiendo la <strong>plantilla</strong>: define qué campos vas a registrar en la atención. Puedes crear tus propias plantillas después, en Plantillas y Exámenes.",
    side: "bottom",
    noPrevious: true,
    optional: true,
  },
  {
    id: "nueva-ficha-fecha",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="nueva-ficha-fecha"]',
    title: "Pacientes y Fichas",
    description: "La <strong>fecha de consulta es obligatoria</strong> — es la que ordena el historial del paciente. A la derecha eliges al <strong>profesional</strong> de una lista: su RUT se completa solo, sin que tengas que escribirlo.",
    side: "bottom",
    optional: true,
  },
  {
    id: "nueva-ficha-guardar",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="nueva-ficha-guardar"]',
    title: "Pacientes y Fichas",
    description: "Al elegir la plantilla aparecen sus campos más abajo; los complétas y presionas <strong>\"Guardar Ficha Clínica\"</strong>. Cada atención que registres se va acumulando en el historial del paciente.",
    side: "top",
    optional: true,
  },

  // ── Rama B: el paciente ya tenía ficha ───────────────────────────────────
  {
    id: "fichas-detalle-acciones",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="ficha-acciones-rapidas"]',
    title: "Pacientes y Fichas",
    description: "Esta es la carpeta del paciente. Con <strong>\"Ficha\"</strong> registras una nueva atención en una ventana, sin salir de aquí ni perder lo que estás viendo. También agendas otra cita, o abres Odontograma, Receta y Documentos según tus permisos.",
    side: "bottom",
    noPrevious: true,
    optional: true,
  },
  {
    id: "fichas-registros",
    grupo: "Pacientes y Fichas",
    route: null,
    selector: '[data-tour="ficha-registros"]',
    title: "Pacientes y Fichas",
    description: "Todo el historial clínico del paciente queda ordenado cronológicamente aquí, agrupado por mes.",
    side: "top",
    optional: true,
  },

  // ── Bloqueos ─────────────────────────────────────────────────────────────
  {
    id: "bloqueos-profesional",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-profesional"]',
    title: "Bloqueos",
    description: "Selecciona el profesional cuya agenda vas a bloquear. Si ya tienes una agenda asignada, aparecerá seleccionada automáticamente.",
    side: "right",
    retrocederHasta: "calendario-nueva-reserva",
  },
  {
    id: "bloqueos-modo",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-modo-selector"]',
    title: "Bloqueos",
    description: "Primero crearás un bloqueo con <strong>Días específicos</strong>: puedes elegir una o varias fechas sueltas. Cuando guardes tu primer bloqueo, te mostraré cómo funciona <strong>Rango de fechas</strong> para repetirlo en determinados días de un período.",
    side: "right",
  },
  {
    id: "bloqueos-especificos-boton",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-especificos-boton"]',
    title: "Bloqueos: día específico",
    description: "Haz clic en <strong>Días específicos</strong> para elegir en el calendario al menos un día que quieras bloquear.",
    side: "right",
    interactive: true,
    esperar: { tipo: "aparece", selector: '[data-tour="bloqueo-calendario"]' },
    aviso: "Selecciona <strong>Días específicos</strong> para abrir el calendario.",
  },
  {
    id: "bloqueos-calendario",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-calendario"]',
    title: "Bloqueos",
    description: "Selecciona al menos un día futuro en el calendario. Puedes marcar varios días no consecutivos; cada uno se guardará como un bloqueo independiente.",
    side: "right",
  },
  {
    id: "bloqueos-horario",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-horario"]',
    title: "Bloqueos",
    description: "Define una hora de inicio y una de término posterior. Este horario se aplicará a todos los días seleccionados.",
    side: "right",
  },
  {
    id: "bloqueos-motivo",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-motivo"]',
    title: "Bloqueos",
    description: "Escribe el motivo del bloqueo, por ejemplo: Vacaciones, Congreso o capacitación.",
    side: "right",
  },
  {
    id: "bloqueos-guardar",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-guardar"]',
    title: "Bloqueos",
    description: "Presiona <strong>Ingresar Bloqueo(s)</strong> para crear tu primer bloqueo. El tutorial continuará solo cuando se haya guardado al menos un día; después te mostraré la opción <strong>Rango de fechas</strong>.",
    side: "top",
  },
  {
    id: "bloqueos-rango-profesional",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-profesional"]',
    title: "Bloqueos: elige un profesional",
    description: "Antes de crear el rango, selecciona nuevamente al profesional cuya agenda quieres bloquear. Si tienes una agenda asignada, el profesional aparecerá elegido automáticamente.",
    side: "right",
  },
  {
    id: "bloqueos-rango-boton",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-boton"]',
    title: "Bloqueos: rango de fechas",
    description: "Ya creaste un bloqueo individual. Ahora haz clic en <strong>Rango de fechas</strong> para conocer la otra forma de seleccionar días.",
    side: "right",
    interactive: true,
    esperar: { tipo: "aparece", selector: '[data-tour="bloqueo-rango-panel"]' },
    aviso: "Abre <strong>Rango de fechas</strong> para continuar.",
  },
  {
    id: "bloqueos-rango-fechas",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-fechas"]',
    title: "Bloqueos: rango de fechas",
    description: "Elige una fecha <strong>Desde</strong> y otra <strong>Hasta</strong>. El período puede abarcar como máximo los próximos tres meses.",
    side: "right",
  },
  {
    id: "bloqueos-rango-dias",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-dias"]',
    title: "Bloqueos: días de la semana",
    description: "Marca al menos un día de la semana. Por ejemplo, selecciona <strong>X</strong> para generar todos los miércoles incluidos en el período.",
    side: "right",
  },
  {
    id: "bloqueos-rango-generar",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-generar"]',
    title: "Bloqueos: generar días",
    description: "Pulsa <strong>Generar días</strong>. El tutorial continuará cuando el rango produzca al menos una fecha válida.",
    side: "right",
    interactive: true,
    esperar: {
      tipo: "atributo",
      selector: '[data-tour="bloqueo-rango-generar"]',
      atributo: "data-tour-completo",
      valor: "true",
    },
    aviso: "Todavía no se generaron fechas. Revisa el período, selecciona al menos un día de la semana y vuelve a pulsar <strong>Generar días</strong>.",
  },
  {
    id: "bloqueos-rango-horario",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-rango-horario"]',
    title: "Bloqueos: horario del rango",
    description: "Define una hora de inicio y una hora de término posterior. El horario se aplicará a todas las fechas generadas.",
    side: "right",
  },
  {
    id: "bloqueos-rango-motivo",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-motivo"]',
    title: "Bloqueos: motivo del rango",
    description: "Escribe el motivo que tendrán todos los bloqueos generados en este rango.",
    side: "right",
  },
  {
    id: "bloqueos-rango-guardar",
    grupo: "Bloqueos",
    route: "/dashboard/bloqueosAgenda",
    selector: '[data-tour="bloqueo-guardar"]',
    title: "Bloqueos: guardar el rango",
    description: "Presiona <strong>Ingresar Bloqueo(s)</strong>. Cada día se guardará por separado, para que puedas eliminarlo individualmente cuando lo necesites. Cuando los bloqueos se guarden correctamente, el tutorial te llevará automáticamente a Finanzas.",
    side: "right",
  },

  // ── Finanzas ─────────────────────────────────────────────────────────────
  {
    id: "finanzas-periodo",
    grupo: "Finanzas",
    route: "/dashboard/finanzas",
    selector: '[data-tour="finanzas-periodo"]',
    title: "Finanzas",
    description: "Aquí ves cuánto ha generado tu clínica. Elige el período que quieres revisar: <strong>Mes actual</strong>, <strong>Mes anterior</strong> o <strong>Rango personalizado</strong> para elegir tú las fechas.",
    side: "bottom",
    retrocederHasta: "bloqueos-rango-profesional",
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
    final: true,
    title: "Tutorial completado",
    description: "Ya viste lo esencial: crear un profesional, un servicio y asignarlos (lo más importante para empezar), agendar y guardar citas, crear fichas clínicas, bloquear horarios y revisar tus finanzas. Si te quedan dudas, visita la <a href=\"https://academia.agendaclinicas.cl\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ac-tour-link\">Academia de Agenda Clínica</a> para más contenido.",
  },
];
