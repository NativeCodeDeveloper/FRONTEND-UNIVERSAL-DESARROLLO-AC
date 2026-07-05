"use client";
import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {toast} from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import {ButtonDinamic} from "@/Componentes/ButtonDinamic";
import {InfoButton} from "@/Componentes/InfoButton";


export default function Dashboard() {

    const [productos, setProductos] = useState([]);
    const [productoSeleccionado, setproductoSeleccionado] = useState(null);
    const [listadoCategorias, setlistadoCategorias] = useState([]);

    const [categoriaProductoSeleccion, setcategoriaProductoSeleccion] = useState("");
    const [tituloSimilar, settituloSimilar] = useState("");
    const [listaSubcategorias, setlistaSubcategorias] = useState([]);
    const [listaSubSubCategorias, setlistaSubSubCategorias] = useState([]);

    const [tituloProducto, settituloProducto] = useState("");
    const [descripcionProducto, setdescripcionProducto] = useState("");
    const [valorProducto, setvalorProducto] = useState("");
    const [categoriaProducto, setcategoriaProducto] = useState("");
    const [subcategorias, setsubcategorias] = useState("");
    const [subsubcategorias, setsubsubcategorias] = useState("");
    const [id_producto, setid_producto] = useState(null);

    // API INTERNA PARA HACER LOS FETCH DIRECTO AL BACKEND
    const API = process.env.NEXT_PUBLIC_API_URL;

    //FUNCION PARA INSERTAR NUEVOS PRODUCTOS
    async function insertarProducto(tituloProducto, descripcionProducto, valorProducto, categoriaProducto, subcategoria, subsubcategoria) {
        if (!tituloProducto || !descripcionProducto || !valorProducto || !categoriaProducto) {
            return toast.error("Completa los campos obligatorios: Categoría, Valor, Nombre y Descripción.");
        }
        try {
            const res = await fetch(`${API}/producto/insertarProducto`,{
                method: "POST",
                headers:{
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                mode: "cors",
                body: JSON.stringify({
                    tituloProducto,
                    descripcionProducto,
                    valorProducto,
                    valor_previo: 1,
                    categoriaProducto,
                    subcategoria: subcategoria || 0,
                    subsubcategoria: subsubcategoria || 0,
                    imagenProducto : `NO APLICA`,
                    imagenProductoSegunda : `NO APLICA`,
                    imagenProductoTercera : `NO APLICA`,
                    imagenProductoCuarta : `NO APLICA`,
                    especificacionProducto: 1
                })
            })

            if(!res.ok) {
                return toast.error(`No ha sido posible ingresar datos. Mala respuesta del servidor contacte a soporte.`);
            }
            const respuestaBackend = await res.json();
            if(respuestaBackend.message.includes("ok")) {
                await limpiarFormulario();
                return toast.success(`Servicio ingresado con exito`);
            }

        }catch (error) {
            return toast.error(`No ha sido posible ingresar datos. Mala respuesta del servidor contacte a soporte.`);
        }
    }

    //FUNCION PARA LISTAR SUB SUB CATEGORIAS
    async function listarSubSubcategorias(id_subcategoria) {
        try {
            const res = await fetch(`${API}/subsubcategorias/seleccionarPorSubSubCategoriaPorIdSubCategoria`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({id_subcategoria}),
                mode: "cors"
            })
            if(!res.ok){
                return;
            }
            const dataSubSubcategoria = await res.json();
            if (Array.isArray(dataSubSubcategoria)){
                setlistaSubSubCategorias(dataSubSubcategoria);
            }else {
                setlistaSubSubCategorias([])
            }

        }catch (e) {
            return toast.error('No ha sido posible listar las subcategorias contacte  a soporte de NativeCode: ERROR :' + e);
        }
    }
    useEffect(() => {
        if (subcategorias) {
            listarSubSubcategorias(subcategorias);
        } else {
            setlistaSubSubCategorias([]);
        }
        setsubsubcategorias("");
    },[subcategorias])

    //FUNCION PARA LISTAR SUB CATEGORIAS
    async function listarSubcategorias(id_categoriaProducto) {
        try {
            const res = await fetch(`${API}/subcategorias/seleccionarPorCategoria`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json"},
                body: JSON.stringify({id_categoriaProducto}),
                mode: "cors"
            })

            if(!res.ok){
                return;
            }

                const dataSubcategoria = await res.json();
                setlistaSubcategorias(dataSubcategoria);

        }catch (e) {
            return toast.error('No ha sido posible listar las subcategorias contacte  a soporte de NativeCode: ERROR :' + e);
        }
}
useEffect(() => {
    if (categoriaProducto) {
        listarSubcategorias(categoriaProducto);
    } else {
        setlistaSubcategorias([]);
    }
    setsubcategorias("");
    setsubsubcategorias("");
    setlistaSubSubCategorias([]);
},[categoriaProducto])

    //FUNCION PARA BUSCAR POR SIMILITUDES DE NOMBRE DE TITULO DE PRODUCTOS
    async function buscarSimilar(tituloSimilar) {
        let tituloProducto = tituloSimilar;

        try {
            const res = await fetch(`${API}/producto/buscarSimilar`,{
                method: "POST",
                headers:{Accept: "application/json",
                    "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({tituloProducto})
            });

            if(!res.ok) {
                return  toast.error("No se ha podido generar la busqueda por similitid contacte a soporte");
            }

            const dataProductosSimilares = await res.json();

            if (Array.isArray(dataProductosSimilares) && dataProductosSimilares.length > 0) {
                setProductos(dataProductosSimilares);
                return toast.success('Similitud encontrada!')
            }else{
                setProductos([]);
                return toast.success('Sin coincidencias por similitud de nombres')
            }
        }catch(err) {
            console.log(err);
            return toast.error('Ha ocurrido un problema al filtrar por similitud de nombre contacte a soporte informatico : ' + err.message);
        }
    }


    //FUNCION PARA FILTRAR PRODUCTOS SEGUN CATEGORIA
    async function filtrarPorCategoria(categoriaProductoSeleccion) {
        let categoriaProducto = categoriaProductoSeleccion;
        try {
            if(!categoriaProducto) return toast.error("Seleccione un categoria");
            const res = await fetch(`${API}/producto/categoriaProducto`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({categoriaProducto})
            })
            if (!res.ok){
                return toast.error("Problema al filtrar categorias contacte a Soporte");
            }
            const dataFiltrada = await res.json();
            setProductos(dataFiltrada);
        }catch (error) {
            return toast.error("Problema al filtrar categorias contacte a Soporte");
        }
    }


    // FUNCION PARA LLAMAR LISTA DE CATEGORIAS
    async function listarCategorias() {
        try {

            const res = await fetch(`${API}/categorias/seleccionarCategoria`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors",
                cache: "no-store",
            })
            if(!res.ok) {
                return toast.error('Problemas en listar categoria contacte a soporte');
            }

            const data = await res.json();
            setlistadoCategorias(data);

        }catch (error) {
            return toast.error('Problemas en listar categoria contacte a soporte');
        }
    }
    useEffect(() => {
        listarCategorias();
    }, []);


    //FUNCION PARA ACTUALIZAR PRODUCTO
    async function actualizarProducto(
        tituloProducto,
        descripcionProducto,
        valorProducto,
        categoriaProducto,
        subcategoria,
        subsubcategoria,
        id_producto) {
        try {
            if (!tituloProducto || !descripcionProducto || !valorProducto || !categoriaProducto || !id_producto) {
                return toast.error("Faltan Datos. Completa Categoría, Valor, Nombre y Descripción para actualizar.");
            }
            const res = await fetch(`${API}/producto/actualizarProducto`, {
                method: 'POST',
                headers: { Accept: "application/json",
                    'Content-Type': 'application/json' },
                mode: "cors",
                body: JSON.stringify({
                    tituloProducto,
                    descripcionProducto,
                    valorProducto,
                    valor_previo : 1,
                    categoriaProducto,
                    subcategoria: subcategoria || 0,
                    subsubcategoria: subsubcategoria || 0,
                    imagenProducto: "NO APLICA",
                    imagenProductoSegunda: "NO APLICA",
                    imagenProductoTercera: "NO APLICA",
                    imagenProductoCuarta: "NO APLICA",
                    especificacionProducto : 1,
                    id_producto,
                })
            })
            if (!res.ok) {
                return toast.error("No fue posible actualizar el producto contacte a soporte");
            }
            const resultado = await res.json();

            if (resultado.message === "ok") {
                await  limpiarFormulario();
                return toast.success("Producto actualizado !");
            }
        } catch (error) {
            return toast.error("No fue posible actualizar el producto contacte a soporte");
        }
    }


    async function limpiarFormulario() {
        await cargarProductos();
        setproductoSeleccionado(null);
        settituloProducto("");
        setdescripcionProducto("");
        setvalorProducto("");
        setcategoriaProducto("");
        setsubcategorias("");
        setsubsubcategorias("");
        setid_producto(null);
        toast.success("Formulario limpiado");
    }

    //FUNCION PARA ELIMINACION PRODUCTO
    async function eliminarProducto(id_producto) {
        try {
            if(!id_producto){
                console.error("No se estan recibiendo valores relacionados a id del producto en la funcion en fronend")
            }

            const res = await fetch(`${API}/producto/eliminarProducto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id_producto})
            })

            const respuesta = await res.json();

            if (!res.ok) {
                console.error("problema al eliminar producto", respuesta)
                return toast.error("No fue posible eliminar el producto / Contacte a Soporte de NativeCode.cl");
            }
            if (respuesta.message === 'ok') {
                await cargarProductos();
                return toast.success("Producto eliminado correctamente");

            } else {
                return toast.error("No se pudo eliminar el producto");
            }

        } catch (error) {
            console.error("problema al eliminar producto:", error)
            toast.error("Error al eliminar producto / Contacte a Soporte de NativeCode.cl ");
        }

    }

    //FUNCION PARA CARGAR PRODUCTO ESPECIFICO POR ID
    async function cargarProductoEspecifico(id_producto) {
        try {
            if (!id_producto) {
                console.error({ message: "Id del producto no proporcionado" });
                return null;
            }
            const res = await fetch(`${API}/producto/seleccionarProductoEspecifico_id`, {
                method: "POST",
                headers: { Accept: "application/json",
                'Content-Type': 'application/json' },
                cache: "no-store",
                body: JSON.stringify({id_producto})
            });
            if (!res.ok) {
                console.error({ message: "Error al cargar producto" });
                return null;
            }
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                settituloProducto(data[0].tituloProducto);
                setdescripcionProducto(data[0].descripcionProducto);
                setvalorProducto(data[0].valorProducto);
                setcategoriaProducto(data[0].categoriaProducto);
                setsubcategorias(data[0].subcategoria);
                setsubsubcategorias(data[0].subsubcategoria);
                setid_producto(data[0].id_producto);
                toast.success("Se ha Seleccionado un producto para edicion");
            }

        } catch (error) {
            console.error("Problema al cargar producto especifico");
        }
    }


    //FUNCION PARA CARGAR TODOS LOS PRODUCTOS
    async function cargarProductos() {
        try {
            const endpoint = `${API}/producto/seleccionarProducto`;

            const res = await fetch(endpoint, {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (!res.ok) {
                console.error("Error al Cargar productos:", res.status);
                setProductos([]);
                return [];
            }
            const data = await res.json();
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.rows)
                    ? data.rows
                    : [];
            setProductos(list);
            return list;
        } catch (error) {
            console.error(
                "Problema al hacer el fetch desde el frontend para traer las tarjetas",
                error
            );
            setProductos([]);
            return [];
        }
    }

    useEffect(() => {
        cargarProductos();
    }, []);


    //INICIO DEL COMPONENTE GRAFICO EN REACT
    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            {/* ── HEADER ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Presupuestos</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                            Gestion de Prestaciones y Servicios
                        </h1>
                        <p className="mt-1 max-w-xl text-[13px] text-slate-500">
                            Cree y administre los productos y servicios disponibles para presupuestos de tratamiento.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                            <p className="text-lg font-bold text-slate-900">{productos.length}</p>
                        </div>
                        <InfoButton informacion={"Los servicios, prestaciones y productos que ingrese en este modulo seran los que estaran disponibles para la generacion de presupuestos de tratamiento. Es fundamental que cada registro este completo para que el sistema funcione correctamente.\n\nTodos los campos son obligatorios: debe seleccionar la Categoria Principal, la Sub-Categoria, la Sub-Sub Categoria, ingresar el Nombre del servicio o producto, una Descripcion y el Valor. Si algun campo queda vacio, el sistema no permitira guardar el registro.\n\nPara editar un servicio o producto ya existente, busquelo en la tabla inferior utilizando los filtros por categoria o por nombre. Una vez localizado, presione el boton \"Editar\" en la fila correspondiente. Los datos del registro se cargaran automaticamente en el formulario superior, donde podra modificar la informacion que necesite. Al terminar, presione el boton \"Actualizar\" para guardar los cambios.\n\nPara ingresar un nuevo registro, simplemente complete todos los campos del formulario y presione \"Ingresar\". Si desea limpiar el formulario en cualquier momento, presione el boton \"Limpiar\"."}/>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">

                {/* ── FORMULARIO ── */}
                <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    {/* Cabecera del card */}
                    <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6E56CF]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5 text-white">
                                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">
                                {id_producto ? "Editar servicio" : "Nuevo servicio"}
                            </h2>
                            <p className="text-[11px] text-slate-400">Complete los campos requeridos</p>
                        </div>
                        {id_producto && (
                            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#F3F0FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#6E56CF] ring-1 ring-[#DDD6FE]">
                                Editando ID: {id_producto}
                            </span>
                        )}
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Categoria */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Categoria Principal
                                </label>
                                <select
                                    value={categoriaProducto}
                                    onChange={(e) => setcategoriaProducto(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 cursor-pointer placeholder:text-slate-400"
                                >
                                    <option value="" disabled>Seleccione una categoria</option>
                                    {listadoCategorias.map((categoria) => (
                                        <option key={categoria.id_categoriaProducto} value={categoria.id_categoriaProducto}>
                                            {categoria.descripcionCategoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subcategoria — opcional */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Sub-Categoria
                                    <span className="ml-1.5 normal-case font-normal text-slate-400">(opcional)</span>
                                </label>
                                <select
                                    value={subcategorias}
                                    onChange={(e) => setsubcategorias(e.target.value)}
                                    disabled={!categoriaProducto}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <option value="">Sin subcategoría</option>
                                    {listaSubcategorias.map((subcategoria) => (
                                        <option key={subcategoria.id_subcategoria} value={subcategoria.id_subcategoria}>
                                            {subcategoria.descripcionCategoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub-subcategoria — opcional, solo si hay subcategoria */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Sub-Sub Categoria
                                    <span className="ml-1.5 normal-case font-normal text-slate-400">(opcional)</span>
                                </label>
                                <select
                                    value={subsubcategorias}
                                    onChange={(e) => setsubsubcategorias(e.target.value)}
                                    disabled={!subcategorias}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <option value="">Sin sub-subcategoría</option>
                                    {listaSubSubCategorias.map((subsubcategoria) => (
                                        <option key={subsubcategoria.id_subsubcategoria} value={subsubcategoria.id_subsubcategoria}>
                                            {subsubcategoria.descripcionSubSubCategoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Valor */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Valor (sin puntos ni comas)
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 text-sm font-medium">$</span>
                                    <input
                                        type="number"
                                        value={valorProducto}
                                        onChange={(e) => setvalorProducto(e.target.value)}
                                        placeholder="0"
                                        className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Titulo - full width */}
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Nombre de la prestacion, producto o servicio
                                </label>
                                <input
                                    type="text"
                                    value={tituloProducto}
                                    onChange={(e) => settituloProducto(e.target.value)}
                                    placeholder="Ej: Limpieza facial profunda"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Descripcion - full width */}
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Descripcion
                                </label>
                                <textarea
                                    value={descripcionProducto}
                                    onChange={(e) => setdescripcionProducto(e.target.value)}
                                    rows={3}
                                    placeholder="Describa brevemente el servicio o producto..."
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition duration-200 resize-none focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Botones de accion */}
                        <div className="mt-6 flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => insertarProducto(tituloProducto, descripcionProducto, valorProducto, categoriaProducto, subcategorias, subsubcategorias)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#6E56CF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 active:scale-[0.98] disabled:opacity-60"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                </svg>
                                Ingresar
                            </button>

                            {id_producto && (
                                <button
                                    type="button"
                                    onClick={() => actualizarProducto(tituloProducto, descripcionProducto, valorProducto, categoriaProducto, subcategorias, subsubcategorias, id_producto)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#6E56CF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 active:scale-[0.98]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                    </svg>
                                    Actualizar
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => limpiarFormulario()}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-200 hover:border-slate-400 active:scale-[0.98]"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>


                {/* ── FILTROS ── */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Filtro por categoria */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex size-6 items-center justify-center rounded-md bg-[#EDE9FE]">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5 text-[#6E56CF]">
                                    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">Filtrar por categoria</h3>
                        </div>
                        <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 cursor-pointer"
                            value={categoriaProductoSeleccion}
                            onChange={(e) => {
                                const value = e.target.value;
                                setcategoriaProductoSeleccion(value);
                                filtrarPorCategoria(value);
                            }}
                        >
                            <option value="">-- Selecciona una categoria --</option>
                            {listadoCategorias.map((categoria) => (
                                <option key={categoria.id_categoriaProducto} value={categoria.id_categoriaProducto}>
                                    {categoria.descripcionCategoria}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Busqueda por similitud */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-50">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5 text-emerald-600">
                                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">Buscar por nombre</h3>
                        </div>
                        <div className="flex gap-2">
                            <input
                                onChange={(e) => settituloSimilar(e.target.value)}
                                type="text"
                                placeholder="Ej: limpieza, masaje..."
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition duration-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 hover:border-slate-300 placeholder:text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={() => buscarSimilar(tituloSimilar)}
                                className="inline-flex items-center justify-center rounded-lg bg-[#6E56CF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 active:scale-[0.98]"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>


                {/* ── TABLA ── */}
                <div className="mt-8 rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Cabecera de tabla */}
                    <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6E56CF]">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5 text-white">
                                    <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.25 2.25 0 0 1 1 14.75l-.01-9.5Zm8.26 9.52v-.625a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v.615c0 .414.336.75.75.75h5.373a.75.75 0 0 0 .627-.74Zm1.5 0a.75.75 0 0 0 .627.74h5.373a.75.75 0 0 0 .75-.75v-.615a.75.75 0 0 0-.75-.75H11.5a.75.75 0 0 0-.75.75v.625Zm6.75-5.995v-.625a.75.75 0 0 0-.75-.75H11.5a.75.75 0 0 0-.75.75v.625c0 .414.336.75.75.75h5.25a.75.75 0 0 0 .75-.75Zm-8.5 0v-.625a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v.625c0 .414.336.75.75.75H8.5a.75.75 0 0 0 .75-.75Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h2 className="text-sm font-semibold text-slate-800">Listado de prestaciones y servicios</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { cargarProductos(); toast.success("Listado actualizado"); }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDD6FE] bg-[#F3F0FF] px-3 py-1.5 text-xs font-semibold text-[#6E56CF] transition hover:bg-[#EDE9FE] active:scale-[0.97]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.033l.364.363a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.31H11.75a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 .75-.75V3.42a.75.75 0 0 0-1.5 0v2.033l-.364-.364A7 7 0 0 0 3.239 8.227a.75.75 0 0 0 1.449.39Z" clipRule="evenodd" />
                                </svg>
                                Recargar todo
                            </button>
                            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F3F0FF] px-2 text-[11px] font-bold text-[#6E56CF]">
                                {productos.length}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="text-sm">
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-3 px-4">Nombre</TableHead>
                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-3 px-4">Categoria</TableHead>
                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-3 px-4 hidden md:table-cell">Descripcion</TableHead>
                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-3 px-4 text-right">Valor</TableHead>
                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-3 px-4 text-center w-[140px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {productos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                                            No se encontraron servicios o productos
                                        </TableCell>
                                    </TableRow>
                                )}
                                {productos.map((producto) => (
                                    <TableRow
                                        key={producto.id_producto}
                                        className={`transition-colors duration-150 hover:bg-slate-50 cursor-pointer ${id_producto === producto.id_producto ? "bg-[#F3F0FF] border-l-2 border-l-[#6E56CF]" : ""}`}
                                    >
                                        <TableCell className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                                            {producto.tituloProducto}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-slate-500">
                                            {producto.descripcionCategoria}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-slate-500 max-w-[250px] truncate hidden md:table-cell">
                                            {producto.descripcionProducto}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap">
                                            $ {Number(producto.valorProducto).toLocaleString("es-CL")}
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => cargarProductoEspecifico(producto.id_producto)}
                                                    className="inline-flex items-center justify-center rounded-md border border-[#DDD6FE] bg-[#F3F0FF] px-2.5 py-1.5 text-xs font-semibold text-[#6E56CF] transition hover:bg-[#EDE9FE] active:scale-[0.97]"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarProducto(producto.id_producto)}
                                                    className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-[0.97]"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>
        </div>
    );
}
