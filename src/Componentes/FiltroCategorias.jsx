import React from "react";

export default function FiltroCategorias({ categoriasProductos = [], id_categoriaProducto = "", seleccionarCategoria = () => {} }) {
  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="bg-white shadow-sm rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-gray-700 font-semibold text-sm sm:mr-3">Filtrar por categorías</label>

        <div className="relative flex-1 w-full">
          <select
            className="appearance-none w-full h-11 pl-4 pr-10 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            value={id_categoriaProducto}
            onChange={(e) => seleccionarCategoria(e.target.value)}
            aria-label="Filtrar por categorías"
          >
            <option value="">Todas las categorías</option>
            {categoriasProductos.map((categoria) => (
              <option key={categoria.id_categoriaProducto} value={categoria.id_categoriaProducto}>
                {categoria.descripcionCategoria}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 011.08 1.04l-4.24 4.24a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}