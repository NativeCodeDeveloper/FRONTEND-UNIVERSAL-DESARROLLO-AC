import * as React from "react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ShadcnSelect({
                                 nombreDefault,
                                 value1,
                                 value2,
                                 value3,
                                 value4,
                                 value5,
                                 opciones,
                                 value,
                                 className = "w-[180px]",
                                 onChange,
                             }) {
    // `opciones` permite listas de cualquier largo; value1..value5 se mantiene para
    // los formularios que ya lo usaban.
    const items = Array.isArray(opciones) && opciones.length > 0
        ? opciones
        : [value1, value2, value3, value4, value5].filter(Boolean);

    return (
        <Select
            // shadcn usa onValueChange, NO onChange
            onValueChange={onChange}
            {...(value === undefined ? {} : { value })}
        >
            <SelectTrigger className={className}>
                <SelectValue placeholder={nombreDefault} />
            </SelectTrigger>

            <SelectContent>
                <SelectGroup>
                    {items.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}