"use client"

import * as React from "react"
import {ChevronDownIcon} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Calendar} from "@/components/ui/calendar"
import {Label} from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export default function ShadcnDatePicker({label = "Fecha", value, onChange, className = "w-48", placeholder = "Select date"}) {
    const [open, setOpen] = React.useState(false)
    const initialDate = value ? new Date(value) : undefined
    const [date, setDate] = React.useState(initialDate)

    function formatDate(d) {
        if (!d) return ""
        return d.toLocaleDateString()
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Con label="" el campo se integra bajo la etiqueta del formulario que lo contiene. */}
            {label ? (
                <Label htmlFor="date" className="px-1">
                    {label}
                </Label>
            ) : null}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className={`justify-between font-normal ${className}`}
                    >
                        <span className={date ? "" : "text-slate-400"}>
                            {date ? formatDate(date) : placeholder}
                        </span>
                        <ChevronDownIcon/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(selectedDate) => {
                            setDate(selectedDate)
                            setOpen(false)
                            if (onChange && selectedDate) {
                                // Emitir yyyy-mm-dd en hora local (evita desfase UTC)
                                const y = selectedDate.getFullYear()
                                const m = String(selectedDate.getMonth() + 1).padStart(2, "0")
                                const d = String(selectedDate.getDate()).padStart(2, "0")
                                onChange(`${y}-${m}-${d}`)
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
