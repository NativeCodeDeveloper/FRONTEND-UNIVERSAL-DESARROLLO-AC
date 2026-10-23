"use client";

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import ModalBase from "@/Componentes/ModalBase";
import CampoFormulario from "@/Componentes/CampoFormulario";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import { ShadcnSelect } from "@/Componentes/shadcnSelect";
import { Textarea } from "@/components/ui/textarea";
import { useProfesionales } from "@/hooks/useProfesionales";
import { etiquetaProfesionalConRut, profesionalPorId } from "@/lib/profesional";
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

// lateral: mostrar como cajon derecho (telemedicina) en vez de dialogo
// centrado, para que la videoconsulta siga visible mientras se llena.
export default function FichaClinicaModal({ abierto, paciente, id_paciente, idProfesionalAgendaAsignada, usuarioCargado, onCerrar, onGuardada, lateral = false }) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [plantillas, setPlantillas] = useState([]);
  const [idPlantilla, setIdPlantilla] = useState("");
  const [plantillaCompleta, setPlantillaCompleta] = useState(null);
  const [cargandoPlantilla, setCargandoPlantilla] = useState(false);

  const [fechaConsulta, setFechaConsulta] = useState("");
  const [profesionalTexto, setProfesionalTexto] = useState("");
  const [idProfesional, setIdProfesional] = useState("");
  const [datosDinamicos, setDatosDinamicos] = useState({});
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const listaProfesionales = useProfesionales();
  const profesionalAsignado = idProfesionalAgendaAsignada
    ? profesionalPorId(listaProfesionales, idProfesionalAgendaAsignada)
    : null;
  const profesionalTextoParaGuardar = idProfesionalAgendaAsignada
    ? etiquetaProfesionalConRut(profesionalAsignado)
    : profesionalTexto;

  const limpiar = useCallback(() => {
    setIdPlantilla("");
    setPlantillaCompleta(null);
    setFechaConsulta("");
    setProfesionalTexto("");
    setIdProfesional("");
    setDatosDinamicos({});
    setErrores({});
  }, []);

  useEffect(() => {
    if (!abierto) return;

    limpiar();

    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${API}/fichaPlantilla/listarPlantillas`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado && Array.isArray(data)) setPlantillas(data);
      } catch (error) {
        console.log(error);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [abierto, API, limpiar]);

  async function seleccionarPlantilla(id_plantilla) {
    setIdPlantilla(id_plantilla);
    setDatosDinamicos({});
    setPlantillaCompleta(null);
    setErrores((prev) => ({ ...prev, plantilla: undefined }));

    if (!id_plantilla) return;

    setCargandoPlantilla(true);

    try {
      const res = await fetch(`${API}/fichaPlantilla/obtenerPlantillaCompleta`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ id_plantilla }),
      });

      if (!res.ok) {
        toast.error("No se pudo cargar la plantilla seleccionada.");
        return;
      }

      setPlantillaCompleta(transformarPlantilla(await res.json()));
    } catch (error) {
      console.log(error);
      toast.error("No se pudo conectar para cargar la plantilla.");
    } finally {
      setCargandoPlantilla(false);
    }
  }

  const progreso = useMemo(
    () => progresoFicha(plantillaCompleta, datosDinamicos),
    [plantillaCompleta, datosDinamicos]
  );

  async function guardar() {
    const nuevosErrores = {};
    const pendientes = [];

    if (!id_paciente) {
      nuevosErrores.paciente = "Debe seleccionar un paciente.";
      pendientes.push("seleccionar el paciente");
    }
    if (!idPlantilla || !plantillaCompleta) {
      nuevosErrores.plantilla = "Seleccione una plantilla.";
      pendientes.push("seleccionar la plantilla");
    }
    if (!fechaConsulta) {
      nuevosErrores.fecha = "Seleccione la fecha de la consulta.";
      pendientes.push("ingresar la fecha de atención");
    }
    if (!usuarioCargado || !profesionalTextoParaGuardar.trim()) {
      nuevosErrores.profesional = idProfesionalAgendaAsignada
        ? "No se encontró el profesional asociado a tu agenda."
        : "Seleccione el profesional a cargo.";
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
      // Mismo endpoint y payload que usaba la pagina NuevaFicha.
      const res = await fetch(`${API}/ficha/insertarFichaClinica`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          id_paciente,
          tipoAtencion: "",
          motivoConsulta: "",
          signosVitales: "",
          observaciones: profesionalTextoParaGuardar,
          anotacionConsulta: "",
          anamnesis: "",
          diagnostico: "",
          indicaciones: "",
          archivosAdjuntos: "",
          fechaConsulta,
          consentimientoFirmado: "",
          id_plantilla: idPlantilla,
          datosDinamicos: enriquecerDatosFicha(plantillaCompleta, datosDinamicos),
        }),
        mode: "cors",
      });

      if (!res.ok) {
        toast.error("El servidor rechazó la ficha. Intenta nuevamente o contacta a soporte.");
        return;
      }

      const respuesta = await res.json();

      if (respuesta?.message !== true) {
        toast.error("No se pudo guardar la ficha. Revisa los datos e intenta nuevamente.");
        return;
      }

      toast.success("Ficha clínica creada.");
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

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      bloquearCierre={guardando}
      lateral={lateral}
      ancho="max-w-3xl"
      titulo="Nueva ficha clínica"
      descripcion={
        nombrePaciente
          ? `${nombrePaciente}${paciente?.rut ? ` · RUT ${formatRut(paciente.rut) || paciente.rut}` : ""}`
          : undefined
      }
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
            disabled={guardando || !usuarioCargado || Boolean(idProfesionalAgendaAsignada && !profesionalAsignado)}
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
              "Guardar ficha"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5 pb-2">
        {/* Datos de la atencion. En el cajon lateral el panel mide ~480px
            aunque la ventana sea ancha, asi que los dos select quedan en una
            sola columna: sm:grid-cols-2 mira el ancho de la VENTANA, no del
            panel, y ahi se quebrarian en dos mitades muy angostas. */}
        <div className={lateral ? "grid grid-cols-1 gap-y-4" : "grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2"}>
          <CampoFormulario etiqueta="Plantilla" requerido error={errores.plantilla} ancho={lateral ? undefined : "sm:col-span-2"}>
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
            // Mientras esta vacia lo dice explicitamente, en vez de dejarlo a
            // cargo de un asterisco: es el campo que mas se olvida al crear.
            ayuda={
              fechaConsulta
                ? "Fecha en que se realizó la atención."
                : "Obligatorio · selecciona la fecha de la atención."
            }
            resaltarAyuda={!fechaConsulta}
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
            ayuda={profesionalTextoParaGuardar || (idProfesionalAgendaAsignada
              ? "No se encontró el profesional asociado a tu agenda."
              : "El RUT se completa automáticamente.")}
          >
            {!usuarioCargado || idProfesionalAgendaAsignada ? (
              <div className="flex h-11 w-full items-center rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-medium text-violet-900">
                {!usuarioCargado
                  ? "Cargando usuario..."
                  : profesionalAsignado?.nombreProfesional || (listaProfesionales.length > 0
                    ? "Profesional asignado no disponible"
                    : "Cargando profesional asignado...")}
              </div>
            ) : (
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
            )}
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
                        htmlFor={`campo-${campo.id_campo}`}
                      >
                        <Textarea
                          id={`campo-${campo.id_campo}`}
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
              Selecciona una plantilla para cargar los campos de la ficha.
            </p>
          </div>
        )}
      </div>
    </ModalBase>
  );
}
