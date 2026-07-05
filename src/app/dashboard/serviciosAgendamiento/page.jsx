'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputTextDinamic } from "@/Componentes/InputTextDinamic";
import { InputNumberDinamic } from "@/Componentes/InputNumberDinamic";
import { TextAreaDinamic } from "@/Componentes/TextAreaDinamic";
import { ButtonDinamic } from "@/Componentes/ButtonDinamic";
import { SelectDinamic } from "@/Componentes/SelectDinamic";
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

                            <ButtonDinamic
                                onClick={() => eliminarServicioProfesional(id_servicioProfesional)}
                                className="rounded-xl bg-rose-700 hover:bg-rose-600">
                                Eliminar Servicio
                            </ButtonDinamic>
                        </div>
                    </div>
                </div>

                {/* Selector */}
                <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="space-y-1 mb-5">
                        <h2 className="text-base font-semibold text-slate-900">Seleccionar servicio</h2>
                        <p className="text-sm text-slate-500">Seleccione un servicio para editar o eliminar.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <SelectDinamic
                                value={id_servicioProfesional}
                                onChange={(e) => setId_servicioProfesional(e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                options={listaServiciosProfesionales.map(profesional => ({
                                    value: profesional.id_servicioProfesional,
                                    label: profesional.nombreServicio
                                }))}
                                placeholder="Selecciona un servicio para editar o eliminar"
                            />
                        </div>
                        <ButtonDinamic
                            onClick={() => seleccionarServicioProfesional(id_servicioProfesional)}
                            className="rounded-xl border border-[#DDD6FE] bg-[#F3F0FF] text-[#6E56CF] hover:bg-[#EDE9FE]">
                            Seleccionar servicio
                        </ButtonDinamic>
                    </div>
                </div>

            </div>
        </div>
    );
}
