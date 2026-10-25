/*
 * Perfiles de acceso del dashboard: una sola fuente para el middleware, la barra
 * lateral, el menú móvil, las pantallas y la API de usuarios.
 *
 * Diseño (docs/perfiles/propuesta-perfiles-acceso.md):
 *   - El perfil se define por el CARGO y, en los profesionales, por la
 *     ESPECIALIDAD. Cada perfil ve solo lo que su trabajo necesita.
 *   - Los administradores administran la clínica (no el sistema) y hay uno por
 *     categoría de centro. No ven el contenido de las fichas clínicas
 *     (Ley 20.584 art. 13).
 *   - Un profesional puede además administrar su clínica con
 *     publicMetadata.administraClinica = true: recibe los módulos del
 *     administrador de su misma categoría. Internamente se representa como un
 *     rol compuesto "profesional-odontologo+admin", así todas las funciones de
 *     permisos lo entienden sin cambiar su firma.
 *   - El técnico NativeCode tiene acceso total para dar soporte, con
 *     autorización de la clínica y quedando registrado (registro_accesos).
 *   - Sin rol, o con un rol desconocido, NO hay acceso. (Antes, sin rol se
 *     entraba como administrador total.)
 *   - Los valores antiguos guardados en Clerk se traducen solos (ALIAS_ROLES):
 *     ningún usuario existente pierde el acceso por el cambio.
 */

// ── Perfiles ────────────────────────────────────────────────────────────────

const ROL_TECNICO = "tecnico-nativecode";
const ROL_SIN_ACCESO = "sin-acceso";
const ROL_SUSPENDIDO = "suspendido";
const ROL_RECEPCION = "recepcion";
const SUFIJO_ADMIN = "+admin";

const PERFILES_ADMINISTRADOR = [
  "admin-centro-salud",
  "admin-clinica-medica",
  "admin-clinica-odontologica",
  "admin-centro-oftalmologico",
  "admin-centro-estetico",
  "admin-clinica",
];

const PERFILES_PROFESIONALES = [
  "profesional-salud",
  "profesional-medico",
  "profesional-odontologo",
  "profesional-matrona",
  "profesional-oftalmologia",
  "profesional-estetica",
];

const DASHBOARD_ROLES = [
  ROL_TECNICO,
  ...PERFILES_ADMINISTRADOR,
  ...PERFILES_PROFESIONALES,
  ROL_RECEPCION,
  ROL_SUSPENDIDO,
];

const DASHBOARD_ROLE_SET = new Set(DASHBOARD_ROLES);
const PERFILES_PROFESIONALES_SET = new Set(PERFILES_PROFESIONALES);
const PERFILES_ADMINISTRADOR_SET = new Set(PERFILES_ADMINISTRADOR);

/** Qué administrador corresponde a cada especialidad (interruptor "También administra"). */
const ADMIN_DE_PROFESIONAL = {
  "profesional-salud": "admin-centro-salud",
  "profesional-medico": "admin-clinica-medica",
  "profesional-matrona": "admin-clinica-medica",
  "profesional-odontologo": "admin-clinica-odontologica",
  "profesional-oftalmologia": "admin-centro-oftalmologico",
  "profesional-estetica": "admin-centro-estetico",
};

/** Valores antiguos de Clerk → perfil nuevo. "admin"/"default" solo si están escritos explícitamente. */
const ALIAS_ROLES = {
  admin: ROL_TECNICO,
  default: ROL_TECNICO,
  "super-usuario-nativecode": ROL_TECNICO,
  "administrador-clinico": "admin-clinica",
  configuracion: "admin-clinica",
  "operador-clinico": "profesional-salud",
  basico: "profesional-salud",
  agenda: "profesional-salud",
  "operador-medico": "profesional-medico",
  "clinico-medico": "profesional-medico",
  "operador-odontologico": "profesional-odontologo",
  odontologico: "profesional-odontologo",
  oftalmologia: "profesional-oftalmologia",
  "centro-estetico": "profesional-estetica",
  secretaria: ROL_RECEPCION,
  recepcionista: ROL_RECEPCION,
  cancelado: ROL_SUSPENDIDO,
};

// ── Rutas por módulo ────────────────────────────────────────────────────────

const R = {
  base: [/^\/dashboard\/no-access$/],
  panel: [/^\/dashboard$/],
  agenda: [/^\/dashboard\/calendario$/, /^\/dashboard\/bloqueosAgenda$/, /^\/dashboard\/AgendaDetalle\/[^/]+$/],
  pacientes: [/^\/dashboard\/listaPacientes$/, /^\/dashboard\/GestionPaciente$/, /^\/dashboard\/paciente\/[^/]+$/],
  fichas: [
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/archivosPacientes\/[^/]+$/,
  ],
  firma: [/^\/dashboard\/documentosPorFirmar$/],
  // Procedimientos del consentimiento informado: los profesionales consultan, los administradores crean y editan.
  procedimientos: [/^\/dashboard\/procedimientosConsentimiento$/],
  recetas: [/^\/dashboard\/recetaPacientes\/[^/]+$/, /^\/dashboard\/recetaRapida$/],
  recetaLentes: [/^\/dashboard\/recetaLentes$/],
  examenes: [/^\/dashboard\/examenDocumento$/],
  odontograma: [/^\/dashboard\/odontogramasPaciente\/[^/]+$/],
  // Periodontograma: aún no se habilita a ningún perfil (solo el técnico lo ve).
  cotizaciones: [/^\/dashboard\/cotizacionesPaciente\/[^/]+$/, /^\/dashboard\/detalleCotizacion\/[^/]+$/],
  presupuestos: [/^\/dashboard\/presupuestoTratamiento$/],
  consultarTratamientos: [/^\/dashboard\/ingresoProductos$/, /^\/dashboard\/categoriasProductos$/],
  catalogoTratamientos: [
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/categoriasProductos$/,
    /^\/dashboard\/subCategorias\/[^/]+$/,
    /^\/dashboard\/subsubcategoria\/[^/]+$/,
    /^\/dashboard\/EspecificacionProductos\/[^/]+$/,
  ],
  stock: [/^\/dashboard\/gestionStock$/, /^\/dashboard\/pedidosCompras$/, /^\/dashboard\/pedidosDetalle$/, /^\/dashboard\/cupones$/],
  finanzas: [/^\/dashboard\/finanzas$/],
  profesionales: [/^\/dashboard\/profesionales$/],
  configuracion: [/^\/dashboard\/profesionales$/, /^\/dashboard\/serviciosAgendamiento$/, /^\/dashboard\/tarifaServicio$/],
  catalogoExamenes: [/^\/dashboard\/examenesClinicos$/],
  plantillas: [
    /^\/dashboard\/fichasClinicasPlantillas$/,
    /^\/dashboard\/fichasClinicasCategorias\/[^/]+$/,
    /^\/dashboard\/fichaCampo\/[^/]+$/,
    /^\/dashboard\/edicionPlantillaEspecifica\/[^/]+$/,
  ],
  web: [
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/testimonios$/,
    /^\/dashboard\/edicionPagina$/,
  ],
  suspendido: [/^\/dashboard\/suscripcion-cancelada$/],
};

const rutas = (...grupos) => grupos.flatMap((g) => R[g]);

// Base común de todo profesional: su agenda, sus pacientes y fichas, su firma y su tarjeta.
const BASE_PROFESIONAL = ["base", "panel", "agenda", "pacientes", "fichas", "firma", "profesionales", "procedimientos"];
// Base común de todo administrador: lo administrativo, sin el contenido clínico.
const BASE_ADMINISTRADOR = ["base", "panel", "agenda", "pacientes", "cotizaciones", "finanzas", "configuracion", "plantillas", "web", "procedimientos"];

const routeMatchersByRole = {
  "profesional-salud": rutas(...BASE_PROFESIONAL),
  "profesional-medico": rutas(...BASE_PROFESIONAL, "recetas", "examenes"),
  "profesional-odontologo": rutas(...BASE_PROFESIONAL, "recetas", "examenes", "odontograma", "cotizaciones", "presupuestos", "consultarTratamientos"),
  "profesional-matrona": rutas(...BASE_PROFESIONAL, "recetas", "examenes"),
  "profesional-oftalmologia": rutas(...BASE_PROFESIONAL, "recetaLentes", "examenes"),
  "profesional-estetica": rutas(...BASE_PROFESIONAL, "cotizaciones", "presupuestos", "consultarTratamientos"),

  "admin-centro-salud": rutas(...BASE_ADMINISTRADOR),
  "admin-clinica-medica": rutas(...BASE_ADMINISTRADOR, "catalogoExamenes"),
  "admin-clinica-odontologica": rutas(...BASE_ADMINISTRADOR, "presupuestos", "catalogoTratamientos"),
  "admin-centro-oftalmologico": rutas(...BASE_ADMINISTRADOR, "catalogoExamenes"),
  "admin-centro-estetico": rutas(...BASE_ADMINISTRADOR, "presupuestos", "catalogoTratamientos", "stock"),
  "admin-clinica": rutas(...BASE_ADMINISTRADOR, "catalogoExamenes", "presupuestos", "catalogoTratamientos", "stock"),

  [ROL_RECEPCION]: rutas("base", "panel", "agenda", "pacientes", "cotizaciones"),
  [ROL_SUSPENDIDO]: rutas("suspendido"),
};

// Bloqueos globales (ningún perfil, salvo los casos manejados aparte).
const globallyDeniedDashboardMatchers = [
  /^\/dashboard\/agendaCitas$/,
];
const paymentGatewayPathMatcher = /^\/dashboard\/pasarelaPago$/;
const PAYMENT_GATEWAY_ROLES = new Set([ROL_TECNICO]);

// Montos de reservas y presupuestos: administración, recepción, técnico y los
// profesionales que cotizan (odontología y estética).
const PERFILES_CON_MONTOS = new Set([
  ROL_TECNICO,
  ...PERFILES_ADMINISTRADOR,
  ROL_RECEPCION,
  "profesional-odontologo",
  "profesional-estetica",
]);

const DASHBOARD_NAV_SECTIONS = [
  {
    id: "capacitaciones",
    title: "CAPACITACIONES",
    accordionLabel: "Capacitaciones",
    icon: "academy",
    items: [
      { label: "Videos", href: "https://academia.agendaclinicas.cl", icon: "academy", visibleForAllRoles: true },
    { label: "Tutorial Guiado", action: "startTour", icon: "compass", visibleForAllRoles: true, hiddenForRoles: ["recepcion", ...PERFILES_PROFESIONALES] },
    ],
  },
  {
    id: "principal",
    title: "Principal",
    accordionLabel: "Principal",
    icon: "home",
    items: [
      { label: "Panel de Reservas", href: "/dashboard", icon: "home" },
      { label: "Crear Usuarios", href: "/dashboard/createUser", icon: "shield" },
    ],
  },
  {
    id: "agenda",
    title: "Agenda",
    accordionLabel: "Agenda",
    icon: "calendar",
    items: [
      // { label: "Calendario General", href: "/dashboard/calendarioGeneral", icon: "panels" },
      { label: "Calendario y Reserva", href: "/dashboard/calendario", icon: "calendarDays" },
      { label: "Bloqueos", href: "/dashboard/bloqueosAgenda", icon: "lock" },
    ],
  },
  {
    id: "pacientes",
    title: "Pacientes y Fichas",
    accordionLabel: "Pacientes y Fichas",
    icon: "users",
    items: [
      { label: "Listado de Pacientes", href: "/dashboard/listaPacientes", icon: "users" },
      { label: "Ficha Clínica", href: "/dashboard/FichaClinica", icon: "fileText" },
      { label: "Periodontograma", href: "/dashboard/periodontogramaPaciente", icon: "fileText" },
    ],
  },
  {
    id: "finanzas",
    title: "Finanzas",
    accordionLabel: "Finanzas",
    icon: "finance",
    items: [
      { label: "Resumen financiero", href: "/dashboard/finanzas", icon: "finance" },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    accordionLabel: "Documentos Clínicos",
    icon: "document",
    items: [
      { label: "Receta Médica", href: "/dashboard/recetaRapida", icon: "fileText" },
      { label: "Receta de Lentes", href: "/dashboard/recetaLentes", icon: "fileText" },
      { label: "Solicitar Exámenes", href: "/dashboard/examenDocumento", icon: "fileText" },
      // Bandeja de firma electrónica: visible cuando la firma está habilitada en esta instancia.
      ...(process.env.NEXT_PUBLIC_FIRMA_HABILITADA === "1" || process.env.NEXT_PUBLIC_FIRMA_MOCK === "1" || process.env.NODE_ENV !== "production"
        ? [{ label: "Documentos por firmar", href: "/dashboard/documentosPorFirmar", icon: "fileText" }]
        : []),
    ],
  },
  {
    id: "presupuestos",
    title: "Presupuestos",
    accordionLabel: "Presupuestos",
    icon: "budget",
    items: [
      // Ordenados como se usan: primero se define la categoría, luego los
      // tratamientos que la componen y al final se genera el presupuesto.
      { label: "Categorías", href: "/dashboard/categoriasProductos", icon: "budget" },
      { label: "Tratamientos Disponibles", href: "/dashboard/ingresoProductos", icon: "budget" },
      { label: "Generar Presupuesto", href: "/dashboard/presupuestoTratamiento", icon: "budget" },
    ],
  },
  {
    id: "configuracion",
    title: "Configuración Clínica",
    accordionLabel: "Configuración Clínica",
    icon: "settings",
    items: [
      // Datos de la clínica: se usan en la página pública, los documentos, los correos,
      // la política de privacidad y los consentimientos (no solo en la web).
      { label: "Datos de la clínica", href: "/dashboard/datosEmpresa", icon: "settings" },
      { label: "Profesionales y Agendas", href: "/dashboard/profesionales", icon: "settings" },
      { label: "Servicios Agendables", href: "/dashboard/serviciosAgendamiento", icon: "settings" },
      { label: "Tarifas de Consulta", href: "/dashboard/tarifaServicio", icon: "settings" },
      { label: "Exámenes Clínicos", href: "/dashboard/examenesClinicos", icon: "folder" },
    ],
  },
  {
    id: "plantillas",
    title: "Plantillas",
    accordionLabel: "Plantillas y Exámenes",
    icon: "folder",
    items: [
      { label: "Modelos de Fichas", href: "/dashboard/fichasClinicasPlantillas", icon: "folder" },
      { label: "Consentimientos informados", href: "/dashboard/procedimientosConsentimiento", icon: "fileText" },
    ],
  },
  {
    id: "contenido",
    title: "Contenido web",
    accordionLabel: "Contenido web",
    icon: "image",
    items: [
      { label: "Pasarela de Pago", href: "/dashboard/pasarelaPago", icon: "budget" },
      { label: "Banners de Portada", href: "/dashboard/portadaEdit", icon: "monitor" },
      { label: "Tratamientos Destacados", href: "/dashboard/publicacionesTituloDescripcion", icon: "image" },
      { label: "Publicaciones Web", href: "/dashboard/publicaciones", icon: "layout" },
      { label: "Testimonios", href: "/dashboard/testimonios", icon: "image" },
    ],
  },
];


// ── Descripciones (formulario de creación de usuarios) ─────────────────────

const GRUPOS_PERFIL = {
  nativecode: "NativeCode",
  administracion: "Administración de la clínica",
  profesionales: "Profesionales",
  operacion: "Operación",
};

const BASE_PROFESIONAL_TEXTO = [
  "Solo su propia agenda y sus bloqueos.",
  "Ver y registrar pacientes.",
  "Ficha clínica y archivos de sus pacientes.",
  "Consentimientos informados.",
  "Firma electrónica y documentos por firmar.",
];

const BASE_ADMINISTRADOR_TEXTO = [
  "Agenda y bloqueos de todos los profesionales.",
  "Pacientes (datos administrativos) y cotizaciones.",
  "Finanzas y montos.",
  "Profesionales y agendas, servicios y tarifas.",
  "Plantillas de ficha y contenido web.",
  "Procedimientos del consentimiento informado (crear y editar).",
  "Verificar el N° de registro de la Superintendencia.",
];

const SIN_FICHAS = "No ve el contenido de las fichas clínicas (Ley 20.584).";
const SIN_USUARIOS = "No crea usuarios ni configura la pasarela de pago.";

const DASHBOARD_ROLE_DETAILS = {
  [ROL_TECNICO]: {
    grupo: "nativecode",
    label: "Técnico NativeCode",
    description: "Acceso total para dar soporte a la clínica, con su autorización.",
    recommendedFor: "Equipo de NativeCode.",
    access: [
      "Crear usuarios, asignar perfiles y agendas.",
      "Configurar la pasarela de pago.",
      "Revisar cualquier módulo para dar soporte (agenda, pacientes, fichas, documentos).",
    ],
    restrictions: [
      "Ve documentos, pero nunca firma por un profesional.",
      "Cada ingreso queda registrado.",
    ],
  },

  "admin-centro-salud": {
    grupo: "administracion",
    label: "Administrador · Centro de salud",
    description: "Administra un centro de psicología, kinesiología, nutrición u otras terapias.",
    recommendedFor: "Dueño, gerente o jefe administrativo del centro.",
    access: BASE_ADMINISTRADOR_TEXTO,
    restrictions: [SIN_FICHAS, SIN_USUARIOS],
  },
  "admin-clinica-medica": {
    grupo: "administracion",
    label: "Administrador · Clínica médica",
    description: "Administra una clínica de medicina general, especialidades o matronería.",
    recommendedFor: "Dueño, gerente o jefe administrativo de la clínica.",
    access: [...BASE_ADMINISTRADOR_TEXTO, "Catálogo de exámenes clínicos."],
    restrictions: [SIN_FICHAS, SIN_USUARIOS],
  },
  "admin-clinica-odontologica": {
    grupo: "administracion",
    label: "Administrador · Clínica odontológica",
    description: "Administra una clínica dental.",
    recommendedFor: "Dueño, gerente o jefe administrativo de la clínica.",
    access: [...BASE_ADMINISTRADOR_TEXTO, "Presupuestos, tratamientos y categorías."],
    restrictions: [SIN_FICHAS, SIN_USUARIOS],
  },
  "admin-centro-oftalmologico": {
    grupo: "administracion",
    label: "Administrador · Centro oftalmológico",
    description: "Administra un centro de oftalmología o tecnología médica.",
    recommendedFor: "Dueño, gerente o jefe administrativo del centro.",
    access: [...BASE_ADMINISTRADOR_TEXTO, "Catálogo de exámenes clínicos."],
    restrictions: [SIN_FICHAS, SIN_USUARIOS],
  },
  "admin-centro-estetico": {
    grupo: "administracion",
    label: "Administrador · Centro estético",
    description: "Administra un centro de armonización facial o cosmetología.",
    recommendedFor: "Dueño, gerente o jefe administrativo del centro.",
    access: [...BASE_ADMINISTRADOR_TEXTO, "Presupuestos, tratamientos y categorías.", "Stock, pedidos y cupones."],
    restrictions: [SIN_FICHAS, SIN_USUARIOS],
  },
  "admin-clinica": {
    grupo: "administracion",
    label: "Administrador · Multiespecialidad",
    description: "Administra un centro con varias especialidades.",
    recommendedFor: "Dueño, gerente o jefe administrativo de un centro mixto.",
    access: [...BASE_ADMINISTRADOR_TEXTO, "Catálogo de exámenes, presupuestos, tratamientos y categorías.", "Stock, pedidos y cupones."],
    restrictions: [SIN_FICHAS, SIN_USUARIOS],
  },

  "profesional-salud": {
    grupo: "profesionales",
    label: "Profesional de salud",
    description: "Psicología, kinesiología, nutrición, fonoaudiología, terapia ocupacional o enfermería.",
    recommendedFor: "Profesionales que registran atenciones sin emitir recetas ni exámenes.",
    access: [...BASE_PROFESIONAL_TEXTO, "Certificados e indicaciones."],
    restrictions: ["No emite recetas ni órdenes de exámenes.", "No ve montos ni configuración."],
  },
  "profesional-medico": {
    grupo: "profesionales",
    label: "Médico",
    description: "Medicina general y especialidades médicas.",
    recommendedFor: "Médicos que atienden y emiten documentación clínica.",
    access: [...BASE_PROFESIONAL_TEXTO, "Recetas médicas (impresión para firma de puño y letra).", "Órdenes de exámenes."],
    restrictions: ["No accede a odontograma ni presupuestos.", "No ve montos ni configuración."],
  },
  "profesional-odontologo": {
    grupo: "profesionales",
    label: "Odontólogo",
    description: "Odontología general y especialidades.",
    recommendedFor: "Odontólogos que atienden y preparan planes de tratamiento.",
    access: [...BASE_PROFESIONAL_TEXTO, "Odontograma.", "Presupuestos y cotizaciones.", "Recetas y órdenes de exámenes."],
    restrictions: ["El periodontograma aún no está habilitado.", "No administra configuración ni contenido web."],
  },
  "profesional-matrona": {
    grupo: "profesionales",
    label: "Matrona",
    description: "Obstetricia y ginecología.",
    recommendedFor: "Matronas y matrones.",
    access: [...BASE_PROFESIONAL_TEXTO, "Recetas (impresión para firma de puño y letra).", "Órdenes de exámenes."],
    restrictions: ["No accede a odontograma ni presupuestos.", "No ve montos ni configuración."],
  },
  "profesional-oftalmologia": {
    grupo: "profesionales",
    label: "Oftalmología",
    description: "Oftalmólogo o tecnólogo médico.",
    recommendedFor: "Profesionales de la visión.",
    access: [...BASE_PROFESIONAL_TEXTO, "Receta de lentes (impresión para firma de puño y letra).", "Órdenes de exámenes."],
    restrictions: ["No accede a odontograma ni presupuestos.", "No ve montos ni configuración."],
  },
  "profesional-estetica": {
    grupo: "profesionales",
    label: "Estética",
    description: "Armonización facial y cosmetología.",
    recommendedFor: "Profesionales de medicina estética.",
    access: [...BASE_PROFESIONAL_TEXTO, "Presupuestos y cotizaciones.", "Consultar tratamientos."],
    restrictions: ["No emite recetas ni órdenes de exámenes.", "No administra configuración ni contenido web."],
  },

  [ROL_RECEPCION]: {
    grupo: "operacion",
    label: "Recepción y secretaría",
    description: "Coordina la agenda, las reservas y el registro de pacientes.",
    recommendedFor: "Recepción y secretaría.",
    access: [
      "Agenda, reservas y bloqueos de todos los profesionales.",
      "Registrar pacientes y ver sus datos administrativos.",
      "Cotizaciones.",
    ],
    restrictions: [SIN_FICHAS, "No emite documentos clínicos ni ve configuración."],
  },
  [ROL_SUSPENDIDO]: {
    grupo: "operacion",
    label: "Suspendido",
    description: "Acceso suspendido: solo ve el estado de la suscripción.",
    recommendedFor: "Cuentas suspendidas por cancelación o pagos pendientes.",
    access: ["Ver la pantalla de suscripción cancelada."],
    restrictions: ["No usa ningún módulo del dashboard."],
  },

  [ROL_SIN_ACCESO]: {
    grupo: "operacion",
    label: "Sin perfil",
    description: "El usuario no tiene un perfil válido asignado.",
    recommendedFor: "Ningún usuario: asígnale un perfil.",
    access: [],
    restrictions: ["No puede acceder al dashboard."],
  },
};

// ── Normalización ───────────────────────────────────────────────────────────

/** Separa "profesional-odontologo+admin" en { base, administra }. */
function separarRol(role) {
  const texto = String(role || "").trim().toLowerCase();
  return texto.endsWith(SUFIJO_ADMIN)
    ? { base: texto.slice(0, -SUFIJO_ADMIN.length), administra: true }
    : { base: texto, administra: false };
}

/**
 * Perfil vigente a partir de cualquier valor (nuevo, antiguo o compuesto).
 * Vacío o desconocido → "sin-acceso". Nunca devuelve acceso total por omisión.
 */
function normalizeDashboardRole(input) {
  const { base, administra } = separarRol(input);
  if (!base) return ROL_SIN_ACCESO;
  const perfil = ALIAS_ROLES[base] || (DASHBOARD_ROLE_SET.has(base) ? base : ROL_SIN_ACCESO);
  return administra && PERFILES_PROFESIONALES_SET.has(perfil) ? `${perfil}${SUFIJO_ADMIN}` : perfil;
}

function perfilBase(role) {
  return separarRol(normalizeDashboardRole(role)).base;
}

function esPerfilProfesional(role) {
  return PERFILES_PROFESIONALES_SET.has(perfilBase(role));
}

/** Administra la clínica: administradores, profesionales con el interruptor y el técnico. */
function esAdministradorClinica(role) {
  const normalizado = normalizeDashboardRole(role);
  const { base, administra } = separarRol(normalizado);
  return base === ROL_TECNICO || PERFILES_ADMINISTRADOR_SET.has(base) || administra;
}

function hasFullDashboardAccess(role) {
  return normalizeDashboardRole(role) === ROL_TECNICO;
}

function rutasDelPerfil(role) {
  const { base, administra } = separarRol(normalizeDashboardRole(role));
  const propias = routeMatchersByRole[base] || [];
  if (!administra) return propias;
  return [...propias, ...(routeMatchersByRole[ADMIN_DE_PROFESIONAL[base]] || [])];
}

// ── Permisos ────────────────────────────────────────────────────────────────

function canAccessPaymentGateway(role) {
  return PAYMENT_GATEWAY_ROLES.has(normalizeDashboardRole(role));
}

function canAccessDashboardPath(role, pathname) {
  if (!pathname?.startsWith("/dashboard")) {
    return true;
  }

  // La pantalla de "sin acceso" siempre se puede abrir: es adonde el middleware
  // redirige a quien no tiene permiso (si no, se redirigiría en bucle).
  if (pathname === "/dashboard/no-access") {
    return true;
  }

  if (globallyDeniedDashboardMatchers.some((matcher) => matcher.test(pathname))) {
    return false;
  }

  if (paymentGatewayPathMatcher.test(pathname)) {
    return canAccessPaymentGateway(role);
  }

  if (hasFullDashboardAccess(role)) {
    return true;
  }

  return rutasDelPerfil(role).some((matcher) => matcher.test(pathname));
}

function getVisibleDashboardSections(role) {
  return DASHBOARD_NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessDashboardNavItem(role, item)),
    }))
    .filter((section) => section.items.length > 0);
}

function canAccessDashboardNavItem(role, item) {
  const normalizedRole = normalizeDashboardRole(role);

  if (normalizedRole === ROL_SIN_ACCESO) {
    return false;
  }

  // hiddenForRoles se compara con el perfil exacto: un profesional que además
  // administra ("+admin") no queda oculto, porque ya no es solo profesional.
  if (Array.isArray(item.hiddenForRoles) && item.hiddenForRoles.includes(normalizedRole)) {
    return false;
  }

  if (hasFullDashboardAccess(normalizedRole)) {
    return true;
  }

  if (item.visibleForAllRoles) {
    return normalizedRole !== ROL_SUSPENDIDO;
  }

  if (Array.isArray(item.roles)) {
    return item.roles.includes(perfilBase(normalizedRole));
  }

  return canAccessDashboardPath(normalizedRole, item.href);
}

/** Valor de las reservas y de los presupuestos. */
function canSeeReservationAmounts(role) {
  const normalizado = normalizeDashboardRole(role);
  return PERFILES_CON_MONTOS.has(perfilBase(normalizado)) || separarRol(normalizado).administra;
}

function canAccessOdontograma(role) {
  return canAccessDashboardPath(role, "/dashboard/odontogramasPaciente/x");
}

function canAccessRecetasEnFicha(role) {
  return canAccessDashboardPath(role, "/dashboard/recetaPacientes/x");
}

function canAccessFichasClinicas(role) {
  return canAccessDashboardPath(role, "/dashboard/FichaClinica");
}

/** true si el perfil está suspendido. */
function esPerfilSuspendido(role) {
  return normalizeDashboardRole(role) === ROL_SUSPENDIDO;
}

// ── Etiquetas ───────────────────────────────────────────────────────────────

function getDashboardRoleLabel(role) {
  const { base, administra } = separarRol(normalizeDashboardRole(role));
  const etiqueta = DASHBOARD_ROLE_DETAILS[base]?.label || base;
  return administra ? `${etiqueta} · administra la clínica` : etiqueta;
}

function getDashboardRoleDescription(role) {
  return DASHBOARD_ROLE_DETAILS[perfilBase(role)]?.description || "";
}

function getDashboardRoleAccessList(role) {
  return DASHBOARD_ROLE_DETAILS[perfilBase(role)]?.access || [];
}

/** Perfiles que se pueden asignar desde "Crear usuario", con su grupo. */
function getAssignableDashboardRoles() {
  return DASHBOARD_ROLES.map((role) => {
    const details = DASHBOARD_ROLE_DETAILS[role] || {};
    return {
      value: role,
      grupo: details.grupo,
      grupoLabel: GRUPOS_PERFIL[details.grupo] || "",
      label: details.label || role,
      description: details.description || "",
      recommendedFor: details.recommendedFor || "",
      access: details.access || [],
      restrictions: details.restrictions || [],
      esProfesional: PERFILES_PROFESIONALES_SET.has(role),
      administradorAsociado: ADMIN_DE_PROFESIONAL[role]
        ? DASHBOARD_ROLE_DETAILS[ADMIN_DE_PROFESIONAL[role]]?.label || ""
        : "",
    };
  });
}

function getCreatableDashboardRoles() {
  return getAssignableDashboardRoles();
}

// ── Lectura desde Clerk ─────────────────────────────────────────────────────

function getRoleFromClerkData(source) {
  return (
    source?.metadata?.role ||
    source?.publicMetadata?.role ||
    source?.public_metadata?.role ||
    source?.metadata?.rol ||
    source?.publicMetadata?.rol ||
    source?.public_metadata?.rol ||
    null
  );
}

function getAdministraFromClerkData(source) {
  const valor =
    source?.metadata?.administraClinica ??
    source?.publicMetadata?.administraClinica ??
    source?.public_metadata?.administraClinica;
  return valor === true || valor === "true";
}

/** Rol efectivo (con "+admin" si el profesional también administra la clínica). */
function rolEfectivo(source) {
  const rol = getRoleFromClerkData(source);
  const normalizado = normalizeDashboardRole(rol);
  return getAdministraFromClerkData(source) && PERFILES_PROFESIONALES_SET.has(normalizado)
    ? `${normalizado}${SUFIJO_ADMIN}`
    : normalizado;
}

function getDashboardRoleFromClaims(claims) {
  return rolEfectivo(claims);
}

function getDashboardRoleFromUser(user) {
  return rolEfectivo(user);
}

/**
 * Agenda a la que queda restringido el usuario ("" = ve todas). Solo se
 * restringe al profesional que no administra la clínica; el administrador,
 * recepción, el técnico y el profesional-dueño ven todas las agendas.
 */
function agendaRestringidaDe(user) {
  const rol = getDashboardRoleFromUser(user);
  if (!esPerfilProfesional(rol) || esAdministradorClinica(rol)) return "";
  return String(user?.publicMetadata?.idProfesionalAgenda || "").trim();
}

export {
  DASHBOARD_NAV_SECTIONS,
  DASHBOARD_ROLE_DETAILS,
  DASHBOARD_ROLES,
  GRUPOS_PERFIL,
  PERFILES_ADMINISTRADOR,
  PERFILES_PROFESIONALES,
  ROL_RECEPCION,
  ROL_SIN_ACCESO,
  ROL_SUSPENDIDO,
  ROL_TECNICO,
  agendaRestringidaDe,
  canAccessDashboardPath,
  canAccessPaymentGateway,
  canAccessFichasClinicas,
  canAccessOdontograma,
  canAccessRecetasEnFicha,
  canSeeReservationAmounts,
  esAdministradorClinica,
  esPerfilProfesional,
  esPerfilSuspendido,
  getDashboardRoleAccessList,
  getDashboardRoleFromClaims,
  getDashboardRoleFromUser,
  getDashboardRoleDescription,
  getDashboardRoleLabel,
  getAssignableDashboardRoles,
  getCreatableDashboardRoles,
  getVisibleDashboardSections,
  globallyDeniedDashboardMatchers,
  hasFullDashboardAccess,
  normalizeDashboardRole,
  perfilBase,
  routeMatchersByRole,
};
