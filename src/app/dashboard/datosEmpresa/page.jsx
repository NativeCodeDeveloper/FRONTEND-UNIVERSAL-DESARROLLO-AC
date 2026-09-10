'use client'
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ToasterClient from "@/Componentes/ToasterClient";
import { ButtonDinamic } from "@/Componentes/ButtonDinamic";

/*
 * DATOS DE LA EMPRESA — CRUD
 *
 * Backend conectado:
 *   GET  /datosempresa/seleccionartodos
 *   POST /datosempresa/seleccionarporid
 *   POST /datosempresa/actualizar
 *
 * Estos datos alimentan (una vez conectados) los siguientes archivos del frontend:
 *   - src/lib/publicContact.js                           (fuente central de contacto y redes)
 *   - src/app/(public)/portada/page.jsx                  (redes sociales del Hero/Portada)
 *   - src/Componentes/Footer.jsx                         (contacto + redes en el footer)
 *   - src/Componentes/FlotanteInstagram.jsx              (botón flotante de Instagram)
 *   - src/Componentes/FloatingWhatsApp.jsx               (botón flotante de WhatsApp)
 *   - src/Componentes/WhatsAppFloatButton.jsx            (botón flotante de WhatsApp alternativo)
 *   - src/app/(public)/contacto/page.jsx                 (página de contacto)
 *   - src/app/(public)/seccion1/page.jsx                 (sección "Sobre nosotros" del inicio)
 */

export default function DatosEmpresa() {
    const API = process.env.NEXT_PUBLIC_API_URL;

    const [cargandoInicial, setCargandoInicial] = useState(true);
    const [cargando, setCargando] = useState(false);

    // Datos generales
    const [id_empresa, setId_empresa] = useState(1);
    const [empresaNombre, setEmpresaNombre] = useState("");

    // Contacto
    const [contactoTelefono, setContactoTelefono] = useState("");
    const [contactoWhatsapp, setContactoWhatsapp] = useState("");
    const [contactoEmail, setContactoEmail] = useState("");
    const [contactoDireccion, setContactoDireccion] = useState("");
    const [contactoUrlMapa, setContactoUrlMapa] = useState("");

    // Sobre nosotros
    const [sobreNosotrosTitulo, setSobreNosotrosTitulo] = useState("");
    const [sobreNosotrosParrafo1, setSobreNosotrosParrafo1] = useState("");
    const [sobreNosotrosParrafo2, setSobreNosotrosParrafo2] = useState("");

    // Redes sociales
    const [socialInstagramUrl, setSocialInstagramUrl] = useState("");
    const [socialInstagramHandle, setSocialInstagramHandle] = useState("");
    const [socialFacebookUrl, setSocialFacebookUrl] = useState("");
    const [socialTwitterUrl, setSocialTwitterUrl] = useState("");
    const [socialLinkedinUrl, setSocialLinkedinUrl] = useState("");
    const [socialTiktokUrl, setSocialTiktokUrl] = useState("");
    const [socialYoutubeUrl, setSocialYoutubeUrl] = useState("");
    const [socialOtraUrl, setSocialOtraUrl] = useState("");
    const [socialOtraEtiqueta, setSocialOtraEtiqueta] = useState("");

    function cargarFormulario(d) {
        if (!d) return;

        setId_empresa(d.id_empresa || 1);
        setEmpresaNombre(d.empresaNombre || "");
        setContactoTelefono(d.contactoTelefono || "");
        setContactoWhatsapp(d.contactoWhatsapp || "");
        setContactoEmail(d.contactoEmail || "");
        setContactoDireccion(d.contactoDireccion || "");
        setContactoUrlMapa(d.contactoUrlMapa || "");
        setSobreNosotrosTitulo(d.sobreNosotrosTitulo || "");
        setSobreNosotrosParrafo1(d.sobreNosotrosParrafo1 || "");
        setSobreNosotrosParrafo2(d.sobreNosotrosParrafo2 || "");
        setSocialInstagramUrl(d.socialInstagramUrl || "");
        setSocialInstagramHandle(d.socialInstagramHandle || "");
        setSocialFacebookUrl(d.socialFacebookUrl || "");
        setSocialTwitterUrl(d.socialTwitterUrl || "");
        setSocialLinkedinUrl(d.socialLinkedinUrl || "");
        setSocialTiktokUrl(d.socialTiktokUrl || "");
        setSocialYoutubeUrl(d.socialYoutubeUrl || "");
        setSocialOtraUrl(d.socialOtraUrl || "");
        setSocialOtraEtiqueta(d.socialOtraEtiqueta || "");
    }

    async function cargarDatosEmpresa() {
        try {
            const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
                method: "GET",
                headers: { Accept: "application/json" },
                mode: "cors",
            });
            if (!res.ok) return toast.error("No se pudieron cargar los datos de la empresa.");
            const data = await res.json();
            const d = Array.isArray(data) ? data[0] : data;
            cargarFormulario(d);
        } catch {
            toast.error("Error de conexión al cargar los datos.");
        } finally {
            setCargandoInicial(false);
        }
    }

    useEffect(() => {
        cargarDatosEmpresa();
    }, []);

    async function guardarDatosEmpresa() {
        // Solo los campos esenciales son obligatorios — las redes sociales son opcionales
        if (!empresaNombre || !contactoTelefono || !contactoEmail || !id_empresa) {
            toast.error("Completa los campos obligatorios: nombre de empresa, teléfono y email.");
            return;
        }

        try {
            setCargando(true);
            const res = await fetch(`${API}/datosempresa/actualizar`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                mode: "cors",
                body: JSON.stringify({
                    empresaNombre,
                    contactoTelefono,
                    contactoWhatsapp,
                    contactoEmail,
                    contactoDireccion,
                    contactoUrlMapa,
                    sobreNosotrosTitulo,
                    sobreNosotrosParrafo1,
                    sobreNosotrosParrafo2,
                    socialInstagramUrl,
                    socialInstagramHandle,
                    socialFacebookUrl,
                    socialTwitterUrl,
                    socialLinkedinUrl,
                    socialTiktokUrl,
                    socialYoutubeUrl,
                    socialOtraUrl,
                    socialOtraEtiqueta,
                    id_empresa,
                }),
            });
            if (!res.ok) throw new Error();
            const respuesta = await res.json();
            if (respuesta?.message !== true) throw new Error();
            toast.success("Datos guardados correctamente.");
        } catch {
            toast.error("No fue posible guardar los datos.");
        } finally {
            setCargando(false);
        }
    }

    const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
    const textareaClass = `${inputClass} resize-none`;
    const labelClass = "text-sm font-medium text-slate-700";

    if (cargandoInicial) {
        return (
            <div className="min-h-screen bg-[#FAFAFB] flex items-center justify-center">
                <p className="text-sm text-slate-400">Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />
            <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">

                {/* Header */}
                <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Datos de la Página Web</h1>
                        <p className="text-sm text-slate-500">
                            Configura el nombre, contacto, redes sociales y textos que se muestran en toda la página pública.
                        </p>
                    </div>
                </div>

                <details className="rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-5 shadow-sm">
                    <summary className="cursor-pointer select-none text-sm font-semibold text-indigo-950">
                        Dónde se usa esta información
                    </summary>
                    <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
                        <p>
                            Los datos que ingreses acá se muestran en la web pública de agendamiento y también se usan en flujos internos de la plataforma, como correos, mensajes de WhatsApp, recordatorios y redirecciones del sitio.
                        </p>
                        <p>
                            El correo de contacto será el correo receptor del equipo: ahí llegarán las notificaciones internas.
                        </p>
                        <p>
                            El número de WhatsApp será el teléfono visible en los mensajes enviados a pacientes y en los recordatorios de citas. Si el WhatsApp queda vacío, se usará el teléfono principal como respaldo.
                        </p>
                        <p>
                            El sitio web / otra URL se usa como URL pública del cliente para redirecciones y enlaces generales de la plataforma.
                        </p>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                            <p className="font-semibold">Importante para el mapa</p>
                            <p className="mt-2">
                                Para que el mapa aparezca dentro del footer (la parte final de la página web), no pegues el link normal de la ubicación. El link normal solo abre Google Maps en otra pestaña. Acá debes pegar el código para insertar el mapa, llamado iframe, o al menos el enlace que viene dentro de ese iframe.
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-red-200 bg-white p-3">
                                    <p className="font-semibold text-red-700">No usar</p>
                                    <p className="mt-1 text-xs text-slate-600">Un link como google.com/maps/place/... sirve para abrir la ubicación, pero no muestra el mapa insertado.</p>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                                    <p className="font-semibold text-emerald-700">Usar</p>
                                    <p className="mt-1 text-xs text-slate-600">El código que empieza con &lt;iframe ...&gt; o el enlace que empieza con https://www.google.com/maps/embed?pb=...</p>
                                </div>
                            </div>
                            <p className="mt-3">
                                Para sacarlo: abre Google Maps, busca la dirección, presiona Compartir, entra a Insertar un mapa, copia el HTML y pégalo en el campo “Mapa de Google Maps”.
                            </p>
                        </div>
                    </div>
                </details>

                {/* Datos generales */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">Datos generales</h2>
                            <p className="text-sm text-slate-500">
                                {/* CONEXIÓN: empresaNombre se usa en Footer.jsx (copyright), FloatingWhatsApp.jsx,
                                    WhatsAppFloatButton.jsx (aria-label) y layout.jsx (metadata del sitio) */}
                                Nombre de la empresa tal como aparece en la web y en los metadatos del sitio.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Nombre de la empresa</label>
                                <input
                                    value={empresaNombre}
                                    onChange={(e) => setEmpresaNombre(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ej: Clínica San Pedro"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contacto */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">Información de contacto</h2>
                            <p className="text-sm text-slate-500">
                                {/* CONEXIÓN: Todos estos campos se leen desde src/lib/publicContact.js y se muestran en:
                                    - Footer.jsx → sección "Contacto" (teléfono, email, dirección)
                                    - src/app/(public)/contacto/page.jsx → página de contacto completa
                                    - FloatingWhatsApp.jsx y WhatsAppFloatButton.jsx → botón flotante
                                    Reemplazar las variables NEXT_PUBLIC_CONTACT_* del .env por este endpoint */}
                                Aparece en el footer (la parte final de la página web), en la página de contacto, en correos internos y en los mensajes de WhatsApp enviados a pacientes.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Teléfono</label>
                                <input value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} className={inputClass} placeholder="+56 9 XXXX XXXX" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>WhatsApp</label>
                                <input value={contactoWhatsapp} onChange={(e) => setContactoWhatsapp(e.target.value)} className={inputClass} placeholder="+56 9 XXXX XXXX" />
                                <p className="text-xs text-slate-400">Si queda vacío se usa el teléfono de arriba.</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Email de contacto</label>
                                <input value={contactoEmail} onChange={(e) => setContactoEmail(e.target.value)} type="email" className={inputClass} placeholder="contacto@clinica.cl" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Dirección física</label>
                                <input value={contactoDireccion} onChange={(e) => setContactoDireccion(e.target.value)} className={inputClass} placeholder="Av. Principal 123, Santiago" />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className={labelClass}>Mapa de Google Maps</label>
                                <input value={contactoUrlMapa} onChange={(e) => setContactoUrlMapa(e.target.value)} className={inputClass} placeholder="https://www.google.com/maps/embed?pb=..." />
                                <p className="text-xs text-slate-400">Pega el iframe completo de Google Maps o el enlace embed que viene dentro del iframe. No uses el link normal de la ubicación.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sobre nosotros */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-slate-900">Sobre nosotros</h2>
                            <p className="text-sm text-slate-500">
                                {/* CONEXIÓN: Estos textos se muestran en:
                                    - src/app/(public)/seccion1/page.jsx → sección "Sobre nosotros" del inicio
                                    - src/app/(public)/portada/page.jsx → título principal del Hero
                                    Actualmente el frontend lee de NEXT_PUBLIC_ABOUT_* (.env) como fallback
                                    y de los endpoints /titulo y /textos del backend antiguo.
                                    Este formulario centraliza todo en /datosEmpresa */}
                                Se muestra en la sección "Acerca de / Sobre nosotros" de la página de inicio.
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Título de la sección</label>
                            <input value={sobreNosotrosTitulo} onChange={(e) => setSobreNosotrosTitulo(e.target.value)} className={inputClass} placeholder="Ej: Clínica San Pedro" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Primer párrafo</label>
                            <textarea value={sobreNosotrosParrafo1} onChange={(e) => setSobreNosotrosParrafo1(e.target.value)} rows={3} className={textareaClass} placeholder="Descripción principal del centro..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Segundo párrafo</label>
                            <textarea value={sobreNosotrosParrafo2} onChange={(e) => setSobreNosotrosParrafo2(e.target.value)} rows={3} className={textareaClass} placeholder="Servicios destacados, horarios u otros detalles..." />
                        </div>
                    </div>
                </div>

                {/* Redes sociales */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-slate-900">Redes sociales</h2>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">opcionales</span>
                            </div>
                            <p className="text-sm text-slate-500">
                                Ingresa solo las redes que uses. Las que queden vacías no aparecerán en la página web.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Instagram — URL del perfil</label>
                                <input value={socialInstagramUrl} onChange={(e) => setSocialInstagramUrl(e.target.value)} className={inputClass} placeholder="https://instagram.com/tuusuario" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Instagram — Handle (@usuario)</label>
                                <input value={socialInstagramHandle} onChange={(e) => setSocialInstagramHandle(e.target.value)} className={inputClass} placeholder="@tuusuario" />
                                <p className="text-xs text-slate-400">Se muestra en el botón flotante y en la página de contacto.</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Facebook — URL del perfil</label>
                                <input value={socialFacebookUrl} onChange={(e) => setSocialFacebookUrl(e.target.value)} className={inputClass} placeholder="https://facebook.com/tuusuario" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Twitter / X — URL del perfil</label>
                                <input value={socialTwitterUrl} onChange={(e) => setSocialTwitterUrl(e.target.value)} className={inputClass} placeholder="https://x.com/tuusuario" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>LinkedIn — URL del perfil</label>
                                <input value={socialLinkedinUrl} onChange={(e) => setSocialLinkedinUrl(e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/tuusuario" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>TikTok — URL del perfil</label>
                                <input value={socialTiktokUrl} onChange={(e) => setSocialTiktokUrl(e.target.value)} className={inputClass} placeholder="https://tiktok.com/@tuusuario" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>YouTube — URL del canal</label>
                                <input value={socialYoutubeUrl} onChange={(e) => setSocialYoutubeUrl(e.target.value)} className={inputClass} placeholder="https://youtube.com/@tucanal" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Sitio web / Otra URL — Nombre / Etiqueta</label>
                                <input value={socialOtraEtiqueta} onChange={(e) => setSocialOtraEtiqueta(e.target.value)} className={inputClass} placeholder="Ej: Threads, Pinterest..." />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className={labelClass}>Sitio web / Otra URL</label>
                                <input value={socialOtraUrl} onChange={(e) => setSocialOtraUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón guardar */}
                <div className="flex justify-end pb-4">
                    <ButtonDinamic
                        onClick={guardarDatosEmpresa}
                        className="rounded-xl bg-black text-white shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        {cargando ? "Guardando..." : "Guardar todos los datos"}
                    </ButtonDinamic>
                </div>

            </div>
        </div>
    );
}
