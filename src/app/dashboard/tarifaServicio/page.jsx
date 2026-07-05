'use client'
import React, { useEffect, useState } from 'react';
import { InputNumberDinamic } from "@/Componentes/InputNumberDinamic";
import { ButtonDinamic } from "@/Componentes/ButtonDinamic";
import { SelectDinamic } from "@/Componentes/SelectDinamic";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from 'react-hot-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function TarifaServicio() {
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [listaServiciosProfesionales, setListaServiciosProfesionales] = useState([]);
    const [listaTarifasProfesionales, setListaTarifasProfesionales] = useState([]);
    const [nombreProfesional, setNombreProfesional] = useState('');
    const [nombreServicio, setNombreServicio] = useState('');


    const [id_tarifaProfesional, setId_tarifaProfesional] = useState("");
    const [servicio_id, setservicio_id] = useState("");
    const [profesional_id, setprofesional_id] = useState("");
    const [precioConsulta, setPrecioConsulta] = useState('');
    const [duracionServicio, setDuracionServicio] = useState('');

    const API = process.env.NEXT_PUBLIC_API_URL;




    async function seleccionarTodasTarifasProfesionales() {
        try {
            const res = await fetch(`${API}/tarifasProfesional/seleccionarTodasTarifasConNombres`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los Tarifas y Servicios Profesionales, por favor intente nuevamente.');
            }else{

                const respustaBackend = await res.json();
                if(respustaBackend){
                    setListaTarifasProfesionales(respustaBackend);

                }else{
                    return toast.error('Error al cargar los Tarifas y Servicios Profesionales, por favor intente nuevamente .');
                }
            }
        }catch (error) {

            return toast.error('Error al cargar los tarifas y Servicios Profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodasTarifasProfesionales();
    }, []);


    async function seleccionarTarifaProfesional(id_tarifaProfesional) {
        try {
            if(!id_tarifaProfesional){
                return toast.error('Por favor seleccione una tarifa para continuar con la edición.');
            }

            const res = await fetch(`${API}/tarifasProfesional/seleccionarTarifaProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_tarifaProfesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al seleccionar la tarifa deseada, por favor intente nuevamente.');

            }else{

                const respustaBackend = await res.json();

                if(Array.isArray(respustaBackend) && respustaBackend.length > 0){
                    setservicio_id(respustaBackend[0].servicio_id);
                    setprofesional_id(respustaBackend[0].profesional_id);
                    setPrecioConsulta(respustaBackend[0].precio);
                    setDuracionServicio(respustaBackend[0].duracion_min);
                    setId_tarifaProfesional(respustaBackend[0].id_tarifaProfesional);
                    return toast.success('Tarifa seleccionada para edición.');

                }else{
                    return toast.error('Error al seleccionar la tarifa seleccionada, por favor intente nuevamente.');
                }
            }

        }catch (error) {

            return toast.error('Error al seleccionar la tarifa seleccionada, por favor intente nuevamente.');
        }
    }





    async function insertarTarifaProfesional(profesional_id,servicio_id,precio,duracion_min) {
        try {
            if(!profesional_id || !servicio_id || !precio || !duracion_min){
                return toast.error('Complete todos los campos: profesional, servicio, precio y duración.');
            }
            const res = await fetch(`${API}/tarifasProfesional/insertarTarifaProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({profesional_id,servicio_id,precio,duracion_min}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('No se pudo guardar la tarifa. Intente nuevamente.');
            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreServicio('');
                    setNombreProfesional('');
                    setPrecioConsulta('');
                    setDuracionServicio('');
                    setprofesional_id('');
                    setservicio_id('');
                    setId_tarifaProfesional('');
                    await seleccionarTodasTarifasProfesionales();

                    return toast.success('Tarifa guardada correctamente.');

                }else{
                    return toast.error('No se pudo guardar la tarifa. Intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error de conexión al guardar la tarifa. Intente nuevamente.');
        }
    }



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






    async function actualizarTarifaProfesional(profesional_id,servicio_id,precio,duracion_min,id_tarifaProfesional) {
        try {
            if(!profesional_id || !servicio_id || !precio || !duracion_min || !id_tarifaProfesional){
                return toast.error('Complete todos los campos: profesional, servicio, precio y duración.');
            }
            const res = await fetch(`${API}/tarifasProfesional/actualizarTarifaProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({profesional_id,servicio_id,precio,duracion_min,id_tarifaProfesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('No se pudo actualizar la tarifa. Intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreServicio('');
                    setNombreProfesional('');
                    setPrecioConsulta('');
                    setDuracionServicio('');
                    setprofesional_id('');
                    setservicio_id('');
                    setId_tarifaProfesional('');
                    await seleccionarTodasTarifasProfesionales();
                    return toast.success('Tarifa actualizada correctamente.');

                }else{
                    return toast.error('No se pudo actualizar la tarifa. Intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error de conexión al actualizar la tarifa. Intente nuevamente.');
        }
    }





    async function eliminarTarifaProfesional(id_tarifaProfesional) {
        try {
            if(!id_tarifaProfesional){
                return toast.error('Debe seleccionar una tarifa para eliminarla.');
            }

            const res = await fetch(`${API}/tarifasProfesional/eliminarTarifaProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_tarifaProfesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('No se pudo eliminar la tarifa. Intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreServicio('');
                    setNombreProfesional('');
                    setPrecioConsulta('');
                    setDuracionServicio('');
                    setprofesional_id('');
                    setservicio_id('');
                    setId_tarifaProfesional('');
                    await seleccionarTodasTarifasProfesionales();
                    return toast.success('Tarifa eliminada correctamente.');

                }else{
                    return toast.error('No se pudo eliminar la tarifa. Intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error de conexión al eliminar la tarifa. Intente nuevamente.');
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
                            Cobro por Consulta o Servicio
                        </h1>
                        <p className="text-sm text-slate-500">
                            Consultas y valores por cada consulta y profesional
                        </p>
                    </div>
                </div>

                {/* Selectores */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="space-y-1 mb-5">
                            <h2 className="text-base font-semibold text-slate-900">Seleccionar Profesional</h2>
                            <p className="text-sm text-slate-500">Seleccione el profesional que imparte el servicio.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <SelectDinamic
                                value={profesional_id}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    setprofesional_id(id);
                                    const prof = listaProfesionales.find(p => String(p.id_profesional) === String(id));
                                    setNombreProfesional(prof?.nombreProfesional || '');
                                }}
                                className="rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                options={listaProfesionales.map(profesional => ({
                                    value: profesional.id_profesional,
                                    label: profesional.nombreProfesional
                                }))}
                                placeholder="Selecciona un profesional"
                            />
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="space-y-1 mb-5">
                            <h2 className="text-base font-semibold text-slate-900">Seleccionar Servicio</h2>
                            <p className="text-sm text-slate-500">Seleccione un servicio para asignar tarifa.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <SelectDinamic
                                value={servicio_id}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    setservicio_id(id);
                                    const serv = listaServiciosProfesionales.find(s => String(s.id_servicioProfesional) === String(id));
                                    setNombreServicio(serv?.nombreServicio || '');
                                }}
                                className="rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                options={listaServiciosProfesionales.map(servicio => ({
                                    value: servicio.id_servicioProfesional,
                                    label: servicio.nombreServicio
                                }))}
                                placeholder="Selecciona un servicio"
                            />
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6">

                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">
                                Ingreso y edición
                                <span className="ml-2 text-slate-400">(Tarifa)</span>
                            </h2>
                            <p className="text-sm text-slate-500">
                                Complete los campos para registrar o actualizar una tarifa.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">Profesional:</span>
                                <span className="text-sm text-slate-900">
                                    {nombreProfesional || "No se ha seleccionado ningún profesional"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">Servicio:</span>
                                <span className="text-sm text-slate-900">
                                    {nombreServicio || "No se ha seleccionado ningún servicio"}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Precio de la consulta</label>
                                <InputNumberDinamic
                                    value={precioConsulta}
                                    onChange={(e) => setPrecioConsulta(e.target.value)}
                                    placeholder="Ej: 70000"
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                />
                                <p className="text-xs text-slate-400">Solo se permiten valores numéricos.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Duración del servicio (minutos)</label>
                                <InputNumberDinamic
                                    value={duracionServicio}
                                    onChange={(e) => setDuracionServicio(e.target.value)}
                                    placeholder="Ej: 50"
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                                />
                                <p className="text-xs text-slate-400">Solo se permiten valores numéricos.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                            <ButtonDinamic
                                onClick={() => insertarTarifaProfesional(profesional_id, servicio_id, precioConsulta, duracionServicio)}
                                className="rounded-xl bg-[#6E56CF] text-white shadow-sm hover:bg-[#5B47B0] transition-colors"
                            >
                                Guardar Tarifa
                            </ButtonDinamic>

                            <ButtonDinamic
                                onClick={() =>  actualizarTarifaProfesional(profesional_id,servicio_id,precioConsulta,duracionServicio,id_tarifaProfesional)}
                                className="rounded-xl bg-[#6E56CF] text-white shadow-sm hover:bg-[#5B47B0] transition-colors"
                            >
                                Actualizar Tarifa
                            </ButtonDinamic>

                            <ButtonDinamic
                                onClick={() => eliminarTarifaProfesional(id_tarifaProfesional)}
                                className="bg-red-600 hover:bg-red-500"
                            >
                                Eliminar Tarifa
                            </ButtonDinamic>
                        </div>
                    </div>
                </div>



                <div className="mt-8 rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="space-y-1 mb-0 p-6 pb-5 border-b border-slate-100">
                        <h2 className="text-base font-semibold text-slate-900">Tarifas registradas</h2>
                        <p className="text-sm text-slate-500">Lista de valores por consulta y profesional.</p>
                    </div>
                    <div className="overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Profesional</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Servicio</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Duración</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 text-right">Valor</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 text-center">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listaTarifasProfesionales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-sm text-slate-400 py-8">
                                        No hay tarifas registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                listaTarifasProfesionales.map((tarifa, index) => (
                                    <TableRow key={tarifa.id_tarifaProfesional || index} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-900">{tarifa.nombreProfesional}</TableCell>
                                        <TableCell className="text-slate-600">{tarifa.nombreServicio}</TableCell>
                                        <TableCell className="text-slate-600">{tarifa.duracion_min} min</TableCell>
                                        <TableCell className="text-right font-semibold text-slate-900">${tarifa.precio}</TableCell>
                                        <TableCell className="text-center">
                                            <ButtonDinamic
                                                onClick={() =>seleccionarTarifaProfesional(tarifa.id_tarifaProfesional)}
                                                className="rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] px-3 py-1 text-xs text-[#6E56CF] hover:bg-[#EDE9FE]"
                                            >
                                                Seleccionar
                                            </ButtonDinamic>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </div>

            </div>
        </div>
    );
}
