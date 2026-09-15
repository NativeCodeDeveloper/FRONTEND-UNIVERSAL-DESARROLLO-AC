"use client";

import {useEffect, useState} from "react";
import {toast} from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";

export default function Profesionales() {


    const [popupMockActivo, setPopupMockActivo] = useState("ninguno");


    const [nombreProfesional, setNombreProfesional] = useState("");
    const [descripcionProfesional, setDescripcionProfesional] = useState("");
    const [correoContacto, setCorreoContacto] = useState("");
    const [numeroTelefono, setNumeroTelefono] = useState("");
    const [rutProfesional, setRutProfesional] = useState("");

    const [nombreProfesionalEdit, setNombreProfesionalEdit] = useState("");
    const [descripcionProfesionalEdit, setDescripcionProfesionalEdit] = useState("");
    const [correoContactoEdit, setCorreoContactoEdit] = useState("");
    const [numeroTelefonoEdit, setNumeroTelefonoEdit] = useState("");
    const [rutProfesionalEdit, setRutProfesionalEdit] = useState("");

    const [id_profesional, setid_profesional] = useState("");


    function limpiarEstados() {
        setNombreProfesional("");
        setDescripcionProfesional("");
        setCorreoContacto("");
        setNumeroTelefono("");
        setRutProfesional("");
        setNombreProfesionalEdit("");
        setDescripcionProfesionalEdit("");
        setCorreoContactoEdit("");
        setNumeroTelefonoEdit("");
        setRutProfesionalEdit("");
        setid_profesional("");
    }


    const API = process.env.NEXT_PUBLIC_API_URL;

    //INSERTAR PROFESIONAL
    async function insertar(
        nombreProfesional,
        descripcionProfesional,
        correoContacto,
        numeroTelefono,
        rutProfesional) {
        try {
            if (!nombreProfesional) {
                return toast.error("Debe ingresar el nombre del profesional");
            }
            if (!descripcionProfesional) {
                return toast.error("Debe ingresar la descripción del profesional");
            }
            if (!correoContacto) {
                return toast.error("Debe ingresar el correo");
            }
            if (!numeroTelefono) {
                return toast.error("Debe ingresar el numeroTelefono");
            }
            if (!rutProfesional) {
                return toast.error("Debe ingresar el RUT del profesional");
            }

            const res = await fetch(`${API}/profesionales/insertarProfesional`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombreProfesional: nombreProfesional,
                    descripcionProfesional: descripcionProfesional,
                    correoContacto: correoContacto,
                    numeroTelefono: numeroTelefono,
                    rutProfesional: rutProfesional,
                }),
            });

            if (!res.ok) {
                return toast.error("Mala respuesta del servidor, contacte a soporte ");
            }

            const respuestaBackend = await res.json();

            if (respuestaBackend.message === true) {
                await cargarData();
                setPopupMockActivo("ninguno");
                return toast.success("Profesional ingresado correctamente");
            }

            if (respuestaBackend.message === false) {
                return toast.error("No fue posible ingresar nuevos profesionales intente mas tarde");
            }

        } catch (e) {
            return toast.error(`Error en el servidor contacte a soporte de nativeCode`);
        }
    }


    //CARGAR TODOS LOS PROFESIONALES
    const [data, setData]=useState([]);
    async function cargarData() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            });

            if (!res.ok) {
                return toast.error("Mala respuesta del servidor, contacte a soporte ");
            }

            const respuestaBackend = await res.json();
            limpiarEstados();
            setData(respuestaBackend);
            return toast.success("Profesionales cargados correctamente");

        } catch (e) {
            return toast.error(`Error en el servidor contacte a soporte de nativeCode`);
        }
    }


    useEffect(() => {
        cargarData();
    }, []);


    //ELIMINAR PROFESIONALES
    async function eliminar(id_profesional) {
        try {
            const res = await fetch(`${API}/profesionales/eliminarProfesional`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id_profesional })
            });

            if (!res.ok) {
                return toast.error("Mala respuesta del servidor, contacte a soporte ");
            }

            const respuestaBackend = await res.json();

            if(respuestaBackend.message === true){
                await cargarData();
                return toast.success("Profesional eliminado!");
            }

            if(respuestaBackend.message === false){
                await cargarData();
                return toast.error("No fue posible eliminar el profesional, intente más tarde");
            }


        } catch (e) {
            return toast.error(`Error en el servidor contacte a soporte de nativeCode`);
        }
    }



    //SELECCIONAR PROFESIONALES
    async function seleccionar(id_profesional) {
        try {
            if (!id_profesional) {
                return toast.error("Debe seleccionar un profesional");
            }

            const res = await fetch(`${API}/profesionales/seleccionarProfesional`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id_profesional : id_profesional
                }),
            });

            if (!res.ok) {
                return toast.error("Mala respuesta del servidor, contacte a soporte ");
            }

            const respuestaBackend = await res.json();

            setNombreProfesionalEdit(respuestaBackend[0].nombreProfesional);
            setDescripcionProfesionalEdit(respuestaBackend[0].descripcionProfesional);
            setCorreoContactoEdit(respuestaBackend[0].correoContacto);
            setNumeroTelefonoEdit(respuestaBackend[0].numeroTelefono);
            setRutProfesionalEdit(respuestaBackend[0].rutProfesional);
            setid_profesional(respuestaBackend[0].id_profesional);
            return toast.success("Profesional seleccionado!");
            if (respuestaBackend.message === false) {
                return toast.error("No fue seleccionar al profesional indicado");
            }
        } catch (e) {
            return toast.error(`Error en el servidor contacte a soporte de nativeCode`);
        }
    }



    //EDITAR PRFOFESIONALES
    async function actualizar(
        nombreProfesional,
        descripcionProfesional,
        correoContacto,
        numeroTelefono,
        rutProfesional,
        id_profesional) {
        try {
            if (!id_profesional) {
                return toast.error("Debe seleccionar al menos un profesional para poder editar sus datos.");
            }
            if (!nombreProfesional) {
                return toast.error("Debe ingresar el nombre del profesional");
            }
            if (!descripcionProfesional) {
                return toast.error("Debe ingresar la descripción del profesional");
            }
            if (!correoContacto) {
                return toast.error("Debe ingresar el correo");
            }
            if (!numeroTelefono) {
                return toast.error("Debe ingresar el numeroTelefono");
            }
            if (!rutProfesional) {
                return toast.error("Debe ingresar el RUT del profesional");
            }

            const res = await fetch(`${API}/profesionales/actualizarProfesional`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombreProfesional: nombreProfesional,
                    descripcionProfesional: descripcionProfesional,
                    correoContacto: correoContacto,
                    numeroTelefono: numeroTelefono,
                    rutProfesional: rutProfesional,
                    id_profesional: id_profesional
                }),
            });

            if (!res.ok) {
                return toast.error("Mala respuesta del servidor, contacte a soporte ");
            }

            const respuestaBackend = await res.json();

            if (respuestaBackend.message === true) {
                await cargarData();
                setPopupMockActivo("ninguno");
                return toast.success("Profesional actualizado!");
            }

            if (respuestaBackend.message === false) {
                return toast.error("No fue posible actualizar al profesional. Intente mas tarde");
            }

        } catch (e) {
            return toast.error(`Error en el servidor contacte a soporte de nativeCode`);
        }
    }




    const mockProfesionales = data.map((profesional) => {
        const palabrasNombre = String(profesional.nombreProfesional || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        const iniciales = `${palabrasNombre[0]?.[0] || ""}${palabrasNombre.at(-1)?.[0] || ""}`.toUpperCase();

        return {
            id: profesional.id_profesional || "",
            nombre: profesional.nombreProfesional || "",
            especialidad: profesional.descripcionProfesional || "",
            correo: profesional.correoContacto || "",
            telefono: profesional.numeroTelefono || "",
            rut: profesional.rutProfesional || "",
            iniciales: iniciales || "—",
            acento: "bg-slate-900 text-white"
        };
    });


    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Profesionales</h1>
                        <p className="mt-1 text-[13px] text-slate-500">3 profesionales registrados</p>
                    </div>
                    <button type="button" onClick={() => setPopupMockActivo("insertar")}
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                        </svg>
                        Nuevo Profesional
                    </button>
                </div>

                <div className="relative mb-6 max-w-md">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><svg
                        xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></span>
                    <input type="search" placeholder="Buscar por nombre, especialidad, correo o RUT..."
                           aria-label="Buscar profesional"
                           className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[13px] text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-900"/>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {mockProfesionales.map((profesional) => (
                        <article key={profesional.id}
                                 className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-start gap-3 px-5 pt-5">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${profesional.acento}`}>{profesional.iniciales}</div>
                                <div className="min-w-0 flex-1"><h2
                                    className="truncate text-[15px] font-bold text-slate-900">{profesional.nombre}</h2>
                                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">{profesional.especialidad}</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 px-5">
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-slate-400"
                                         fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                    <span className="min-w-0 truncate">{profesional.correo}</span></div>
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-slate-400"
                                         fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 00-2 2h-1C9.72 21 3 14.28 3 6V5z"/>
                                    </svg>
                                    <span className="min-w-0 truncate">{profesional.telefono}</span></div>
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-slate-400"
                                         fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0h4"/>
                                    </svg>
                                    <span className="min-w-0 truncate">{profesional.rut}</span></div>
                            </div>
                            <div className="mt-auto px-5 pb-5 pt-4">
                                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                                    <button type="button" onClick={() => {
                                        setPopupMockActivo("editar")
                                        seleccionar(profesional.id)
                                    }}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                        </svg>
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => eliminar(profesional.id)}
                                        type="button"
                                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {popupMockActivo !== "ninguno" ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center sm:p-6">
                    <div role="dialog" aria-modal="true" aria-labelledby="popup-profesional-titulo"
                         className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-[24px]">
                        <div className="flex justify-center pt-3 sm:hidden">
                            <div className="h-1 w-10 rounded-full bg-slate-200"/>
                        </div>
                        <header className="flex items-center justify-between gap-4 px-6 pb-2 pt-5 sm:px-8 sm:pt-7"><h2
                            id="popup-profesional-titulo"
                            className="text-lg font-semibold tracking-tight text-slate-900">{popupMockActivo === "editar" ? "Editar Profesional" : "Nuevo Profesional"}</h2>
                            <button type="button" onClick={() => setPopupMockActivo("ninguno")} aria-label="Cerrar"
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                          d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8">
                            {popupMockActivo === "editar" ? (
                                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                                    <div className="space-y-1.5 sm:col-span-2"><label
                                        className="block text-[13px] font-medium text-slate-700">Nombre completo<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={nombreProfesionalEdit}
                                        onChange={(e) => setNombreProfesionalEdit(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-slate-900"/>
                                    </div>
                                    <div className="space-y-1.5"><label
                                        className="block text-[13px] font-medium text-slate-700">Email<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={correoContactoEdit}
                                        onChange={(e) => setCorreoContactoEdit(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-slate-900"/>
                                    </div>
                                    <div className="space-y-1.5"><label
                                        className="block text-[13px] font-medium text-slate-700">Teléfono<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={numeroTelefonoEdit}
                                        onChange={(e) => setNumeroTelefonoEdit(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-slate-900"/>
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2"><label
                                        className="block text-[13px] font-medium text-slate-700">RUT<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={rutProfesionalEdit}
                                        onChange={(e) => setRutProfesionalEdit(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-slate-900"/>
                                        <p className="text-[11px] text-slate-400">Se formateará automáticamente · sin
                                            puntos ni guión</p></div>
                                    <div className="space-y-1.5 sm:col-span-2"><label
                                        className="block text-[13px] font-medium text-slate-700">Especialidad<span
                                        className="ml-0.5 text-slate-400">*</span></label><textarea
                                        value={descripcionProfesionalEdit}
                                        onChange={(e) => setDescripcionProfesionalEdit(e.target.value)}
                                        className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-900"/>
                                        <p className="text-right text-[11px] text-slate-400">40/500</p></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                                    <div className="space-y-1.5 sm:col-span-2"><label
                                        className="block text-[13px] font-medium text-slate-700">Nombre completo<span
                                        className="ml-0.5 text-slate-400">*</span></label>
                                        <input
                                            value={nombreProfesional}
                                            onChange={(e) => setNombreProfesional(e.target.value)}
                                        placeholder="Dr. María González"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900"/>
                                    </div>
                                    <div className="space-y-1.5"><label
                                        className="block text-[13px] font-medium text-slate-700">Email<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={correoContacto}
                                        onChange={(e) => setCorreoContacto(e.target.value)}
                                        placeholder="dra.gonzalez@clinica.cl"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900"/>
                                    </div>
                                    <div className="space-y-1.5"><label
                                        className="block text-[13px] font-medium text-slate-700">Teléfono<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={numeroTelefono}
                                        onChange={(e) => setNumeroTelefono(e.target.value)}
                                        placeholder="+56912345678"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900"/>
                                        <p className="text-[11px] text-slate-400">Puedes ingresar 12345678, 912345678 o
                                            +56912345678</p></div>
                                    <div className="space-y-1.5 sm:col-span-2"><label
                                        className="block text-[13px] font-medium text-slate-700">RUT<span
                                        className="ml-0.5 text-slate-400">*</span></label><input
                                        value={rutProfesional}
                                        onChange={(e) => setRutProfesional(e.target.value)}
                                        placeholder="12.345.678-9"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900"/>
                                        <p className="text-[11px] text-slate-400">Se formateará automáticamente · sin
                                            puntos ni guión</p></div>
                                    <div className="space-y-1.5 sm:col-span-2"><label
                                        className="block text-[13px] font-medium text-slate-700">Especialidad<span
                                        className="ml-0.5 text-slate-400">*</span></label>
                                        <textarea
                                            value={descripcionProfesional}
                                            onChange={(e) => setDescripcionProfesional(e.target.value)}
                                        placeholder="Ej: Especialista en ortodoncia con 10 años de experiencia"
                                        className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900"/>
                                        <p className="text-right text-[11px] text-slate-400">0/500</p></div>
                                </div>
                            )}
                        </div>
                        <footer className="flex items-center justify-end gap-2 px-6 py-4 sm:px-8 sm:py-5">
                            <button type="button" onClick={() => setPopupMockActivo("ninguno")}
                                    className="h-11 rounded-xl px-5 text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">Cancelar
                            </button>
                            {popupMockActivo === "editar" ? (
                                <button
                                    onClick={() => {
                                        setPopupMockActivo("editar");
                                        actualizar(
                                            nombreProfesionalEdit,
                                            descripcionProfesionalEdit,
                                            correoContactoEdit,
                                            numeroTelefonoEdit,
                                            rutProfesionalEdit,
                                            id_profesional)
                                    }}
                                    type="button"
                                        className="flex h-11 items-center justify-center rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800">
                                    Guardar cambios
                                </button>
                            ) : (
                                <button type="button" onClick={() => insertar(
                                    nombreProfesional,
                                    descripcionProfesional,
                                    correoContacto,
                                    numeroTelefono,
                                    rutProfesional)}
                                        className="flex h-11 items-center justify-center rounded-xl bg-black px-6 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800">
                                    Registrar Profesional
                                </button>
                            )}
                        </footer>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
