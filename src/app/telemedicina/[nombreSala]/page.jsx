import TelemedicinaSala from "@/Componentes/TelemedicinaSala";

export default async function UnirseTelemedicina({ params, searchParams }) {
    const { nombreSala } = await params;
    const parametros = await searchParams;
    const invitacion = typeof parametros.i === "string" ? parametros.i : "";

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
            <div className="w-full max-w-5xl rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8">
                <div className="mb-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Agenda Clínica</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Videollamada clínica</h1>
                    <p className="mt-2 text-sm text-slate-500">Conéctate con el profesional desde un lugar privado y con buena conexión.</p>
                </div>
                {invitacion ? (
                    <TelemedicinaSala modo="paciente" nombreSalaInicial={nombreSala} invitacionInicial={invitacion} />
                ) : (
                    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
                        El enlace de invitación está incompleto. Solicita uno nuevo al profesional.
                    </p>
                )}
            </div>
        </main>
    );
}
