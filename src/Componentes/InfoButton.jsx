import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function InfoButton({informacion, pasos, nota}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-9 gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:ring-2 focus-visible:ring-[#6E56CF]"
                >
                    <HelpCircle className="h-4 w-4" />
                    Información
                </Button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                align="center"
                className="max-w-sm rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-xl leading-relaxed"
            >
                <div className="space-y-3">
                    {typeof informacion === "string"
                        ? informacion.split("\n\n").map((parrafo, index) => (
                            <p key={index} className="text-slate-600">
                                {parrafo}
                            </p>
                        ))
                        : informacion}

                    {Array.isArray(pasos) && pasos.length > 0 && (
                        <ol className="space-y-1.5">
                            {pasos.map((paso, index) => (
                                <li key={index} className="flex gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F3F0FF] text-[10px] font-bold leading-none text-[#6E56CF]">
                                        {index + 1}
                                    </span>
                                    <span className="text-slate-700">{paso}</span>
                                </li>
                            ))}
                        </ol>
                    )}

                    {nota && (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
                            {nota}
                        </p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    )
}
