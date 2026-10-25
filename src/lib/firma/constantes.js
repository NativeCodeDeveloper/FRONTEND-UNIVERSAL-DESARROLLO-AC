/* Constantes de la firma electrónica simple (FES, Ley 19.799).
 * Los valores coinciden con docs/firma/02-contrato-endpoints.md. */

export const TINTAS = {
  azul: { valor: "azul", etiqueta: "Azul", color: "#1b3fa8" },
  negro: { valor: "negro", etiqueta: "Negro", color: "#15131f" },
};

/**
 * Tipos que pueden firmarse con FES. Las recetas NO están: la receta para
 * dispensación exige firma electrónica avanzada (FEA) y se imprimen para firma
 * de puño y letra. No agregarlas aquí.
 */
export const TIPOS_DOCUMENTO = {
  cotizacion: "Cotización",
  presupuesto: "Presupuesto",
  orden_examen: "Orden de examen",
  ficha_clinica: "Ficha clínica",
  consentimiento_informado: "Consentimiento informado",
  indicaciones: "Indicaciones",
  certificado_atencion: "Certificado de atención",
};

export const ESTADOS_FIRMA = {
  ninguna: { etiqueta: "Pendiente", tono: "neutro" },
  activa: { etiqueta: "Registrada", tono: "verde" },
  reemplazada: { etiqueta: "Reemplazada", tono: "neutro" },
  revocada: { etiqueta: "Revocada", tono: "rojo" },
};

export const ESTADOS_REGISTRO_SIS = {
  no_informado: { etiqueta: "No informado", tono: "neutro" },
  declarado: { etiqueta: "Declarado", tono: "azul" },
  verificado: { etiqueta: "Verificado", tono: "verde" },
  rechazado: { etiqueta: "Rechazado", tono: "rojo" },
};

export const ESTADOS_DOCUMENTO = {
  pendiente_firma: { etiqueta: "Pendiente de firma", tono: "azul" },
  firmado: { etiqueta: "Firmado", tono: "verde" },
  anulado: { etiqueta: "Anulado", tono: "rojo" },
};

/**
 * Tonos de estado con los colores de sistema de Apple (HIG): gris neutro para lo
 * pendiente, azul para lo que está en curso, verde para lo vigente y rojo para lo
 * rechazado o revocado. Nada de ámbar ni café: el pendiente no es una alerta.
 */
export const COLORES_APPLE = {
  azul: "#007AFF",
  verde: "#34C759",
  rojo: "#FF3B30",
  gris6: "#F2F2F7",
  etiquetaSecundaria: "#636366",
};

export const CLASES_TONO = {
  neutro: "bg-[#F2F2F7] text-[#636366]",
  azul: "bg-[#007AFF]/10 text-[#0062CC]",
  verde: "bg-[#34C759]/15 text-[#248A3D]",
  rojo: "bg-[#FF3B30]/10 text-[#D70015]",
};

export const URL_RNPI = "https://rnpi.superdesalud.gob.cl";

export const LIMITE_CERTIFICADO_BYTES = 5 * 1024 * 1024;
export const TIPOS_CERTIFICADO = ["application/pdf", "image/jpeg", "image/png"];

/** Mensajes para los códigos de error del backend (`{message: "<codigo>"}`). */
export const MENSAJES_ERROR = {
  sindata: "Faltan datos para completar la operación.",
  noAutorizado: "Tu sesión expiró. Vuelve a iniciar sesión.",
  sinPermiso: "No tienes permiso para realizar esta acción.",
  reverificacionRequerida: "Debes confirmar tu identidad para continuar.",
  noEncontrado: "No se encontró el registro.",
  firmaInexistente: "El profesional aún no registra su firma electrónica.",
  documentoYaFirmado: "Este documento ya fue firmado.",
  documentoAnulado: "Este documento fue anulado.",
  actaNoAceptada: "Debes aceptar el acta de adhesión a firma electrónica.",
  actaDesactualizada: "El texto cambió. Revisa la versión vigente y vuelve a aceptar.",
  rutInvalido: "El RUT no es válido.",
  documentoInvalido: "El documento de identidad no es válido.",
  pngInvalido: "La firma no se pudo procesar. Dibújala de nuevo, un poco más grande.",
  pdfInvalido: "El documento no se pudo preparar para firma.",
  archivoInvalido: "El archivo debe ser PDF, JPG o PNG de hasta 5 MB.",
  correoInvalido: "El correo de destino no es válido.",
  tipoDocumentoNoPermitido: "Este tipo de documento no se firma electrónicamente.",
  demasiadasSolicitudes: "Demasiados intentos. Espera unos minutos.",
  conflicto: "Otra operación cambió este registro. Recarga e intenta de nuevo.",
  integridad: "El archivo recibido no coincide con el documento firmado. Avisa a soporte.",
  datoinvalido: "Revisa los datos ingresados.",
  sinCambios: "No hay cambios para publicar.",
  procedimientoDuplicado: "Ya existe un procedimiento vigente con ese nombre en esa especialidad. Edítalo para publicar una versión nueva.",
  servicioOcupado: "Hay muchas firmas en proceso. Intenta de nuevo en unos segundos.",
  archivoDemasiadoGrande: "El archivo es demasiado grande.",
  otpInvalido: "El código no es correcto. Revisa y vuelve a intentarlo.",
  otpExpirado: "El código venció. Solicita uno nuevo.",
  otpIntentosAgotados: "Se agotaron los intentos. Solicita un código nuevo.",
  otpRequerido: "Falta la aceptación del paciente con su código antes de firmar.",
  sinDatoContacto: "El paciente no tiene ese dato registrado en su ficha. Actualízalo o usa el otro canal.",
  serverError: "Error del servidor. Intenta nuevamente.",
};

export function mensajeError(codigo) {
  return MENSAJES_ERROR[codigo] || MENSAJES_ERROR.serverError;
}
