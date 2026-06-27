export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?:
        | "admin"
        | "super-usuario-nativecode"
        | "administrador-clinico"
        | "operador-clinico"
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
    };
  }
}
