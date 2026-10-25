import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { normalizeDashboardRole } from "@/lib/dashboard-access";
import {
  agendaValida,
  autorizarGestionUsuarios,
  metadataDePerfil,
  perfilAsignable,
  resumirUsuario,
} from "@/lib/usuariosClerkServidor";

function responseError(error, status = 400) {
  return NextResponse.json({ error }, { status });
}

async function obtenerIdUsuario(params) {
  const routeParams = await params;
  return String(routeParams?.userId || "").trim();
}

const tiene = (obj, clave) => Object.prototype.hasOwnProperty.call(obj || {}, clave);

export async function PATCH(req, { params }) {
  try {
    const autorizacion = await autorizarGestionUsuarios();
    if (autorizacion.error) return responseError(autorizacion.error.mensaje, autorizacion.error.status);

    const targetUserId = await obtenerIdUsuario(params);
    if (!targetUserId) return responseError("Falta el identificador del usuario.");

    let body;
    try {
      body = await req.json();
    } catch {
      return responseError("No se pudo leer la actualización del usuario.");
    }

    const password = String(body?.password || "");
    const actualizaAgenda = tiene(body, "idProfesionalAgenda");
    const actualizaRol = tiene(body, "role");
    const actualizaAdministra = tiene(body, "administraClinica");

    if (!password && !actualizaAgenda && !actualizaRol && !actualizaAdministra) {
      return responseError("Debes indicar una contraseña, agenda o perfil para actualizar.");
    }
    if (actualizaAgenda && body.idProfesionalAgenda && !agendaValida(body.idProfesionalAgenda)) {
      return responseError("La agenda seleccionada no es válida.");
    }

    const nuevoPerfil = actualizaRol ? perfilAsignable(body.role) : null;
    if (actualizaRol && !nuevoPerfil) return responseError("El perfil seleccionado no es válido.");

    const client = await clerkClient();
    const datosActualizados = {};
    if (password) datosActualizados.password = password;

    if (actualizaAgenda || actualizaRol || actualizaAdministra) {
      const targetUser = await client.users.getUser(targetUserId);
      const actual = targetUser.publicMetadata || {};

      // Lo que no viene en el cuerpo se conserva. Al guardar, un valor antiguo
      // (p. ej. "operador-medico") queda escrito con su nombre nuevo.
      const perfil = nuevoPerfil || normalizeDashboardRole(actual.role || actual.rol);
      const { error: errorPerfil, metadata } = metadataDePerfil({
        perfil,
        idProfesionalAgenda: actualizaAgenda ? body.idProfesionalAgenda : actual.idProfesionalAgenda,
        administraClinica: actualizaAdministra ? body.administraClinica === true : actual.administraClinica === true,
      });
      if (errorPerfil) return responseError(errorPerfil);

      const publicMetadata = { ...actual, ...metadata };
      for (const clave of ["idProfesionalAgenda", "administraClinica"]) {
        if (metadata[clave] === undefined) delete publicMetadata[clave];
      }
      datosActualizados.publicMetadata = publicMetadata;
    }

    const user = await client.users.updateUser(targetUserId, datosActualizados);
    return NextResponse.json({ success: true, ...resumirUsuario(user) });
  } catch (error) {
    console.error("PATCH /api/dashboard/users/[userId] failed", error);

    const clerkMessage =
      error?.errors?.[0]?.longMessage ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "No se pudo actualizar el usuario.";

    const status = Number(error?.status) || 500;
    return responseError(clerkMessage, status >= 400 && status < 600 ? status : 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const autorizacion = await autorizarGestionUsuarios();
    if (autorizacion.error) return responseError(autorizacion.error.mensaje, autorizacion.error.status);

    const targetUserId = await obtenerIdUsuario(params);
    if (!targetUserId) return responseError("Falta el identificador del usuario.");

    if (targetUserId === autorizacion.userId) {
      return responseError("No puedes eliminar tu propio usuario.", 400);
    }

    const client = await clerkClient();
    await client.users.deleteUser(targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dashboard/users/[userId] failed", error);

    const clerkMessage =
      error?.errors?.[0]?.longMessage ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "No se pudo eliminar el usuario.";

    const status = Number(error?.status) || 500;
    return responseError(clerkMessage, status >= 400 && status < 600 ? status : 500);
  }
}
