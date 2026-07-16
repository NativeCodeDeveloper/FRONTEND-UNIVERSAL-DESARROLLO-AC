import { useEffect, useRef } from "react"
import { obtenerCitasProximas, mostrarNotificacionNavegador } from "@/lib/citasProximas"

const POLL_INTERVAL_MS = 5 * 60 * 1000  // cada 5 minutos
const ANTICIPACION_MIN = 30              // avisar con 30 min de anticipación
const STORAGE_KEY = "notif_mostradas"

function getMostradas() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        return new Set(JSON.parse(raw) || [])
    } catch {
        return new Set()
    }
}

function saveMostradas(set) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
    } catch {}
}

export function useAppointmentNotifications(enabled) {
    const timerRef = useRef(null)
    const API = process.env.NEXT_PUBLIC_API_URL

    async function verificarCitasProximas() {
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return

        try {
            const res = await fetch(`${API}/reservaPacientes/seleccionarReservados`, {
                method: "GET",
                headers: { Accept: "application/json" },
                mode: "cors"
            })
            if (!res.ok) return
            const reservas = await res.json()

            const citas = obtenerCitasProximas(reservas, ANTICIPACION_MIN)
            const mostradas = getMostradas()

            for (const cita of citas) {
                if (mostradas.has(cita.id)) continue

                mostrarNotificacionNavegador("Cita próxima — AgendaClínica", {
                    body: `En ~${ANTICIPACION_MIN} min · ${cita.descripcion}`,
                    icon: "/logo.png",
                    tag: cita.id,         // evita duplicados a nivel del OS
                    renotify: false,
                })

                mostradas.add(cita.id)
            }

            saveMostradas(mostradas)
        } catch {
            // silencioso — no interrumpir el flujo del dashboard
        }
    }

    useEffect(() => {
        if (!enabled) return
        if (typeof Notification === "undefined") return

        // Verificar inmediatamente al activarse
        verificarCitasProximas()

        timerRef.current = setInterval(verificarCitasProximas, POLL_INTERVAL_MS)

        return () => clearInterval(timerRef.current)
    }, [enabled])
}
