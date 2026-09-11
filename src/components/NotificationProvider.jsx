"use client"

import { useEffect, useState } from "react"
import { useAppointmentNotifications } from "@/hooks/useAppointmentNotifications"
import { suscribirsePush, esIOS, esPWAInstalada } from "@/lib/pushSubscription"

const DISMISS_KEY = "notif_banner_dismissed_until"
const DISMISS_DAYS = 7

function bannerFueDescartado() {
    try {
        const hasta = localStorage.getItem(DISMISS_KEY)
        if (!hasta) return false
        return Date.now() < Number(hasta)
    } catch {
        return false
    }
}

function guardarDescarte() {
    try {
        const hasta = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
        localStorage.setItem(DISMISS_KEY, String(hasta))
    } catch {}
}

export default function NotificationProvider() {
    // "idle"    → SSR safe, aún no leímos Notification.permission
    // "default" → nunca preguntado → mostrar banner
    // "granted" → permitido → solo polling
    // "denied"  → bloqueado → no hacer nada
    const [permiso, setPermiso] = useState("idle")
    const [bannerVisible, setBannerVisible] = useState(false)

    useEffect(() => {
        if (typeof Notification === "undefined") return

        const estado = Notification.permission
        setPermiso(estado)

        if (estado === "default" && !bannerFueDescartado()) {
            const t = setTimeout(() => setBannerVisible(true), 3000)
            return () => clearTimeout(t)
        }
    }, [])

    async function activarNotificaciones() {
        const resultado = await Notification.requestPermission()
        setPermiso(resultado)
        setBannerVisible(false)
        if (resultado === "granted") {
            // Suscripción push real (VAPID) — funciona aunque la app esté cerrada.
            // En iOS solo si la PWA está instalada; en ese caso soportaPush() da
            // false adentro y esto no hace nada (silencioso, no rompe el flujo).
            suscribirsePush()
        }
    }

    const mostrarNotaIOS = esIOS() && !esPWAInstalada()

    function descartarBanner() {
        guardarDescarte()
        setBannerVisible(false)
    }

    // Hook de polling — activo solo cuando el permiso está concedido
    useAppointmentNotifications(permiso === "granted")

    if (!bannerVisible || permiso !== "default") return null

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="px-4 py-4 flex items-start gap-3">
                    {/* Ícono */}
                    <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center text-[#6E56CF] shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">Notificaciones de citas</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Recibe un aviso cuando tengas una cita próxima, incluso con la app cerrada.
                        </p>
                        {mostrarNotaIOS && (
                            <p className="text-[10px] text-amber-600 mt-1.5 leading-relaxed">
                                En iPhone/iPad: agrega esta app a tu pantalla de inicio para recibir avisos aunque no la tengas abierta.
                            </p>
                        )}
                    </div>

                    {/* Cerrar */}
                    <button
                        onClick={descartarBanner}
                        className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5 shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Botones */}
                <div className="flex gap-2 px-4 pb-4">
                    <button
                        onClick={descartarBanner}
                        className="flex-1 py-2 text-[12px] font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Ahora no
                    </button>
                    <button
                        onClick={activarNotificaciones}
                        className="flex-1 py-2 text-[12px] font-bold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5b45bc] transition-colors shadow-sm shadow-indigo-200"
                    >
                        Activar
                    </button>
                </div>
            </div>
        </div>
    )
}
