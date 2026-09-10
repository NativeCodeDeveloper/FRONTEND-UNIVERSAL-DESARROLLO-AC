'use client'
import {useState, useEffect, use} from "react";
import {useParams} from "next/navigation";
import {useCarritoGlobal} from "@/ContextosGlobales/CarritoContext";
import {toast} from "react-hot-toast";
import {useRouter} from "next/navigation";
import CarruselProducto from "@/Componentes/CarruselProducto";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {number} from "zod";
import ToasterClient from "@/Componentes/ToasterClient";
import Link from "next/link";



export default function ProductoDetalle() {




    //USO DE CARRITO GLOBAL DE CONTEXT PARA EL USO EN TODA LA APLICACION DE ARRAY DE OBJETOS GLOBALES
    const [, setCarrito] = useCarritoGlobal();
    const [zonaIndividual, setZonaIndividual] = useState(true);
    const [cantidadSesiones, setcantidadSesiones] = useState('');
    const [listaProductos, setlistaProductos] = useState([]);
    const [productoSeleccionado, setproductoSeleccionado] = useState('');
    const [dataProductoSeleccionado, setdataProductoSeleccionado] = useState({});
    const router = useRouter();


    function agregarAlCarrito(productoSeleccionado) {
        setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
        toast.success("Producto añadido al carrito de compras!")
    }




    function agregarSesiones(productoSeleccionado, cantidadSesiones) {
        const numeroSesiones = Number(cantidadSesiones);

        if (numeroSesiones === 1) {
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            return toast.success("Sesiones añadidas al carrito de compras!")
        } else if (numeroSesiones === 3) {
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
        } else if (numeroSesiones === 6) {
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
            setCarrito(arrayProductosPrevios => [...arrayProductosPrevios, productoSeleccionado])
        } else {
            return;
        }
    }

    function comparAhora(productoSeleccionado, cantidadSesiones) {
        if (!productoSeleccionado) {
            return toast.error("Debe seleccionar una zona.");
        }
        if (!cantidadSesiones) {
            return toast.error("Debe seleccionar la cantidad de sesiones.");
        }
        agregarSesiones(productoSeleccionado, cantidadSesiones);
        router.push("/carrito");
    }


    //USE STATE PARA ALMACENAR EL OBJETO SELECCIONADO CON USESTATE
    const [producto, setProducto] = useState({});

    //SE USA EL PARAM DE USEPARAMS NAVEGATE DE NBEXT PARA SUAR EL ID
    const params = useParams();
    const id_subsubcategoria = params?.id;

    // CONSTANTE API QUE APUNTA AL SERVIDOR BACKEND PARA CONECTAR CON LOS ENDPOINDS EN VIEWS
    const API = process.env.NEXT_PUBLIC_API_URL;
    const CLOUDFLARE_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_HASH;
    const VARIANT = 'full'



    //FUNCION PARA LLAMAR AL OBJETO ESPECIFICO POR ID
    async function seleccionarProductoPorID(id_producto) {
        try {
            const res = await fetch(`${API}/producto/${id_producto}`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            });
            if (!res.ok) {
                return alert("No se ha podido renderizar el producto seleccionado, porfavor conatcte a soporte TI de NativeCode.cl")
            } else {
                const dataSeleccion = await res.json();
                setdataProductoSeleccionado(dataSeleccion);
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (productoSeleccionado) {
            seleccionarProductoPorID(productoSeleccionado);
        }
    }, [productoSeleccionado]);

    useEffect(() => {
        if (!dataProductoSeleccionado) return;
        setProducto(dataProductoSeleccionado);
    }, [dataProductoSeleccionado]);



    useEffect(() => {
        if (producto?.subcategoria == null) return; // null o undefined

        if (producto?.subcategoria === 23){
            setZonaIndividual(true);
        }else if(producto?.subcategoria === 26){
            setZonaIndividual(true);
        }else {
            setZonaIndividual(false);
        }

    }, [producto?.subcategoria]);




    let booleanSinStock = false

    if (producto.cantidadStock < 1){
        booleanSinStock = true;
    }





    async function seleccinarProductosporSubSubCategoria(subsubcategoria){
        try {
            const res = await fetch(`${API}/producto/seleccionarPorSubSubcategoria `, {
                method: "POST",
                headers: {Accept: 'application/json',
                    'Content-Type' : 'application/json'},
                mode: 'cors',
                body: JSON.stringify({subsubcategoria})
            })

            if (!res.ok) {
                return toast.error('Ha ocurrido un error porfavor contacte al administrador.')
            }

            const dataListadoProducto = await res.json();

            if(Array.isArray(dataListadoProducto)){
                setlistaProductos(dataListadoProducto);
            }else {
                setlistaProductos([])
            }

        }catch (error) {
            return toast.error('No ha sido posible cargar los productos. Contacte al administrador del sistema.')
        }
    }

    useEffect(() => {
        seleccinarProductosporSubSubCategoria(id_subsubcategoria)
    }, [id_subsubcategoria]);

    useEffect(() => {
        if (listaProductos.length > 0 && !productoSeleccionado) {
            setproductoSeleccionado(String(listaProductos[0].id_producto));
        }
    }, [listaProductos, productoSeleccionado]);



    function calcularPrecio(valorPorDefecto, cantidadSesiones){
        if (!valorPorDefecto) {
            valorPorDefecto = 0;
        }
        const sesiones = Number(cantidadSesiones) || 1;
        const nuevo_valor = valorPorDefecto * sesiones;
        return nuevo_valor;
    }



    function verificadorDeProducto(stringTitulo) {
        if (!productoSeleccionado) {
            return 'Debe seleccionar una zona o promoción';
        }

        if (!stringTitulo) {
            return 'Debe seleccionar una zona o promoción';
        }

        return stringTitulo;
    }




return (
        <div className="w-full flex justify-center mt-6">
            <ToasterClient/>
            <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="flex items-start justify-center bg-slate-50/60 backdrop-blur rounded-2xl border border-slate-200 p-3 relative w-full max-w-2xl mx-auto overflow-hidden">
                    <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto pt-2">
                        <CarruselProducto
                            imagen1={`https://imagedelivery.net/${CLOUDFLARE_HASH}/${dataProductoSeleccionado.imagenProducto}/${VARIANT}`}
                            imagen2={`https://imagedelivery.net/${CLOUDFLARE_HASH}/${dataProductoSeleccionado.imagenProductoSegunda}/${VARIANT}`}
                            imagen3={`https://imagedelivery.net/${CLOUDFLARE_HASH}/${dataProductoSeleccionado.imagenProductoTercera}/${VARIANT}`}
                            imagen4={`https://imagedelivery.net/${CLOUDFLARE_HASH}/${dataProductoSeleccionado.imagenProductoCuarta}/${VARIANT}`}

                        />

                        <div className="hidden md:block">
                            <div className="mt-4 flex items-center justify-center">
                                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2">
                                    <img
                                        src="/MP_RGB_HANDSHAKE_color_horizontal.svg"
                                        alt="Mercado Pago"
                                        className="h-6 w-auto opacity-80 grayscale"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>


                <div className="space-y-4 w-full max-w-2xl mx-auto">

                    {producto && (
                        <>
                            {/* TÍTULO DEL PRODUCTO */}
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                                {verificadorDeProducto(producto.tituloProducto)}
                            </h1>


                            {/* PRECIO */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-sm uppercase tracking-wider text-slate-500">Valor</span>
               <label className="text-2xl md:text-3xl font-bold text-slate-900">
                   {new Intl.NumberFormat('es-CL', {
                       style: 'currency',
                       currency: 'CLP',
                       maximumFractionDigits: 0
                   }).format(calcularPrecio(producto.valorProducto, cantidadSesiones))}
               </label>
                            </div>
                            <div className="flex items-baseline gap-3 opacity-80">
                                <span className="text-xs uppercase tracking-wider text-slate-400">
                                    Valor previo
                                </span>


                                <span className="relative text-base md:text-lg font-medium text-slate-400 opacity-90 after:content-[''] after:absolute after:left-0 after:right-0 after:top-1/2 after:h-[2px] after:bg-slate-400 after:-translate-y-1/2">
                                    {new Intl.NumberFormat('es-CL', {
                                        style: 'currency',
                                        currency: 'CLP',
                                        maximumFractionDigits: 0
                                    }).format(calcularPrecio(producto.valor_previo, cantidadSesiones))}
                                </span>
                            </div>

                            {/* DESCRIPCIÓN */}
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line break-words">
                                {producto.descripcionProducto}
                            </p>


                            {/* SEPARADOR SUTIL */}
                            <div className="h-px bg-slate-200/70" />

                            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                                <Select
                                    value={cantidadSesiones}
                                    onValueChange={value => setcantidadSesiones(value)}
                                >
                                    <SelectTrigger className="w-full sm:w-60">
                                        <SelectValue placeholder="Cantidad de Sesiones" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Cantidad Sesiones</SelectLabel>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="6">6</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={productoSeleccionado}
                                    onValueChange={(value) => setproductoSeleccionado(value)}
                                >
                                    <SelectTrigger className="w-full sm:w-60">
                                        <SelectValue placeholder="Selecciona Zona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {listaProductos.length > 0 ? (
                                                listaProductos.map((producto) => (
                                                    <SelectItem
                                                        key={producto.id_producto}
                                                        value={String(producto.id_producto)}
                                                    >
                                                        {producto.tituloProducto}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-gray-500 pointer-events-none select-none">
                                                    No se ha seleccionado una categoría
                                                </div>
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>












                            {/* ACCIONES */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
                                <button
                                    type="button"
                                    disabled={booleanSinStock || !productoSeleccionado || !cantidadSesiones}
                                    onClick={() => comparAhora(producto, cantidadSesiones)}
                                    className="inline-flex w-full sm:w-auto sm:flex-1 min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-sm ring-1 ring-slate-900/10 transition disabled:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-400 disabled:active:bg-slate-400"
                                >
                                    Agregar al carrito
                                </button>

                                <Link href="/catalogo">
                                    <button
                                        className="inline-flex w-full sm:w-auto sm:flex-1 min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm transition"
                                    >
                                        Volver a Catalogo
                                    </button>
                                </Link>
                            </div>

                            {/* BENEFICIOS / SELLOS DE CONFIANZA */}
                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 px-4 py-4 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 mb-3 text-center sm:text-left">
                                    Compra segura y respaldo
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                                        <p className="text-sm font-semibold leading-tight">Pago seguro</p>
                                        <p className="text-xs text-slate-600 leading-snug mt-1">
                                            Tus datos se protegen con cifrado y no se comparten.
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                                        <p className="text-sm font-semibold leading-tight">Medios flexibles</p>
                                        <p className="text-xs text-slate-600 leading-snug mt-1">
                                            Crédito, débito y transferencias disponibles.
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                                        <p className="text-sm font-semibold leading-tight">Soporte</p>
                                        <p className="text-xs text-slate-600 leading-snug mt-1">
                                            Acompañamiento en compra y postventa.
                                        </p>
                                    </div>
                                </div>
                            </div>


                        </>
                    )}
                </div>

       <div className="block md:hidden w-full px-4 pb-6">
           <div className="flex justify-center">
               <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2">
                   <img
                       src="/MP_RGB_HANDSHAKE_color_horizontal.svg"
                       alt="Mercado Pago"
                       className="h-6 w-auto opacity-80 grayscale"
                   />
               </div>
           </div>
       </div>

            </div>
        </div>
    )

}