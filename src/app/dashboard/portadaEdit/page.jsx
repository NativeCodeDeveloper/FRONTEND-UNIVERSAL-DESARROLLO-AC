'use client';
import {useEffect, useState} from "react";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {InfoButton} from "@/Componentes/InfoButton";
import ImageCropperModal from "@/Componentes/ImageCropperModal";
import * as React from "react";

const PORTADA_CROP_ASPECT = 1; // La página pública (/portada) muestra la imagen en un contenedor cuadrado.

export default function CarruselPortada() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const PORTADA = 'portada';
    const CARD = 'card';

    const [dataPublicacionesCarrusel, setdataPublicacionesCarrusel] = useState([]);
    const [imagen, setimagen] = useState(null);
    const [vistaPrevia, setVistaPrevia] = useState(null);
    const [tituloPortadaCarrusel,settituloPortadaCarrusel] = useState("");
    const [descripcionPublicacionesPortada, setdescripcionPublicacionesPortada] = useState("");
    const [id_publicacionesPortada, setid_publicacionesPortada] = useState(null);
    const [imagenAnterior, setimagenAnterior] = useState(null);
    const [imagenParaCrop, setImagenParaCrop] = useState(null);
    const [cropperAbierto, setCropperAbierto] = useState(false);



    function capturarImagen(event){
        const file = event.target.files?.[0] ?? null;
        event.target.value = "";
        if(!file) return;

        const url = URL.createObjectURL(file);
        setImagenParaCrop(url);
        setCropperAbierto(true);
    }

    function onCropConfirm(croppedFile){
        if(vistaPrevia){
            URL.revokeObjectURL(vistaPrevia);
        }
        if(imagenParaCrop){
            URL.revokeObjectURL(imagenParaCrop);
        }
        setimagen(croppedFile);
        setVistaPrevia(URL.createObjectURL(croppedFile));
        setCropperAbierto(false);
        setImagenParaCrop(null);
    }

    function onCropCancel(){
        if(imagenParaCrop){
            URL.revokeObjectURL(imagenParaCrop);
        }
        setCropperAbierto(false);
        setImagenParaCrop(null);
    }


    async function subirPortadaClick(){
        if(!tituloPortadaCarrusel || !descripcionPublicacionesPortada || !imagen){
          return toast.error("Debe completar toda la informacion para subir la portada");
        }

        const imagenId = await subirImagenCloudflare(imagen);
        await insertarPortada(tituloPortadaCarrusel,descripcionPublicacionesPortada,imagenId);
        await seleccionarPortadas();
    }



    async function actualizaroPortadaClick(){
        if(!tituloPortadaCarrusel || !descripcionPublicacionesPortada || !id_publicacionesPortada){
            return toast.error("Debe completar toda la informacion para subir la portada");
        }

        let imagenId  = await subirImagenCloudflare(imagen);

        if(!imagenId){
            imagenId = imagenAnterior;
            await actualizarPortada(tituloPortadaCarrusel,descripcionPublicacionesPortada,imagenId,id_publicacionesPortada);
            await seleccionarPortadas();

        }else {
            await actualizarPortada(tituloPortadaCarrusel,descripcionPublicacionesPortada,imagenId,id_publicacionesPortada);
            await seleccionarPortadas();

        }
    }




    async function subirImagenCloudflare(){
        const formData = new FormData();
        formData.append('image', imagen);

        const res = await fetch(`${API}/cloudflare/subirimagenes`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        return data.imageId;
    }

    async function seleccionarPortadas() {
        try {
            const res = await fetch(`${API}/carruselPortada/seleccionarCarruselPortada`, {
                method: "GET",
                headers: {Accept: "application/json,"},
                mode: "cors",
            })

            if(!res.ok) {
                return toast.error('No ha sido posible cargar las imagenes del carrusel porfavor contacte a soporte de NativeCode');

            }else{

                const dataCarrusel = await res.json();
                setdataPublicacionesCarrusel(dataCarrusel);
            }
        }catch (error) {
            return toast.error('No ha sido posible cargar las imagenes del carrusel porfavor contacte a soporte de NativeCode');
        }
    }

    useEffect(() => {
        seleccionarPortadas()
    },[])


    async function insertarPortada(tituloPortadaCarrusel,descripcionPublicacionesPortada,imagenPortada){
        try {

            if(!tituloPortadaCarrusel || !descripcionPublicacionesPortada || !imagenPortada){
                return toast.error('No ha sido posible insertar la imagen del carrusel porfavor contacte a soporte de NativeCode');
            }


            const res = await fetch(`${API}/carruselPortada/insertarCarruselPortada`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({
                    tituloPortadaCarrusel,
                    descripcionPublicacionesPortada,
                    imagenPortada})
            })

            if(!res.ok) {
                return toast.error('No ha sido posible insertar la imagen del carrusel porfavor contacte a soporte de NativeCode');
            }else{
                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    limpiarDataInputs();
                    return toast.success('Imagen Subida Correctamente');
                }else if(respuestaBackend.message === false){
                    return toast.error('No se ha podido subir la imagen intente mas tarde!');
                }else {
                    return toast.error('No ha sido posible insertar la imagen del carrusel porfavor contacte a soporte de NativeCode');
                }
            }

        }catch (error) {
            return toast.error('No ha sido posible insertar la imagen del carrusel porfavor contacte a soporte de NativeCode');

        }
    }

    async function eliminarPortada(id_publicacionesPortada){
        try {
            if(!id_publicacionesPortada){
                return toast.error('Debe seleccionar la imagen de la portada que desea eliminar.');
            }

            const res = await fetch(`${API}/carruselPortada/eliminarCarruselPortada`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_publicacionesPortada})
            })

            if(!res.ok) {
                return toast.error('No ha sido posible eliminar la imagen del carrusel porfavor contacte a soporte de NativeCode');
            }else {
                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    await seleccionarPortadas();
                    return toast.success('Imagen eliminada correctamente del carrusel.');
                }else if(respuestaBackend.message === false){
                    return toast.error('No ha sido posible eliminar la imagen del carrusel porfavor intente mas tarde!');
                }else{
                    return toast.error('No ha sido posible eliminar la imagen del carrusel porfavor contacte a soporte de NativeCode');
                }
            }

        }catch (error) {
            return toast.error('No ha sido posible eliminar la imagen del carrusel porfavor contacte a soporte de NativeCode');

        }
    }




    async function seleccionarPortada(id_publicacionesPortada){
        try {
            if(!id_publicacionesPortada){
                return toast.error('Debe seleccionar la imagen de la portada que desea editar.');
            }

            const res = await fetch(`${API}/carruselPortada/seleccionarCarruselPortadaporId`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_publicacionesPortada})
            })

            if(!res.ok) {
                return toast.error('No ha sido posible seleccionar la imagen del carrusel porfavor contacte a soporte de NativeCode');
            }else {

                const respuestaBackendData = await res.json();
                settituloPortadaCarrusel(respuestaBackendData[0].tituloPortadaCarrusel)
                setdescripcionPublicacionesPortada(respuestaBackendData[0].descripcionPublicacionesPortada)
                setid_publicacionesPortada(respuestaBackendData[0].id_publicacionesPortada)
                setimagenAnterior(respuestaBackendData[0].imagenPortada)
                setVistaPrevia(`https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ/${respuestaBackendData[0].imagenPortada}/${CARD}`)


                return toast.success('Imagen seleccionada');

            }
        }catch (error) {
            return toast.error('No ha sido posible seleccionar la imagen del carrusel porfavor contacte a soporte de NativeCode');

        }
    }




    async function actualizarPortada(tituloPortadaCarrusel,descripcionPublicacionesPortada,imagenPortada,id_publicacionesPortada){
        try {

            if(!tituloPortadaCarrusel || !descripcionPublicacionesPortada  || !id_publicacionesPortada){
                return toast.error('Para editar una portada existente debe seleccionar una portada y llenar todas los campos includia la imagen.');
            }


            const res = await fetch(`${API}/carruselPortada/actualizarCarruselPortada`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({
                    tituloPortadaCarrusel,
                    descripcionPublicacionesPortada,
                    imagenPortada,
                    id_publicacionesPortada})
            })

            if(!res.ok) {
                return toast.error('Problema al enviar datos al servidor contacte a soporte de NativeCode SpA');

            }else{
                const respuestaBackend = await res.json();

                if (respuestaBackend.message === true) {
                    limpiarDataInputs();
                    return toast.success('Imagen actualizada Correctamente');

                }else if(respuestaBackend.message === false){

                    return toast.error('No se ha podido actualizar la imagen intente mas tarde!');

                }else {

                    return toast.error('retorna algo difrrnte a lo qiue envia en el controller');

                }
            }

        }catch (error) {
            return toast.error('server error');

        }
    }


    function limpiarDataInputs(){
        settituloPortadaCarrusel("");
        setdescripcionPublicacionesPortada("");
        setVistaPrevia(null);
        setid_publicacionesPortada(0);
    }


    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient />
            <ImageCropperModal
                open={cropperAbierto}
                imageSrc={imagenParaCrop}
                aspectRatio={PORTADA_CROP_ASPECT}
                title="Ajusta la imagen de portada"
                onConfirm={onCropConfirm}
                onCancel={onCropCancel}
            />

            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                
                {/* ── Header ── */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuración de Portal</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Imágenes de Portada</h1>
                        <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">
                            Gestiona las imágenes de gran formato que rotan en la cabecera del sitio. Asegúrate de usar imágenes de alta resolución para mantener la calidad visual.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <InfoButton
                            informacion={'Gestiona las imágenes de gran formato que rotan en la cabecera del sitio público.'}
                            pasos={[
                                'Sube una imagen cuadrada de alta resolución (mínimo 1080 × 1080 px) en formato JPG o PNG.',
                                'Ajusta el encuadre en el editor que se abre al subir la imagen.',
                                'Guarda para publicarla en la portada del sitio.',
                            ]}
                        />
                    </div>
                </div>

                {id_publicacionesPortada > 0 && (
                    <div className="mb-8 p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <div className="h-8 w-8 rounded-xl bg-[#6E56CF] text-white flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <span className="text-[13px] font-bold text-[#6E56CF]">
                            Editando Portada ID: {id_publicacionesPortada}
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ── Panel de Edición/Creación (5 slots) ── */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#6E56CF] shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Detalles de la Portada</h2>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Título de la Portada</label>
                                    <ShadcnInput
                                        value={tituloPortadaCarrusel}
                                        placeholder="Ej: Odontología de Vanguardia"
                                        onChange={(e) => settituloPortadaCarrusel(e.target.value)}
                                        className="h-12 rounded-2xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Descripción Breve</label>
                                    <ShadcnInput
                                        value={descripcionPublicacionesPortada}
                                        placeholder="Ej: Especialistas dedicados a tu salud dental"
                                        onChange={(e) => setdescripcionPublicacionesPortada(e.target.value)}
                                        className="h-12 rounded-2xl border-slate-200 focus:ring-violet-50 focus:border-[#6E56CF]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Imagen de Portada (Proporción 1:1)</label>
                                    <div className="relative group">
                                        <input
                                            type='file'
                                            accept="image/*"
                                            onChange={capturarImagen}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-widest file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-all cursor-pointer bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => subirPortadaClick()}
                                            className="flex-1 h-12 bg-[#6E56CF] text-white text-sm font-bold rounded-2xl hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Subir Nueva
                                        </button>
                                        <button
                                            onClick={() => limpiarDataInputs()}
                                            className="h-12 px-6 border border-slate-200 text-slate-500 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                    {id_publicacionesPortada > 0 && (
                                        <button
                                            onClick={() => actualizaroPortadaClick()}
                                            className="w-full h-12 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2"
                                        >
                                            Actualizar Portada Seleccionada
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        {vistaPrevia && (
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Previsualización</h3>
                                    <span className="text-[10px] font-bold text-[#6E56CF] bg-violet-50 px-2 py-1 rounded-lg uppercase tracking-tight">Efecto Carrusel</span>
                                </div>
                                <div className="p-4">
                                    <div className="aspect-square rounded-2xl overflow-hidden shadow-inner bg-slate-100 max-w-xs mx-auto">
                                        <img src={vistaPrevia} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Listado de Portadas Activas (7 slots) ── */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Histórico de Portadas</h3>
                            <span className="h-6 px-2.5 rounded-full bg-violet-50 text-[#6E56CF] text-xs font-bold flex items-center justify-center">
                                {dataPublicacionesCarrusel.length} registradas
                            </span>
                        </div>

                        <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                            {dataPublicacionesCarrusel.map((c, index) => (
                                <div key={index} className="group bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-64 aspect-video md:aspect-square relative overflow-hidden bg-slate-100 shrink-0">
                                            <img
                                                src={`https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ/${c.imagenPortada}/${CARD}`}
                                                alt="Portada"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 left-4 h-7 px-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center border border-white/10">
                                                ID #{c.id_publicacionesPortada}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 p-8 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-[#6E56CF] transition-colors">
                                                    {c.tituloPortadaCarrusel}
                                                </h4>
                                                <p className="mt-3 text-[14px] text-slate-500 leading-relaxed line-clamp-2">
                                                    {c.descripcionPublicacionesPortada}
                                                </p>
                                            </div>
                                            
                                            <div className="mt-6 flex items-center gap-3">
                                                <button 
                                                    onClick={() => seleccionarPortada(c.id_publicacionesPortada)}
                                                    className="flex-1 h-10 bg-violet-50 text-[#6E56CF] text-xs font-bold rounded-xl hover:bg-[#6E56CF] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => eliminarPortada(c.id_publicacionesPortada)}
                                                    className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                                    title="Eliminar Portada"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {dataPublicacionesCarrusel.length === 0 && (
                                <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-400 italic">No hay portadas registradas en el carrusel.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
