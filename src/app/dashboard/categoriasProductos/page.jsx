"use client"

import {useState, useEffect} from "react";
import ToasterClient from "@/Componentes/ToasterClient";
import { toast } from 'react-hot-toast';
import {useRouter} from "next/navigation";


export default function CategoriasProductos() {
    const [categorias, setCategorias] = useState([]);
    const [categoriaSelecionado, setCategoriaSelecionado] = useState(null);
    const [descripcionCategoria,setdescripcionCategoria] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const API = process.env.NEXT_PUBLIC_API_URL;

    const router = useRouter();

    function navegarSubcategoria(id) {
        router.push(`/dashboard/subCategorias/${id}`);
    }


//FUNCION PARA ACTUALIZAR CATEGORIA
async function actualizarCategoria(id_categoriaProducto, descripcionCategoria) {


try {
    setIsLoading(true);
    const res = await fetch(`${API}/categorias/actualizarCategoria`, {
        method: 'POST',
        headers: {Accept: 'application/json',
            'Content-Type': 'application/json'},
        body: JSON.stringify({id_categoriaProducto, descripcionCategoria}),
    })

    if(!res.ok){
        return toast.error('No fue posible actualziar la categoria seleccionada. Debe seleccionar la categoria que desea actualizar');
    }
    const data = await res.json();

    if(data.message === true){
        await seleccionarCategorias();
        setdescripcionCategoria("");
        setCategoriaSelecionado(null);
        return toast.success("Categoria actualizada correctamente");
    }else{
        toast.error("Categoria no se pudo actualizar, contacte a Soporte Informatico")
    }

}catch (error) {
    console.error(error);
    return toast.error("Ha ocurrido un error: contacte a Soporte Informatico: " + error.message);
} finally {
    setIsLoading(false);
}
    }



//FUNCION PARA ELIMINAR LA CATEGORIA DE MANERA LOGICA EN LA BASE DE DATOS
async function eliminarCategorias(id_categoriaProducto) {
    try {
        setIsLoading(true);
        const res = await fetch(`${API}/categorias/eliminarCategoria`, {
            method: "POST",
            headers: {Accept: "application/json",
            "Content-Type": "application/json"},
            body: JSON.stringify({id_categoriaProducto})
        })
        if(!res.ok) {
        return  toast.error("No fue posible eliminar el categoria");
        }
        const data = await res.json();
        if(data.message === true){
            setdescripcionCategoria("");
            setCategoriaSelecionado(null);
            await seleccionarCategorias();
            return toast.success("Categoria eliminada correctamente");
        }else {
            return toast.error("No fue posible eliminar la categoria");
        }
    }catch(err) {
        return toast.error("No fue posible eliminar la categoria contacte a soporte informatico de NativeCode");
    } finally {
        setIsLoading(false);
    }
}



//FUNCION PARA LA INSERCION DE NUEVAS CATEGORIAS
async function insertarCategoria(event) {
    try {
        event.preventDefault();
        setIsLoading(true);

        const res = await fetch(`${API}/categorias/insertarCategoria`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descripcionCategoria })
        });
        if (!res.ok) {
       return toast.error("Debe escribir el titulo de la categoria. No es posible insertar categorias en blanco.");
        }

        const data = await res.json();
        if (data) {
             setdescripcionCategoria("");
             await seleccionarCategorias();
             return toast.success("Categoria ingresada correctamente");
         }
     }catch (error) {
         console.log(error);
     } finally {
         setIsLoading(false);
     }
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
        setdescripcionCategoria(data.descripcionCategoria);
        setCategoriaSelecionado(data);
        return toast.success('Categoria seleccionada para edicion')
    }catch (e) {
        console.error(e);
    }

}



// FUNCION PARA SELECCIONAR LA LISTA COMPLETA DE CATEGORIAS DE PRODUCTOS
async function seleccionarCategorias() {
    try {
        setIsLoading(true);
        const res = await fetch(`${API}/categorias/seleccionarCategoria`, {
            method: "GET",
            headers: {Accept: "application/json"},
            cache: "no-store",
        })
        if(!res.ok) {
            console.error('No fue posible cargar la lista de categorias');
            setCategorias([]);
            return [];
        }
        const dataCategorias = await res.json();
        const listaCategorias = Array.isArray(dataCategorias) ? dataCategorias : [];
        setCategorias(listaCategorias);
        return listaCategorias;

    } catch (error) {
        console.error(error);
        setCategorias([]);
        return [];
    } finally {
        setIsLoading(false);
    }
}

useEffect(() => {
    seleccionarCategorias();
}, []);


return (
    <div className="min-h-screen bg-[#FAFAFB]">
        <ToasterClient />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

            {/* Header */}
            <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Administracion</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                    Gestion de Categorias
                </h1>
                <p className="mt-1 text-[13px] text-slate-500">Crea, edita y administra las categorias de tus productos.</p>
            </div>

            <div className="space-y-6">

                {/* Formulario de ingreso */}
                <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
                            {categoriaSelecionado ? "Editar Categoria" : "Nueva Categoria"}
                        </h2>
                    </div>

                    <div className="p-5 md:p-6">
                        <form onSubmit={insertarCategoria}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la categoria</label>
                                <input
                                    type="text"
                                    value={descripcionCategoria}
                                    onChange={(event) => setdescripcionCategoria(event.target.value)}
                                    placeholder="Ej: Tratamientos faciales, Insumos, Equipamiento..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {!categoriaSelecionado && (
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5B47B0] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                                        </svg>
                                        Ingresar Categoria
                                    </button>
                                )}

                                {categoriaSelecionado && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => actualizarCategoria(categoriaSelecionado.id_categoriaProducto, descripcionCategoria)}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#6E56CF] rounded-xl hover:bg-[#5B47B0] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                                            </svg>
                                            Actualizar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCategoriaSelecionado(null);
                                                setdescripcionCategoria("");
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all duration-150"
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Lista de categorias */}
                <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>
                            </svg>
                            <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Lista de Categorias</h2>
                        </div>
                        <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-bold bg-[#F3F0FF] text-[#6E56CF]">
                            {categorias.length}
                        </span>
                    </div>

                    <div className="p-5 md:p-6">
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="animate-pulse flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3.5"
                                    >
                                        <div className="size-48 rounded bg-slate-200" />
                                        <div className="flex gap-2">
                                            <div className="h-8 w-20 rounded-lg bg-slate-200" />
                                            <div className="h-8 w-20 rounded-lg bg-slate-200" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : categorias.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                                </svg>
                                <p className="text-sm text-slate-500">No hay categorias registradas todavia.</p>
                                <p className="text-xs text-slate-400 mt-1">Crea una nueva categoria usando el formulario superior.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                                {categorias.map((categoria) => (
                                    <div
                                        className={
                                            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3.5 transition-all duration-150 " +
                                            (categoriaSelecionado?.id_categoriaProducto === categoria.id_categoriaProducto
                                                ? "border-[#DDD6FE] bg-[#F3F0FF] shadow-sm ring-1 ring-[#DDD6FE]"
                                                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm")
                                        }
                                        key={categoria.id_categoriaProducto}
                                    >
                                        <h3 className="text-sm font-medium text-slate-800 truncate">{categoria.descripcionCategoria}</h3>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] px-3 py-1.5 text-xs font-semibold text-[#6E56CF] hover:bg-[#EDE9FE] focus:outline-none focus:ring-2 focus:ring-violet-100 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                                                onClick={() => seleccionarCategoriaEspecifica(categoria.id_categoriaProducto)}
                                                disabled={isLoading}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                                                </svg>
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                                                onClick={() => eliminarCategorias(categoria.id_categoriaProducto)}
                                                disabled={isLoading}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                                                </svg>
                                                Eliminar
                                            </button>

                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                                                onClick={() => navegarSubcategoria(categoria.id_categoriaProducto)}
                                                disabled={isLoading}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
                                                </svg>
                                                Subcategoria
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
);
}
