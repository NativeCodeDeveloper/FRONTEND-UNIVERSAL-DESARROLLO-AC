import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
  autorizarGestionUsuarios,
  limpiarMetadata,
  metadataDePerfil,
  perfilAsignable,
  resumirUsuario,
} from "@/lib/usuariosClerkServidor";

function badRequest(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const autorizacion = await autorizarGestionUsuarios();
    if (autorizacion.error) return badRequest(autorizacion.error.mensaje, autorizacion.error.status);

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
    const autorizacion = await autorizarGestionUsuarios();
    if (autorizacion.error) return badRequest(autorizacion.error.mensaje, autorizacion.error.status);

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
    const perfil = perfilAsignable(body?.role);

    if (!nombre) return badRequest("Debes ingresar el nombre del usuario.");
    if (!nombreUsuario) return badRequest("Debes ingresar un nombre de usuario.");
    if (!password) return badRequest("Debes ingresar una contraseña.");
    if (!perfil) return badRequest("El perfil seleccionado no es válido.");

    const { error: errorPerfil, metadata } = metadataDePerfil({
      perfil,
      idProfesionalAgenda: body?.idProfesionalAgenda,
      administraClinica: body?.administraClinica === true,
    });
    if (errorPerfil) return badRequest(errorPerfil);

    const client = await clerkClient();
    const user = await client.users.createUser({
      password,
      firstName: nombre || undefined,
      lastName: apellido || undefined,
      username: nombreUsuario || undefined,
      publicMetadata: limpiarMetadata({
        ...metadata,
        createdByNativeCodeUserId: autorizacion.userId,
        // fecha-ok: instante de creación del usuario (auditoría), no un día del calendario.
        createdAtNativeCode: new Date().toISOString(),
      }),
    });

    return NextResponse.json({ success: true, user: resumirUsuario(user) });
  } catch (error) {
    console.error("POST /api/dashboard/users failed", error);

    const clerkMessage =
      error?.errors?.[0]?.longMessage ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "No se pudo crear el usuario en Clerk.";

    const status = Number(error?.status) || 500;

    return NextResponse.json(
      { error: clerkMessage, details: error?.errors || null },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
