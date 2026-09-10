"use client"
import {useState, useEffect} from "react";
import {useCarritoGlobal} from "@/ContextosGlobales/CarritoContext";
import {useObjetosPagosGlobales} from "@/ContextosGlobales/ObjetoPagarContext";
import Link from "next/link";
import {toast} from "react-hot-toast";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {
    ButtonGroup,
    // ButtonGroupSeparator,
    // ButtonGroupText,
} from "@/components/ui/button-group"

import { Button } from "@/components/ui/button"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"




export default function Carrito() {

    const [carrito, setCarrito] = useCarritoGlobal();
    const [_objetoDePago, _setObjetoDePago] = useObjetosPagosGlobales();
    const [_nuevaCantidad, _setNuevaCantidad] = useState(0);
    const [idSeleccionado, setIdSeleccionado] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);


    const productoCatidades = {};
    let totalPago = 0;

    for (const productos of carrito) {
        if (!productos) continue;
        if (productoCatidades[productos.id_producto]) {
            productoCatidades[productos.id_producto].cantidadVendida += 1;
        } else {
            productoCatidades[productos.id_producto] = {...productos, cantidadVendida: 1};
        }
    }

    const productosDelCarrito = Object.values(productoCatidades)

    useEffect(() => {
        // Solo ejecutar esta lógica después del montaje para evitar mismatch SSR/cliente
        if (!isMounted) return;
        if (
            productosDelCarrito.length > 0 &&
            (idSeleccionado === null ||
                !productosDelCarrito.some(p => p.id_producto === idSeleccionado))
        ) {
            setIdSeleccionado(productosDelCarrito[0].id_producto);
        }
    }, [productosDelCarrito, isMounted]);

    for (const producto of productosDelCarrito) {
        totalPago += (producto.valorProducto * producto.cantidadVendida);
    }


    function quitarDelCarrito(id_producto) {
        try {
            if (!id_producto) {
                return toast.error('Debe seleccionar un producto para quitarlo del carrito!');
            } else {
                const nuevoCarrito = carrito.filter(producto => {
                    return producto.id_producto !== id_producto
                });
                setCarrito(nuevoCarrito);
            }

        } catch (e) {
            return toast.error("No se puede eliminar el producto del carrito. Pruebe mas tarde");
        }
    }




    function aumentarCantidad(id_producto) {
        try {
            if (!id_producto) {
                return toast.error('Debe seleccionar un producto para poder aumentar su cantidad.');
            } else {

                const productoAumentar = carrito.find(producto => producto.id_producto === id_producto);
                if (!productoAumentar) {
                    return toast.error("No se ha encontrado el producto que se quiere aumentar");
                }else{
                    setCarrito([...carrito, {...productoAumentar}]);
                }

            }
        } catch (e) {
            console.log(e);
            return toast.error("No se puede aumentar la cantidad. Si necesita mas cantidad contacte a la tienda.");
        }

    }




    function disminuirCantidad(id_producto) {
        try {
            if (!id_producto) {
                return toast.error('Debe seleccionar un producto para poder bajar su cantidad.');
            } else {
                const productoEliminar = carrito.findIndex(producto => producto.id_producto === id_producto);
                if (productoEliminar === -1) {
                    return toast.error("No se ha encontrado el producto que se quiere aumentar");
                }else{
                    const nuevoCarritoConProductoEliminado = [...carrito];
                    nuevoCarritoConProductoEliminado.splice(productoEliminar, 1);
                    setCarrito(nuevoCarritoConProductoEliminado);
                }
            }
        } catch (e) {
            console.log(e);
            return toast.error("No se puede aumentar la cantidad. Si necesita mas cantidad contacte a la tienda.");
        }

    }



    // Reemplazo del render: mantengo toda la lógica pero muestro tabla en md+ y tarjetas en móvil
    return (
        <div className="mt-20">
            <div className="p-4 sm:p-6">

                    <h1 className="text-slate-900 text-3xl sm:text-4xl font-bold">Cantidad de Sesiones / Promociones</h1>

                {/* Mensaje cuando no hay productos */}
                {isMounted && productosDelCarrito.length === 0 && (
                    <div className="mt-8 bg-white rounded-xl p-6 shadow-sm text-slate-600">
                        No hay sesiones o paquetes seleccionados.
                    </div>
                )}

                {/* VISTA ESCRITORIO: tabla (md+) */}
                <div className="hidden md:block">
                    <Table className="w-full mt-8 rounded-xl overflow-hidden shadow-sm bg-white">
                        <TableCaption></TableCaption>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="text-slate-600">
                                <TableHead
                                    className="px-4 py-3 text-left font-semibold text-sm text-slate-600 border-b">Producto</TableHead>
                                <TableHead
                                    className="px-4 py-3 text-left font-semibold text-sm text-slate-600 border-b">Referencia</TableHead>
                                <TableHead
                                    className="px-4 py-3 text-left font-semibold text-sm text-slate-600 border-b">Sesiones </TableHead>

                                <TableHead className="px-4 py-3 text-left font-semibold text-sm text-slate-600 border-b">Valor
                                    Sesion</TableHead>
                                <TableHead
                                    className="px-4 py-3 text-left font-semibold text-sm text-slate-600 border-b">SubTotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isMounted && productosDelCarrito.map((producto) => (
                                <TableRow key={producto.id_producto} className="hover:bg-slate-50 transition-colors">
                                    <TableCell
                                        className="px-4 py-4 text-sm text-slate-700 align-middle border-b font-medium">
                                        <span className="text-slate-900">{producto.tituloProducto}</span>
                                        <span className="mt-3 block"><ShadcnButton
                                            funcion={() => quitarDelCarrito(producto.id_producto)}
                                            nombre={"Eliminar"}/></span>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-slate-700 align-middle border-b"><img
                                        src={`https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ/${producto.imagenProducto}/mini`} alt={"Imagen Producto"} width={100}
                                        height={100} className="object-cover rounded"/></TableCell>
                                    <TableCell
                                        className="px-4 py-4 text-sm text-slate-700 align-middle border-b">{producto.cantidadVendida}</TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-slate-700 align-middle border-b">

                                        {/*
                                            <ButtonGroup aria-label="Acciones">
                                            <Button onClick={()=>disminuirCantidad(producto.id_producto)} variant="outline">-</Button>
                                            <Button onClick={()=>aumentarCantidad(producto.id_producto)} variant="outline">+</Button>
                                            </ButtonGroup>

                                        */}

                                    </TableCell>
                                    <TableCell
                                        className="px-4 py-4 text-sm text-slate-700 align-middle border-b">{producto.valorProducto}</TableCell>
                                    <TableCell
                                        className="px-4 py-4 text-sm text-slate-700 align-middle border-b text-right">{producto.cantidadVendida * producto.valorProducto}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-slate-50 w-full font-semibold">
                                <TableCell className="px-4 py-3 w-full text-left text-slate-600"
                                           colSpan={3}>Total</TableCell>
                                <TableCell className="px-4 py-3 text-right text-slate-900">$ {isMounted ? totalPago : 0}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                {/* VISTA MÓVIL: tarjetas (sm) */}
                <div className="md:hidden mt-6 space-y-4">
                    {isMounted && productosDelCarrito.map((producto) => (
                        <div key={producto.id_producto} className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-4">
                            <img src={`https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ/${producto.imagenProducto}/mini`} alt={producto.tituloProducto} className="w-20 h-20 object-cover rounded flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 truncate">{producto.tituloProducto}</div>
                                        <div className="text-xs text-slate-400 mt-1">Ref: {producto.id_producto}</div>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                        <div className="text-sm font-semibold text-slate-700">${producto.valorProducto}</div>
                                        <div className="text-xs text-slate-400">Subtotal</div>
                                    </div>
                                </div>

                                {/* Acciones: en móvil apilan si falta espacio */}
                                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">

                                        <div className="text-sm text-slate-600">Unidades: <span className="font-medium">{producto.cantidadVendida}</span></div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-end flex-shrink-0">
                                        <div className="w-max">
                                            <ShadcnButton funcion={() => quitarDelCarrito(producto.id_producto)} nombre={"Eliminar"} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}

                    {/* Total y botón pagar en móvil */}
                    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div className="text-lg font-semibold text-slate-600">Total</div>
                        <div className="text-xl font-bold text-slate-900">$ {isMounted ? totalPago : 0}</div>
                    </div>
                </div>

                {/* Botón Ir a pagar (se mantiene visible en ambos tamaños) */}
                <div className="mt-6 flex gap-3 ">
                    <Link href="/formularioPago">
                        <button
                            className="p-2 w-44 rounded-xl font-semibold bg-slate-900 text-white transition-colors hover:bg-slate-800"
                        >
                            Ir a Pagar
                        </button>
                    </Link>

                    <Link href="/catalogo">
                        <button
                            className="p-2 w-44 rounded-xl font-semibold bg-white border border-slate-200 text-slate-900 transition-colors hover:bg-slate-50"
                        >
                            Volver a Catalogo
                        </button>
                    </Link>


                </div>

            </div>
        </div>
    )
}