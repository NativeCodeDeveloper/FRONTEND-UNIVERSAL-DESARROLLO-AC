import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { rutValido, validarDocumento, formatearRut, TIPOS_DOCUMENTO, formatearDocumento, textoDocumento, esDocumentoExtranjero } from "../src/lib/rut.js";
import { formatRut } from "../src/lib/designTokens.js";
import { formatearInstanteConOffset } from "../src/lib/fechas.js";

test("rutValido verifica el dígito con módulo 11", () => {
  assert.equal(rutValido("12.345.678-5"), true);
  assert.equal(rutValido("12345678-0"), false);
  assert.equal(rutValido("5126663-3"), true);
  assert.equal(rutValido("19.169.587-9"), true);
  assert.equal(rutValido("1234567"), false);
  assert.equal(rutValido("RUTDESCONOCIDO"), false);
});

test("validarDocumento distingue RUT y pasaporte", () => {
  assert.equal(validarDocumento({ tipo: TIPOS_DOCUMENTO.RUT, valor: "123456785" }), "");
  assert.match(validarDocumento({ tipo: TIPOS_DOCUMENTO.RUT, valor: "123456780" }), /dígito verificador/);
  assert.equal(validarDocumento({ tipo: TIPOS_DOCUMENTO.PASAPORTE, valor: "AB123456" }), "");
  assert.match(validarDocumento({ tipo: TIPOS_DOCUMENTO.PASAPORTE, valor: "AB1" }), /entre 5 y 20/);
  assert.equal(formatearRut("123456785"), "12.345.678-5");
});

test("formatearInstanteConOffset usa el desfase de Chile de cada estación", () => {
  assert.equal(formatearInstanteConOffset("2026-01-15T02:59:59.000Z"), "14-01-2026 23:59:59 (UTC-03:00)");
  assert.equal(formatearInstanteConOffset("2026-07-15T03:59:59.000Z"), "14-07-2026 23:59:59 (UTC-04:00)");
  assert.equal(formatearInstanteConOffset("2027-01-01T02:30:00.000Z"), "31-12-2026 23:30:00 (UTC-03:00)");
  assert.equal(formatearInstanteConOffset("2028-03-01T02:00:00.000Z"), "29-02-2028 23:00:00 (UTC-03:00)");
  assert.equal(formatearInstanteConOffset(null), "-");
});

test("formatearInstanteConOffset no depende del huso del equipo", () => {
  const modulo = fileURLToPath(new URL("../src/lib/fechas.js", import.meta.url));
  const script = `import("${modulo}").then(m => process.stdout.write(m.formatearInstanteConOffset("2026-10-23T01:25:57.123Z")))`;
  for (const tz of ["America/Santiago", "UTC", "Asia/Tokyo", "Pacific/Niue"]) {
    const salida = execFileSync(process.execPath, ["--no-warnings", "-e", script], { env: { ...process.env, TZ: tz } }).toString();
    assert.equal(salida, "22-10-2026 22:25:57 (UTC-03:00)", `TZ=${tz}`);
  }
});

test("DNI: misma regla que el pasaporte, con su propio mensaje", () => {
  assert.equal(validarDocumento({ tipo: TIPOS_DOCUMENTO.DNI, valor: "30123456" }), "");
  assert.equal(validarDocumento({ tipo: TIPOS_DOCUMENTO.DNI, valor: "Y1234567Z" }), "");
  assert.equal(validarDocumento({ tipo: TIPOS_DOCUMENTO.DNI, valor: "" }), "Ingresa el número de DNI.");
  assert.match(validarDocumento({ tipo: TIPOS_DOCUMENTO.DNI, valor: "12" }), /^El DNI debe tener/);
  assert.ok(esDocumentoExtranjero("dni") && esDocumentoExtranjero("pasaporte") && !esDocumentoExtranjero("rut") && !esDocumentoExtranjero(undefined));
});

test("mostrar el documento: cada uno con su nombre y sin deformarse", () => {
  assert.equal(textoDocumento("191695879", "rut"), "RUT 19.169.587-9");
  assert.equal(textoDocumento("ab1234567", "pasaporte"), "Pasaporte AB1234567");
  assert.equal(textoDocumento("30.123.456", "dni"), "DNI 30123456", "un DNI de solo números no se formatea como RUT");
  assert.equal(formatearDocumento("AB1234567"), "AB1234567", "sin tipo (registro antiguo) un pasaporte no pierde las letras");
  assert.equal(formatearDocumento("12345678K"), "12.345.678-K");
  assert.equal(formatearDocumento(""), "");
  assert.equal(formatRut("AB1234567"), "AB1234567", "formatRut ya no borra las letras");
  assert.equal(formatRut("191695879"), "19.169.587-9");
  assert.equal(formatRut("12345678k"), "12.345.678-K");
});
