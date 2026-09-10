"use client";
import {useParams} from "next/navigation";
import {useState,useEffect} from "react";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {toast} from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {ShadcnInput} from "@/Componentes/shadcnInput";


export default function EspecificacionProductos(){
    const API = process.env.NEXT_PUBLIC_API_URL;
    const {id} = useParams(); // Este id corresponde a la subsubcategoría padre

    // Estados para la subsubcategoría padre
    const [nombreSubSubCategoriaPadre, setNombreSubSubCategoriaPadre] = useState("");

    // Estados para las especificaciones de producto
    const [listaEspecificaciones, setListaEspecificaciones] = useState([]);
    const [descripcionEspecificacion, setDescripcionEspecificacion] = useState("");
    const [idEspecificacionSeleccionada, setIdEspecificacionSeleccionada] = useState(0);


    // FUNCION PARA SELECCIONAR SUBSUBCATEGORIA PADRE ESPECIFICA
    async function obtenerSubSubCategoriaPadre(id_subsubcategoria) {
        try {
            if (!id_subsubcategoria) {
                console.error({ message: "Id de sub-subcategoría no proporcionado" });
                return null;
            }
            const res = await fetch(`${API}/subsubcategorias/seleccionarPorSubSubCategoria`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_subsubcategoria})
            })
            if (!res.ok) {
                return toast.error('No fue posible seleccionar la sub-subcategoría, contacte a soporte de NativeCode');
            }
            const data = await res.json();
            const subsubcategoria = Array.isArray(data) ? data[0] : data;
            if (subsubcategoria) {
                setNombreSubSubCategoriaPadre(subsubcategoria.descripcionSubSubCategoria);
            }
            return toast.success('Sub-subcategoría cargada correctamente')
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        if (id) {
            obtenerSubSubCategoriaPadre(id)
        }
    }, [id]);


    // FUNCION PARA LISTAR ESPECIFICACIONES POR ID DE SUBSUBCATEGORIA
    async function listarEspecificaciones(id_subsubcategoria) {
        try {
            if (!id_subsubcategoria) {
                return toast.error("Debe seleccionar al menos una sub-subcategoría para listar las especificaciones.");
            }
            const res = await fetch(`${API}/especificacionProducto/seleccionarEspecificacionPorSubSubCategoria`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_subsubcategoria})
            })
            if (!res.ok) {
                return toast.error("Ha ocurrido un error con el servidor, contacte a soporte de NativeCode");
            } else {
                const resultadoData = await res.json();
                if (resultadoData.length > 0) {
                    setListaEspecificaciones(resultadoData);
                } else {
                    setListaEspecificaciones([]);
                }
            }
        } catch (e) {
            return toast.error('No se han podido listar las especificaciones, contacte a soporte de NativeCode')
        }
    }

    useEffect(() => {
        if (id) {
            listarEspecificaciones(id)
        }
    }, [id]);


    // FUNCION PARA INSERTAR ESPECIFICACION
    async function insertarEspecificacion(descripcionEspecificacion, id_subsubcategoria) {
        try {
            if (!id_subsubcategoria || !descripcionEspecificacion || descripcionEspecificacion === "") {
                return toast.error('Debe haber seleccionado al menos una sub-subcategoría y escribir el nombre de la especificación')
            }

            const res = await fetch(`${API}/especificacionProducto/insertarEspecificacion`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({descripcionEspecificacion, id_subsubcategoria}),
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error, intente más tarde');
            } else {
                const resultadoBackend = await res.json();

                if (resultadoBackend.message === true) {
                    await listarEspecificaciones(id)
                    setDescripcionEspecificacion("");
                    return toast.success('Especificación ingresada correctamente')
                } else if (resultadoBackend.message === "sindata") {
                    return toast.error('Debe seleccionar al menos una sub-subcategoría y no debe quedar el campo vacío');
                } else {
                    return toast.error('Ha ocurrido un problema, contacte a soporte');
                }
            }
        } catch (e) {
            return toast.error('Ha ocurrido un error, contacte a soporte de NativeCode')
        }
    }


    // FUNCION PARA SELECCIONAR UNA ESPECIFICACION PARA EDICION
    async function seleccionarEspecificacion(id_EspecificacionProducto) {
        try {
            if (!id_EspecificacionProducto) {
                return toast.error('Debe seleccionar una especificación para poder acceder a la edición.');
            }

            const res = await fetch(`${API}/especificacionProducto/seleccionarEspecificacionPorId`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_EspecificacionProducto})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error, contacte a soporte de NativeCode')
            } else {
                const resultadoData = await res.json();
                const especificacion = Array.isArray(resultadoData) ? resultadoData[0] : resultadoData;

                if (especificacion) {
                    setDescripcionEspecificacion(especificacion.descripcionEspecificacion);
                    setIdEspecificacionSeleccionada(especificacion.id_EspecificacionProducto);
                    return toast.success('Especificación seleccionada!')
                }
            }
        } catch (e) {
            return toast.error('Ha ocurrido un problema en el servidor, contacte a soporte de NativeCode')
        }
    }


    // FUNCION PARA ELIMINAR ESPECIFICACION
    async function eliminarEspecificacion(id_EspecificacionProducto) {
        try {
            if (!id_EspecificacionProducto) {
                return toast.error('Debe seleccionar una especificación para poder eliminarla.');
            }

            const res = await fetch(`${API}/especificacionProducto/eliminarEspecificacion`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_EspecificacionProducto})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error al eliminar la especificación, contacte a soporte de NativeCode')
            } else {
                const resultadoBackend = await res.json();

                if (resultadoBackend.message === true) {
                    await listarEspecificaciones(id);
                    limpiarFormulario();
                    return toast.success('Especificación eliminada!')
                } else if (resultadoBackend.message === false) {
                    return toast.error('No se ha podido eliminar la especificación, contacte a soporte de NativeCode');
                } else {
                    return toast.error('Ha ocurrido un error, contacte a soporte de NativeCode');
                }
            }
        } catch (e) {
            return toast.error('Ha ocurrido un problema en el servidor, contacte a soporte de NativeCode')
        }
    }


    // FUNCION PARA LIMPIAR FORMULARIO
    function limpiarFormulario() {
        setDescripcionEspecificacion("")
        setIdEspecificacionSeleccionada(0)
    }


    // FUNCION PARA ACTUALIZAR ESPECIFICACION
    async function actualizarEspecificacion(descripcionEspecificacion, id_subsubcategoria, id_EspecificacionProducto) {
        try {
            if (!descripcionEspecificacion || !id_EspecificacionProducto) {
                return toast.error('Debe completar todos los campos para actualizar la información (No es posible ingresar campos sin datos).')
            }

            const res = await fetch(`${API}/especificacionProducto/actualizarEspecificacion`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({descripcionEspecificacion, id_subsubcategoria, id_EspecificacionProducto})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un problema interno, contacte a soporte de NativeCode')
            } else {
                const resultadoBackend = await res.json();
                if (resultadoBackend.message === true) {
                    await listarEspecificaciones(id);
                    limpiarFormulario();
                    return toast.success('Especificación actualizada!')
                } else if (resultadoBackend.message === false) {
                    return toast.error('No fue posible actualizar la especificación')
                } else {
                    return toast.error('No fue posible actualizar la especificación, contacte a soporte de NativeCode')
                }
            }
        } catch (e) {
            return toast.error('Ha ocurrido un problema interno, contacte a soporte de NativeCode')
        }
    }


    return (
        <div className="min-h-screen bg-white">
            <ToasterClient/>

            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Gestión de Especificaciones de Producto
                        </h1>
                        <p className="text-sm text-slate-600">
                            Sub-Subcategoría principal:
                            <span className="ml-2 font-semibold text-slate-700">{nombreSubSubCategoriaPadre}</span>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Ingreso y edición
                                    <span className="ml-2 text-slate-700">(Especificación)</span>
                                </h2>
                                <p className="text-sm text-slate-600">
                                    Especificación seleccionada:
                                    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                                        {idEspecificacionSeleccionada}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <label className="text-sm font-medium text-slate-700">Nombre de la especificación</label>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
                                <ShadcnInput
                                    value={descripcionEspecificacion}
                                    onChange={(e)=> setDescripcionEspecificacion(e.target.value)}
                                    className="w-full border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:ring-0"
                                    placeholder="Ej: PIERNA, BRAZO, ESPALDA, etc."
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Escribe el nombre y luego ingrésala o actualízala si ya está seleccionada.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <div className="w-full sm:w-auto">
                                    <ShadcnButton
                                        nombre={'Ingresar Especificación'}
                                        funcion={()=> insertarEspecificacion(descripcionEspecificacion, id)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="w-full sm:w-auto">
                                    <ShadcnButton
                                        nombre={'Limpiar'}
                                        funcion={()=> limpiarFormulario()}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                {idEspecificacionSeleccionada > 0 && (
                                    <ShadcnButton
                                        nombre={'Actualizar Especificación'}
                                        funcion={()=> actualizarEspecificacion(descripcionEspecificacion, id, idEspecificacionSeleccionada)}
                                        className="w-full"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-1">
                        <h3 className="text-base font-semibold text-slate-900">Especificaciones de Producto</h3>
                        <p className="text-sm text-slate-600">
                            Lista asociada a
                            <span className="ml-2 font-semibold text-slate-700">{nombreSubSubCategoriaPadre}</span>
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <Table>
                            <TableCaption className="caption-bottom bg-slate-50 py-3 text-sm text-slate-600">
                                Lista de Especificaciones asociadas a sub-subcategoría
                                <span className='ml-2 font-bold text-slate-700'>{nombreSubSubCategoriaPadre}</span>
                            </TableCaption>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-slate-700">Especificación</TableHead>
                                    <TableHead className="text-slate-700">Acciones</TableHead>
                                    <TableHead className="text-slate-700"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listaEspecificaciones.length > 0 ? (
                                    listaEspecificaciones.map((especificacion) => (
                                        <TableRow
                                            key={especificacion.id_EspecificacionProducto}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <TableCell className="font-medium text-slate-900">
                                                {especificacion.descripcionEspecificacion}
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <ShadcnButton
                                                    nombre={'Seleccionar para Edición'}
                                                    funcion={()=> seleccionarEspecificacion(especificacion.id_EspecificacionProducto)}
                                                />
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <ShadcnButton
                                                    nombre={'Eliminar'}
                                                    funcion={()=> eliminarEspecificacion(especificacion.id_EspecificacionProducto)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                                            No hay especificaciones registradas para esta sub-subcategoría
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}