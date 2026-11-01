import assert from "node:assert/strict";
import { test } from "node:test";
import { celularParaBackend, errorCelular, formatearCelular, limpiarCelular } from "../src/lib/paginaPublica/celular.js";

test("se escribe desde el 9 y entran los 9 dígitos", () => {
  assert.equal(limpiarCelular("912345678"), "912345678");
  assert.equal(formatearCelular("912345678"), "9 1234 5678");
  assert.equal(errorCelular("9 1234 5678"), "");
  assert.equal(celularParaBackend("9 1234 5678"), "+56912345678");
});

test("no deja escribir más de 9 dígitos", () => {
  assert.equal(limpiarCelular("9123456789999"), "912345678");
  assert.equal(formatearCelular("9123456789"), "9 1234 5678");
});

test("formato progresivo mientras se escribe", () => {
  assert.equal(formatearCelular(""), "");
  assert.equal(formatearCelular("9"), "9");
  assert.equal(formatearCelular("91"), "9 1");
  assert.equal(formatearCelular("91234"), "9 1234");
  assert.equal(formatearCelular("912345"), "9 1234 5");
  assert.equal(formatearCelular("9 1234 5"), "9 1234 5");
});

test("acepta números pegados con el código de país", () => {
  assert.equal(limpiarCelular("+56 9 1234 5678"), "912345678");
  assert.equal(limpiarCelular("56912345678"), "912345678");
  assert.equal(limpiarCelular("+56912345678"), "912345678");
  assert.equal(celularParaBackend("+56 9 1234-5678"), "+56912345678");
});

test("errores", () => {
  assert.equal(errorCelular(""), "Ingresa tu celular");
  assert.equal(errorCelular("12345678"), "El celular empieza con 9");
  assert.match(errorCelular("9 1234 567"), /9 dígitos/);
  assert.match(errorCelular("9"), /9 dígitos/);
});
