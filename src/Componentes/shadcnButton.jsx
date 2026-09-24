import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

// ...rest permite pasar atributos al <button> real (p. ej. data-tour para los
// anclajes de los tutoriales guiados) sin afectar el uso existente.
export function ShadcnButton({ nombre, funcion, className, ...rest }) {
    return (
        <div className="flex flex-wrap items-center gap-2 md:flex-row">
            <Button className={className} onClick={funcion} {...rest}>
                {nombre}
            </Button>
        </div>
    )
}
