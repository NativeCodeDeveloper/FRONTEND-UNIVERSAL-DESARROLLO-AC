import { CircleX, MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
const CTA1 = () => (
    <div className="w-full bg-gradient-to-b from-red-50 via-slate-50 to-slate-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto flex max-w-3xl items-center justify-center">
            <div className="mt-8 w-full overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl shadow-red-100/60 lg:mt-14">
                <div className="h-2 w-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
                <div className="flex flex-col items-center gap-5 px-6 py-8 text-center sm:px-10 sm:py-10 lg:px-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/70">
                        <CircleX className="h-9 w-9 text-red-500" strokeWidth={1.7} aria-hidden="true" />
                    </div>
                    <Badge className="border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                        Pago rechazado
                    </Badge>
                    <div className="flex max-w-xl flex-col gap-3">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            No pudimos procesar tu pago
                        </h3>
                        <p className="text-base leading-7 text-slate-600 sm:text-lg">
                            Lamentablemente la transacción fue rechazada por la plataforma de pagos. Esto puede deberse a fondos insuficientes, verificación fallida o restricciones del banco emisor.
                        </p>
                        <p className="text-base leading-7 text-slate-600 sm:text-lg">
                            Intenta nuevamente con otro medio de pago o comunícate con tu banco.
                        </p>
                    </div>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="h-12 w-full gap-3 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-red-300 sm:w-auto">
                            Volver a la página principal <MoveRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    </div>
);

export default function PagoAprobadoPage() {
    return <CTA1 />;
}
