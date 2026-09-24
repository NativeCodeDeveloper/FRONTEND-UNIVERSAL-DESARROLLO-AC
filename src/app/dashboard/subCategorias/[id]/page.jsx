"use client";
import {useParams, useRouter} from "next/navigation";
import {useState,useEffect} from "react";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {toast} from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {Folder, FolderTree, Pencil, Plus, Trash2} from "lucide-react";

import {ShadcnInput} from "@/Componentes/shadcnInput";
import TutorialGuiadoSubcategorias from "@/Componentes/TutorialGuiadoSubcategorias";


export default function SubCategoria(){
    const API = process.env.NEXT_PUBLIC_API_URL;
    const {id} = useParams();
    const [descripcionCategoria, setDescripcionCategoria] = useState("");
    const [listaSubcategorias, setListaSubcategorias] = useState([]);
    const [descripcionSubcategoria, setDescripcionSubcategoria] = useState("");
    const [dataSeleccion, setDataSeleccion] = useState([]);
    const [id_subcategoria, setIdSubcategoria] = useState(0);
    const router = useRouter();


    function irSubSubCategoria(id) {
        router.push(`/dashboard/subsubcategoria/${id}`);
    }





// FUNCION PARA SELECCIONAR CATEGORIA ESPECIFICA SELECCIONADA
    async function seleccionarCategoriaEspecifica(id_categoriaProducto) {
        try {
            if (!id_categoriaProducto) {
                console.error({ message: "Id del categoria no proporcionado" });
                return null;
            }
            const res = await fetch(`${API}/categorias/${id_categoriaProducto}`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                cache: 'no-store',
            })
            if (!res.ok) {
                return toast.error('No fue posible seleccionar la categoria especifica contacte a soporte informatico de NativeCode');
            }
            const data = await res.json();
            setDescripcionCategoria(data.descripcionCategoria);

        }catch (e) {
            console.error(e);
        }
    }
    useEffect(() => {
        if (id) {
            seleccionarCategoriaEspecifica(id)
        }
    }, [id]);



// FUNCION PARA LISTAR  SUBCATEGORIAS ESPECIFICA SELECCIONADA POR CADA CATEGORIA
    async function listarSubcategorias(id_categoriaProducto){
        try {
            if (!id_categoriaProducto) {
                return toast.error("Debe seleccionar al menos una categoria, para que las subcategorias sean listadas." );
            }
            const res = await fetch(`${API}/subcategorias/seleccionarPorCategoria`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                mode: 'cors',
                body: JSON.stringify({id_categoriaProducto})
            })
            if (!res.ok) {
                return toast.error("Ha ocurrido un error con el servidor contacte a soporte de NativeCode" );
            }else {
                const resultadoData = await res.json();
                if (resultadoData.length > 0) {
                    setListaSubcategorias(resultadoData);
                }
            }
        }catch (e) {
            return toast.error('No se han podido listar las subcategorias contacte a soporte de NativeCode')
        }
    }
    useEffect(() => {
        if (id) {
            listarSubcategorias(id)
        }
    }, [id]);

    // FUNCION PARA INSERTAR SUBCATEGORIAS  POR CADA CATEGORIA
    async function insertarSubcategoria(descripcionCategoria, id_categoriaProducto){
        try {
            if (!id_categoriaProducto || !descripcionCategoria || descripcionSubcategoria ==="") {
                return toast.error('Debe haber seleccionado almenos una categoria y escribir el nombre de la subcategoria')
            }

            const imagenSubCategoria = 'CategoriaSinImagen'

            const res = await fetch(`${API}/subcategorias/insertarSubCategoria`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                mode: 'cors',
                body: JSON.stringify({descripcionCategoria, imagenSubCategoria, id_categoriaProducto}),
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error intente mas tarde');
            }else{

                const resultadoBackend = await res.json();

                if (resultadoBackend.message === "true") {
                    await listarSubcategorias(id)
                    setDescripcionSubcategoria("");
                    return toast.success('Subcategoria ingresada correctamente')

                }else if (resultadoBackend.message === "sindata") {
                    return toast.error('Debe seleccionar almenos una categoria y No debe quedar el campo vacio');
                }else {
                    return toast.error('Ha ocurrido un problema contacte a soporte');
                }
            }
        }catch (e) {
            return toast.error('Ha ocurrido un error contacte a soporte de NativeCode')
        }
    }



    //FUNCION PARA SELECCIONAR LA SUBCATEGORIA TOMANDO SU DESCRIPCION Y SU NUMERO DE ID
    async function seleccionarSubcategoria(id_subcategoria) {
        try {
            if (!id_subcategoria){
                return toast.error('Debe seleccionar una subcategoria para poder acceder a la edicion.');
            }

            const res = await fetch(`${API}/subcategorias/seleccionarSubCategoriaid`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                mode: 'cors',
                body: JSON.stringify({id_subcategoria})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error contacte a soporte de NativeCode')

            }else {

                const resultadoData = await res.json();

                const subcategoria = Array.isArray(resultadoData) ? resultadoData[0] : resultadoData;

                if (subcategoria) {
                    setDescripcionSubcategoria(subcategoria.descripcionCategoria);
                    setIdSubcategoria(subcategoria.id_subcategoria);
                    return toast.success('Subcategoria seleccionada!')
                }

            }
        }catch (e) {
            return toast.error('Ha ocurrido un problema en el servidor contacte a soporte de NativeCode')
        }
    }






    //FUNCION PARA SELECCIONAR LA SUBCATEGORIA TOMANDO SU DESCRIPCION Y SU NUMERO DE ID
    async function eliminarSubcategoria(id_subcategoria) {
        try {
            if (!id_subcategoria){
                return toast.error('Debe seleccionar una subcategoria para poder eliminarla.');
            }

            const res = await fetch(`${API}/subcategorias/eliminarSubCategoria`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                mode: 'cors',
                body: JSON.stringify({id_subcategoria})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error al eliminar la subcategoria contacte a soporte de NativeCode')

            }else {

                const resultadoBackend = await res.json();

                if (resultadoBackend.message === "true") {
                    await listarSubcategorias(id);
                    return toast.success('Subcategoria eliminada!')
                }else if (resultadoBackend.message === "false") {
                    return toast.error('No se ha podido eliminar la subcategoria contacte a soporte de NativeCode');
                }else{
                    return toast.error('Ha ocurrido un error, Contacte a soporte de NativeCode');
                }
            }
        }catch (e) {
            return toast.error('Ha ocurrido un problema en el servidor contacte a soporte de NativeCode')
        }
    }


    function limpiarFormulario() {
        setDescripcionSubcategoria("")
        setIdSubcategoria(0)
    }




    async function actualizarSubCategoria(descripcionCategoria,id_categoriaProducto,id_subcategoria) {
        try {
            if (!descripcionCategoria || !id_categoriaProducto || !id_subcategoria ) {
                return toast.error('Debe completar todos los campos para actualizar la informacion (No es posible ingresar campos sin datos).')
            }

            const res = await fetch(`${API}/subcategorias/actualizarSubCategoria`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                mode: 'cors',
                body: JSON.stringify({descripcionCategoria,id_categoriaProducto,id_subcategoria})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un problema interno contacte a soporte de NativeCode')
            }else{
                const resultadoBackend = await res.json();
                if (resultadoBackend.message === "true") {
                    await listarSubcategorias(id);
                    return toast.success('Subcategoria actualizada!')
                }else if (resultadoBackend.message === "false") {
                    return toast.error('No fue posible actualizar la subcategoria')
                }else{
                    return toast.error('No fue posible actualizar la subcategoria contacte a soporte de NativeCode')
                }
            }
        }catch (e) {
            return toast.error('Ha ocurrido un problema interno contacte a soporte de NativeCode')
        }
    }





    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Gestión de Subcategorías
                        </h1>
                        <p className="text-[13px] text-slate-500">
                            Categoría principal:
                            <span className="ml-2 font-semibold text-[#6E56CF]">{descripcionCategoria}</span>
                        </p>
                    </div>
                    <TutorialGuiadoSubcategorias
                        ariaLabel="Iniciar el tutorial guiado de subcategorías"
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                        claseIcono="flex size-4 shrink-0 items-center justify-center text-[#6E56CF]"
                    />
                </div>

                {/* Form */}
                <div data-tour="subcategorias-formulario" className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] text-white">
                                <Plus className="size-3.5"/>
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">
                                    {id_subcategoria > 0 ? "Editar subcategoría" : "Nueva subcategoría"}
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    Categoría principal: <span className="font-semibold text-[#6E56CF]">{descripcionCategoria}</span>
                                </p>
                            </div>
                        </div>
                        {id_subcategoria > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F0FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#6E56CF] ring-1 ring-[#DDD6FE]">
                                Editando ID: {id_subcategoria}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Nombre de la subcategoría</label>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 transition focus-within:border-[#6E56CF] focus-within:ring-2 focus-within:ring-violet-100">
                                <ShadcnInput
                                    value={descripcionSubcategoria}
                                    onChange={(e)=> setDescripcionSubcategoria(e.target.value)}
                                    placeholder="Ej: Ortodoncia, Insumos clínicos..."
                                    className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:ring-0"
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                Escribe el nombre y luego ingrésala o actualízala si ya está seleccionada.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            {id_subcategoria > 0 ? (
                                <ShadcnButton
                                    nombre={'Actualizar Subcategoria'}
                                    funcion={()=> actualizarSubCategoria(descripcionSubcategoria, id, id_subcategoria)}
                                    className="rounded-xl bg-black text-white shadow-sm hover:bg-slate-800"
                                />
                            ) : (
                                <ShadcnButton
                                    nombre={'Ingresar Subcategoria'}
                                    funcion={()=> insertarSubcategoria(descripcionSubcategoria, id)}
                                    className="rounded-xl bg-black text-white shadow-sm hover:bg-slate-800"
                                />
                            )}
                            <ShadcnButton
                                nombre={'Limpiar'}
                                funcion={()=> limpiarFormulario()}
                                className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div data-tour="subcategorias-listado" className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] text-white">
                                <FolderTree className="size-3.5"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Subcategorías</h3>
                                <p className="text-[11px] text-slate-400">
                                    Asociadas a <span className="font-semibold text-[#6E56CF]">{descripcionCategoria}</span>
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F3F0FF] px-2 text-[11px] font-bold text-[#6E56CF]">
                            {listaSubcategorias.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subcategoría</TableHead>
                                    <TableHead className="w-[340px] px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {listaSubcategorias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="px-5 py-14 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                                    <Folder className="size-5"/>
                                                </div>
                                                <p className="text-sm font-medium text-slate-400">No hay subcategorías registradas</p>
                                                <p className="text-xs text-slate-400/80">Crea la primera con el formulario superior.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    listaSubcategorias.map((subcategoria) => {
                                        const seleccionada = id_subcategoria === subcategoria.id_subcategoria;

                                        return (
                                            <TableRow
                                                key={subcategoria.id_subcategoria}
                                                className={`transition-colors duration-150 hover:bg-slate-50 ${seleccionada ? "bg-[#F3F0FF]/70" : ""}`}
                                            >
                                                <TableCell className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${seleccionada ? "bg-[#6E56CF] text-white" : "bg-[#F3F0FF] text-[#6E56CF]"}`}>
                                                            <Folder className="size-3.5"/>
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-800">{subcategoria.descripcionCategoria}</span>
                                                        {seleccionada && (
                                                            <span className="inline-flex items-center rounded-full bg-[#6E56CF] px-2 py-0.5 text-[10px] font-bold text-white">
                                                                Editando
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => seleccionarSubcategoria(subcategoria.id_subcategoria)}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] px-2.5 text-xs font-semibold text-[#6E56CF] transition hover:bg-[#EDE9FE] active:scale-[0.97]"
                                                            aria-label={`Editar ${subcategoria.descripcionCategoria}`}
                                                        >
                                                            <Pencil className="size-3.5"/>
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => irSubSubCategoria(subcategoria.id_subcategoria)}
                                                            data-tour="subcategorias-boton-subsub"
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.97]"
                                                            aria-label={`Ver sub-subcategorías de ${subcategoria.descripcionCategoria}`}
                                                        >
                                                            <FolderTree className="size-3.5"/>
                                                            Sub-Subcategorias
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarSubcategoria(subcategoria.id_subcategoria)}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-[0.97]"
                                                            aria-label={`Eliminar ${subcategoria.descripcionCategoria}`}
                                                        >
                                                            <Trash2 className="size-3.5"/>
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
