/**
 * tourProfesionalesSteps.js
 * Configuración del tutorial guiado breve de Profesionales
 * (profesionales/page.jsx): el registro y administración de agendas, de manera
 * ILUSTRATIVA. El usuario no completa campos ni guarda nada — al cerrar el
 * recorrido no se habrá creado ninguna agenda y el formulario abierto por el
 * tour se descarta.
 *
 * Incluye una aclaración crítica: esta sección crea AGENDAS, no usuarios
 * (para eso está "Crear Usuarios" en el menú lateral), y cada registro puede
 * ser un profesional, un box, un horario o lo que mejor se acomode a la
 * gestión del usuario.
 *
 * selector: null    -> paso sin ancla (mensaje centrado): intro, advertencia
 *                      y cierre.
 * abrirModal: true  -> el paso apunta al botón "Nuevo Profesional": el
 *                      formulario NO se abre todavía; recién cuando el usuario
 *                      presiona "Siguiente" el tour lo abre por su cuenta (ver
 *                      TutorialGuiadoProfesionales).
 * cerrarModal: true -> último paso dentro del formulario: al avanzar, el tour
 *                      cierra el modal que él mismo abrió, para que los pasos
 *                      siguientes (buscador y listado) se vean sin el modal
 *                      encima.
 *
 * Las anclas del formulario (profesional-nombre, -correo, -telefono, -rut,
 * -descripcion, -guardar) existen en ProfesionalModal.jsx — las comparte con
 * el tour principal — y no están en el DOM hasta que el modal se abre; por eso
 * el driver de este tour configura waitForElement. La ancla del listado
 * (profesional-lista) solo existe si hay al menos un profesional registrado.
 */

export const TOUR_PROFESIONALES_STEPS = [
  {
    id: "profesionales-tour-intro",
    selector: null,
    title: "Tutorial Guiado Profesionales",
    description: "Bienvenido a la sección de profesionales. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo registrar y administrar las agendas. <strong>No es necesario completar campos ni guardar nada</strong>: al finalizar el recorrido no se habrá creado nada. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "profesionales-tour-importante",
    selector: null,
    title: "Importante — Qué se crea acá",
    description: "Esta sección crea <strong>agendas</strong>, no usuarios del sistema. <span class=\"mt-2 block text-xs font-bold text-emerald-600\">1. LO QUE SE CREA ACÁ SON LAS AGENDAS DE PROFESIONALES: CADA AGENDA ES LA UNIDAD QUE RECIBE LAS HORAS EN EL CALENDARIO.</span> <span class=\"mt-2 block text-xs font-bold text-emerald-600\">2. PARA SOLICITAR USUARIOS, SOLICÍTELOS A SU EJECUTIVO COMERCIAL.</span> <span class=\"mt-2 block\">Aunque lo habitual es trabajar con profesionales, puede registrar otro tipo de información —por ejemplo, <strong>box</strong> u <strong>horarios</strong>— o lo que mejor se acomode a su gestión: cada registro funciona como una agenda independiente.</span>",
  },
  {
    id: "profesionales-tour-nuevo",
    selector: '[data-tour="profesional-nuevo"]',
    title: "Registrar una agenda",
    description: "Este botón abre el formulario de registro. Presione <strong>\"Siguiente\"</strong> y el tutorial lo abrirá de forma automática para mostrarle los campos. <strong>No es necesario que complete nada</strong>: el recorrido es solo ilustrativo.",
    side: "bottom",
    abrirModal: true,
  },
  {
    id: "profesionales-tour-nombre",
    selector: '[data-tour="profesional-nombre"]',
    title: "Nombre de la agenda",
    description: "El <strong>nombre</strong> identifica la agenda y es el nombre visible al agendar — por ejemplo, \"Dr. Greg House\" o, si administra box, \"Box 1\".",
    side: "bottom",
  },
  {
    id: "profesionales-tour-correo",
    selector: '[data-tour="profesional-correo"]',
    title: "Correo",
    description: "El <strong>correo</strong> recibe las notificaciones de nuevos agendamientos y los avisos de cambios en la agenda.",
    side: "bottom",
  },
  {
    id: "profesionales-tour-telefono",
    selector: '[data-tour="profesional-telefono"]',
    title: "Teléfono",
    description: "El <strong>teléfono</strong> es el dato de contacto del profesional dentro del sistema.",
    side: "bottom",
  },
  {
    id: "profesionales-tour-rut",
    selector: '[data-tour="profesional-rut"]',
    title: "RUT",
    description: "El <strong>RUT</strong> identifica al profesional y se utiliza en los documentos que firma, como fichas y presupuestos.",
    side: "bottom",
  },
  {
    id: "profesionales-tour-descripcion",
    selector: '[data-tour="profesional-descripcion"]',
    title: "Descripción o especialidad",
    description: "La <strong>descripción</strong> complementa la información de la agenda —la especialidad, por ejemplo— y también aparece en los documentos.",
    side: "bottom",
  },
  {
    id: "profesionales-tour-guardar",
    selector: '[data-tour="profesional-guardar"]',
    title: "Guardar la agenda",
    description: "El botón <strong>\"Guardar\"</strong> crea la agenda. En este recorrido <strong>no lo presionaremos</strong>: al avanzar al siguiente paso, el formulario se cierra sin registrar nada.",
    side: "top",
    cerrarModal: true,
  },
  {
    id: "profesionales-tour-buscador",
    selector: '[data-tour="profesional-buscador"]',
    title: "Buscador",
    description: "El <strong>buscador</strong> permite encontrar las agendas por nombre, especialidad, correo o RUT.",
    side: "bottom",
  },
  {
    id: "profesionales-tour-lista",
    selector: '[data-tour="profesional-lista"]',
    title: "Agendas registradas",
    description: "Cada tarjeta es una agenda registrada, con sus datos de contacto y las acciones para <strong>editarla</strong> o <strong>eliminarla</strong>.",
    side: "top",
  },
  {
    id: "profesionales-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo registrar y administrar las agendas. Recuerde: acá se crean <strong>agendas, no usuarios</strong> — para solicitar usuarios, contacte a su ejecutivo comercial — y cada registro puede ser un profesional, un box, un horario o lo que mejor se acomode a su gestión. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
