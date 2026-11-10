import assert from "node:assert/strict";
import { test } from "node:test";

// La pantalla de carga es para lo que el usuario espera; los sondeos de fondo (campana
// cada 30 s, citas cada 5 min, datos de apoyo) no deben encenderla aunque tarden.
process.env.NEXT_PUBLIC_API_URL = "https://back.prueba.cl";
globalThis.window = {};
const { fetchSegundoPlano, fetchConCarga, definirProveedorToken } = await import("../src/lib/fetchConCarga.js");
const { obtenerCarga } = await import("../src/lib/cargaGlobal.js");

test("fondo: lleva la sesión y no muestra la carga aunque tarde; la normal sí la muestra", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  definirProveedorToken(async () => "token-de-prueba");
  const recibidas = [];
  let responder;
  t.mock.method(globalThis, "fetch", (url, opciones) => {
    recibidas.push(new Headers(opciones?.headers).get("authorization"));
    return new Promise((r) => { responder = r; });
  });

  const fondo = fetchSegundoPlano("https://back.prueba.cl/notificaciones/pendientes");
  await new Promise(setImmediate);
  t.mock.timers.tick(2000);
  assert.equal(obtenerCarga(), false, "un sondeo lento no tapa la pantalla");
  responder(new Response("[]"));
  await fondo;
  assert.equal(recibidas[0], "Bearer token-de-prueba");

  const normal = fetchConCarga("https://back.prueba.cl/documentos/firmarDocumento");
  await new Promise(setImmediate);
  t.mock.timers.tick(700);
  assert.equal(obtenerCarga(), true, "lo que el usuario pidió sí muestra la carga");
  responder(new Response("{}"));
  await normal;
  t.mock.timers.tick(200);
  assert.equal(obtenerCarga(), false);
});
