'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputTextDinamic } from "@/Componentes/InputTextDinamic";
import { InputNumberDinamic } from "@/Componentes/InputNumberDinamic";
import { TextAreaDinamic } from "@/Componentes/TextAreaDinamic";
import { ButtonDinamic } from "@/Componentes/ButtonDinamic";
import toast from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";


export default function ServiciosAgendamiento() {
    const [listaServiciosProfesionales, setListaServiciosProfesionales] = useState([]);
    const [nombreServicio, setNombreServicio] = useState('');
    const [descripcionServicio, setDescripcionServicio] = useState('');
    const [id_servicioProfesional, setId_servicioProfesional] = useState("");
    const API = process.env.NEXT_PUBLIC_API_URL;



    async function seleccionarTodosServiciosProfesionales() {
        try {
            const res = await fetch(`${API}/serviciosProfesionales/seleccionarTodosServiciosProfesionales`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los Servicios Profesionales, por favor intente nuevamente.');
            }else{

                const respustaBackend = await res.json();
                if(respustaBackend){
                    setListaServiciosProfesionales(respustaBackend);

                }else{
                    return toast.error('Error al cargar los Servicios Profesionales, por favor intente nuevamente .');
                }
            }
        }catch (error) {

            return toast.error('Error al cargar los Servicios Profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosServiciosProfesionales();
    }, []);




    async function insertarServicioProfesional(nombreServicio,descripcionServicio) {
        try {

            if(!nombreServicio || !descripcionServicio){
                return toast.error('Por favor complete todos los campos para insertar el  Servicio Profesional.');
            }

            const res = await fetch(`${API}/serviciosProfesionales/insertarServicioProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({nombreServicio,descripcionServicio}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al insertar el  servicio profesional, por favor intente nuevamente.');
            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreServicio('');
                    setDescripcionServicio('');
                    await seleccionarTodosServiciosProfesionales();
                    return toast.success('Servicio profesional insertado correctamente.');

                }else{
                    return toast.error('Error al insertar el servicio profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al insertar el servicio profesional, por favor intente nuevamente.');
        }
    }





    async function seleccionarServicioProfesional(id_servicioProfesional) {
        try {

            if(!id_servicioProfesional){
                return toast.error('Por favor seleccione un Servicio Profesional para continuar con la edición.');
            }

            const res = await fetch(`${API}/serviciosProfesionales/seleccionarServicioProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_servicioProfesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al seleccionar el Servicio profesional, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(Array.isArray(respustaBackend) && respustaBackend.length > 0){
                    setNombreServicio(respustaBackend[0].nombreServicio);
                    setDescripcionServicio(respustaBackend[0].descripcionServicio);
                    setId_servicioProfesional(respustaBackend[0].id_servicioProfesional);
                    return toast.success('Servicio Profesional seleccionado correctamente.');

                }else{
                    return toast.error('Error al seleccionar el Servicio profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al seleccionar el servicio profesional, por favor intente nuevamente.');
        }
    }





    async function actualizarServicioProfesional(nombreServicio,descripcionServicio,id_servicioProfesional) {
        try {

            if(!nombreServicio || !descripcionServicio || !id_servicioProfesional){
                return toast.error('Por favor complete todos los campos para actualizar el servicio profesional.');
            }

            const res = await fetch(`${API}/serviciosProfesionales/actualizarServicioProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({nombreServicio,descripcionServicio,id_servicioProfesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al actualizar el servicio profesional, por favor intente nuevamente.');
            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreServicio('');
                    setDescripcionServicio('');
                    setId_servicioProfesional("");
                    await seleccionarTodosServiciosProfesionales();
                    return toast.success('Servicio profesional actualizado correctamente.');

                }else{
                    return toast.error('Error al actualizar el servicio profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al actualizar el servicio profesional, por favor intente nuevamente.');
        }
    }




    async function eliminarServicioProfesional(id_servicioProfesional) {
        try {
            if(!id_servicioProfesional){
                return toast.error('Por favor seleccione un servicio profesional para continuar con la eliminacion.');
            }
            const res = await fetch(`${API}/serviciosProfesionales/eliminarServicioProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_servicioProfesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al eliminar el servicio profesional, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreServicio("");
                    setDescripcionServicio("");
                    setId_servicioProfesional("");
                    await seleccionarTodosServiciosProfesionales();
                    return toast.success('Servicio profesional eliminado correctamente.');
                }else{
                    return toast.error('Error al eliminar el servicio profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al eliminar el servicio profesional, por favor intente nuevamente.');
        }
    }



    return (
        <div className="min-h-screen bg-[#FAFAFB]">
                <ToasterClient />
            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="mb-8 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuración</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Agendamiento con Cobro
                        </h1>
                        <p className="text-sm text-slate-500">
                            Consultas y valores por cada consulta y profesional
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6">

                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">
                                Ingreso y edición
                                <span className="ml-2 text-slate-400">(Servicio)</span>
                            </h2>
                            <p className="text-sm text-slate-500">
                                Complete los campos para registrar o actualizar un servicio de agendamiento.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Nombre del servicio</label>
                                <InputTextDinamic
                                    value={nombreServicio}
                                    onChange={(e) => setNombreServicio(e.target.value)}
                                    placeholder="Ej: Consulta general, Control ortodoncia"
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                />
                                <p className="text-xs text-slate-400">Solo se permiten letras y espacios.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Descripción del servicio</label>
                                <TextAreaDinamic
                                    value={descripcionServicio}
                                    onChange={(e) => setDescripcionServicio(e.target.value)}
                                    placeholder="Ej: Consulta general con evaluación completa del paciente"
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                            <ButtonDinamic
                                onClick={() => insertarServicioProfesional(nombreServicio,descripcionServicio)}
                                className="rounded-xl bg-[#6E56CF] text-white shadow-sm hover:bg-[#5B47B0] transition-colors">
                                Guardar Servicio
                            </ButtonDinamic>

                            <ButtonDinamic
                                onClick={() => actualizarServicioProfesional(nombreServicio,descripcionServicio,id_servicioProfesional)}
                                className="rounded-xl bg-[#6E56CF] text-white shadow-sm hover:bg-[#5B47B0] transition-colors">
                                Actualizar Servicio
                            </ButtonDinamic>

                        </div>
                    </div>
                </div>

                {/* Tabla de servicios disponibles */}
                <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-[#F3F0FF] text-[#6E56CF] shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-slate-900">Servicios disponibles</h2>
                                <p className="mt-0.5 text-sm text-slate-500">Administre los servicios habilitados para el agendamiento.</p>
                            </div>
                        </div>
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></span>
                            <span className="text-xs font-semibold text-slate-600">
                                {listaServiciosProfesionales.length} {listaServiciosProfesionales.length === 1 ? 'servicio registrado' : 'servicios registrados'}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                    <th scope="col" className="w-[30%] px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Servicio</th>
                                    <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Descripción</th>
                                    <th scope="col" className="w-[130px] px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Estado</th>
                                    <th scope="col" className="w-[250px] px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {listaServiciosProfesionales.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-14 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-slate-500">No hay servicios disponibles.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    listaServiciosProfesionales.map((servicio) => (
                                        <tr key={servicio.id_servicioProfesional} className="group transition-colors hover:bg-slate-50/60">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors group-hover:border-violet-200 group-hover:bg-[#F3F0FF] group-hover:text-[#6E56CF]">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-800">{servicio.nombreServicio}</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">ID #{servicio.id_servicioProfesional}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="max-w-md px-6 py-4 text-sm leading-6 text-slate-500">{servicio.descripcionServicio}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Disponible
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => seleccionarServicioProfesional(servicio.id_servicioProfesional)}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3.5 text-xs font-bold text-[#6E56CF] shadow-sm transition-all hover:border-violet-300 hover:bg-[#F3F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                                                        aria-label={`Editar ${servicio.nombreServicio}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 13H9v-2.828l6.586-6.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarServicioProfesional(servicio.id_servicioProfesional)}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 text-xs font-bold text-rose-600 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                                        aria-label={`Eliminar ${servicio.nombreServicio}`}
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
