"use client";

/**
 * RutInput.jsx
 * Input especializado para RUT chileno.
 * - Muestra el RUT formateado mientras el usuario escribe (XX.XXX.XXX-X)
 * - El onChange devuelve el valor LIMPIO (sin puntos ni guión) al componente padre
 * - Valida que tenga 8 o 9 caracteres (cuerpo de 7 u 8 dígitos + dígito verificador)
 * - El padre guarda el valor limpio → lo envía al backend sin formato
 * - El RutDisplay usa formatRut() para mostrarlo en pantalla
 *
 * Uso:
 *   <RutInput
 *     value={rut}                        // valor limpio: "191684087"
 *     onChange={(clean) => setRut(clean)} // recibe limpio: "191684087"
 *   />
 */

import { useEffect, useState } from "react";
import { formatRut, cleanRut } from "@/lib/designTokens";

export function RutInput({
    value = "",
    onChange,
    placeholder = "Ej: 19.168.408-7",
    className = "",
    label = "",
    disabled = false,
}) {
    const [display, setDisplay]   = useState(value || "");
    const [touched, setTouched]   = useState(false);
    const [error,   setError]     = useState("");

    // Sincroniza display cuando el padre cambia el valor (reset de form, carga desde BD)
    useEffect(() => {
        const clean = cleanRut(value);
        setDisplay(clean || (value ? value : ""));
    }, [value]);

    function validate(clean) {
        if (!clean) return "";
        if (clean.length < 8) return `Faltan ${8 - clean.length} caracter(es) — debe tener 8 o 9 en total`;
        return "";
    }

    function handleChange(e) {
        const raw = e.target.value;
        // Conserva solo digitos y K (limite 9 chars)
        const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);

        // Muestra el valor limpio sin formato
        setDisplay(clean);

        // Propaga valor limpio al padre
        onChange?.(clean);

        // Valida solo si ya toco el campo
        if (touched) setError(validate(clean));
    }

    function handleBeforeInput(e) {
        const data = e.data ?? "";
        if (!data) return;
        if (!/^[0-9kK]+$/.test(data)) {
            e.preventDefault();
        }
    }

    function handlePaste(e) {
        const pasted = e.clipboardData?.getData("text") ?? "";
        const clean = pasted.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
        e.preventDefault();
        setDisplay(clean);
        onChange?.(clean);
        if (touched) setError(validate(clean));
    }

    function handleBlur() {
        setTouched(true);
        const clean = cleanRut(display);
        setError(validate(clean));
    }

    const hasError = touched && !!error;
    const longitudRut = cleanRut(display).length;
    const isOk     = touched && !error && (longitudRut === 8 || longitudRut === 9);

    const baseClass =
        "h-10 w-full rounded-xl border bg-white px-3 text-[13px] text-slate-800 outline-none transition-all placeholder:text-slate-400 " +
        (hasError
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : isOk
                ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                : "border-slate-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-100");

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={display}
                    onChange={handleChange}
                    onBeforeInput={handleBeforeInput}
                    onPaste={handlePaste}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`${baseClass} ${className}`}
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    style={{ textTransform: "uppercase" }}
                    maxLength={9}
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
                    Se formateará automáticamente · sin puntos ni guión
                </p>
            )}
        </div>
    );
}
