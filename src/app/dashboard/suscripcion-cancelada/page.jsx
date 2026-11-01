"use client";

import { PauseCircle } from "lucide-react";
import PantallaEstado from "@/Componentes/PantallaEstado";
import { useDatosSoporte } from "@/hooks/useDatosSoporte";
import { construirUrlSoporte } from "@/lib/soporteWhatsapp";

/*
 * Cuenta suspendida (perfil "suspendido"). Informa sin alarmar: la información
 * de la clínica se conserva; al regularizar el pago se reactiva el acceso.
 * La acción principal es escribir a soporte, que es lo que resuelve el caso.
 */
export default function SuscripcionCanceladaPage() {
  const datosSoporte = useDatosSoporte();
  const urlSoporte = construirUrlSoporte({ ...datosSoporte, motivo: "Cuenta suspendida" });

  return (
    <PantallaEstado
      icono={PauseCircle}
      titulo="Tu cuenta está suspendida"
      principal={{ texto: "Escribir a soporte", href: urlSoporte }}
      conSoporte={false}
    >
      <p>El acceso está pausado porque la suscripción no está al día.</p>
      <p>Tu información sigue guardada. Al regularizar el pago, el acceso se reactiva tal como lo dejaste.</p>
    </PantallaEstado>
  );
}
