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
  htmlFor,
  ancho = "",
  children,
}) {
  return (
    <div className={`space-y-1.5 ${ancho}`}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
        {etiqueta}
        {requerido ? <span className="ml-0.5 text-slate-400">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] font-medium text-red-600">
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-[11px] text-slate-400">{ayuda}</p>
      ) : null}
    </div>
  );
}
