import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessDashboardPath as puede,
  normalizeDashboardRole,
  getDashboardRoleFromUser,
  agendaRestringidaDe,
  canSeeReservationAmounts,
  esAdministradorClinica,
  getDashboardRoleLabel,
  getVisibleDashboardSections,
} from "../src/lib/dashboard-access.js";

test("sin rol o rol desconocido no tiene acceso (antes era administrador total)", () => {
  for (const rol of ["", null, undefined, "cualquier-cosa"]) {
    assert.equal(normalizeDashboardRole(rol), "sin-acceso");
    assert.equal(puede(rol, "/dashboard"), false);
    assert.equal(puede(rol, "/dashboard/createUser"), false);
    assert.deepEqual(getVisibleDashboardSections(rol), []);
  }
});

test("los valores antiguos de Clerk se traducen sin perder acceso", () => {
  const casos = {
    "super-usuario-nativecode": "tecnico-nativecode",
    admin: "tecnico-nativecode",
    "administrador-clinico": "admin-clinica",
    "operador-clinico": "profesional-salud",
    "operador-medico": "profesional-medico",
    "operador-odontologico": "profesional-odontologo",
    secretaria: "recepcion",
    recepcionista: "recepcion",
    cancelado: "suspendido",
    "centro-estetico": "profesional-estetica",
  };
  for (const [antiguo, nuevo] of Object.entries(casos)) assert.equal(normalizeDashboardRole(antiguo), nuevo, antiguo);
});

test("el técnico NativeCode ve todo, incluida la pasarela", () => {
  for (const ruta of ["/dashboard", "/dashboard/createUser", "/dashboard/pasarelaPago", "/dashboard/FichasPacientes/5", "/dashboard/periodontogramaPaciente"]) {
    assert.equal(puede("tecnico-nativecode", ruta), true, ruta);
  }
});

test("administradores: administran la clínica, sin fichas, usuarios ni pasarela", () => {
  for (const rol of ["admin-centro-salud", "admin-clinica-medica", "admin-clinica-odontologica", "admin-centro-oftalmologico", "admin-centro-estetico", "admin-clinica"]) {
    for (const ruta of ["/dashboard", "/dashboard/calendario", "/dashboard/finanzas", "/dashboard/profesionales", "/dashboard/paciente/9", "/dashboard/datosEmpresa"]) {
      assert.equal(puede(rol, ruta), true, `${rol} ${ruta}`);
    }
    for (const ruta of ["/dashboard/FichaClinica", "/dashboard/FichasPacientes/9", "/dashboard/createUser", "/dashboard/pasarelaPago", "/dashboard/recetaRapida", "/dashboard/odontogramasPaciente/9"]) {
      assert.equal(puede(rol, ruta), false, `${rol} ${ruta}`);
    }
    assert.equal(canSeeReservationAmounts(rol), true);
  }
  assert.equal(puede("admin-clinica-odontologica", "/dashboard/presupuestoTratamiento"), true);
  assert.equal(puede("admin-centro-salud", "/dashboard/presupuestoTratamiento"), false);
  assert.equal(puede("admin-clinica-medica", "/dashboard/examenesClinicos"), true);
  assert.equal(puede("admin-clinica-odontologica", "/dashboard/examenesClinicos"), false);
  assert.equal(puede("admin-centro-estetico", "/dashboard/gestionStock"), true);
});

test("profesionales por especialidad", () => {
  const base = ["/dashboard", "/dashboard/calendario", "/dashboard/FichaClinica", "/dashboard/FichasPacientes/3", "/dashboard/documentosPorFirmar", "/dashboard/profesionales"];
  for (const rol of ["profesional-salud", "profesional-medico", "profesional-odontologo", "profesional-matrona", "profesional-oftalmologia", "profesional-estetica"]) {
    for (const ruta of base) assert.equal(puede(rol, ruta), true, `${rol} ${ruta}`);
    for (const ruta of ["/dashboard/finanzas", "/dashboard/createUser", "/dashboard/datosEmpresa", "/dashboard/serviciosAgendamiento", "/dashboard/periodontogramaPaciente"]) {
      assert.equal(puede(rol, ruta), false, `${rol} ${ruta}`);
    }
  }
  assert.equal(puede("profesional-salud", "/dashboard/recetaRapida"), false);
  assert.equal(puede("profesional-salud", "/dashboard/examenDocumento"), false);
  assert.equal(puede("profesional-medico", "/dashboard/recetaRapida"), true);
  assert.equal(puede("profesional-medico", "/dashboard/odontogramasPaciente/1"), false);
  assert.equal(puede("profesional-odontologo", "/dashboard/odontogramasPaciente/1"), true);
  assert.equal(puede("profesional-odontologo", "/dashboard/presupuestoTratamiento"), true);
  assert.equal(puede("profesional-oftalmologia", "/dashboard/recetaLentes"), true);
  assert.equal(puede("profesional-oftalmologia", "/dashboard/recetaRapida"), false);
  assert.equal(puede("profesional-estetica", "/dashboard/presupuestoTratamiento"), true);
  assert.equal(puede("profesional-estetica", "/dashboard/recetaRapida"), false);
  assert.equal(canSeeReservationAmounts("profesional-medico"), false);
  assert.equal(canSeeReservationAmounts("profesional-odontologo"), true);
});

test("recepción: agenda y pacientes, sin fichas ni configuración", () => {
  assert.equal(puede("recepcion", "/dashboard/calendario"), true);
  assert.equal(puede("recepcion", "/dashboard/paciente/1"), true);
  assert.equal(puede("recepcion", "/dashboard/detalleCotizacion/4"), true);
  assert.equal(puede("recepcion", "/dashboard/FichaClinica"), false);
  assert.equal(puede("recepcion", "/dashboard/profesionales"), false);
  assert.equal(puede("suspendido", "/dashboard/calendario"), false);
  assert.equal(puede("suspendido", "/dashboard/suscripcion-cancelada"), true);
});

test("profesional que también administra la clínica", () => {
  const dueno = { publicMetadata: { role: "profesional-odontologo", administraClinica: true, idProfesionalAgenda: "46" } };
  const rol = getDashboardRoleFromUser(dueno);
  assert.equal(rol, "profesional-odontologo+admin");
  assert.equal(puede(rol, "/dashboard/odontogramasPaciente/1"), true);
  assert.equal(puede(rol, "/dashboard/finanzas"), true);
  assert.equal(puede(rol, "/dashboard/ingresoProductos"), true);
  assert.equal(puede(rol, "/dashboard/createUser"), false);
  assert.equal(esAdministradorClinica(rol), true);
  assert.equal(agendaRestringidaDe(dueno), "", "como administrador ve todas las agendas");
  assert.match(getDashboardRoleLabel(rol), /administra la clínica/);
  // Un administrador con el interruptor no cambia (el interruptor es solo para profesionales).
  assert.equal(getDashboardRoleFromUser({ publicMetadata: { role: "recepcion", administraClinica: true } }), "recepcion");
});

test("solo el profesional sin el interruptor queda restringido a su agenda", () => {
  assert.equal(agendaRestringidaDe({ publicMetadata: { role: "operador-medico", idProfesionalAgenda: "12" } }), "12");
  assert.equal(agendaRestringidaDe({ publicMetadata: { role: "secretaria", idProfesionalAgenda: "12" } }), "");
  assert.equal(agendaRestringidaDe({ publicMetadata: { role: "administrador-clinico", idProfesionalAgenda: "12" } }), "");
});

test("menú: el tutorial se oculta a profesionales y recepción, no al profesional que administra", () => {
  const tutorial = (rol) => getVisibleDashboardSections(rol).flatMap((s) => s.items).some((i) => i.action === "startTour");
  assert.equal(tutorial("profesional-medico"), false);
  assert.equal(tutorial("recepcion"), false);
  assert.equal(tutorial("profesional-odontologo+admin"), true);
  assert.equal(tutorial("admin-clinica"), true);
});
