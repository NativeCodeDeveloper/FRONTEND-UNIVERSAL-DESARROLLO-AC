'use client'
import {useSearchParams} from "next/navigation";
import ToasterClient from "@/Componentes/ToasterClient";
import {toast} from "react-hot-toast";
import { useEffect, useState, Suspense } from "react";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {ShadcnSelect} from "@/Componentes/shadcnSelect";
import {ShadcnTable} from "@/Componentes/shadcnTable";
import formatearFecha from "@/FuncionesTranversales/funcionesTranversales.js"
import Link from "next/link";
import {Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {Textarea} from "@/components/ui/textarea";
import {InfoButton} from "@/Componentes/InfoButton";


function PedidoDetalleInner(){
    const searchParams = useSearchParams();
    const id_pedido = searchParams.get("id");
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [detalleComprador, setDetalleComprador] = useState([]);
    const [nuevoestado, setnuevoEstado] = useState("");



    const [asunto, setAsunto] = useState("");
    const [email, setEmail] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [isEnviandoSeguimiento, setIsEnviandoSeguimiento] = useState(false);


    async function seguimientoCliente(asunto,email,mensaje){
        try {
            if (!asunto || !email || !mensaje) {
                toast.error('Para hacer el seguimiento debe llenar todos los campos de texto');
                return false;
            }

            const res = await fetch(`${API}/correo/seguimiento`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({asunto,email,mensaje}),
                cache: "no-cache"
            })

            if(!res.ok){
                toast.error('No se pudo enviar el correo de seguimiento (respuesta del servidor no válida)');
                return false;
            }

            const respuestaBackend = await res.json();
            return respuestaBackend.message === true;

        }catch(error){
            console.log(error);
            toast.error('No se pudo enviar el correo de seguimiento: ' + (error?.message ?? 'Error desconocido'));
            return false;
        }
    }

    async function handleEnviarSeguimiento() {
        if (isEnviandoSeguimiento) return;
        try {
            setIsEnviandoSeguimiento(true);

            const ok = await seguimientoCliente(asunto, email, mensaje);

            if (ok) {
                toast.success("Correo de seguimiento enviado correctamente");
            } else {
                toast.error("No se pudo enviar el correo de seguimiento");
            }

        } finally {
            setIsEnviandoSeguimiento(false);
        }
    }


    async function obtenerDetallesComprador(id_pedido){
        try {
            const res = await fetch(`${API}/pedidos/seleccionarPorid`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json",},
                body: JSON.stringify({ id_pedido }),
                mode: "cors"
            });

            if(!res.ok){
                return toast.error('Ha ocurrido un problema porfavor contacte a soporte de NativeCode');
            }else{

                const dataDetalles = await res.json();
                setDetalleComprador(dataDetalles);
            }
        }catch (error) {
            console.log(error);
            return toast.error('Ha ocurrido un problema porfavor contacte a soporte de NativeCode'  + error.message);

        }
    }

    useEffect(() => {
        if (id_pedido) {
            obtenerDetallesComprador(id_pedido);
        }
    }, [id_pedido]);



    async function cambiarEstado(id_pedido, nuevoestado){
        if(!nuevoestado || !id_pedido){
            return toast.error("viene vacio un dato")
        }

        let estado_pedido;
        const estadoNormalizado = String(nuevoestado).trim().toUpperCase();

        if (estadoNormalizado.includes("PAGO SIN COMPLETAR") || estadoNormalizado.includes("PAGO PENDIENTE") || estadoNormalizado.includes("PENDIENTE PAGO")) {
            estado_pedido = '0';
        } else if (estadoNormalizado.includes("COMPRA REALIZADA") || estadoNormalizado.includes("COMPLETADO") || estadoNormalizado.includes("CONFIRMADO")) {
            estado_pedido = 1;
        } else if (estadoNormalizado.includes("COMPRA ANULADA") || estadoNormalizado.includes("ANULADO")) {
            estado_pedido = 4;
        } else {
            return toast.error("Estado no reconocido: " + nuevoestado);
        }

        try {

            const res = await fetch(`${API}/pedidos/cambioEstado`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json",},
                mode: "cors",
                body: JSON.stringify({estado_pedido,id_pedido}),
            })

            if(!res.ok){
                return toast.error("PROBLEMA EN EN resok")
            }else {

                const respuestaDelController = await res.json();

                if(respuestaDelController.message === true){
                    await obtenerDetallesComprador(id_pedido)
                    return toast.success("Se ha actualizado el estado del Pedido!");
                }else {
                    return toast.error("No se ha podido actualizar el estado del Pedido!, Contacte al Administrador del Sistema");
                }
            }
        }catch (error) {
            console.log(error);
            return toast.error('Ha ocurrido un problema porfavor contacte a soporte de NativeCode'  + error.message);
        }
    }




    const [listaDetallada, setListaDetallada] = useState([]);

    async function obtenerListaDetallada(id_pedido){
        try {
            if(!id_pedido){
                return toast.error("Ha ocurrido un error en cargar el ID del pedido porfavor  contacte a soporte de NativeCode");
            }else{

                const res = await fetch(`${API}/pedidos/seleccionarDetalle`, {
                    method: "POST",
                    headers: {Accept: "application/json",
                        "Content-Type": "application/json",},
                    mode: "cors",
                    body: JSON.stringify({id_pedido}),
                })
                if(!res.ok){
                    return toast.error("problema en servidor porfavor contacte a soporte de NativeCode");
                }else{
                    const dataPedidoDetalle = await res.json();
                    setListaDetallada(dataPedidoDetalle);
                }
            }
        }catch (error) {
            console.log(error);
            return toast.error('Ha ocurrido un problema porfavor contacte a soporte de NativeCode'  + error.message);
        }
    }

    useEffect(() => {
        if (id_pedido) {
            obtenerListaDetallada(id_pedido);
        }
    }, [id_pedido]);

    const pedidoDetalle = listaDetallada || [{id_producto: 0, tituloProducto: "SIN DATO", cantidad: 0, precio_unitario: 0}]

    const totalCompra = pedidoDetalle.reduce((acc, pedido) => acc + (pedido.precio_unitario * pedido.cantidad), 0);


    useEffect(() => {
        if (detalleComprador.length > 0) {
            setEmail(detalleComprador[0].email_Comprador);
        }
    }, [detalleComprador]);


    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient />
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Panel de Administrador</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Detalle del <span className="text-[#6E56CF]">Pedido</span>
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Revisa la información del cliente y el estado del pedido desde un solo lugar.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <InfoButton informacion={"En este apartado, usted puede cambiar el estado del pedido mediante el botón 'Cambiar estado'. Debajo de este botón se muestra el estado actual de la compra.\n\nAdemás, puede enviar correos de seguimiento directamente al cliente para recuperar carritos perdidos.\n\nAl final de la pantalla, encontrará el listado detallado de los productos o servicios que el cliente agregó al carrito de compras."}/>
                        <Link href={"/dashboard/pedidosCompras"}
                            className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                            Volver al Listado
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">

                    {/* ── Cambio de Estado ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Estado del Pedido</h2>
                            {detalleComprador.length > 0 && (
                                <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-bold ${
                                    detalleComprador[0].estado_pedido === 1
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : detalleComprador[0].estado_pedido === 4
                                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}>
                                    {({1: "Compra Realizada", 4: "Compra Anulada"})[detalleComprador[0].estado_pedido] ?? "Pago Sin Completar"}
                                </span>
                            )}
                        </div>
                        <div className="p-4 md:p-8">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <div className="flex-1">
                                    <ShadcnSelect
                                        nombreDefault={"Seleccionar nuevo estado"}
                                        value1={"COMPRA REALIZADA"}
                                        value3={"PAGO SIN COMPLETAR"}
                                        value5={"COMPRA ANULADA"}
                                        onChange={(value) => setnuevoEstado(value)}
                                    />
                                </div>
                                <button onClick={() => cambiarEstado(id_pedido, nuevoestado)}
                                    className="h-11 px-6 rounded-xl bg-[#6E56CF] text-white text-[12px] font-bold hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100 flex-shrink-0">
                                    Cambiar Estado
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Datos del Comprador ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Datos del Comprador</h2>
                        </div>
                        <div className="p-4 md:p-8">
                            {detalleComprador.map(c => (
                                <div key={c.id_pedido} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</span>
                                            <p className="text-[14px] font-bold text-slate-800 mt-0.5">{c.nombre_comprador} {c.apellidosComprador}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RUT</span>
                                            <p className="text-[13px] font-mono text-slate-700 mt-0.5">{c.identificacion_comprador}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</span>
                                            <p className="text-[13px] text-slate-700 mt-0.5">{c.telefono_comprador}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                                            <p className="text-[13px] text-slate-700 mt-0.5">{c.email_Comprador}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha del Pedido</span>
                                            <p className="text-[13px] font-bold text-[#6E56CF] mt-0.5">{formatearFecha(c.fecha_pedido)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección de Despacho</span>
                                            <p className="text-[13px] text-slate-700 mt-0.5">{c.direccion_despacho}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comuna</span>
                                            <p className="text-[13px] text-slate-700 mt-0.5">{c.comuna}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Región / País</span>
                                            <p className="text-[13px] text-slate-700 mt-0.5">{c.regionPais}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comentarios</span>
                                            <p className="text-[13px] text-slate-500 italic mt-0.5">{c.comentarios || "Sin comentarios"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Seguimiento por Correo ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-violet-50 text-[#6E56CF] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Seguimiento de Cliente</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-5">
                            <p className="text-[13px] text-slate-500">Envía un correo personalizado al cliente sobre su pedido para recuperar carritos perdidos o confirmar el estado.</p>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asunto del correo</label>
                                <ShadcnInput id="asunto" value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Ej: Actualización de tu pedido #123" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
                                <Textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} id="mensajeCorreo"
                                    placeholder="Escribe aquí el mensaje para el cliente..."
                                    className="min-h-[140px] resize-none rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-50" />
                            </div>
                            <button
                                onClick={handleEnviarSeguimiento}
                                disabled={isEnviandoSeguimiento}
                                className={`h-11 px-6 rounded-xl bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 ${isEnviandoSeguimiento ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                                {isEnviandoSeguimiento ? "Enviando..." : "Enviar Seguimiento"}
                            </button>
                        </div>
                    </div>

                    {/* ── Productos del Pedido ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Productos del Pedido</h2>
                            <span className="h-5 px-2 rounded-full bg-violet-50 text-[#6E56CF] text-[10px] font-bold flex items-center">{pedidoDetalle.length} productos</span>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                        <TableHead className="px-4 py-4 md:px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Producto</TableHead>
                                        <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cantidad</TableHead>
                                        <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pedidoDetalle.map((pedido) => (
                                        <TableRow key={pedido.id_producto} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <TableCell className="px-4 py-4 md:px-8 text-[13px] font-bold text-slate-800">{pedido.tituloProducto}</TableCell>
                                            <TableCell className="px-4 py-4 text-[13px] text-slate-600">{pedido.cantidad}</TableCell>
                                            <TableCell className="px-4 py-4 text-[13px] font-bold text-slate-800 text-right">${pedido.precio_unitario * pedido.cantidad}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-slate-50/50">
                                        <TableCell colSpan={2} className="px-4 py-4 md:px-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest">Total Compra</TableCell>
                                        <TableCell className="px-4 py-4 text-[15px] font-bold text-[#6E56CF] text-right">${totalCompra}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PedidoDetalle() {
    return (
        <Suspense fallback={<div className="p-4">Cargando detalle del pedido...</div>}>
            <PedidoDetalleInner />
        </Suspense>
    );
}
