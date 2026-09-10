'use client'
import {Suspense, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";

function ReservaHoraContent() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const searchParams = useSearchParams();
    const fechaInicio   = searchParams.get('fecha')       || '';
    const horaInicio    = searchParams.get('hora')        || '';
    const horaFin       = searchParams.get('horaFin')     || '';
    const emailPaciente = searchParams.get('email')       || '';
    const profesional   = searchParams.get('profesional') || '';
    const servicio      = searchParams.get('servicio')    || '';
    const duracion      = searchParams.get('duracion')    || '';
    const precio        = searchParams.get('precio')      || '';
    const [datosEmpresa, setDatosEmpresa] = useState({
        empresaNombre: "",
        contactoDireccion: "",
    });

    const formatoCLP = new Intl.NumberFormat("es-CL", {
        style: "currency", currency: "CLP",
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    });

    function formatearFechaHora(fecha, hora) {
        if (!fecha) return hora || "";

        const [year, month, day] = String(fecha).slice(0, 10).split("-");
        const meses = [
            "enero",
            "febrero",
            "marzo",
            "abril",
            "mayo",
            "junio",
            "julio",
            "agosto",
            "septiembre",
            "octubre",
            "noviembre",
            "diciembre"
        ];

        const fechaTexto = year && month && day
            ? `${Number(day)} de ${meses[Number(month) - 1] || month} de ${year}`
            : fecha;

        const horaTexto = hora ? String(hora).slice(0, 5) : "";
        return horaTexto ? `${fechaTexto} a las ${horaTexto}` : fechaTexto;
    }

    async function cargarDatosEmpresa() {
        try {
            const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
                method: "GET",
                headers: { Accept: "application/json" },
                mode: "cors",
            });

            if (!res.ok) {
                return;
            }

            const data = await res.json();
            const empresa = Array.isArray(data) ? data[0] : data;

            setDatosEmpresa({
                empresaNombre: empresa?.empresaNombre || "",
                contactoDireccion: empresa?.contactoDireccion || "",
            });
        } catch (error) {
            console.error("Error cargando datos de empresa en reserva", error);
        }
    }

    useEffect(() => {
        cargarDatosEmpresa();
    }, []);

    const fechaHoraLegible = formatearFechaHora(fechaInicio, horaInicio);
    const nombreEmpresa = datosEmpresa.empresaNombre || "Agenda Clinica";
    const direccionEmpresa = datosEmpresa.contactoDireccion || "";

  return (
    <section className="relative min-h-screen w-full px-4 pt-28 pb-12 sm:pt-32 sm:pb-16 flex items-center justify-center bg-slate-50">
      <div className="relative w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="flex items-start gap-4 p-7 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 border border-green-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="flex-1">
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Reserva confirmada
              </span>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                ¡Felicidades!
              </h1>

              <p className="mt-2 text-slate-700">
                Su hora con{" "}
                <span className="font-semibold text-slate-900">
                  {profesional || nombreEmpresa}
                </span>{" "}
                ha sido reservada con éxito.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-slate-200" />

          {/* Body */}
          <div className="p-7 sm:p-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Servicio</p>
                    <p className="text-sm text-slate-600">{servicio || "Consulta"}</p>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100" />

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M5 19h14M6 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Fecha y hora</p>
                    {/* Si hay horaFin muestra el rango completo, si no solo la hora de inicio */}
                    <p className="text-sm text-slate-600">
                        {fechaHoraLegible}{horaFin ? ` – ${horaFin.slice(0, 5)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100" />

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Duración</p>
                    <p className="text-sm text-slate-600">{duracion || "60"} Minutos</p>
                  </div>
                </div>

                {Number(precio) > 0 && (
                  <>
                    <div className="h-px w-full bg-slate-100" />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">Valor del servicio</p>
                        <p className="text-sm font-bold text-emerald-600">{formatoCLP.format(Number(precio))}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px w-full bg-slate-100" />

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-11a7 7 0 0 0-14 0c0 6.65 7 11 7 11z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Ubicación</p>
                    <p className="text-sm text-slate-600">
                      {[nombreEmpresa, direccionEmpresa].filter(Boolean).join(", ") || "Ubicacion por confirmar"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                ¡Tu cita ha sido confirmada!
              </p>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                Recuerda asistir puntualmente. Si necesitas cancelar o reagendar, hazlo con al menos 24 horas de anticipación. Te esperamos.
              </p>
            </div>

            <div className="mt-7 flex flex-col items-center gap-3">
              <a
                href="/agendaProfesionales"
                className="inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Agendar otra cita
              </a>

              <a
                href="/"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Volver al inicio
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReservaHora() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Cargando...</div>}>
      <ReservaHoraContent />
    </Suspense>
  );
}
