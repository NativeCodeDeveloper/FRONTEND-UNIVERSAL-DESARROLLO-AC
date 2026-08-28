"use client";

/**
 * RecordatorioPaciente.jsx
 * Widget reutilizable para enviar recordatorios manuales al paciente (cita o pago),
 * por correo (endpoint real /correo/seguimiento) o por WhatsApp (enlace wa.me,
 * mismo mecanismo ya usado en BotonWhatsapp.jsx — abre la conversación con el
 * mensaje redactado, el envío final lo confirma quien lo dispara).
 *
 * Se usa en:
 *   - /dashboard/AgendaDetalle/[id_reserva]  (detalle de una cita)
 *   - AppointmentDrawer.jsx                  (panel lateral de la agenda)
 *   - /dashboard/paciente/[id_paciente]      (ficha del paciente)
 */

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import ShadcnInput from "@/Componentes/shadcnInput2";

const ETIQUETAS_TIPO = { cita: "Cita", pago: "Pago" };

// Arma la plantilla con la firma real de la clínica (nombre, teléfono/WhatsApp y
// dirección configurados en "Datos de la Empresa"), para que el paciente siempre
// tenga un canal claro por dónde responder o comunicarse.
function construirPlantilla(tipo, datosEmpresa, nombreProfesional) {
    const nombreEmpresa = String(datosEmpresa?.empresaNombre ?? "").trim() || "AgendaClínica";
    const telefonoContacto = String(datosEmpresa?.contactoWhatsapp || datosEmpresa?.contactoTelefono || "").trim();
    const direccion = String(datosEmpresa?.contactoDireccion ?? "").trim();
    const profesional = String(nombreProfesional ?? "").trim();
    const conProfesional = profesional ? ` con ${profesional}` : "";

    const lineasContacto = [
        telefonoContacto && `Teléfono: ${telefonoContacto}`,
        direccion && `Dirección: ${direccion}`,
    ].filter(Boolean);

    const bloqueContacto = lineasContacto.length > 0 ? `\n\n${lineasContacto.join("\n")}` : "";

    if (tipo === "pago") {
        return {
            asunto: `Recordatorio de pago pendiente – ${nombreEmpresa}`,
            mensaje:
                "Estimado/a paciente,\n\n" +
                `Le recordamos que tiene un pago pendiente asociado a su atención${conProfesional} en ${nombreEmpresa}. ` +
                "Le solicitamos regularizarlo a la brevedad o comunicarse con nosotros para coordinar la forma de pago.\n\n" +
                "Ante cualquier duda o inconveniente, no dude en contactarnos:" +
                bloqueContacto +
                "\n\nAtentamente,\n" +
                `Equipo ${nombreEmpresa}`,
        };
    }

    return {
        asunto: `Recordatorio de su próxima cita – ${nombreEmpresa}`,
        mensaje:
            "Estimado/a paciente,\n\n" +
            `Le recordamos que tiene una cita programada${conProfesional} en ${nombreEmpresa}. ` +
            "Le solicitamos confirmar su asistencia o comunicarse con nosotros en caso de necesitar reagendar.\n\n" +
            "Ante cualquier duda o inconveniente, no dude en contactarnos:" +
            bloqueContacto +
            "\n\nAtentamente,\n" +
            `Equipo ${nombreEmpresa}`,
    };
}

// Normaliza a formato E.164 chileno (56 + 9 dígitos) para wa.me. Muchos teléfonos
// quedaron guardados en formato local ("987485226", sin el código de país) porque
// no todos los flujos de ingreso usan PhoneInput.jsx (que sí fuerza el prefijo
// +569); wa.me rechaza el número si falta el código de país, mostrando "El número
// de teléfono +987485226 no existe en WhatsApp" en vez de abrir la conversación.
function limpiarTelefonoWhatsapp(telefono) {
    const digits = String(telefono ?? "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("56")) return digits; // ya viene con código de país
    // 11+ dígitos sin empezar con "56": probablemente ya es un número internacional
    // válido de otro país (paciente extranjero) — no anteponer "56" y dejarlo mal.
    if (digits.length >= 11) return digits;
    if (digits.startsWith("9") && digits.length === 9) return `56${digits}`; // móvil chileno sin código de país
    if (digits.length === 8) return `569${digits}`; // móvil chileno sin el 9 inicial ni código de país
    return `56${digits}`; // fallback: asumir chileno y anteponer código de país
}

export function RecordatorioPaciente({ email: emailInicial = "", telefono = "", nombreProfesional = "", compact = false, className = "" }) {
    const API = process.env.NEXT_PUBLIC_API_URL;

    const [datosEmpresa, setDatosEmpresa] = useState(null);
    const [tipo, setTipo] = useState("cita");
    const [email, setEmail] = useState(emailInicial ?? "");
    const [asunto, setAsunto] = useState(() => construirPlantilla("cita", null, nombreProfesional).asunto);
    const [mensaje, setMensaje] = useState(() => construirPlantilla("cita", null, nombreProfesional).mensaje);
    const [tocado, setTocado] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // El padre suele cargar el correo del paciente de forma asíncrona.
    useEffect(() => {
        setEmail(emailInicial ?? "");
    }, [emailInicial]);

    useEffect(() => {
        async function cargarDatosEmpresa() {
            try {
                const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    mode: "cors",
                    cache: "no-cache",
                });
                if (!res.ok) return;
                const data = await res.json();
                setDatosEmpresa(Array.isArray(data) ? data[0] : data);
            } catch (error) {
                console.log(error);
            }
        }
        cargarDatosEmpresa();
    }, [API]);

    // Mientras el usuario no haya editado a mano el asunto/mensaje, se refresca la
    // plantilla en cuanto llegan los datos reales de la clínica (nombre, teléfono, etc.).
    useEffect(() => {
        if (tocado) return;
        const plantilla = construirPlantilla(tipo, datosEmpresa, nombreProfesional);
        setAsunto(plantilla.asunto);
        setMensaje(plantilla.mensaje);
    }, [datosEmpresa, tipo, tocado, nombreProfesional]);

    function cambiarTipo(nuevoTipo) {
        setTipo(nuevoTipo);
        setTocado(false);
    }

    async function enviarPorCorreo() {
        if (enviando) return;
        if (!asunto || !email || !mensaje) {
            return toast.error("Debe completar el correo, el asunto y el mensaje para enviar el recordatorio.");
        }
        try {
            setEnviando(true);
            const res = await fetch(`${API}/correo/seguimiento`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ asunto, email, mensaje }),
                cache: "no-cache",
            });

            if (!res.ok) {
                return toast.error("El correo del paciente no es válido o no existe.");
            }

            const respuestaBackend = await res.json();
            if (respuestaBackend.message === true) {
                toast.success("Recordatorio enviado correctamente al correo del paciente.");
            } else {
                toast.error("El correo del paciente no es válido o no existe.");
            }
        } catch (error) {
            toast.error("Ha ocurrido un error, por favor contacte a soporte de NativeCode.");
        } finally {
            setEnviando(false);
        }
    }

    const numeroWhatsapp = limpiarTelefonoWhatsapp(telefono);

    function enviarPorWhatsapp() {
        if (!numeroWhatsapp) {
            return toast.error("El paciente no tiene un teléfono registrado.");
        }
        const texto = `*${asunto}*\n\n${mensaje}`;
        window.open(`https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    }

    const tamanoBoton = compact
        ? "px-3 py-1.5 text-xs"
        : "px-4 py-2.5 text-sm";
    const tamanoIcono = compact ? "h-3.5 w-3.5" : "h-4 w-4";

    return (
        <details className={`group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                    </svg>
                    <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Enviar recordatorio</h2>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
            </summary>

            <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-end">
                <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
                    {Object.entries(ETIQUETAS_TIPO).map(([clave, etiqueta]) => (
                        <button
                            key={clave}
                            type="button"
                            onClick={() => cambiarTipo(clave)}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                tipo === clave ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo destinatario</label>
                    <ShadcnInput
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@paciente.cl"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Asunto</label>
                    <ShadcnInput
                        value={asunto}
                        onChange={(e) => { setTocado(true); setAsunto(e.target.value); }}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje</label>
                    <Textarea
                        value={mensaje}
                        onChange={(e) => { setTocado(true); setMensaje(e.target.value); }}
                        placeholder="Escribe aqui el mensaje para el paciente..."
                        className="w-full text-sm min-h-[140px] resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 leading-relaxed shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400 transition"
                    />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={enviarPorCorreo}
                        disabled={enviando}
                        className={`inline-flex flex-1 items-center justify-center gap-2 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${tamanoBoton}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${tamanoIcono}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                        </svg>
                        {enviando ? "Enviando..." : "Enviar por correo"}
                    </button>
                    <button
                        type="button"
                        onClick={enviarPorWhatsapp}
                        disabled={!numeroWhatsapp}
                        title={!numeroWhatsapp ? "El paciente no tiene teléfono registrado" : "Abre WhatsApp con el mensaje redactado"}
                        className={`inline-flex flex-1 items-center justify-center gap-2 font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${tamanoBoton}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${tamanoIcono}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.858.502 3.6 1.375 5.096L2 22l5.03-1.34a9.964 9.964 0 004.974 1.336h.004c5.518 0 10.004-4.486 10.004-10.003C22.012 6.486 17.526 2 12.004 2zm0 18.184h-.003a8.161 8.161 0 01-4.161-1.139l-.298-.177-3.075.822.82-3.001-.194-.309a8.16 8.16 0 01-1.253-4.376c0-4.508 3.667-8.174 8.174-8.174 2.184 0 4.238.85 5.782 2.394a8.126 8.126 0 012.395 5.786c0 4.508-3.674 8.174-8.187 8.174z"/>
                        </svg>
                        Enviar por WhatsApp
                    </button>
                </div>
                <p className="text-[11px] text-slate-400">
                    El envío por WhatsApp abre la conversación con el mensaje ya redactado; debes confirmar el envío manualmente desde ahí.
                </p>
            </div>
        </details>
    );
}

export default RecordatorioPaciente;
