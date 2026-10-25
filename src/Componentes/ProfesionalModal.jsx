"use client";

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import ShadcnInput from "@/Componentes/shadcnInput2";
import { RutInput } from "@/Componentes/RutInput";
import { PhoneInput } from "@/Componentes/PhoneInput";
import SeccionExpandible from "@/Componentes/firma/SeccionExpandible";
import SeccionFirmaElectronica from "@/Componentes/firma/SeccionFirmaElectronica";
import SeccionRegistroSis from "@/Componentes/firma/SeccionRegistroSis";
import InsigniaEstado from "@/Componentes/firma/InsigniaEstado";
import FotoProfesional from "@/Componentes/firma/FotoProfesional";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { useApiFirma } from "@/hooks/useApiFirma";
import { useDatosEmpresa } from "@/hooks/useDatosEmpresa";
import { ESTADOS_FIRMA, ESTADOS_REGISTRO_SIS } from "@/lib/firma/constantes";
import { MODO_MOCK } from "@/lib/firma/apiFirma";
import { rutValido } from "@/lib/rut";

// El campo es un ROTULO de profesion/especialidad ("Cirujano dentista",
// "Ortodoncista"), no una biografia. Con los 500 caracteres anteriores la gente
// escribia parrafos, y este texto se reimprime en sitios estrechos que no dan
// para eso: el pie de firma de los 6 PDF (bloque de 62mm, ver src/lib/pdfFirma.js),
// la tarjeta del profesional en el dashboard y las tarjetas del sitio publico
// (agendaProfesionales, formularioReservaProfesional). 65 caracteres alcanzan
// para cualquier especialidad real y entran en una linea en todos esos formatos.
const ESPECIALIDAD_MAX_LARGO = 65;

const ESTADO_INICIAL = {
  nombreProfesional: "",
  descripcionProfesional: "",
  correoContacto: "",
  numeroTelefono: "",
  rutProfesional: "",
  registro_sis_numero: "",
  imagenProfesional: "",
};

const ETIQUETAS = {
  nombreProfesional: "Nombre del profesional",
  descripcionProfesional: "Profesión / Especialidad",
  correoContacto: "Correo electrónico",
  numeroTelefono: "Teléfono",
  rutProfesional: "RUT",
};

// Obligatorios. El N° de registro de la Superintendencia es opcional: no todas
// las profesiones están en el RNPI y exigirlo lleva a inventar números.
const CAMPOS = ["nombreProfesional", "descripcionProfesional", "correoContacto", "numeroTelefono", "rutProfesional"];

export function validarProfesional(datos) {
  const errores = {};

  for (const campo of CAMPOS) {
    if (!String(datos[campo] ?? "").trim()) {
      // Redaccion neutra: las etiquetas mezclan genero ("Profesión /
      // Especialidad" vs "Correo electrónico") y "es obligatorio" concordaba
      // mal con las femeninas.
      errores[campo] = `Debe indicar ${ETIQUETAS[campo].toLowerCase()}.`;
    }
  }

  if (!errores.nombreProfesional && !/^[\p{L}\s.'-]+$/u.test(datos.nombreProfesional.trim())) {
    errores.nombreProfesional = "Solo se permiten letras y espacios.";
  }

  if (!errores.correoContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correoContacto.trim())) {
    errores.correoContacto = "Ingrese un correo electrónico válido.";
  }

  if (!errores.rutProfesional && !rutValido(datos.rutProfesional)) {
    errores.rutProfesional = "El RUT no es válido (revisa el dígito verificador).";
  }

  if (datos.registro_sis_numero && !/^\d{1,10}$/.test(datos.registro_sis_numero)) {
    errores.registro_sis_numero = "El número de registro tiene solo dígitos (hasta 10).";
  }

  if (datos.descripcionProfesional.length > ESPECIALIDAD_MAX_LARGO) {
    errores.descripcionProfesional = `Máximo ${ESPECIALIDAD_MAX_LARGO} caracteres.`;
  }

  return errores;
}

function Campo({ etiqueta, error, htmlFor, ancho = "", opcional = false, children }) {
  return (
    <div className={`space-y-1.5 ${ancho}`}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
        {etiqueta}
        {opcional ? (
          <span className="ml-1.5 text-[11px] font-normal text-slate-400">opcional</span>
        ) : (
          <span className="ml-0.5 text-slate-400">*</span>
        )}
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

export default function ProfesionalModal({ abierto, profesional, onCerrar, onGuardado, seccionInicial = null }) {
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

  // ── Firma electrónica y registro de la Superintendencia ───────────────────
  // Solo el propio profesional dibuja su firma; el administrador ve el estado y
  // verifica el registro. Otros roles no ven estas secciones.
  const sesion = useSesionProfesional();
  const { getToken } = useAuth();
  const api = useApiFirma();
  const empresa = useDatosEmpresa();
  const esDueno = editando && sesion.esDueno(profesional.id_profesional);
  const veSecciones = editando && (esDueno || sesion.esAdministrador || sesion.esTecnico);
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const [firma, setFirma] = useState(null);
  const [registroSis, setRegistroSis] = useState(null);
  const [cargandoFirma, setCargandoFirma] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setSeccionAbierta(seccionInicial);
  }, [abierto, seccionInicial]);

  useEffect(() => {
    if (!abierto || !veSecciones) {
      setFirma(null);
      setRegistroSis(null);
      return undefined;
    }
    let vigente = true;
    setCargandoFirma(true);
    api.seleccionarEstadoFirma({ id_profesional: profesional.id_profesional })
      .then((r) => {
        if (!vigente) return;
        setFirma(r.firma);
        setRegistroSis(r.registroSis);
      })
      .catch(() => {
        if (!vigente) return;
        // Sin backend de firma todavía: se muestra lo que trae la lista de profesionales.
        setFirma(null);
        setRegistroSis({
          numero: profesional.registro_sis_numero || null,
          estado: profesional.registro_sis_estado || "no_informado",
        });
      })
      .finally(() => vigente && setCargandoFirma(false));
    return () => {
      vigente = false;
    };
  }, [abierto, veSecciones, api, profesional]);

  const alternarSeccion = (nombre) => setSeccionAbierta((actual) => (actual === nombre ? null : nombre));
  const estadoFirma = ESTADOS_FIRMA[firma?.estado === "activa" ? "activa" : profesional?.firma_estado === "activa" ? "activa" : "ninguna"];
  const estadoRegistro = ESTADOS_REGISTRO_SIS[registroSis?.estado || profesional?.registro_sis_estado || "no_informado"];

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
            registro_sis_numero: profesional.registro_sis_numero ?? "",
            imagenProfesional: profesional.imagenProfesional ?? "",
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
      const primerError = [...CAMPOS, "registro_sis_numero"].find((campo) => erroresDetectados[campo]);
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
      // id de Cloudflare Images; "" la quita. Lo muestran la agenda pública y la tarjeta.
      imagenProfesional: datos.imagenProfesional || "",
    };

    // Al crear, el N° de registro viaja con los datos (queda "declarado"). Al editar
    // lo gestiona SeccionRegistroSis, que además maneja certificado y verificación.
    if (!editando && datos.registro_sis_numero) {
      cuerpo.registro_sis_numero = datos.registro_sis_numero;
    }

    if (editando) {
      cuerpo.id_profesional = profesional.id_profesional;
    }

    try {
      // El token identifica a quién crea o edita (evidencia del N° de registro
      // declarado). El backend lo lee si viene; ver docs/firma/04, Fase 4.
      const token = await getToken().catch(() => null);
      const res = await fetch(ruta, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    <div data-tour-modal className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
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
        className={`font-system-apple relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] ${seccionAbierta ? "max-w-2xl" : "max-w-xl"} bg-white shadow-2xl transition-all duration-300 ease-out sm:max-h-[90dvh] sm:rounded-[24px] ${
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
            <div className="sm:col-span-2">
              <FotoProfesional
                imagenId={datos.imagenProfesional}
                nombre={datos.nombreProfesional}
                onCambio={(id) => actualizar("imagenProfesional", id)}
                deshabilitado={enviando}
              />
            </div>

            <div data-campo="nombreProfesional" data-tour="profesional-nombre" className="sm:col-span-2">
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

            <div data-campo="correoContacto" data-tour="profesional-correo">
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

            <div data-campo="numeroTelefono" data-tour="profesional-telefono">
              <Campo etiqueta="Teléfono" error={errores.numeroTelefono}>
                <PhoneInput
                  value={datos.numeroTelefono}
                  className="h-11"
                  onChange={(completo) => actualizar("numeroTelefono", completo)}
                />
              </Campo>
            </div>

            <div data-campo="rutProfesional" data-tour="profesional-rut" className="sm:col-span-2">
              <Campo etiqueta="RUT" error={errores.rutProfesional}>
                <RutInput
                  value={datos.rutProfesional}
                  placeholder="12.345.678-9"
                  className="h-11"
                  onChange={(limpio) => actualizar("rutProfesional", limpio)}
                />
              </Campo>
            </div>

            <div data-campo="descripcionProfesional" data-tour="profesional-descripcion" className="sm:col-span-2">
              <Campo etiqueta="Profesión / Especialidad" error={errores.descripcionProfesional} htmlFor="pr-descripcion">
                {/* Una sola linea, no <textarea>: un cuadro de 96px de alto
                    invita a escribir el parrafo que este campo justamente no
                    debe tener, y un salto de linea agrega un renglon al pie de
                    firma de todos los PDF. El replace deja fuera cualquier
                    salto que llegue pegado desde el portapapeles. */}
                <ShadcnInput
                  id="pr-descripcion"
                  value={datos.descripcionProfesional}
                  onChange={(e) => actualizar("descripcionProfesional", e.target.value.replace(/\s*[\r\n]+\s*/g, " "))}
                  placeholder="Ej: Cirujano dentista"
                  maxLength={ESPECIALIDAD_MAX_LARGO}
                  className={campoBase}
                />
                {/* Un profesional creado antes de este tope puede traer un
                    texto mas largo: `maxLength` no recorta lo que ya venia
                    cargado, solo impide seguir escribiendo. El contador se
                    marca para que se vea por que no deja guardar. */}
                <p className={`text-right text-[11px] ${
                  datos.descripcionProfesional.length > ESPECIALIDAD_MAX_LARGO ? "font-semibold text-red-600" : "text-slate-400"
                }`}>
                  {datos.descripcionProfesional.length}/{ESPECIALIDAD_MAX_LARGO}
                </p>
              </Campo>
            </div>
          </div>

          {/* ── Datos para documentos firmados (opcionales) ───────────────── */}
          {!editando ? (
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <div data-campo="registro_sis_numero">
                <Campo etiqueta="N° Registro Superintendencia de Salud" opcional error={errores.registro_sis_numero} htmlFor="pr-registro-nuevo">
                  <ShadcnInput
                    id="pr-registro-nuevo"
                    value={datos.registro_sis_numero}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Solo si la profesión está inscrita en el RNPI"
                    onChange={(e) => actualizar("registro_sis_numero", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={campoBase}
                  />
                </Campo>
              </div>
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] leading-relaxed text-slate-500">
                La firma electrónica la registra el propio profesional desde su cuenta, después de crearlo y asignarle su
                agenda. Le aparecerá un aviso para completarla.
              </p>
            </div>
          ) : veSecciones ? (
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Documentos firmados · opcional
                </p>
                {MODO_MOCK ? (
                  <span
                    title="Backend de firma aún no conectado: lo que registres se pierde al recargar la página."
                    className="rounded-full bg-[#007AFF]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0062CC]"
                  >
                    Modo de prueba
                  </span>
                ) : null}
              </div>

              <SeccionExpandible
                dataCampo="seccion-registro"
                titulo="N° Registro Superintendencia de Salud"
                descripcion="Aparece en el pie de firma de los documentos"
                insignia={<InsigniaEstado estado={estadoRegistro} />}
                abierta={seccionAbierta === "registro"}
                onAlternar={() => alternarSeccion("registro")}
              >
                {cargandoFirma ? (
                  <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <SeccionRegistroSis
                    key={`${profesional.id_profesional}-${registroSis?.numero ?? ""}-${registroSis?.estado ?? ""}`}
                    idProfesional={profesional.id_profesional}
                    registro={registroSis}
                    puedeEditar={esDueno || sesion.esAdministrador || sesion.esTecnico}
                    esAdministrador={sesion.esAdministrador}
                    onRegistroCambiado={(nuevo) => {
                      setRegistroSis(nuevo);
                      onGuardado?.();
                    }}
                  />
                )}
              </SeccionExpandible>

              <SeccionExpandible
                dataCampo="seccion-firma"
                titulo="Firma electrónica"
                descripcion={esDueno ? "Firma simple (FES) · Ley 19.799" : "La registra el propio profesional"}
                insignia={<InsigniaEstado estado={estadoFirma} />}
                abierta={seccionAbierta === "firma"}
                onAlternar={() => alternarSeccion("firma")}
              >
                {cargandoFirma ? (
                  <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <SeccionFirmaElectronica
                    idProfesional={profesional.id_profesional}
                    firma={firma}
                    puedeDibujar={esDueno}
                    empresa={empresa}
                    onFirmaCambiada={(nueva) => {
                      setFirma(nueva);
                      onGuardado?.();
                    }}
                  />
                )}
              </SeccionExpandible>
            </div>
          ) : null}
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
            data-tour="profesional-guardar"
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
