"use client"

import {Button} from "@/components/ui/button"

export default function ShadcnButton2({nombre, funcion, className = "", disabled = false}) {
    const base = "px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800";
    return (
        <div className="flex flex-wrap items-center gap-2 md:flex-row">
            <Button
                onClick={funcion}
                className={`${base} ${className}`}
                disabled={disabled || false}
            >
                {nombre}
            </Button>
        </div>
    )
}
