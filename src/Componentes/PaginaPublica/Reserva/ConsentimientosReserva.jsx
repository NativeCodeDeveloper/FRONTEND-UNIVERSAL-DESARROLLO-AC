"use client";

import { useState } from "react";
import TextoLegalModal from "@/Componentes/documentos/TextoLegalModal";
import { ETIQUETAS_CONSENTIMIENTO, esObligatorio, interpolarPlantilla } from "@/lib/consentimientos/textosLegales";

/**
 * Textos legales de la reserva pública:
 *  - Política de privacidad (Ley 19.628 / Ley 21.719): CASILLA obligatoria, sin
 *    premarcar (un consentimiento premarcado no es inequívoco). El padre bloquea la
 *    reserva y el pago hasta que esté marcada.
 *  - Derechos y deberes del paciente (Ley 20.584): solo lectura, como enlace de
 *    texto más abajo. La ley exige informarlos, no que el paciente los acepte.
 */
export default function ConsentimientosReserva({ plantillas, valores, onCambio, mostrarErrores, empresa, profesional, cargando, errorCarga }) {
  const [abierta, setAbierta] = useState(null);
  const plantillaAbierta = plantillas.find((p) => p.codigo === abierta);

  if (cargando) {
    return <div className="mt-6 h-24 animate-pulse rounded-[14px] bg-[var(--pp-niebla,#F2F2F7)]" />;
  }
  if (errorCarga) {
    return (
      <p role="alert" className="mt-6 text-[13px] text-[#e30000]">
        No pudimos cargar los términos para tu reserva. Recarga la página o escríbenos por WhatsApp.
      </p>
    );
  }

  return (
    <fieldset className="mt-6 space-y-3 border-t border-[var(--pp-linea-suave,#E5E5EA)] pt-5">
      <legend className="sr-only">Política de privacidad</legend>
      {plantillas.filter((p) => esObligatorio(p.codigo)).map((p) => {
        const etiquetas = ETIQUETAS_CONSENTIMIENTO[p.codigo] || { casilla: p.titulo, enlace: "Ver" };
        const falta = mostrarErrores && !valores[p.codigo];
        return (
          <div key={p.codigo}>
            <div className="flex items-start gap-3">
              <label className="flex min-h-11 flex-1 cursor-pointer items-start gap-3 py-1">
                <input
                  type="checkbox"
                  checked={Boolean(valores[p.codigo])}
                  onChange={(e) => onCambio(p.codigo, e.target.checked)}
                  aria-invalid={falta}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[var(--pp-acento,#007AFF)]"
                />
                <span className="text-[14px] leading-snug text-[var(--pp-tinta,#1D1D1F)]">{etiquetas.casilla}</span>
              </label>
              <button
                type="button"
                onClick={() => setAbierta(p.codigo)}
                className="mt-1 shrink-0 text-[14px] font-medium text-[var(--pp-acento,#007AFF)] hover:underline"
              >
                {etiquetas.enlace}
              </button>
            </div>
            {falta ? <span className="ml-8 block text-[13px] text-[#e30000]">Debes aceptar para continuar.</span> : null}
          </div>
        );
      })}
      <p className="text-[12px] leading-relaxed text-[var(--pp-tinta-3,#8E8E93)]">
        Tu aceptación queda registrada con fecha y hora y te enviaremos una constancia a tu correo. Puedes revocarla
        cuando quieras escribiendo al centro.
      </p>
      {plantillas.filter((p) => !esObligatorio(p.codigo)).map((p) => (
        <button
          key={p.codigo}
          type="button"
          onClick={() => setAbierta(p.codigo)}
          className="block text-left text-[13px] font-medium text-[var(--pp-acento,#007AFF)] hover:underline"
        >
          {ETIQUETAS_CONSENTIMIENTO[p.codigo]?.enlace || p.titulo}
        </button>
      ))}

      <TextoLegalModal
        abierto={Boolean(plantillaAbierta)}
        titulo={plantillaAbierta?.titulo}
        version={plantillaAbierta?.version}
        cuerpo={interpolarPlantilla(plantillaAbierta?.cuerpo, { empresa, profesional })}
        onCerrar={() => setAbierta(null)}
        accionPrincipal={plantillaAbierta && esObligatorio(plantillaAbierta.codigo) ? {
          etiqueta: "Acepto",
          onClick: () => {
            onCambio(plantillaAbierta.codigo, true);
            setAbierta(null);
          },
        } : null}
      />
    </fieldset>
  );
}
