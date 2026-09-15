"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";
import { Textarea } from "@/components/ui/textarea";
import { RutInput } from "@/Componentes/RutInput";
import { PhoneInput } from "@/Componentes/PhoneInput";

const DESCRIPCION_MAX_LARGO = 500;

const ESTADO_INICIAL = {
  nombreProfesional: "",
  descripcionProfesional: "",
  correoContacto: "",
  numeroTelefono: "",
  rutProfesional: "",
};

const ETIQUETAS = {
  nombreProfesional: "Nombre del profesional",
  descripcionProfesional: "Especialidad o descripción",
  correoContacto: "Correo electrónico",
  numeroTelefono: "Teléfono",
  rutProfesional: "RUT",
};

const CAMPOS = Object.keys(ESTADO_INICIAL);

export function validarProfesional(datos) {
  const errores = {};

  for (const campo of CAMPOS) {
    if (!String(datos[campo] ?? "").trim()) {
      errores[campo] = `${ETIQUETAS[campo]} es obligatorio.`;
    }
  }

  if (!errores.nombreProfesional && !/^[\p{L}\s.'-]+$/u.test(datos.nombreProfesional.trim())) {
    errores.nombreProfesional = "Solo se permiten letras y espacios.";
  }

  if (!errores.correoContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correoContacto.trim())) {
    errores.correoContacto = "Ingrese un correo electrónico válido.";
  }

  if (!errores.rutProfesional && datos.rutProfesional.replace(/[^0-9kK]/g, "").length < 7) {
    errores.rutProfesional = "El RUT ingresado no es válido.";
  }

  if (datos.descripcionProfesional.length > DESCRIPCION_MAX_LARGO) {
    errores.descripcionProfesional = `Máximo ${DESCRIPCION_MAX_LARGO} caracteres.`;
  }

  return errores;
}

function Campo({ etiqueta, error, htmlFor, ancho = "", children }) {
  return (
    <div className={`space-y-1.5 ${ancho}`}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
        {etiqueta}
        <span className="ml-0.5 text-slate-400">*</span>
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

export default function ProfesionalModal({ abierto, profesional, onCerrar, onGuardado }) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef(null);
  const primerCampoRef = useRef(null);
  const focoPrevioRef = useRef(null);

  const editando = Boolean(profesional?.id_profesional);

  useEffect(() => setMontado(true), []);

  const actualizar = useCallback((campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
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

  // Al abrir: carga los datos del profesional en edicion o limpia para uno nuevo,
  // y bloquea el scroll de fondo.
  useEffect(() => {
    if (!abierto) {
      setVisible(false);
      return undefined;
    }

    setDatos(
      profesional
        ? {
            nombreProfesional: profesional.nombreProfesional ?? "",
            descripcionProfesional: profesional.descripcionProfesional ?? "",
            correoContacto: profesional.correoContacto ?? "",
            numeroTelefono: profesional.numeroTelefono ?? "",
            rutProfesional: profesional.rutProfesional ?? "",
          }
        : ESTADO_INICIAL
    );
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
  }, [abierto, profesional]);

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

  async function guardar() {
    const erroresDetectados = validarProfesional(datos);

    if (Object.keys(erroresDetectados).length > 0) {
      setErrores(erroresDetectados);
      const primerError = CAMPOS.find((campo) => erroresDetectados[campo]);
      panelRef.current
        ?.querySelector(`[data-campo="${primerError}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Revisa los campos marcados antes de continuar.");
      return;
    }

    setEnviando(true);

    // Mismos endpoints y payload que usaba el formulario de la pagina.
    const ruta = editando
      ? `${API}/profesionales/actualizarProfesional`
      : `${API}/profesionales/insertarProfesional`;

    const cuerpo = {
      nombreProfesional: datos.nombreProfesional.trim(),
      descripcionProfesional: datos.descripcionProfesional.trim(),
      correoContacto: datos.correoContacto.trim(),
      numeroTelefono: datos.numeroTelefono,
      rutProfesional: datos.rutProfesional,
    };

    if (editando) {
      cuerpo.id_profesional = profesional.id_profesional;
    }

    try {
      const res = await fetch(ruta, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        mode: "cors",
      });

      if (!res.ok) {
        toast.error(
          editando
            ? "Error al actualizar el profesional, por favor intente nuevamente."
            : "Error al insertar el profesional, por favor intente nuevamente."
        );
        return;
      }

      const respuesta = await res.json().catch(() => null);

      if (respuesta?.message !== true) {
        toast.error(
          editando
            ? "Error al actualizar el profesional, por favor intente nuevamente."
            : "Error al insertar el profesional, por favor intente nuevamente."
        );
        return;
      }

      toast.success(
        editando ? "Profesional actualizado correctamente." : "Profesional registrado correctamente."
      );
      await onGuardado?.();
      onCerrar();
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor, por favor intente nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!montado || !abierto) return null;

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
        aria-labelledby="profesional-modal-titulo"
        className={`relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl transition-all duration-300 ease-out sm:max-h-[90dvh] sm:rounded-[24px] ${
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:scale-[0.98]"
        }`}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <header className="flex items-center justify-between gap-4 px-6 pb-2 pt-5 sm:px-8 sm:pt-7">
          <h2 id="profesional-modal-titulo" className="text-lg font-semibold tracking-tight text-slate-900">
            {editando ? "Editar Profesional" : "Nuevo Profesional"}
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
            <div data-campo="nombreProfesional" className="sm:col-span-2">
              <Campo etiqueta="Nombre completo" error={errores.nombreProfesional} htmlFor="pr-nombre">
                <ShadcnInput
                  id="pr-nombre"
                  ref={primerCampoRef}
                  value={datos.nombreProfesional}
                  placeholder="Dr. María González"
                  onChange={(e) => actualizar("nombreProfesional", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="correoContacto">
              <Campo etiqueta="Email" error={errores.correoContacto} htmlFor="pr-correo">
                <ShadcnInput
                  id="pr-correo"
                  value={datos.correoContacto}
                  placeholder="dra.gonzalez@clinica.cl"
                  onChange={(e) => actualizar("correoContacto", e.target.value)}
                  className={campoBase}
                />
              </Campo>
            </div>

            <div data-campo="numeroTelefono">
              <Campo etiqueta="Teléfono" error={errores.numeroTelefono}>
                <PhoneInput
                  value={datos.numeroTelefono}
                  className="h-11"
                  onChange={(completo) => actualizar("numeroTelefono", completo)}
                />
              </Campo>
            </div>

            <div data-campo="rutProfesional" className="sm:col-span-2">
              <Campo etiqueta="RUT" error={errores.rutProfesional}>
                <RutInput
                  value={datos.rutProfesional}
                  placeholder="12.345.678-9"
                  className="h-11"
                  onChange={(limpio) => actualizar("rutProfesional", limpio)}
                />
              </Campo>
            </div>

            <div data-campo="descripcionProfesional" className="sm:col-span-2">
              <Campo etiqueta="Especialidad" error={errores.descripcionProfesional} htmlFor="pr-descripcion">
                <Textarea
                  id="pr-descripcion"
                  value={datos.descripcionProfesional}
                  onChange={(e) => actualizar("descripcionProfesional", e.target.value)}
                  placeholder="Ej: Especialista en ortodoncia con 10 años de experiencia"
                  maxLength={DESCRIPCION_MAX_LARGO}
                  className="min-h-[96px] rounded-xl border-slate-200 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                />
                <p className="text-right text-[11px] text-slate-400">
                  {datos.descripcionProfesional.length}/{DESCRIPCION_MAX_LARGO}
                </p>
              </Campo>
            </div>
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
            onClick={guardar}
            disabled={enviando}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {enviando ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Guardando...
              </>
            ) : editando ? (
              "Guardar cambios"
            ) : (
              "Registrar Profesional"
            )}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
