/**
 * tourTarifaSteps.js
 * Configuración del tutorial guiado breve de Tarifas de Servicio
 * (tarifaServicio/page.jsx): el registro y administración de tarifas, de
 * manera ILUSTRATIVA. El usuario no completa campos ni guarda nada — al
 * cerrar el recorrido no se habrá registrado ninguna tarifa.
 *
 * Mismo criterio que los demás tours livianos: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro, advertencia y
 *                   cierre.
 *
 * Las anclas del formulario (tarifa-select-profesional, tarifa-select-servicio,
 * tarifa-precio-duracion, tarifa-guardar) ya existen en la página — las
 * comparte con el tour principal. El ancla del listado de tarifas se agregó
 * para este tutorial (tarifa-listado).
 */

export const TOUR_TARIFA_STEPS = [
  {
    id: "tarifa-tour-intro",
    selector: null,
    title: "Tutorial Guiado Tarifas",
    description: "Bienvenido a la sección de tarifas. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo registrar y administrar las <strong>tarifas de servicios agendables</strong>. <strong>No es necesario completar campos ni guardar nada</strong>: al finalizar el recorrido no se habrá registrado ninguna tarifa. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "tarifa-tour-importante",
    selector: null,
    title: "Importante — Qué es esta información",
    description: "Es frecuente creer que esta información sirve para cotizar, y no es así. <span class=\"mt-2 block text-xs font-bold text-emerald-600\">1. LAS TARIFAS INGRESADAS ACÁ NO SE UTILIZAN PARA COTIZAR NI PARA ARMAR PRESUPUESTOS.</span> <span class=\"mt-2 block text-xs font-bold text-emerald-600\">2. ESTA INFORMACIÓN SON LAS TARIFAS DE SERVICIOS AGENDABLES: ES LO QUE VERÁN LOS PACIENTES EN LA WEB DE AGENDAMIENTO Y AL MOMENTO DE AGENDAR EN EL CALENDARIO.</span> <span class=\"mt-2 block\">Para cotizaciones y presupuestos, utilice el <strong>Presupuesto Rápido</strong> o el presupuesto asociado al paciente en su <strong>carpeta clínica</strong>.</span>",
  },
  {
    id: "tarifa-tour-profesional",
    selector: '[data-tour="tarifa-select-profesional"]',
    title: "Seleccionar profesional",
    description: "Primero se selecciona el <strong>profesional</strong> que imparte el servicio: las tarifas se definen <strong>por profesional</strong>, de modo que un mismo servicio puede tener valores distintos según quién lo realice.",
    side: "top",
  },
  {
    id: "tarifa-tour-servicio",
    selector: '[data-tour="tarifa-select-servicio"]',
    title: "Seleccionar servicio",
    description: "Luego se elige el <strong>servicio</strong> al que se asignará la tarifa, a partir de los servicios creados para ese profesional. Las prestaciones se administran en <strong>\"Tratamientos Disponibles\"</strong>, desde el menú lateral.",
    side: "top",
  },
  {
    id: "tarifa-tour-precio",
    selector: '[data-tour="tarifa-precio-duracion"]',
    title: "Precio y duración",
    description: "El <strong>precio de la consulta</strong> es el valor que el paciente verá al agendar, y la <strong>duración en minutos</strong> define el tiempo que la cita ocupará en la agenda. Ambos forman parte de la información pública del servicio.",
    side: "top",
  },
  {
    id: "tarifa-tour-guardar",
    selector: '[data-tour="tarifa-guardar"]',
    title: "Guardar, actualizar o eliminar",
    description: "Desde aquí se administra la tarifa: <strong>\"Guardar Tarifa\"</strong> registra una nueva, <strong>\"Actualizar Tarifa\"</strong> modifica la que se haya seleccionado desde el listado y <strong>\"Eliminar Tarifa\"</strong> la quita. En este recorrido <strong>no presionaremos ninguno</strong>.",
    side: "top",
  },
  {
    id: "tarifa-tour-listado",
    selector: '[data-tour="tarifa-listado"]',
    title: "Tarifas registradas",
    description: "Las tarifas se listan con su <strong>profesional, servicio, duración y valor</strong>. El botón <strong>\"Seleccionar\"</strong> carga una tarifa en el formulario para editarla o eliminarla. Esta es la información que verán los pacientes al agendar.",
    side: "top",
  },
  {
    id: "tarifa-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo administrar las tarifas de servicios agendables. Recuerde: <strong>no son datos para cotizar</strong> — son el precio y la duración que verán los pacientes en la web de agendamiento y al agendar en el calendario. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
