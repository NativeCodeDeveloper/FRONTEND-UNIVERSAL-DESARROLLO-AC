"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Star, Trash2 } from "lucide-react";
import ToasterClient from "@/Componentes/ToasterClient";
import { InfoButton } from "@/Componentes/InfoButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTodasLasResenas, eliminarResena } from "@/hooks/useResenas";

function nombreDe(r) {
  const nombrePaciente = [r.nombrePaciente, r.apellidoPaciente].filter(Boolean).join(" ").trim();
  const nombreInvitado = [r.nombre_invitado, r.apellido_invitado].filter(Boolean).join(" ").trim();
  return nombrePaciente || nombreInvitado || "Paciente AgendaClínica";
}

function EstrellasTexto({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          strokeWidth={1.5}
          color={n <= rating ? "#facc15" : "#e2e8f0"}
          fill={n <= rating ? "#facc15" : "transparent"}
        />
      ))}
    </div>
  );
}

export default function Testimonios() {
  const { resenas, cargando, recargar } = useTodasLasResenas();
  const [filtroRating, setFiltroRating] = useState(0); // 0 = todas
  const [orden, setOrden] = useState("desc"); // "desc" = mayor a menor
  const [eliminandoId, setEliminandoId] = useState(null);

  const lista = useMemo(() => {
    const filtrada = filtroRating ? resenas.filter((r) => r.rating === filtroRating) : resenas;
    return [...filtrada].sort((a, b) => (orden === "desc" ? b.rating - a.rating : a.rating - b.rating));
  }, [resenas, filtroRating, orden]);

  async function handleDesactivar(id_resena) {
    setEliminandoId(id_resena);
    try {
      await eliminarResena(id_resena);
      toast.success("Reseña desactivada. Ya no se mostrará en el sitio público.");
      await recargar();
    } catch (err) {
      toast.error(err.message || "No se pudo desactivar la reseña.");
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
      <ToasterClient />
      <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Contenido web</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
              Testimonios
            </h1>
            <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
              Administra las reseñas que los pacientes dejan en el sitio público. Desactivar una reseña la quita del sitio de inmediato.
            </p>
          </div>
          <InfoButton
            informacion={"Aquí ves todas las reseñas activas del sitio público, con nombre, calificación y comentario."}
            pasos={[
              "Filtra por cantidad de estrellas o cambia el orden (mayor a menor / menor a mayor) según lo que quieras revisar.",
              "Si una reseña es inapropiada o falsa, desactívala: desaparece del sitio de inmediato.",
              "Desactivar es un borrado lógico, no se puede deshacer desde el dashboard por ahora.",
            ]}
          />
        </div>

        {/* ── Filtros ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroRating(0)}
              className={`h-8 px-3 rounded-full text-[11px] font-bold transition-all ${
                filtroRating === 0
                  ? "bg-[#6E56CF] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                onClick={() => setFiltroRating(n)}
                className={`h-8 px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                  filtroRating === n
                    ? "bg-[#6E56CF] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n} <Star size={12} strokeWidth={1.5} fill="currentColor" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setOrden((o) => (o === "desc" ? "asc" : "desc"))}
            className="h-8 px-3 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {orden === "desc" ? (
              <>
                <ArrowDownWideNarrow size={14} /> Mayor a menor
              </>
            ) : (
              <>
                <ArrowUpWideNarrow size={14} /> Menor a mayor
              </>
            )}
          </button>
        </div>

        {/* ── Tabla ── */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reseñas Activas</h2>
            <span className="h-5 px-2 rounded-full bg-violet-50 text-[#6E56CF] text-[10px] font-bold flex items-center">
              {lista.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Paciente</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Profesional</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Calificación</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 hidden md:table-cell">Comentario</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((r) => (
                  <TableRow key={r.id_resena} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 text-[13px] font-bold text-slate-800">{nombreDe(r)}</TableCell>
                    <TableCell className="py-4 text-[12px] text-slate-500">{r.nombreProfesional || "-"}</TableCell>
                    <TableCell className="py-4"><EstrellasTexto rating={r.rating} /></TableCell>
                    <TableCell className="py-4 text-[12px] text-slate-500 hidden md:table-cell max-w-[260px] truncate" title={r.comentario}>
                      {r.comentario}
                    </TableCell>
                    <TableCell className="py-4 text-[12px] text-slate-500 hidden sm:table-cell">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("es-CL") : "-"}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={eliminandoId === r.id_resena}
                            className="h-8 px-3 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {eliminandoId === r.id_resena ? "Desactivando..." : "Desactivar"}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogMedia>
                              <Trash2 className="text-destructive" />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Desactivar reseña</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta reseña de {nombreDe(r)} dejará de mostrarse en el sitio público de inmediato. No podrás reactivarla desde aquí.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => handleDesactivar(r.id_resena)}>
                              <Trash2 data-icon="inline-start" />
                              Sí, desactivar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!cargando && lista.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-[13px] text-slate-400 italic">
                      {filtroRating
                        ? `No hay reseñas con ${filtroRating} estrella${filtroRating > 1 ? "s" : ""}.`
                        : "Todavía no hay reseñas activas."}
                    </TableCell>
                  </TableRow>
                )}
                {cargando && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-[13px] text-slate-400 italic">
                      Cargando reseñas...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
