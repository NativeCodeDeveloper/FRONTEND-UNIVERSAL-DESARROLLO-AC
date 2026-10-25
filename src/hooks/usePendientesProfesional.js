"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { useApiFirma } from "@/hooks/useApiFirma";
import { FIRMA_HABILITADA } from "@/lib/firma/apiFirma";

/**
 * Avisos fijos de la campana para el profesional de la sesión: le falta la
 * firma electrónica o el N° de registro, o tiene documentos esperando su firma.
 * No se guardan ni se descartan: desaparecen solos cuando se resuelven.
 *
 * Solo aplica a usuarios con agenda asignada (publicMetadata.idProfesionalAgenda)
 * y con la firma habilitada en la instancia.
 */
export function usePendientesProfesional() {
  const sesion = useSesionProfesional();
  const profesionales = useProfesionales();
  const api = useApiFirma();
  const [porFirmar, setPorFirmar] = useState(0);

  const propio = useMemo(
    () => profesionales.find((p) => sesion.esDueno(p.id_profesional)) || null,
    [profesionales, sesion]
  );

  useEffect(() => {
    if (!FIRMA_HABILITADA || !sesion.idProfesional) return undefined;
    let vigente = true;
    api.listarPendientesFirma()
      .then((r) => vigente && setPorFirmar((r.documentos || []).length))
      .catch(() => vigente && setPorFirmar(0));
    return () => {
      vigente = false;
    };
  }, [api, sesion.idProfesional]);

  return useMemo(() => {
    if (!FIRMA_HABILITADA || !propio) return [];
    const avisos = [];
    if (propio.firma_estado !== "activa") {
      avisos.push({
        id: "aviso-firma",
        titulo: "Registra tu firma electrónica",
        descripcion: "La necesitas para firmar documentos en la plataforma.",
        href: "/dashboard/profesionales?completar=firma",
      });
    }
    const registro = propio.registro_sis_estado || "no_informado";
    if (registro === "no_informado" || registro === "rechazado") {
      avisos.push({
        id: "aviso-registro",
        titulo: registro === "rechazado" ? "Revisa tu N° de registro" : "Agrega tu N° de registro",
        descripcion: "Superintendencia de Salud · aparece en el pie de firma.",
        href: "/dashboard/profesionales?completar=registro",
      });
    }
    if (porFirmar > 0) {
      avisos.push({
        id: "aviso-por-firmar",
        titulo: `${porFirmar} ${porFirmar === 1 ? "documento espera" : "documentos esperan"} tu firma`,
        descripcion: "Revísalos y fírmalos desde tu bandeja.",
        href: "/dashboard/documentosPorFirmar",
      });
    }
    return avisos;
  }, [propio, porFirmar]);
}
