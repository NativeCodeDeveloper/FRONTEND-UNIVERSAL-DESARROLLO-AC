/**
 * tourCategoriasSteps.js
 * Configuración del tutorial guiado breve de Gestión de Categorías
 * (categoriasProductos/page.jsx): la creación y administración de las
 * categorías que estructuran el catálogo, de manera ILUSTRATIVA. El usuario no
 * escribe ni guarda nada — al cerrar el recorrido no se habrá creado ninguna
 * categoría.
 *
 * Mismo criterio que los demás tours livianos: recorrido de solo lectura, sin
 * pasos interactivos ni condiciones `esperar`.
 *
 * selector: null -> paso sin ancla (mensaje centrado): intro y cierre.
 *
 * Las anclas apuntan a la FRANJA DEL TÍTULO de cada tarjeta (no a la tarjeta
 * completa): mismo criterio que en ingresoProductos, para que el popover no
 * tape el contenido que se está explicando. La excepción es el botón
 * "Subcategoria", que sí se resalta completo: es pequeño y el paso debe
 * señalarlo de forma inequívoca. Ese ancla existe en TODAS las filas; el
 * tour toma el de la primera (document.querySelector).
 */

export const TOUR_CATEGORIAS_STEPS = [
  {
    id: "categorias-tour-intro",
    selector: null,
    title: "Tutorial Guiado Categorías",
    description: "Bienvenido a la gestión de categorías. Este tutorial muestra, de manera <strong>ilustrativa</strong>, cómo crear y administrar las <strong>categorías que organizan sus prestaciones, productos y servicios</strong>. <strong>No es necesario escribir ni guardar nada</strong>: al finalizar el recorrido no se habrá creado ninguna categoría. Presione \"Siguiente\" para comenzar.",
  },
  {
    id: "categorias-tour-formulario",
    selector: '[data-tour="categorias-formulario"]',
    title: "Crear o editar una categoría",
    description: "Acá se crean las categorías: se escribe el <strong>nombre</strong> —por ejemplo, \"Tratamientos faciales\" o \"Insumos\"— y se presiona <strong>\"Ingresar Categoria\"</strong>. Al editar una existente, el formulario pasa a modo edición con los botones <strong>\"Actualizar\"</strong> y <strong>\"Cancelar\"</strong>. En este recorrido <strong>no escribiremos ni guardaremos nada</strong>.",
    side: "top",
  },
  {
    id: "categorias-tour-listado",
    selector: '[data-tour="categorias-listado"]',
    title: "Lista de categorías",
    description: "Cada fila es una categoría registrada. Con <strong>\"Editar\"</strong> sus datos se cargan en el formulario superior y con <strong>\"Eliminar\"</strong> se retira.",
    side: "top",
  },
  {
    id: "categorias-tour-subcategoria",
    selector: '[data-tour="categorias-boton-subcategoria"]',
    title: "Subcategoría y sub-subcategoría",
    description: "Además de ingresar la categoría, es <strong>necesario crear una subcategoría y una sub-subcategoría</strong> para completar la estructura del catálogo. El botón <strong>\"Subcategoria\"</strong> de cada categoría lleva a la administración de sus subcategorías y, desde ahí, se continúa hacia sus <strong>sub-subcategorías</strong>. En este recorrido no saldremos de esta pantalla; después, ingrese con ese botón para continuar.",
    side: "top",
  },
  {
    id: "categorias-tour-final",
    selector: null,
    title: "Tutorial completado",
    description: "Con esto usted sabe cómo crear y administrar las categorías. Estas estructuran el catálogo de <strong>prestaciones y servicios</strong> —categoría principal, subcategoría y sub-subcategoría— que luego se utilizan al armar presupuestos y cotizaciones. Puede repetir este tutorial cuando lo estime conveniente.",
  },
];
