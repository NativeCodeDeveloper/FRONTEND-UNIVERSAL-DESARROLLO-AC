const DASHBOARD_ROLES = [
  "default",
  "admin",
  "super-usuario-nativecode",
  "administrador-clinico",
  "operador-clinico",
  "operador-medico",
  "operador-odontologico",
  "recepcionista",
  "secretaria",
  "cancelado",
  "basico",
  "centro-estetico",
  "clinico-medico",
  "odontologico",
  "oftalmologia",
  "agenda",
  "configuracion",
];

const DASHBOARD_ROLE_SET = new Set(DASHBOARD_ROLES);
const globallyDeniedDashboardMatchers = [
  /^\/dashboard\/agendaCitas$/,
];
const paymentGatewayPathMatcher = /^\/dashboard\/pasarelaPago$/;
const PAYMENT_GATEWAY_ROLES = new Set([
  "admin",
  "super-usuario-nativecode",
]);

const routeMatchersByRole = {
  "super-usuario-nativecode": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/createUser$/,
    /^\/dashboard\/pasarelaPago$/,
  ],
  "administrador-clinico": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/archivosPacientes\/[^/]+$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/examenDocumento$/,
    /^\/dashboard\/presupuestoTratamiento$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/categoriasProductos$/,
    /^\/dashboard\/subCategorias\/[^/]+$/,
    /^\/dashboard\/subsubcategoria\/[^/]+$/,
    /^\/dashboard\/EspecificacionProductos\/[^/]+$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/examenesClinicos$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
  ],
  "operador-clinico": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/archivosPacientes\/[^/]+$/,
  ],
  "operador-medico": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/archivosPacientes\/[^/]+$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/recetaLentes$/,
    /^\/dashboard\/examenDocumento$/,
  ],
  "operador-odontologico": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/archivosPacientes\/[^/]+$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/recetaLentes$/,
    /^\/dashboard\/examenDocumento$/,
    /^\/dashboard\/odontogramasPaciente\/[^/]+$/,
    /^\/dashboard\/presupuestoTratamiento$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/categoriasProductos$/,
  ],
  recepcionista: [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/paciente\/[^/]+$/,
  ],
  secretaria: [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/paciente\/[^/]+$/,
  ],
  cancelado: [
    /^\/dashboard\/suscripcion-cancelada$/,
  ],
  basico: [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/presupuestoTratamiento$/,
    /^\/dashboard\/fichasClinicasPlantillas$/,
    /^\/dashboard\/fichasClinicasCategorias\/[^/]+$/,
    /^\/dashboard\/fichaCampo\/[^/]+$/,
  ],
  "centro-estetico": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/edicionPlantillaEspecifica\/[^/]+$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/categoriasProductos$/,
  ],
  "clinico-medico": [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/examenDocumento$/,
    /^\/dashboard\/examenesClinicos$/,
  ],
  odontologico: [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/examenDocumento$/,
    /^\/dashboard\/examenesClinicos$/,
    /^\/dashboard\/odontogramasPaciente\/[^/]+$/,
    /^\/dashboard\/presupuestoTratamiento$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/categoriasProductos$/,
  ],
  oftalmologia: [
    /^\/dashboard$/,
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/examenDocumento$/,
    /^\/dashboard\/recetaLentes$/,
  ],
  agenda: [
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/calendario$/,
    // /^\/dashboard\/calendarioGeneral$/,
    /^\/dashboard\/agendaCitas$/,
    /^\/dashboard\/bloqueosAgenda$/,
    /^\/dashboard\/AgendaDetalle\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/GestionPaciente$/,
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/paciente\/[^/]+$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/odontogramasPaciente\/[^/]+$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
  ],
  configuracion: [
    /^\/dashboard\/no-access$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/fichasClinicasPlantillas$/,
    /^\/dashboard\/fichasClinicasCategorias\/[^/]+$/,
    /^\/dashboard\/fichaCampo\/[^/]+$/,
    /^\/dashboard\/edicionPlantillaEspecifica\/[^/]+$/,
    /^\/dashboard\/categoriasProductos$/,
    /^\/dashboard\/subCategorias\/[^/]+$/,
    /^\/dashboard\/subsubcategoria\/[^/]+$/,
    /^\/dashboard\/EspecificacionProductos\/[^/]+$/,
    /^\/dashboard\/examenesClinicos$/,
  ],
};

const routeDenyMatchersByRole = {
  secretaria: [
    /^\/dashboard\/FichaClinica$/,
    /^\/dashboard\/fichasClinicasCategorias\/[^/]+$/,
    /^\/dashboard\/fichasClinicasPlantillas$/,
    /^\/dashboard\/FichasPacientes$/,
    /^\/dashboard\/FichasPacientes\/[^/]+$/,
    /^\/dashboard\/listaPacientes$/,
    /^\/dashboard\/EdicionFicha\/[^/]+$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/NuevaFicha\/[^/]+$/,
    /^\/dashboard\/odontogramasPaciente\/[^/]+$/,
    /^\/dashboard\/recetaPacientes\/[^/]+$/,
    /^\/dashboard\/recetaRapida$/,
    /^\/dashboard\/recetaLentes$/,
    /^\/dashboard\/examenDocumento$/,
    /^\/dashboard\/datosEmpresa$/,
    /^\/dashboard\/portadaEdit$/,
    /^\/dashboard\/publicacionesTituloDescripcion$/,
    /^\/dashboard\/publicaciones$/,
    /^\/dashboard\/edicionPagina$/,
    /^\/dashboard\/profesionales$/,
    /^\/dashboard\/serviciosAgendamiento$/,
    /^\/dashboard\/tarifaServicio$/,
    /^\/dashboard\/categoriasProductos$/,
    /^\/dashboard\/fichaCampo\/[^/]+$/,
    /^\/dashboard\/subCategorias\/[^/]+$/,
    /^\/dashboard\/subsubcategoria\/[^/]+$/,
    /^\/dashboard\/EspecificacionProductos\/[^/]+$/,
    /^\/dashboard\/examenesClinicos$/,
    /^\/dashboard\/gestionStock$/,
    /^\/dashboard\/pedidosCompras$/,
    /^\/dashboard\/pedidosDetalle$/,
    /^\/dashboard\/cupones$/,
    /^\/dashboard\/createUser$/,
    /^\/dashboard\/presupuestoTratamiento$/,
  ],
  "clinico-medico": [
    /^\/dashboard\/odontogramasPaciente\/[^/]+$/,
    /^\/dashboard\/edicionPlantillaEspecifica\/[^/]+$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/recetaLentes$/,
    /^\/dashboard\/categoriasProductos$/,
  ],
  odontologico: [
    /^\/dashboard\/recetaLentes$/,
    /^\/dashboard\/edicionPlantillaEspecifica\/[^/]+$/,
  ],
  oftalmologia: [
    /^\/dashboard\/odontogramasPaciente\/[^/]+$/,
    /^\/dashboard\/ingresoProductos$/,
    /^\/dashboard\/categoriasProductos$/,
    /^\/dashboard\/edicionPlantillaEspecifica\/[^/]+$/,
  ],
};

const DASHBOARD_NAV_SECTIONS = [
  {
    id: "capacitaciones",
    title: "CAPACITACIONES",
    items: [
      { label: "Videos", href: "https://academia.agendaclinicas.cl/dashboard", icon: "academy", visibleForAllRoles: true },
    ],
  },
  {
    id: "principal",
    title: "Principal",
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
      { label: "Ver Pacientes", href: "/dashboard/listaPacientes", icon: "users" },
      { label: "Registrar Paciente", href: "/dashboard/GestionPaciente", icon: "users" },
      { label: "Ficha Clinica", href: "/dashboard/FichaClinica", icon: "fileText" },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    accordionLabel: "Documentos Clinicos",
    icon: "document",
    items: [
      { label: "Receta Medica", href: "/dashboard/recetaRapida", icon: "fileText" },
      { label: "Receta de Lentes", href: "/dashboard/recetaLentes", icon: "fileText" },
      { label: "Solicitar Examenes", href: "/dashboard/examenDocumento", icon: "fileText" },
    ],
  },
  {
    id: "presupuestos",
    title: "Presupuestos",
    accordionLabel: "Presupuestos",
    icon: "budget",
    items: [
      { label: "Generar Presupuesto", href: "/dashboard/presupuestoTratamiento", icon: "budget" },
      { label: "Tratamientos Disponibles", href: "/dashboard/ingresoProductos", icon: "budget" },
      { label: "Categorias", href: "/dashboard/categoriasProductos", icon: "budget" },
    ],
  },
  {
    id: "configuracion",
    title: "Configuracion Clinica",
    accordionLabel: "Configuracion Clinica",
    icon: "settings",
    items: [
      { label: "Profesionales y Agendas", href: "/dashboard/profesionales", icon: "settings" },
      { label: "Servicios Agendables", href: "/dashboard/serviciosAgendamiento", icon: "settings" },
      { label: "Tarifas de Consulta", href: "/dashboard/tarifaServicio", icon: "settings" },
      { label: "Examenes Clinicos", href: "/dashboard/examenesClinicos", icon: "folder" },
    ],
  },
  {
    id: "plantillas",
    title: "Plantillas",
    accordionLabel: "Plantillas y Examenes",
    icon: "folder",
    items: [
      { label: "Modelos de Fichas", href: "/dashboard/fichasClinicasPlantillas", icon: "folder" },
    ],
  },
  {
    id: "contenido",
    title: "Contenido web",
    accordionLabel: "Contenido web",
    icon: "image",
    items: [
      { label: "Datos de la Página Web", href: "/dashboard/datosEmpresa", icon: "settings" },
      { label: "Pasarela de Pago", href: "/dashboard/pasarelaPago", icon: "budget" },
      { label: "Banners de Portada", href: "/dashboard/portadaEdit", icon: "monitor" },
      { label: "Tratamientos Destacados", href: "/dashboard/publicacionesTituloDescripcion", icon: "image" },
      { label: "Publicaciones Web", href: "/dashboard/publicaciones", icon: "layout" },
    ],
  },
];

const DASHBOARD_ROLE_DETAILS = {
  admin: {
    label: "Administrador",
    description: "Acceso total al dashboard.",
    recommendedFor: "Propietarios o responsables generales de la plataforma.",
    restrictions: [
      "Sin restricciones funcionales dentro del dashboard, salvo bloqueos globales del sistema.",
    ],
  },
  "super-usuario-nativecode": {
    label: "Super Usuario NativeCode",
    description: "Perfil técnico dedicado a crear usuarios y asignar sus permisos en Clerk.",
    recommendedFor: "Soporte técnico o personal responsable de administrar accesos.",
    access: [
      "Abrir el panel principal del dashboard.",
      "Crear usuarios con correo y contraseña.",
      "Asignar cualquiera de los perfiles disponibles en el sistema.",
    ],
    restrictions: [
      "No gestiona agenda, pacientes ni fichas clínicas.",
      "No accede a documentos médicos, presupuestos, configuración ni contenido web.",
    ],
  },
  "administrador-clinico": {
    label: "Administrador Clinico",
    description: "Administra casi toda la operación clínica, documental y de configuración.",
    recommendedFor: "Directores clínicos o encargados operativos con responsabilidades amplias.",
    access: [
      "Capacitaciones.",
      "Panel de reservas, calendario, bloqueos y detalle de citas.",
      "Ver pacientes y registrar nuevos pacientes.",
      "Crear, revisar y editar fichas clínicas y archivos de pacientes.",
      "Emitir recetas médicas y solicitudes de exámenes.",
      "Crear presupuestos y administrar tratamientos y categorías.",
      "Configurar profesionales, agendas, servicios, tarifas y exámenes clínicos.",
      "Administrar datos del sitio, banners, tratamientos destacados y publicaciones.",
    ],
    restrictions: [
      "No puede crear usuarios ni asignar perfiles.",
      "No accede a receta de lentes ni odontograma.",
      "No administra stock, pedidos, cupones ni plantillas clínicas generales.",
    ],
  },
  "operador-clinico": {
    label: "Operador Clinico",
    description: "Gestiona pacientes y fichas clínicas con una vista económica restringida.",
    recommendedFor: "Personal clínico que registra atenciones sin administrar agenda ni valores.",
    access: [
      "Consultar el panel de reservas y el estado de las citas.",
      "Ver pacientes y registrar nuevos pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Consultar y administrar documentos adjuntos del paciente.",
    ],
    restrictions: [
      "No visualiza el valor o monto de las reservas.",
      "No administra calendario, bloqueos ni detalle de agenda.",
      "No emite recetas, exámenes ni receta de lentes.",
      "No accede a odontograma, presupuestos, configuración ni contenido web.",
    ],
  },
  "operador-medico": {
    label: "Operador Medico",
    description: "Gestiona pacientes, fichas y documentos médicos, sin funciones odontológicas.",
    recommendedFor: "Médicos que atienden pacientes y emiten documentación clínica.",
    access: [
      "Consultar el panel de reservas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas y archivos adjuntos.",
      "Emitir recetas médicas, recetas de lentes y solicitudes de exámenes.",
      "Generar recetas desde la ficha del paciente.",
    ],
    restrictions: [
      "No accede a odontograma.",
      "No administra calendario ni bloqueos de agenda.",
      "No gestiona presupuestos, tratamientos, configuración ni contenido web.",
    ],
  },
  "operador-odontologico": {
    label: "Operador Odontologico",
    description: "Gestiona la atención odontológica completa, incluidos odontograma y presupuestos.",
    recommendedFor: "Odontólogos que atienden pacientes y preparan planes de tratamiento.",
    access: [
      "Consultar el panel de reservas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas y archivos adjuntos.",
      "Emitir recetas médicas, recetas de lentes y solicitudes de exámenes.",
      "Trabajar con el odontograma del paciente.",
      "Crear presupuestos y consultar tratamientos y categorías.",
    ],
    restrictions: [
      "No administra calendario ni bloqueos de agenda.",
      "No configura profesionales, servicios, tarifas ni contenido web.",
      "No administra plantillas clínicas, stock, pedidos ni cupones.",
    ],
  },
  recepcionista: {
    label: "Recepcionista",
    description: "Gestiona citas, bloqueos y registro administrativo básico de pacientes.",
    recommendedFor: "Recepción encargada de coordinar horas y datos básicos de atención.",
    access: [
      "Consultar el panel y el detalle de las reservas.",
      "Crear y administrar reservas desde el calendario.",
      "Crear y revisar bloqueos de agenda.",
      "Registrar pacientes y consultar sus datos generales.",
    ],
    restrictions: [
      "No accede a fichas clínicas ni al listado clínico de pacientes.",
      "No emite recetas, exámenes ni documentos médicos.",
      "No accede a odontograma, presupuestos, configuración ni contenido web.",
    ],
  },
  secretaria: {
    label: "Secretaria",
    description: "Gestiona agenda y flujo administrativo de reservas sin acceso clínico.",
    recommendedFor: "Secretaría encargada de coordinar citas y registrar pacientes.",
    access: [
      "Consultar el panel y el detalle de las reservas.",
      "Crear y administrar reservas desde el calendario.",
      "Crear y revisar bloqueos de agenda.",
      "Registrar pacientes y consultar sus datos generales.",
    ],
    restrictions: [
      "No accede a fichas clínicas ni al listado clínico de pacientes.",
      "No emite recetas, exámenes ni documentos médicos.",
      "No accede a odontograma, presupuestos, configuración ni contenido web.",
    ],
  },
  cancelado: {
    label: "Cancelado",
    description: "Suspende el acceso operativo y muestra únicamente el estado de la suscripción.",
    recommendedFor: "Cuentas temporalmente suspendidas por cancelación o pagos pendientes.",
    access: [
      "Consultar la pantalla de suscripción cancelada.",
    ],
    restrictions: [
      "No puede usar ningún módulo operativo del dashboard.",
      "No accede a agenda, pacientes, fichas, documentos ni configuración.",
    ],
  },
  basico: {
    label: "Basico",
    description: "Combina agenda, fichas y configuración básica, sin documentación médica.",
    recommendedFor: "Centros que necesitan una operación general sin recetas ni exámenes.",
    access: [
      "Panel de reservas, calendario, bloqueos y detalle de citas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Crear presupuestos y administrar plantillas de fichas.",
      "Configurar profesionales, servicios y tarifas.",
      "Administrar datos del sitio, banners y publicaciones.",
    ],
    restrictions: [
      "No emite recetas médicas, receta de lentes ni solicitudes de exámenes.",
      "No accede a odontograma.",
      "No administra tratamientos disponibles, categorías ni exámenes clínicos.",
    ],
  },
  "centro-estetico": {
    label: "Centro Estetico",
    description: "Gestiona agenda, fichas, contenido y catálogo de tratamientos estéticos.",
    recommendedFor: "Centros estéticos que trabajan con tratamientos y fichas de pacientes.",
    access: [
      "Panel de reservas, calendario, bloqueos y detalle de citas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Administrar tratamientos disponibles y categorías.",
      "Configurar profesionales, servicios y tarifas.",
      "Administrar datos del sitio, banners y publicaciones.",
    ],
    restrictions: [
      "No emite recetas, receta de lentes ni solicitudes de exámenes.",
      "No accede a odontograma ni exámenes clínicos.",
      "No administra las plantillas clínicas generales.",
    ],
  },
  "clinico-medico": {
    label: "Clinico Medico",
    description: "Perfil clínico amplio para fichas, recetas médicas y solicitudes de exámenes.",
    recommendedFor: "Consultas médicas que también administran agenda, configuración y contenido.",
    access: [
      "Panel de reservas, calendario, bloqueos y detalle de citas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Emitir recetas médicas y solicitudes de exámenes.",
      "Configurar profesionales, servicios, tarifas y exámenes clínicos.",
      "Administrar datos del sitio, banners y publicaciones.",
    ],
    restrictions: [
      "No accede a odontograma ni receta de lentes.",
      "No administra presupuestos, tratamientos ni categorías.",
      "No administra plantillas clínicas generales.",
    ],
  },
  odontologico: {
    label: "Odontologico",
    description: "Perfil odontológico amplio con agenda, odontograma, presupuestos y configuración.",
    recommendedFor: "Clínicas odontológicas que administran operación y contenido completo.",
    access: [
      "Panel de reservas, calendario, bloqueos y detalle de citas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Emitir recetas médicas y solicitudes de exámenes.",
      "Trabajar con odontogramas y presupuestos.",
      "Administrar tratamientos, categorías, profesionales, servicios y tarifas.",
      "Administrar datos del sitio, banners y publicaciones.",
    ],
    restrictions: [
      "No emite receta de lentes.",
      "No administra plantillas clínicas generales.",
      "No administra stock, pedidos ni cupones.",
    ],
  },
  oftalmologia: {
    label: "Oftalmologia",
    description: "Perfil clínico amplio con recetas médicas, exámenes y receta de lentes.",
    recommendedFor: "Consultas oftalmológicas que administran atención, agenda y contenido.",
    access: [
      "Panel de reservas, calendario, bloqueos y detalle de citas.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Emitir recetas médicas, receta de lentes y solicitudes de exámenes.",
      "Configurar profesionales, servicios y tarifas.",
      "Administrar datos del sitio, banners y publicaciones.",
    ],
    restrictions: [
      "No accede a odontograma.",
      "No administra presupuestos, tratamientos ni categorías.",
      "No administra plantillas ni exámenes clínicos maestros.",
    ],
  },
  agenda: {
    label: "Agenda",
    description: "Perfil operativo concentrado en calendario, pacientes y continuidad clínica.",
    recommendedFor: "Equipos que gestionan citas y fichas sin administrar el sistema completo.",
    access: [
      "Administrar calendario, reservas y bloqueos.",
      "Ver y registrar pacientes.",
      "Crear, revisar y editar fichas clínicas.",
      "Abrir recetas médicas desde la ficha del paciente.",
    ],
    restrictions: [
      "No accede al panel principal de reservas.",
      "No dispone de receta rápida, receta de lentes ni solicitud de exámenes.",
      "No administra presupuestos, configuración, catálogos ni contenido web.",
    ],
  },
  configuracion: {
    label: "Configuracion",
    description: "Administra catálogos, plantillas, profesionales y contenido, sin datos clínicos.",
    recommendedFor: "Personal administrativo que mantiene la configuración general del centro.",
    access: [
      "Configurar profesionales, servicios, tarifas y exámenes clínicos.",
      "Administrar plantillas y campos de fichas.",
      "Administrar tratamientos, categorías y subcategorías.",
      "Administrar datos del sitio, banners y publicaciones.",
    ],
    restrictions: [
      "No accede al panel principal ni a la agenda.",
      "No consulta pacientes ni fichas clínicas.",
      "No emite recetas, exámenes de pacientes ni odontogramas.",
    ],
  },
  default: {
    label: "Default",
    description: "Rol por defecto con acceso administrativo completo.",
    recommendedFor: "Compatibilidad interna del sistema.",
    access: [
      "Acceso administrativo completo.",
    ],
    restrictions: [],
  },
  unknown: {
    label: "Sin permisos",
    description: "Rol no reconocido por el sistema.",
    recommendedFor: "Ningún usuario; indica una configuración inválida.",
    access: [
      "Sin acceso a modulos protegidos.",
    ],
    restrictions: [
      "No puede acceder a los módulos protegidos.",
    ],
  },
};

function normalizeDashboardRole(input) {
  const raw = String(input || "").trim().toLowerCase();

  if (!raw) {
    return "default";
  }

  if (raw === "default" || raw === "admin") {
    return "admin";
  }

  return DASHBOARD_ROLE_SET.has(raw) ? raw : "unknown";
}

function hasFullDashboardAccess(role) {
  const normalizedRole = normalizeDashboardRole(role);
  return normalizedRole === "admin" || normalizedRole === "default";
}

function canAccessPaymentGateway(role) {
  return PAYMENT_GATEWAY_ROLES.has(normalizeDashboardRole(role));
}

function canAccessDashboardPath(role, pathname) {
  if (!pathname?.startsWith("/dashboard")) {
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

  const normalizedRole = normalizeDashboardRole(role);
  const denyMatchers = routeDenyMatchersByRole[normalizedRole] || [];

  if (denyMatchers.some((matcher) => matcher.test(pathname))) {
    return false;
  }

  const matchers = routeMatchersByRole[normalizedRole] || [];
  return matchers.some((matcher) => matcher.test(pathname));
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

  if (hasFullDashboardAccess(normalizedRole)) {
    return true;
  }

  if (item.visibleForAllRoles) {
    return normalizedRole !== "unknown";
  }

  if (Array.isArray(item.roles)) {
    return item.roles.includes(normalizedRole);
  }

  return canAccessDashboardPath(normalizedRole, item.href);
}

function getDashboardRoleLabel(role) {
  const normalizedRole = normalizeDashboardRole(role);
  return DASHBOARD_ROLE_DETAILS[normalizedRole]?.label || normalizedRole;
}

function getDashboardRoleDescription(role) {
  const normalizedRole = normalizeDashboardRole(role);
  return DASHBOARD_ROLE_DETAILS[normalizedRole]?.description || "";
}

function getDashboardRoleAccessList(role) {
  const normalizedRole = normalizeDashboardRole(role);
  return DASHBOARD_ROLE_DETAILS[normalizedRole]?.access || [];
}

function getAssignableDashboardRoles() {
  return DASHBOARD_ROLES
    .filter((role) => !["default", "admin"].includes(role))
    .map((role) => {
      const details = DASHBOARD_ROLE_DETAILS[normalizeDashboardRole(role)] || {};

      return {
        value: role,
        label: details.label || role,
        description: details.description || "",
        recommendedFor: details.recommendedFor || "",
        access: details.access || [],
        restrictions: details.restrictions || [],
      };
    });
}

function getRoleFromClerkData(source) {
  return (
    source?.metadata?.role ||
    source?.publicMetadata?.role ||
    source?.public_metadata?.role ||
    source?.unsafeMetadata?.role ||
    source?.unsafe_metadata?.role ||
    source?.publicMetadata?.rol ||
    source?.public_metadata?.rol ||
    source?.unsafeMetadata?.rol ||
    source?.unsafe_metadata?.rol ||
    null
  );
}

function getDashboardRoleFromClaims(claims) {
  return normalizeDashboardRole(getRoleFromClerkData(claims));
}

function getDashboardRoleFromUser(user) {
  return normalizeDashboardRole(getRoleFromClerkData(user));
}

function canAccessOdontograma(role) {
  const normalizedRole = normalizeDashboardRole(role);
  return hasFullDashboardAccess(role) || ["odontologico", "operador-odontologico"].includes(normalizedRole);
}

function canAccessRecetasEnFicha(role) {
  const normalizedRole = normalizeDashboardRole(role);
  return hasFullDashboardAccess(role) || ["administrador-clinico", "operador-medico", "operador-odontologico", "clinico-medico", "odontologico", "oftalmologia", "agenda"].includes(normalizedRole);
}

function canAccessFichasClinicas(role) {
  return canAccessDashboardPath(role, "/dashboard/FichaClinica");
}

export {
  DASHBOARD_NAV_SECTIONS,
  DASHBOARD_ROLE_DETAILS,
  DASHBOARD_ROLES,
  canAccessDashboardPath,
  canAccessPaymentGateway,
  canAccessFichasClinicas,
  canAccessOdontograma,
  canAccessRecetasEnFicha,
  getDashboardRoleAccessList,
  getDashboardRoleFromClaims,
  getDashboardRoleFromUser,
  getDashboardRoleDescription,
  getDashboardRoleLabel,
  getAssignableDashboardRoles,
  getVisibleDashboardSections,
  globallyDeniedDashboardMatchers,
  hasFullDashboardAccess,
  normalizeDashboardRole,
  routeDenyMatchersByRole,
  routeMatchersByRole,
};
