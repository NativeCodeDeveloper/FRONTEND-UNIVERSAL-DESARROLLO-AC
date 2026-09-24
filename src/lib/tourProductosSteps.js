/**
 * tourProductosSteps.js
 * Configuración del tutorial guiado breve de Gestión de Prestaciones y
 * Servicios (ingresoProductos/page.jsx): el registro y administración del
 * catálogo que alimenta los presupuestos, de manera ILUSTRATIVA. El usuario no
 * completa campos ni guarda nada — al cerrar el recorrido no se habrá creado
 * ningún registro.
 *
 * Mismo criterio que los demás tours livianos: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 *
 * Los anclas del formulario y del listado apuntan a la FRANJA DEL TÍTULO de
 * cada tarjeta (no a la tarjeta completa): al ser tarjetas altas, driver.js
 * terminaría centrando el popover encima y tapando el contenido que se está
 * explicando. Con la franja como ancla, el popover queda arriba y el
 * contenido queda a la vista (mismo criterio que en el detalle de cotización).
 */

export const TOUR_PRODUCTOS_STEPS = [
  {
    id: "productos-tour-intro",
    selector: null,
    title: "Tutorial Guiado Prestaciones",
    description: "Bienvenido a la gestión de prestaciones y servicios. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo registrar y administrar los productos y servicios que estarán disponibles para los <strong>presupuestos de tratamiento</strong>. <strong>No es necesario completar campos ni guardar nada</strong>: al finalizar el recorrido no se habrá creado ningún registro. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "productos-tour-formulario",
    selector: '[data-tour="productos-formulario"]',
    title: "Formulario de registro",
    description: "Estos campos se completan para crear el registro: la <strong>categoría principal</strong> es obligatoria, las <strong>subcategorías</strong> son opcionales, y van el <strong>nombre</strong>, la <strong>descripción</strong> y el <strong>valor</strong> —que se ingresa <strong>sin puntos</strong>, por ejemplo 25000—. Con <strong>\"Ingresar\"</strong> se guarda el registro. <span class=\"mt-2 block text-xs font-bold text-emerald-600\">1. ESTA INFORMACIÓN NO SE UTILIZA EN SERVICIOS AGENDABLES NI EN LA PÁGINA WEB DE AGENDAMIENTO.</span> <span class=\"mt-2 block text-xs font-bold text-emerald-600\">2. ES LA INFORMACIÓN QUE SE UTILIZA PARA ARMAR PRESUPUESTOS: YA SEA EL PRESUPUESTO RÁPIDO O EL PRESUPUESTO POR PACIENTE EN LA SECCIÓN DE FICHAS.</span>",
    side: "top",
  },
  {
    id: "productos-tour-filtros",
    selector: '[data-tour="productos-filtros"]',
    title: "Filtros de búsqueda",
    description: "Estos filtros ayudan a ubicar registros en el listado: <strong>filtrar por categoría</strong> o <strong>buscar por nombre</strong> — por ejemplo, \"limpieza\" o \"masaje\".",
    side: "top",
  },
  {
    id: "productos-tour-listado",
    selector: '[data-tour="productos-listado"]',
    title: "Prestaciones y servicios registrados",
    description: "El listado reúne todos los registros con su <strong>categoría, descripción y valor</strong>. Con <strong>\"Editar\"</strong> se cargan los datos en el formulario para modificarlos, con <strong>\"Eliminar\"</strong> se retira el registro y <strong>\"Recargar todo\"</strong> actualiza el listado. Estos registros son los que luego aparecen en los <strong>presupuestos y cotizaciones</strong>.",
    side: "top",
  },
  {
    id: "productos-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo crear y administrar las prestaciones y servicios. Recuerde que estos registros son los que aparecerán disponibles al armar <strong>presupuestos, cotizaciones y sus detalles</strong>. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
