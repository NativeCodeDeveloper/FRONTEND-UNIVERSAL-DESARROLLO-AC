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
import {Folder, Layers, Pencil, Plus, Trash2} from "lucide-react";

import {ShadcnInput} from "@/Componentes/shadcnInput";
import TutorialGuiadoSubSubCategorias from "@/Componentes/TutorialGuiadoSubSubCategorias";


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
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            Gestión de Sub-Subcategorías
                        </h1>
                        <p className="text-[13px] text-slate-500">
                            Subcategoría principal:
                            <span className="ml-2 font-semibold text-[#6E56CF]">{nombreSubcategoriaPadre}</span>
                        </p>
                    </div>
                    <TutorialGuiadoSubSubCategorias
                        ariaLabel="Iniciar el tutorial guiado de sub-subcategorías"
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:border-[#EDE9FE] hover:bg-[#F3F0FF] hover:text-[#6E56CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2"
                        claseIcono="flex size-4 shrink-0 items-center justify-center text-[#6E56CF]"
                    />
                </div>

                {/* Form */}
                <div data-tour="subsub-formulario" className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] text-white">
                                <Plus className="size-3.5"/>
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">
                                    {idSubSubCategoriaSeleccionada > 0 ? "Editar sub-subcategoría" : "Nueva sub-subcategoría"}
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    Subcategoría principal: <span className="font-semibold text-[#6E56CF]">{nombreSubcategoriaPadre}</span>
                                </p>
                            </div>
                        </div>
                        {idSubSubCategoriaSeleccionada > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F0FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#6E56CF] ring-1 ring-[#DDD6FE]">
                                Editando ID: {idSubSubCategoriaSeleccionada}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Nombre de la sub-subcategoría</label>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 transition focus-within:border-[#6E56CF] focus-within:ring-2 focus-within:ring-violet-100">
                                <ShadcnInput
                                    value={descripcionSubSubCategoria}
                                    onChange={(e)=> setDescripcionSubSubCategorias(e.target.value)}
                                    className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:ring-0"
                                    placeholder="Ej: XS MUJER, M HOMBRE, etc."
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                Escribe el nombre y luego ingrésala o actualízala si ya está seleccionada.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            {idSubSubCategoriaSeleccionada > 0 ? (
                                <ShadcnButton
                                    nombre={'Actualizar Sub-Subcategoría'}
                                    funcion={()=> actualizarSubSubCategoria(descripcionSubSubCategoria, idSubSubCategoriaSeleccionada)}
                                    className="rounded-xl bg-black text-white shadow-sm hover:bg-slate-800"
                                />
                            ) : (
                                <ShadcnButton
                                    nombre={'Ingresar Sub-Subcategoría'}
                                    funcion={()=> insertarSubSubCategoria(descripcionSubSubCategoria, id)}
                                    className="rounded-xl bg-black text-white shadow-sm hover:bg-slate-800"
                                />
                            )}
                            <ShadcnButton
                                nombre={'Limpiar'}
                                funcion={()=> limpiar()}
                                className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div data-tour="subsub-listado" className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] text-white">
                                <Layers className="size-3.5"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Sub-Subcategorías</h3>
                                <p className="text-[11px] text-slate-400">
                                    Asociadas a <span className="font-semibold text-[#6E56CF]">{nombreSubcategoriaPadre}</span>
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F3F0FF] px-2 text-[11px] font-bold text-[#6E56CF]">
                            {listaSubSubCategorias.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sub-Subcategoría</TableHead>
                                    <TableHead className="w-[240px] px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {listaSubSubCategorias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="px-5 py-14 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                                    <Folder className="size-5"/>
                                                </div>
                                                <p className="text-sm font-medium text-slate-400">No hay sub-subcategorías registradas</p>
                                                <p className="text-xs text-slate-400/80">Crea la primera con el formulario superior.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    listaSubSubCategorias.map((subsubcategoria) => {
                                        const seleccionada = idSubSubCategoriaSeleccionada === subsubcategoria.id_subsubcategoria;

                                        return (
                                            <TableRow
                                                key={subsubcategoria.id_subsubcategoria}
                                                className={`transition-colors duration-150 hover:bg-slate-50 ${seleccionada ? "bg-[#F3F0FF]/70" : ""}`}
                                            >
                                                <TableCell className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${seleccionada ? "bg-[#6E56CF] text-white" : "bg-[#F3F0FF] text-[#6E56CF]"}`}>
                                                            <Folder className="size-3.5"/>
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-800">{subsubcategoria.descripcionSubSubCategoria}</span>
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
                                                            onClick={() => seleccionarSubSubCategoria(subsubcategoria.id_subsubcategoria)}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] px-2.5 text-xs font-semibold text-[#6E56CF] transition hover:bg-[#EDE9FE] active:scale-[0.97]"
                                                            aria-label={`Editar ${subsubcategoria.descripcionSubSubCategoria}`}
                                                        >
                                                            <Pencil className="size-3.5"/>
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarSubSubCategoria(subsubcategoria.id_subsubcategoria)}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-[0.97]"
                                                            aria-label={`Eliminar ${subsubcategoria.descripcionSubSubCategoria}`}
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
