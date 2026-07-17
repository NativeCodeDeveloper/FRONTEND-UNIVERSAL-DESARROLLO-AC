"use client"

import React, {useEffect, useRef, useState} from "react";
import {toast, Toaster} from "react-hot-toast";
import {InfoButton} from "@/Componentes/InfoButton";
import ImageCropperModal from "@/Componentes/ImageCropperModal";

const PUBLICACIONES_CROP_ASPECT = 1; // Tarjetas cuadradas en /seccion3
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml"
];
const VARIANT_CARD = "card";
const VARIANT_FULL = "full";

export default function Publicaciones() {
    const [file, setfile] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [newDescripcion, setNewDescripcion] = useState("");
    const [newFile, setNewFile] = useState(null);
    const [newPreview, setNewPreview] = useState(null);
    const [isInserting, setIsInserting] = useState(false);
    const previewUrlRef = useRef(null);
    const [descripcionPublicaciones, setDescripcionPublicaciones] = useState("");
    const [listaPublicaciones, setListaPublicaciones] = useState([]);
    const [id_publicaciones, setId_publicaciones] = useState("");

    // Cropper: flujo "Actualizar" (hasta 3 imágenes en cola secuencial)
    const [cropUpdateAbierto, setCropUpdateAbierto] = useState(false);
    const [cropUpdateImageSrc, setCropUpdateImageSrc] = useState(null);
    const [colaCropPendiente, setColaCropPendiente] = useState([]);
    const [croppedAcumulados, setCroppedAcumulados] = useState([]);
    const [totalCropBatch, setTotalCropBatch] = useState(0);

    // Cropper: flujo "Insertar" (1 imagen)
    const [cropInsertAbierto, setCropInsertAbierto] = useState(false);
    const [cropInsertImageSrc, setCropInsertImageSrc] = useState(null);

    const API = process.env.NEXT_PUBLIC_API_URL;
    const CLOUDFLARE_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_HASH;
    const selectedPublication = listaPublicaciones.find((publicacion) => String(publicacion.id_publicaciones) === String(id_publicaciones));
    const selectedAllowsMultiple = Number(id_publicaciones) === 10;

    async function downscaleImage(file, maxW = 1600, maxH = 1600, quality = 0.82) {
        const img = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });
            const {width, height} = img;
            const scale = Math.min(maxW / width, maxH / height, 1);
            const targetW = Math.max(1, Math.round(width * scale));
            const targetH = Math.max(1, Math.round(height * scale));
            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            canvas.getContext("2d").drawImage(img, 0, 0, targetW, targetH);

            return await new Promise((resolve) =>
                canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality)
            );
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }

    function validarImagen(file) {
        if (!file) return "Debe seleccionar una imagen.";
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Solo se permiten imagenes JPG, PNG, WEBP, GIF o SVG.";
        return "";
    }

    async function prepararImagen(file) {
        const error = validarImagen(file);
        if (error) throw new Error(error);

        let toUpload = file;
        if (toUpload.size > MAX_UPLOAD_SIZE) {
            const compressed = await downscaleImage(toUpload);
            if (compressed && compressed.size < toUpload.size) {
                toUpload = new File([compressed], `${file.name || "image"}.jpg`, {type: "image/jpeg"});
            }
        }

        if (!ALLOWED_IMAGE_TYPES.includes(toUpload.type)) {
            throw new Error("El archivo comprimido no es un tipo de imagen valido para Cloudflare.");
        }

        if (toUpload.size > MAX_UPLOAD_SIZE) {
            throw new Error("La imagen excede 10 MB incluso tras compresion. Sube una imagen de menor resolucion o peso.");
        }

        return toUpload;
    }

    async function subirImagen(file) {
        const toUpload = await prepararImagen(file);
        const formData = new FormData();
        formData.append("image", toUpload);

        const res = await fetch(`${API}/cloudflare/subirimagenes`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Error subiendo imagen a Cloudflare:", res.status, errText);
            throw new Error("Error subiendo imagen a Cloudflare.");
        }

        const data = await res.json();
        if (data?.ok === false || !data?.imageId) {
            throw new Error("Cloudflare no devolvio un identificador de imagen.");
        }

        return data.imageId;
    }

    async function actualizarPublicaciones(
        descripcionPublicaciones,
        imagenPublicaciones_primera,
        imagenPublicaciones_segunda,
        imagenPublicaciones_tercera,
        id_publicaciones
    ) {
        if (!descripcionPublicaciones || !id_publicaciones || !imagenPublicaciones_primera) {
            throw new Error("Debe seleccionar una publicacion, escribir una descripcion y subir al menos una imagen.");
        }

        const res = await fetch(`${API}/publicaciones/actualizarPublicacion`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                descripcionPublicaciones,
                imagenPublicaciones_primera,
                imagenPublicaciones_segunda,
                imagenPublicaciones_tercera,
                id_publicaciones
            }),
            mode: "cors",
            cache: "no-cache"
        });

        const resultado = await res.json();
        if (!res.ok) throw new Error("No fue posible actualizar la publicacion seleccionada.");
        if (resultado.message === "sindato") throw new Error("Debe llenar los campos obligatorios.");
        if (String(resultado.message) !== "true") throw new Error("El servidor no confirmo la actualizacion.");
    }

    async function eliminarPublicacion(id_publicaciones) {
        try {
            if (!id_publicaciones) {
                return toast.error("Debe seleccionar una publicacion para eliminar.");
            }

            const res = await fetch(`${API}/publicaciones/eliminarPublicacion`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_publicaciones}),
                mode: "cors",
                cache: "no-cache"
            });

            const resultado = await res.json();
            if (!res.ok) return toast.error("No se ha podido eliminar la publicacion.");
            if (resultado.message === "sindato") return toast.error("Debe seleccionar la publicacion que desea eliminar.");

            if (resultado.message === true) {
                await listarPublicaciones();
                return toast.success("Publicacion eliminada correctamente.");
            }

            return toast.error("No se pudo confirmar la eliminacion.");
        } catch (error) {
            return toast.error(error?.message || "No se ha podido eliminar la publicacion.");
        }
    }

    async function listarPublicaciones() {
        try {
            const res = await fetch(`${API}/publicaciones/seleccionarPublicaciones`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors",
                cache: "no-cache"
            });

            if (!res.ok) {
                setListaPublicaciones([]);
                return [];
            }

            const publicaciones = await res.json();
            const lista = Array.isArray(publicaciones) ? publicaciones : [];
            setListaPublicaciones(lista);
            return lista;
        } catch (err) {
            console.error("Problema al consultar publicaciones:", err);
            setListaPublicaciones([]);
            return [];
        }
    }

    useEffect(() => {
        listarPublicaciones();
    }, []);

    // Limpiar blob URL solo al desmontar el componente
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        };
    }, []);

    async function insertarPublicacion(
        descripcionPublicaciones,
        imagenPublicaciones_primera,
        imagenPublicaciones_segunda,
        imagenPublicaciones_tercera
    ) {
        if (!descripcionPublicaciones || !imagenPublicaciones_primera) {
            throw new Error("Descripcion e imagen son obligatorias.");
        }

        const res = await fetch(`${API}/publicaciones/insertarPublicacion`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                descripcionPublicaciones,
                imagenPublicaciones_primera,
                imagenPublicaciones_segunda,
                imagenPublicaciones_tercera
            }),
            mode: "cors",
            cache: "no-store"
        });

        if (!res.ok) throw new Error("No fue posible guardar la publicacion.");

        const data = await res.json();
        if (String(data.message) !== "true") throw new Error("El servidor no confirmo el guardado.");
    }

    function handlePublicationSelect(event) {
        const value = event.target.value;
        setId_publicaciones(value);
        const publication = listaPublicaciones.find((item) => String(item.id_publicaciones) === String(value));
        setDescripcionPublicaciones(publication?.descripcionPublicaciones || "");

        if (Number(value) !== 10 && file.length > 1) {
            setfile(file.slice(0, 1));
            toast("Esta publicacion admite una sola imagen. Se mantuvo la primera seleccionada.");
        }
    }

    function abrirCropperUpdate(rawFile) {
        const url = URL.createObjectURL(rawFile);
        setCropUpdateImageSrc(url);
        setCropUpdateAbierto(true);
    }

    function handleFileChange(event) {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (!files.length) return;

        const soloUnaImagen = id_publicaciones && Number(id_publicaciones) !== 10;
        const limite = soloUnaImagen ? 1 : 3;

        if (soloUnaImagen && files.length > 1) {
            toast("Solo se permite 1 imagen para esta publicacion. Se usara la primera seleccionada.");
        } else if (!soloUnaImagen && files.length > 3) {
            toast("Has seleccionado mas de 3 imagenes. Se usaran las primeras 3.");
        }

        const seleccionados = files.slice(0, limite);
        setCroppedAcumulados([]);
        setColaCropPendiente(seleccionados.slice(1));
        setTotalCropBatch(seleccionados.length);
        abrirCropperUpdate(seleccionados[0]);
    }

    function onCropUpdateConfirm(croppedFile) {
        if (cropUpdateImageSrc) URL.revokeObjectURL(cropUpdateImageSrc);
        const nuevosAcumulados = [...croppedAcumulados, croppedFile];

        if (colaCropPendiente.length > 0) {
            const [siguiente, ...resto] = colaCropPendiente;
            setCroppedAcumulados(nuevosAcumulados);
            setColaCropPendiente(resto);
            abrirCropperUpdate(siguiente);
            return;
        }

        setfile(nuevosAcumulados);
        setCroppedAcumulados([]);
        setColaCropPendiente([]);
        setTotalCropBatch(0);
        setCropUpdateAbierto(false);
        setCropUpdateImageSrc(null);
    }

    function onCropUpdateCancel() {
        if (cropUpdateImageSrc) URL.revokeObjectURL(cropUpdateImageSrc);
        setColaCropPendiente([]);
        setCroppedAcumulados([]);
        setTotalCropBatch(0);
        setCropUpdateAbierto(false);
        setCropUpdateImageSrc(null);
        toast("Selección de imágenes cancelada.");
    }

    function handleNewFileChange(event) {
        const selectedFile = event.target.files?.[0] || null;
        event.target.value = "";
        if (!selectedFile) return;

        const url = URL.createObjectURL(selectedFile);
        setCropInsertImageSrc(url);
        setCropInsertAbierto(true);
    }

    function onCropInsertConfirm(croppedFile) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        if (cropInsertImageSrc) URL.revokeObjectURL(cropInsertImageSrc);

        setNewFile(croppedFile);
        const newUrl = URL.createObjectURL(croppedFile);
        previewUrlRef.current = newUrl;
        setNewPreview(newUrl);

        setCropInsertAbierto(false);
        setCropInsertImageSrc(null);
    }

    function onCropInsertCancel() {
        if (cropInsertImageSrc) URL.revokeObjectURL(cropInsertImageSrc);
        setCropInsertAbierto(false);
        setCropInsertImageSrc(null);
    }

    async function handleUpdateSubmit(event) {
        event.preventDefault();

        if (!id_publicaciones) return toast.error("Selecciona una publicacion para actualizar.");
        if (!descripcionPublicaciones.trim()) return toast.error("Escribe una descripcion para la publicacion.");
        if (!file.length) return toast.error("Selecciona al menos una imagen.");

        try {
            setIsUploading(true);
            const filesToUpload = selectedAllowsMultiple ? file.slice(0, 3) : file.slice(0, 1);
            const uploadedIds = [];

            for (const selectedFile of filesToUpload) {
                uploadedIds.push(await subirImagen(selectedFile));
            }

            await actualizarPublicaciones(
                descripcionPublicaciones.trim(),
                uploadedIds[0] || "",
                uploadedIds[1] || "",
                uploadedIds[2] || "",
                id_publicaciones
            );
            await listarPublicaciones();
            setfile([]);
            setDescripcionPublicaciones("");
            setId_publicaciones("");
            toast.success("Publicacion actualizada correctamente.");
            setTimeout(() => listarPublicaciones(), 2500);
        } catch (error) {
            toast.error(error?.message || "No fue posible actualizar la publicacion.");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleInsertSubmit(event) {
        event.preventDefault();

        if (!newDescripcion.trim() || !newFile) {
            return toast.error("Descripcion e imagen son obligatorias para insertar.");
        }

        try {
            setIsInserting(true);
            const imageId = await subirImagen(newFile);
            await insertarPublicacion(newDescripcion.trim(), imageId, "", "");
            await listarPublicaciones();
            setNewDescripcion("");
            setNewFile(null);
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
            setNewPreview(null);
            toast.success("Publicacion insertada correctamente.");
            setTimeout(() => listarPublicaciones(), 2500);
        } catch (error) {
            toast.error(error?.message || "Error al insertar publicacion.");
        } finally {
            setIsInserting(false);
        }
    }

    function cfToSrc(imageId, variant = VARIANT_CARD) {
        if (!imageId) return "";
        if (imageId.startsWith("http")) return imageId;
        if (!CLOUDFLARE_HASH) return "";
        return `https://imagedelivery.net/${CLOUDFLARE_HASH}/${imageId}/${variant}`;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <Toaster position="top-right" reverseOrder={false} />
            <ImageCropperModal
                open={cropUpdateAbierto}
                imageSrc={cropUpdateImageSrc}
                aspectRatio={PUBLICACIONES_CROP_ASPECT}
                title={totalCropBatch > 1
                    ? `Ajusta la imagen ${croppedAcumulados.length + 1} de ${totalCropBatch}`
                    : "Ajusta la imagen de la publicación"}
                onConfirm={onCropUpdateConfirm}
                onCancel={onCropUpdateCancel}
            />
            <ImageCropperModal
                open={cropInsertAbierto}
                imageSrc={cropInsertImageSrc}
                aspectRatio={PUBLICACIONES_CROP_ASPECT}
                title="Ajusta la imagen de la publicación"
                onConfirm={onCropInsertConfirm}
                onCancel={onCropInsertCancel}
            />

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                
                {/* ── Header ── */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Gestión de Contenido</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Publicaciones del Carrusel</h1>
                        <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">
                            Administra las piezas visuales que aparecen en el portal público. Mantén la imagen de tu clínica actualizada cargando nuevos contenidos y promociones.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-14 px-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Piezas</span>
                            <span className="text-xl font-bold text-slate-900 mt-1 leading-none">{listaPublicaciones.length}</span>
                        </div>
                        <InfoButton informacion={'Este apartado permite cargar imágenes para el carrusel de la página principal. La publicación con ID 10 es especial y admite hasta 3 imágenes simultáneas.'}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ── Columna Izquierda: Formularios (7 slots) ── */}
                    <div className="lg:col-span-7 space-y-8">
                        
                        {/* Form: Actualizar */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#6E56CF] shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Actualizar Publicación Existente</h2>
                            </div>

                            <form onSubmit={handleUpdateSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Seleccionar Publicación</label>
                                        <select
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-50"
                                            value={id_publicaciones}
                                            onChange={handlePublicationSelect}
                                            disabled={isUploading}
                                        >
                                            <option value="" disabled>Selecciona una opción...</option>
                                            {listaPublicaciones.map((p) => (
                                                <option value={p.id_publicaciones} key={p.id_publicaciones}>
                                                    #{p.id_publicaciones} - {p.descripcionPublicaciones}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <div className="h-12 px-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-[#6E56CF]"></span>
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                                Límite: {selectedAllowsMultiple ? "3 Imágenes" : "1 Imagen"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nueva Descripción</label>
                                    <input
                                        type="text"
                                        value={descripcionPublicaciones}
                                        onChange={(e) => setDescripcionPublicaciones(e.target.value)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-50"
                                        placeholder="Ej: Nuestra nueva tecnología láser..."
                                        disabled={isUploading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Cargar Imágenes</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple={selectedAllowsMultiple}
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-widest file:bg-[#6E56CF] file:text-white hover:file:bg-[#5b45bc] transition-all cursor-pointer bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200"
                                        disabled={isUploading}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="h-12 px-8 bg-[#6E56CF] text-white text-sm font-bold rounded-2xl hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isUploading ? "Procesando..." : "Actualizar Contenido"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Form: Insertar */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Crear Nueva Publicación</h2>
                            </div>

                            <form onSubmit={handleInsertSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Descripción del Banner</label>
                                            <input
                                                type="text"
                                                value={newDescripcion}
                                                onChange={(e) => setNewDescripcion(e.target.value)}
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                                                placeholder="Ej: Especialistas en Ortodoncia..."
                                                disabled={isInserting}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Imagen Principal</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleNewFileChange}
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-widest file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-all cursor-pointer bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200"
                                                disabled={isInserting}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="aspect-square rounded-3xl border border-slate-100 bg-slate-50 overflow-hidden relative">
                                        {newPreview ? (
                                            <img src={newPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Vista Previa</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isInserting}
                                        className="h-12 px-8 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isInserting ? "Insertando..." : "Confirmar Creación"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Columna Derecha: Inventario Visual (5 slots) ── */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Publicaciones Activas</h3>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grilla de Inventario</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {listaPublicaciones.map((p) => {
                                const isProtected = Number(p.id_publicaciones) === 10;
                                const imageSrc = cfToSrc(p.imagenPublicaciones_primera, VARIANT_FULL);
                                
                                return (
                                    <div key={p.id_publicaciones} className="group bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                                        <div className="aspect-square relative overflow-hidden bg-slate-100">
                                            {imageSrc ? (
                                                <img src={imageSrc} alt={p.descripcionPublicaciones} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <span className="h-6 px-2 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center">#{p.id_publicaciones}</span>
                                                {isProtected && <span className="h-6 px-2 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center">Fija</span>}
                                            </div>
                                            
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => {
                                                        setId_publicaciones(String(p.id_publicaciones));
                                                        setDescripcionPublicaciones(p.descripcionPublicaciones || "");
                                                        window.scrollTo({top: 0, behavior: "smooth"});
                                                    }}
                                                    className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {!isProtected && (
                                                    <button 
                                                        onClick={() => { if(confirm("¿Eliminar publicación?")) eliminarPublicacion(p.id_publicaciones) }}
                                                        className="h-10 w-10 rounded-xl bg-white text-rose-600 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-[13px] font-bold text-slate-700 line-clamp-1">{p.descripcionPublicaciones || "Sin descripción"}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
