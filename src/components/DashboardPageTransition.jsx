"use client"

import { motion } from "motion/react"
import { usePathname } from "next/navigation"

// Solo animación de entrada. Antes iba dentro de <AnimatePresence mode="wait">:
// la página saliente quedaba montada hasta terminar su animación de salida y, si
// era el fallback de carga y la salida se cortaba (redirección rápida, pestaña en
// segundo plano), la pantalla de carga quedaba pegada hasta recargar.
export default function DashboardPageTransition({ children }) {
    const pathname = usePathname()

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}
