"use client";

/**
 * RutInput.jsx
 * Input de documento de identidad: RUT chileno o, si se habilita, pasaporte.
 * - El onChange devuelve el valor LIMPIO (sin puntos ni guión) al componente padre
 * - Valida el dígito verificador (módulo 11), no solo el largo
 * - Con `permitirExtranjero`, muestra un selector RUT · Pasaporte para pacientes
 *   extranjeros; el pasaporte no tiene dígito verificador
 * - El padre guarda el valor limpio → lo envía al backend sin formato
 * - El RutDisplay usa formatRut() para mostrarlo en pantalla
 *
 * Uso:
 *   <RutInput
 *     value={rut}                        // valor limpio: "191684087"
 *     onChange={(clean) => setRut(clean)} // recibe limpio: "191684087"
 *   />
 *
 *   <RutInput
 *     permitirExtranjero
 *     tipoDocumento={tipo}               // "rut" | "pasaporte"
 *     onTipoDocumentoChange={setTipo}
 *     value={documento}
 *     onChange={setDocumento}
 *   />
 */

import { useEffect, useState } from "react";
import {
    TIPOS_DOCUMENTO,
    limpiarPasaporte,
    limpiarRut,
    validarDocumento,
} from "@/lib/rut";

export function RutInput({
    value = "",
    onChange,
    placeholder,
    className = "",
    label = "",
    disabled = false,
    permitirExtranjero = false,
    tipoDocumento = TIPOS_DOCUMENTO.RUT,
    onTipoDocumentoChange,
    onValidez,
}) {
    const esPasaporte = permitirExtranjero && tipoDocumento === TIPOS_DOCUMENTO.PASAPORTE;
    const tipo = esPasaporte ? TIPOS_DOCUMENTO.PASAPORTE : TIPOS_DOCUMENTO.RUT;
    const limpiar = esPasaporte ? limpiarPasaporte : (v) => limpiarRut(v).slice(0, 9);

    const [display, setDisplay] = useState(value || "");
    const [touched, setTouched] = useState(false);
    const [error,   setError]   = useState("");

    // Sincroniza display cuando el padre cambia el valor (reset de form, carga desde BD)
    useEffect(() => {
        setDisplay(value ? limpiar(value) || value : "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, tipo]);

    // Informa la validez al padre cada vez que cambia el valor o el tipo, aunque
    // el campo no se haya tocado: así puede bloquear el guardado sin duplicar reglas.
    useEffect(() => {
        onValidez?.(!validarDocumento({ tipo, valor: display }));
        if (touched) setError(validar(display));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [display, tipo]);

    function validar(valor) {
        return valor ? validarDocumento({ tipo, valor }) : "";
    }

    function propagar(crudo) {
        const limpio = limpiar(crudo);
        setDisplay(limpio);
        onChange?.(limpio);
    }

    function handleBeforeInput(e) {
        const data = e.data ?? "";
        if (!data) return;
        const permitido = esPasaporte ? /^[0-9a-zA-Z]+$/ : /^[0-9kK]+$/;
        if (!permitido.test(data)) e.preventDefault();
    }

    function handlePaste(e) {
        e.preventDefault();
        propagar(e.clipboardData?.getData("text") ?? "");
    }

    function handleBlur() {
        setTouched(true);
        setError(validar(display));
    }

    function cambiarTipo(nuevo) {
        if (nuevo === tipo || disabled) return;
        setTouched(false);
        setError("");
        onTipoDocumentoChange?.(nuevo);
        // El valor de un tipo no sirve para el otro ("12345678K" no es pasaporte útil).
        setDisplay("");
        onChange?.("");
    }

    const hasError = touched && !!error;
    const isOk     = touched && !error && !!display;

    const baseClass =
        "h-10 w-full rounded-xl border bg-white px-3 text-[13px] text-slate-800 outline-none transition-all placeholder:text-slate-400 " +
        (hasError
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : isOk
                ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                : "border-slate-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-100");

    const textoPlaceholder = placeholder ?? (esPasaporte ? "N° de pasaporte" : "Ej: 19.168.408-7");

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {label}
                </label>
            )}

            {permitirExtranjero && (
                <div
                    role="radiogroup"
                    aria-label="Tipo de documento"
                    className="mb-1.5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:inline-grid sm:w-auto"
                >
                    {[
                        [TIPOS_DOCUMENTO.RUT, "RUT"],
                        [TIPOS_DOCUMENTO.PASAPORTE, "Pasaporte"],
                    ].map(([valor, etiqueta]) => (
                        <button
                            key={valor}
                            type="button"
                            role="radio"
                            aria-checked={tipo === valor}
                            disabled={disabled}
                            onClick={() => cambiarTipo(valor)}
                            className={`h-8 rounded-lg px-4 text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                                tipo === valor
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={display}
                    onChange={(e) => propagar(e.target.value)}
                    onBeforeInput={handleBeforeInput}
                    onPaste={handlePaste}
                    onBlur={handleBlur}
                    placeholder={textoPlaceholder}
                    disabled={disabled}
                    aria-invalid={hasError}
                    className={`${baseClass} ${className}`}
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    style={{ textTransform: "uppercase" }}
                    maxLength={esPasaporte ? 20 : 9}
                />
                {/* Indicador de validez */}
                {isOk && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </span>
                )}
            </div>
            {/* Mensaje de error */}
            {hasError && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    {error}
                </p>
            )}
            {/* Hint solo antes de tocar */}
            {!touched && (
                <p className="text-[11px] text-slate-400">
                    {esPasaporte
                        ? "Letras y números, sin espacios ni guiones"
                        : "Sin puntos ni guión · se valida el dígito verificador"}
                </p>
            )}
        </div>
    );
}
