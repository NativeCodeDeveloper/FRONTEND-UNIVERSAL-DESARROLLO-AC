"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ImageCropperModal from "@/Componentes/ImageCropperModal";
import SiluetaProfesional from "@/Componentes/SiluetaProfesional";
import { subirImagenCloudflare } from "@/FuncionesTranversales/FuncionesCloudflare";
import { cfImageUrl } from "@/lib/cloudflare";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_BYTES = 8 * 1024 * 1024;

/**
 * Foto del profesional: se recorta en cuadrado (calza en el círculo del
 * dashboard y de la reserva, y en la tarjeta 6:5 de la página pública, que
 * encuadra el rostro) y se sube a Cloudflare Images con el mismo endpoint que
 * el resto de las imágenes del sitio. Se guarda solo el id (imagenProfesional).
 */
export default function FotoProfesional({ imagenId, nombre, onCambio, deshabilitado = false }) {
  const entradaRef = useRef(null);
  const [origen, setOrigen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => () => origen && URL.revokeObjectURL(origen), [origen]);

  function elegir(archivo) {
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type) || archivo.size > LIMITE_BYTES) {
      toast.error("La foto debe ser JPG, PNG o WebP de hasta 8 MB.");
      return;
    }
    setOrigen(URL.createObjectURL(archivo));
  }

  async function confirmar(recortada) {
    setOrigen(null);
    setSubiendo(true);
    try {
      const id = await subirImagenCloudflare(recortada);
      if (!id) throw new Error("sin id");
      onCambio(id);
      toast.success("Foto lista. Se guardará con los datos del profesional.");
    } catch (error) {
      console.error("[FotoProfesional]", error);
      toast.error("No se pudo subir la foto. Intenta nuevamente.");
    } finally {
      setSubiendo(false);
      if (entradaRef.current) entradaRef.current.value = "";
    }
  }

  const url = cfImageUrl(imagenId, "card");

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.18)]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={nombre ? `Foto de ${nombre}` : "Foto del profesional"} className="h-full w-full object-cover object-[50%_20%]" />
        ) : (
          <SiluetaProfesional className="h-full w-full" />
        )}
        {subiendo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-700">Foto del profesional</p>
        <p className="text-[12px] text-slate-500">Se muestra en la agenda pública y en su tarjeta.</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => entradaRef.current?.click()}
            disabled={deshabilitado || subiendo}
            className="h-8 rounded-lg px-2.5 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 disabled:text-[#C7C7CC]"
          >
            {url ? "Cambiar foto" : "Subir foto"}
          </button>
          {url ? (
            <button
              type="button"
              onClick={() => onCambio("")}
              disabled={deshabilitado || subiendo}
              className="h-8 rounded-lg px-2.5 text-[13px] font-medium text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 disabled:text-[#C7C7CC]"
            >
              Quitar
            </button>
          ) : null}
        </div>
      </div>
      <input ref={entradaRef} type="file" accept={TIPOS.join(",")} className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
      <ImageCropperModal
        open={Boolean(origen)}
        imageSrc={origen}
        aspectRatio={1}
        title="Ajusta la foto"
        fileName="profesional.jpg"
        onConfirm={confirmar}
        onCancel={() => {
          setOrigen(null);
          if (entradaRef.current) entradaRef.current.value = "";
        }}
      />
    </div>
  );
}
