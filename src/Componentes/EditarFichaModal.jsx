"use client";

// ── Edición de ficha clínica en popup ────────────────────────────────────────
// Reemplaza la navegación a /dashboard/EdicionFicha/[id_ficha]: antes había que
// salir de la ficha del paciente, editar en otra página y volver. Ahora se abre
// encima, con el mismo lenguaje visual de FichaClinicaModal (el de crear).
//
// Comparte con aquel los helpers de @/lib/fichaPlantilla, así que la forma de
// leer una plantilla y de armar los datos enriquecidos es una sola para crear
// y para editar.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import ModalBase from "@/Componentes/ModalBase";
import CampoFormulario from "@/Componentes/CampoFormulario";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import { ShadcnSelect } from "@/Componentes/shadcnSelect";
import { Textarea } from "@/components/ui/textarea";
import { useProfesionales } from "@/hooks/useProfesionales";
import {
  etiquetaProfesionalConRut,
  profesionalPorId,
  profesionalPorNombre,
  separarNombreYRut,
} from "@/lib/profesional";
import {
  camposObligatoriosFaltantes,
  enriquecerDatosFicha,
  progresoFicha,
  transformarPlantilla,
} from "@/lib/fichaPlantilla";
import { formatRut } from "@/lib/designTokens";

// Arma el aviso nombrando lo que falta, en vez de mandar a revisar la pantalla.
//   uno:    "Falta ingresar la fecha de atención."
//   varios: "Falta seleccionar la plantilla e ingresar la fecha de atención."
//
// El verbo va en singular aunque falten varias cosas: lo que sigue son
// infinitivos ("falta seleccionar", no "faltan seleccionar").
function avisoDeFaltantes(faltantes) {
  if (faltantes.length === 0) return "";
  if (faltantes.length === 1) return `Falta ${faltantes[0]}.`;

  const ultimo = faltantes[faltantes.length - 1];
  // "y" pasa a "e" delante de sonido /i/: "...la plantilla e ingresar...".
  const conjuncion = /^(i|hi)(?!e)/i.test(ultimo) ? "e" : "y";

  return `Falta ${faltantes.slice(0, -1).join(", ")} ${conjuncion} ${ultimo}.`;
}

export default function EditarFichaModal({ abierto, id_ficha, paciente, onCerrar, onGuardada }) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [plantillas, setPlantillas] = useState([]);
  const [idPlantilla, setIdPlantilla] = useState("");
  const [plantillaCompleta, setPlantillaCompleta] = useState(null);
  const [cargandoPlantilla, setCargandoPlantilla] = useState(false);
  const [cargandoFicha, setCargandoFicha] = useState(false);

  const [fechaConsulta, setFechaConsulta] = useState("");
  const [profesionalTexto, setProfesionalTexto] = useState("");
  const [idProfesional, setIdProfesional] = useState("");
  const [datosDinamicos, setDatosDinamicos] = useState({});
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  // Se muestra en el encabezado para confirmar que se edita la ficha correcta.
  const [numeroFicha, setNumeroFicha] = useState("");

  const listaProfesionales = useProfesionales();

  const limpiar = useCallback(() => {
    setIdPlantilla("");
    setPlantillaCompleta(null);
    setFechaConsulta("");
    setProfesionalTexto("");
    setIdProfesional("");
    setDatosDinamicos({});
    setErrores({});
    setNumeroFicha("");
  }, []);

  const cargarPlantillaCompleta = useCallback(
    async (id_plantilla) => {
      setCargandoPlantilla(true);
      try {
        const res = await fetch(`${API}/fichaPlantilla/obtenerPlantillaCompleta`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ id_plantilla }),
        });

        if (!res.ok) {
          toast.error("No se pudo cargar la plantilla de la ficha.");
          return null;
        }

        const estructura = transformarPlantilla(await res.json());
        setPlantillaCompleta(estructura);
        return estructura;
      } catch (error) {
        console.log(error);
        toast.error("No se pudo conectar para cargar la plantilla.");
        return null;
      } finally {
        setCargandoPlantilla(false);
      }
    },
    [API]
  );

  // Al abrir: lista de plantillas + la ficha que se va a editar.
  useEffect(() => {
    if (!abierto || !id_ficha) return;

    limpiar();

    let cancelado = false;

    (async () => {
      setCargandoFicha(true);

      try {
        const resPlantillas = await fetch(`${API}/fichaPlantilla/listarPlantillas`);
        if (resPlantillas.ok) {
          const data = await resPlantillas.json();
          if (!cancelado && Array.isArray(data)) setPlantillas(data);
        }

        const res = await fetch(`${API}/ficha/seleccionarFichaID`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ id_ficha }),
          mode: "cors",
        });

        if (!res.ok) {
          if (!cancelado) toast.error("No fue posible cargar la ficha a editar.");
          return;
        }

        const fichas = await res.json();
        if (cancelado || !Array.isArray(fichas) || fichas.length === 0) {
          if (!cancelado) toast.error(`No se encontró la ficha #${id_ficha}.`);
          return;
        }

        const ficha = fichas[0];
        setNumeroFicha(ficha.id_ficha ?? "");
        setFechaConsulta(ficha.fechaConsulta || "");
        setProfesionalTexto(ficha.observaciones || "");

        // El profesional viaja como texto ("Nombre · RUT: 12.345.678-9"). Se
        // busca al registrado que calce para dejar el selector en su opción; si
        // no calza, el texto guardado se conserva igual y no se pierde.
        const { nombre } = separarNombreYRut(ficha.observaciones);
        const registrado = profesionalPorNombre(listaProfesionales, nombre);
        if (registrado) setIdProfesional(String(registrado.id_profesional));

        if (ficha.id_plantilla) {
          setIdPlantilla(String(ficha.id_plantilla));

          // La ficha guarda cada campo como objeto {valor, nombreCampo, ...};
          // el formulario solo necesita el valor.
          let datosRaw = {};
          if (ficha.datosDinamicos) {
            try {
              datosRaw =
                typeof ficha.datosDinamicos === "string"
                  ? JSON.parse(ficha.datosDinamicos)
                  : ficha.datosDinamicos;
            } catch {
              datosRaw = {};
            }
          }

          const datosSimples = {};
          Object.keys(datosRaw).forEach((clave) => {
            if (clave === "_plantillaNombre") return;
            const entrada = datosRaw[clave];
            datosSimples[clave] =
              typeof entrada === "object" && entrada !== null ? entrada.valor || "" : entrada || "";
          });

          if (!cancelado) setDatosDinamicos(datosSimples);
          await cargarPlantillaCompleta(ficha.id_plantilla);
        }
      } catch (error) {
        console.log(error);
        if (!cancelado) toast.error("No se pudo conectar para cargar la ficha.");
      } finally {
        if (!cancelado) setCargandoFicha(false);
      }
    })();

    return () => {
      cancelado = true;
    };
    // listaProfesionales se omite a propósito: llega por un hook con caché y
    // agregarla reejecutaría la carga completa de la ficha al resolverse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, id_ficha, API, limpiar, cargarPlantillaCompleta]);

  async function seleccionarPlantilla(id_plantilla) {
    setIdPlantilla(id_plantilla);
    setDatosDinamicos({});
    setPlantillaCompleta(null);
    setErrores((prev) => ({ ...prev, plantilla: undefined }));

    if (!id_plantilla) return;
    await cargarPlantillaCompleta(id_plantilla);
  }

  const progreso = useMemo(
    () => progresoFicha(plantillaCompleta, datosDinamicos),
    [plantillaCompleta, datosDinamicos]
  );

  async function guardar() {
    const nuevosErrores = {};
    const pendientes = [];

    if (!id_ficha) nuevosErrores.plantilla = "Falta el identificador de la ficha.";
    if (!idPlantilla || !plantillaCompleta) {
      nuevosErrores.plantilla = "Seleccione una plantilla.";
      pendientes.push("seleccionar la plantilla");
    }
    if (!fechaConsulta) {
      nuevosErrores.fecha = "Seleccione la fecha de la consulta.";
      pendientes.push("ingresar la fecha de atención");
    }
    if (!profesionalTexto.trim()) {
      nuevosErrores.profesional = "Seleccione el profesional a cargo.";
      pendientes.push("seleccionar el profesional a cargo");
    }

    const faltantes = camposObligatoriosFaltantes(plantillaCompleta, datosDinamicos);
    if (faltantes.length > 0) {
      nuevosErrores.campos = `Complete los campos obligatorios: ${faltantes.join(", ")}`;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      // Los campos de la plantilla se nombran aparte porque pueden ser muchos.
      toast.error(avisoDeFaltantes(pendientes) || nuevosErrores.campos);
      return;
    }

    setGuardando(true);

    try {
      // Mismo endpoint y mismo payload que usaba la pagina EdicionFicha.
      const res = await fetch(`${API}/ficha/editarFichaPaciente`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoAtencion: "",
          motivoConsulta: "",
          signosVitales: "",
          observaciones: profesionalTexto,
          anotacionConsulta: "",
          anamnesis: "",
          diagnostico: "",
          indicaciones: "",
          archivosAdjuntos: "",
          fechaConsulta,
          consentimientoFirmado: "",
          id_plantilla: idPlantilla,
          datosDinamicos: enriquecerDatosFicha(plantillaCompleta, datosDinamicos),
          id_ficha,
        }),
        mode: "cors",
        cache: "no-cache",
      });

      if (!res.ok) {
        toast.error("El servidor rechazó la actualización. Intenta nuevamente o contacta a soporte.");
        return;
      }

      const respuesta = await res.json();

      if (respuesta?.message !== true) {
        toast.error("No se pudo guardar la ficha. Revisa los datos e intenta nuevamente.");
        return;
      }

      toast.success("Ficha clínica actualizada.");
      await onGuardada?.();
      onCerrar();
    } catch (error) {
      console.log(error);
      toast.error("No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  const nombrePaciente = paciente
    ? `${paciente.nombre ?? ""} ${paciente.apellido ?? ""}`.trim()
    : "";

  const descripcion = [
    numeroFicha ? `Ficha #${numeroFicha}` : null,
    nombrePaciente || null,
    paciente?.rut ? `RUT ${formatRut(paciente.rut) || paciente.rut}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      bloquearCierre={guardando}
      ancho="max-w-3xl"
      titulo="Editar ficha clínica"
      descripcion={descripcion || undefined}
      pie={
        <>
          {plantillaCompleta ? (
            <span className="mr-auto text-[11px] text-slate-400">
              {progreso.completados} de {progreso.total} campos completados
            </span>
          ) : null}
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="h-11 rounded-xl px-5 text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || cargandoFicha}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {guardando ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5 pb-2">
        {cargandoFicha ? (
          <div className="space-y-4">
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          </div>
        ) : (
          <>
            {/* Datos de la atención */}
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <CampoFormulario etiqueta="Plantilla" requerido error={errores.plantilla} ancho="sm:col-span-2">
                <ShadcnSelect
                  nombreDefault="Seleccione una plantilla..."
                  className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm"
                  value={idPlantilla}
                  opciones={plantillas.map((p) => ({
                    value: String(p.id_plantilla),
                    label: p.nombre,
                  }))}
                  onChange={seleccionarPlantilla}
                />
              </CampoFormulario>

              <CampoFormulario
                etiqueta="Fecha de consulta"
                requerido
                error={errores.fecha}
                ayuda="Fecha en que se realizó la atención."
              >
                <ShadcnDatePicker
                  label=""
                  placeholder="Seleccione fecha"
                  className="h-11 w-full rounded-xl border-slate-200"
                  value={fechaConsulta}
                  onChange={(fecha) => {
                    setFechaConsulta(fecha);
                    setErrores((prev) => ({ ...prev, fecha: undefined }));
                  }}
                />
              </CampoFormulario>

              <CampoFormulario
                etiqueta="Profesional a cargo"
                requerido
                error={errores.profesional}
                ayuda={profesionalTexto || "El RUT se completa automáticamente."}
              >
                <ShadcnSelect
                  nombreDefault="Seleccionar profesional..."
                  className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm"
                  value={idProfesional}
                  opciones={listaProfesionales.map((p) => ({
                    value: String(p.id_profesional),
                    label: p.nombreProfesional,
                  }))}
                  onChange={(value) => {
                    setIdProfesional(value);
                    setProfesionalTexto(
                      etiquetaProfesionalConRut(profesionalPorId(listaProfesionales, value))
                    );
                    setErrores((prev) => ({ ...prev, profesional: undefined }));
                  }}
                />
              </CampoFormulario>
            </div>

            {/* Campos de la plantilla */}
            {cargandoPlantilla ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                ))}
              </div>
            ) : plantillaCompleta ? (
              <div className="space-y-5">
                {plantillaCompleta.categorias.map((categoria) => (
                  <section key={categoria.id_categoria} className="rounded-2xl border border-slate-200">
                    <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">
                        {categoria.nombre}
                      </h3>
                    </header>
                    <div className="space-y-4 p-4">
                      {categoria.campos.length === 0 ? (
                        <p className="text-[12px] italic text-slate-400">Esta sección no tiene campos.</p>
                      ) : (
                        categoria.campos.map((campo) => (
                          <CampoFormulario
                            key={campo.id_campo}
                            etiqueta={campo.nombre}
                            requerido={campo.requerido === 1}
                            htmlFor={`editar-campo-${campo.id_campo}`}
                          >
                            <Textarea
                              id={`editar-campo-${campo.id_campo}`}
                              value={datosDinamicos[campo.id_campo] || ""}
                              onChange={(e) =>
                                setDatosDinamicos((prev) => ({ ...prev, [campo.id_campo]: e.target.value }))
                              }
                              placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
                              className="min-h-[92px] resize-y rounded-xl border-slate-200 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                            />
                          </CampoFormulario>
                        ))
                      )}
                    </div>
                  </section>
                ))}
                {errores.campos ? (
                  <p role="alert" className="text-[12px] font-medium text-red-600">
                    {errores.campos}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
                <p className="text-[13px] text-slate-500">
                  Esta ficha no tiene una plantilla asociada. Selecciona una para poder editarla.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </ModalBase>
  );
}
