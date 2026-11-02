import TelemedicinaSala from "@/Componentes/TelemedicinaSala";

// El nombre del profesional viaja dentro del payload firmado de la invitación.
// Acá solo se decodifica para el encabezado (la firma se verifica en el
// backend al pedir el token, no al mostrar el enlace).
function leerNombreProfesional(invitacion) {
    try {
        const [payload] = invitacion.split(".");
        const datos = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        return typeof datos.nombreProfesional === "string" && datos.nombreProfesional.trim()
            ? datos.nombreProfesional.trim().slice(0, 80)
            : "";
    } catch {
        return "";
    }
}

export default async function UnirseTelemedicina({ params, searchParams }) {
    const { nombreSala } = await params;
    const parametros = await searchParams;
    const invitacion = typeof parametros.i === "string" ? parametros.i : "";
    const nombreProfesional = invitacion ? leerNombreProfesional(invitacion) : "";

    return (
        <main className="font-system-apple flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4 py-10">
            <div className="w-full max-w-4xl">
                <div className="mb-6 text-center">
                    <h1 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[32px]">
                        {nombreProfesional ? `Videollamada con ${nombreProfesional}` : "Videollamada clínica"}
                    </h1>
                    <p className="mt-1.5 text-[15px] text-[#6E6E73]">Conéctate desde un lugar privado y con buena conexión.</p>
                </div>
                {invitacion ? (
                    <TelemedicinaSala modo="paciente" nombreSalaInicial={nombreSala} invitacionInicial={invitacion} />
                ) : (
                    <p role="alert" className="mx-auto max-w-xl rounded-2xl bg-[#FF3B30]/10 px-4 py-3 text-center text-[15px] text-[#C4291D]">
                        El enlace de invitación está incompleto. Pídele uno nuevo al profesional.
                    </p>
                )}
            </div>
        </main>
    );
}
