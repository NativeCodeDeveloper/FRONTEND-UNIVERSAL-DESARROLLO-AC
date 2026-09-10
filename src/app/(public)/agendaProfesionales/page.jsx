"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AgendaProfesionales() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [listaProfesionales, setListaProfesionales] = useState([]);

  function irAgendaProfesional(id_profesional) {
    router.push(`/agendaEspecificaProfersional/${id_profesional}`);
  }

  async function seleccionarProfesionales() {
    try {
      const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      const dataProfesionales = await res.json();
      setListaProfesionales(dataProfesionales);
    } catch {
      return toast.error("No ha sido posible listar profesionales, contacte a soporte IT");
    }
  }

  useEffect(() => {
    seleccionarProfesionales();
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-32 pb-32 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">

        {/* Usable Header Block */}
        <div className="max-w-3xl mb-12 lg:mb-16 animate-reveal-up border-b border-slate-200 pb-10">
          <span className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4 block">
            Paso 1: Selección de Especialista
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Reserva de Sesiones
          </h1>
          <p className="text-slate-600 text-lg md:text-xl font-light leading-relaxed">
            Selecciona el profesional de tu preferencia para acceder a su calendario y agendar tu próxima evaluación en tiempo real.
          </p>
        </div>

        {/* Structured Grid Layout for better UX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-reveal-up-delay">
          {listaProfesionales.map((profesional, index) => (
            <button
              key={profesional.id_profesional}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => irAgendaProfesional(profesional.id_profesional)}
              className="group flex flex-col text-left transition-transform duration-300 hover:-translate-y-1 w-full"
            >

              {/* Functional Clean Card */}
              <div className="w-full bg-white rounded-3xl p-8 flex flex-col justify-between h-full border border-slate-200 hover:border-slate-900 hover:shadow-lg transition-all duration-300">
                <div>
                  {/* Avatar initial block */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-900 mb-6 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    {profesional.nombreProfesional?.charAt(0)}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 leading-tight mb-3">
                    {profesional.nombreProfesional}
                  </h2>
                  <p className="line-clamp-3 text-sm font-light leading-relaxed text-slate-500">
                    {profesional.descripcionProfesional || "Especialista en medicina metabólica y control clínico."}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                    Ver Calendario
                  </span>
                  <div className="rounded-full bg-slate-100 p-2 group-hover:bg-slate-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-900 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
