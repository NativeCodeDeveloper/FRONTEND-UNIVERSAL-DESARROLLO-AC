import Navegacion from "@/Componentes/PaginaPublica/Estructura/Navegacion";
import Pie from "@/Componentes/PaginaPublica/Estructura/Pie";
import { obtenerDatosEmpresa } from "@/lib/paginaPublica/api";
import "./paginaPublica.css";

/* Siempre con datos frescos del backend: lo que el centro edita en el dashboard se ve en la siguiente visita */
export const dynamic = "force-dynamic";

/*
 * Página pública del centro: inicio, profesionales y reserva.
 * Tiene su propio layout (navegación y pie premium) y no hereda el de (public), que siguen
 * usando el resto de páginas públicas (carrito, producto, contacto, pagos…).
 */
export default async function LayoutPaginaPublica({ children }) {
  const datosEmpresa = await obtenerDatosEmpresa();

  return (
    <div className="pagina-publica flex min-h-screen flex-col">
      <Navegacion />
      <main className="flex-1">{children}</main>
      <Pie datosEmpresa={datosEmpresa} />
    </div>
  );
}
