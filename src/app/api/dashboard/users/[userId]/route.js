import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  canAccessDashboardPath,
  getDashboardRoleFromClaims,
} from "@/lib/dashboard-access";

function responseError(error, status = 400) {
  return NextResponse.json({ error }, { status });
}

async function autorizarGestionUsuarios() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { error: responseError("Debes iniciar sesion para gestionar usuarios.", 401) };
  }

  const requesterRole = getDashboardRoleFromClaims(sessionClaims);

  if (!canAccessDashboardPath(requesterRole, "/dashboard/createUser")) {
    return { error: responseError("No tienes permisos para gestionar usuarios.", 403) };
  }

  return { userId };
}

async function obtenerIdUsuario(params) {
  const routeParams = await params;
  return String(routeParams?.userId || "").trim();
}

export async function PATCH(req, { params }) {
  try {
    const authorization = await autorizarGestionUsuarios();

    if (authorization.error) {
      return authorization.error;
    }

    const targetUserId = await obtenerIdUsuario(params);

    if (!targetUserId) {
      return responseError("Falta el identificador del usuario.");
    }

    let body;

    try {
      body = await req.json();
    } catch {
      return responseError("No se pudo leer la nueva contrasena.");
    }

    const password = String(body?.password || "");

    if (!password) {
      return responseError("Debes ingresar una contrasena.");
    }

    const client = await clerkClient();
    await client.users.updateUser(targetUserId, { password });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/dashboard/users/[userId] failed", error);

    const clerkMessage =
      error?.errors?.[0]?.longMessage ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "No se pudo actualizar la contrasena.";

    const status = Number(error?.status) || 500;
    return responseError(clerkMessage, status >= 400 && status < 600 ? status : 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const authorization = await autorizarGestionUsuarios();

    if (authorization.error) {
      return authorization.error;
    }

    const targetUserId = await obtenerIdUsuario(params);

    if (!targetUserId) {
      return responseError("Falta el identificador del usuario.");
    }

    if (targetUserId === authorization.userId) {
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
