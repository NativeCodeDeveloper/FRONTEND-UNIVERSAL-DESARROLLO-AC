import { CheckCircle2, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ComprobantePago() {
    return (
        <div className="w-full bg-emerald-50/40 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="mx-auto flex max-w-3xl items-center justify-center">
                <div className="mt-8 w-full overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm lg:mt-14">
                    <div className="h-1.5 w-full bg-emerald-500" />
                    <div className="flex flex-col items-center gap-5 px-6 py-8 text-center sm:px-10 sm:py-10 lg:px-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/70">
                            <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.7} aria-hidden="true" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Pago Realizado Exitosamente
                        </h1>
                        <Link href="/" className="w-full sm:w-auto">
                            <Button className="h-12 w-full gap-3 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:w-auto">
                                Volver a la página principal <MoveRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
