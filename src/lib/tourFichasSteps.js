/**
 * tourFichasSteps.js
 * Configuración del tutorial guiado breve de la Carpeta Clínica del paciente
 * (FichasPacientes/[id_paciente]).
 *
 * A diferencia del tour principal (tourSteps.js, que navega por todo el
 * dashboard y exige acciones reales con condiciones `esperar`), este recorre
 * solo las 4 zonas de la carpeta y es de solo lectura: no navega a otras rutas
 * ni hace clic por el usuario. Todos los pasos viven en la misma página.
 *
 * selector: null    -> paso sin ancla (mensaje centrado): intro y cierre.
 * abrirDetalles: true -> el paso apunta a un <details> colapsado ("Filtros",
 *                       "Historial de Citas"): el tour lo abre solo ANTES de
 *                       medir el elemento, para que el usuario vea el contenido
 *                       mientras dura la explicación (ver TutorialGuiadoFichas).
 */

export const TOUR_FICHAS_STEPS = [
  {
    id: "fichas-intro",
    selector: null,
    title: "Tutorial Guiado Fichas",
    description: "Un recorrido breve por la carpeta clínica del paciente: cómo <strong>llenar una ficha</strong>, dónde <strong>editar su información</strong>, cómo usar los <strong>filtros</strong> y dónde ver el <strong>historial de citas</strong>. Presiona \"Siguiente\" para empezar.",
  },
  {
    id: "fichas-llenar",
    selector: '[data-tour="ficha-boton-nueva"]',
    title: "Cómo llenar una ficha",
    description: "Cada atención se registra con el botón <strong>\"Ficha\"</strong>. Al presionarlo se abre el formulario de ficha clínica: eliges la plantilla, la fecha de consulta y el profesional, completas los campos y guardas. Todo queda acumulándose en los <strong>registros clínicos</strong> de más abajo, ordenados por mes.",
    side: "bottom",
  },
  {
    id: "fichas-info-ingreso",
    selector: '[data-tour="ficha-info-ingreso"]',
    title: "Información de ingreso",
    description: "Esta sección reúne los antecedentes con los que ingresó el paciente: <strong>medicamentos, hábitos y comentarios</strong>. Sus datos personales (nacimiento, previsión, contacto) están en la tarjeta de la izquierda.",
    side: "bottom",
  },
  {
    id: "fichas-editar",
    selector: '[data-tour="ficha-editar-ingreso"]',
    title: "Dónde editar la información del paciente",
    description: "Con este ícono de <strong>lápiz</strong> editas todo lo anterior: nombre, teléfono, previsión, dirección, antecedentes, medicamentos y más. El botón <strong>\"Editar Información de Ingreso\"</strong> al final de la tarjeta del paciente abre el mismo formulario.",
    side: "bottom",
  },
  {
    id: "fichas-filtros",
    selector: '[data-tour="ficha-filtros"]',
    title: "Cómo usar los filtros",
    description: "Escribe el nombre del profesional y presiona <strong>\"Buscar\"</strong> para dejar solo sus fichas; <strong>\"Limpiar\"</strong> restaura el listado completo. Los campos <strong>RUT del profesional</strong> y <strong>Especialidad</strong> no filtran: son los datos que se imprimen junto a la firma en el PDF de la ficha.",
    side: "top",
    abrirDetalles: true,
  },
  {
    id: "fichas-historial",
    selector: '[data-tour="ficha-historial"]',
    title: "Historial de citas",
    description: "Aquí ves todas las citas del paciente: <strong>fecha, hora, profesional, motivo, monto y estado</strong> de cada una, con el total al inicio. Es el historial de visitas — distinto de los registros clínicos, que son las fichas propiamente tales.",
    side: "top",
    abrirDetalles: true,
  },
  {
    id: "fichas-final",
    selector: null,
    title: "Tutorial completado",
    description: "Ya sabes cómo llenar fichas, editar la información del paciente, filtrar sus registros y revisar sus citas. Si prefieres verlo en video, usa el botón <strong>\"Video Tutorial\"</strong> de la parte superior.",
  },
];
