"use client";

/**
 * AppointmentDrawer.jsx
 * Panel lateral derecho con información completa de una reserva.
 * Reemplaza al popup flotante draggable (que queda comentado en calendario/page.jsx).
 *
 * Props:
 *   - reserva: objeto reserva del backend (resource del evento)
 *   - start: Date
 *   - end: Date
 *   - mode: 'view' | 'create' | 'edit'
 *   - onClose: () => void
 *   - onConfirmar: () => Promise<void>
 *   - onActualizar: (datos) => Promise<void>
 *   - onCambiarEstado: (estado) => Promise<void>
 *   - onEliminar: () => Promise<void>
 *   - onBloquear: (motivo) => Promise<void>
 *   - onVerFichaClinica: (reserva) => Promise<void>
 *   - listaProfesionales: array
 *   - id_profesional: string
 *   - selectionDraft: { start, end, profesional }
 *   - popupForm: { nombrePaciente, apellidoPaciente, rut, telefono, email, motivoBloqueo }
 *   - onPopupFormChange: (field, value) => void
 *   - actualizarHora: (campo, hora) => void
 *   - actualizarFecha: (fecha) => void
 *   - formatHora: (date) => string
 *   - formatFecha: (date) => string
 *   - formatFechaLarga: (date) => string
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/Componentes/StatusBadge";
import { AvatarInitials } from "@/Componentes/AvatarInitials";
import { RutInput } from "@/Componentes/RutInput";
import { PhoneInput } from "@/Componentes/PhoneInput";
import { RutDisplay } from "@/Componentes/RutDisplay";
import { RecordatorioPaciente } from "@/Componentes/RecordatorioPaciente";
import { getStateTokens } from "@/lib/designTokens";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { canAccessFichasClinicas, getDashboardRoleFromUser } from "@/lib/dashboard-access";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { format } from "date-fns";

const ACCIONES_ESTADO = [
  { valor: "confirmada", etiqueta: "Confirmar" },
  { valor: "asiste", etiqueta: "Asiste" },
  { valor: "no asiste", etiqueta: "No asiste" },
  { valor: "finalizado", etiqueta: "Finalizar" },
  { valor: "anulada", etiqueta: "Anular" },
];

function getEstadoActionStyle(estado) {
  const token = getStateTokens(estado);

  return {
    backgroundColor: token.bg,
    color: token.text,
    border: `1px solid ${token.border}`,
    borderLeft: `4px solid ${token.accent}`,
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.55)",
  };
}

// ─── Sección de información (solo lectura) ────────────────────────────────────
function InfoSection({ reserva, start, end, formatHora, formatFechaLarga }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const dashboardRole = getDashboardRoleFromUser(user);
  const canSeeFichasClinicas = isLoaded && canAccessFichasClinicas(dashboardRole);
  const nombre = (reserva?.nombrePaciente ?? "").trim();
  const apellido = (reserva?.apellidoPaciente ?? "").trim();
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");
  const prestacion = reserva?.nombrePrestacion ?? reserva?.prestacion ?? reserva?.nombre_prestacion ?? "";
  const modalidad = (reserva?.modalidad ?? "").toLowerCase().trim();
  const estadoPago = reserva?.estadoPago ?? "";
  const token = getStateTokens(reserva?.estadoReserva ?? "reservada");

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Paciente */}
      <div className="flex items-start gap-3">
        <AvatarInitials name={nombreCompleto} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-900 leading-snug truncate">
            {nombreCompleto || "Sin nombre"}
          </p>
          {reserva?.rut && (
            <p className="text-[12px] text-slate-500 mt-0.5">
              <RutDisplay rut={reserva.rut} />
            </p>
          )}
          {reserva?.telefono && (
            <p className="text-[12px] text-slate-500">{reserva.telefono}</p>
          )}
          {reserva?.email && (
            <p className="text-[12px] text-slate-400 truncate">{reserva.email}</p>
          )}
        </div>
      </div>

      {/* Estado + Pago */}
      <div className="flex flex-wrap gap-2">
        <StatusBadge estado={reserva?.estadoReserva ?? ""} size="md" />
        {estadoPago && <StatusBadge estado={estadoPago} size="md" />}
      </div>

      {/* Fecha / Hora */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1.5">
        {start && (
          <p className="text-[13px] font-semibold text-slate-800 capitalize">
            {formatFechaLarga ? formatFechaLarga(start) : start.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        )}
        {start && end && (
          <p className="text-[12px] text-slate-500">
            {formatHora ? formatHora(start) : ""} – {formatHora ? formatHora(end) : ""}
          </p>
        )}
      </div>

      {/* Tipo de consulta + Modalidad */}
      {(prestacion || modalidad) && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2">
          {prestacion && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-0.5">
                Tipo de consulta
              </p>
              <p className="text-[13px] font-semibold text-slate-800">{prestacion}</p>
            </div>
          )}
          {modalidad && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                modalidad === "online"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {modalidad === "online" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
                {modalidad === "online" ? "Online" : "Presencial"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Accesos rápidos */}
      {reserva?.rut && canSeeFichasClinicas && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Accesos rápidos
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                // Navega a ficha clínica (búsqueda por rut existente en dashboard/page.jsx)
                router.push(`/dashboard?rut=${encodeURIComponent(reserva.rut)}`);
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver ficha
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/FichasPacientes?rut=${encodeURIComponent(reserva.rut)}`)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Carpeta
            </button>
          </div>
        </div>
      )}

      {/* Recordatorio (correo / WhatsApp) */}
      {(reserva?.email || reserva?.telefono) && (
        <RecordatorioPaciente
          // key fuerza el remonte al cambiar de paciente: sin esto, si el usuario
          // pasa de una reserva a otra sin cerrar el drawer, React reutiliza la
          // misma instancia y el asunto/mensaje editados a mano para el paciente
          // anterior quedan pegados aunque email/telefono ya cambiaron por props.
          key={reserva?.rut || reserva?.email || reserva?.telefono}
          email={reserva?.email}
          telefono={reserva?.telefono}
          nombreProfesional={reserva?.nombreProfesional}
          compact
        />
      )}

      {/* Acciones clínicas rápidas */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Cambiar estado
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {ACCIONES_ESTADO.map((accion) => (
            <button
              key={accion.valor}
              type="button"
              // onCambiarEstado viene del prop del padre
              data-estado={accion.valor}
              className="w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 hover:brightness-[0.98] active:scale-[0.99]"
              style={getEstadoActionStyle(accion.valor)}
            >
              {accion.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Repetir cita en más fechas (agendamiento múltiple) ───────────────────────
// Calendario chico tipo el de bloqueosAgenda (mode="multiple") para elegir días
// adicionales donde agendar al mismo paciente, a la misma hora. La validación de
// choques (citas + bloqueos) y el envío real ocurren en calendario/page.jsx —
// acá solo se recolectan las fechas elegidas.
function RepetirFechasSection({ popupForm, onPopupFormChange, selectionDraft, formatHora }) {
  const fechasRepeticion = Array.isArray(popupForm.fechasRepeticion) ? popupForm.fechasRepeticion : [];
  const [abierto, setAbierto] = useState(false);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setMonth(limite.getMonth() + 3);

  const diasDeshabilitados = [{ before: hoy }, { after: limite }];
  if (selectionDraft?.start) diasDeshabilitados.push(selectionDraft.start);

  // Cualquier cambio en las fechas invalida una confirmación previa — obliga a
  // revisar la lista de nuevo antes de poder agendar (ver botón "Agendar" en el footer).
  function actualizarFechas(nuevasFechas) {
    onPopupFormChange("fechasRepeticion", nuevasFechas);
    onPopupFormChange("confirmacionFechasRepeticion", false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
          Repetir cita en más fechas (opcional)
          {fechasRepeticion.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-violet-100 text-[#6E56CF] text-[10px] font-bold px-1.5 py-0.5 normal-case tracking-normal">
              {fechasRepeticion.length}
            </span>
          )}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[11px] text-slate-400 mb-1">
            Agenda al mismo paciente en otros días, a la misma hora{selectionDraft?.start && selectionDraft?.end ? ` (${formatHora ? formatHora(selectionDraft.start) : ""}–${formatHora ? formatHora(selectionDraft.end) : ""})` : ""}. Haz clic con cuidado: cada día que selecciones acá crea una reserva real.
          </p>

          {/* Tamaño natural del calendario (sin escalar) para que las celdas de día
              sean del mismo tamaño que en bloqueosAgenda y no se preste a un clic
              en el día equivocado por un objetivo demasiado pequeño. */}
          <div className="rounded-xl border border-slate-200 bg-white flex justify-center py-1 overflow-x-auto">
            <Calendar
              mode="multiple"
              selected={fechasRepeticion}
              onSelect={(dias) => actualizarFechas(dias ?? [])}
              locale={es}
              disabled={diasDeshabilitados}
              showOutsideDays={false}
              className="rounded-xl"
            />
          </div>

          {fechasRepeticion.length > 0 && (
            <>
              <div className="flex items-center justify-between ml-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {fechasRepeticion.length} fecha(s) adicional(es)
                </span>
                <button
                  type="button"
                  onClick={() => actualizarFechas([])}
                  className="text-[10px] font-semibold text-rose-400 hover:text-rose-600 transition-colors"
                >
                  Limpiar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...fechasRepeticion].sort((a, b) => a - b).map((dia) => (
                  <span
                    key={dia.toISOString()}
                    className="inline-flex items-center gap-1 bg-violet-100 text-[#6E56CF] text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  >
                    {format(dia, "EEE d MMM", { locale: es })}
                    <button
                      type="button"
                      onClick={() => actualizarFechas(fechasRepeticion.filter((d) => d.toISOString() !== dia.toISOString()))}
                      className="hover:text-rose-500 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Confirmación obligatoria: el botón "Agendar" del footer queda deshabilitado
                  hasta que se marque esta casilla — última barrera antes de crear varias
                  reservas reales de una sola vez. */}
              <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!popupForm.confirmacionFechasRepeticion}
                  onChange={(e) => onPopupFormChange("confirmacionFechasRepeticion", e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 accent-violet-600 focus:ring-2 focus:ring-violet-200"
                />
                <span className="text-[11px] font-semibold text-slate-600 leading-snug">
                  Revisé la lista de arriba y son las fechas correctas. Se creará 1 reserva el día principal + {fechasRepeticion.length} más. Si alguna fecha ya tiene una cita o un bloqueo, esa fecha no se agenda y se avisa al finalizar.
                </span>
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulario crear / editar ────────────────────────────────────────────────
function FormSection({
  mode,
  popupForm,
  onPopupFormChange,
  selectionDraft,
  actualizarHora,
  actualizarFecha,
  formatHora,
  formatFechaLarga,
  onConfirmar,
  onActualizar,
  onEliminar,
  // listaPrestaciones: array de { id_servicioProfesional, nombreServicio }
  // — requiere que el endpoint /serviciosProfesionales/seleccionarTodosServiciosProfesionales
  //   esté llamado desde el padre y que el resultado se pase aquí.
  listaPrestaciones = [],
  listaTarifasProfesional = [],
  onBloquear,
  onCambiarEstado,
}) {
  const formatLocal = (d) => {
    if (!d) return "";
    try {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  };

  const formatTimeVal = (d) => {
    if (!d) return "";
    try {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const inputClass =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none transition-all focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
  const labelClass = "block text-[11px] font-semibold text-slate-500 mb-1";
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [pacienteCoincidente, setPacienteCoincidente] = useState(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [errorBusquedaPaciente, setErrorBusquedaPaciente] = useState("");
  const esRutDesconocido = String(popupForm.rut ?? "")
    .replace(/\s/g, "")
    .toUpperCase() === "RUTDESCONOCIDO";

  useEffect(() => {
    const rutBusqueda = String(popupForm.rut ?? "")
      .replace(/[^0-9kK]/g, "")
      .toUpperCase();

    setPacienteCoincidente(null);
    setErrorBusquedaPaciente("");

    if (esRutDesconocido || (rutBusqueda.length !== 8 && rutBusqueda.length !== 9)) {
      setBuscandoPaciente(false);
      return;
    }

    const controlador = new AbortController();
    const temporizador = window.setTimeout(async () => {
      try {
        setBuscandoPaciente(true);
        const respuesta = await fetch(`${API}/pacientes/buscarRutEspecifico`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ rut: rutBusqueda }),
          mode: "cors",
          signal: controlador.signal,
        });

        if (!respuesta.ok) {
          throw new Error("No fue posible consultar el RUT.");
        }

        const datos = await respuesta.json();
        const pacientes = Array.isArray(datos) ? datos : datos ? [datos] : [];
        const coincidenciaExacta = pacientes.find((paciente) =>
          String(paciente?.rut ?? "")
            .replace(/[^0-9kK]/g, "")
            .toUpperCase() === rutBusqueda
        );

        if (!controlador.signal.aborted) {
          setPacienteCoincidente(coincidenciaExacta || null);
          if (coincidenciaExacta) {
            onPopupFormChange("nombrePaciente", coincidenciaExacta.nombre ?? "");
            onPopupFormChange("apellidoPaciente", coincidenciaExacta.apellido ?? "");
            onPopupFormChange("telefono", coincidenciaExacta.telefono ?? "");
            onPopupFormChange("email", coincidenciaExacta.correo ?? "");
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorBusquedaPaciente("No fue posible consultar los datos del paciente.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setBuscandoPaciente(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [API, esRutDesconocido, popupForm.rut]);

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Rango de fecha/hora */}
      {selectionDraft && (
        <div data-tour="reserva-horario" className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
            Horario
          </p>
          <div>
            <label className={labelClass}>Fecha</label>
            <input
              type="date"
              value={formatLocal(selectionDraft.start)}
              onChange={(e) => actualizarFecha(e.target.value)}
              className={inputClass} style={{ colorScheme: "light" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Inicio</label>
              <input
                type="time"
                step="900"
                value={formatTimeVal(selectionDraft.start)}
                onChange={(e) => actualizarHora("start", e.target.value)}
                className={inputClass} style={{ colorScheme: "light" }}
              />
            </div>
            <div>
              <label className={labelClass}>Término</label>
              <input
                type="time"
                step="900"
                value={formatTimeVal(selectionDraft.end)}
                onChange={(e) => actualizarHora("end", e.target.value)}
                className={inputClass} style={{ colorScheme: "light" }}
              />
            </div>
          </div>
          {selectionDraft.profesional && (
            <p className="text-[12px] text-slate-500">
              Profesional: <span className="font-semibold text-slate-700">{selectionDraft.profesional}</span>
            </p>
          )}
        </div>
      )}

      {/* Datos del paciente */}
      {mode !== "bloqueo" && (
        <div data-tour="reserva-paciente" className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-2">
            Datos del paciente
          </p>
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="block text-[11px] font-semibold text-slate-500">RUT</label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={esRutDesconocido}
                  onChange={(e) => onPopupFormChange("rut", e.target.checked ? "RUT DESCONOCIDO" : "")}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600 focus:ring-2 focus:ring-violet-200"
                />
                RUT desconocido
              </label>
            </div>
            {esRutDesconocido ? (
              <input
                type="text"
                value="RUT DESCONOCIDO"
                disabled
                className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 text-[13px] font-semibold text-slate-500 outline-none"
                aria-label="RUT desconocido"
              />
            ) : (
              <RutInput
                value={popupForm.rut}
                onChange={(clean) => onPopupFormChange("rut", clean)}
              />
            )}
            {buscandoPaciente && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-500">
                <svg className="h-3.5 w-3.5 animate-spin text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Buscando paciente...
              </div>
            )}
            {errorBusquedaPaciente && (
              <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">
                {errorBusquedaPaciente}
              </p>
            )}
            {pacienteCoincidente && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Paciente encontrado
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                value={popupForm.nombrePaciente}
                onChange={(e) => onPopupFormChange("nombrePaciente", e.target.value)}
                className={inputClass} style={{ colorScheme: "light" }}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className={labelClass}>Apellido</label>
              <input
                value={popupForm.apellidoPaciente}
                onChange={(e) => onPopupFormChange("apellidoPaciente", e.target.value)}
                className={inputClass} style={{ colorScheme: "light" }}
                placeholder="Apellido"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <PhoneInput
              value={popupForm.telefono}
              onChange={(full) => onPopupFormChange("telefono", full)}
            />
          </div>
          <div>
            <label className={labelClass}>Correo (opcional)</label>
            <input
              type="email"
              value={popupForm.email}
              onChange={(e) => onPopupFormChange("email", e.target.value)}
              className={inputClass} style={{ colorScheme: "light" }}
              placeholder="No indicado"
            />
          </div>
        </div>
      )}

      {/* Selector de tarifa / servicio del profesional */}
      {mode !== "bloqueo" && listaTarifasProfesional.length > 0 && (
        <div data-tour="reserva-servicio" className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">
            Servicio
          </p>
          <div>
            <label className={labelClass}>Tipo de atenci&oacute;n</label>
            <select
              value={popupForm.motivo_reserva ?? ""}
              onChange={(e) => {
                const selectedValue = e.target.value;
                if (!selectedValue) {
                  onPopupFormChange("motivo_reserva", "");
                  onPopupFormChange("monto_reserva", "");
                  return;
                }
                const tarifa = listaTarifasProfesional.find(
                  (t) => t.nombreServicio === selectedValue
                );
                if (tarifa) {
                  onPopupFormChange("motivo_reserva", tarifa.nombreServicio);
                  onPopupFormChange("monto_reserva", tarifa.precio);
                }
              }}
              className={inputClass}
              style={{ colorScheme: "light" }}
            >
              <option value="">— Seleccione un servicio —</option>
              {listaTarifasProfesional.map((t) => (
                <option key={t.id_tarifaProfesional} value={t.nombreServicio}>
                  {t.nombreServicio} - ${Number(t.precio).toLocaleString("es-CL")}
                </option>
              ))}
            </select>
          </div>
          {popupForm.monto_reserva && (
            <p className="text-[12px] text-slate-500">
              Monto: <span className="font-semibold text-slate-700">${Number(popupForm.monto_reserva).toLocaleString("es-CL")}</span>
            </p>
          )}
        </div>
      )}

      {/* Repetir cita en más fechas — agenda al mismo paciente, mismo horario y mismo
          profesional/servicio en días adicionales (ej: todos los martes del mes). */}
      {mode === "create" && (
        <RepetirFechasSection
          popupForm={popupForm}
          onPopupFormChange={onPopupFormChange}
          selectionDraft={selectionDraft}
          formatHora={formatHora}
        />
      )}

      {/* ── Tipo de consulta + Modalidad ── PENDIENTE BD ──
          Descomentar cuando estén aplicadas las migraciones:
          1. ALTER TABLE reservaciones ADD COLUMN nombre_prestacion VARCHAR(255) NULL;
          2. ALTER TABLE reservaciones ADD COLUMN modalidad VARCHAR(20) DEFAULT 'presencial';
          3. Actualizar endpoints insertarReserva y actualizarReservacion para aceptar estos campos.
          4. Retornar ambos campos en todos los SELECTs de reservas.

      {mode !== "bloqueo" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Consulta
          </p>

          <div>
            <label className={labelClass}>Tipo de consulta</label>
            {listaPrestaciones.length > 0 ? (
              <select
                value={popupForm.prestacion ?? ""}
                onChange={(e) => onPopupFormChange("prestacion", e.target.value)}
                className={inputClass}
                style={{ colorScheme: "light" }}
              >
                <option value="">— Sin especificar —</option>
                {listaPrestaciones.map((s) => (
                  <option key={s.id_servicioProfesional} value={s.nombreServicio}>
                    {s.nombreServicio}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={popupForm.prestacion ?? ""}
                onChange={(e) => onPopupFormChange("prestacion", e.target.value)}
                className={inputClass}
                style={{ colorScheme: "light" }}
                placeholder="Ej: Consulta inicial, Control, Evaluación..."
              />
            )}
          </div>

          <div>
            <label className={labelClass}>Modalidad</label>
            <div className="flex gap-2">
              {[
                {
                  valor: "presencial",
                  label: "Presencial",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  ),
                  active: "bg-emerald-500 text-white border-emerald-500",
                  inactive: "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
                },
                {
                  valor: "online",
                  label: "Online",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  ),
                  active: "bg-blue-500 text-white border-blue-500",
                  inactive: "bg-white text-slate-600 border-slate-200 hover:border-blue-300",
                },
              ].map(({ valor, label, icon, active, inactive }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => onPopupFormChange("modalidad", valor)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all duration-150 ${
                    (popupForm.modalidad ?? "presencial") === valor ? active : inactive
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      ── Fin bloque comentado ── */}

      {/* Bloqueo rápido */}
      {mode === "create" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
            Bloqueo rápido (opcional)
          </p>
          <div>
            <label className={labelClass}>Motivo del bloqueo</label>
            <input
              value={popupForm.motivoBloqueo}
              onChange={(e) => onPopupFormChange("motivoBloqueo", e.target.value)}
              className={inputClass} style={{ colorScheme: "light" }}
              placeholder="Vacaciones, reunión, pausa..."
            />
          </div>
        </div>
      )}

      {/* Recordatorio (correo / WhatsApp) — solo tiene sentido si ya existe la reserva */}
      {mode === "edit" && (popupForm.email || popupForm.telefono) && (
        <RecordatorioPaciente
          // key fuerza el remonte al cambiar de reserva (ver comentario análogo en InfoSection).
          key={selectionDraft?.id_reserva || popupForm.rut || popupForm.email || popupForm.telefono}
          email={popupForm.email}
          telefono={popupForm.telefono}
          nombreProfesional={selectionDraft?.profesional}
          compact
        />
      )}

      {/* Cambio de estado en modo edición */}
      {mode === "edit" && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
            Cambiar estado
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {ACCIONES_ESTADO.map((accion) => (
              <button
                key={accion.valor}
                type="button"
                onClick={() => onCambiarEstado(accion.valor)}
                className="w-full rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-150 hover:brightness-[0.98] active:scale-[0.99]"
                style={getEstadoActionStyle(accion.valor)}
              >
                {accion.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drawer principal ─────────────────────────────────────────────────────────
export function AppointmentDrawer({
  reserva,
  start,
  end,
  mode = "view",
  onClose,
  onConfirmar,
  onActualizar,
  onCambiarEstado,
  onEliminar,
  onBloquear,
  onVerFichaClinica,
  cargandoFichaClinica = false,
  listaProfesionales = [],
  // listaPrestaciones: array de servicios del sistema para el dropdown de tipo de consulta.
  // Se obtiene del endpoint GET /serviciosProfesionales/seleccionarTodosServiciosProfesionales
  // y se pasa desde calendario/page.jsx.
  listaPrestaciones = [],
  listaTarifasProfesional = [],
  id_profesional,
  selectionDraft,
  // popupForm ahora incluye: prestacion y modalidad además de los campos base
  popupForm = { nombrePaciente: "", apellidoPaciente: "", rut: "", telefono: "", email: "", motivoBloqueo: "", prestacion: "", modalidad: "presencial", fechasRepeticion: [], confirmacionFechasRepeticion: false },
  onPopupFormChange,
  actualizarHora,
  actualizarFecha,
  formatHora,
  formatFechaLarga,
}) {
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef(null);
  const { user, isLoaded } = useUser();
  const dashboardRole = getDashboardRoleFromUser(user);
  const canSeeFichasClinicas = isLoaded && canAccessFichasClinicas(dashboardRole);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar con Esc
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isViewMode = mode === "view";
  const title = mode === "create" ? "Nueva reserva" : mode === "edit" ? "Editar reserva" : "Detalle de reserva";

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Overlay semitransparente */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <aside
        ref={drawerRef}
        data-tour="reserva-drawer"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.10)] border-l border-slate-200"
        style={{ animation: "slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header del drawer */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-500">
              Agenda Clínica
            </p>
            <h2 className="text-[16px] font-bold text-slate-800 leading-snug mt-0.5">
              {title}
            </h2>
            {mode === "edit" && canSeeFichasClinicas && (
              <button
                type="button"
                onClick={() => onVerFichaClinica?.(reserva)}
                disabled={cargandoFichaClinica}
                className="mt-3 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-violet-200 bg-violet-50 px-3 text-[11px] font-bold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-wait disabled:opacity-60"
              >
                {cargandoFichaClinica ? (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {cargandoFichaClinica ? "Buscando ficha..." : "Ver ficha clínica"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Cerrar panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto">
          {isViewMode ? (
            <InfoSection
              reserva={reserva}
              start={start}
              end={end}
              formatHora={formatHora}
              formatFechaLarga={formatFechaLarga}
            />
          ) : (
            <FormSection
              mode={mode}
              popupForm={popupForm}
              onPopupFormChange={onPopupFormChange}
              selectionDraft={selectionDraft}
              actualizarHora={actualizarHora}
              actualizarFecha={actualizarFecha}
              formatHora={formatHora}
              formatFechaLarga={formatFechaLarga}
              onConfirmar={onConfirmar}
              onActualizar={onActualizar}
              onEliminar={onEliminar}
              onBloquear={onBloquear}
              onCambiarEstado={onCambiarEstado}
              listaPrestaciones={listaPrestaciones}
              listaTarifasProfesional={listaTarifasProfesional}
            />
          )}
        </div>

        {/* Footer con acciones primarias */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 flex-shrink-0">
          {isViewMode ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cerrar
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                {mode === "create" && (() => {
                  const fechasRepeticion = Array.isArray(popupForm.fechasRepeticion) ? popupForm.fechasRepeticion : [];
                  // Si hay fechas de repetición, exige revisar el checkbox de confirmación
                  // antes de poder agendar — evita crear varias citas reales por un clic
                  // apurado o un día mal seleccionado en el mini-calendario.
                  const requiereConfirmarRepeticion = fechasRepeticion.length > 0 && !popupForm.confirmacionFechasRepeticion;
                  return (
                    <button
                      type="button"
                      data-tour="reserva-guardar"
                      disabled={requiereConfirmarRepeticion}
                      onClick={() => {
                        if (popupForm.motivoBloqueo?.trim()) {
                          onBloquear?.(popupForm.motivoBloqueo);
                        } else {
                          onConfirmar?.();
                        }
                      }}
                      className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={requiereConfirmarRepeticion ? "Revisa y confirma la lista de fechas adicionales antes de agendar" : undefined}
                    >
                      {popupForm.motivoBloqueo?.trim() ? "Bloquear horario" : "Agendar"}
                    </button>
                  );
                })()}
                {mode === "edit" && (
                  <>
                    <button
                      type="button"
                      onClick={onEliminar}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={onActualizar}
                      className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                    >
                      Actualizar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-400 mt-1">Atajo: <kbd className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-mono">Esc</kbd> para cerrar</p>
        </div>
      </aside>

      {/* Animación CSS inline */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
      `}</style>
    </>,
    document.body
  );
}
