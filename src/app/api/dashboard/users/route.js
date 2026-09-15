import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  canAccessDashboardPath,
  getAssignableDashboardRoles,
  getDashboardRoleFromClaims,
  normalizeDashboardRole,
} from "@/lib/dashboard-access";

const ASSIGNABLE_ROLE_SET = new Set(getAssignableDashboardRoles().map((role) => role.value));

function badRequest(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function resumirUsuario(user) {
  const role = String(user.publicMetadata?.role || user.publicMetadata?.rol || "");
  const nombre = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return {
    id: user.id,
    nombre,
    nombreUsuario: user.username || "",
    idProfesionalAgenda: String(user.publicMetadata?.idProfesionalAgenda || ""),
    role,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
  };
}

async function autorizarGestionUsuarios() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { error: badRequest("Debes iniciar sesion para gestionar usuarios.", 401) };
  }

  const requesterRole = getDashboardRoleFromClaims(sessionClaims);

  if (!canAccessDashboardPath(requesterRole, "/dashboard/createUser")) {
    return { error: badRequest("No tienes permisos para gestionar usuarios.", 403) };
  }

  return { userId };
}

export async function GET() {
  try {
    const authorization = await autorizarGestionUsuarios();

    if (authorization.error) {
      return authorization.error;
    }

    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });
    const users = Array.isArray(response) ? response : response.data || [];

    return NextResponse.json({ users: users.map(resumirUsuario) });
  } catch (error) {
    console.error("GET /api/dashboard/users failed", error);
    return badRequest("No se pudieron cargar los usuarios de Clerk.", 500);
  }
}

export async function POST(req) {
  try {
    const authorization = await autorizarGestionUsuarios();

    if (authorization.error) {
      return authorization.error;
    }

    const userId = authorization.userId;

    let body;

    try {
      body = await req.json();
    } catch {
      return badRequest("No se pudo leer el formulario enviado.");
    }

    const password = String(body?.password || "");
    const nombre = String(body?.nombre || "").trim();
    const apellido = String(body?.apellido || "").trim();
    const nombreUsuario = String(body?.nombreUsuario || "").trim();
    const idProfesionalAgenda = String(body?.idProfesionalAgenda || "").trim();
    const role = normalizeDashboardRole(body?.role);

    if (!nombre) {
      return badRequest("Debes ingresar el nombre del usuario.");
    }

    if (!nombreUsuario) {
      return badRequest("Debes ingresar un nombre de usuario.");
    }

    if (!password) {
      return badRequest("Debes ingresar una contrasena.");
    }

    if (!ASSIGNABLE_ROLE_SET.has(role)) {
      return badRequest("El perfil seleccionado no es valido.");
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      password,
      firstName: nombre || undefined,
      lastName: apellido || undefined,
      username: nombreUsuario || undefined,
      publicMetadata: {
        role,
        rol: role,
        ...(idProfesionalAgenda ? { idProfesionalAgenda } : {}),
        createdByNativeCodeUserId: userId,
        createdAtNativeCode: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nombre: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
        nombreUsuario: user.username || "",
        idProfesionalAgenda: String(user.publicMetadata?.idProfesionalAgenda || ""),
        role,
      },
    });
  } catch (error) {
    console.error("POST /api/dashboard/users failed", error);

    const clerkMessage =
      error?.errors?.[0]?.longMessage ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "No se pudo crear el usuario en Clerk.";

    const status = Number(error?.status) || 500;

    return NextResponse.json(
      {
        error: clerkMessage,
        details: error?.errors || null,
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
