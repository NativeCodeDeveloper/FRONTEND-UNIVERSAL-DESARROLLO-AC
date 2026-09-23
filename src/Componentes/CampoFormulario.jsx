"use client";

/**
 * CampoFormulario
 * Etiqueta, marca de obligatorio, control y mensaje de error con una sola
 * disposicion para todos los formularios en modal.
 */
export default function CampoFormulario({
  etiqueta,
  requerido = false,
  error,
  ayuda,
  // Resalta la ayuda cuando el campo esta pendiente: no es un error todavia
  // (no se ha intentado guardar), pero conviene que se note.
  resaltarAyuda = false,
  htmlFor,
  ancho = "",
  children,
}) {
  return (
    <div className={`space-y-1.5 ${ancho}`}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
        {etiqueta}
        {requerido ? (
          <>
            {/* En slate-400 el asterisco se leia como decoracion y pasaba
                desapercibido. Ademas se anuncia para lectores de pantalla, que
                no interpretan un asterisco suelto. */}
            <span aria-hidden="true" className="ml-1 text-[13px] font-semibold text-red-500">*</span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] font-medium text-red-600">
          {error}
        </p>
      ) : ayuda ? (
        <p className={`text-[11px] ${resaltarAyuda ? "font-medium text-amber-600" : "text-slate-400"}`}>
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
