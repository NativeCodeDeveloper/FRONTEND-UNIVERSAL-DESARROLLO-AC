'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputTextDinamic } from "@/Componentes/InputTextDinamic";
import { InputNumberDinamic } from "@/Componentes/InputNumberDinamic";
import { TextAreaDinamic } from "@/Componentes/TextAreaDinamic";
import { ButtonDinamic } from "@/Componentes/ButtonDinamic";
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

                        </div>
                    </div>
                </div>

                {/* Tabla de profesionales registrados */}
                <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-[#F3F0FF] text-[#6E56CF] shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-slate-900">Profesionales registrados</h2>
                                <p className="mt-0.5 text-sm text-slate-500">Administre el equipo profesional disponible en la plataforma.</p>
                            </div>
                        </div>
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></span>
                            <span className="text-xs font-semibold text-slate-600">
                                {listaProfesionales.length} {listaProfesionales.length === 1 ? 'profesional registrado' : 'profesionales registrados'}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                    <th scope="col" className="w-[30%] px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Profesional</th>
                                    <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Descripción</th>
                                    <th scope="col" className="w-[130px] px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Estado</th>
                                    <th scope="col" className="w-[250px] px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {listaProfesionales.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-14 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a5 5 0 00-10 0v2m0 0H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-slate-500">No hay profesionales registrados.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    listaProfesionales.map((profesional) => (
                                        <tr key={profesional.id_profesional} className="group transition-colors hover:bg-slate-50/60">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors group-hover:border-violet-200 group-hover:bg-[#F3F0FF] group-hover:text-[#6E56CF]">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.121 17.804A9 9 0 1118.88 17.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-800">{profesional.nombreProfesional}</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">ID #{profesional.id_profesional}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="max-w-md px-6 py-4 text-sm leading-6 text-slate-500">{profesional.descripcionProfesional}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Registrado
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => seleccionarProfesional(profesional.id_profesional)}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3.5 text-xs font-bold text-[#6E56CF] shadow-sm transition-all hover:border-violet-300 hover:bg-[#F3F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                                                        aria-label={`Editar ${profesional.nombreProfesional}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 13H9v-2.828l6.586-6.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarProfesional(profesional.id_profesional)}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 text-xs font-bold text-rose-600 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                                        aria-label={`Eliminar ${profesional.nombreProfesional}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
