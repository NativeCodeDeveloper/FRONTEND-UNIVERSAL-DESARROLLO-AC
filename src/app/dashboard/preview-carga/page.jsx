"use client";

// ── Preview de la pantalla de carga (solo desarrollo) ────────────────────────
// Sirve para validar el loader sin tener que provocar una carga lenta real.
// Vive dentro de /dashboard a propósito: así se lanza desde la navegación real
// de la app. Las pantallas son las mismas que usan src/app/loading.jsx y
// src/app/not-found.jsx (ver src/components/ui/pantalla-anillos.jsx).
//
// En producción esta ruta no existe (ver bloque de guarda más abajo).

import { useState } from "react";
import { PantallaCarga, PantallaNoEncontrada } from "@/components/ui/pantalla-anillos";

const VARIANTES = [
    { id: "carga", etiqueta: "Cargando", Pantalla: PantallaCarga },
    { id: "404", etiqueta: "404", Pantalla: PantallaNoEncontrada },
];

export default function PreviewCargaPage() {
    const [activa, setActiva] = useState(null);

    if (process.env.NODE_ENV === "production") return null;

    const variante = VARIANTES.find((v) => v.id === activa);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#16181C]">
                Preview — pantalla de carga
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#52565C]">
                Elige una variante para superponerla: la carga muestra el logo con las
                partículas quantum, y el 404 conserva los anillos; ambas cubren toda la
                ventana sobre fondo blanco, tal cual se ven en la app real.
                Haz clic en cualquier parte del overlay para cerrarlo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
                {VARIANTES.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiva(v.id)}
                        className="rounded-lg bg-[#16181C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007AFF]"
                    >
                        Ver {v.etiqueta}
                    </button>
                ))}
            </div>

            {/* Contenido de relleno para tener algo detrás al cerrar el overlay. */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[#EAEAEC] bg-white p-5">
                        <div className="text-xs text-[#8B8F96]">
                            Tarjeta de ejemplo
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-[#16181C]">
                            {(i + 1) * 17}
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-[#F1F1F3]" />
                        <div className="mt-2 h-2 w-2/3 rounded-full bg-[#F1F1F3]" />
                    </div>
                ))}
            </div>

            {variante && <variante.Pantalla onClick={() => setActiva(null)} />}
        </div>
    );
}
