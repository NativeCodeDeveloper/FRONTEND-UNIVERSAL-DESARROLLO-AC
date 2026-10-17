"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { archivoIcs, bloquesDelDia, fechaLarga, normalizarBloqueos } from "@/lib/paginaPublica/agenda";
import { crearEnlaces } from "@/lib/paginaPublica/enlaces";
import { nombrePropio, textoPrecio } from "@/lib/paginaPublica/formatos";
import { formatearRut, limpiarRut, rutValido } from "@/lib/paginaPublica/rut";
import { useHoraClinica } from "@/hooks/useHoraClinica";
import Avatar from "@/Componentes/PaginaPublica/Comunes/Avatar";
import { IconoCheck } from "@/Componentes/PaginaPublica/Comunes/Iconos";
import Selector from "@/Componentes/PaginaPublica/Comunes/Selector";
import Calendario from "@/Componentes/PaginaPublica/Reserva/Calendario";

const API = process.env.NEXT_PUBLIC_API_URL;
const LOTE_VALIDACION = 6;

/*
 * Datos del paciente: los mismos que pedía formularioReservaProfesional.
 * Al backend van como nombrePaciente, apellidoPaciente, rut (limpio), telefono (+569…) y email.
 */
const datosVacios = { nombre: "", apellido: "", rut: "", correo: "", telefono: "" };

const errores = {
  nombre: (v) => (v.trim().length < 2 ? "Ingresa tu nombre" : ""),
  apellido: (v) => (v.trim().length < 2 ? "Ingresa tu apellido" : ""),
  rut: (v) => (!rutValido(v) ? "Revisa tu RUT" : ""),
  correo: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Revisa tu correo" : ""),
  telefono: (v) => (v.replace(/\D/g, "").length !== 8 ? "Ingresa los 8 dígitos de tu celular" : ""),
};

const postJson = (ruta, cuerpo) =>
  fetch(`${API}${ruta}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });

/*
 * ¿El bloque sigue libre? POST /reservaPacientes/validar revisa reservas que se crucen y bloqueos.
 * Igual que la agenda anterior, ante un error de red se deja pasar ("falla abierta"): el backend
 * vuelve a validar al guardar y responde "conflicto" si la hora ya no está libre.
 */
async function bloqueLibre(id_profesional, clave, bloque) {
  try {
    const res = await postJson("/reservaPacientes/validar", {
      fechaInicio: clave,
      horaInicio: bloque.inicio,
      fechaFinalizacion: clave,
      horaFinalizacion: bloque.fin,
      id_profesional,
    });
    const cuerpo = await res.json().catch(() => null);
    if (cuerpo?.message === true) return true;
    if (cuerpo?.message === false) return false;
    return res.ok;
  } catch {
    return true;
  }
}

function Paso({ numero, titulo, completo, bloqueado, aviso, resumen, alEditar, refPaso, children }) {
  return (
    <section ref={refPaso} className={`caja p-6 transition-opacity duration-500 md:p-8 ${bloqueado ? "opacity-55" : ""}`}>
      <header className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors duration-300 ${
            completo ? "bg-acento text-white" : "bg-niebla text-tinta-2"
          }`}
        >
          {completo ? <IconoCheck className="h-3.5 w-3.5" /> : numero}
        </span>
        <h2 className="flex-1 text-[19px] font-semibold tracking-tight md:text-[21px]">{titulo}</h2>
        {completo && resumen && alEditar && (
          <button type="button" onClick={alEditar} className="enlace text-[15px]">
            Cambiar
          </button>
        )}
      </header>
      {bloqueado ? (
        <p className="mt-3 pl-10 text-[15px] text-tinta-2">{aviso}</p>
      ) : completo && resumen ? (
        <p className="mt-2 pl-10 text-[15px] text-tinta-2">{resumen}</p>
      ) : (
        <div className="mt-6">{children}</div>
      )}
    </section>
  );
}

/*
 * Reserva en una sola página: servicio → día → hora → datos, con resumen fijo.
 * Reemplaza el paso doble agendaEspecificaProfersional + formularioReservaProfesional y usa los
 * mismos endpoints: bloqueos y validación de horas, y al confirmar insertarReservaPacienteFicha
 * o, si la pasarela está activa y el servicio tiene precio, pagosMercadoPago/create-order.
 */
export default function Reserva({ profesional, tarifas, datosEmpresa, estadoPasarela }) {
  const nombre = nombrePropio(profesional.nombreProfesional);
  const enlaces = crearEnlaces(datosEmpresa);
  const whatsappDudas = enlaces.whatsapp(enlaces.mensajes.whatsappReserva(nombre));
  const reloj = useHoraClinica();

  const [servicio, setServicio] = useState(null);
  const [editandoServicio, setEditandoServicio] = useState(true);
  const [fecha, setFecha] = useState(null);
  const [bloque, setBloque] = useState(null);
  const [datos, setDatos] = useState(datosVacios);
  const [tocados, setTocados] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [confirmada, setConfirmada] = useState(false);

  const [bloqueos, setBloqueos] = useState([]);
  const [cargandoBloqueos, setCargandoBloqueos] = useState(true);
  /* Validación de las horas del día elegido: { clave, duracion, ocupadas } */
  const [validacion, setValidacion] = useState(null);

  const refFecha = useRef(null);
  const refHora = useRef(null);
  const refDatos = useRef(null);

  /* Bloqueos del profesional (vacaciones, jornadas o tramos bloqueados desde el dashboard) */
  useEffect(() => {
    let vigente = true;
    postJson("/bloqueoAgenda/seleccionarBloqueosPorProfesional", { id_profesional: profesional.id_profesional })
      .then((r) => (r.ok ? r.json() : []))
      .then((filas) => vigente && setBloqueos(normalizarBloqueos(filas)))
      .catch((error) => console.error("[Reserva] bloqueos:", error))
      .finally(() => vigente && setCargandoBloqueos(false));
    return () => {
      vigente = false;
    };
  }, [profesional.id_profesional]);

  const duracion = Number(servicio?.duracion_min) || 60;

  const bloquesPosibles = useMemo(
    () => (reloj && fecha && servicio ? bloquesDelDia(fecha, duracion, bloqueos, reloj) : []),
    [reloj, fecha, servicio, duracion, bloqueos],
  );

  /* Confirma con el backend qué horas del día siguen libres, en lotes para no saturarlo */
  useEffect(() => {
    if (!fecha || bloquesPosibles.length === 0) return;
    let vigente = true;
    (async () => {
      const ocupadas = new Set();
      for (let i = 0; i < bloquesPosibles.length; i += LOTE_VALIDACION) {
        const lote = bloquesPosibles.slice(i, i + LOTE_VALIDACION);
        const libres = await Promise.all(lote.map((b) => bloqueLibre(profesional.id_profesional, fecha, b)));
        if (!vigente) return;
        libres.forEach((libre, j) => !libre && ocupadas.add(lote[j].inicio));
      }
      setValidacion({ clave: fecha, duracion, ocupadas });
    })();
    return () => {
      vigente = false;
    };
  }, [fecha, duracion, bloquesPosibles, profesional.id_profesional]);

  const validado = validacion?.clave === fecha && validacion?.duracion === duracion;
  const validando = !!fecha && bloquesPosibles.length > 0 && !validado;
  const bloques = bloquesPosibles.map((b) => ({ ...b, ocupado: validado && validacion.ocupadas.has(b.inicio) }));
  const sinHorasLibres = validado && bloques.length > 0 && bloques.every((b) => b.ocupado);

  /* Si la hora elegida resultó tomada, se suelta */
  const bloqueVigente = bloque && bloques.some((b) => b.inicio === bloque.inicio && !b.ocupado) ? bloque : null;

  const grupos = [
    { titulo: "Mañana", lista: bloques.filter((b) => b.inicio < "12:00") },
    { titulo: "Tarde", lista: bloques.filter((b) => b.inicio >= "12:00" && b.inicio < "18:00") },
    { titulo: "Noche", lista: bloques.filter((b) => b.inicio >= "18:00") },
  ].filter((g) => g.lista.length);

  const erroresActuales = Object.fromEntries(Object.keys(errores).map((k) => [k, errores[k](datos[k])]));
  const datosListos = Object.values(erroresActuales).every((e) => !e);

  /* Igual que el formulario anterior: $0 agenda directo; con pasarela activa se paga en Mercado Pago */
  const tienePrecio = !!servicio && Number(servicio.precio) > 0;
  const conPago = tienePrecio && estadoPasarela === true;
  const pasarelaDesconocida = tienePrecio && estadoPasarela === null;
  const listo = !!servicio && !!fecha && !!bloqueVigente && datosListos && !pasarelaDesconocida;

  function irA(ref) {
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function elegirServicio(t) {
    setServicio(t);
    setEditandoServicio(false);
    setBloque(null);
    irA(refFecha);
  }

  function elegirFecha(clave) {
    setFecha(clave);
    setBloque(null);
    setErrorEnvio("");
    irA(refHora);
  }

  function elegirBloque(b) {
    setBloque(b);
    setErrorEnvio("");
    irA(refDatos);
  }

  function cambiar(campo, valor) {
    if (campo === "rut") valor = formatearRut(valor);
    if (campo === "telefono")
      valor = valor
        .replace(/\D/g, "")
        .slice(0, 8)
        .replace(/^(\d{4})(\d)/, "$1 $2");
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  async function confirmar() {
    if (enviando) return;
    if (!listo) {
      setTocados({ nombre: true, apellido: true, rut: true, correo: true, telefono: true });
      if (!servicio) irA(refFecha);
      else if (!fecha || !bloqueVigente) irA(refHora);
      else irA(refDatos);
      return;
    }

    const paciente = {
      nombrePaciente: datos.nombre.trim(),
      apellidoPaciente: datos.apellido.trim(),
      rut: limpiarRut(datos.rut),
      telefono: `+569${datos.telefono.replace(/\D/g, "")}`,
      email: datos.correo.trim(),
      fechaInicio: fecha,
      horaInicio: bloqueVigente.inicio,
      fechaFinalizacion: fecha,
      horaFinalizacion: bloqueVigente.fin,
      id_profesional: profesional.id_profesional,
    };

    setEnviando(true);
    setErrorEnvio("");
    try {
      if (conPago) {
        const res = await postJson("/pagosMercadoPago/create-order", {
          ...paciente,
          tituloProducto: servicio.nombreServicio,
          precio: servicio.precio,
          totalPago: servicio.precio,
          estadoReserva: "reservada",
        });
        const respuesta = res.ok ? await res.json().catch(() => null) : null;
        if (!respuesta?.init_point) {
          throw new Error("No pudimos iniciar el pago. Intenta nuevamente o escríbenos por WhatsApp.");
        }
        window.location.assign(respuesta.init_point);
        return;
      }

      const res = await postJson("/reservaPacientes/insertarReservaPacienteFicha", {
        ...paciente,
        nombreProfesional: profesional.nombreProfesional || "",
        monto_reserva: String(servicio.precio ?? 0),
        motivo_reserva: servicio.nombreServicio,
        estadoReserva: "reservada",
        origen: "web",
      });
      const respuesta = await res.json().catch(() => null);

      if (!res.ok && respuesta?.message === "conflicto") {
        /* Otro paciente tomó la hora entre medio: se marca ocupada y se vuelve a elegir */
        setValidacion((v) => (v ? { ...v, ocupadas: new Set([...v.ocupadas, bloqueVigente.inicio]) } : v));
        setBloque(null);
        setErrorEnvio("Esa hora se acaba de reservar. Elige otra, por favor.");
        irA(refHora);
        return;
      }
      if (!res.ok || respuesta?.message !== true) {
        throw new Error(`No pudimos guardar tu reserva${res.ok ? "" : ` (${res.status})`}. Intenta nuevamente.`);
      }

      setConfirmada(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("[Reserva] confirmar:", error);
      setErrorEnvio(error?.message || "Error de conexión. Intenta nuevamente o escríbenos por WhatsApp.");
    } finally {
      setEnviando(false);
    }
  }

  function descargarIcs() {
    if (!fecha || !bloque || !servicio) return;
    const contenido = archivoIcs({
      titulo: `${servicio.nombreServicio} · ${datosEmpresa.empresaNombre || nombre}`,
      descripcion: `Atención con ${nombre}`,
      lugar: datosEmpresa.contactoDireccion ?? "",
      clave: fecha,
      inicio: bloque.inicio,
      fin: bloque.fin,
    });
    const url = URL.createObjectURL(new Blob([contenido], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hora-${fecha}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const precioTexto = textoPrecio;
  const resumenServicio = servicio ? `${servicio.nombreServicio} · ${servicio.duracion_min} min · ${precioTexto(servicio.precio)}` : "";
  const textoBoton = enviando ? (conPago ? "Redirigiendo al pago…" : "Reservando…") : conPago ? "Continuar al pago" : "Confirmar reserva";

  /* ─── Confirmación ─── */
  if (confirmada && servicio && fecha && bloque) {
    return (
      <div className="mx-auto max-w-[560px] text-center">
        <span className="animar-modal mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-acento text-white">
          <IconoCheck className="h-8 w-8" />
        </span>
        <h1 className="titular-1 mt-6">Tu hora está reservada</h1>
        <p className="bajada mt-4">
          Te enviamos la confirmación a <span className="text-tinta">{datos.correo}</span>.
        </p>
        <dl className="caja mt-10 divide-y divide-linea-suave p-2 text-left text-[15px]">
          {[
            ["Profesional", nombre],
            ["Servicio", servicio.nombreServicio],
            ["Fecha", fechaLarga(fecha)],
            ["Hora", `${bloque.inicio} a ${bloque.fin}`],
            ...(datosEmpresa.contactoDireccion ? [["Lugar", datosEmpresa.contactoDireccion]] : []),
            ["Total", precioTexto(servicio.precio)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 px-5 py-4">
              <dt className="text-tinta-2">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={descargarIcs} className="boton boton-principal">
            Agregar a mi calendario
          </button>
          <Link href="/" className="boton boton-tenue">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Flujo de reserva ─── */
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <div className="space-y-5">
        {/* Perfil */}
        <div className="flex items-center gap-5 px-1 pb-3">
          <Avatar profesional={profesional} tamano="circulo" className="h-20 w-20 shrink-0 rounded-full" sizes="80px" prioridad />
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[34px]">{nombre}</h1>
            {profesional.descripcionProfesional && (
              <p className="mt-1 text-[15px] text-tinta-2">{profesional.descripcionProfesional}</p>
            )}
          </div>
        </div>

        <Paso
          numero={1}
          titulo="Elige el servicio"
          completo={!!servicio && !editandoServicio}
          bloqueado={false}
          resumen={resumenServicio}
          alEditar={() => setEditandoServicio(true)}
        >
          {tarifas.length === 0 ? (
            <p className="text-tinta-2">Este profesional aún no publica sus servicios. Escríbenos y te ayudamos a agendar.</p>
          ) : (
            <Selector
              etiqueta="Servicio"
              placeholder={`Elige entre ${tarifas.length} ${tarifas.length === 1 ? "servicio" : "servicios"}`}
              valor={servicio ? String(servicio.id_tarifaProfesional) : null}
              alCambiar={(v) => {
                const t = tarifas.find((x) => String(x.id_tarifaProfesional) === v);
                if (t) elegirServicio(t);
              }}
              opciones={tarifas.map((t) => ({
                valor: String(t.id_tarifaProfesional),
                etiqueta: t.nombreServicio,
                descripcion: `${t.duracion_min} minutos`,
                extra: precioTexto(t.precio),
              }))}
            />
          )}
        </Paso>

        <Paso
          refPaso={refFecha}
          numero={2}
          titulo="Elige el día"
          completo={!!fecha}
          bloqueado={!servicio}
          aviso="Primero elige un servicio para ver los días disponibles."
        >
          {reloj && servicio && !cargandoBloqueos ? (
            <Calendario hoy={reloj.hoy} bloqueos={bloqueos} seleccionada={fecha} alElegir={elegirFecha} />
          ) : (
            <div className="h-[360px] animate-pulse rounded-2xl bg-niebla" />
          )}
        </Paso>

        <Paso
          refPaso={refHora}
          numero={3}
          titulo="Elige la hora"
          completo={!!bloqueVigente}
          bloqueado={!fecha || !servicio}
          aviso="Elige un día en el calendario para ver los horarios."
        >
          {fecha && (
            <>
              <p className="-mt-2 mb-5 text-[15px] text-tinta-2" aria-live="polite">
                {fechaLarga(fecha)} · bloques de {duracion} minutos
                {validando && <span className="text-tinta-3"> · revisando disponibilidad…</span>}
              </p>
              {errorEnvio && !bloqueVigente && (
                <p role="alert" className="mb-5 rounded-[12px] bg-[#fff2f2] px-4 py-3 text-[14px] text-[#b40000]">
                  {errorEnvio}
                </p>
              )}
              {grupos.length === 0 || sinHorasLibres ? (
                <p className="text-tinta-2">No quedan horas este día. Prueba con otra fecha.</p>
              ) : (
                <div className="space-y-6">
                  {grupos.map((g) => (
                    <div key={g.titulo}>
                      <h3 className="mb-3 text-[13px] font-medium text-tinta-2">{g.titulo}</h3>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {g.lista.map((b) => {
                          const activo = bloqueVigente?.inicio === b.inicio;
                          return (
                            <button
                              key={b.inicio}
                              type="button"
                              disabled={b.ocupado || validando}
                              onClick={() => elegirBloque(b)}
                              aria-pressed={activo}
                              aria-label={`${b.inicio} a ${b.fin}${b.ocupado ? ", reservada" : ""}`}
                              className={`h-11 rounded-[12px] text-[15px] font-medium tabular-nums transition-all duration-200 ${
                                activo
                                  ? "bg-acento text-white"
                                  : validando
                                    ? "animate-pulse bg-niebla text-tinta-3"
                                    : b.ocupado
                                      ? "bg-niebla text-[#c7c7cc] line-through"
                                      : "shadow-[inset_0_0_0_1px_var(--pp-linea)] hover:shadow-[inset_0_0_0_1px_var(--pp-acento)] hover:text-acento"
                              }`}
                            >
                              {b.inicio}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Paso>

        <Paso
          refPaso={refDatos}
          numero={4}
          titulo="Tus datos"
          completo={datosListos && !!bloqueVigente}
          bloqueado={!bloqueVigente}
          aviso="Elige un horario para completar tu reserva."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { campo: "nombre", etiqueta: "Nombre", tipo: "text", auto: "given-name", placeholder: "Ana" },
              { campo: "apellido", etiqueta: "Apellido", tipo: "text", auto: "family-name", placeholder: "Pérez" },
              { campo: "rut", etiqueta: "RUT", tipo: "text", auto: "off", placeholder: "12.345.678-9" },
              { campo: "correo", etiqueta: "Correo electrónico", tipo: "email", auto: "email", placeholder: "ana@correo.cl" },
            ].map((c) => {
              const error = tocados[c.campo] ? erroresActuales[c.campo] : "";
              return (
                <label key={c.campo} className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-tinta-2">{c.etiqueta}</span>
                  <input
                    type={c.tipo}
                    autoComplete={c.auto}
                    inputMode={c.campo === "rut" ? "text" : undefined}
                    value={datos[c.campo]}
                    placeholder={c.placeholder}
                    onChange={(e) => cambiar(c.campo, e.target.value)}
                    onBlur={() => setTocados((t) => ({ ...t, [c.campo]: true }))}
                    aria-invalid={!!error}
                    className="campo"
                  />
                  {error && <span className="mt-1.5 block text-[13px] text-[#e30000]">{error}</span>}
                </label>
              );
            })}

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-tinta-2">Celular</span>
              <div className="flex">
                <span className="flex items-center shrink-0 whitespace-nowrap rounded-l-[12px] bg-niebla px-4 text-[17px] text-tinta-2 shadow-[inset_0_0_0_1px_var(--pp-linea)]">
                  +56 9
                </span>
                <input
                  type="tel"
                  autoComplete="tel-local"
                  inputMode="numeric"
                  value={datos.telefono}
                  placeholder="1234 5678"
                  onChange={(e) => cambiar("telefono", e.target.value)}
                  onBlur={() => setTocados((t) => ({ ...t, telefono: true }))}
                  aria-invalid={!!(tocados.telefono && erroresActuales.telefono)}
                  className="campo !rounded-l-none"
                />
              </div>
              {tocados.telefono && erroresActuales.telefono && (
                <span className="mt-1.5 block text-[13px] text-[#e30000]">{erroresActuales.telefono}</span>
              )}
            </label>
          </div>
        </Paso>
      </div>

      {/* Resumen fijo, como el checkout de una tienda */}
      <aside className="lg:sticky lg:top-20">
        <div className="caja p-6 md:p-7">
          <h2 className="text-[19px] font-semibold tracking-tight">Resumen de tu reserva</h2>
          <dl className="mt-5 space-y-3.5 text-[15px]">
            {[
              ["Profesional", nombre],
              ["Servicio", servicio?.nombreServicio],
              ["Duración", servicio ? `${servicio.duracion_min} minutos` : undefined],
              ["Fecha", fecha ? fechaLarga(fecha) : undefined],
              ["Hora", bloqueVigente ? `${bloqueVigente.inicio} a ${bloqueVigente.fin}` : undefined],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-tinta-2">{k}</dt>
                <dd className={`text-right ${v ? "font-medium" : "text-tinta-3"}`}>{v ?? "Por elegir"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-linea-suave pt-5">
            <span className="text-[17px] font-semibold">Total</span>
            <span className="text-[24px] font-semibold tracking-tight tabular-nums">
              {servicio ? precioTexto(servicio.precio) : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className={`boton mt-6 hidden w-full lg:flex ${listo ? "boton-principal" : "bg-linea-suave text-tinta-2"}`}
          >
            {textoBoton}
          </button>
          {errorEnvio && bloqueVigente && (
            <p role="alert" className="mt-4 rounded-[12px] bg-[#fff2f2] px-4 py-3 text-[14px] text-[#b40000]">
              {errorEnvio}
            </p>
          )}
          <p className="mt-4 text-[13px] leading-snug text-tinta-3">
            {pasarelaDesconocida
              ? "No pudimos verificar el medio de pago. Recarga la página o escríbenos por WhatsApp para agendar."
              : conPago
                ? "Te llevaremos a Mercado Pago para completar el pago de forma segura."
                : "Recibirás la confirmación en tu correo con los datos de la atención."}
          </p>
        </div>
        {whatsappDudas && (
          <p className="mt-5 px-2 text-center text-[14px] text-tinta-2">
            ¿Tienes dudas?{" "}
            <a href={whatsappDudas} target="_blank" rel="noopener noreferrer" className="enlace">
              Escríbenos por WhatsApp
            </a>
          </p>
        )}
      </aside>

      {/* Barra inferior en celular */}
      <div className="barra-reserva fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/85 px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-xl backdrop-saturate-180 lg:hidden">
        {errorEnvio && bloqueVigente && (
          <p role="alert" className="mb-2 text-[13px] leading-snug text-[#b40000]">
            {errorEnvio}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[17px] font-semibold tabular-nums">
              {servicio ? precioTexto(servicio.precio) : "Elige un servicio"}
            </p>
            <p className="truncate text-[13px] text-tinta-2">
              {bloqueVigente && fecha
                ? `${fechaLarga(fecha)}, ${bloqueVigente.inicio}`
                : servicio
                  ? `${servicio.duracion_min} minutos`
                  : nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className={`boton shrink-0 ${listo ? "boton-principal" : "bg-tinta text-white"}`}
          >
            {enviando ? "Un momento…" : listo ? (conPago ? "Pagar" : "Confirmar") : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
