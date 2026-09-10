"use client";
import {useParams, useRouter} from "next/navigation";
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


export default function SubSubCategoria(){
    const API = process.env.NEXT_PUBLIC_API_URL;
    const {id} = useParams();
    const router = useRouter();

    function irEspecificacion(id_subsubcategoria) {
        router.push(`/dashboard/EspecificacionProductos/${id_subsubcategoria}`);
    }

    // Estados para la subcategoría padre
    const [nombreSubcategoriaPadre, setNombreSubcategoriaPadre] = useState("");
    // Estados para las subsubcategorías
    const [listaSubSubCategorias, setListaSubSubCategorias] = useState([]);
    const [idSubSubCategoriaSeleccionada, setIdSubSubCategoriaSeleccionada] = useState(null);

    const [descripcionSubSubCategoria,setDescripcionSubSubCategorias] = useState("");






    // FUNCION PARA SELECCIONAR SUBCATEGORIA PADRE ESPECIFICA
    async function obtenerSubcategoriaPadre(id_subcategoria) {
        try {
            if (!id_subcategoria) {
                console.error({ message: "Id de subcategoría no proporcionado" });
                return null;
            }
            const res = await fetch(`${API}/subcategorias/seleccionarSubCategoriaid`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_subcategoria})
            })
            if (!res.ok) {
                return toast.error('No fue posible seleccionar la subcategoría, contacte a soporte de NativeCode');
            }
            const data = await res.json();
            const subcategoria = Array.isArray(data) ? data[0] : data;
            if (subcategoria) {
                setNombreSubcategoriaPadre(subcategoria.descripcionCategoria);
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        if (id) {
            obtenerSubcategoriaPadre(id)
        }
    }, [id]);


    // FUNCION PARA LISTAR SUBSUBCATEGORIAS POR ID DE SUBCATEGORIA
    async function listarSubSubCategorias(id_subcategoria) {
        try {
            if (!id_subcategoria) {
                return toast.error("Debe seleccionar al menos una subcategoría para listar las sub-subcategorías.");
            }
            const res = await fetch(`${API}/subsubcategorias/seleccionarPorSubSubCategoriaPorIdSubCategoria`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_subcategoria})
            })
            if (!res.ok) {
                return toast.error("Ha ocurrido un error con el servidor, contacte a soporte de NativeCode");
            } else {
                const resultadoData = await res.json();
                if (resultadoData.length > 0) {
                    setListaSubSubCategorias(resultadoData);
                } else {
                    setListaSubSubCategorias([]);
                }
            }
        } catch (e) {
            return toast.error('No se han podido listar las sub-subcategorías, contacte a soporte de NativeCode')
        }
    }

    useEffect(() => {
        if (id) {
            listarSubSubCategorias(id)
        }
    }, [id]);





    // FUNCION PARA INSERTAR SUBSUBCATEGORIA
    async function insertarSubSubCategoria(descripcionSubSubCategoria, id_subcategoria) {

        try {
            if (!id_subcategoria || !descripcionSubSubCategoria || descripcionSubSubCategoria === "") {
                return toast.error('Debe haber seleccionado al menos una subcategoría y escribir el nombre de la sub-subcategoría')
            }

            const res = await fetch(`${API}/subsubcategorias/insertarSubSubCategoria`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({
                    descripcionSubSubCategoria,
                    imagenReferencial : "NO USA IMAGEN",
                    id_subcategoria}),
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error, intente más tarde');
            }

            const resultadoBackend = await res.json();

            if (resultadoBackend.message === true || resultadoBackend.message.includes(`true`)) {
                await limpiar()
                return toast.success(`Se ha ingresado una nueva Sub Sub Categoria`);

            }else{
                return toast.error('Ha ocurrido un error, contacte a soporte de NativeCode')
            }

        } catch (e) {
            return toast.error('Ha ocurrido un error, contacte a soporte de NativeCode')
        }
    }

    //FUNCION  PARA LIMPIAR LO SELECCIONADO
    async function limpiar() {
        await listarSubSubCategorias(id);
        setDescripcionSubSubCategorias("");
    }

    // FUNCION PARA SELECCIONAR UNA SUBSUBCATEGORIA PARA EDICION
    async function seleccionarSubSubCategoria(id_subsubcategoria) {
        try {
            if (!id_subsubcategoria) {
                return toast.error('Debe seleccionar una sub-subcategoría para poder acceder a la edición.');
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
                return toast.error('Ha ocurrido un error, contacte a soporte de NativeCode')
            }

            const resultadoBackend = await res.json();
            if (Array.isArray(resultadoBackend) && resultadoBackend.length > 0) {
                setDescripcionSubSubCategorias(resultadoBackend[0].descripcionSubSubCategoria);
                setIdSubSubCategoriaSeleccionada(resultadoBackend[0].id_subsubcategoria);
                return toast.success(`Sub-Sub categoria Seleccionada`);
            }else{
                setDescripcionSubSubCategorias("");
            }

        } catch (e) {
            return toast.error('Ha ocurrido un problema en el servidor, contacte a soporte de NativeCode')
        }
    }


    // FUNCION PARA ELIMINAR SUBSUBCATEGORIA
    async function eliminarSubSubCategoria(id_subsubcategoria) {
        try {
            if (!id_subsubcategoria) {
                return toast.error('Debe seleccionar una sub-subcategoría para poder eliminarla.');
            }
            const res = await fetch(`${API}/subsubcategorias/eliminarSubSubCategoria`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({id_subsubcategoria})
            })
            if (!res.ok) {
                return toast.error('Ha ocurrido un error al eliminar la sub-subcategoría, contacte a soporte de NativeCode')
            }
            const respuestaBackend = await res.json();
            if(respuestaBackend.message === true || respuestaBackend.message.includes(`true`)) {
                await limpiar();
                return toast.success(`Sub-Sub categoria Eliminada!`);
            }else{
                return toast.error('Ha ocurrido un problema en el servidor, contacte a soporte de NativeCode')
            }
        } catch (e) {
            return toast.error('Ha ocurrido un problema en el servidor, contacte a soporte de NativeCode')
        }
    }



    // FUNCION PARA ACTUALIZAR SUBSUBCATEGORIA
    async function actualizarSubSubCategoria(descripcionSubSubCategoria, id_subsubcategoria) {
        try {
            if (!descripcionSubSubCategoria || !id_subsubcategoria) {
                return toast.error('Debe completar todos los campos para actualizar la información (No es posible ingresar campos sin datos).')
            }

            const res = await fetch(`${API}/subsubcategorias/actualizarSubSubCategoria`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({
                    descripcionSubSubCategoria,
                    imagenReferencial : `SIN IMAGEN REQUERIDA`
                    , id_subsubcategoria})
            })
            if (!res.ok) {
                return toast.error('Ha ocurrido un problema interno, contacte a soporte de NativeCode');
            }
                const resultadoBackend = await res.json();
            if(resultadoBackend.message === true || resultadoBackend.message.includes(`true`)) {
                await limpiar();
                return toast.success(`Sub-Sub categoria Actualizada!`);
            }else{
                return toast.error('Ha ocurrido un problema interno, contacte a soporte de NativeCode')
            }
        } catch (e) {
            return toast.error('Ha ocurrido un problema interno, contacte a soporte de NativeCode')
        }
    }




    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Gestión de Sub-Subcategorías
                        </h1>
                        <p className="text-[13px] text-slate-500">
                            Subcategoría principal:
                            <span className="ml-2 font-semibold text-[#6E56CF]">{nombreSubcategoriaPadre}</span>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Ingreso y edición
                                    <span className="ml-2 text-[#6E56CF]">(Sub-Subcategoría)</span>
                                </h2>
                                <p className="text-[13px] text-slate-500">
                                    Sub-Subcategoría seleccionada:
                                    <span className="ml-2 inline-flex items-center rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold text-[#6E56CF] ring-1 ring-inset ring-[#DDD6FE]">
                                        {idSubSubCategoriaSeleccionada}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <label className="text-sm font-medium text-slate-700">Nombre de sub-subcategoría</label>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-[#6E56CF] focus-within:ring-2 focus-within:ring-violet-100">
                                <ShadcnInput
                                    value={descripcionSubSubCategoria}
                                    onChange={(e)=> setDescripcionSubSubCategorias(e.target.value)}
                                    className="w-full border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:ring-0"
                                    placeholder="Ej: XS MUJER, M HOMBRE, etc."
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Escribe el nombre y luego ingrésala o actualízala si ya está seleccionada.
                            </p>
                        </div>






                        <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <div className="w-full sm:w-auto">
                                    <ShadcnButton
                                        nombre={'Ingresar Sub-Subcategoría'}

                                        funcion={()=>insertarSubSubCategoria(descripcionSubSubCategoria, id)}

                                        className="w-full rounded-xl bg-black text-white shadow-sm hover:bg-slate-800"
                                    />
                                </div>


                                <div className="w-full sm:w-auto">
                                    <ShadcnButton
                                        nombre={'Limpiar'}
                                        funcion={()=> limpiar()}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                {idSubSubCategoriaSeleccionada > 0 && (
                                    <ShadcnButton
                                        nombre={'Actualizar Sub-Subcategoría'}
                                        funcion={()=> actualizarSubSubCategoria(descripcionSubSubCategoria, idSubSubCategoriaSeleccionada)}
                                        className="w-full rounded-xl bg-black text-white shadow-sm hover:bg-slate-800"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-1">
                        <h3 className="text-base font-semibold text-slate-900">Sub-Subcategorías</h3>
                        <p className="text-[13px] text-slate-500">
                            Lista asociada a
                            <span className="ml-2 font-semibold text-[#6E56CF]">{nombreSubcategoriaPadre}</span>
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <Table>
                            <TableCaption className="caption-bottom bg-slate-50 py-3 text-[13px] text-slate-500">
                                Lista de Sub-Subcategorías asociadas a subcategoría
                                <span className='ml-2 font-bold text-[#6E56CF]'>{nombreSubcategoriaPadre}</span>
                            </TableCaption>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-slate-400">Sub-Subcategoría</TableHead>
                                    <TableHead className="text-slate-400">Acciones</TableHead>
                                    <TableHead className="text-slate-400"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listaSubSubCategorias.length > 0 ? (
                                    listaSubSubCategorias.map((subsubcategoria) => (
                                        <TableRow
                                            key={subsubcategoria.id_subsubcategoria}
                                            className="transition-colors hover:bg-slate-50"
                                        >



                                            <TableCell className="font-medium text-slate-900">
                                                {subsubcategoria.descripcionSubSubCategoria}
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <ShadcnButton
                                                    nombre={'Seleccionar para Edición'}
                                                    funcion={()=> seleccionarSubSubCategoria(subsubcategoria.id_subsubcategoria)}
                                                    className="rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] text-[#6E56CF] hover:bg-[#EDE9FE]"
                                                />
                                            </TableCell>





                                            <TableCell className="py-3">
                                                <ShadcnButton
                                                    nombre={'Eliminar'}
                                                    funcion={()=> eliminarSubSubCategoria(subsubcategoria.id_subsubcategoria)}
                                                    className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                                            No hay sub-subcategorías registradas para esta subcategoría
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
