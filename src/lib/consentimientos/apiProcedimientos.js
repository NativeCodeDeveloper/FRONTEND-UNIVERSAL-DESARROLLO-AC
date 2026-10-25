/* Procedimientos del consentimiento informado (anexos). Contrato:
 * docs/firma/02-contrato-endpoints.md §7.8. Rutas del dashboard con sesión de Clerk.
 *
 * Mientras el backend de firma no esté activo (modo de prueba), responde con un
 * almacén en memoria sembrado con los 14 anexos de ejemplo: la pantalla se puede
 * usar y probar completa, pero lo creado se pierde al recargar. */

import { fetchConCarga } from "@/lib/fetchConCarga";
import { MODO_MOCK, ErrorFirma } from "@/lib/firma/apiFirma";
import { CONSENTIMIENTOS_EN_SERVIDOR } from "./apiConsentimientos";
import { ANEXOS_PROCEDIMIENTO } from "./plantillasProcedimiento";
import { construirCuerpoAnexo, codigoDesdeNombre, tituloPlantilla, validarProcedimiento } from "./procedimientos";

/** true si los procedimientos vienen del backend (se activa con el de consentimientos). */
export const PROCEDIMIENTOS_EN_SERVIDOR = CONSENTIMIENTOS_EN_SERVIDOR;
/** Se puede crear y editar: con el backend, o en el modo de prueba de desarrollo. En
 *  producción sin backend la pantalla queda de solo lectura (lo creado se perdería). */
export const EDICION_DISPONIBLE = PROCEDIMIENTOS_EN_SERVIDOR || MODO_MOCK;

/** Anexos de ejemplo con la forma de la API (respaldo si el backend no responde). */
export const PROCEDIMIENTOS_RESPALDO = ANEXOS_PROCEDIMIENTO.map((a) => ({
  id_plantilla: `respaldo-${a.codigo}`, codigo: a.codigo, grupo: a.grupo, nombre: a.nombre, version: a.version,
  cuerpo: a.cuerpo, estado: "vigente", vigente_desde: null, retirada_at: null, creado_por: null, origen: "ejemplo",
}));

async function sha256(texto) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Modo de prueba ─────────────────────────────────────────────────────────
// fecha-ok: instantes del "servidor" simulado; en producción los fija el backend.
const ahoraIso = () => new Date().toISOString();
const almacen = { versiones: null };

async function sembrar() {
  if (almacen.versiones) return;
  almacen.versiones = await Promise.all(
    ANEXOS_PROCEDIMIENTO.map(async (a) => ({
      id_plantilla: `mock-${a.codigo}-v${a.version}`,
      codigo: a.codigo, grupo: a.grupo, nombre: a.nombre, version: a.version, cuerpo: a.cuerpo,
      sha256: await sha256(a.cuerpo), estado: "vigente", vigente_desde: "2026-10-23T03:00:00.000Z",
      retirada_at: null, creado_por: null, origen: "ejemplo",
    }))
  );
}

const vigentes = () => almacen.versiones.filter((v) => v.estado === "vigente");

function crearMock() {
  const esperar = () => new Promise((r) => setTimeout(r, 250));
  async function publicar({ codigo, nombre, grupo, campos, versionAnterior }) {
    const errores = validarProcedimiento({ nombre, grupo, campos });
    if (Object.keys(errores).length) throw new ErrorFirma("datoinvalido", 422);
    const cuerpo = construirCuerpoAnexo(campos);
    const ahora = ahoraIso();
    if (versionAnterior) Object.assign(versionAnterior, { estado: "retirada", retirada_at: ahora });
    const version = (versionAnterior?.version || 0) + 1;
    const nueva = {
      id_plantilla: `mock-${codigo}-v${version}`, codigo, grupo: grupo.trim(), nombre: nombre.trim(), version, cuerpo,
      sha256: await sha256(cuerpo), estado: "vigente", vigente_desde: ahora, retirada_at: null,
      creado_por: "Usuario actual (prueba)", origen: "clinica",
    };
    almacen.versiones.push(nueva);
    return { message: true, procedimiento: nueva };
  }
  return {
    async listar() {
      await sembrar();
      await esperar();
      return { message: true, procedimientos: vigentes() };
    },
    async historial({ codigo }) {
      await sembrar();
      await esperar();
      return { message: true, versiones: almacen.versiones.filter((v) => v.codigo === codigo).sort((a, b) => b.version - a.version) };
    },
    async crear({ nombre, grupo, campos }) {
      await sembrar();
      await esperar();
      const n = (t) => String(t ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (vigentes().some((v) => n(v.nombre) === n(nombre) && n(v.grupo) === n(grupo))) throw new ErrorFirma("procedimientoDuplicado", 409);
      let codigo = codigoDesdeNombre(nombre);
      if (almacen.versiones.some((v) => v.codigo === codigo)) codigo = `${codigo}_${almacen.versiones.length}`;
      return publicar({ codigo, nombre, grupo, campos });
    },
    async nuevaVersion({ codigo, nombre, grupo, campos }) {
      await sembrar();
      await esperar();
      const actual = vigentes().find((v) => v.codigo === codigo);
      if (!actual) throw new ErrorFirma("noEncontrado", 404);
      if (construirCuerpoAnexo(campos) === actual.cuerpo && tituloPlantilla(grupo, nombre) === tituloPlantilla(actual.grupo, actual.nombre)) {
        throw new ErrorFirma("sinCambios", 409);
      }
      return publicar({ codigo, nombre, grupo, campos, versionAnterior: actual });
    },
    async retirar({ codigo }) {
      await sembrar();
      await esperar();
      const actual = vigentes().find((v) => v.codigo === codigo);
      if (!actual) throw new ErrorFirma("noEncontrado", 404);
      Object.assign(actual, { estado: "retirada", retirada_at: ahoraIso() });
      return { message: true };
    },
  };
}

// ── Backend real ───────────────────────────────────────────────────────────
export function crearApiProcedimientos(getToken) {
  if (!PROCEDIMIENTOS_EN_SERVIDOR) return crearMock();
  const base = process.env.NEXT_PUBLIC_API_URL;
  async function llamar(ruta, cuerpo = {}) {
    const token = await getToken();
    if (!token) throw new ErrorFirma("noAutorizado", 401);
    const res = await fetchConCarga(`${base}/procedimientos/${ruta}`, {
      method: "POST",
      mode: "cors",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const datos = await res.json().catch(() => null);
    if (!res.ok || datos?.message !== true) throw new ErrorFirma(typeof datos?.message === "string" ? datos.message : "serverError", res.status);
    return datos;
  }
  return {
    listar: () => llamar("listar"),
    historial: (c) => llamar("historial", c),
    crear: (c) => llamar("crear", c),
    nuevaVersion: (c) => llamar("nuevaVersion", c),
    retirar: (c) => llamar("retirar", c),
  };
}
