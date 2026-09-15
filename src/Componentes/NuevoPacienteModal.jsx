"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";
import { ShadcnSelect } from "@/Componentes/shadcnSelect";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import { Textarea } from "@/components/ui/textarea";
import { RutInput } from "@/Componentes/RutInput";
import { PhoneInput } from "@/Componentes/PhoneInput";
import { NOMBRES_PREVISION, previsionIdDesdeNombre } from "@/lib/previsiones";


const ESTADO_INICIAL = {
  nombre: "",
  apellido: "",
  rut: "",
  nacimiento: "",
  sexo: "",
  prevision: "FONASA",
  telefono: "",
  correo: "",
  direccion: "",
  pais: "",
  observacion1: "",
  medicamentosUsados: "",
  habitos: "",
};

// Orden de foco al primer error: sigue el orden visual del formulario.
const CAMPOS_REQUERIDOS = [
  "nombre",
  "apellido",
  "rut",
  "nacimiento",
  "sexo",
  "prevision",
  "telefono",
  "correo",
  "direccion",
  "pais",
];

const ETIQUETAS = {
  nombre: "Nombres",
  apellido: "Apellidos",
  rut: "Identificación (RUT)",
  nacimiento: "Fecha de nacimiento",
  sexo: "Sexo",
  prevision: "Previsión",
  telefono: "Teléfono",
  correo: "Correo electrónico",
  direccion: "Dirección residencial",
  pais: "País",
};

export function validarPaciente(datos) {
  const errores = {};

  for (const campo of CAMPOS_REQUERIDOS) {
    if (!String(datos[campo] ?? "").trim()) {
      errores[campo] = `${ETIQUETAS[campo]} es obligatorio.`;
    }
  }

  if (datos.prevision && !previsionIdDesdeNombre(datos.prevision)) {
    errores.prevision = "Seleccione una previsión válida.";
  }

  if (!errores.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo.trim())) {
    errores.correo = "Ingrese un correo electrónico válido.";
  }

  if (!errores.rut && datos.rut.replace(/[^0-9kK]/g, "").length < 7) {
    errores.rut = "El RUT ingresado no es válido.";
  }

  return errores;
}

function Campo({ etiqueta, requerido, error, htmlFor, ancho = "", children }) {
  return (
    <div className={`space-y-1.5 ${ancho}`}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
        {etiqueta}
        {requerido ? <span className="ml-0.5 text-slate-400">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function NuevoPacienteModal({ abierto, onCerrar, onCreado }) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef(null);
  const primerCampoRef = useRef(null);
  const focoPrevioRef = useRef(null);

  useEffect(() => setMontado(true), []);

  const actualizar = useCallback((campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    // El error se limpia al corregir, no al reenviar: evita dejar el campo en rojo
    // mientras la persona ya lo esta arreglando.
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }, []);

  const cerrar = useCallback(() => {
    if (enviando) return;
    onCerrar();
  }, [enviando, onCerrar]);

  // Reset al abrir, y bloqueo del scroll de fondo mientras esta abierto.
  useEffect(() => {
    if (!abierto) {
      setVisible(false);
      return undefined;
    }

    setDatos(ESTADO_INICIAL);
    setErrores({});
    setEnviando(false);
    focoPrevioRef.current = document.activeElement;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const raf = requestAnimationFrame(() => {
      setVisible(true);
      primerCampoRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflowPrevio;
      if (focoPrevioRef.current instanceof HTMLElement) {
        focoPrevioRef.current.focus();
      }
    };
  }, [abierto]);

  // Escape cierra; Tab queda contenido dentro del panel.
  useEffect(() => {
    if (!abierto) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        cerrar();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      } else if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [abierto, cerrar]);

  async function registrar() {
    const erroresDetectados = validarPaciente(datos);

    if (Object.keys(erroresDetectados).length > 0) {
      setErrores(erroresDetectados);
      const primerError = CAMPOS_REQUERIDOS.find((campo) => erroresDetectados[campo]);
      panelRef.current
        ?.querySelector(`[data-campo="${primerError}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Revisa los campos marcados antes de continuar.");
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch(`${API}/pacientes/pacientesInsercion`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim(),
          rut: datos.rut,
          nacimiento: datos.nacimiento,
          sexo: datos.sexo.trim(),
          prevision_id: previsionIdDesdeNombre(datos.prevision),
          telefono: datos.telefono,
          correo: datos.correo.trim(),
          direccion: datos.direccion.trim(),
          pais: datos.pais.trim(),
          observacion1: datos.observacion1,
          apoderado: "",
          apoderado_rut: "",
          medicamentosUsados: datos.medicamentosUsados,
          habitos: datos.habitos,
          comentariosAdicionales: "",
        }),
        mode: "cors",
      });

      const respuesta = await res.json().catch(() => null);

      if (respuesta?.message === "duplicado") {
        setErrores({ rut: "Ya existe un paciente registrado con este RUT." });
        toast.error("Paciente ya existe. No se puede duplicar RUT.");
        return;
      }

      if (!res.ok || respuesta?.message !== true) {
        toast.error(
          "Problema al ingresar el nuevo paciente en el servidor. Contacte a soporte técnico de Medify."
        );
        return;
      }

      toast.success("Paciente ingresado correctamente.");
      await onCreado?.();
      onCerrar();
    } catch (error) {
      console.error(error);
      toast.error(
        "Problema al ingresar el nuevo paciente en el servidor. Contacte a soporte técnico de Medify."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!montado || !abierto) return null;

  // Los inputs compartidos traen border-blue-800; tailwind-merge deja ganar a la
  // clase que se pasa despues, asi el modal se mantiene monocromo.
  const campoBase =
    "h-11 rounded-xl border-slate-200 placeholder:text-slate-400 focus:border-slate-900";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        onClick={cerrar}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-paciente-titulo"
        className={`relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl transition-all duration-300 ease-out sm:max-h-[90dvh] sm:rounded-[24px] ${
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:scale-[0.98]"
        }`}
      >
        {/* Tirador: en mobile el panel se comporta como hoja inferior. */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <header className="flex items-center justify-between gap-4 px-6 pb-2 pt-5 sm:px-8 sm:pt-7">
          <h2 id="nuevo-paciente-titulo" className="text-lg font-semibold tracking-tight text-slate-900">
            Nuevo Paciente
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 sm:px-8">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <div data-campo="nombre">
              <Campo etiqueta="Nombre" requerido error={errores.nombre} htmlFor="np-nombre">
                <ShadcnInput
                  id="np-nombre"
                  ref={primerCampoRef}
                  value={datos.nombre}
                  placeholder="Juan"
                  onChange={(e) => actualizar("nombre", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="apellido">
              <Campo etiqueta="Apellido" requerido error={errores.apellido} htmlFor="np-apellido">
                <ShadcnInput
                  id="np-apellido"
                  value={datos.apellido}
                  placeholder="Pérez"
                  onChange={(e) => actualizar("apellido", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="rut">
              <Campo etiqueta="RUT" requerido error={errores.rut}>
                <RutInput
                  value={datos.rut}
                  placeholder="12.345.678-9"
                  className="h-11"
                  onChange={(limpio) => actualizar("rut", limpio)}
                />
              </Campo>
            </div>

            <div data-campo="nacimiento">
              <Campo etiqueta="Fecha de nacimiento" requerido error={errores.nacimiento}>
                <ShadcnDatePicker
                  label=""
                  className="h-11 w-full rounded-xl border-slate-200"
                  placeholder="Seleccione fecha"
                  value={datos.nacimiento}
                  onChange={(valor) => actualizar("nacimiento", valor)}
                />
              </Campo>
            </div>

            <div data-campo="sexo">
              <Campo etiqueta="Sexo" requerido error={errores.sexo} htmlFor="np-sexo">
                <ShadcnInput
                  id="np-sexo"
                  value={datos.sexo}
                  placeholder="Femenino"
                  onChange={(e) => actualizar("sexo", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="prevision">
              <Campo etiqueta="Previsión" requerido error={errores.prevision}>
                <ShadcnSelect
                  nombreDefault="Seleccione Previsión"
                  opciones={NOMBRES_PREVISION}
                  value={datos.prevision}
                  className="h-11 w-full rounded-xl border-slate-200"
                  onChange={(valor) => actualizar("prevision", valor)}
                />
              </Campo>
            </div>

            <div data-campo="telefono">
              <Campo etiqueta="Teléfono" requerido error={errores.telefono}>
                <PhoneInput
                  value={datos.telefono}
                  className="h-11"
                  onChange={(completo) => actualizar("telefono", completo)}
                />
              </Campo>
            </div>

            <div data-campo="correo">
              <Campo etiqueta="Email" requerido error={errores.correo} htmlFor="np-correo">
                <ShadcnInput
                  id="np-correo"
                  value={datos.correo}
                  placeholder="juan@email.com"
                  onChange={(e) => actualizar("correo", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="direccion" className="sm:col-span-2">
              <Campo etiqueta="Dirección" requerido error={errores.direccion} htmlFor="np-direccion">
                <ShadcnInput
                  id="np-direccion"
                  value={datos.direccion}
                  placeholder="Av. Providencia 1234, Santiago"
                  onChange={(e) => actualizar("direccion", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="pais">
              <Campo etiqueta="País" requerido error={errores.pais} htmlFor="np-pais">
                <ShadcnInput
                  id="np-pais"
                  value={datos.pais}
                  placeholder="Chile"
                  onChange={(e) => actualizar("pais", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <Campo etiqueta="Medicamentos" htmlFor="np-medicamentos">
              <ShadcnInput
                id="np-medicamentos"
                value={datos.medicamentosUsados}
                placeholder="Medicamentos actuales"
                onChange={(e) => actualizar("medicamentosUsados", e.target.value)}
                className={campoBase}
              />
            </Campo>

            <Campo etiqueta="Hábitos" htmlFor="np-habitos" ancho="sm:col-span-2">
              <ShadcnInput
                id="np-habitos"
                value={datos.habitos}
                placeholder="Fumador, actividad física, etc."
                onChange={(e) => actualizar("habitos", e.target.value)}
                className={campoBase}
              />
            </Campo>

            <Campo etiqueta="Notas" htmlFor="np-observacion" ancho="sm:col-span-2">
              <Textarea
                id="np-observacion"
                value={datos.observacion1}
                onChange={(e) => actualizar("observacion1", e.target.value)}
                placeholder="Alergias, condiciones previas..."
                className="min-h-[96px] rounded-xl border-slate-200 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
              />
            </Campo>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-5">
          <button
            type="button"
            onClick={cerrar}
            disabled={enviando}
            className="h-11 rounded-xl px-5 text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={registrar}
            disabled={enviando}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {enviando ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Registrando...
              </>
            ) : (
              "Registrar Paciente"
            )}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
