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
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
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

// ─── Selector de hora (formato 24 horas) ─────────────────────────────────────
// Dos campos: hora y minuto, ambos en 24 horas. Se eligio 24 h sobre AM/PM a
// proposito: confundir 12 AM con 12 PM es un error clasico, y con 24 h el
// problema no existe. Ademas desaparece un control de la fila.
//
// CONTRATO: emite el mismo string "HH:MM" en 24 horas que entregaba el
// <input type="time">, asi que actualizarHora() y toda la validacion de
// calendario/page.jsx siguen funcionando sin cambios.

const TODOS_LOS_MINUTOS = Array.from({ length: 60 }, (_, m) => m);

const dosDigitos = (n) => String(n).padStart(2, "0");

function partesDesde24(valor24) {
  const [h, m] = String(valor24 ?? "").split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hora: h, minuto: m };
}

// Campo combinado: se escribe el numero o se elige de una lista que scrollea
// dentro de su propia caja. Sin flechas y sin listas a pantalla completa.
//
// Solo acepta digitos. Mientras se escribe, el texto vive en estado local para
// poder teclear con libertad; al salir del campo se vuelve al valor real, de
// modo que el campo nunca queda mostrando algo distinto de lo que se guardara.
function CampoNumerico({
  valor,
  opciones,
  onElegir,
  etiquetaAria,
  estaHabilitada = () => true,
  inputClass,
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(null); // null = mostrar el valor real
  const cajaRef = useRef(null);
  const listaRef = useRef(null);

  // Cerrar al hacer clic fuera del campo.
  useEffect(() => {
    if (!abierto) return;
    const alClicarFuera = (e) => {
      if (!cajaRef.current?.contains(e.target)) {
        setAbierto(false);
        setTexto(null);
      }
    };
    document.addEventListener("mousedown", alClicarFuera);
    return () => document.removeEventListener("mousedown", alClicarFuera);
  }, [abierto]);

  // Al abrir, dejar a la vista la opcion elegida: si esta "mas abajo", la lista
  // aparece ya scrolleada hasta ella.
  useEffect(() => {
    if (!abierto) return;
    const elegido = listaRef.current?.querySelector('[data-elegido="si"]');
    if (elegido) elegido.scrollIntoView({ block: "center" });
  }, [abierto, valor]);

  const tope = opciones.length ? opciones[opciones.length - 1] : 59;
  const mostrado = texto !== null ? texto : dosDigitos(valor);

  function escribir(bruto) {
    // Solo digitos, maximo 2. Letras y signos no entran.
    const digitos = bruto.replace(/\D/g, "").slice(0, 2);
    if (digitos === "") {
      setTexto("");
      return;
    }
    const n = Number(digitos);
    // Un numero que ni siquiera puede existir (un 60 en los minutos, un 30 en
    // la hora) se ignora: la tecla no entra y queda lo anterior.
    if (n > tope) return;
    setTexto(digitos);
    // Se guarda solo si es una opcion permitida Y habilitada. Lo segundo es
    // clave: la lista ya apaga los valores que la agenda rechazaria (el minuto
    // 30 cuando la hora es 23), pero sin esta condicion el mismo valor entraba
    // igual escribiendolo a mano y rebotaba con un toast de error.
    // Los valores intermedios (el "1" mientras se escribe "14") se muestran
    // pero no se emiten.
    if (opciones.includes(n) && estaHabilitada(n)) onElegir(n);
  }

  function cerrar() {
    setTexto(null);
    setAbierto(false);
  }

  return (
    <div ref={cajaRef} className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={etiquetaAria}
        value={mostrado}
        onChange={(e) => escribir(e.target.value)}
        onFocus={() => setAbierto(true)}
        onClick={() => setAbierto(true)}
        onBlur={() => setTexto(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); cerrar(); }
          if (e.key === "Escape") cerrar();
        }}
        className={`${inputClass} pr-7 text-center`}
        style={{ colorScheme: "light" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {abierto && (
        <ul
          ref={listaRef}
          role="listbox"
          aria-label={etiquetaAria}
          className="absolute z-30 mt-1 max-h-[184px] w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
        >
          {opciones.map((n) => {
            const habilitada = n === valor || estaHabilitada(n);
            const elegido = n === valor;
            return (
              <li key={n}>
                <button
                  type="button"
                  role="option"
                  aria-selected={elegido}
                  data-elegido={elegido ? "si" : "no"}
                  disabled={!habilitada}
                  // onMouseDown y no onClick: el blur del input ocurre antes que
                  // el click y cerraria la lista antes de alcanzar a elegir.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onElegir(n);
                    cerrar();
                  }}
                  className={`w-full px-3 py-1.5 text-left text-[13px] tabular-nums transition-colors ${
                    elegido
                      ? "bg-violet-50 font-semibold text-violet-700"
                      : habilitada
                        ? "text-slate-700 hover:bg-slate-50"
                        : "cursor-not-allowed text-slate-300"
                  }`}
                >
                  {dosDigitos(n)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SelectorHora({
  etiqueta,
  valor,
  onCambio,
  labelClass,
  inputClass,
  // Horas que ofrece la lista (ej: 8..23). Vienen del rango de la agenda.
  horas,
  // Recibe el total de minutos del dia y responde si esa hora es elegible.
  esValida = () => true,
}) {
  const partes = partesDesde24(valor);
  if (!partes) return null;
  const { hora, minuto } = partes;

  const emitir = (h, m) => onCambio(`${dosDigitos(h)}:${dosDigitos(m)}`);
  const totalDe = (h, m) => h * 60 + m;

  // Al elegir una hora nueva, si el minuto actual ya no sirve para ella (las 23
  // con minuto 30, por ejemplo) se baja al primer minuto que si sirve. Asi no
  // salta el toast de horario invalido.
  function elegirHora(h) {
    if (esValida(totalDe(h, minuto))) return emitir(h, minuto);
    const primerMinutoValido = TODOS_LOS_MINUTOS.find((m) => esValida(totalDe(h, m)));
    emitir(h, primerMinutoValido ?? 0);
  }

  const horaHabilitada = (h) => TODOS_LOS_MINUTOS.some((m) => esValida(totalDe(h, m)));
  const minutoHabilitado = (m) => esValida(totalDe(hora, m));

  // Aviso cuando la hora mostrada cae fuera del horario de la agenda. El caso
  // real es abrir una reserva antigua agendada fuera de rango: se muestra tal
  // cual (no se toca el dato) pero se advierte por que.
  const valorFueraDeRango = !esValida(totalDe(hora, minuto));

  return (
    <div>
      <label className={labelClass}>{etiqueta}</label>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <CampoNumerico
          valor={hora}
          opciones={horas}
          onElegir={elegirHora}
          etiquetaAria={`${etiqueta}: hora`}
          estaHabilitada={horaHabilitada}
          inputClass={inputClass}
        />
        <span aria-hidden className="text-[15px] font-semibold text-slate-400">:</span>
        <CampoNumerico
          valor={minuto}
          opciones={TODOS_LOS_MINUTOS}
          onElegir={(m) => emitir(hora, m)}
          etiquetaAria={`${etiqueta}: minutos`}
          estaHabilitada={minutoHabilitado}
          inputClass={inputClass}
        />
      </div>

      {valorFueraDeRango && (
        <p className="mt-1.5 text-[11px] font-medium text-amber-600">
          Ese horario queda fuera del horario de la agenda.
        </p>
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
  // Rango horario de la agenda, en horas. Llegan desde calendario/page.jsx
  // (HORA_MINIMA_AGENDA / HORA_MAXIMA_AGENDA) para no duplicar el valor aca.
  // Los defaults no restringen: si no llegan, se comporta como antes.
  horaMinima = 0,
  horaMaxima = 24,
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

  // text-[16px] en movil no es capricho: iOS Safari hace zoom automatico al
  // enfocar un input con letra menor a 16px, y ese zoom descuadra el panel.
  // Desde sm vuelve a 13px. h-11 = 44px, el objetivo tactil minimo de Apple.
  const inputClass =
    "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-[16px] sm:text-[13px] text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100/70";
  const labelClass = "block text-[11px] font-medium text-slate-500 mb-1.5";
  const selectClass = `${inputClass} cursor-pointer pr-8`;

  // Reglas de que horas se pueden elegir. Son las mismas que ya valida
  // calendario/page.jsx; aca solo se usan para apagar las opciones imposibles,
  // que es el punto del cambio: que no se pueda elegir mal, en vez de elegir
  // mal y recibir un error.
  const minutosAgenda = (d) =>
    d instanceof Date && !Number.isNaN(d.getTime()) ? d.getHours() * 60 + d.getMinutes() : null;
  const limiteInferior = horaMinima * 60;
  const limiteSuperior = horaMaxima * 60;
  const inicioEnMinutos = minutosAgenda(selectionDraft?.start);

  const inicioValido = (total) => total >= limiteInferior && total < limiteSuperior;
  const terminoValido = (total) =>
    total <= limiteSuperior && (inicioEnMinutos === null || total > inicioEnMinutos);

  // Horas que ofrecen las listas: exactamente la ventana de la agenda.
  const horasDeAgenda = [];
  for (let h = horaMinima; h <= Math.min(horaMaxima, 23); h += 1) horasDeAgenda.push(h);
  const estiloSelect = {
    colorScheme: "light",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.55rem center",
    backgroundSize: "15px",
  };
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
    <div className="flex flex-col gap-3.5 p-4 sm:p-5">
      {/* Rango de fecha/hora */}
      {selectionDraft && (
        <div data-tour="reserva-horario" className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2.5">
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
          <div className="space-y-2.5">
            <SelectorHora
              etiqueta="Inicio"
              valor={formatTimeVal(selectionDraft.start)}
              onCambio={(hhmm) => actualizarHora("start", hhmm)}
              labelClass={labelClass}
              inputClass={inputClass}
              horas={horasDeAgenda}
              esValida={inicioValido}
            />
            <SelectorHora
              etiqueta="Término"
              valor={formatTimeVal(selectionDraft.end)}
              onCambio={(hhmm) => actualizarHora("end", hhmm)}
              labelClass={labelClass}
              inputClass={inputClass}
              horas={horasDeAgenda}
              esValida={terminoValido}
            />

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
        <div data-tour="reserva-paciente" className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500 mb-2.5">
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
                className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-[16px] sm:text-[13px] font-semibold text-slate-500 outline-none"
                aria-label="RUT desconocido"
              />
            ) : (
              <RutInput
                value={popupForm.rut}
                onChange={(clean) => onPopupFormChange("rut", clean)}
                className="h-11! rounded-xl! text-[16px]! sm:text-[13px]!"
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
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5">
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
              className="h-11! text-[16px]! sm:text-[13px]!"
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
        <div data-tour="reserva-servicio" className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2.5">
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
              className={selectClass}
              style={estiloSelect}
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
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2.5">
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
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2.5">
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
  // Rango horario permitido por la agenda, en horas (ej: 8 y 23). Viene de
  // calendario/page.jsx para que el selector de hora apague las opciones que
  // igual serian rechazadas. Sin estas props no se restringe nada.
  horaMinima,
  horaMaxima,
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
        className="fixed right-2.5 top-2.5 bottom-2.5 z-50 flex w-[calc(100%-1.25rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        style={{ animation: "slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header del drawer */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-500">
              Agenda Clínica
            </p>
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-slate-900 leading-snug mt-0.5">
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
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            aria-label="Cerrar panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
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
              horaMinima={horaMinima}
              horaMaxima={horaMaxima}
            />
          )}
        </div>

        {/* Footer con acciones primarias */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex-shrink-0">
          {isViewMode ? (
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-[0.99] transition-all"
            >
              Cerrar
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.99] transition-all"
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
                      className="h-11 flex-1 rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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
                      className="h-11 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 active:scale-[0.99] transition-all"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={onActualizar}
                      className="h-11 flex-1 rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99]"
                    >
                      Actualizar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <p className="hidden sm:block text-center text-[10px] text-slate-400 mt-1">Atajo: <kbd className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-mono">Esc</kbd> para cerrar</p>
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
