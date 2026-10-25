"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import PadFirma from "@/Componentes/firma/PadFirma";
import TextoLegalModal from "@/Componentes/documentos/TextoLegalModal";
import { useApiFirma } from "@/hooks/useApiFirma";
import { mensajeError } from "@/lib/firma/constantes";
import { validarFirma } from "@/lib/firma/procesarTrazo";
import { interpolarPlantilla } from "@/lib/consentimientos/textosLegales";
import { formatearInstanteConOffset } from "@/lib/fechas";

/**
 * Firma electrónica simple del profesional, dentro de ProfesionalModal.
 *
 * Solo el propio profesional (`puedeDibujar`) ve el pad y su firma: si un
 * administrador dibujara la firma de un médico sería una falsificación, y es
 * justo lo que la FES tiene que poder descartar. El administrador ve el estado.
 *
 * Registrar pide reverificación de Clerk (contraseña o código) si la última
 * verificación tiene más de 10 minutos; la ventana la abre useReverification
 * y la llamada se reintenta sola al confirmar.
 */
export default function SeccionFirmaElectronica({ idProfesional, firma, puedeDibujar, empresa, onFirmaCambiada }) {
  const api = useApiFirma();
  const padRef = useRef(null);

  const [modo, setModo] = useState(firma ? "registrada" : "captura");
  const [tinta, setTinta] = useState(firma?.tinta || "azul");
  const [trazos, setTrazos] = useState([]);
  const [actaAceptada, setActaAceptada] = useState(false);
  const [acta, setActa] = useState(null);
  const [verActa, setVerActa] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [imagenActual, setImagenActual] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoRevocar, setConfirmandoRevocar] = useState(false);
  const [errorFirma, setErrorFirma] = useState("");

  const registrar = useReverification((formData) => api.registrarFirma(formData));
  const revocar = useReverification((cuerpo) => api.revocarFirma(cuerpo));

  useEffect(() => {
    setModo(firma ? "registrada" : "captura");
  }, [firma]);

  // Acta vigente: se pide al abrir la captura, para mostrar su versión exacta.
  useEffect(() => {
    if (!puedeDibujar || modo !== "captura" || acta) return;
    api.seleccionarActaVigente()
      .then((r) => setActa(r.acta))
      .catch(() => setErrorFirma("No se pudo cargar el acta de adhesión. Intenta nuevamente."));
  }, [api, puedeDibujar, modo, acta]);

  // Miniatura de la firma registrada: solo para el dueño, y nunca se guarda en el navegador.
  useEffect(() => {
    if (!puedeDibujar || !firma) return undefined;
    let url = null;
    let vigente = true;
    api.seleccionarImagenFirma({ id_profesional: idProfesional })
      .then((blob) => {
        if (!vigente || !(blob instanceof Blob)) return;
        url = URL.createObjectURL(blob);
        setImagenActual(url);
      })
      .catch(() => setImagenActual(null));
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, puedeDibujar, firma, idProfesional]);

  // Vista previa del PNG recortado mientras dibuja.
  useEffect(() => {
    let url = null;
    let vigente = true;
    if (!trazos.length) {
      setVistaPrevia(null);
      return undefined;
    }
    const id = setTimeout(async () => {
      const salida = await padRef.current?.exportar();
      if (!vigente || !salida) return;
      url = salida.url;
      setVistaPrevia(salida);
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(id);
      if (url) URL.revokeObjectURL(url);
    };
  }, [trazos, tinta]);

  async function guardar() {
    const motivo = validarFirma(trazos);
    if (motivo) {
      setErrorFirma(motivo);
      return;
    }
    if (!actaAceptada || !acta) {
      setErrorFirma("Debes aceptar el acta de adhesión a firma electrónica simple.");
      return;
    }

    setEnviando(true);
    setErrorFirma("");
    try {
      const salida = await padRef.current.exportar();
      if (!salida) throw new Error("pngInvalido");

      const formData = new FormData();
      formData.append("imagen", salida.blob, "firma.png");
      formData.append("id_profesional", String(idProfesional));
      formData.append("tinta", tinta);
      formData.append("trazos", JSON.stringify(trazos));
      formData.append("acta_version", acta.version);
      formData.append("acta_aceptada", "true");

      const respuesta = await registrar(formData);
      toast.success("Firma registrada. Ya puedes firmar documentos electrónicamente.");
      setTrazos([]);
      setActaAceptada(false);
      onFirmaCambiada?.(respuesta.firma);
    } catch (error) {
      if (isReverificationCancelledError(error)) {
        toast("Registro cancelado: no se confirmó tu identidad.");
      } else {
        setErrorFirma(mensajeError(error?.codigo || error?.message));
      }
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarRevocacion() {
    setEnviando(true);
    try {
      await revocar({ id_profesional: idProfesional, motivo: "Revocada por el profesional" });
      toast.success("Firma revocada. Los documentos ya firmados no cambian.");
      setConfirmandoRevocar(false);
      onFirmaCambiada?.(null);
    } catch (error) {
      if (!isReverificationCancelledError(error)) toast.error(mensajeError(error?.codigo));
    } finally {
      setEnviando(false);
    }
  }

  // ── Vista del administrador u otro usuario: solo estado ──────────────────
  if (!puedeDibujar) {
    return (
      <div className="space-y-2 text-[13px] text-slate-600">
        {firma ? (
          <p>
            Firma registrada el <span className="font-medium text-slate-800">{formatearInstanteConOffset(firma.registrada_at)}</span>
            {firma.acta_version ? <> · acta v{firma.acta_version}</> : null}.
          </p>
        ) : (
          <p>El profesional aún no registra su firma.</p>
        )}
        <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] text-slate-500">
          La firma la dibuja el propio profesional desde su cuenta. Por seguridad legal, nadie más puede registrarla ni verla.
        </p>
      </div>
    );
  }

  // ── Firma registrada (dueño) ──────────────────────────────────────────────
  if (modo === "registrada" && firma) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-full items-center justify-center rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] sm:w-56">
            {imagenActual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagenActual} alt="Tu firma registrada" className="max-h-20 max-w-[90%] object-contain" />
            ) : (
              <span className="text-[12px] text-slate-400">Cargando firma…</span>
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
            <dt className="text-slate-400">Registrada</dt>
            <dd className="text-slate-700">{formatearInstanteConOffset(firma.registrada_at)}</dd>
            <dt className="text-slate-400">Tinta</dt>
            <dd className="capitalize text-slate-700">{firma.tinta}</dd>
            <dt className="text-slate-400">Acta</dt>
            <dd className="text-slate-700">Versión {firma.acta_version}</dd>
          </dl>
        </div>

        {confirmandoRevocar ? (
          <div className="rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-3 text-[13px] text-[#D70015]">
            <p className="font-medium">¿Revocar tu firma?</p>
            <p className="mt-0.5 text-[12px] text-[#D70015]">No podrás firmar documentos hasta registrar una nueva. Los ya firmados siguen siendo válidos.</p>
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmandoRevocar(false)} disabled={enviando} className="h-10 rounded-xl px-4 text-[13px] font-medium text-[#D70015] hover:bg-[#FF3B30]/15">
                Cancelar
              </button>
              <button type="button" onClick={confirmarRevocacion} disabled={enviando} className="h-10 rounded-xl bg-[#FF3B30] px-4 text-[13px] font-semibold text-white hover:bg-[#E0352B] disabled:opacity-60">
                {enviando ? "Revocando…" : "Sí, revocar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setModo("captura")}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Reemplazar firma
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRevocar(true)}
              className="h-10 rounded-xl px-4 text-[13px] font-medium text-[#D70015] transition-colors hover:bg-[#FF3B30]/10"
            >
              Revocar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Captura (dueño) ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-600">
        Dibuja tu firma como lo haces en papel. Se usará en los documentos que firmes electrónicamente.
      </p>

      <PadFirma
        ref={padRef}
        tinta={tinta}
        onCambioTinta={setTinta}
        deshabilitado={enviando}
        onCambio={({ trazos: nuevos }) => {
          setTrazos([...nuevos]);
          setErrorFirma("");
        }}
      />

      {vistaPrevia ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vistaPrevia.url} alt="Vista previa de la firma recortada" className="h-10 max-w-[160px] object-contain" />
          <span className="text-[11px] text-slate-500">
            Así se verá en los documentos · {vistaPrevia.ancho}×{vistaPrevia.alto} px
          </span>
        </div>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50">
        <input
          type="checkbox"
          checked={actaAceptada}
          disabled={!acta || enviando}
          onChange={(e) => {
            setActaAceptada(e.target.checked);
            setErrorFirma("");
          }}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#007AFF]"
        />
        <span className="text-[13px] leading-snug text-slate-700">
          He leído y acepto el{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setVerActa(true);
            }}
            disabled={!acta}
            className="font-semibold text-[#007AFF] hover:text-[#0062CC]"
          >
            Acta de adhesión a firma electrónica simple
          </button>{" "}
          (Ley 19.799){acta ? <span className="text-slate-400"> · v{acta.version}</span> : null}
        </span>
      </label>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Tu trazo es la representación visual de tu firma. La validez legal la da el registro de evidencia que se
        genera cada vez que firmas: identidad verificada, fecha y hora del servidor y huella SHA-256 del documento.
      </p>

      {errorFirma ? (
        <p role="alert" className="text-[12px] font-medium text-[#FF3B30]">
          {errorFirma}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {firma ? (
          <button
            type="button"
            onClick={() => setModo("registrada")}
            disabled={enviando}
            className="h-11 rounded-xl px-5 text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Mantener firma actual
          </button>
        ) : null}
        <button
          type="button"
          onClick={guardar}
          disabled={enviando || !trazos.length || !actaAceptada}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {enviando ? "Registrando…" : firma ? "Registrar nueva firma" : "Registrar firma"}
        </button>
      </div>

      <TextoLegalModal
        abierto={verActa}
        titulo={acta?.titulo}
        version={acta?.version}
        cuerpo={interpolarPlantilla(acta?.cuerpo, { empresa })}
        onCerrar={() => setVerActa(false)}
        accionPrincipal={{
          etiqueta: "Acepto",
          onClick: () => {
            setActaAceptada(true);
            setVerActa(false);
          },
        }}
      />
    </div>
  );
}
