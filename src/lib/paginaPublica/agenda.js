/*
 * Agenda pública: misma lógica que tenía agendaEspecificaProfersional, ahora en funciones puras.
 *  - Se atiende todos los días de 09:00 a 22:00 (domingos liberados).
 *  - Los bloques duran lo que dura el servicio (duracion_min) y forman una sola cadena; si un
 *    bloque choca con un bloqueo parcial, la cadena salta al minuto exacto en que termina.
 *  - Un bloqueo de jornada completa (09:00–22:00) deja el día no seleccionable.
 *  - Si el bloque ya está tomado lo confirma el backend con POST /reservaPacientes/validar.
 *
 * Fechas (ver CLAUDE.md): todo se maneja como clave civil "AAAA-MM-DD" en la zona de la clínica.
 * "Hoy" sale de hoyCivil(), nunca de new Date(); las claves se comparan como texto.
 */

import { claveFechaCivil, hoyCivil, ZONA_CLINICA } from "@/lib/fechas";

export const HORARIO_AGENDA = { inicio: "09:00", fin: "22:00" };

const pad = (n) => String(n).padStart(2, "0");

export const aMinutos = (hora) => {
  const [h, m] = String(hora).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

export const aHora = (minutos) => `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`;

/* Clave civil a partir de año, mes (1–12) y día */
export const claveDia = (anio, mes, dia) => `${anio}-${pad(mes)}-${pad(dia)}`;

/* Día y minuto actuales en la zona de la clínica: { hoy: "AAAA-MM-DD", minutos } */
export function horaClinica() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_CLINICA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const valor = (tipo) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return { hoy: hoyCivil(), minutos: valor("hour") * 60 + valor("minute") };
}

/*
 * Bloqueos de POST /bloqueoAgenda/seleccionarBloqueosPorProfesional a una forma cómoda:
 * { desde, hasta, horaInicio, horaFinalizacion }. fechaInicio/fechaFinalizacion son fechas civiles.
 */
export function normalizarBloqueos(filas) {
  return (Array.isArray(filas) ? filas : [])
    .map((b) => ({
      desde: claveFechaCivil(b.fechaInicio),
      hasta: claveFechaCivil(b.fechaFinalizacion),
      horaInicio: String(b.horaInicio ?? "").slice(0, 5),
      horaFinalizacion: String(b.horaFinalizacion ?? "").slice(0, 5),
    }))
    .filter((b) => b.desde && b.hasta && b.horaInicio && b.horaFinalizacion);
}

const bloqueosDelDia = (clave, bloqueos) => bloqueos.filter((b) => b.desde <= clave && clave <= b.hasta);

const bloqueaJornada = (b) => b.horaInicio <= HORARIO_AGENDA.inicio && b.horaFinalizacion >= HORARIO_AGENDA.fin;

/* "pasado" | "bloqueado" | "disponible" */
export function estadoDelDia(clave, bloqueos, hoy) {
  if (clave < hoy) return "pasado";
  if (bloqueosDelDia(clave, bloqueos).some(bloqueaJornada)) return "bloqueado";
  return "disponible";
}

/*
 * Bloques posibles del día según la duración del servicio y los bloqueos parciales.
 * Si el día es hoy, se omiten las horas que ya pasaron. Devuelve [{ inicio, fin }].
 */
export function bloquesDelDia(clave, duracion, bloqueos, { hoy, minutos }) {
  if (estadoDelDia(clave, bloqueos, hoy) !== "disponible") return [];
  const delDia = bloqueosDelDia(clave, bloqueos);
  const fin = aMinutos(HORARIO_AGENDA.fin);
  let cursor = aMinutos(HORARIO_AGENDA.inicio);
  const bloques = [];
  while (cursor + duracion <= fin) {
    const termino = cursor + duracion;
    const choque = delDia.find((b) => cursor < aMinutos(b.horaFinalizacion) && aMinutos(b.horaInicio) < termino);
    if (choque) {
      cursor = aMinutos(choque.horaFinalizacion);
      continue;
    }
    bloques.push({ inicio: aHora(cursor), fin: aHora(termino) });
    cursor = termino;
  }
  return clave === hoy ? bloques.filter((b) => aMinutos(b.inicio) > minutos) : bloques;
}

/* "Sábado, 17 de octubre" a partir de una clave civil */
export function fechaLarga(clave) {
  const [anio, mes, dia] = clave.split("-").map(Number);
  // fecha-ok: se arma desde la clave civil con año, mes y día; solo se usa para la etiqueta.
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* Archivo .ics para que el paciente agregue la hora a su calendario */
export function archivoIcs({ titulo, descripcion, lugar, clave, inicio, fin }) {
  const dia = clave.replaceAll("-", "");
  const hms = (h) => h.replace(":", "") + "00";
  const escapar = (t) => String(t ?? "").replace(/[,;\\]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda Clinica//Reserva//ES",
    "BEGIN:VEVENT",
    `UID:${dia}${hms(inicio)}-${Math.random().toString(36).slice(2)}@agendaclinicas.cl`,
    `DTSTAMP:${dia}T000000`,
    `DTSTART;TZID=${ZONA_CLINICA}:${dia}T${hms(inicio)}`,
    `DTEND;TZID=${ZONA_CLINICA}:${dia}T${hms(fin)}`,
    `SUMMARY:${escapar(titulo)}`,
    `DESCRIPTION:${escapar(descripcion)}`,
    `LOCATION:${escapar(lugar)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
