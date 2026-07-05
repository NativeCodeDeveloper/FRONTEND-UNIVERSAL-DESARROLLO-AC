"use client"
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {Textarea} from "@/components/ui/textarea";
import {useState, useEffect} from "react";
import ToasterClient from "@/Componentes/ToasterClient";
import { toast } from "react-hot-toast";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {InfoButton} from "@/Componentes/InfoButton";

export default function Cupones() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [tablaCupones, setTablaCupones] = useState([]);

    //ESTADOS PARA INSERCION DE DATOS
    const [nombreCupon, setNombreCupon] = useState("");
    const [codigoVerificadorCupon, setCodigoVerificadorCupon] = useState("");
    const[objetivoCupon, setObjetivoCupon] = useState("");
    const [porcentajeDescuento,setPorcentajeDescuento] = useState(0);
    const[dataCuponSeleccionado, setDataCuponSeleccionado] = useState([]);
    const [id_cupon, setId_cupon] = useState(0);





    //FUNCION PARA LA SELECCIONAR ID ESPECIFICO DE CUPONES LLAMANDO A LA API
    async function actualizarCupon(nombreCupon,codigoVerificadorCupon,objetivoCupon,porcentajeDescuento,id_cupon) {
        try {
            if (!nombreCupon  || !codigoVerificadorCupon || !objetivoCupon || !porcentajeDescuento || !id_cupon) {
               return  toast.error("Seleccione almenos un cupon");

            } else if (isNaN(porcentajeDescuento)) {
              return  toast.error("El porcentaje debe ser un valor numerico, no debe contener simbolos o letras");

            } else if (porcentajeDescuento < 1 || porcentajeDescuento > 100) {
                return  toast.error("El porcentaje debe ser un valor numerico entre 1 y 100");

            }

            const res = await fetch(`${API}/cupon/actualizarCupon`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({nombreCupon,codigoVerificadorCupon,objetivoCupon,porcentajeDescuento,id_cupon}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                toast.error("Por favor llene todos los campos. Si yas los ha llenado y el problema persiste contacte a soporte de NativeCode");
            }else{

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    setNombreCupon("");
                    setObjetivoCupon("");
                    setCodigoVerificadorCupon("");
                    setPorcentajeDescuento(0);
                    setId_cupon(0);
                    await listarTablaCupones();
                    return toast.success("Datos del cupon actualizados!");

                }else{
                    return toast.error("No se logro actualizar cupon, porfavor intente mas tarde!");
                }
            }
        }catch (error) {
            console.log(error)
            return toast.error('Problema al insertar los cupones contacte a soporte de NativeCode el error es :' +  error.message);
        }
    }




    //FUNCION PARA LA SELECCIONAR ID ESPECIFICO DE CUPONES LLAMANDO A LA API
    async function seleccionarCupon(id_cupon) {
        try {
            if (!id_cupon) {
                toast.error("Seleccione almenos un cupon");
            }
            const res = await fetch(`${API}/cupon/seleccionarCuponesId`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({id_cupon}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                toast.error("Por favor llene todos los campos. Si yas los ha llenado y el problema persiste contacte a soporte de NativeCode");
            }else{

                const respuestaBackend = await res.json();
                if (respuestaBackend) {
                    setDataCuponSeleccionado(respuestaBackend);
                    return toast.success("Cupon seleccionado!");

                }else{
                    return toast.error("No se logro cargargar el cupon elegido. Contacte a soporte de NativeCode");
                }
            }
        }catch (error) {
            console.log(error)
            return toast.error('Problema al insertar los cupones contacte a soporte de NativeCode el error es :' +  error.message);
        }
    }

    useEffect(() => {
    if (dataCuponSeleccionado.length > 0) {
        dataCuponSeleccionado.map((cupon) => {
            setNombreCupon(cupon.nombreCupon);
            setObjetivoCupon(cupon.objetivoCupon);
            setCodigoVerificadorCupon(cupon.codigoVerificadorCupon)
            setPorcentajeDescuento(cupon.porcentajeDescuento)
            setId_cupon(cupon.id_cupon)

        });

    }
}, [dataCuponSeleccionado])





    //FUNCION PARA LA ELIMINACION DE DATOS LLAMANDO A LA API
    async function eliminarCupon(id_cupon) {
        try {

            if (!id_cupon) {
                toast.error("Seleccione almenos un cupon");
            }
            const res = await fetch(`${API}/cupon/eliminarCupon`, {
                method: "POST",
                headers: {Accept: "application/json",
                    "Content-Type": "application/json"},
                body: JSON.stringify({id_cupon}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                toast.error("Por favor llene todos los campos. Si yas los ha llenado y el problema persiste contacte a soporte de NativeCode");
            }else{

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    await listarTablaCupones();
                    return toast.success("Se ha eliminado el cupon con exito!");
                }else{
                    return toast.error("Ha ocurrido un problema con la eliminacion del cupon porfavor intente mas tarde.");
                }
            }
        }catch (error) {
            console.log(error)
            return toast.error('Problema al insertar los cupones contacte a soporte de NativeCode el error es :' +  error.message);
        }
    }



    //FUNCION PARA LA INSERCION DE DATOS LLAMANDO A LA API
    async function insertarCupon(nombreCupon,codigoVerificadorCupon,objetivoCupon,porcentajeDescuento) {
        try {

            if (!nombreCupon || !codigoVerificadorCupon || !objetivoCupon || !porcentajeDescuento) {
                toast.error("Por favor llene todos los campos.");
            }  else if (isNaN(porcentajeDescuento)) {
                return  toast.error("El porcentaje debe ser un valor numerico, no debe contener simbolos o letras");

            } else if (porcentajeDescuento < 1 || porcentajeDescuento > 100) {
                return  toast.error("El porcentaje debe ser un valor numerico entre 1 y 100");

            }

            if(isNaN(porcentajeDescuento)){
               return  toast.error("El porcentaje debe ser un valor numerico sin letras puntos o simbolos");
            }

            const res = await fetch(`${API}/cupon/insertarCupon`, {
                method: "POST",
                headers: {Accept: "application/json",
                "Content-Type": "application/json"},
                body: JSON.stringify({nombreCupon,codigoVerificadorCupon,objetivoCupon,porcentajeDescuento}),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                toast.error("Por favor llene todos los campos. Si yas los ha llenado y el problema persiste contacte a soporte de NativeCode");
            }else{

                const respuestaBackend = await res.json();
                if (respuestaBackend.message === true) {
                    await listarTablaCupones();
                    return toast.success("Se ha insertado un nuevo cupon de descuentos");
                }else{
                    return toast.error("Ha ocurrido un problema con la insercion  del cupon porfavor intente mas tarde.");

                }
            }
        }catch (error) {
            console.log(error)
            return toast.error('Problema al insertar los cupones contacte a soporte de NativeCode el error es :' +  error.message);
        }
    }


    async function listarTablaCupones() {
        try {
            const res = await fetch(`${API}/cupon/seleccionarCupones`, {
                method: "GET",
                headers: {Accept: "application/json"},
                mode: "cors"
            })


            const dataCupones = await res.json();

            if (Array.isArray(dataCupones)) {
                setTablaCupones(dataCupones);
            }

        }catch(error) {
            return toast.error('Problema al listar los cupones contacte a soporte de NativeCode el error es :' +  error.message);
        }
    }

    useEffect(() => {
            listarTablaCupones();
    }, [])


function mostrarIdSeleccionado(id_cupon) {
    if (!id_cupon) {
       return "-"
    }else {
        return id_cupon;
    }
}


    return(
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Marketing y Descuentos</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Gestión de <span className="text-[#6E56CF]">Cupones</span>
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Crea y administra cupones de descuento. Para desactivar un cupón, simplemente elimínalo del listado.
                        </p>
                    </div>
                    <InfoButton informacion={"En este apartado, usted podrá crear cupones de descuento para que sus clientes obtengan rebajas en los productos o servicios ofrecidos. Estos cupones no son individuales ni se desactivan automáticamente al ser utilizados, por lo que deben desactivarse de forma manual cuando usted lo estime conveniente.\n\nEn el último campo del formulario, usted puede indicar el porcentaje de descuento que se aplicará al producto. Este valor solo puede ingresarse como un número entero entre 1 y 100; no se permiten letras ni caracteres especiales.\n\nPara desactivar un cupón, únicamente debe eliminarlo, y este dejará de estar activo de manera inmediata."}/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* ── Formulario (5 cols) ── */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Crear / Editar Cupón</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID seleccionado:</span>
                                    <span className="h-6 px-2.5 rounded-full bg-violet-50 text-[#6E56CF] text-[10px] font-bold flex items-center">{mostrarIdSeleccionado(id_cupon)}</span>
                                </div>
                            </div>
                            <div className="p-4 md:p-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título del cupón</label>
                                    <ShadcnInput value={nombreCupon} onChange={(e) => setNombreCupon(e.target.value)} placeholder="Titulo del cupon.." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Código verificador</label>
                                    <ShadcnInput value={codigoVerificadorCupon} onChange={(e) => setCodigoVerificadorCupon(e.target.value)} placeholder="Codigo del cupon.." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción / Objetivo</label>
                                    <Textarea className="min-h-[84px] resize-none rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-50"
                                        placeholder="Descripción del cupón..." value={objetivoCupon} onChange={(e) => setObjetivoCupon(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Porcentaje de descuento <span className="normal-case text-slate-300">(1–100)</span></label>
                                    <ShadcnInput type="number" placeholder="Ej: 15" value={porcentajeDescuento} onChange={(e) => setPorcentajeDescuento(e.target.value)} />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => insertarCupon(nombreCupon, codigoVerificadorCupon, objetivoCupon, porcentajeDescuento)}
                                        className="flex-1 h-11 rounded-xl bg-[#6E56CF] text-white text-[12px] font-bold hover:bg-[#5b45bc] transition-all shadow-lg shadow-indigo-100">
                                        Ingresar
                                    </button>
                                    <button
                                        onClick={() => actualizarCupon(nombreCupon, codigoVerificadorCupon, objetivoCupon, porcentajeDescuento, id_cupon)}
                                        className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition-all">
                                        Actualizar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabla de cupones (7 cols) ── */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cupones Activos</h2>
                                <span className="h-5 px-2 rounded-full bg-violet-50 text-[#6E56CF] text-[10px] font-bold flex items-center">{tablaCupones.length}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">ID</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Título</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 hidden md:table-cell">Objetivo</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Código</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 text-center">%</TableHead>
                                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 text-center">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tablaCupones.map((cupon) => (
                                            <TableRow key={cupon.id_cupon} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="py-4 text-[12px] font-bold text-slate-500">#{cupon.id_cupon}</TableCell>
                                                <TableCell className="py-4 text-[13px] font-bold text-slate-800">{cupon.nombreCupon}</TableCell>
                                                <TableCell className="py-4 text-[12px] text-slate-500 hidden md:table-cell max-w-[150px] truncate">{cupon.objetivoCupon}</TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded-lg text-slate-600">{cupon.codigoVerificadorCupon}</span>
                                                </TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <span className="text-[12px] font-bold text-[#6E56CF]">{cupon.porcentajeDescuento}%</span>
                                                </TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => seleccionarCupon(cupon.id_cupon)}
                                                            className="h-8 px-3 rounded-xl bg-violet-50 text-[#6E56CF] text-[11px] font-bold hover:bg-[#6E56CF] hover:text-white transition-all">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => eliminarCupon(cupon.id_cupon)}
                                                            className="h-8 px-3 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-600 hover:text-white transition-all">
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tablaCupones.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-12 text-center text-[13px] text-slate-400 italic">
                                                    No hay cupones activos. Crea el primero con el formulario.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}