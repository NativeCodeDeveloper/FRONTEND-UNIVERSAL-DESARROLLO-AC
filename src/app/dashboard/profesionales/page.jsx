'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputTextDinamic } from "@/Componentes/InputTextDinamic";
import { InputNumberDinamic } from "@/Componentes/InputNumberDinamic";
import { TextAreaDinamic } from "@/Componentes/TextAreaDinamic";
import { ButtonDinamic } from "@/Componentes/ButtonDinamic";
import { SelectDinamic } from "@/Componentes/SelectDinamic";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from 'react-hot-toast';

export default function Profesionales() {
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [nombreProfesional, setNombreProfesional] = useState('');
    const [descripcionProfesional, setDescripcionProfesional] = useState('');
    const [id_profesional, setIdProfesional] = useState("");

    // ══════════════════════════════════════════════════════════════════════════
    // MODALIDAD DE ATENCIÓN — requiere migración de BD:
    //   ALTER TABLE profesionales
    //     ADD COLUMN modalidad_atencion VARCHAR(20) NOT NULL DEFAULT 'ambas'
    //     COMMENT 'presencial | online | ambas';
    //
    // Actualizar endpoint POST /profesionales/insertarProfesional:
    //   Aceptar { nombreProfesional, descripcionProfesional, modalidad_atencion }
    //
    // Actualizar endpoint POST /profesionales/actualizarProfesional:
    //   Aceptar { nombreProfesional, descripcionProfesional, modalidad_atencion, id_profesional }
    //
    // Retornar modalidad_atencion en GET seleccionarTodosProfesionales y POST seleccionarProfesional
    // ══════════════════════════════════════════════════════════════════════════
    const [modalidadAtencion, setModalidadAtencion] = useState('ambas'); // 'presencial' | 'online' | 'ambas'
    const API = process.env.NEXT_PUBLIC_API_URL;


    async function seleccionarTodosProfesionales() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                
            }else{
                const respustaBackend = await res.json();

                if(respustaBackend){
                    setListaProfesionales(respustaBackend);

                }else{
                    return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionales();
    }, []);


    async function seleccionarProfesional(id_profesional) {
        try {

            if(!id_profesional){
                return toast.error('Por favor seleccione un profesional para continuar con la edición.');
            }

            const res = await fetch(`${API}/profesionales/seleccionarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_profesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al seleccionar el profesional, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(Array.isArray(respustaBackend) && respustaBackend.length > 0){
                    setNombreProfesional(respustaBackend[0].nombreProfesional);
                    setDescripcionProfesional(respustaBackend[0].descripcionProfesional);
                    // Carga modalidad guardada (requiere migración BD)
                    setModalidadAtencion(respustaBackend[0].modalidad_atencion ?? 'ambas');
                    setIdProfesional(respustaBackend[0].id_profesional);
                    return toast.success('Profesional seleccionado correctamente.');
                }else{
                    return toast.error('Error al seleccionar el profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al seleccionar el profesional, por favor intente nuevamente.');
        }
    }



    async function eliminarProfesional(id_profesional) {
        try {
            if(!id_profesional){
                return toast.error('Por favor seleccione un profesional para continuar con la eliminacion.');
            }
            const res = await fetch(`${API}/profesionales/eliminarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_profesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreProfesional("");
                    setDescripcionProfesional("");
                    setIdProfesional("");
                    await seleccionarTodosProfesionales();
                    return toast.success('Profesional eliminado correctamente.');
                }else{
                    return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
        }
    }





    async function insertarProfesional(nombreProfesional,descripcionProfesional) {
        try {

            if(!nombreProfesional || !descripcionProfesional){
                return toast.error('Por favor complete todos los campos para insertar el profesional.');
            }

            const res = await fetch(`${API}/profesionales/insertarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({ nombreProfesional, descripcionProfesional, modalidad_atencion: modalidadAtencion }),
                mode: 'cors'
            })

                if (!res.ok) {
                    return toast.error('Error al insertar el profesional, por favor intente nuevamente.');
                }else{
                    const respustaBackend = await res.json();

                    if(respustaBackend.message === true){
                        setNombreProfesional('');
                        setDescripcionProfesional('');
                        await seleccionarTodosProfesionales();
                        return toast.success('Profesional insertado correctamente.');
                    }else{
                        return toast.error('Error al insertar el profesional, por favor intente nuevamente.');
                    }
                }
        }catch (error) {
            return toast.error('Error al insertar el profesional, por favor intente nuevamente.');
        }
    }





    async function actualizarProfesional(nombreProfesional,descripcionProfesional,id_profesional) {
        try {

            if(!nombreProfesional || !descripcionProfesional || !id_profesional){
                return toast.error('Por favor complete todos los campos para actualizar el profesional.');
            }

            const res = await fetch(`${API}/profesionales/actualizarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({ nombreProfesional, descripcionProfesional, id_profesional, modalidad_atencion: modalidadAtencion }),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al actualizar el profesional, por favor intente nuevamente.');
            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreProfesional('');
                    setDescripcionProfesional('');
                    setIdProfesional("");
                    await seleccionarTodosProfesionales();
                    return toast.success('Profesional actualizado correctamente.');

                }else{
                    return toast.error('Error al actualizar el profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al actualizar el profesional, por favor intente nuevamente.');
        }
    }



    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="mx-auto w-full max-w-6xl px-6 py-10">

                {/* Header */}
                <div className="mb-8 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuración</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Profesionales
                        </h1>
                        <p className="text-sm text-slate-500">
                            Gestión de profesionales registrados en la plataforma
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6">

                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">
                                Ingreso y edición
                                <span className="ml-2 text-slate-400">(Profesional)</span>
                            </h2>
                            <p className="text-sm text-slate-500">
                                Complete los campos para registrar o actualizar un profesional.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Nombre del profesional</label>

                                <InputTextDinamic
                                    value={nombreProfesional}
                                    onChange={(e) => setNombreProfesional(e.target.value)}
                                    placeholder="Ej: Dr. Juan Pérez"
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                />

                                <p className="text-xs text-slate-400">Solo se permiten letras y espacios.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Descripción del profesional</label>
                                <TextAreaDinamic
                                    value={descripcionProfesional}
                                    onChange={(e) => setDescripcionProfesional(e.target.value)}
                                    placeholder="Ej: Especialista en ortodoncia con 10 años de experiencia"
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                />
                            </div>

                            {/* Modalidad de atención — PENDIENTE BD —
                                Descomentar cuando esté aplicada la migración:
                                ALTER TABLE profesionales ADD COLUMN modalidad_atencion VARCHAR(20) NOT NULL DEFAULT 'ambas';
                                Y cuando los endpoints insertarProfesional / actualizarProfesional acepten el campo.

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Modalidad de atención</label>
                                <p className="text-xs text-slate-400">Define cómo atiende este profesional. Esto se reflejará en el formulario de reserva online.</p>
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { valor: "presencial", label: "Solo Presencial", icon: "📍" },
                                        { valor: "online",     label: "Solo Online",     icon: "💻" },
                                        { valor: "ambas",      label: "Presencial y Online", icon: "✦" },
                                    ].map(({ valor, label, icon }) => (
                                        <button
                                            key={valor}
                                            type="button"
                                            onClick={() => setModalidadAtencion(valor)}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                                                modalidadAtencion === valor
                                                    ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                                            }`}
                                        >
                                            <span>{icon}</span>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            — Fin bloque comentado — */}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                            <ButtonDinamic
                                onClick={() => insertarProfesional(nombreProfesional,descripcionProfesional)}
                                className="rounded-xl bg-[#6E56CF] text-white shadow-sm hover:bg-[#5B47B0] transition-colors"
                            >
                                Guardar Profesional
                            </ButtonDinamic>

                            <ButtonDinamic
                                onClick={() => actualizarProfesional(nombreProfesional,descripcionProfesional,id_profesional)}
                                className="rounded-xl bg-[#6E56CF] text-white shadow-sm hover:bg-[#5B47B0] transition-colors"
                            >
                                Actualizar Profesional
                            </ButtonDinamic>


                            <ButtonDinamic
                                onClick={() => eliminarProfesional(id_profesional)}
                                className="rounded-xl bg-rose-700 hover:bg-rose-600"
                            >
                                Eliminar Profesional
                            </ButtonDinamic>
                        </div>
                    </div>
                </div>

                {/* Selector */}
                <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="space-y-1 mb-5">
                        <h2 className="text-base font-semibold text-slate-900">Seleccionar profesional</h2>
                        <p className="text-sm text-slate-500">Seleccione un profesional para editar o eliminar.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <SelectDinamic
                                value={id_profesional}
                                onChange={(e) => setIdProfesional(e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                options={listaProfesionales.map(profesional => ({
                                    value: profesional.id_profesional,
                                    label: profesional.nombreProfesional
                                }))}

                                placeholder="Selecciona un profesional"
                            />
                        </div>
                        <ButtonDinamic
                            onClick={() => seleccionarProfesional(id_profesional)}
                            className="rounded-xl border border-[#DDD6FE] bg-[#F3F0FF] text-[#6E56CF] hover:bg-[#EDE9FE]">
                            Seleccionar
                        </ButtonDinamic>
                    </div>
                </div>

            </div>
        </div>
    );
}
