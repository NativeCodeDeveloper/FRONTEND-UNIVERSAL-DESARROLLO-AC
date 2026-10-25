/* Consentimiento informado de un procedimiento (Ley 20.584, art. 14).
 *
 * El texto lo arma renderizarConsentimiento() (declaración inicial +
 * información del procedimiento + observaciones + declaraciones, revocación,
 * datos personales y autorización); aquí solo se diagrama. El mismo texto se
 * guarda como snapshot en la evidencia, así lo que se firma y lo que se ve en el
 * PDF son idénticos.
 *
 * Formato: título y procedimiento arriba, ficha de identificación del paciente
 * y del profesional (con RUT, especialidad y registro), secciones numeradas,
 * texto justificado y las firmas al final, siempre en la misma página. */

import { crearDocumento } from "../motorDocumento";
import { MODOS_FIRMA } from "../zonaFirma";
import { bloquesDeTexto } from "@/lib/consentimientos/textosLegales";

/**
 * @param {object} p
 * @param {"fes"|"manuscrita"} p.modo
 * @param {boolean} p.borrador
 * @param {object} p.empresa
 * @param {string} p.texto                texto renderizado completo
 * @param {string} p.procedimiento        nombre del procedimiento
 * @param {{nombre, documento, representante?: {nombre, documento}}} p.paciente
 * @param {{nombre,rut,especialidad,registroSis}} p.profesional
 * @param {string} p.fechaEmisionTexto
 */
export function generarConsentimientoInformadoPdf({ modo, borrador, empresa, texto, procedimiento, paciente, profesional, fechaEmisionTexto }) {
  const motor = crearDocumento({ empresa, tipoDocumento: "Consentimiento informado", fechaEmision: fechaEmisionTexto, borrador });
  const representante = paciente.representante?.nombre ? paciente.representante : null;

  motor.titulo("Consentimiento informado", procedimiento);

  motor.cajaDatos([
    [
      { rotulo: "Paciente", valor: paciente.nombre, completo: true },
      { rotulo: "RUT / Documento", valor: paciente.documento },
      { rotulo: "Fecha", valor: fechaEmisionTexto },
      ...(representante
        ? [{ rotulo: "Representante legal", valor: [representante.nombre, representante.documento].filter(Boolean).join(" · "), completo: true }]
        : []),
    ],
    [
      { rotulo: "Profesional tratante", valor: profesional.nombre, completo: true },
      { rotulo: "RUT", valor: profesional.rut },
      { rotulo: "Registro SIS", valor: profesional.registroSis ? `N° ${profesional.registroSis}` : "" },
      { rotulo: "Profesión / Especialidad", valor: profesional.especialidad, completo: true },
    ],
  ]);

  let numero = 0;
  for (const bloque of bloquesDeTexto(texto)) {
    if (bloque.tipo === "titulo") motor.seccion(bloque.texto, { numero: ++numero });
    else if (bloque.tipo === "subtitulo") motor.subseccion(bloque.texto);
    else if (bloque.tipo === "lista") motor.lista(bloque.items, { tamano: 9.3, justificar: true });
    else motor.parrafo(bloque.texto, { tamano: 9.3, justificar: true });
  }

  const firmante = representante || paciente;
  if (modo === MODOS_FIRMA.FES) {
    // El paciente acepta con código (OTP): su zona la completa el servidor.
    motor.firmaPaciente({ modo });
    motor.zonaFirma({ modo, profesional });
  } else {
    motor.zonaFirma({
      modo,
      profesional,
      firmaPaciente: {
        nombre: firmante.nombre,
        documento: firmante.documento,
        rotulo: representante ? "Firma del representante legal" : "Firma del paciente",
      },
    });
  }
  return motor.finalizar();
}
