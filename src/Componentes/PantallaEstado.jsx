"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDatosSoporte } from "@/hooks/useDatosSoporte";
import { CORREO_SOPORTE, construirMailtoSoporte, construirUrlSoporte } from "@/lib/soporteWhatsapp";

/**
 * Pantalla de estado del dashboard (sin acceso, cuenta suspendida…).
 * Neutra a propósito: gris y azul del sistema, sin ámbar ni rojo. El rojo queda
 * para acciones destructivas; estas pantallas solo informan y ofrecen salida.
 *
 *   icono       componente de lucide-react
 *   principal   { texto, href }            botón azul (enlace interno o externo)
 *   motivo      texto para el mensaje de soporte por WhatsApp
 *   conSoporte  muestra "Escribir a soporte" (por defecto sí)
 */
export default function PantallaEstado({ icono: Icono, titulo, children, principal, motivo, conSoporte = true }) {
  const datosSoporte = useDatosSoporte();
  const urlSoporte = useMemo(() => construirUrlSoporte({ ...datosSoporte, motivo }), [datosSoporte, motivo]);
  const correoSoporte = useMemo(() => construirMailtoSoporte({ ...datosSoporte, motivo }), [datosSoporte, motivo]);
  const externo = principal?.href?.startsWith("http");

  return (
    <div className="font-system-apple flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-[#FAFAFB] px-4 py-12">
      <div className="w-full max-w-[440px] text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#F2F2F7]">
          {Icono ? <Icono aria-hidden="true" className="size-7 text-[#8E8E93]" strokeWidth={1.6} /> : null}
        </div>

        <h1 className="mt-6 text-[24px] font-semibold tracking-tight text-[#1D1D1F]">{titulo}</h1>
        <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-[#6E6E73]">{children}</div>

        <div className="mt-8 flex flex-col items-center gap-3">
          {principal ? (
            externo ? (
              <a
                href={principal.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC] sm:w-auto"
              >
                {principal.texto}
              </a>
            ) : (
              <Link
                href={principal.href}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC] sm:w-auto"
              >
                {principal.texto}
              </Link>
            )
          ) : null}
          {conSoporte ? (
            <a
              href={urlSoporte}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-[14px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10"
            >
              Escribir a soporte
            </a>
          ) : null}
          <p className="text-[13px] text-[#86868B]">
            Solicitudes por correo:{" "}
            <a href={correoSoporte} className="font-medium text-[#007AFF] hover:underline">{CORREO_SOPORTE}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
