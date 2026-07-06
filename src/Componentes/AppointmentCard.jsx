"use client";

import { getStateTokens } from "@/lib/designTokens";
import { StatusBadge } from "@/Componentes/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function getDurationMinutes(start, end) {
  if (!start || !end) return 60;
  return Math.round((end - start) / 60000);
}

function formatHora(date) {
  if (!date) return "";
  try {
    return format(date, "HH:mm", { locale: es });
  } catch {
    return "";
  }
}

// ── Card para bloqueos ──────────────────────────────────────────────────────
function BloqueoCard({ event }) {
  return (
    <div
      className="flex h-full w-full items-center gap-1.5 px-1.5 py-1"
      style={{
        borderLeft: "3px solid rgba(107,114,128,0.8)",
        background:
          "repeating-linear-gradient(45deg,rgba(156,163,175,0.08) 0px,rgba(156,163,175,0.08) 4px,transparent 4px,transparent 10px)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 flex-shrink-0 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span className="truncate text-[11px] font-semibold text-slate-600">
        {event.title || "Bloqueado"}
      </span>
    </div>
  );
}

// ── Card para selección temporal ────────────────────────────────────────────
function SeleccionCard({ event }) {
  return (
    <div
      className="flex h-full w-full items-center gap-1 px-1.5 py-1"
      style={{ borderLeft: "3px solid #6E56CF" }}
    >
      <span className="truncate text-[11px] font-semibold text-violet-700">
        {event.title || "Nueva reserva"}
      </span>
    </div>
  );
}

// ── Card principal ──────────────────────────────────────────────────────────
export function AppointmentCard({ event, currentView }) {
  if (event?.tipo === "bloqueo") return <BloqueoCard event={event} />;
  if (event?.tipo === "seleccion") return <SeleccionCard event={event} />;

  const reserva = event?.resource ?? {};
  const estado = reserva?.estadoReserva ?? "reservada";
  const pago = reserva?.estadoPago ?? "";
  const token = getStateTokens(estado);
  const duracion = getDurationMinutes(event.start, event.end);

  const nombre = (reserva?.nombrePaciente ?? "").trim();
  const apellido = (reserva?.apellidoPaciente ?? "").trim();
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");
  // Tipo de consulta/prestación (viene del agendamiento web o del drawer)
  const prestacion = (reserva?.motivo_reserva ?? reserva?.nombrePrestacion ?? reserva?.prestacion ?? reserva?.nombre_prestacion ?? reserva?.motivoConsulta ?? "").trim();
  // Modalidad: 'online' | 'presencial' | '' (campo nuevo — requiere migración BD)
  const modalidad = (reserva?.modalidad ?? "").toLowerCase().trim();
  // Nombre del profesional — resuelto en el mapeo de eventos del calendario
  const profesional = (reserva?._nombreProfesional ?? reserva?.nombreProfesional ?? "").trim();
  const horaInicio = formatHora(event.start);
  const horaFin = formatHora(event.end);

  // ── Vista MES: dot de estado + nombre paciente ─────────────────────────────
  if (currentView === "month") {
    return (
      <div className="flex w-full items-center gap-1.5 overflow-hidden h-full px-0.5">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: token.accent }} />
        <span className="truncate text-[11px] font-bold leading-none flex-1" style={{ color: token.text }}>
          {nombreCompleto || event.title}
        </span>
      </div>
    );
  }

  if (currentView === "agenda") {
    return (
      <div
        className="flex h-full w-full min-w-0 flex-col gap-0.5 overflow-hidden rounded-md px-3 py-2"
        style={{
          borderLeft: `4px solid ${token.accent}`,
          background: token.bg,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
        }}
      >
        <span className="text-[11px] font-bold tabular-nums leading-none" style={{ color: token.accent }}>
          {horaInicio} – {horaFin}
        </span>
        <span
          className="truncate text-[13px] font-bold leading-snug"
          style={{ color: token.text }}
        >
          {nombreCompleto || event.title}
        </span>
        {profesional && (
          <span className="truncate text-[11px] font-semibold text-slate-400 leading-tight">
            {profesional}
          </span>
        )}
        <div className="flex flex-wrap gap-1 pt-0.5">
          <StatusBadge estado={estado} size="xs" />
          {pago && <StatusBadge estado={pago} size="xs" />}
        </div>
      </div>
    );
  }

  // ── Vista SEMANA / DÍA / AGENDA ─────────────────────────────────────────
  const isShort = duracion < 30;
  const isVeryShort = duracion < 15;

  if (isVeryShort) {
    // Ultra-mini (< 15 min): hora inicio + nombre en una sola línea
    return (
      <div
        className="flex h-full w-full items-center gap-1 px-1.5 overflow-hidden"
        style={{ borderLeft: `4px solid ${token.accent}`, background: token.bg }}
      >
        <span className="text-[10px] font-bold tabular-nums leading-none shrink-0" style={{ color: token.accent }}>
          {horaInicio}
        </span>
        <span className="truncate text-[10px] font-semibold leading-none" style={{ color: token.text }}>
          {nombreCompleto || event.title}
        </span>
      </div>
    );
  }

  if (isShort) {
    // Compacta (15-29 min): hora + dot de estado a la derecha, nombre abajo
    return (
      <div
        className="flex h-full w-full flex-col justify-start px-2 py-1 cursor-pointer overflow-hidden"
        style={{
          borderLeft: `4px solid ${token.accent}`,
          background: token.bg,
          boxShadow: `inset 0 0 0 1px ${token.border}`,
        }}
      >
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          <span
            className="text-[10px] font-bold tabular-nums whitespace-nowrap leading-none shrink-0"
            style={{ color: token.accent }}
          >
            {horaInicio} – {horaFin}
          </span>
          <span className="ml-auto h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: token.accent }} />
        </div>
        <span
          className="truncate text-[12px] font-bold leading-tight mt-0.5 shrink-0"
          style={{ color: token.text }}
        >
          {nombreCompleto || event.title}
        </span>
        {prestacion && duracion >= 20 && (
          <span
            className="truncate text-[10px] font-medium leading-tight shrink-0"
            style={{ color: token.text, opacity: 0.65 }}
          >
            {prestacion}
          </span>
        )}
      </div>
    );
  }

  // ── Vista DÍA: layout horizontal — info izq, hora+badge der ───────────────
  if (currentView === "day") {
    return (
      <div
        className="flex h-full w-full cursor-pointer overflow-hidden"
        style={{
          borderLeft: `4px solid ${token.accent}`,
          background: token.bg,
          boxShadow: `inset 0 0 0 1px ${token.border}`,
        }}
      >
        {/* Izquierda — nombre + servicio + doctor */}
        <div className="flex flex-col justify-center flex-1 min-w-0 px-4 py-3 gap-0.5">
          <span className="truncate text-[16px] font-extrabold leading-snug" style={{ color: token.text }}>
            {nombreCompleto || event.title}
          </span>
          {prestacion && (
            <span className="truncate text-[12px] font-medium leading-tight" style={{ color: token.text, opacity: 0.68 }}>
              {prestacion}
            </span>
          )}
          {profesional && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium leading-none mt-1 truncate" style={{ color: token.text, opacity: 0.55 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span className="truncate">{profesional}</span>
            </span>
          )}
          {modalidad === "online" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-500 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Online
            </span>
          )}
        </div>
        {/* Derecha — hora + estado */}
        <div className="flex flex-col items-end justify-start px-4 py-3 gap-2 shrink-0" style={{ borderLeft: `1px solid ${token.accent}18` }}>
          <span className="text-[11px] font-bold tabular-nums whitespace-nowrap" style={{ color: token.accent }}>
            {horaInicio} – {horaFin}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap"
            style={{ backgroundColor: `${token.accent}18`, color: token.text, border: `1px solid ${token.accent}35` }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: token.accent }} />
            {token.label}
          </span>
          {pago && <StatusBadge estado={pago} size="xs" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col justify-start px-2.5 py-1.5 cursor-pointer overflow-hidden"
      style={{
        borderLeft: `4px solid ${token.accent}`,
        background: token.bg,
        boxShadow: `inset 0 0 0 1px ${token.border}`,
      }}
    >
      {/* 1. HORA — siempre primero, nunca se rompe */}
      <span
        className="text-[10px] font-bold tabular-nums leading-none whitespace-nowrap shrink-0"
        style={{ color: token.accent }}
      >
        {horaInicio} – {horaFin}
      </span>

      {/* 2. ESTADO — pill justo bajo la hora */}
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none shrink-0 mt-1 self-start"
        style={{
          backgroundColor: `${token.accent}18`,
          color: token.text,
          border: `1px solid ${token.accent}35`,
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: token.accent }} />
        {token.label}
      </span>

      {/* Divisor */}
      <div className="my-1 shrink-0" style={{ height: "1px", background: `${token.accent}25` }} />

      {/* 3. PACIENTE */}
      <span
        className="truncate text-[13px] font-bold leading-snug shrink-0"
        style={{ color: token.text }}
      >
        {nombreCompleto || event.title}
      </span>

      {/* 4. SERVICIO */}
      {prestacion && (
        <span
          className="truncate text-[11px] font-medium leading-tight mt-0.5 shrink-0"
          style={{ color: token.text, opacity: 0.72 }}
        >
          {prestacion}
        </span>
      )}

      {/* 5. DOCTOR — con ícono persona clásico */}
      {profesional && !isShort && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium leading-none mt-1.5 shrink-0 truncate"
          style={{ color: token.text, opacity: 0.65 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span className="truncate">{profesional}</span>
        </span>
      )}

      {/* Online */}
      {modalidad === "online" && !isShort && (
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold leading-none mt-1 shrink-0 text-sky-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Online
        </span>
      )}
    </div>
  );
}
