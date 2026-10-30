"use client";

import { Fragment, useState } from "react";
import { Ambulance, Bone, HandHeart, MapPin, MonitorSmartphone, Scan, Stethoscope, Syringe, TestTubes } from "lucide-react";
import GrillaProfesionales from "@/Componentes/PaginaPublica/Profesionales/GrillaProfesionales";
import { IconoCheck, IconoChevron } from "@/Componentes/PaginaPublica/Comunes/Iconos";

/*
 * Asistente previo a la grilla, en un panel compacto al estilo de la portada:
 * el paciente elige la sucursal, después el tipo de atención y recién entonces
 * ve a los profesionales.
 *
 * HARDCodeado a propósito: las sucursales y las categorías (y sus ubicaciones,
 * que se vienen después) todavía no existen en los datos del centro. Cuando haya
 * datos reales, reemplazar SUCURSALES y CATEGORIAS_ATENCION y conectar el cruce
 * en filtrarPorCategoria.
 */

const PASOS = [
  { id: "sucursal", etiqueta: "Sucursal" },
  { id: "categoria", etiqueta: "Tipo de atención" },
  { id: "profesionales", etiqueta: "Profesional" },
];

/* HARDCodeado: reemplazar por las sucursales reales del centro */
const SUCURSALES = [
  { id: "sucursal-centro", nombre: "Sucursal Centro" },
  { id: "sucursal-norte", nombre: "Sucursal Norte" },
  { id: "sucursal-sur", nombre: "Sucursal Sur" },
];

/* Lucide no trae diente; mismo trazo y caja que el resto de los íconos. */
function IconoDental({ className, strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5.6c-1.5-1.9-4.1-2.4-5.8-1.1-1.7 1.2-2.1 3.5-1.5 5.5.6 2 .9 4.5 1.2 6.8.2 1.4.5 3.2 1.7 3.2 1.5 0 1.3-2 1.6-3.8.3-1.7.7-3.7 2.8-3.7s2.5 2 2.8 3.7c.3 1.8.1 3.8 1.6 3.8 1.2 0 1.5-1.8 1.7-3.2.3-2.3.6-4.8 1.2-6.8.6-2 .2-4.3-1.5-5.5-1.7-1.3-4.3-.8-5.8 1.1z" />
    </svg>
  );
}

const CATEGORIAS_ATENCION = [
  { id: "consultas", nombre: "Consultas", Icono: Stethoscope },
  { id: "dental", nombre: "Dental", Icono: IconoDental },
  { id: "imagenes", nombre: "Imágenes y Procedimientos", Icono: Scan },
  { id: "telemedicina", nombre: "Telemedicina", Icono: MonitorSmartphone },
  { id: "kinesiologia", nombre: "Kinesiología", Icono: Bone },
  { id: "laboratorio", nombre: "Laboratorio y Toma de Muestras", Icono: TestTubes },
  { id: "vacunatorio", nombre: "Vacunatorio", Icono: Syringe },
  { id: "domicilio", nombre: "Toma de muestras a domicilio", Icono: Ambulance },
  { id: "donacion", nombre: "Donación de Sangre", Icono: HandHeart },
];

/* Fondos pastel que se rotan entre tarjetas, como en el diseño de referencia */
const FONDOS = ["bg-[#dfecea]", "bg-[#edf3f2]", "bg-[#eef1d8]"];

/* La página baja suave al cambiar de paso, salvo que el equipo pida menos movimiento */
function subirSuave() {
  const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: sinMovimiento ? "auto" : "smooth" });
}

/*
 * Todavía no hay forma real de cruzar profesionales con sucursal ni categoría (la
 * tabla de profesionales no tiene ese dato). Cuando exista —o cuando se agreguen
 * las ubicaciones— el cruce va acá.
 */
const filtrarPorCategoria = (profesionales) => profesionales;

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
              <span aria-hidden className={`h-0.5 min-w-4 flex-1 rounded-full ${i <= indice ? "bg-acento" : "bg-linea-suave"}`} />
            )}
            <li className="flex shrink-0 items-center gap-2" aria-current={actual ? "step" : undefined}>
              <span
                className={`flex items-center justify-center rounded-full text-white ${
                  hecho || actual ? "bg-acento" : "bg-linea-suave"
                } ${actual ? "size-8 ring-4 ring-acento-suave" : hecho ? "size-7" : "size-2.5"}`}
              >
                {hecho && <IconoCheck className="h-4 w-4" />}
                {actual && <span className="text-[13px] font-semibold">{i + 1}</span>}
              </span>
              <span className={`hidden text-[13px] md:block ${actual ? "font-semibold text-tinta" : "text-tinta-3"}`}>
                {paso.etiqueta}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

function TarjetaOpcion({ opcion, fondo, seleccionada, onElegir }) {
  /* Las sucursales no llevan ícono propio: por defecto, pin de ubicación */
  const { Icono = MapPin } = opcion;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onElegir}
      className={`h-full overflow-hidden rounded-[18px] border bg-papel text-left transition-shadow duration-300 ${
        seleccionada ? "border-acento shadow-caja-alta ring-2 ring-acento" : "border-linea-suave hover:shadow-caja"
      }`}
    >
      <span className={`relative flex aspect-[5/4] items-center justify-center ${fondo}`}>
        <Icono className="h-10 w-10 text-acento-hondo" strokeWidth={1.6} />
        <span
          className={`absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-200 ${
            seleccionada ? "bg-acento text-white" : "bg-white text-transparent"
          }`}
        >
          <IconoCheck className="h-3.5 w-3.5" />
        </span>
      </span>
      <span className="flex flex-1 items-center justify-center px-2.5 py-3 text-center text-[14px] font-medium leading-snug">
        {opcion.nombre}
      </span>
    </button>
  );
}

/* Grilla de tarjetas de un paso de elección */
function GrillaOpciones({ opciones, valor, onElegir, columnas }) {
  return (
    <div role="radiogroup" className={`mt-6 grid gap-3.5 sm:gap-4 ${columnas}`}>
      {opciones.map((opcion, i) => (
        <TarjetaOpcion
          key={opcion.id}
          opcion={opcion}
          fondo={FONDOS[i % FONDOS.length]}
          seleccionada={opcion.id === valor}
          onElegir={() => onElegir(opcion.id)}
        />
      ))}
    </div>
  );
}

export default function SelectorAtencion({ profesionales, preciosDesde = {} }) {
  const [sucursalId, setSucursalId] = useState(null);
  const [categoriaId, setCategoriaId] = useState(null);
  const [paso, setPaso] = useState("sucursal"); // "sucursal" | "categoria" | "profesionales"

  const irA = (pasoNuevo) => {
    setPaso(pasoNuevo);
    subirSuave();
  };

  const indice = PASOS.findIndex((p) => p.id === paso);
  const esPrimero = indice === 0;
  const esUltimo = indice === PASOS.length - 1;

  const sucursalElegida = SUCURSALES.find((s) => s.id === sucursalId) ?? null;
  const categoriaElegida = CATEGORIAS_ATENCION.find((c) => c.id === categoriaId) ?? null;

  let titulo, subtitulo, eleccion;
  if (paso === "sucursal") {
    titulo = "¿En qué sucursal quieres atenderte?";
    subtitulo = "Selecciona la sucursal donde quieres reservar tu hora.";
    eleccion = sucursalElegida;
  } else if (paso === "categoria") {
    titulo = "¿Qué tipo de atención necesitas?";
    subtitulo = "Selecciona el servicio que necesites.";
    eleccion = categoriaElegida;
  } else {
    titulo = "Profesionales disponibles";
    subtitulo = `${sucursalElegida.nombre} · ${categoriaElegida.nombre}`;
  }

  return (
    <div className="caja overflow-hidden rounded-[28px]">
      {/* Encabezado del asistente */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-linea-suave px-6 pt-6 md:px-8">
        <h2 className="text-[19px] font-semibold tracking-tight">Reserva de hora</h2>
        <p className="text-[14px] text-tinta-3">
          Paso {indice + 1} de {PASOS.length}: <span className="text-tinta-2">{PASOS[indice].etiqueta}</span>
        </p>
      </header>
      <div className="border-b border-linea-suave px-6 py-4 md:px-8">
        <BarraPasos indice={indice} />
      </div>

      {/* Contenido del paso */}
      <div key={paso} className="animar-modal px-6 py-7 md:px-8">
        <h3 className="titular-3">{titulo}</h3>
        <p className="mt-1.5 text-tinta-2">{subtitulo}</p>

        {paso === "sucursal" && (
          <GrillaOpciones
            opciones={SUCURSALES}
            valor={sucursalId}
            onElegir={setSucursalId}
            columnas="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          />
        )}
        {paso === "categoria" && (
          <GrillaOpciones
            opciones={CATEGORIAS_ATENCION}
            valor={categoriaId}
            onElegir={setCategoriaId}
            columnas="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          />
        )}
        {paso === "profesionales" && (
          <div className="mt-6">
            <GrillaProfesionales
              profesionales={filtrarPorCategoria(profesionales, sucursalElegida, categoriaElegida)}
              preciosDesde={preciosDesde}
            />
          </div>
        )}
      </div>

      {/* Barra inferior: volver a la izquierda, Continuar a la derecha */}
      <footer className="flex items-center gap-4 border-t border-linea-suave px-6 py-4 md:px-8">
        {esPrimero ? (
          <span aria-hidden className="size-12 shrink-0" />
        ) : (
          <button
            type="button"
            onClick={() => irA(PASOS[indice - 1].id)}
            aria-label="Volver al paso anterior"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-acento-suave text-acento-hondo transition-colors hover:bg-acento hover:text-white"
          >
            <IconoChevron direccion="izquierda" className="h-5 w-5" />
          </button>
        )}

        {!esUltimo && (
          <div className="ml-auto flex items-center gap-4">
            <p className="hidden text-[14px] text-tinta-3 sm:block">
              {eleccion ? (
                <>
                  Elegiste <span className="font-medium text-tinta">{eleccion.nombre}</span>
                </>
              ) : (
                "Elige una opción para continuar"
              )}
            </p>
            <button
              type="button"
              onClick={() => irA(PASOS[indice + 1].id)}
              disabled={!eleccion}
              className="boton boton-principal min-w-[170px]"
            >
              Continuar
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
