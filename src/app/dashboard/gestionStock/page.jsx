"use client"
import {useState, useEffect} from "react";
import {toast} from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import Image from "next/image";

export default function GestionStock() {
    const API = process.env.NEXT_PUBLIC_API_URL;

    const [productos, setProductos] = useState([])
    const [nuevoStock, setNuevoStock] = useState({});
    const [productoSimilar, setProductoSimilar] = useState("");

    const CLOUDFLARE_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_HASH;
    const VARIANT_CARD = 'card';
    const VARIANT_FULL='full';
    const VARIANT_MINI = 'mini';


    function cfToSrc(imageId) {
        if (!imageId) return "";
        return `https://imagedelivery.net/${CLOUDFLARE_HASH}/${imageId}/${VARIANT_MINI}`;
    }

    async function buscarProductoSimilar(productoSimilar){
        let tituloProducto = productoSimilar;

        try {
            const res = await fetch(`${API}/producto/buscarSimilar`,{
                method: "POST",
                headers:{
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({tituloProducto}),
                mode: "cors"
            })

            if(!res.ok){
                return toast.error("No se han encontrado similitudes por problemas tecnicos porfavor contacte al equipo de soporte de NativeCode.cl");
            }else{

                const data = await res.json();
                if(Array.isArray(data)){
                    setProductos(data)
                }

                if(data.length > 0){
                    return toast.success("Se han encontrado similitudes")

                }else {
                    return toast.error("No Se han encontrado similitudes")
                }

            }

        }catch (error) {
            console.log(error);
            return toast.error("Se ha producido un problema contacte a soporte informatico de NativeCode.cl");
        }
    }





    async function actualizarStock(cantidadStock,id_producto) {
        try {
            const res = await fetch(`${API}/producto/actualizarStock`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({cantidadStock, id_producto}),
                mode: "cors"
            })
            if (!res.ok) {
                return toast.error("Error al Actualizar producto / Verifique que no hayan campos vacios");
            }else{
                const resultado = await res.json();
                if (resultado.message === "ok") {
                    await listarProductos();
                    return toast.success("Stock de producto actualizado con exito!");
                }
            }
        }catch(err) {
            console.log(err);
            return toast.error("Error al Actualizar producto / Contacte a soporte Informatico de NativeCode");

        }
    }










    async function listarProductos() {
        try {
            const res = await fetch(`${API}/producto/seleccionarProducto`,{
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            })
            if(!res.ok){
                return toast.error("No ha sido posible listar los productos para la edicion, contacte a soporte Informatico de NativeCode")
            }else {
                const dataProductos = await res.json();
                setProductos(dataProductos);
            }
        }catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        listarProductos();
    },[])




    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-10">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Administración de Tienda</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        Gestión de <span className="text-[#6E56CF]">Inventario</span>
                    </h1>
                    <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                        Administra el stock de tus productos de forma clara y profesional.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">

                    {/* ── Búsqueda ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Búsqueda de Productos</h2>
                        </div>
                        <div className="p-4 md:p-8">
                            <div className="flex flex-col md:flex-row items-stretch gap-3">
                                <input
                                    type="text"
                                    value={productoSimilar}
                                    onChange={(event) => setProductoSimilar(event.target.value)}
                                    placeholder="Buscar por título o palabra clave..."
                                    aria-label="Buscar similitudes de producto"
                                    className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-50 placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => buscarProductoSimilar(productoSimilar)}
                                    className="h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6E56CF] text-sm font-bold text-white hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.165 9.33l3.003 3.003a.75.75 0 101.06-1.06l-3.003-3.004A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
                                    </svg>
                                    Buscar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => listarProductos()}
                                    className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
                                >
                                    Ver Todos
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Listado de Productos ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Listado de Productos</h2>
                            <span className="h-5 px-2 rounded-full bg-violet-50 text-[#6E56CF] text-[10px] font-bold flex items-center">{productos.length}</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {productos.map((producto) => (
                                <div key={producto.id_producto} className="flex items-center gap-4 px-4 py-4 md:px-8 hover:bg-slate-50/50 transition-colors">
                                    <img src={cfToSrc(producto.imagenProducto)} alt="Producto" className="rounded-xl h-12 w-12 object-cover hidden md:block flex-shrink-0" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Producto</span>
                                        <span className="text-[13px] font-bold text-slate-800 truncate">{producto.tituloProducto}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 hidden sm:block">
                                            Stock: {producto.cantidadStock}
                                        </span>
                                        <input
                                            min="0"
                                            step="1"
                                            type="number"
                                            className="w-24 h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#6E56CF]"
                                            value={nuevoStock[producto.id_producto] ?? ""}
                                            onChange={(e) => setNuevoStock((prev) => ({ ...prev, [producto.id_producto]: e.target.value }))}
                                        />
                                        <button
                                            onClick={() => actualizarStock(Number(nuevoStock[producto.id_producto] ?? 0), producto.id_producto)}
                                            type="button"
                                            className="h-9 px-4 rounded-xl bg-[#6E56CF] text-white text-[12px] font-bold hover:bg-[#5b45bc] transition-all"
                                        >
                                            Actualizar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {productos.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-sm text-slate-400 italic">No se encontraron productos. Usa la búsqueda para encontrar un producto específico.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
