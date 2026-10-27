import test from "node:test";
import assert from "node:assert/strict";
import {
  ANEXOS_PROCEDIMIENTO,
  GRUPOS_PROCEDIMIENTO,
  PLANTILLA_BASE,
  renderizarConsentimiento,
} from "../src/lib/consentimientos/plantillasProcedimiento.js";
import {
  camposDesdeCuerpo,
  construirCuerpoAnexo,
  validarProcedimiento,
} from "../src/lib/consentimientos/procedimientos.js";

const gruposNuevos = [
  "Kinesiología",
  "Psicología",
  "Terapia ocupacional",
  "Estética facial",
  "Depilación",
];

test("el catálogo ofrece anexos específicos y códigos únicos", () => {
  assert.equal(new Set(ANEXOS_PROCEDIMIENTO.map((anexo) => anexo.codigo)).size, ANEXOS_PROCEDIMIENTO.length);
  for (const grupo of gruposNuevos) {
    assert.ok(GRUPOS_PROCEDIMIENTO.includes(grupo));
    assert.ok(ANEXOS_PROCEDIMIENTO.some((anexo) => anexo.grupo === grupo));
  }
  assert.ok(ANEXOS_PROCEDIMIENTO.filter((anexo) => anexo.grupo === "Odontología").length >= 8);
});

test("todos los anexos se pueden editar y publicar con el formulario existente", () => {
  for (const anexo of ANEXOS_PROCEDIMIENTO) {
    const campos = camposDesdeCuerpo(anexo.cuerpo);
    assert.deepEqual(
      validarProcedimiento({ nombre: anexo.nombre, grupo: anexo.grupo, campos }),
      {},
      anexo.codigo
    );
    assert.equal(construirCuerpoAnexo(campos), anexo.cuerpo, anexo.codigo);
  }
});

test("cada especialidad se incorpora completa al documento que se firma", () => {
  for (const grupo of gruposNuevos) {
    const anexo = ANEXOS_PROCEDIMIENTO.find((item) => item.grupo === grupo);
    const documento = renderizarConsentimiento({
      anexo,
      empresa: { empresaNombre: "Centro de prueba", contactoEmail: "contacto@ejemplo.cl" },
      profesional: { nombre: "Profesional de prueba", especialidad: grupo },
      paciente: { nombre: "Paciente de prueba", documento: "RUT de prueba" },
      observaciones: "Zona, objetivo y riesgos individuales revisados.",
    });
    assert.ok(documento.includes(anexo.nombre), grupo);
    assert.ok(documento.includes(anexo.cuerpo.replace(/^## /gm, "### ")), grupo);
    assert.ok(documento.includes("## Observaciones del caso"), grupo);
    assert.ok(documento.indexOf("## Información del procedimiento") < documento.indexOf("## Declaraciones del paciente"), grupo);
    assert.doesNotMatch(documento, /\{\{[^}]+\}\}/, grupo);
  }
  assert.equal(PLANTILLA_BASE.version, 2);
  assert.doesNotMatch(PLANTILLA_BASE.cuerpo, /## Anestesia local/);
});
