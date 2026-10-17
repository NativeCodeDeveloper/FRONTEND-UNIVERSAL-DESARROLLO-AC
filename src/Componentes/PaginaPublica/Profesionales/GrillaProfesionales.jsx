"use client";

import { useMemo, useState } from "react";
import { categoriasVisibles } from "@/lib/paginaPublica/categorias";
import TarjetaProfesional from "@/Componentes/PaginaPublica/Profesionales/TarjetaProfesional";

/*
 * Grilla de profesionales con filtro por categoría (control segmentado).
 * Las reglas de qué categorías aparecen viven en categoriasVisibles(); los profesionales
 * sin categoría solo se ven en "Todos".
 */
export default function GrillaProfesionales({ profesionales, categorias, preciosDesde = {} }) {
  const visibles = useMemo(() => categoriasVisibles(categorias, profesionales), [categorias, profesionales]);
  const [filtro, setFiltro] = useState(null);

  const lista = filtro === null ? profesionales : profesionales.filter((p) => p.id_categoriaProfesional === filtro);

  return (
    <>
      {visibles.length > 0 && (
        <div className="sin-barra -mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0">
          <div className="inline-flex gap-1 rounded-full bg-[#e8e8ed] p-1" role="tablist" aria-label="Filtrar por categoría">
            {[{ id_categoriaProfesional: null, nombreCategoria: "Todos" }, ...visibles].map((c) => {
              const activo = filtro === c.id_categoriaProfesional;
              return (
                <button
                  key={c.id_categoriaProfesional ?? "todos"}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setFiltro(c.id_categoriaProfesional)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] font-medium transition-all duration-300 ${
                    activo ? "bg-white text-tinta shadow-caja" : "text-tinta-2 hover:text-tinta"
                  }`}
                >
                  {c.nombreCategoria}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* key: al cambiar de categoría las tarjetas vuelven a entrar con su animación */}
      <ul key={filtro ?? "todos"} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {lista.map((p, i) => (
          <li key={p.id_profesional} className="animar-modal" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <TarjetaProfesional profesional={p} desde={preciosDesde[p.id_profesional] ?? null} />
          </li>
        ))}
      </ul>
    </>
  );
}
