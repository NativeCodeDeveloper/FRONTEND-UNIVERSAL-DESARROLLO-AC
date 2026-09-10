import { Clock3, MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
const CTA1 = () => (
    <div className="w-full bg-amber-50/40 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto flex max-w-3xl items-center justify-center">
            <div className="mt-8 w-full overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm lg:mt-14">
                <div className="h-1.5 w-full bg-amber-400" />
                <div className="flex flex-col items-center gap-5 px-6 py-8 text-center sm:px-10 sm:py-10 lg:px-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-50/70">
                        <Clock3 className="h-9 w-9 text-amber-500" strokeWidth={1.7} aria-hidden="true" />
                    </div>
                    <Badge className="border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        Pago en proceso
                    </Badge>
                    <div className="flex max-w-xl flex-col gap-3">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Estamos validando tu pago
                        </h3>
                        <p className="text-base leading-7 text-slate-600 sm:text-lg">
                            La plataforma de pagos está verificando la transacción. Este proceso puede tardar algunos minutos dependiendo del método de pago o del banco emisor.
                        </p>
                        <p className="text-base leading-7 text-slate-600 sm:text-lg">
                            Te notificaremos automáticamente cuando el pago sea aprobado o rechazado.
                        </p>
                    </div>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="h-12 w-full gap-3 rounded-xl bg-amber-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-amber-600 sm:w-auto">
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
