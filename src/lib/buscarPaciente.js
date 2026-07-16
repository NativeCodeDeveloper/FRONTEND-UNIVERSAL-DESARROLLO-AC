// Autofill de datos de paciente por RUT — reusa /pacientes/contieneRut,
// el mismo endpoint que ya usan calendario, listaPacientes y GestionPaciente.
import { cleanRut } from "@/lib/designTokens";

const API = () => process.env.NEXT_PUBLIC_API_URL;

// null = no se encontró ningún paciente con ese RUT (caso normal, no es un error).
// Lanza si la consulta en sí falla (red/servidor) para que el llamador pueda
// distinguir "no existe" de "no se pudo consultar".
export async function buscarPacientePorRut(rut) {
    const rutNormalizado = cleanRut(rut);
    if (!rutNormalizado) return null;

    const res = await fetch(`${API()}/pacientes/contieneRut`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ rut: rutNormalizado }),
    });
    if (!res.ok) {
        throw new Error("No fue posible consultar los datos del paciente.");
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada al consultar los datos del paciente.");
    }

    return data.find((p) => cleanRut(p.rut) === rutNormalizado) || null;
}
