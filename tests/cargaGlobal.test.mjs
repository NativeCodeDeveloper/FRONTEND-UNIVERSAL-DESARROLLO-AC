import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { iniciarCarga, obtenerCarga, suscribirCarga } from "../src/lib/cargaGlobal.js";
import { fetchConCarga } from "../src/lib/fetchConCarga.js";

beforeEach((contexto) => {
  globalThis.window = {};
  contexto.mock.timers.enable({ apis: ["setTimeout"] });
});

afterEach((contexto) => {
  contexto.mock.timers.tick(101);
  delete globalThis.window;
});

test("espera todas las cargas simultáneas y permite finalizar una sola vez", (contexto) => {
  const cambios = [];
  const desuscribir = suscribirCarga(() => cambios.push(obtenerCarga()));
  const terminarPrimera = iniciarCarga();
  const terminarSegunda = iniciarCarga();
  terminarPrimera();
  terminarPrimera();
  contexto.mock.timers.tick(601);
  assert.equal(obtenerCarga(), true);
  terminarSegunda();
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
  assert.deepEqual(cambios, [true, false]);
  desuscribir();
});

test("una nueva consulta cancela el cierre de la anterior", (contexto) => {
  iniciarCarga()();
  contexto.mock.timers.tick(50);
  const terminar = iniciarCarga();
  contexto.mock.timers.tick(601);
  assert.equal(obtenerCarga(), true);
  terminar();
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("mantiene la carga desde la solicitud hasta recibir el cuerpo completo", async (contexto) => {
  let entregarRespuesta;
  let cuerpo;
  const respuesta = new Response(new ReadableStream({ start(controlador) { cuerpo = controlador; } }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
  contexto.mock.method(globalThis, "fetch", () => new Promise((resolver) => { entregarRespuesta = resolver; }));
  const peticion = fetchConCarga("/prueba");
  await new Promise(setImmediate); // fetchConCarga pide el token antes de abrir la carga
  contexto.mock.timers.tick(601);
  assert.equal(obtenerCarga(), true);
  entregarRespuesta(respuesta);
  const recibida = await peticion;
  assert.equal(recibida instanceof Response, true);
  assert.equal(recibida.status, 201);
  assert.equal(recibida.headers.get("content-type"), "application/json");
  const datos = recibida.json();
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), true);
  cuerpo.enqueue(new TextEncoder().encode('{"listo":true}'));
  cuerpo.close();
  assert.deepEqual(await datos, { listo: true });
  assert.equal(recibida.bodyUsed, true);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("libera la carga ante un error de red y conserva el error original", async (contexto) => {
  const error = new TypeError("Sin conexión");
  contexto.mock.method(globalThis, "fetch", async () => { throw error; });
  await assert.rejects(fetchConCarga("/prueba"), (recibido) => recibido === error);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("libera la carga si el JSON es inválido", async (contexto) => {
  contexto.mock.method(globalThis, "fetch", async () => new Response("JSON inválido"));
  const respuesta = await fetchConCarga("/prueba");
  await assert.rejects(respuesta.json(), SyntaxError);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("propaga AbortSignal y libera la carga al cancelar", async (contexto) => {
  const controlador = new AbortController();
  contexto.mock.method(globalThis, "fetch", (_recurso, opciones) => new Promise((_resolver, rechazar) => {
    if (opciones.signal.aborted) return rechazar(opciones.signal.reason);
    opciones.signal.addEventListener("abort", () => rechazar(opciones.signal.reason), { once: true });
  }));
  const opciones = { signal: controlador.signal, method: "POST", body: "ejemplo" };
  const peticion = fetchConCarga("/prueba", opciones);
  controlador.abort();
  await assert.rejects(peticion, { name: "AbortError" });
  assert.equal(globalThis.fetch.mock.calls[0].arguments[1], opciones);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("no queda bloqueada al recibir HTTP 500 o una respuesta sin consumir", async (contexto) => {
  contexto.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
  const respuesta = await fetchConCarga("/prueba");
  assert.equal(respuesta.ok, false);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("conserva las respuestas binarias y su clonación", async (contexto) => {
  contexto.mock.method(globalThis, "fetch", async () => new Response(new Uint8Array([1, 2, 3])));
  const respuesta = await fetchConCarga("/archivo");
  const copia = respuesta.clone();
  const [archivo, binario] = await Promise.all([respuesta.blob(), copia.arrayBuffer()]);
  assert.deepEqual([...new Uint8Array(await archivo.arrayBuffer())], [1, 2, 3]);
  assert.deepEqual([...new Uint8Array(binario)], [1, 2, 3]);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("una carga que nunca se cierra sale sola a los 15 s", (contexto) => {
  iniciarCarga();
  contexto.mock.timers.tick(601);
  assert.equal(obtenerCarga(), true);
  contexto.mock.timers.tick(15000);
  contexto.mock.timers.tick(101);
  assert.equal(obtenerCarga(), false);
});

test("las peticiones nativas de segundo plano no activan el indicador", async (contexto) => {
  contexto.mock.method(globalThis, "fetch", async () => new Response("ok"));
  await globalThis.fetch("/notificaciones/pendientes");
  assert.equal(obtenerCarga(), false);
});

test("en el servidor no comparte estado de carga entre solicitudes", async (contexto) => {
  delete globalThis.window;
  const respuesta = new Response("ok");
  contexto.mock.method(globalThis, "fetch", async () => respuesta);
  assert.equal(await fetchConCarga("/prueba"), respuesta);
  assert.equal(obtenerCarga(), false);
});
