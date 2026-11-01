import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agruparCategorias,
  claveCategoria,
  filtrarPorCategoria,
  normalizarCategoria,
  sugerenciasCategoria,
  CATEGORIA_MAX_LARGO,
} from "../src/lib/categoriasAtencion.js";

const pro = (id, categoriaProfesional) => ({ id_profesional: id, categoriaProfesional });

test("normalizarCategoria limpia espacios, saltos y largo", () => {
  assert.equal(normalizarCategoria("  Odontología \n infantil "), "Odontología infantil");
  assert.equal(normalizarCategoria(null), "");
  assert.equal(normalizarCategoria(undefined), "");
  assert.equal(normalizarCategoria("x".repeat(90)).length, CATEGORIA_MAX_LARGO);
});

test("claveCategoria ignora tildes, mayúsculas y signos", () => {
  assert.equal(claveCategoria("Odontología"), "odontologia");
  assert.equal(claveCategoria(" odontologia "), "odontologia");
  assert.equal(claveCategoria("Laboratorio y Toma de Muestras"), "laboratorio-y-toma-de-muestras");
  assert.equal(claveCategoria("Ñuble / Kine"), "nuble-kine");
  assert.equal(claveCategoria("   "), "");
});

test("agruparCategorias junta escrituras y usa la más frecuente", () => {
  const lista = [
    pro(1, "Odontología"),
    pro(2, "odontologia"),
    pro(3, "Odontología"),
    pro(4, "Psicología"),
    pro(5, ""),
    pro(6, null),
    { id_profesional: 7 },
  ];
  assert.deepEqual(agruparCategorias(lista), [
    { clave: "odontologia", nombre: "Odontología", cantidad: 3 },
    { clave: "psicologia", nombre: "Psicología", cantidad: 1 },
  ]);
});

test("agruparCategorias sin datos devuelve lista vacía (backend aún sin el campo)", () => {
  assert.deepEqual(agruparCategorias([{ id_profesional: 1 }, { id_profesional: 2 }]), []);
  assert.deepEqual(agruparCategorias(undefined), []);
});

test("agruparCategorias ordena alfabéticamente en español", () => {
  const nombres = agruparCategorias([pro(1, "Psicología"), pro(2, "Kinesiología"), pro(3, "Ápice")]).map((c) => c.nombre);
  assert.deepEqual(nombres, ["Ápice", "Kinesiología", "Psicología"]);
});

test("filtrarPorCategoria", () => {
  const lista = [pro(1, "Odontología"), pro(2, "ODONTOLOGIA"), pro(3, "Psicología"), pro(4, "")];
  assert.deepEqual(filtrarPorCategoria(lista, "odontologia").map((p) => p.id_profesional), [1, 2]);
  assert.equal(filtrarPorCategoria(lista, null).length, 4);
  assert.deepEqual(filtrarPorCategoria(lista, "no-existe"), []);
  assert.deepEqual(filtrarPorCategoria(undefined, "x"), []);
});

test("sugerenciasCategoria pone primero las del centro y no repite", () => {
  const s = sugerenciasCategoria([pro(1, "Implantología"), pro(2, "odontologia")]);
  assert.deepEqual(s.slice(0, 2), ["Implantología", "odontologia"]);
  assert.equal(s.filter((x) => claveCategoria(x) === "odontologia").length, 1);
  assert.ok(s.includes("Psicología"));
});

import { CATEGORIAS_SUGERIDAS, errorCategoria } from "../src/lib/categoriasAtencion.js";

test("sugerencias chilenas: amplias, sin duplicados y todas válidas para el backend", () => {
  assert.ok(CATEGORIAS_SUGERIDAS.length >= 60);
  assert.equal(new Set(CATEGORIAS_SUGERIDAS.map(claveCategoria)).size, CATEGORIAS_SUGERIDAS.length);
  for (const c of CATEGORIAS_SUGERIDAS) assert.equal(errorCategoria(c), "", c);
  for (const c of ["Matrona", "Broncopulmonar", "Técnico en enfermería (TENS)", "Odontopediatría", "Kinesiología"]) {
    assert.ok(CATEGORIAS_SUGERIDAS.includes(c), c);
  }
});

test("errorCategoria: misma regla que el backend", () => {
  assert.equal(errorCategoria(""), "");
  assert.equal(errorCategoria("  Ñuñoa & Kine / Piso pélvico (adultos)  "), "");
  assert.match(errorCategoria("<script>alert(1)</script>"), /Usa solo/);
  assert.match(errorCategoria("Odonto; DROP TABLE"), /Usa solo/);
  assert.match(errorCategoria("a".repeat(61)), /Máximo 60/);
});

test("sugerenciasCategoria: comunes en orden alfabético", () => {
  const s = sugerenciasCategoria([]);
  const ordenadas = [...s].sort((a, b) => a.localeCompare(b, "es"));
  assert.deepEqual(s, ordenadas);
});
