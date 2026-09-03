"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";
import { useProfesionales } from "@/hooks/useProfesionales";
import { insertarResena } from "@/hooks/useResenas";

const COMENTARIO_MAX_LARGO = 1000;

export default function AgregarResenaModal({ open, onClose, onSuccess }) {
  const profesionales = useProfesionales();
  const [profesionalId, setProfesionalId] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProfesionalId("");
    setNombreCompleto("");
    setRating(0);
    setHoverRating(0);
    setComentario("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profesionalId) {
      toast.error("Selecciona a qué profesional va dirigido tu testimonio.");
      return;
    }
    if (!nombreCompleto.trim()) {
      toast.error("Escribe tu nombre y apellido.");
      return;
    }
    if (!rating) {
      toast.error("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }
    if (!comentario.trim()) {
      toast.error("Escribe un comentario.");
      return;
    }

    const [nombre_invitado, ...resto] = nombreCompleto.trim().split(/\s+/);
    const apellido_invitado = resto.join(" ") || null;

    setEnviando(true);
    try {
      await insertarResena({
        rating,
        comentario: comentario.trim(),
        profesional_id: profesionalId,
        nombre_invitado,
        apellido_invitado,
      });
      toast.success("¡Gracias por tu testimonio!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "No se pudo enviar el testimonio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cuéntanos tu experiencia</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tu testimonio ayuda a otros pacientes a elegir con confianza.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="nombreCompleto">
              Nombre y apellido
            </label>
            <input
              id="nombreCompleto"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value.slice(0, 200))}
              placeholder="Ej: Camila Rojas"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-colors focus:border-indigo-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="profesional">
              Profesional
            </label>
            <select
              id="profesional"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400"
            >
              <option value="">Selecciona un profesional</option>
              {profesionales.map((p) => (
                <option key={p.id_profesional} value={p.id_profesional}>
                  {p.nombreProfesional}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Calificación</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${n} estrellas`}
                  className="p-0.5"
                >
                  <Star
                    size={26}
                    strokeWidth={1.5}
                    color={n <= (hoverRating || rating) ? "#facc15" : "#e2e8f0"}
                    fill={n <= (hoverRating || rating) ? "#facc15" : "transparent"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="comentario">
              Comentario
            </label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, COMENTARIO_MAX_LARGO))}
              rows={4}
              placeholder="Cuéntanos cómo fue tu atención..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-colors focus:border-indigo-400"
            />
            <p className="text-right text-xs text-slate-400">
              {comentario.length}/{COMENTARIO_MAX_LARGO}
            </p>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="h-11 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar testimonio"}
          </button>
        </form>
      </div>
    </div>
  );
}
