/* Formatos de texto y moneda de la página pública */

export function iniciales(nombre) {
  const partes = String(nombre ?? "").trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

/* El backend guarda nombres como vengan ("ROXANA MELLA"); se normalizan al mostrar */
export function nombrePropio(nombre) {
  return String(nombre ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && ["del", "de", "la", "las", "los", "y"].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

/* Nombre que firma una reseña: el del paciente registrado o el del invitado */
export function nombreResena(r) {
  const paciente = [r.nombrePaciente, r.apellidoPaciente].filter(Boolean).join(" ");
  const invitado = [r.nombre_invitado, r.apellido_invitado].filter(Boolean).join(" ");
  return paciente || invitado || "Paciente";
}

export function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(valor) || 0);
}

/* Precio para mostrar: $0 se lee "Sin costo" */
export const textoPrecio = (valor) => (Number(valor) === 0 ? "Sin costo" : formatoPrecio(valor));
