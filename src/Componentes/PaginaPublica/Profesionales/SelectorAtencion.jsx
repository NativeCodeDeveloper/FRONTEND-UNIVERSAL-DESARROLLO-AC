"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import GrillaProfesionales from "@/Componentes/PaginaPublica/Profesionales/GrillaProfesionales";
import { IconoCheck, IconoChevron } from "@/Componentes/PaginaPublica/Comunes/Iconos";
import { agruparCategorias, claveCategoria, filtrarPorCategoria } from "@/lib/categoriasAtencion";

/*
 * Reserva de hora por pasos: el paciente elige el tipo de atención y ve solo a
 * los profesionales que la atienden; la hora se elige después, en la ficha del
 * profesional (/agendaEspecificaProfersional/[id]).
 *
 * Las categorías salen del campo `categoriaProfesional` de cada profesional (se
 * escribe en el dashboard, ver src/lib/categoriasAtencion.js). Con menos de dos
 * categorías el paso no aporta nada y se muestra la grilla directa, que es lo que
 * pasa mientras el backend no guarde el campo.
 *
 * La elección queda en la URL (?atencion=odontologia) para que el botón "atrás"
 * del navegador y los enlaces compartidos funcionen.
 */

const PASOS = [
  { id: "atencion", etiqueta: "Atención" },
  { id: "profesional", etiqueta: "Profesional" },
  { id: "hora", etiqueta: "Hora" },
];

/* Desde cuántas categorías se ofrece el buscador en vez de solo tarjetas */
const CATEGORIAS_SIN_BUSCADOR = 8;

/* "todos" = ver a todo el equipo sin filtrar */
const TODOS = "todos";
const PARAMETRO = "atencion";

function leerUrl() {
  return new URLSearchParams(window.location.search).get(PARAMETRO);
}

function escribirUrl(clave) {
  const url = new URL(window.location.href);
  if (clave) url.searchParams.set(PARAMETRO, clave);
  else url.searchParams.delete(PARAMETRO);
  window.history.pushState(null, "", url);
}

function subirAlAsistente() {
  const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("reserva-pasos")?.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "start" });
}

/* Barra de progreso: hecho = check, actual = número con halo, pendiente = punto */
function BarraPasos({ indice }) {
  return (
    <ol className="flex items-center" aria-label="Progreso de la reserva">
      {PASOS.map((paso, i) => {
        const hecho = i < indice;
        const actual = i === indice;
        return (
          <Fragment key={paso.id}>
            {i > 0 && (
              <span aria-hidden className={`mx-2 h-px min-w-4 flex-1 ${i <= indice ? "bg-acento" : "bg-linea"}`} />
            )}
            <li className="flex shrink-0 items-center gap-2" aria-current={actual ? "step" : undefined}>
              <span
                className={`flex items-center justify-center rounded-full text-white ${
                  hecho || actual ? "bg-acento" : "bg-linea"
                } ${actual ? "size-7 ring-4 ring-acento-suave" : hecho ? "size-6" : "size-2"}`}
              >
                {hecho && <IconoCheck className="h-3.5 w-3.5" />}
                {actual && <span className="text-[12px] font-semibold">{i + 1}</span>}
              </span>
              <span className={`text-[13px] ${actual ? "font-medium text-tinta" : "hidden text-tinta-3 sm:inline"}`}>
                {paso.etiqueta}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

function TarjetaCategoria({ categoria, onElegir }) {
  return (
    <button
      type="button"
      onClick={onElegir}
      className="group flex min-h-[76px] w-full items-center justify-between gap-3 rounded-2xl bg-niebla px-5 py-4 text-left transition-[background-color,box-shadow] duration-200 hover:bg-acento-suave hover:shadow-[inset_0_0_0_1px_var(--pp-acento)]"
    >
      <span className="min-w-0">
        <span className="block text-[16px] font-medium leading-snug text-tinta [overflow-wrap:anywhere]">{categoria.nombre}</span>
        <span className="mt-0.5 block text-[13px] text-tinta-3">
          {categoria.cantidad} {categoria.cantidad === 1 ? "profesional" : "profesionales"}
        </span>
      </span>
      <IconoChevron className="h-4 w-4 shrink-0 text-tinta-3 transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-acento" />
    </button>
  );
}

function PasoAtencion({ categorias, total, onElegir }) {
  const [busqueda, setBusqueda] = useState("");
  const conBuscador = categorias.length > CATEGORIAS_SIN_BUSCADOR;
  const termino = claveCategoria(busqueda);
  const visibles = termino ? categorias.filter((c) => c.clave.includes(termino)) : categorias;

  return (
    <>
      <h2 className="titular-3">¿Qué tipo de atención necesitas?</h2>
      <p className="mt-1.5 text-[15px] text-tinta-2">Elige una y te mostramos a los profesionales que la atienden.</p>

      {conBuscador && (
        <div className="mt-6">
          <label htmlFor="buscar-atencion" className="sr-only">
            Buscar tipo de atención
          </label>
          <input
            id="buscar-atencion"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca tu atención, por ejemplo: Odontología"
            autoComplete="off"
            className="campo"
          />
        </div>
      )}

      {visibles.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((categoria) => (
            <li key={categoria.clave}>
              <TarjetaCategoria categoria={categoria} onElegir={() => onElegir(categoria.clave)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl bg-niebla px-5 py-4 text-[15px] text-tinta-2">
          No encontramos «{busqueda.trim()}». Prueba con otra palabra o revisa todo el equipo.
        </p>
      )}

      <div className="mt-6 border-t border-linea-suave pt-5">
        <button type="button" onClick={() => onElegir(TODOS)} className="enlace text-[15px]">
          No sé cuál elegir: ver los {total} profesionales
        </button>
      </div>
    </>
  );
}

export default function SelectorAtencion({ profesionales, preciosDesde = {} }) {
  const categorias = useMemo(() => agruparCategorias(profesionales), [profesionales]);
  const [eleccion, setEleccion] = useState(null); // null | clave de categoría | TODOS

  /* La elección sigue a la URL: al cargar y con los botones atrás/adelante */
  useEffect(() => {
    const sincronizar = () => {
      const clave = leerUrl();
      setEleccion(clave === TODOS || categorias.some((c) => c.clave === clave) ? clave : null);
    };
    sincronizar();
    window.addEventListener("popstate", sincronizar);
    return () => window.removeEventListener("popstate", sincronizar);
  }, [categorias]);

  /* Sin al menos dos categorías no hay nada que elegir */
  if (categorias.length < 2) {
    return <GrillaProfesionales profesionales={profesionales} preciosDesde={preciosDesde} />;
  }

  const elegir = (clave) => {
    escribirUrl(clave);
    setEleccion(clave);
    subirAlAsistente();
  };

  const categoria = categorias.find((c) => c.clave === eleccion) ?? null;
  const enProfesionales = eleccion !== null;
  const lista = categoria ? filtrarPorCategoria(profesionales, categoria.clave) : profesionales;

  return (
    <div id="reserva-pasos" className="scroll-mt-24">
      <div className="caja overflow-hidden">
        <div className="border-b border-linea-suave px-5 py-4 sm:px-8">
          <BarraPasos indice={enProfesionales ? 1 : 0} />
        </div>

        <div key={eleccion ?? "inicio"} className="animar-modal px-5 py-7 sm:px-8 sm:py-8">
          {enProfesionales ? (
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <h2 className="titular-3 [overflow-wrap:anywhere]">{categoria ? categoria.nombre : "Todo el equipo"}</h2>
                <p className="mt-1.5 text-[15px] text-tinta-2">
                  {lista.length} {lista.length === 1 ? "profesional disponible" : "profesionales disponibles"}. Elige uno para ver
                  sus horas.
                </p>
              </div>
              <button type="button" onClick={() => elegir(null)} className="boton boton-tenue !min-h-10 !text-[15px]">
                <IconoChevron direccion="izquierda" className="h-4 w-4" />
                Cambiar atención
              </button>
            </div>
          ) : (
            <PasoAtencion categorias={categorias} total={profesionales.length} onElegir={elegir} />
          )}
        </div>
      </div>

      {enProfesionales && (
        <div className="mt-8">
          <GrillaProfesionales profesionales={lista} preciosDesde={preciosDesde} />
        </div>
      )}
    </div>
  );
}
