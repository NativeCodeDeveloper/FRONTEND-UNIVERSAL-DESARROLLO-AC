"use client";

import { useCallback, useState } from "react";
import { nombrePropio, nombreResena } from "@/lib/paginaPublica/formatos";
import { insertarResena } from "@/hooks/useResenas";
import Carrusel from "@/Componentes/PaginaPublica/Comunes/Carrusel";
import { IconoEstrella } from "@/Componentes/PaginaPublica/Comunes/Iconos";
import Modal from "@/Componentes/PaginaPublica/Comunes/Modal";
import Selector from "@/Componentes/PaginaPublica/Comunes/Selector";

const COMENTARIO_MAX = 1000;

function Estrellas({ valor, className = "h-4 w-4" }) {
  return (
    <div className="flex gap-0.5 text-[#ff9f0a]" aria-label={`${valor} de 5 estrellas`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <IconoEstrella key={n} className={`${className} ${n <= valor ? "" : "text-linea"}`} />
      ))}
    </div>
  );
}

/*
 * Reseñas del centro (resenas/seleccionarTodas). El formulario usa el mismo insertarResena de
 * AgregarResenaModal: rating, comentario, profesional_id, nombre_invitado y apellido_invitado.
 * Las reseñas se publican sin moderación, por eso la nueva se agrega al carrusel al guardarse.
 */
export default function Testimonios({ iniciales, profesionales }) {
  const [lista, setLista] = useState(iniciales);
  const [abierto, setAbierto] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [profesionalId, setProfesionalId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [intento, setIntento] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const cerrar = useCallback(() => {
    setAbierto(false);
    setEnviado(false);
    setIntento(false);
    setErrorEnvio("");
  }, []);

  const promedio = lista.length ? lista.reduce((s, r) => s + Number(r.rating || 0), 0) / lista.length : 0;
  const faltantes = {
    nombre: !nombreCompleto.trim(),
    profesional: !profesionalId,
    rating: !rating,
    comentario: !comentario.trim(),
  };

  async function enviar(e) {
    e.preventDefault();
    setIntento(true);
    if (Object.values(faltantes).some(Boolean) || enviando) return;
    const [nombre_invitado, ...resto] = nombreCompleto.trim().split(/\s+/);
    const profesional = profesionales.find((p) => String(p.id_profesional) === profesionalId);

    setEnviando(true);
    setErrorEnvio("");
    try {
      await insertarResena({
        rating,
        comentario: comentario.trim(),
        profesional_id: Number(profesionalId),
        nombre_invitado,
        apellido_invitado: resto.join(" ") || null,
      });
    } catch (error) {
      setErrorEnvio(error?.message || "No se pudo enviar tu opinión. Intenta nuevamente.");
      setEnviando(false);
      return;
    }
    setEnviando(false);

    setLista((l) => [
      {
        id_resena: Date.now(),
        rating,
        comentario: comentario.trim(),
        nombrePaciente: null,
        apellidoPaciente: null,
        nombre_invitado,
        apellido_invitado: resto.join(" ") || null,
        nombreProfesional: profesional?.nombreProfesional ?? null,
      },
      ...l,
    ]);
    setNombreCompleto("");
    setProfesionalId(null);
    setRating(0);
    setComentario("");
    setEnviado(true);
  }

  return (
    <>
      <div className="mx-auto mb-8 flex max-w-[1120px] flex-col gap-5 px-5 sm:flex-row sm:items-end sm:justify-between md:px-6">
        <div>
          <h2 className="titular-2">Lo que dicen nuestros pacientes</h2>
          {lista.length > 0 && (
            <div className="mt-3 flex items-center gap-3 text-[15px] text-tinta-2">
              <Estrellas valor={Math.round(promedio)} />
              <span>
                {promedio.toFixed(1).replace(".", ",")} de 5 · {lista.length} {lista.length === 1 ? "opinión" : "opiniones"}
              </span>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setAbierto(true)} className="boton boton-secundario self-start sm:self-auto">
          Dejar mi opinión
        </button>
      </div>

      {lista.length > 0 ? (
        <Carrusel etiqueta="Opiniones de pacientes" anchoTarjeta="w-[82vw] max-w-[380px] sm:w-[380px]">
          {lista.map((r) => (
            <article key={r.id_resena} className="caja flex h-[270px] flex-col p-7">
              <Estrellas valor={r.rating} />
              <blockquote className="texto-desplazable mt-4 h-[112px] shrink-0 overflow-y-auto pr-1 text-[17px] leading-[28px]">
                “{r.comentario}”
              </blockquote>
              <div className="flex-1" />
              <div className="mt-4 shrink-0">
                <p className="text-[14px] font-medium">{nombrePropio(nombreResena(r))}</p>
                {r.nombreProfesional && (
                  <p className="text-[13px] text-tinta-2">Paciente de {nombrePropio(r.nombreProfesional)}</p>
                )}
              </div>
            </article>
          ))}
        </Carrusel>
      ) : (
        <p className="mx-auto max-w-[1120px] px-5 text-tinta-2 md:px-6">Sé el primero en contar cómo fue tu atención.</p>
      )}

      <Modal abierto={abierto} alCerrar={cerrar} titulo="Dejar mi opinión" ancho="max-w-[520px]">
        <div className="p-7 sm:p-10">
          {enviado ? (
            <div className="py-6 text-center">
              <h2 className="titular-3">Gracias por tu opinión</h2>
              <p className="mt-3 text-tinta-2">Ayuda a otros pacientes a elegir con confianza.</p>
              <button type="button" onClick={cerrar} className="boton boton-principal mt-8">
                Listo
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate>
              <h2 className="titular-3">Cuéntanos tu experiencia</h2>

              <label className="mt-6 block">
                <span className="mb-1.5 block text-[13px] font-medium text-tinta-2">Nombre y apellido</span>
                <input
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value.slice(0, 200))}
                  aria-invalid={intento && faltantes.nombre}
                  className="campo"
                  placeholder="Ej: Camila Rojas"
                />
              </label>

              <div className="mt-4">
                <span className="mb-1.5 block text-[13px] font-medium text-tinta-2">Profesional que te atendió</span>
                <Selector
                  etiqueta="Profesional"
                  placeholder="Selecciona un profesional"
                  valor={profesionalId}
                  alCambiar={setProfesionalId}
                  invalido={intento && faltantes.profesional}
                  opciones={profesionales.map((p) => ({
                    valor: String(p.id_profesional),
                    etiqueta: nombrePropio(p.nombreProfesional),
                    descripcion: p.descripcionProfesional ?? undefined,
                  }))}
                />
              </div>

              <fieldset className="mt-5">
                <legend className="mb-2 text-[13px] font-medium text-tinta-2">Calificación</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                      aria-pressed={rating === n}
                      className={`transition-transform hover:scale-110 ${n <= rating ? "text-[#ff9f0a]" : "text-linea"}`}
                    >
                      <IconoEstrella className="h-8 w-8" />
                    </button>
                  ))}
                </div>
                {intento && faltantes.rating && (
                  <span className="mt-1.5 block text-[13px] text-[#e30000]">Elige una calificación</span>
                )}
              </fieldset>

              <label className="mt-5 block">
                <span className="mb-1.5 flex justify-between text-[13px] font-medium text-tinta-2">
                  Comentario
                  <span className="font-normal text-tinta-3 tabular-nums">
                    {comentario.length}/{COMENTARIO_MAX}
                  </span>
                </span>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value.slice(0, COMENTARIO_MAX))}
                  aria-invalid={intento && faltantes.comentario}
                  rows={4}
                  className="campo resize-none"
                  placeholder="Cuéntanos cómo fue tu atención"
                />
              </label>

              {errorEnvio && (
                <p role="alert" className="mt-5 rounded-[12px] bg-[#fff2f2] px-4 py-3 text-[14px] text-[#b40000]">
                  {errorEnvio}
                </p>
              )}

              <button type="submit" disabled={enviando} className="boton boton-principal mt-6 w-full">
                {enviando ? "Publicando…" : "Publicar opinión"}
              </button>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
