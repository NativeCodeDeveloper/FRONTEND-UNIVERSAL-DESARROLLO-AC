"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { toast } from "react-hot-toast";
import { recortarImagenACroppedFile } from "@/FuncionesTranversales/FuncionesImagenCrop";

export default function ImageCropperModal({
    open,
    imageSrc,
    aspectRatio = 1,
    title = "Ajusta la imagen",
    fileName = "imagen.jpg",
    onConfirm,
    onCancel,
}) {
    const [mounted, setMounted] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
        }
    }, [open, imageSrc]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!mounted || !open || !imageSrc) return null;

    async function handleConfirmar() {
        if (!croppedAreaPixels) {
            return toast.error("Ajusta el recorte antes de confirmar.");
        }

        try {
            setIsSaving(true);
            const croppedFile = await recortarImagenACroppedFile(imageSrc, croppedAreaPixels, { fileName });
            onConfirm?.(croppedFile);
        } catch (error) {
            toast.error(error?.message || "No fue posible recortar la imagen.");
        } finally {
            setIsSaving(false);
        }
    }

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-200"
                onClick={() => !isSaving && onCancel?.()}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
                        <p className="mt-1 text-xs text-slate-500">Arrastra y haz zoom para elegir el encuadre.</p>
                    </div>

                    <div className="relative h-[380px] w-full bg-slate-900">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                        />
                    </div>

                    <div className="px-6 py-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Zoom</span>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 accent-[#6E56CF]"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => onCancel?.()}
                                disabled={isSaving}
                                className="h-11 px-6 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmar}
                                disabled={isSaving}
                                className="h-11 px-6 rounded-2xl bg-[#6E56CF] text-white text-sm font-bold hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                            >
                                {isSaving ? "Procesando..." : "Confirmar recorte"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
