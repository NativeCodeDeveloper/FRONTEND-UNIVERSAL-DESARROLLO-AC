"use client"
import {useEffect, useState} from "react";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {InfoButton} from "@/Componentes/InfoButton";

export default function PedidosCompra() {
    const [pedidos, setPedidos] = useState([]);
    const [comprador, setComprador] = useState("");

    const API = process.env.NEXT_PUBLIC_API_URL;

    const router = useRouter();

    const verDetalle = (id) =>{
        router.push(`/dashboard/pedidosDetalle?id=${id}`);
    }

    function formatearFecha(fecha) {
        const date = new Date(fecha);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1);
        const day = String(date.getDate());
        return `${year}-${month}-${day}`;
    }

    async function filtrarSimilitudNombre(nombre_comprador) {
        try {
            const res = await fetch(`${API}/pedidos/seleccionarPorComprador`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json",},
                body: JSON.stringify({nombre_comprador}),
                cache: "no-cache",
            })

            if (!res.ok) {
                return toast.error('Debe indicar un nombre para realizar el filtro (NO APELLIDO)');
            }else{
                const dataFiltradoPorNombre = await res.json();
                setPedidos(dataFiltradoPorNombre);
            }

        }catch (error) {
            console.log(error);
            return toast.error('Se ha Producido el siguiente error , contacte a soporte de NativeCode: '  + error);
        }
    }

    async function filtrarPorEstado(estado_pedido) {
        try {
            if(!estado_pedido){
                return toast.error('Debe seleccionar una categoria para realizar el filtro');
            }
            const res = await fetch(`${API}/pedidos/seleccionarPorEstados`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json",},
                body: JSON.stringify({estado_pedido}),
                mode: "cors"
            })
            if(!res.ok){
                return toast.error('Se ha Producido el siguiente error , contacte a soporte de NativeCode' );
            }else {
                const dataPedidosFiltrados = await res.json();
                setPedidos(dataPedidosFiltrados);
            }
        }catch(error) {
            console.log(error);
            return toast.error('Se ha Producido el siguiente error , contacte a soporte de NativeCode: '  + error);
        }
    }

    async function listarPedidos() {
        try {
            const resultado = await fetch(`${API}/pedidos/seleccionarPedidos`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            });
            if (!resultado.ok) {
                return toast('Ha ocurrido un problema al listar los pedidos contacte a soporte de NativeCode')
            }else{
                const data = await resultado.json();
                setPedidos(data);
            }
        }catch (error) {
            console.log(error);
            return toast.error('Se ha Producido el siguiente error , contacte a soporte de NativeCode: '  + error);
        }
    }

    useEffect(() => {
        listarPedidos();
    }, [])

    return(
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Panel de Administrador</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Compras <span className="text-[#6E56CF]">en Línea</span>
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Revisa, filtra y haz seguimiento al historial de pedidos generados en tu tienda.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-12 px-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                            <span className="text-[13px] font-bold text-slate-800 mt-0.5 leading-none">{pedidos.length} pedidos</span>
                        </div>
                        <InfoButton informacion={"En este apartado, usted puede visualizar los precios y valores de las transacciones que se van realizando en el sistema, junto con su estado según el flujo de entrega del producto o servicio.\nEl sistema contempla los siguientes estados:\n• PAGO SIN COMPLETAR: el cliente llegó a la pasarela de pago, pero la transacción no se concretó.\n• COMPRA REALIZADA: el pago fue realizado correctamente.\n• COMPRA ANULADA: proceso manual para anular la compra y mantener trazabilidad.\nPara ver el detalle de cada compra, seleccione el nombre del pedido en el listado."}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">

                    {/* ── Filtros ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Filtros de Búsqueda</h2>
                        </div>
                        <div className="p-4 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buscar por nombre del comprador</label>
                                    <div className="flex gap-3">
                                        <ShadcnInput
                                            value={comprador}
                                            onChange={e => setComprador(e.target.value)}
                                            placeholder="Busca por similitud en nombres (solo nombre, sin apellido)"
                                        />
                                        <button onClick={() => filtrarSimilitudNombre(comprador)}
                                            className="h-10 px-5 rounded-xl bg-[#6E56CF] text-white text-[12px] font-bold hover:bg-[#5b45bc] transition-all flex-shrink-0 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                            Buscar
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => listarPedidos()} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-all">Ver Todos</button>
                                    <button onClick={() => filtrarPorEstado(1)} className="h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-600 hover:text-white transition-all">Realizadas</button>
                                    <button onClick={() => filtrarPorEstado(4)} className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-bold hover:bg-rose-600 hover:text-white transition-all">Anuladas</button>
                                    <button onClick={() => filtrarPorEstado("0")} className="h-10 px-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-500 hover:text-white transition-all">Pago Pendiente</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabla de Pedidos ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Historial de Pedidos</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="whitespace-nowrap px-4 py-4 md:px-8 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">N° Pedido</th>
                                        <th className="whitespace-nowrap px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha</th>
                                        <th className="whitespace-nowrap px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Comprador</th>
                                        <th className="whitespace-nowrap px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Total Pagado</th>
                                        <th className="whitespace-nowrap px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pedidos.map((pedido) => (
                                        <tr key={pedido.id_pedido} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="whitespace-nowrap px-4 py-4 md:px-8 text-[12px] font-bold text-slate-500">#{pedido.id_pedido}</td>
                                            <td className="whitespace-nowrap px-4 py-4 text-[13px] text-slate-600">{formatearFecha(pedido.fecha_pedido)}</td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <Link href={`/dashboard/pedidosDetalle?id=${pedido.id_pedido}`}
                                                    className="text-[13px] font-bold text-[#6E56CF] hover:text-[#5b45bc] transition-colors">
                                                    {pedido.nombre_comprador + ' ' + pedido.apellidosComprador}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-[13px] font-bold text-slate-800 hidden md:table-cell">
                                                ${" "}{pedido.totalPagado}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-bold ${
                                                    pedido.estado_pedido === 1
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : pedido.estado_pedido === 0
                                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                                }`}>
                                                    {pedido.estado_pedido === 1 ? "Compra Realizada"
                                                        : pedido.estado_pedido === 0 ? "Pago Pendiente"
                                                            : "Anulado"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {pedidos.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-[13px] text-slate-400 italic">
                                                No se encontraron pedidos con los filtros aplicados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
