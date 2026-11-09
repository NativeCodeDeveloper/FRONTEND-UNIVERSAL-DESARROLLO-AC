// src/components/AnimatedLayout.jsx
"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

export function AnimatedLayout({ children }) {
    const pathname = usePathname();

    // Usamos solo el segmento raíz como key de animación.
    // Así navegar dentro de /dashboard/* NO remonta el layout (ni el sidebar).
    // La animación solo ocurre al cambiar de sección raíz (ej: / → /dashboard).
    const rootSegment = "/" + pathname.split("/")[1];

    // Solo entrada, sin <AnimatePresence mode="wait">: esperar la salida dejaba montada
    // la pantalla anterior (y con ella la carga) si la animación se cortaba.
    return (
        <motion.div
            key={rootSegment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
}
