"use client";

import { Lock } from "lucide-react";
import PantallaEstado from "@/Componentes/PantallaEstado";

/* Se llega aquí cuando el perfil no incluye la sección pedida (ver dashboard-access.js). */
export default function NoAccessPage() {
  return (
    <PantallaEstado
      icono={Lock}
      titulo="No tienes acceso a esta sección"
      principal={{ texto: "Volver al inicio", href: "/dashboard" }}
      motivo="Sin acceso a una sección"
    >
      <p>Tu perfil no incluye este módulo.</p>
      <p>Si lo necesitas para tu trabajo, pídele a quien administra la clínica que revise tu perfil.</p>
    </PantallaEstado>
  );
}
