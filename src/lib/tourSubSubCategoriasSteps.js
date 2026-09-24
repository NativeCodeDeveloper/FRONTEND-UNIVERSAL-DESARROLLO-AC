/**
 * tourSubSubCategoriasSteps.js
 * Configuración del tutorial guiado breve de Gestión de Sub-Subcategorías
 * (subsubcategoria/[id]/page.jsx): la creación y administración del último
 * nivel de la estructura del catálogo, de manera ILUSTRATIVA. El usuario no
 * escribe ni guarda nada — al cerrar el recorrido no se habrá creado ninguna
 * sub-subcategoría.
 *
 * Mismo criterio que los demás tours livianos: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 */

export const TOUR_SUBSUBCATEGORIAS_STEPS = [
  {
    id: "subsubcategorias-tour-intro",
    selector: null,
    title: "Tutorial Guiado Sub-Subcategorías",
    description: "Bienvenido a la gestión de sub-subcategorías, el <strong>último nivel</strong> de la estructura del catálogo (<strong>categoría → subcategoría → sub-subcategoría</strong>). Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo crearlas y administrarlas. <strong>No es necesario escribir ni guardar nada</strong>: al finalizar el recorrido no se habrá creado ninguna. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "subsubcategorias-tour-formulario",
    selector: '[data-tour="subsub-formulario"]',
    title: "Crear o editar una sub-subcategoría",
    description: "Acá se crean las sub-subcategorías de la subcategoría seleccionada —por ejemplo, tallas como <strong>\"XS Mujer\"</strong> o <strong>\"M Hombre\"</strong>—: se escribe el <strong>nombre</strong> y se presiona <strong>\"Ingresar Sub-Subcategoría\"</strong>. Al seleccionar una del listado, el formulario pasa a modo edición con <strong>\"Actualizar Sub-Subcategoría\"</strong>, y <strong>\"Limpiar\"</strong> vacía los campos. En este recorrido <strong>no escribiremos ni guardaremos nada</strong>.",
    side: "top",
  },
  {
    id: "subsubcategorias-tour-listado",
    selector: '[data-tour="subsub-listado"]',
    title: "Sub-subcategorías registradas",
    description: "Cada fila es una sub-subcategoría de esta subcategoría. Con <strong>\"Editar\"</strong> se carga en el formulario para modificarla y con <strong>\"Eliminar\"</strong> se retira.",
    side: "top",
  },
  {
    id: "subsubcategorias-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto completas la estructura del catálogo: <strong>categoría → subcategoría → sub-subcategoría</strong>. <span class=\"mt-2 block\"><em>¿Por qué tanta estructura?</em> Porque nos permite entregarte <strong>estadísticas</strong> que podrás usar para saber cuáles son los <strong>servicios más demandados</strong>.</span> Esta jerarquía organiza las prestaciones y servicios que se utilizan al armar presupuestos y cotizaciones. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
