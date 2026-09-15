import { redirect } from "next/navigation";

// El registro de pacientes dejo de ser una pagina propia: ahora es un modal dentro
// del listado. La ruta se mantiene viva para no romper enlaces ya guardados.
export default function GestionPacienteRedirect() {
  redirect("/dashboard/listaPacientes");
}
