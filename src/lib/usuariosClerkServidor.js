/* Reglas de la administración de usuarios de Clerk (solo servidor).
 * Compartidas por app/api/dashboard/users/route.js y [userId]/route.js. */

import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  canAccessDashboardPath,
  getCreatableDashboardRoles,
  getDashboardRoleFromClaims,
  getDashboardRoleFromUser,
  esPerfilProfesional,
  normalizeDashboardRole,
} from "@/lib/dashboard-access";

const PERFILES_ASIGNABLES = new Set(getCreatableDashboardRoles().map((r) => r.value));

/**
 * Autoriza a quien gestiona usuarios (hoy: técnico NativeCode).
 * Si el token de sesión no trae el rol (instancia sin la plantilla de sesión
 * {"metadata": "{{user.public_metadata}}"}), se consulta el usuario a Clerk en vez
 * de negar: si no, el técnico quedaría sin poder administrar usuarios.
 * @returns {{ userId: string } | { error: { mensaje: string, status: number } }}
 */
export async function autorizarGestionUsuarios() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { error: { mensaje: "Debes iniciar sesión para gestionar usuarios.", status: 401 } };

  const claims = sessionClaims || {};
  const tokenTraeRol = Boolean(claims.metadata || claims.publicMetadata || claims.public_metadata);
  let rol = getDashboardRoleFromClaims(sessionClaims);
  if (!tokenTraeRol) {
    const client = await clerkClient();
    rol = getDashboardRoleFromUser(await client.users.getUser(userId));
  }

  if (!canAccessDashboardPath(rol, "/dashboard/createUser")) {
    return { error: { mensaje: "No tienes permisos para gestionar usuarios.", status: 403 } };
  }
  return { userId };
}

/** Perfil enviado por el formulario, ya validado. null si no es asignable. */
export function perfilAsignable(valor) {
  const perfil = normalizeDashboardRole(valor);
  return PERFILES_ASIGNABLES.has(perfil) ? perfil : null;
}

export function agendaValida(valor) {
  return /^\d+$/.test(String(valor || "").trim());
}

/**
 * Reglas de un perfil con su agenda y su interruptor:
 *  - Un profesional necesita agenda (define qué ve y con qué identidad firma).
 *  - "También administra la clínica" solo existe para profesionales.
 *  - Los demás perfiles no guardan agenda ni interruptor.
 * @returns {{ error?: string, metadata?: object }}
 */
export function metadataDePerfil({ perfil, idProfesionalAgenda, administraClinica }) {
  const profesional = esPerfilProfesional(perfil);
  const agenda = String(idProfesionalAgenda || "").trim();

  if (profesional && !agendaValida(agenda)) {
    return { error: "Los perfiles profesionales necesitan una agenda asignada." };
  }

  return {
    metadata: {
      role: perfil,
      rol: perfil,
      idProfesionalAgenda: profesional ? agenda : undefined,
      administraClinica: profesional && administraClinica === true ? true : undefined,
    },
  };
}

/** Quita las claves undefined (Clerk guarda null si se le envían). */
export function limpiarMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata).filter(([, v]) => v !== undefined));
}

/** Resumen de un usuario para la tabla de la pantalla. */
export function resumirUsuario(user) {
  const role = String(user.publicMetadata?.role || user.publicMetadata?.rol || "");
  return {
    id: user.id,
    nombre: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
    nombreUsuario: user.username || "",
    idProfesionalAgenda: String(user.publicMetadata?.idProfesionalAgenda || ""),
    administraClinica: user.publicMetadata?.administraClinica === true,
    role,
    perfil: normalizeDashboardRole(role),
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
  };
}
