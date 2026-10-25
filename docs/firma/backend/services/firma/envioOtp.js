/* Envío del código OTP al paciente (consentimiento informado).
 *  - SMS por Twilio: requiere TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y
 *    TWILIO_SMS_FROM (un número de Twilio habilitado para SMS; el de WhatsApp no sirve).
 *  - Correo por Brevo (correoFirma.js).
 * El mensaje solo lleva el código, la clínica y el vencimiento: nunca el
 * procedimiento ni datos de salud (Ley 21.719). */

import twilio from "twilio";
import { enviarCorreo, htmlCodigoOtp } from "./correoFirma.js";

let cliente = null;
function clienteTwilio() {
    if (!cliente && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        cliente = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, { timeout: 10000 });
    }
    return cliente;
}

/** "9 1234 5678" / "+56912345678" / "56912345678" → "+56912345678". */
export function telefonoE164(telefono) {
    const digitos = String(telefono || "").replace(/\D/g, "");
    if (digitos.length === 9 && digitos.startsWith("9")) return `+56${digitos}`;
    if (digitos.length === 11 && digitos.startsWith("56")) return `+${digitos}`;
    return digitos.length >= 8 ? `+${digitos}` : null;
}

export async function enviarCodigoOtp({ canal, destino, codigo, empresa }) {
    const clinica = empresa?.empresaNombre || "tu centro de salud";
    if (canal === "sms") {
        const twilioCliente = clienteTwilio();
        const para = telefonoE164(destino);
        if (!twilioCliente || !process.env.TWILIO_SMS_FROM || !para) {
            console.error("[FIRMA] SMS no configurado (TWILIO_SMS_FROM) o teléfono inválido");
            return false;
        }
        await twilioCliente.messages.create({
            from: process.env.TWILIO_SMS_FROM,
            to: para,
            body: `${clinica}: tu código para aceptar el consentimiento es ${codigo}. Vence en 10 minutos. No lo compartas.`,
        });
        return true;
    }
    return enviarCorreo({
        empresa, para: destino,
        asunto: `Tu código de verificación - ${clinica}`,
        html: htmlCodigoOtp({ empresa, codigo }),
    });
}
