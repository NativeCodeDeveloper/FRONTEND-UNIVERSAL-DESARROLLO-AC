import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { rutValido, validarDocumento, formatearRut, TIPOS_DOCUMENTO } from "../src/lib/rut.js";
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
