"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ImageCropperModal from "@/Componentes/ImageCropperModal";
import { subirImagenCloudflare } from "@/FuncionesTranversales/FuncionesCloudflare";
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { cfImageUrl } from "@/lib/cloudflare";
import {
  LOGO_LADO_MINIMO,
  LOGO_LADO_RECOMENDADO,
  LOGO_LADO_SALIDA,
  LOGO_PESO_MAXIMO_MB,
  LOGO_TIPOS,
  avisoArchivoLogo,
  errorArchivoLogo,
  idLogoValido,
  mensajeErrorLogo,
} from "@/lib/logoEmpresa";

const API = process.env.NEXT_PUBLIC_API_URL;

/* Lee ancho y alto reales del archivo antes de abrir el recorte */
function leerLados(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = () => reject(new Error("imagen-ilegible"));
    img.src = url;
  });
}

/* Guarda el id en datos_empresa. "" quita el logo. Lanza si el backend no confirma. */
async function guardarLogo(idEmpresa, logoEmpresa) {
  const res = await fetch(`${API}/datosempresa/actualizarLogo`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ id_empresa: idEmpresa, logoEmpresa }),
  });
  const respuesta = await res.json().catch(() => null);
  if (!res.ok || respuesta?.message !== true) {
    throw new Error(respuesta?.message || `http-${res.status}`);
  }
}

/**
 * Logo del centro: se elige, se recorta en círculo y se sube a Cloudflare Images
 * con el mismo endpoint que el resto de las imágenes. Se guarda apenas se
 * confirma (endpoint propio), sin esperar a "Guardar todos los datos".
 */
export default function LogoEmpresa({ idEmpresa, logoId, nombre, onCambio }) {
  const entradaRef = useRef(null);
  const [origen, setOrigen] = useState(null);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);

  useEffect(() => () => origen && URL.revokeObjectURL(origen), [origen]);

  const limpiarEntrada = () => {
    if (entradaRef.current) entradaRef.current.value = "";
  };

  async function elegir(archivo) {
    if (!archivo) return;
    setConfirmandoQuitar(false);

    const errorBasico = errorArchivoLogo({ tipo: archivo.type, peso: archivo.size });
    if (errorBasico) {
      toast.error(errorBasico);
      limpiarEntrada();
      return;
    }

    const url = URL.createObjectURL(archivo);
    try {
      const lados = await leerLados(url);
      const error = errorArchivoLogo({ tipo: archivo.type, peso: archivo.size }, lados);
      if (error) {
        URL.revokeObjectURL(url);
        toast.error(error);
        limpiarEntrada();
        return;
      }
      setAviso(avisoArchivoLogo(lados));
      setOrigen(url);
    } catch {
      URL.revokeObjectURL(url);
      toast.error("No pudimos leer la imagen. Prueba exportándola de nuevo como PNG.");
      limpiarEntrada();
    }
  }

  async function confirmar(recortado) {
    setOrigen(null);
    setOcupado(true);
    try {
      const id = await subirImagenCloudflare(recortado);
      if (!id) throw new Error("sin-id");
      await guardarLogo(idEmpresa, id);
      onCambio?.(id);
      toast.success("Logo actualizado. Ya se ve en tu página web.");
    } catch (error) {
      console.error("[LogoEmpresa] subir:", error?.message ?? error);
      toast.error(mensajeErrorLogo(error?.message));
    } finally {
      setOcupado(false);
      setAviso("");
      limpiarEntrada();
    }
  }

  async function quitar() {
    setOcupado(true);
    try {
      await guardarLogo(idEmpresa, "");
      onCambio?.("");
      toast.success("Logo quitado. La página web muestra solo el nombre.");
    } catch (error) {
      console.error("[LogoEmpresa] quitar:", error?.message ?? error);
      toast.error(error?.message === "SIN-PERMISO" || error?.message === "USUARIO-SIN-AUTENTICACION"
        ? mensajeErrorLogo(error.message)
        : "No se pudo quitar el logo. Intenta nuevamente.");
    } finally {
      setOcupado(false);
      setConfirmandoQuitar(false);
    }
  }

  const url = cfImageUrl(idLogoValido(logoId), "card");

  return (
    <div className="flex items-start gap-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-[#F2F2F7] ring-1 ring-black/[0.06]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Logo de ${nombre || "tu centro"}`} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] font-medium text-[#8E8E93]">Logo</span>
        )}
        {ocupado ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75">
            <span className="size-4 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-slate-700">Logo</span>
          <span className="text-[11px] text-[#8E8E93]">opcional · se guarda al confirmar el recorte</span>
        </div>
        <p className="mt-0.5 text-[12px] text-[#6E6E73]">
          PNG, JPG o WebP · hasta {LOGO_PESO_MAXIMO_MB} MB · mínimo {LOGO_LADO_MINIMO} × {LOGO_LADO_MINIMO} px (ideal {LOGO_LADO_RECOMENDADO})
        </p>

        {confirmandoQuitar ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-slate-700">¿Quitar el logo de la página web?</span>
            <button
              type="button"
              onClick={quitar}
              disabled={ocupado}
              className="h-8 rounded-lg px-2.5 text-[13px] font-semibold text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 disabled:opacity-50"
            >
              Quitar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoQuitar(false)}
              disabled={ocupado}
              className="h-8 rounded-lg px-2.5 text-[13px] font-medium text-[#6E6E73] transition-colors hover:bg-[#F2F2F7]"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => entradaRef.current?.click()}
              disabled={ocupado || !idEmpresa}
              className="-ml-2.5 h-8 rounded-lg px-2.5 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/10 disabled:text-[#C7C7CC]"
            >
              {url ? "Cambiar logo" : "Subir logo"}
            </button>
            {url ? (
              <button
                type="button"
                onClick={() => setConfirmandoQuitar(true)}
                disabled={ocupado}
                className="h-8 rounded-lg px-2.5 text-[13px] font-medium text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 disabled:text-[#C7C7CC]"
              >
                Quitar
              </button>
            ) : null}
          </div>
        )}

        <details className="group mt-1">
          <summary className="cursor-pointer select-none text-[12px] font-medium text-[#6E6E73] transition-colors hover:text-slate-900">
            Ver recomendaciones
          </summary>
          <ul className="mt-2 space-y-1 rounded-xl bg-[#F5F5F7] px-3.5 py-3 text-[12px] leading-relaxed text-[#6E6E73]">
            <li>Mejor PNG con fondo transparente o blanco.</li>
            <li>Cuadrado: si tu logo es alargado, usa solo el símbolo; en círculo el texto queda chico o cortado.</li>
            <li>Deja aire alrededor del dibujo: al recortarlo en círculo se pierden las esquinas.</li>
            <li>Se muestra en círculo antes del nombre, en la barra superior de tu página web. Sin logo, se ve solo el nombre.</li>
          </ul>
        </details>
      </div>

      <input
        ref={entradaRef}
        type="file"
        accept={LOGO_TIPOS.join(",")}
        className="hidden"
        onChange={(e) => elegir(e.target.files?.[0])}
      />
      <ImageCropperModal
        open={Boolean(origen)}
        imageSrc={origen}
        aspectRatio={1}
        cropShape="round"
        mimeType="image/png"
        maxDimension={LOGO_LADO_SALIDA}
        title="Ajusta tu logo"
        description={aviso || "Arrastra y haz zoom hasta que el logo quede centrado dentro del círculo."}
        fileName="logo.png"
        onConfirm={confirmar}
        onCancel={() => {
          setOrigen(null);
          setAviso("");
          limpiarEntrada();
        }}
      />
    </div>
  );
}
