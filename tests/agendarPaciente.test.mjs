import assert from "node:assert/strict";
import { test } from "node:test";
import { rutaAgendarPaciente, tomarPacienteParaAgendar, VIGENCIA_MS } from "../src/lib/agendarPaciente.js";

function almacenFalso() {
  const datos = new Map();
  return { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k), datos };
}
const paciente = { nombre: "Lucía", apellido: "Fernández", rut: "AB1234567", tipo_documento: "pasaporte", telefono: "+56911112222", correo: "lucia@ejemplo.cl" };

test("la URL no lleva ningún dato del paciente", () => {
  const almacen = almacenFalso();
  const ruta = rutaAgendarPaciente(paciente, { almacen });
  assert.match(ruta, /^\/dashboard\/calendario\?agendar=[\w-]+$/);
  for (const dato of ["Lucía", "Fern", "AB1234567", "56911112222", "lucia", "ejemplo", "pasaporte"]) {
    assert.ok(!decodeURIComponent(ruta).includes(dato), `la URL no incluye ${dato}`);
  }
});

test("el calendario recibe los datos una sola vez (con el tipo de documento)", () => {
  const almacen = almacenFalso();
  const id = new URL(rutaAgendarPaciente(paciente, { almacen }), "http://x").searchParams.get("agendar");
  assert.deepEqual(tomarPacienteParaAgendar(id, { almacen }), {
    nombre: "Lucía", apellido: "Fernández", rut: "AB1234567", tipo_documento: "pasaporte", telefono: "+56911112222", email: "lucia@ejemplo.cl",
  });
  assert.equal(tomarPacienteParaAgendar(id, { almacen }), null, "se borran al leerlos");
  assert.equal(almacen.datos.size, 0);
});

test("otro identificador, vencido o sin almacenamiento: no hay datos", () => {
  const almacen = almacenFalso();
  const ahora = 1_000_000;
  const id = new URL(rutaAgendarPaciente(paciente, { almacen, ahora }), "http://x").searchParams.get("agendar");
  assert.equal(tomarPacienteParaAgendar("otro", { almacen, ahora }), null);
  assert.equal(tomarPacienteParaAgendar(id, { almacen, ahora: ahora + VIGENCIA_MS + 1 }), null, "vencido");
  assert.equal(almacen.datos.size, 0, "y el vencido igual se borra");
  assert.equal(rutaAgendarPaciente(paciente, { almacen: null }), "/dashboard/calendario", "sin sessionStorage abre el calendario vacío");
  assert.equal(tomarPacienteParaAgendar("x", { almacen: null }), null);
});

test("un almacenamiento que falla no rompe la navegación", () => {
  const roto = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("lleno"); }, removeItem: () => {} };
  assert.equal(rutaAgendarPaciente(paciente, { almacen: roto }), "/dashboard/calendario");
  assert.equal(tomarPacienteParaAgendar("x", { almacen: roto }), null);
});

test("un paciente antiguo sin tipo llega como RUT", () => {
  const almacen = almacenFalso();
  const id = new URL(rutaAgendarPaciente({ ...paciente, tipo_documento: undefined, rut: "191695879" }, { almacen }), "http://x").searchParams.get("agendar");
  assert.equal(tomarPacienteParaAgendar(id, { almacen }).tipo_documento, "rut");
});
