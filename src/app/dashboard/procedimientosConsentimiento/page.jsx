"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { ChevronRight, FileSignature, History, Info, Plus, Search, X } from "lucide-react";
import { useProcedimientos } from "@/hooks/useProcedimientos";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { EDICION_DISPONIBLE, PROCEDIMIENTOS_EN_SERVIDOR } from "@/lib/consentimientos/apiProcedimientos";
import {
  CAMPOS_ANEXO,
  ESPECIALIDADES_SUGERIDAS,
  LIMITES,
  camposDesdeCuerpo,
  construirCuerpoAnexo,
  itemsDeLista,
  validarProcedimiento,
} from "@/lib/consentimientos/procedimientos";
import { bloquesDeTexto } from "@/lib/consentimientos/textosLegales";
import { mensajeError } from "@/lib/firma/constantes";
import { ZONA_CLINICA } from "@/lib/fechas";

/*
 * Procedimientos del consentimiento informado (anexos de la plantilla base).
 *
 * La clínica crea sus propios procedimientos llenando campos fijos (Ley 20.584,
 * art. 14: en qué consiste, riesgos, alternativas y consecuencias de no hacerlo).
 * Editar publica una versión nueva: lo ya firmado conserva la versión que leyó el
 * paciente. Administradores (y el técnico, como soporte) crean y editan; los
 * profesionales consultan. Reglas y formato: src/lib/consentimientos/procedimientos.js.
 */

// Colores del sistema de Apple, uno por especialidad (siempre el mismo para el mismo nombre).
// Sin el rojo (#FF3B30): en iOS significa error o acción destructiva.
const COLORES_APPLE = ["#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#FF9500", "#34C759", "#30B0C7", "#00C7BE", "#5AC8FA", "#A2845E"];
function colorDe(grupo) {
  let h = 0;
  for (const c of String(grupo)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES_APPLE[h % COLORES_APPLE.length];
}

function formatearFecha(iso) {
  if (!iso) return "";
  // fecha-ok: instante real del servidor; se muestra en la zona de la clínica.
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: ZONA_CLINICA }).format(new Date(iso));
}

const campoClase =
  "w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] text-[#1D1D1F] outline-none transition placeholder:text-[#AEAEB2] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15";

// ── Piezas visuales ─────────────────────────────────────────────────────────

function Hoja({ abierta, onCerrar, titulo, subtitulo, ancho = "max-w-2xl", children, pie }) {
  const cerrarRef = useRef(null);
  // onCerrar en una ref: si cambia en cada render, el efecto no debe repetirse
  // (volvería a mover el foco al botón de cerrar mientras se escribe).
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;
  useEffect(() => {
    if (!abierta) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onCerrarRef.current();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => cerrarRef.current?.focus());
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierta]);

  if (!abierta || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div onClick={onCerrar} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className={`font-system-apple relative flex max-h-[94dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-[24px] bg-[#F2F2F7] shadow-2xl sm:rounded-[24px]`}>
        <div className="flex justify-center pt-3 sm:hidden"><div className="h-1 w-10 rounded-full bg-[#C7C7CC]" /></div>
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#1D1D1F]">{titulo}</h2>
            {subtitulo ? <div className="mt-1 text-[13px] text-[#6E6E73]">{subtitulo}</div> : null}
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#767680]/[0.12] text-[#6E6E73] transition-colors hover:bg-[#767680]/[0.2]">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-7">{children}</div>
        {pie ? <footer className="border-t border-black/[0.06] bg-white/80 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-7">{pie}</footer> : null}
      </div>
    </div>,
    document.body
  );
}

function Segmentado({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex rounded-[9px] bg-[#767680]/[0.12] p-[2px]">
      {opciones.map(([v, texto]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} onClick={() => onCambio(v)}
          className={`h-7 rounded-[7px] px-3.5 text-[13px] font-medium transition-all ${valor === v ? "bg-white text-[#1D1D1F] shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]" : "text-[#3C3C43]"}`}>
          {texto}
        </button>
      ))}
    </div>
  );
}

function Etiqueta({ children, tono = "gris" }) {
  const clases = { gris: "bg-[#767680]/[0.12] text-[#6E6E73]", azul: "bg-[#007AFF]/10 text-[#0062CC]", verde: "bg-[#34C759]/12 text-[#1E7B34]" };
  return <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${clases[tono]}`}>{children}</span>;
}

function IconoGrupo({ grupo, tamano = "h-[30px] w-[30px]" }) {
  return (
    <span className={`flex ${tamano} shrink-0 items-center justify-center rounded-[8px] text-white`} style={{ backgroundColor: colorDe(grupo) }} aria-hidden="true">
      <FileSignature className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

/** El anexo tal como lo leerá el paciente. */
function VistaAnexo({ cuerpo, vacio = "Completa los campos para ver el texto." }) {
  const bloques = bloquesDeTexto(cuerpo);
  if (!bloques.length) return <p className="py-8 text-center text-[13px] text-[#AEAEB2]">{vacio}</p>;
  return (
    <div className="space-y-2.5 text-[14px] leading-relaxed text-[#3A3A3C]">
      {bloques.map((b, i) =>
        b.tipo === "titulo" ? (
          <h4 key={i} className="pt-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#1D1D1F] first:pt-0">{b.texto}</h4>
        ) : b.tipo === "lista" ? (
          <ul key={i} className="space-y-1 pl-5 marker:text-[#C7C7CC] [list-style:disc]">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        ) : (
          <p key={i} className="text-justify hyphens-auto" lang="es">{b.texto}</p>
        )
      )}
    </div>
  );
}

function Tarjeta({ children, className = "" }) {
  return <div className={`overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] ${className}`}>{children}</div>;
}

// ── Editor ──────────────────────────────────────────────────────────────────

const CAMPOS_VACIOS = Object.fromEntries(CAMPOS_ANEXO.map((d) => [d.clave, ""]));

function EditorProcedimiento({ abierto, procedimiento, onCerrar, onGuardado, api, gruposExistentes }) {
  const editando = Boolean(procedimiento);
  const [nombre, setNombre] = useState("");
  const [grupo, setGrupo] = useState("");
  const [campos, setCampos] = useState(CAMPOS_VACIOS);
  const [errores, setErrores] = useState({});
  const [vista, setVista] = useState("editar");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombre(procedimiento?.nombre || "");
    setGrupo(procedimiento?.grupo || "");
    setCampos(procedimiento ? { ...CAMPOS_VACIOS, ...camposDesdeCuerpo(procedimiento.cuerpo) } : CAMPOS_VACIOS);
    setErrores({});
    setVista("editar");
  }, [abierto, procedimiento]);

  const cuerpo = useMemo(() => construirCuerpoAnexo(campos), [campos]);
  const sugerencias = useMemo(() => [...new Set([...gruposExistentes, ...ESPECIALIDADES_SUGERIDAS])].sort((a, b) => a.localeCompare(b, "es")), [gruposExistentes]);

  async function publicar() {
    const encontrados = validarProcedimiento({ nombre, grupo, campos });
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setVista("editar");
      toast.error("Revisa los campos marcados.");
      return;
    }
    setGuardando(true);
    try {
      const datos = { nombre: nombre.trim(), grupo: grupo.trim(), campos };
      const r = editando ? await api.nuevaVersion({ codigo: procedimiento.codigo, ...datos }) : await api.crear(datos);
      toast.success(editando ? `Versión ${r.procedimiento.version} publicada.` : "Procedimiento creado.");
      onGuardado(r.procedimiento);
    } catch (e) {
      toast.error(mensajeError(e?.codigo));
    } finally {
      setGuardando(false);
    }
  }

  const formulario = (
    <div className="space-y-4">
      <Tarjeta className="space-y-4 p-4 sm:p-5">
        <label className="block">
          <span className="block text-[13px] font-medium text-[#1D1D1F]">Nombre del procedimiento</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value.slice(0, LIMITES.nombre))}
            placeholder="Ej: Relleno de labios con ácido hialurónico" className={`${campoClase} mt-2 h-11`} aria-invalid={Boolean(errores.nombre)} />
          {errores.nombre ? <span className="mt-1 block text-[12px] text-[#FF3B30]">{errores.nombre}</span> : null}
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-[#1D1D1F]">Especialidad</span>
          <span className="mt-0.5 block text-[12px] text-[#86868B]">Agrupa el procedimiento en la lista. Elige una o escribe otra.</span>
          <input list="especialidades-procedimiento" value={grupo} onChange={(e) => setGrupo(e.target.value.slice(0, LIMITES.grupo))}
            placeholder="Ej: Armonización facial" className={`${campoClase} mt-2 h-11`} aria-invalid={Boolean(errores.grupo)} />
          <datalist id="especialidades-procedimiento">{sugerencias.map((g) => <option key={g} value={g} />)}</datalist>
          {errores.grupo ? <span className="mt-1 block text-[12px] text-[#FF3B30]">{errores.grupo}</span> : null}
        </label>
      </Tarjeta>

      {CAMPOS_ANEXO.map((def) => {
        const valor = campos[def.clave];
        const items = def.tipo === "lista" ? itemsDeLista(valor).length : 0;
        return (
          <Tarjeta key={def.clave} className="p-4 sm:p-5">
            <label className="block">
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[#1D1D1F]">{def.titulo}</span>
                {def.obligatorio ? <Etiqueta tono="azul">Obligatorio</Etiqueta> : <Etiqueta>Opcional</Etiqueta>}
                {def.tipo === "lista" && items ? <span className="ml-auto text-[12px] text-[#86868B]">{items} {items === 1 ? "ítem" : "ítems"}</span> : null}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-[#86868B]">{def.ayuda}</span>
              <textarea
                rows={def.tipo === "lista" ? 4 : 3}
                value={valor}
                onChange={(e) => {
                  setCampos((c) => ({ ...c, [def.clave]: e.target.value.slice(0, LIMITES.campo) }));
                  if (errores[def.clave]) setErrores((er) => ({ ...er, [def.clave]: undefined }));
                }}
                placeholder={def.ejemplo}
                aria-invalid={Boolean(errores[def.clave])}
                className={`${campoClase} mt-2.5 resize-y py-2.5 leading-relaxed`}
              />
            </label>
            {errores[def.clave] ? <p className="mt-1 text-[12px] text-[#FF3B30]">{errores[def.clave]}</p> : null}
          </Tarjeta>
        );
      })}
    </div>
  );

  const vistaPrevia = (
    <Tarjeta className="p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#007AFF]">Así lo leerá el paciente</p>
      <p className="mt-1 text-[17px] font-semibold text-[#1D1D1F]">{nombre.trim() || "Nombre del procedimiento"}</p>
      <p className="mb-4 text-[13px] text-[#6E6E73]">Se agrega como anexo al consentimiento base, después de la declaración del paciente.</p>
      <VistaAnexo cuerpo={cuerpo} />
    </Tarjeta>
  );

  return (
    <Hoja
      abierta={abierto}
      onCerrar={guardando ? () => {} : onCerrar}
      ancho="max-w-6xl"
      titulo={editando ? "Editar procedimiento" : "Nuevo procedimiento"}
      subtitulo={editando
        ? `Se publicará la versión ${procedimiento.version + 1}. Los consentimientos ya firmados conservan la versión ${procedimiento.version}.`
        : "Completa los puntos que exige la Ley 20.584 (art. 14). El texto se arma solo."}
      pie={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-snug text-[#86868B] sm:max-w-md">
            Revisa el texto con el director técnico del centro antes de publicarlo.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onCerrar} disabled={guardando}
              className="h-11 flex-1 rounded-full px-5 text-[15px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 sm:flex-none">Cancelar</button>
            <button type="button" onClick={publicar} disabled={guardando}
              className="h-11 flex-1 whitespace-nowrap rounded-full bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC] disabled:opacity-50 sm:flex-none">
              {guardando ? "Publicando…" : editando ? "Publicar versión" : <><span className="sm:hidden">Crear</span><span className="hidden sm:inline">Crear procedimiento</span></>}
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-4 flex justify-center lg:hidden">
        <Segmentado etiqueta="Vista" valor={vista} onCambio={setVista} opciones={[["editar", "Editar"], ["previa", "Vista previa"]]} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className={vista === "editar" ? "" : "hidden lg:block"}>{formulario}</div>
        <div className={`${vista === "previa" ? "" : "hidden lg:block"} lg:sticky lg:top-0 lg:self-start`}>{vistaPrevia}</div>
      </div>
    </Hoja>
  );
}

// ── Detalle ─────────────────────────────────────────────────────────────────

function DetalleProcedimiento({ procedimiento, onCerrar, puedeEditar, onEditar, onRetirado, api }) {
  const [vista, setVista] = useState("contenido");
  const [versiones, setVersiones] = useState(null);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const [retirando, setRetirando] = useState(false);

  useEffect(() => {
    setVista("contenido");
    setVersiones(null);
    setConfirmarRetiro(false);
  }, [procedimiento]);

  useEffect(() => {
    if (vista !== "historial" || versiones || !procedimiento) return;
    api.historial({ codigo: procedimiento.codigo })
      .then((r) => setVersiones(r.versiones || []))
      .catch((e) => {
        setVersiones([]);
        toast.error(mensajeError(e?.codigo));
      });
  }, [vista, versiones, procedimiento, api]);

  async function retirar() {
    setRetirando(true);
    try {
      await api.retirar({ codigo: procedimiento.codigo });
      toast.success("Procedimiento retirado.");
      onRetirado();
    } catch (e) {
      toast.error(mensajeError(e?.codigo));
    } finally {
      setRetirando(false);
    }
  }

  if (!procedimiento) return null;
  return (
    <Hoja
      abierta={Boolean(procedimiento)}
      onCerrar={onCerrar}
      titulo={procedimiento.nombre}
      subtitulo={
        <span className="flex flex-wrap items-center gap-2">
          <span>{procedimiento.grupo}</span>
          <Etiqueta tono="verde">Vigente · v{procedimiento.version}</Etiqueta>
          {procedimiento.origen === "ejemplo" ? <Etiqueta>Texto de ejemplo</Etiqueta> : null}
        </span>
      }
      pie={puedeEditar ? (
        confirmarRetiro ? (
          <div className="space-y-3">
            <p className="text-[13px] leading-snug text-[#3A3A3C]">
              <span className="font-semibold">¿Retirar este procedimiento?</span> Ya no aparecerá al crear consentimientos.
              Los consentimientos ya firmados no cambian y su texto se conserva.
            </p>
            <div className="flex gap-2 sm:justify-end">
              <button type="button" onClick={() => setConfirmarRetiro(false)} disabled={retirando}
                className="h-11 flex-1 rounded-full px-5 text-[15px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10 sm:flex-none">Cancelar</button>
              <button type="button" onClick={retirar} disabled={retirando}
                className="h-11 flex-1 rounded-full bg-[#FF3B30] px-6 text-[15px] font-semibold text-white hover:bg-[#D70015] disabled:opacity-50 sm:flex-none">
                {retirando ? "Retirando…" : "Retirar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 sm:justify-end">
            <button type="button" onClick={() => setConfirmarRetiro(true)}
              className="h-11 flex-1 rounded-full px-5 text-[15px] font-medium text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 sm:flex-none">Retirar</button>
            <button type="button" onClick={() => onEditar(procedimiento)}
              className="h-11 flex-1 rounded-full bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC] sm:flex-none">Editar</button>
          </div>
        )
      ) : null}
    >
      <div className="mb-4 flex justify-center sm:justify-start">
        <Segmentado etiqueta="Sección" valor={vista} onCambio={setVista} opciones={[["contenido", "Contenido"], ["historial", "Historial"]]} />
      </div>
      {vista === "contenido" ? (
        <Tarjeta className="p-5 sm:p-6"><VistaAnexo cuerpo={procedimiento.cuerpo} /></Tarjeta>
      ) : (
        <Tarjeta>
          {versiones === null ? (
            <div className="space-y-3 p-5">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-[#F2F2F7]" />)}</div>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {versiones.map((v) => (
                <li key={v.id_plantilla} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${v.estado === "vigente" ? "bg-[#34C759]/12 text-[#1E7B34]" : "bg-[#767680]/[0.12] text-[#6E6E73]"}`}>v{v.version}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#1D1D1F]">{v.estado === "vigente" ? "Vigente" : "Retirada"}</p>
                    <p className="text-[12px] text-[#86868B]">
                      Publicada el {formatearFecha(v.vigente_desde) || "—"}
                      {v.creado_por ? ` por ${v.creado_por}` : ""}
                      {v.retirada_at ? ` · retirada el ${formatearFecha(v.retirada_at)}` : ""}
                    </p>
                  </div>
                  <span className="hidden font-mono text-[11px] text-[#AEAEB2] sm:inline" title="Huella SHA-256 del texto">{String(v.sha256 || "").slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      )}
    </Hoja>
  );
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function ProcedimientosConsentimientoPage() {
  const sesion = useSesionProfesional();
  const { api, procedimientos, cargando, error, recargar } = useProcedimientos();
  const puedeEditar = (sesion.esAdministrador || sesion.esTecnico) && EDICION_DISPONIBLE;

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [seleccionado, setSeleccionado] = useState(null);
  const [editor, setEditor] = useState({ abierto: false, procedimiento: null });

  const grupos = useMemo(
    () => [...new Set(procedimientos.map((p) => p.grupo))].sort((a, b) => a.localeCompare(b, "es")),
    [procedimientos]
  );

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return procedimientos.filter((p) => {
      if (filtro !== "todos" && p.grupo !== filtro) return false;
      if (!termino) return true;
      return `${p.nombre} ${p.grupo}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(termino);
    });
  }, [procedimientos, busqueda, filtro]);

  const porGrupo = useMemo(() => {
    const mapa = new Map();
    for (const p of [...visibles].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))) {
      if (!mapa.has(p.grupo)) mapa.set(p.grupo, []);
      mapa.get(p.grupo).push(p);
    }
    return [...mapa].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [visibles]);

  const cerrarEditor = useCallback(() => setEditor({ abierto: false, procedimiento: null }), []);
  const cerrarDetalle = useCallback(() => setSeleccionado(null), []);

  return (
    <div className="font-system-apple mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 md:pt-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[#007AFF]">Configuración clínica</p>
          <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-[#1D1D1F] sm:text-[32px]">Consentimientos informados</h1>
          <p className="mt-1 max-w-xl text-[15px] leading-snug text-[#6E6E73]">
            Los procedimientos que el equipo puede elegir al emitir un consentimiento. Cada uno se agrega como anexo a la plantilla base.
          </p>
        </div>
        {puedeEditar ? (
          <button type="button" onClick={() => setEditor({ abierto: true, procedimiento: null })}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#007AFF] px-5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,122,255,0.3)] transition-colors hover:bg-[#0062CC]">
            <Plus className="h-4 w-4" strokeWidth={2.75} />
            Nuevo procedimiento
          </button>
        ) : null}
      </header>

      <div className="mt-6 flex gap-3 rounded-[18px] bg-[#007AFF]/[0.06] px-4 py-3.5">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#007AFF]" />
        <p className="text-[13px] leading-relaxed text-[#1D1D1F]">
          <span className="font-semibold">Editar publica una versión nueva.</span>{" "}
          <span className="text-[#3A3A3C]">Los consentimientos ya firmados conservan el texto exacto que leyó el paciente. Los textos de ejemplo deben revisarse con el director técnico del centro.</span>
          {!PROCEDIMIENTOS_EN_SERVIDOR ? (
            <span className="text-[#6E6E73]">
              {EDICION_DISPONIBLE
                ? " Modo de prueba: los cambios se pierden al recargar."
                : " Por ahora se muestran los textos de ejemplo. Crear procedimientos propios se habilita al activar los consentimientos en el servidor."}
            </span>
          ) : null}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E93]" />
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar procedimiento"
            aria-label="Buscar procedimiento"
            className="h-10 w-full rounded-xl bg-[#767680]/[0.12] pl-9 pr-3 text-[15px] text-[#1D1D1F] outline-none placeholder:text-[#8E8E93] focus:ring-4 focus:ring-[#007AFF]/15" />
        </div>
        {grupos.length > 1 ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {[["todos", "Todos"], ...grupos.map((g) => [g, g])].map(([v, texto]) => (
              <button key={v} type="button" onClick={() => setFiltro(v)} aria-pressed={filtro === v}
                className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors ${filtro === v ? "bg-[#1D1D1F] text-white" : "bg-white text-[#3A3A3C] ring-1 ring-black/[0.06] hover:bg-[#F2F2F7]"}`}>
                {texto}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-7">
        {cargando ? (
          <Tarjeta className="divide-y divide-black/[0.06]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-[30px] w-[30px] animate-pulse rounded-[8px] bg-[#E5E5EA]" />
                <div className="flex-1 space-y-1.5"><div className="h-3.5 w-1/2 animate-pulse rounded bg-[#E5E5EA]" /><div className="h-3 w-1/4 animate-pulse rounded bg-[#F2F2F7]" /></div>
              </div>
            ))}
          </Tarjeta>
        ) : error ? (
          <Tarjeta className="px-5 py-10 text-center">
            <p className="text-[15px] font-semibold text-[#1D1D1F]">No se pudieron cargar los procedimientos</p>
            <p className="mt-1 text-[13px] text-[#6E6E73]">{mensajeError(error)}</p>
            <button type="button" onClick={recargar} className="mt-4 h-10 rounded-full px-5 text-[15px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10">Reintentar</button>
          </Tarjeta>
        ) : porGrupo.length === 0 ? (
          <Tarjeta className="px-5 py-12 text-center">
            <FileSignature className="mx-auto h-8 w-8 text-[#C7C7CC]" />
            <p className="mt-3 text-[15px] font-semibold text-[#1D1D1F]">{busqueda ? "Sin resultados" : "Aún no hay procedimientos"}</p>
            <p className="mt-1 text-[13px] text-[#6E6E73]">{busqueda ? "Prueba con otra palabra." : "Crea el primero con “Nuevo procedimiento”."}</p>
          </Tarjeta>
        ) : (
          porGrupo.map(([grupo, lista]) => (
            <section key={grupo} aria-labelledby={`grupo-${grupo}`}>
              <h2 id={`grupo-${grupo}`} className="mb-2 px-4 text-[13px] font-normal uppercase tracking-[0.02em] text-[#6E6E73]">
                {grupo} · {lista.length}
              </h2>
              <Tarjeta>
                <ul>
                  {lista.map((p, i) => (
                    <li key={p.codigo}>
                      <button type="button" onClick={() => setSeleccionado(p)}
                        className="group flex w-full items-center gap-3 px-4 text-left transition-colors hover:bg-[#F2F2F7] active:bg-[#E5E5EA]">
                        <IconoGrupo grupo={p.grupo} />
                        <span className={`flex min-w-0 flex-1 items-center gap-3 py-3 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] text-[#1D1D1F]">{p.nombre}</span>
                            <span className="block text-[12px] text-[#86868B]">
                              Versión {p.version}{p.vigente_desde ? ` · ${formatearFecha(p.vigente_desde)}` : ""}
                            </span>
                          </span>
                          {p.origen === "clinica" ? <Etiqueta tono="azul">Propio</Etiqueta> : null}
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#C7C7CC]" strokeWidth={2.5} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            </section>
          ))
        )}
      </div>

      {!cargando && !error && procedimientos.length ? (
        <p className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-[#AEAEB2]">
          <History className="h-3.5 w-3.5" /> {procedimientos.length} procedimientos vigentes
        </p>
      ) : null}

      <DetalleProcedimiento
        procedimiento={seleccionado}
        onCerrar={cerrarDetalle}
        puedeEditar={puedeEditar}
        api={api}
        onEditar={(p) => {
          setSeleccionado(null);
          setEditor({ abierto: true, procedimiento: p });
        }}
        onRetirado={() => {
          setSeleccionado(null);
          recargar();
        }}
      />
      <EditorProcedimiento
        abierto={editor.abierto}
        procedimiento={editor.procedimiento}
        onCerrar={cerrarEditor}
        api={api}
        gruposExistentes={grupos}
        onGuardado={() => {
          cerrarEditor();
          recargar();
        }}
      />
    </div>
  );
}
