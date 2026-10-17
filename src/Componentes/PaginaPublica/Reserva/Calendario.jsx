"use client";

import { useMemo, useState } from "react";
import { claveDia, estadoDelDia, fechaLarga } from "@/lib/paginaPublica/agenda";
import { IconoChevron } from "@/Componentes/PaginaPublica/Comunes/Iconos";

const SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const MESES_ADELANTE = 2;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/*
 * Calendario mensual de la reserva. Trabaja con claves civiles "AAAA-MM-DD" (ver CLAUDE.md):
 * `hoy` viene de la zona de la clínica y `seleccionada` / `alElegir` usan el mismo formato.
 * Un día queda deshabilitado si ya pasó o si el profesional lo bloqueó completo.
 */
export default function Calendario({ hoy, bloqueos, seleccionada, alElegir }) {
  const [desfase, setDesfase] = useState(0);

  const { anio, mes, titulo, celdas } = useMemo(() => {
    const [anioHoy, mesHoy] = hoy.split("-").map(Number);
    const total = mesHoy - 1 + desfase;
    const anio = anioHoy + Math.floor(total / 12);
    const mes = (total % 12) + 1;

    // fecha-ok: se arman con año, mes y día del calendario solo para saber largo del mes y día de la semana.
    const diasDelMes = new Date(anio, mes, 0).getDate();
    const primerDia = (new Date(anio, mes - 1, 1).getDay() + 6) % 7; // lunes = 0

    const celdas = Array(primerDia).fill(null);
    for (let dia = 1; dia <= diasDelMes; dia++) {
      const clave = claveDia(anio, mes, dia);
      celdas.push({ clave, dia, estado: estadoDelDia(clave, bloqueos, hoy) });
    }
    const nombreMes = MESES[mes - 1];
    return { anio, mes, titulo: `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} de ${anio}`, celdas };
  }, [hoy, desfase, bloqueos]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[17px] font-semibold tracking-tight" aria-live="polite">
          {titulo}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDesfase((d) => d - 1)}
            disabled={desfase === 0}
            aria-label="Mes anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-niebla text-tinta transition-colors hover:bg-linea-suave disabled:opacity-35"
          >
            <IconoChevron direccion="izquierda" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDesfase((d) => d + 1)}
            disabled={desfase === MESES_ADELANTE}
            aria-label="Mes siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-niebla text-tinta transition-colors hover:bg-linea-suave disabled:opacity-35"
          >
            <IconoChevron className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[12px] font-medium text-tinta-3" aria-hidden>
        {SEMANA.map((d, i) => (
          <span key={i} className="py-2">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={`Días de ${titulo}`} data-mes={`${anio}-${mes}`}>
        {celdas.map((c, i) => {
          if (!c) return <span key={`v${i}`} />;
          const elegida = c.clave === seleccionada;
          const esHoy = c.clave === hoy;
          const disponible = c.estado === "disponible";

          return (
            <div key={c.clave} className="flex justify-center">
              <button
                type="button"
                disabled={!disponible}
                onClick={() => alElegir(c.clave)}
                aria-pressed={elegida}
                aria-label={`${fechaLarga(c.clave)}${disponible ? "" : ", no disponible"}`}
                className={`relative flex h-11 w-11 items-center justify-center rounded-full text-[17px] transition-all duration-200 ${
                  elegida
                    ? "bg-acento font-semibold text-white"
                    : disponible
                      ? `font-medium hover:bg-niebla ${esHoy ? "text-acento" : "text-tinta"}`
                      : "text-[#c7c7cc]"
                }`}
              >
                {c.dia}
                {esHoy && !elegida && (
                  <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${disponible ? "bg-acento" : "bg-[#c7c7cc]"}`} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-tinta-2">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-tinta" />
          Disponible
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#c7c7cc]" />
          No disponible
        </li>
      </ul>
    </div>
  );
}
