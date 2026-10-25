import TarjetaProfesional from "@/Componentes/PaginaPublica/Profesionales/TarjetaProfesional";

/* Grilla de profesionales del centro. */
export default function GrillaProfesionales({ profesionales, preciosDesde = {} }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {profesionales.map((p, i) => (
        <li key={p.id_profesional} className="animar-modal" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <TarjetaProfesional profesional={p} desde={preciosDesde[p.id_profesional] ?? null} />
        </li>
      ))}
    </ul>
  );
}
