'use client'

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ShadcnInput from "@/Componentes/shadcnInput2";
import ToasterClient from "@/Componentes/ToasterClient";
import toast from 'react-hot-toast';

export default function SolicitudExamenes() {
    const [id_examen, setIdExamen] = useState("");
    const [nombre_examen, setNombreExamen] = useState('');
    const [descripcion_examen, setDescripcionExamen] = useState('');
    const [valor_examen, setValorExamen] = useState('');
    const [estado_examen, setEstadoExamen] = useState('Activo');
    const [listaExamenes, setListaExamenes] = useState([]);

    const API = process.env.NEXT_PUBLIC_API_URL;

    async function seleccionarTodosExamenes() {
        try {
            const res = await fetch(`${API}/examenes/seleccionarTodosExamenes`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors'
            });

            if (!res.ok) {
                return toast.error('Error al cargar los exámenes.');
            } else {
                const respuestaBackend = await res.json();
                if (respuestaBackend) {
                    setListaExamenes(respuestaBackend);
                } else {
                    return toast.error('Error al obtener los datos.');
                }
            }
        } catch (error) {
            return toast.error('Error de conexión con el servidor.');
        }
    }

    useEffect(() => {
        seleccionarTodosExamenes();
    }, []);

    function limpiarFormulario() {
        setIdExamen("");
        setNombreExamen('');
        setDescripcionExamen('');
        setValorExamen('');
        setEstadoExamen('Activo');
    }

    function seleccionarExamen(examen) {
        setIdExamen(examen.id_examen);
        setNombreExamen(examen.nombre_examen);
        setDescripcionExamen(examen.descripcion_examen || '');
        setValorExamen(examen.valor_examen);
        setEstadoExamen(examen.estado_examen);
        toast.success(`Examen "${examen.nombre_examen}" seleccionado.`);
    }

    async function insertarExamen() {
        if (!nombre_examen || !valor_examen || valor_examen <= 0) {
            return toast.error('Por favor complete el nombre y el valor correctamente.');
        }

        try {
            const res = await fetch(`${API}/examenes/insertarExamen`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre_examen,
                    descripcion_examen,
                    valor_examen,
                    estado_examen
                }),
                mode: 'cors'
            });

            const respuestaBackend = await res.json();

            if (res.ok && respuestaBackend.message === true) {
                toast.success('Examen insertado con éxito.');
                limpiarFormulario();
                seleccionarTodosExamenes();
            } else {
                return toast.error(respuestaBackend.message || 'Error al insertar.');
            }
        } catch (error) {
            return toast.error('Error de red al intentar insertar.');
        }
    }

    async function actualizarExamen() {
        if (!id_examen) return toast.error('Debe seleccionar un examen de la tabla antes de actualizar.');

        try {
            const res = await fetch(`${API}/examenes/actualizarExamen`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_examen,
                    nombre_examen,
                    descripcion_examen,
                    valor_examen,
                    estado_examen
                }),
                mode: 'cors'
            });

            const respuestaBackend = await res.json();

            if (res.ok && respuestaBackend.message === true) {
                toast.success('Examen actualizado correctamente.');
                await seleccionarTodosExamenes();
            } else {
                return toast.error(respuestaBackend.message || 'Error al actualizar.');
            }
        } catch (error) {
            return toast.error('Error de red al intentar actualizar.');
        }
    }

    async function eliminarExamen() {
        if (!id_examen) return toast.error('Debe seleccionar un examen de la tabla antes de eliminar.');
        if (!confirm('¿Está seguro de eliminar este examen?')) return;

        try {
            const res = await fetch(`${API}/examenes/eliminarExamen`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_examen }),
                mode: 'cors'
            });

            const respuestaBackend = await res.json();

            if (res.ok && respuestaBackend.message === true) {
                toast.success('Examen eliminado.');
                limpiarFormulario();
                await seleccionarTodosExamenes();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

                {/* Header premium */}
                <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF] mb-1">Configuración</p>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                        Exámenes Clínicos
                    </h1>
                    <p className="mt-1 text-[13px] text-slate-500 max-w-2xl">
                        Administra el catálogo de exámenes disponibles en la clínica
                    </p>
                </div>

                <div className="space-y-6">

                    {/* Formulario */}
                    <div className="bg-white border border-slate-200 rounded-[32px] shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                                {id_examen ? 'Editar Examen' : 'Nuevo Examen'}
                            </h2>
                            {id_examen && (
                                <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                    ID: {id_examen}
                                </span>
                            )}
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del Examen</label>
                                    <ShadcnInput
                                        value={nombre_examen}
                                        placeholder="Ej: Hemograma completo"
                                        onChange={(e) => setNombreExamen(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor / Precio</label>
                                    <ShadcnInput
                                        type="number"
                                        value={valor_examen}
                                        placeholder="Ej: 15000"
                                        onChange={(e) => setValorExamen(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                                    <textarea
                                        className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 min-h-[80px] resize-none transition-colors"
                                        value={descripcion_examen}
                                        placeholder="Descripción del examen (opcional)"
                                        onChange={(e) => setDescripcionExamen(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button
                                    onClick={insertarExamen}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5B47B0] transition-all duration-150 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Insertar
                                </button>
                                <button
                                    onClick={actualizarExamen}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#6E56CF] bg-[#F3F0FF] border border-[#DDD6FE] rounded-xl hover:bg-[#EDE9FE] transition-all duration-150"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    </svg>
                                    Actualizar
                                </button>
                                <button
                                    onClick={eliminarExamen}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all duration-150 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Eliminar
                                </button>
                                <button
                                    onClick={limpiarFormulario}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-150"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de exámenes */}
                    <div className="bg-white border border-slate-200 rounded-[32px] shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Listado de Exámenes</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                                    {listaExamenes.length}
                                </span>
                                <button
                                    onClick={() => seleccionarTodosExamenes()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-150"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Actualizar Lista
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableCaption className="font-medium text-slate-400 text-xs py-4">Catálogo de exámenes clínicos registrados</TableCaption>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="w-[80px] text-center font-semibold text-slate-400 text-xs uppercase tracking-wider px-3 py-3">Sel.</TableHead>
                                        <TableHead className="text-left font-semibold text-slate-400 text-xs uppercase tracking-wider px-3 py-3">Nombre</TableHead>
                                        <TableHead className="text-left font-semibold text-slate-400 text-xs uppercase tracking-wider px-3 py-3">Descripción</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wider px-3 py-3">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listaExamenes.map((examen, i) => (
                                        <TableRow
                                            key={examen.id_examen}
                                            className={"hover:bg-slate-50 transition-colors duration-100 cursor-pointer " + (id_examen === examen.id_examen ? 'bg-[#F3F0FF] ring-1 ring-inset ring-[#DDD6FE]' : (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'))}
                                            onClick={() => seleccionarExamen(examen)}
                                        >
                                            <TableCell className="text-center px-3 py-2.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); seleccionarExamen(examen); }}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 hover:bg-violet-100 hover:text-violet-700 transition-colors duration-150"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-800 text-sm px-3 py-2.5">{examen.nombre_examen}</TableCell>
                                            <TableCell className="text-slate-600 text-sm px-3 py-2.5 max-w-[250px] truncate">{examen.descripcion_examen || '—'}</TableCell>
                                            <TableCell className="text-right text-slate-800 text-sm px-3 py-2.5 font-mono font-medium">
                                                ${Number(examen.valor_examen).toLocaleString('es-CL')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
