"use client";

/**
 * PhoneInput.jsx
 * Input especializado para teléfono móvil chileno.
 * - Permite escribir el número con o sin prefijo (ej. 12345678, 912345678 o +56912345678)
 * - Al perder el foco, normaliza los números válidos a "+569XXXXXXXX"
 * - Valida que queden exactamente 8 dígitos después del 9 móvil
 *
 * Uso:
 *   <PhoneInput
 *     value={telefono}
 *     onChange={(full) => setTelefono(full)}     // al salir: "+56912345678"
 *   />
 */

import { useEffect, useState } from "react";

const PREFIJO = "+569";
const DIGITOS_LOCALES = 8;

function extraerDigitosLocales(valor = "") {
    let digitos = String(valor).replace(/\D/g, "");

    if (digitos.startsWith("569")) {
        digitos = digitos.slice(3);
    } else if (digitos.startsWith("56")) {
        digitos = digitos.slice(2);
    } else if (digitos.startsWith("9")) {
        digitos = digitos.slice(1);
    }

    return digitos;
}

function normalizarTelefonoChile(valor = "") {
    const digitosLocales = extraerDigitosLocales(valor);

    if (digitosLocales.length !== DIGITOS_LOCALES) return "";

    return `${PREFIJO}${digitosLocales}`;
}

export function PhoneInput({
    value = "",
    onChange,
    className = "",
    label = "",
    disabled = false,
}) {
    const [telefonoEscrito, setTelefonoEscrito] = useState(String(value ?? ""));
    const [touched, setTouched] = useState(false);
    const [error,   setError]   = useState("");

    // Sincroniza cuando el padre actualiza el valor (carga de BD / reset)
    useEffect(() => {
        setTelefonoEscrito(String(value ?? ""));
    }, [value]);

    function handleChange(e) {
        setTelefonoEscrito(e.target.value);
        if (touched) setError("");
    }

    function handleBlur() {
        setTouched(true);
        const telefonoNormalizado = normalizarTelefonoChile(telefonoEscrito);

        if (!telefonoEscrito.trim()) {
            setError("");
            onChange?.("");
            return;
        }

        if (!telefonoNormalizado) {
            setError("Ingresa un móvil chileno válido de 8 dígitos");
            return;
        }

        setTelefonoEscrito(telefonoNormalizado);
        setError("");
        onChange?.(telefonoNormalizado);
    }

    const hasError = touched && !!error;
    const isOk = touched && !error && Boolean(normalizarTelefonoChile(telefonoEscrito));

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {label}
                </label>
            )}
            <div className="flex overflow-hidden rounded-xl border border-slate-200 transition-all focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 has-[input:focus]">
                <input
                    type="tel"
                    value={telefonoEscrito}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="+56912345678"
                    maxLength={20}
                    disabled={disabled}
                    inputMode="tel"
                    autoComplete="tel"
                    className={`h-10 flex-1 min-w-0 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 ${
                        hasError ? "bg-red-50" : isOk ? "bg-emerald-50/30" : ""
                    } ${className}`}
                />
                {/* Indicador validez */}
                {isOk && (
                    <div className="flex items-center pr-3 bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                )}
            </div>
            {/* Error */}
            {hasError && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    {error}
                </p>
            )}
            {/* Hint */}
            {!touched && (
                <p className="text-[11px] text-slate-400">
                    Puedes ingresar 12345678, 912345678 o +56912345678
                </p>
            )}
        </div>
    );
}
