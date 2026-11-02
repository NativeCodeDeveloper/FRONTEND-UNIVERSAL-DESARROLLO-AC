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
                    className="h-9 gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all hover:border-[#E5F0FF] hover:bg-[#EBF4FF] hover:text-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#007AFF]"
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
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] text-[10px] font-bold leading-none text-[#007AFF]">
                                        {index + 1}
                                    </span>
                                    <span className="text-slate-700">{paso}</span>
                                </li>
                            ))}
                        </ol>
                    )}

                    {nota && (
                        <p className="rounded-lg bg-[#F2F2F7] px-3 py-2 text-[12px] font-medium text-[#3A3A3C]">
                            {nota}
                        </p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    )
}
