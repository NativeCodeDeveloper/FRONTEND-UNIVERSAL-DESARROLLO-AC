/* Backend simulado de la firma electrónica (NEXT_PUBLIC_FIRMA_MOCK=1).
 *
 * Responde con las MISMAS formas que docs/firma/02-contrato-endpoints.md, para
 * construir y probar todo el front antes de que exista el servidor. El estado
 * vive en memoria del módulo (se pierde al recargar) y nunca en localStorage:
 * ni la grafía ni los documentos deben quedar guardados en el navegador.
 *
 * Con NEXT_PUBLIC_FIRMA_MOCK_REVERIFICACION=1, la primera firma de cada carga
 * responde la señal de reverificación, para ver la ventana real de Clerk.
 *
 * Lo que este mock hace en el navegador (estampar, hashear, fijar la hora) en
 * producción lo hace SOLO el servidor.
 */

import { ACTA_RESPALDO } from "./actaAdhesion";
import { ErrorFirma } from "./errores";
import { formatearInstanteConOffset } from "@/lib/fechas";

const estado = {
  firmas: new Map(),       // id_profesional → { firma, imagen: Blob }
  registros: new Map(),    // id_profesional → registroSis
  documentos: new Map(),   // id_documento → { documento, borrador: Blob, final: Blob|null, zona, metadatos }
  consentimientos: [],
  reverificacionPendiente: process.env.NEXT_PUBLIC_FIRMA_MOCK_REVERIFICACION === "1",
};

const esperar = () => new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
// fecha-ok: instante del "servidor" simulado; en producción lo fija el backend.
const ahoraIso = () => new Date().toISOString();
const nuevoId = () => crypto.randomUUID();

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function codigoVerificacion() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  const c = [...b].map((x) => ALFABETO[x & 31]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

async function sha256(blobOBytes) {
  const datos = blobOBytes instanceof Blob ? await blobOBytes.arrayBuffer() : blobOBytes;
  const digest = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function enmascararCorreo(correo) {
  const [usuario, dominio] = String(correo).split("@");
  if (!dominio) return "•••";
  return `${usuario[0]}${"•".repeat(Math.max(usuario.length - 2, 1))}${usuario.slice(-1)}@${dominio}`;
}

function enmascararTelefono(telefono) {
  const digitos = String(telefono).replace(/\D/g, "");
  return digitos.length >= 4 ? `+56 9 •••• ${digitos.slice(-4)}` : "••••";
}

function senalReverificacion() {
  return {
    message: "reverificacionRequerida",
    clerk_error: {
      type: "forbidden",
      reason: "reverification-error",
      metadata: { reverification: { level: "first_factor", afterMinutes: 10 } },
    },
  };
}

function reverificar() {
  if (!estado.reverificacionPendiente) return null;
  estado.reverificacionPendiente = false;
  return senalReverificacion();
}

function registroVacio() {
  return { numero: null, estado: "no_informado", tiene_certificado: false, verificado_por: null, verificado_at: null, motivo_rechazo: null };
}

async function qrPng(texto) {
  const QRCode = (await import("qrcode")).default;
  const url = await QRCode.toDataURL(texto, { errorCorrectionLevel: "M", margin: 1, width: 360 });
  return (await fetch(url)).arrayBuffer();
}

export function crearMockFirma() {
  return {
    async seleccionarEstadoFirma({ id_profesional }) {
      await esperar();
      return {
        message: true,
        firma: estado.firmas.get(String(id_profesional))?.firma ?? null,
        registroSis: estado.registros.get(String(id_profesional)) ?? registroVacio(),
      };
    },

    async seleccionarActaVigente() {
      await esperar();
      return { message: true, acta: { ...ACTA_RESPALDO, sha256: await sha256(new TextEncoder().encode(ACTA_RESPALDO.cuerpo)) } };
    },

    async registrarFirma(formData) {
      await esperar();
      const senal = reverificar();
      if (senal) return senal;

      const id = String(formData.get("id_profesional"));
      const imagen = formData.get("imagen");
      if (formData.get("acta_aceptada") !== "true") throw new ErrorFirma("actaNoAceptada", 409);
      if (!(imagen instanceof Blob) || imagen.type !== "image/png") throw new ErrorFirma("pngInvalido", 422);

      const bitmap = await createImageBitmap(imagen);
      const firma = {
        id_firma: nuevoId(),
        id_profesional: Number(id),
        estado: "activa",
        tinta: formData.get("tinta"),
        ancho_px: bitmap.width,
        alto_px: bitmap.height,
        imagen_sha256: await sha256(imagen),
        acta_version: formData.get("acta_version"),
        registrada_at: ahoraIso(),
      };
      estado.firmas.set(id, { firma, imagen });
      return { message: true, firma };
    },

    async seleccionarImagenFirma({ id_profesional }) {
      await esperar();
      const registro = estado.firmas.get(String(id_profesional));
      if (!registro) throw new ErrorFirma("firmaInexistente", 409);
      return registro.imagen;
    },

    async revocarFirma({ id_profesional }) {
      await esperar();
      estado.firmas.delete(String(id_profesional));
      return { message: true };
    },

    async actualizarRegistroSis(formData) {
      await esperar();
      const id = String(formData.get("id_profesional"));
      const numero = String(formData.get("registro_sis_numero") ?? "").trim();
      const previo = estado.registros.get(id) ?? registroVacio();
      const certificado = formData.get("certificado");
      const registro = {
        ...previo,
        numero: numero || null,
        estado: numero ? (numero === previo.numero && previo.estado !== "rechazado" ? previo.estado : "declarado") : "no_informado",
        tiene_certificado: previo.tiene_certificado || certificado instanceof Blob,
      };
      if (registro.estado === "declarado") Object.assign(registro, { verificado_por: null, verificado_at: null, motivo_rechazo: null });
      estado.registros.set(id, registro);
      return { message: true, registroSis: registro };
    },

    async verificarRegistroSis({ id_profesional, decision, motivo }) {
      await esperar();
      const id = String(id_profesional);
      const registro = {
        ...(estado.registros.get(id) ?? registroVacio()),
        estado: decision,
        verificado_por: "Administrador (simulado)",
        verificado_at: ahoraIso(),
        motivo_rechazo: decision === "rechazado" ? motivo : null,
      };
      estado.registros.set(id, registro);
      return { message: true, registroSis: registro };
    },

    async descargarCertificadoSis() {
      await esperar();
      throw new ErrorFirma("noEncontrado", 404);
    },

    async prepararDocumento(formData) {
      await esperar();
      const borrador = formData.get("pdf");
      const tipo = formData.get("tipo_documento");
      if (String(tipo).startsWith("receta")) throw new ErrorFirma("tipoDocumentoNoPermitido", 422);
      const documento = {
        id_documento: nuevoId(),
        codigo_verificacion: codigoVerificacion(),
        tipo_documento: tipo,
        titulo: formData.get("titulo"),
        estado: "pendiente_firma",
        id_paciente: Number(formData.get("id_paciente")) || null,
        paciente_nombre: formData.get("paciente_nombre") || null,
        id_profesional_firmante: Number(formData.get("id_profesional_firmante")),
        firmante_nombre: formData.get("firmante_nombre") || null,
        preparado_por: "Usuario actual (simulado)",
        preparado_at: ahoraIso(),
        firmado_at: null,
        pdf_sha256: null,
        paginas: null,
        anulado_at: null,
      };
      estado.documentos.set(documento.id_documento, {
        documento,
        borrador,
        final: null,
        zona: JSON.parse(formData.get("zona_firma")),
        zonaPaciente: formData.get("zona_paciente") ? JSON.parse(formData.get("zona_paciente")) : null,
        contactoPaciente: JSON.parse(formData.get("paciente_contacto_mock") || "{}"),
        otp: null,
        aceptacion: null,
        metadatos: JSON.parse(formData.get("metadatos") || "{}"),
        firmante: JSON.parse(formData.get("firmante_mock") || "{}"),
      });
      return { message: true, documento };
    },

    async seleccionarBorrador({ id_documento }) {
      await esperar();
      const registro = estado.documentos.get(id_documento);
      if (!registro) throw new ErrorFirma("noEncontrado", 404);
      return registro.borrador;
    },

    async firmarDocumento({ id_documento }) {
      await esperar();
      const senal = reverificar();
      if (senal) return senal;

      const registro = estado.documentos.get(id_documento);
      if (!registro) throw new ErrorFirma("noEncontrado", 404);
      if (registro.documento.estado !== "pendiente_firma") throw new ErrorFirma("documentoYaFirmado", 409);
      const firma = estado.firmas.get(String(registro.documento.id_profesional_firmante));
      if (!firma) throw new ErrorFirma("firmaInexistente", 409);

      if (registro.zonaPaciente && !registro.aceptacion) throw new ErrorFirma("otpRequerido", 409);
      const { estamparFirma } = await import("@/lib/documentos/estamparFirmaPdf");
      // fecha-ok: hora del "servidor" simulado.
      const firmadoAt = new Date();
      const codigo = registro.documento.codigo_verificacion;
      const bytes = await estamparFirma({
        borrador: await registro.borrador.arrayBuffer(),
        zona: registro.zona,
        grafiaPng: await firma.imagen.arrayBuffer(),
        qrPng: await qrPng(`${window.location.origin}/verificar/${codigo}`),
        firmante: registro.firmante,
        textoFecha: formatearInstanteConOffset(firmadoAt),
        firmadoAt,
        codigo,
        resumen: registro.metadatos?.resumen,
        titulo: registro.documento.titulo,
        zonaPaciente: registro.zonaPaciente,
        aceptacionPaciente: registro.aceptacion
          ? { ...registro.aceptacion, textoFecha: formatearInstanteConOffset(registro.aceptacion.verificado_at) }
          : undefined,
      });
      registro.final = new Blob([bytes], { type: "application/pdf" });
      Object.assign(registro.documento, {
        estado: "firmado",
        firmado_at: firmadoAt.toISOString(),
        pdf_sha256: await sha256(bytes),
      });
      return { message: true, documento: { ...registro.documento } };
    },

    async descargarDocumento({ id_documento }) {
      await esperar();
      const registro = estado.documentos.get(id_documento);
      if (!registro?.final) throw new ErrorFirma("noEncontrado", 404);
      return registro.final;
    },

    async enviarDocumentoCorreo({ id_documento, correo }) {
      await esperar();
      const registro = estado.documentos.get(id_documento);
      if (!registro?.final) throw new ErrorFirma("noEncontrado", 404);
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(correo))) throw new ErrorFirma("correoInvalido", 422);
      return { message: true, enviadoA: correo ? enmascararCorreo(correo) : "p•••e@correo.cl" };
    },

    async solicitarOtpPaciente({ id_documento, canal }) {
      await esperar();
      const registro = estado.documentos.get(id_documento);
      if (!registro) throw new ErrorFirma("noEncontrado", 404);
      const dato = canal === "sms" ? registro.contactoPaciente.telefono : registro.contactoPaciente.correo;
      if (!dato) throw new ErrorFirma("sinDatoContacto", 422);
      const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      // fecha-ok: instante de vencimiento del código simulado (10 minutos).
      const expira = new Date(Date.now() + 10 * 60_000);
      const destino = canal === "sms" ? enmascararTelefono(dato) : enmascararCorreo(dato);
      registro.otp = { codigo, canal, destino, expira, intentos: 0 };
      // Solo en modo de prueba se devuelve el código: no hay SMS ni correo reales.
      return { message: true, destino, expira_at: expira.toISOString(), codigo_prueba: codigo };
    },

    async verificarOtpPaciente({ id_documento, codigo }) {
      await esperar();
      const registro = estado.documentos.get(id_documento);
      const otp = registro?.otp;
      if (!otp) throw new ErrorFirma("otpExpirado", 409);
      // fecha-ok: comparación de instantes del código simulado.
      if (Date.now() > otp.expira.getTime()) throw new ErrorFirma("otpExpirado", 409);
      if (otp.intentos >= 5) throw new ErrorFirma("otpIntentosAgotados", 429);
      if (String(codigo).trim() !== otp.codigo) {
        otp.intentos += 1;
        throw new ErrorFirma(otp.intentos >= 5 ? "otpIntentosAgotados" : "otpInvalido", 422);
      }
      registro.aceptacion = {
        nombre: registro.contactoPaciente.nombre,
        documento: registro.contactoPaciente.documento,
        canal: otp.canal,
        destino: otp.destino,
        verificado_at: ahoraIso(),
      };
      registro.otp = null;
      return { message: true, aceptacion: { canal: registro.aceptacion.canal, destino: registro.aceptacion.destino, verificado_at: registro.aceptacion.verificado_at } };
    },

    async listarDocumentosPaciente({ id_paciente }) {
      await esperar();
      const documentos = [...estado.documentos.values()]
        .map((r) => r.documento)
        .filter((d) => String(d.id_paciente) === String(id_paciente))
        .sort((a, b) => (a.preparado_at < b.preparado_at ? 1 : -1));
      return { message: true, documentos };
    },

    async listarPendientesFirma() {
      await esperar();
      const documentos = [...estado.documentos.values()]
        .map((r) => r.documento)
        .filter((d) => d.estado === "pendiente_firma");
      return { message: true, documentos };
    },

    async anularDocumento({ id_documento }) {
      await esperar();
      const registro = estado.documentos.get(id_documento);
      if (!registro) throw new ErrorFirma("noEncontrado", 404);
      Object.assign(registro.documento, { estado: "anulado", anulado_at: ahoraIso() });
      return { message: true };
    },

    async listarConsentimientosPaciente() {
      await esperar();
      return { message: true, aceptaciones: estado.consentimientos };
    },

    async descargarConsentimiento() {
      await esperar();
      throw new ErrorFirma("noEncontrado", 404);
    },

    async enviarConsentimientoCorreo() {
      await esperar();
      return { message: true, enviadoA: "p•••e@correo.cl" };
    },
  };
}

/**
 * Solo modo de prueba: superpone en la lista de profesionales (que viene del
 * backend real) la firma y el registro registrados en el mock, para que las
 * tarjetas reflejen lo que se acaba de hacer.
 */
export function aplicarEstadoMock(profesionales) {
  if (!Array.isArray(profesionales)) return profesionales;
  return profesionales.map((p) => {
    const id = String(p.id_profesional);
    const firma = estado.firmas.get(id);
    const registro = estado.registros.get(id);
    return {
      ...p,
      ...(firma ? { firma_estado: "activa" } : {}),
      ...(registro ? { registro_sis_numero: registro.numero, registro_sis_estado: registro.estado } : {}),
    };
  });
}
