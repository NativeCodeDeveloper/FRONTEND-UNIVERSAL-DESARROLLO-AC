import assert from "node:assert/strict";
import { test } from "node:test";
import { enlaceSala, mensajeInvitacion } from "../src/lib/telemedicina.js";
import { telefonoParaWhatsapp, urlWhatsapp } from "../src/lib/whatsapp.js";

const SALA = "telemedicina-11111111-2222-3333-4444-555555555555";

test("enlace de la sala: mismo formato que la página pública del paciente", () => {
  const enlace = enlaceSala("https://clinica.cl", SALA, "abc.def_-");
  assert.equal(enlace, `https://clinica.cl/telemedicina/${SALA}?i=abc.def_-`);
});

test("mensaje: primer nombre, quién invita y el enlace; sin datos clínicos", () => {
  const texto = mensajeInvitacion({ nombrePaciente: "Juana María", nombreProfesional: "Dra. Pérez", nombreClinica: "Clínica Sur", enlace: "https://x/y" });
  assert.match(texto, /^Hola Juana, soy Dra\. Pérez de Clínica Sur\./);
  assert.match(texto, /https:\/\/x\/y/);
  assert.doesNotMatch(texto, /María/);
  assert.equal(mensajeInvitacion({ enlace: "https://x" }).split("\n")[0], "Hola.");
});

test("WhatsApp: número de la ficha a formato wa.me y texto codificado", () => {
  assert.equal(telefonoParaWhatsapp("9 8748 5226"), "56987485226");
  assert.equal(telefonoParaWhatsapp("+56 9 8748 5226"), "56987485226");
  assert.equal(telefonoParaWhatsapp("87485226"), "56987485226");
  assert.equal(telefonoParaWhatsapp("+54 9 11 2345 6789"), "5491123456789");
  assert.equal(telefonoParaWhatsapp(""), "");
  assert.equal(urlWhatsapp("", "hola"), "");
  assert.equal(urlWhatsapp("912345678", "a b&c"), "https://wa.me/56912345678?text=a%20b%26c");
});
