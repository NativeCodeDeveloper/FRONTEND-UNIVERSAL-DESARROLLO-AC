"use client"
import { CheckCircle2, CreditCard, EyeOff, KeyRound, ShieldCheck, Store, WalletCards } from "lucide-react";
import {toast, Toaster} from "react-hot-toast";
import {useEffect, useState} from "react";
import EstadoPersisntence from "../../../Componentes/EstadoPersisntence.jsx"


const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const labelClass = "text-sm font-medium text-slate-700";
function DatoActual({ icon, etiqueta, valor, ayuda }) {
    return (
        <div className="min-w-0 flex-1 p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{etiqueta}</p>
                    <p className="mt-1 truncate text-base font-semibold text-slate-900">{valor}</p>
                    {ayuda ? <p className="mt-1 text-xs leading-5 text-slate-500">{ayuda}</p> : null}
                </div>
            </div>
        </div>
    );
}





export default function PasarelaPagoPage() {

    const API = process.env.NEXT_PUBLIC_API_URL;
    const [mercadoPagoData, setMercadoPagoData] = useState([]);
    const [id_mercadoPago_persistence, setIdMercadoPagoPersistence] = useState("");

    async function mercadoPagoPersistence(){
        try {
            const res = await fetch (`${API}/persistence/obtenerPersistencia`,{
                method: "GET",
                headers:{"Accept": "application/json"},
            })
            if(!res.ok){
                return toast.error(`Error al cargar datos de Mercado Pago: ${res.statusText}`)
            }
            const data = await res.json();
            setIdMercadoPagoPersistence(data?.[0]?.id_mercadoPago_persistence)
            return setMercadoPagoData(data);
        }catch (e) {
            return toast.error(`Error al cargar datos de Mercado Pago: ${e.message}`)
        }
    }

    useEffect(() => {
        mercadoPagoPersistence()
    }, []);


    function estadoPasarela(estadoNumerico) {
        let estadoString;

        if(estadoNumerico === null || estadoNumerico === undefined) {
            estadoString = "Desconocido"
            return toast.error(`Estado No Valido`);
        }

        if(estadoNumerico === 0 || estadoNumerico === "0") {
            estadoString = "Inactivo";
            return estadoString;
        }

        if(estadoNumerico === 1 || estadoNumerico === "1") {
            estadoString = "Activo";
            return estadoString;
        }
    }








    const [nombre_cliente, setNombreCliente] = useState("");
    const [access_token, setaccess_token] = useState("");
    const [estado_pasarela, setEstadoPasarela] = useState(0);


    async function actualizarMercadoPago(
        nombre_cliente,
        access_token,
        estado_pasarela,
        id_mercadoPago_persistence
    ){
        try {

            if(!nombre_cliente || !access_token){
                return toast.error(`Error al actualizar datos de Mercado Pago, faltan datos!`);
            }

            if(id_mercadoPago_persistence === null || id_mercadoPago_persistence === undefined){
                return toast.error(`Error al actualizar datos de Mercado Pago, falta id_mercadoPago_persistence!`);
            }

            const res = await fetch (`${API}/persistence/actualizar`,{
                method: "POST",
                headers:{"Accept": "application/json",
                "Content-Type": "application/json"},
                body: JSON.stringify({
                    nombre_cliente,
                    access_token,
                    estado_pasarela,
                    id_mercadoPago_persistence
                }),
                cors: `no-cors`,
                cache: "no-cache"
            });

            if(!res.ok){
                return toast.error(`Error al actualizar datos de Mercado Pago: ${res.statusText}`)
            }

            const data = await res.json();

            if(data.message === true) {
                await mercadoPagoPersistence();
                return toast.success(`Datos Actualizados correctamente!`);
            }
            if(data.message === false) return toast.error(`Error al actualizar datos de Mercado Pago`);
            if(data.message === `sindata`) return toast.error(`Error al actualizar datos de Mercado Pago, faltan datos!`);

        }catch (e) {
            return toast.error(`Error al actualizar datos de Mercado Pago: ${e.message}`)
        }
    }


    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <Toaster/>
            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                <div className="space-y-8">
                    <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
                                    Configuracion web
                                </p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                    Pasarela de pago
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Administra visualmente los datos de la cuenta conectada a Mercado Pago. Esta vista usa informacion de muestra y queda lista para conectar despues.
                                </p>
                            </div>


                            {
                                mercadoPagoData.map(data=>(
                                    <div key={data.id_mercadoPago_persistence}>
                                        <EstadoPersisntence estado={data.estado_pasarela} />
                                    </div>
                                    ))
                            }

                        </div>
                    </section>

                    <section className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm lg:flex-row lg:divide-x lg:divide-y-0">

                        {
                            mercadoPagoData.map(dato =>(
                                <DatoActual
                                    key={dato.id_mercadoPago_persistence}
                                    icon={<Store className="h-5 w-5" />}
                                    etiqueta="Cuenta actual"
                                    valor={dato.nombre_cliente}
                                    ayuda="Nombre visible para identificar la integracion."
                                />
                            ))
                        }

                        {
                            mercadoPagoData.map(dato =>(
                                <DatoActual
                                    key={dato.id_mercadoPago_persistence}
                                    icon={<EyeOff className="h-5 w-5" />}
                                    etiqueta="Access token"
                                    valor={dato.access_token}
                                    ayuda="Solo se muestran los ultimos caracteres."
                                />
                            ))
                        }



                        {
                            mercadoPagoData.map(dato =>(
                                <DatoActual
                                    key={dato.id_mercadoPago_persistence}
                                    icon={<ShieldCheck className="h-5 w-5" />}
                                    etiqueta="Estado"
                                    valor={estadoPasarela(dato.estado_pasarela)}
                                    ayuda={`Activo/Inactivo`}
                                />
                            ))
                        }


                    </section>
                    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3F0FF] text-[#6E56CF]">
                                    <WalletCards className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Actualizar informacion de la pasarela</h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        Formulario visual para reemplazar los datos actuales. Los campos no guardan informacion ni se conectan al backend.
                                    </p>
                                </div>
                            </div>


                                <div className="grid gap-5">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Nombre de la cuenta</label>
                                        <input
                                            value={nombre_cliente}
                                            onChange={(e) => setNombreCliente(e.target.value)}
                                            className={inputClass}
                                            placeholder="Ej: Mercado Pago - Sucursal Central"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={labelClass}>Nuevo access token</label>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                            value={access_token}
                                            onChange={(e) => setaccess_token(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>
                                    <p className="text-xs leading-5 text-slate-500">
                                        En la version conectada, este campo deberia reemplazar el token guardado sin mostrarlo completo despues de guardar.
                                    </p>
                                </div>

                                <div className="grid gap-5">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Estado</label>
                                        <select className={inputClass}
                                                value={estado_pasarela}
                                                onChange={(e) => setEstadoPasarela(e.target.value)}
                                        >
                                            <option value="1">Activo</option>
                                            <option value="0">Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                </div>


                            <button
                                onClick={()=>actualizarMercadoPago(
                                    nombre_cliente,
                                    access_token,
                                    estado_pasarela,
                                    id_mercadoPago_persistence
                                )}
                                type="button"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <CreditCard className="h-4 w-4" />
                                Actualizar datos
                            </button>
                        </div>


                    </section>
                </div>
            </div>
        </div>
    );
}
