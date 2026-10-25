export {};

/** Perfiles vigentes (src/lib/dashboard-access.js). */
type PerfilDashboard =
  | "tecnico-nativecode"
  | "admin-centro-salud"
  | "admin-clinica-medica"
  | "admin-clinica-odontologica"
  | "admin-centro-oftalmologico"
  | "admin-centro-estetico"
  | "admin-clinica"
  | "profesional-salud"
  | "profesional-medico"
  | "profesional-odontologo"
  | "profesional-matrona"
  | "profesional-oftalmologia"
  | "profesional-estetica"
  | "recepcion"
  | "suspendido";

/** Valores antiguos que todavía pueden venir de Clerk; se traducen al perfil vigente. */
type PerfilAntiguo =
  | "admin"
  | "super-usuario-nativecode"
  | "administrador-clinico"
  | "operador-clinico"
  | "operador-medico"
  | "operador-odontologico"
  | "recepcionista"
  | "secretaria"
  | "cancelado"
  | "basico"
  | "centro-estetico"
  | "clinico-medico"
  | "odontologico"
  | "oftalmologia"
  | "agenda"
  | "configuracion";

declare global {
  interface CustomJwtSessionClaims {
    // Requiere la plantilla de sesión de Clerk: {"metadata": "{{user.public_metadata}}"}
    metadata: {
      role?: PerfilDashboard | PerfilAntiguo;
      rol?: PerfilDashboard | PerfilAntiguo;
      idProfesionalAgenda?: string;
      administraClinica?: boolean;
    };
  }
}
