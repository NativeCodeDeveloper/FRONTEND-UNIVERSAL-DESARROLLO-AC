import assert from "node:assert/strict";
import { test } from "node:test";
import { avisoArchivoLogo, errorArchivoLogo, LOGO_PESO_MAXIMO } from "../src/lib/logoEmpresa.js";

const MB = 1024 * 1024;

test("acepta PNG, JPG y WebP dentro del peso y tamaño", () => {
  for (const tipo of ["image/png", "image/jpeg", "image/webp"]) {
    assert.equal(errorArchivoLogo({ tipo, peso: 300_000 }, { ancho: 800, alto: 800 }), "");
  }
});

test("rechaza otros formatos", () => {
  assert.match(errorArchivoLogo({ tipo: "image/svg+xml", peso: 1000 }), /PNG, JPG o WebP/);
  assert.match(errorArchivoLogo({ tipo: "image/gif", peso: 1000 }), /PNG, JPG o WebP/);
  assert.match(errorArchivoLogo({ tipo: "application/pdf", peso: 1000 }), /PNG, JPG o WebP/);
  assert.match(errorArchivoLogo({ tipo: "", peso: 1000 }), /PNG, JPG o WebP/);
});

test("peso: vacío y sobre 5 MB", () => {
  assert.match(errorArchivoLogo({ tipo: "image/png", peso: 0 }), /vacío/);
  assert.equal(errorArchivoLogo({ tipo: "image/png", peso: LOGO_PESO_MAXIMO }), "");
  assert.match(errorArchivoLogo({ tipo: "image/png", peso: LOGO_PESO_MAXIMO + 1 }), /5 MB/);
  assert.match(errorArchivoLogo({ tipo: "image/png", peso: 12 * MB }), /5 MB/);
});

test("tamaño mínimo 200 × 200 (por el lado más corto)", () => {
  assert.equal(errorArchivoLogo({ tipo: "image/png", peso: 1000 }, { ancho: 200, alto: 200 }), "");
  assert.match(errorArchivoLogo({ tipo: "image/png", peso: 1000 }, { ancho: 199, alto: 900 }), /al menos 200 × 200/);
  assert.match(errorArchivoLogo({ tipo: "image/png", peso: 1000 }, { ancho: 0, alto: 0 }), /muy pequeño/);
  assert.match(errorArchivoLogo({ tipo: "image/png", peso: 1000 }, { ancho: NaN, alto: NaN }), /muy pequeño/);
});

test("avisos suaves: baja resolución y logo alargado", () => {
  assert.equal(avisoArchivoLogo({ ancho: 1024, alto: 1024 }), "");
  assert.match(avisoArchivoLogo({ ancho: 300, alto: 300 }), /512/);
  assert.match(avisoArchivoLogo({ ancho: 2000, alto: 600 }), /alargado/);
  assert.equal(avisoArchivoLogo(null), "");
});

import { idLogoValido, mensajeErrorLogo } from "../src/lib/logoEmpresa.js";

test("idLogoValido: solo ids de Cloudflare arman URL (nunca http, javascript: ni rutas)", () => {
  assert.equal(idLogoValido("a4cc5051-963b-4d3d-89b8-cd0416c6cf00"), "a4cc5051-963b-4d3d-89b8-cd0416c6cf00");
  for (const malo of ["https://malo.com/x.png", "http://x", "javascript:alert(1)", "//malo.com/x", "../x", "a b", "", null, undefined, 42, {}, "x".repeat(101)]) {
    assert.equal(idLogoValido(malo), "", String(malo));
  }
});

test("mensajeErrorLogo explica cada rechazo del backend", () => {
  assert.match(mensajeErrorLogo("SIN-PERMISO"), /perfil no puede/);
  assert.match(mensajeErrorLogo("USUARIO-SIN-AUTENTICACION"), /sesión/);
  assert.match(mensajeErrorLogo("imagen-muy-pesada"), /pesada/);
  assert.match(mensajeErrorLogo("tipo-no-permitido"), /no es una imagen/);
  assert.match(mensajeErrorLogo("otra-cosa"), /No se pudo guardar/);
});
