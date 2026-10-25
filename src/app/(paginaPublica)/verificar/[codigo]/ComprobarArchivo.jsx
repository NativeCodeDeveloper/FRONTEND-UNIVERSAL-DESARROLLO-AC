"use client";

import { useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Quien tiene el PDF puede comprobar que no fue alterado: el servidor calcula
 * la huella SHA-256 del archivo y la compara con la del documento firmado.
 * Basta un byte distinto para que no coincida.
 */
export default function ComprobarArchivo({ codigo }) {
  const entradaRef = useRef(null);
  const [estado, setEstado] = useState("inicial"); // inicial | revisando | coincide | no_coincide | error
  const [nombre, setNombre] = useState("");

  async function comprobar(archivo) {
    if (!archivo) return;
    setNombre(archivo.name);
    if (archivo.type !== "application/pdf" || archivo.size > 10 * 1024 * 1024) {
      setEstado("error");
      return;
    }
    setEstado("revisando");
    try {
      const formData = new FormData();
      formData.append("codigo", codigo);
      formData.append("pdf", archivo, archivo.name);
      const res = await fetch(`${API}/verificacion/compararHash`, { method: "POST", body: formData });
      const datos = await res.json().catch(() => null);
      if (!res.ok || datos?.message !== true) throw new Error();
      setEstado(datos.coincide ? "coincide" : "no_coincide");
    } catch {
      setEstado("error");
    } finally {
      if (entradaRef.current) entradaRef.current.value = "";
    }
  }

  return (
    <div className="caja mt-4 p-6 md:p-7">
      <p className="text-[17px] font-semibold text-tinta">Comprobar un archivo</p>
      <p className="mt-1 text-[15px] leading-relaxed text-tinta-2">
        Si recibiste este documento en PDF, súbelo para confirmar que es el original y no fue modificado. El archivo no se guarda.
      </p>
      <input
        ref={entradaRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => comprobar(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => entradaRef.current?.click()}
        disabled={estado === "revisando"}
        className="boton boton-principal mt-5 w-full sm:w-auto"
      >
        {estado === "revisando" ? "Comprobando…" : "Elegir PDF"}
      </button>

      {estado === "coincide" ? (
        <p className="mt-4 rounded-[12px] bg-[#34C759]/15 px-4 py-3 text-[15px] text-[#248A3D]">
          <strong>{nombre}</strong> coincide con el documento firmado.
        </p>
      ) : null}
      {estado === "no_coincide" ? (
        <p className="mt-4 rounded-[12px] bg-[#FF3B30]/10 px-4 py-3 text-[15px] text-[#D70015]">
          <strong>{nombre}</strong> NO coincide: fue modificado o no es el documento original.
        </p>
      ) : null}
      {estado === "error" ? (
        <p className="mt-4 rounded-[12px] bg-[#F2F2F7] px-4 py-3 text-[15px] text-[#3C3C43]">
          No se pudo comprobar el archivo. Debe ser un PDF de hasta 10 MB.
        </p>
      ) : null}
    </div>
  );
}
