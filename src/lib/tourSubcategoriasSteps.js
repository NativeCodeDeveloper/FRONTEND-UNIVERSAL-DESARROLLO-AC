/**
 * tourSubcategoriasSteps.js
 * Configuración del tutorial guiado breve de Gestión de Subcategorías
 * (subCategorias/[id]/page.jsx): la creación y administración de las
 * subcategorías de una categoría, de manera ILUSTRATIVA. El usuario no escribe
 * ni guarda nada — al cerrar el recorrido no se habrá creado ninguna
 * subcategoría.
 *
 * Incluye el señalamiento del botón "Sub-Subcategorias": además de la
 * subcategoría es necesario crear una sub-subcategoría para completar la
 * estructura del catálogo.
 *
 * Mismo criterio que los demás tours livianos: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 */

export const TOUR_SUBCATEGORIAS_STEPS = [
  {
    id: "subcategorias-tour-intro",
    selector: null,
    title: "Tutorial Guiado Subcategorías",
    description: "Bienvenido a la gestión de subcategorías. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo crear y administrar las subcategorías de la <strong>categoría principal</strong> seleccionada. <strong>No es necesario escribir ni guardar nada</strong>: al finalizar el recorrido no se habrá creado ninguna subcategoría. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "subcategorias-tour-formulario",
    selector: '[data-tour="subcategorias-formulario"]',
    title: "Crear o editar una subcategoría",
    description: "Acá se crean las subcategorías: se escribe el <strong>nombre</strong> y se presiona <strong>\"Ingresar Subcategoria\"</strong>. Al seleccionar una del listado, el formulario pasa a modo edición con <strong>\"Actualizar Subcategoria\"</strong>, y <strong>\"Limpiar\"</strong> vacía los campos. En este recorrido <strong>no escribiremos ni guardaremos nada</strong>.",
    side: "top",
  },
  {
    id: "subcategorias-tour-listado",
    selector: '[data-tour="subcategorias-listado"]',
    title: "Subcategorías de la categoría",
    description: "Cada fila es una subcategoría de esta categoría. Con <strong>\"Seleccionar para Edicion\"</strong> se carga en el formulario y con <strong>\"Eliminar Subcategoria\"</strong> se retira.",
    side: "top",
  },
  {
    id: "subcategorias-tour-subsub",
    selector: '[data-tour="subcategorias-boton-subsub"]',
    title: "Sub-subcategorías",
    description: "Para completar la estructura, además de la subcategoría es <strong>necesario crear una sub-subcategoría</strong>. El botón <strong>\"Sub-Subcategorias\"</strong> de cada fila lleva a su administración. En este recorrido no saldremos de esta pantalla; después, ingrese con ese botón para continuar.",
    side: "top",
  },
  {
    id: "subcategorias-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo crear y administrar las subcategorías. Recuerde completar también sus <strong>sub-subcategorías</strong> para terminar de estructurar el catálogo que se utiliza al armar presupuestos y cotizaciones. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
