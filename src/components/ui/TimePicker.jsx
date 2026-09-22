"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const HORAS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0"))
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

function ScrollColumn({ items, selected, onSelect, dataAttr, scrollRef, label, alturaLista }) {
    const [atTop, setAtTop] = useState(true)
    const [atBottom, setAtBottom] = useState(false)

    const checkScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setAtTop(el.scrollTop <= 2)
        setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2)
    }, [scrollRef])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        checkScroll()
        el.addEventListener("scroll", checkScroll, { passive: true })
        return () => el.removeEventListener("scroll", checkScroll)
    }, [checkScroll])

    function scrollBy(amount) {
        scrollRef.current?.scrollBy({ top: amount, behavior: "smooth" })
    }

    return (
        <div className="flex flex-col">
            {/* Flecha arriba */}
            <button
                type="button"
                onClick={() => scrollBy(-87)}
                disabled={atTop}
                className={`w-full flex items-center justify-center py-1.5 transition-all border-b border-slate-100
                    ${atTop ? "opacity-20 cursor-default" : "opacity-70 hover:opacity-100 hover:bg-violet-50"}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>

            {/* Lista scrolleable */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    className={cn("overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden", !alturaLista && "h-48")}
                    style={alturaLista ? { height: alturaLista } : undefined}
                >
                    <div className="py-1">
                        {items.map(item => (
                            <button
                                key={item}
                                type="button"
                                {...{ [dataAttr]: item }}
                                onClick={() => onSelect(item)}
                                className={`w-full px-4 py-[7px] text-[13px] font-semibold text-center transition-all
                                    ${selected === item
                                        ? "bg-[#6E56CF] text-white"
                                        : "text-slate-600 hover:bg-violet-50 hover:text-[#6E56CF]"
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gradiente superior */}
                {!atTop && (
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent" />
                )}

                {/* Gradiente inferior */}
                {!atBottom && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                )}
            </div>

            {/* Flecha abajo */}
            <button
                type="button"
                onClick={() => scrollBy(87)}
                disabled={atBottom}
                className={`w-full flex items-center justify-center py-1.5 transition-all border-t border-slate-100
                    ${atBottom ? "opacity-20 cursor-default" : "opacity-70 hover:opacity-100 hover:bg-violet-50"}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    )
}

export function TimePicker({ value = "", onChange, placeholder = "00:00", label = "", elevarDuranteTour = false }) {
    const [open, setOpen] = useState(false)
    const [openUp, setOpenUp] = useState(false)
    const [posicionTour, setPosicionTour] = useState(null)
    const containerRef = useRef(null)
    const dropdownRef = useRef(null)
    const horasRef = useRef(null)
    const minutosRef = useRef(null)

    const [hora, minuto] = value ? value.split(":") : ["", ""]

    const actualizarPosicionTour = useCallback(() => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const margen = 8
        const espacioArriba = rect.top - margen
        const espacioAbajo = window.innerHeight - rect.bottom - margen
        const arriba = espacioArriba >= espacioAbajo
        const espacioDisponible = arriba ? espacioArriba : espacioAbajo
        const alturaLista = Math.min(192, Math.max(32, Math.floor(espacioDisponible - 132)))
        const siguiente = {
            izquierda: Math.max(margen, rect.left),
            ancho: Math.min(rect.width, window.innerWidth - margen * 2),
            borde: arriba ? window.innerHeight - rect.top + 6 : rect.bottom + 6,
            arriba,
            alturaLista,
        }

        setOpenUp(arriba)
        setPosicionTour((actual) =>
            actual && Object.keys(siguiente).every((clave) => actual[clave] === siguiente[clave])
                ? actual
                : siguiente
        )
    }, [])

    function cerrarDesplegable() {
        setOpen(false)
        setPosicionTour(null)
    }

    function alternarDesplegable() {
        if (open) {
            cerrarDesplegable()
            return
        }

        if (elevarDuranteTour && document.body.classList.contains("driver-active")) {
            actualizarPosicionTour()
        } else {
            setPosicionTour(null)
        }
        setOpen(true)
    }

    // Cerrar al hacer clic fuera
    useEffect(() => {
        if (!open) return
        function onClickOutside(e) {
            if (!containerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
                cerrarDesplegable()
            }
        }
        document.addEventListener("mousedown", onClickOutside)
        return () => document.removeEventListener("mousedown", onClickOutside)
    }, [open])

    // Detectar si el dropdown cabe hacia abajo, si no abrirlo hacia arriba
    useEffect(() => {
        if (!open || posicionTour || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setOpenUp(spaceBelow < 320)
    }, [open, posicionTour])

    useEffect(() => {
        if (!open || !posicionTour) return
        window.addEventListener("scroll", actualizarPosicionTour, true)
        window.addEventListener("resize", actualizarPosicionTour)
        return () => {
            window.removeEventListener("scroll", actualizarPosicionTour, true)
            window.removeEventListener("resize", actualizarPosicionTour)
        }
    }, [open, Boolean(posicionTour), actualizarPosicionTour])

    // Scroll automático al valor seleccionado cuando se abre
    useEffect(() => {
        if (!open) return
        setTimeout(() => {
            if (hora && horasRef.current) {
                const el = horasRef.current.querySelector(`[data-h="${hora}"]`)
                el?.scrollIntoView({ block: "center", behavior: "instant" })
            }
            if (minuto && minutosRef.current) {
                const el = minutosRef.current.querySelector(`[data-m="${minuto}"]`)
                el?.scrollIntoView({ block: "center", behavior: "instant" })
            }
        }, 0)
    }, [open])

    function seleccionarHora(h) {
        onChange(`${h}:${minuto || "00"}`)
    }

    function seleccionarMinuto(m) {
        onChange(`${hora || "00"}:${m}`)
    }

    const desplegable = open && (
        <div
            ref={dropdownRef}
            className={cn(
                "bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden",
                posicionTour
                    ? "fixed z-[10001] !pointer-events-auto [&_*]:!pointer-events-auto"
                    : `absolute z-50 left-0 right-0 ${openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"}`
            )}
            style={posicionTour ? {
                left: posicionTour.izquierda,
                width: posicionTour.ancho,
                ...(posicionTour.arriba ? { bottom: posicionTour.borde } : { top: posicionTour.borde }),
            } : undefined}
        >
            <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/70">
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                    Hora
                </div>
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">
                    Minuto
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-100">
                <ScrollColumn
                    items={HORAS}
                    selected={hora}
                    onSelect={seleccionarHora}
                    dataAttr="data-h"
                    scrollRef={horasRef}
                    label="Hora"
                    alturaLista={posicionTour?.alturaLista}
                />
                <ScrollColumn
                    items={MINUTOS}
                    selected={minuto}
                    onSelect={seleccionarMinuto}
                    dataAttr="data-m"
                    scrollRef={minutosRef}
                    label="Minuto"
                    alturaLista={posicionTour?.alturaLista}
                />
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                    {value ? `Seleccionado: ` : "Sin seleccionar"}
                    {value && <span className="font-bold text-[#6E56CF]">{value}</span>}
                </span>
                <button
                    type="button"
                    onClick={cerrarDesplegable}
                    className="text-[11px] font-bold text-[#6E56CF] hover:text-[#5b45bc] transition-colors"
                >
                    Listo ✓
                </button>
            </div>
        </div>
    )

    return (
        <div ref={containerRef} className="relative w-full">

            {/* Trigger */}
            <button
                type="button"
                onClick={alternarDesplegable}
                className={`w-full rounded-xl border bg-white px-3 py-2.5 text-[13px] font-medium transition-all flex items-center justify-between gap-2
                    ${open
                        ? "border-[#6E56CF] ring-2 ring-[#6E56CF]/30 text-slate-700"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }
                    ${!value ? "text-slate-400" : ""}
                `}
            >
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 shrink-0 ${value ? "text-[#6E56CF]" : "text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={value ? "text-slate-700 font-semibold" : "text-slate-400 font-medium"}>
                        {value || placeholder}
                    </span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {desplegable && (posicionTour ? createPortal(desplegable, document.body) : desplegable)}
        </div>
    )
}
