"use client";

import { useEffect, useState } from "react";

export default function EdicionPagina() {
    const [nuevoTitulo, setNuevoTitulo] = useState("");
    const [mensajeSubTitulo, setmensajeSubTitulo] = useState("");
    const [mensajeSobreNosotros, setmensajeSobreNosotros] = useState("");
    const [mensajeProyectos, setmensajeProyectos] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [MensajeContacto, setMensajeContacto] = useState("");
    const [MensajeTexto1, setMensajeTexto1] = useState("");
    const [MensajeTexto2, setMensajeTexto2] = useState("");

    // Estado para timestamp de última actualización
    const [ultimaActualizacion, setUltimaActualizacion] = useState("");
    // Estados de carga
    const [cargando, setCargando] = useState(false);

    const [nuevoSubtitulo, setNuevoSubtitulo] = useState("");
    const [nuevoSobreNosotros, setNuevoSobreNosotros] = useState("");
    const [nuevoTituloProyecto, setnuevoTituloProyecto] = useState("");
    const [contactoTitulo, setcontactoTitulo] = useState("");
    const [texto1, settexto1] = useState("");
    const [texto2, settexto2] = useState("");
    const [titulo, settitulo] = useState("");
    const [subtitulo, setsubtitulo] = useState("");
    const [sobreNosotros, setsobreNosotros] = useState("");
    const [tituloProyectos, settituloProyectos] = useState("");
    const [tituloContacto, settituloContacto] = useState("");
    const [primerParrafo, setprimerParrafo] = useState("");
    const [segundoParrafo, setsegundoParrafo] = useState("");
    
    const API = process.env.NEXT_PUBLIC_API_URL;

    async function cargarTitulos() {
        try {
            // Usar la constante API en lugar de URL hardcodeada
            const res = await fetch(`${API}/titulo`);
            if (!res.ok) {
                // Manejo suave: mostrar un mensaje en el estado y salir
                settitulo("Problema en consulta a base de datos, contacte equipo de soporte");
                return;
            }
            const data = await res.json();

            let tituloPrincipal = null;
            let subtitulo = null;
            let nosotros = null;
            let tituloProyectos = null;
            let tituloContacto = null;
            let parrafo1 = null;
            let parrafo2 = null;

            if (Array.isArray(data)) {
                const objetoEncontrado1 = data.find(
                    (item) => Number(item.id_titulo) === 1
                );
                const objetoEncontrado2 = data.find(
                    (item) => Number(item.id_titulo) === 2
                );
                const objetoEncontrado3 = data.find(
                    (item) => Number(item.id_titulo) === 3
                );
                const objetoEncontrado4 = data.find(
                    (item) => Number(item.id_titulo) === 4
                );
                const objetoEncontrado5 = data.find(
                    (item) => Number(item.id_titulo) === 5
                );
                const objetoEncontrado6 = data.find(
                    (item) => Number(item.id_titulo) === 6
                );
                const objetoEncontrado7 = data.find(
                    (item) => Number(item.id_titulo) === 7
                );

                tituloPrincipal = objetoEncontrado1;
                subtitulo = objetoEncontrado2;
                nosotros = objetoEncontrado3;
                tituloProyectos = objetoEncontrado4;
                tituloContacto = objetoEncontrado5;
                parrafo1 = objetoEncontrado6;
                parrafo2 = objetoEncontrado7;
            }

            if (tituloPrincipal) {
                if (typeof tituloPrincipal.titulo === "string") {
                    settitulo(tituloPrincipal.titulo);
                }
            }

            if (subtitulo) {
                if (typeof subtitulo.titulo === "string") {
                    setsubtitulo(subtitulo.titulo);
                }
            }

            if (nosotros) {
                if (typeof nosotros.titulo === "string") {
                    setsobreNosotros(nosotros.titulo);
                }
            }

            if (tituloProyectos) {
                if (typeof tituloProyectos.titulo === "string") {
                    settituloProyectos(tituloProyectos.titulo);
                }
            }

            if (tituloContacto) {
                if (typeof tituloContacto.titulo === "string") {
                    settituloContacto(tituloContacto.titulo);
                }
            }

            if (parrafo1) {
                if (typeof parrafo1.titulo === "string") {
                    setprimerParrafo(parrafo1.titulo);
                }
            }

            if (parrafo2) {
                if (typeof parrafo2.titulo === "string") {
                    setsegundoParrafo(parrafo2.titulo);
                }
            }
        } catch (error) {
            settitulo("Problemas en comunicación con el servidor");
        }
    }

    async function cargarTextos() {
        try {
            // Usar la constante API en lugar de URL hardcodeada
            const res = await fetch(`${API}/textos`);
            if (!res.ok) {
                // Manejo suave: escribir en el estado y salir
                settitulo("Problema en consulta a base de datos, contacte equipo de soporte");
                return;
            }
            const data = await res.json();

            let parrafo1 = null;
            let parrafo2 = null;

            if (Array.isArray(data)) {
                const objetoEncontrado1 = data.find(
                    (item) => Number(item.id_Textos) === 1
                );
                const objetoEncontrado2 = data.find(
                    (item) => Number(item.id_Textos) === 2
                );

                parrafo1 = objetoEncontrado1;
                parrafo2 = objetoEncontrado2;
            }

            if (parrafo1) {
                if (typeof parrafo1.contenido === "string") {
                    setprimerParrafo(parrafo1.contenido);
                }
            }

            if (parrafo2) {
                if (typeof parrafo2.contenido === "string") {
                    setsegundoParrafo(parrafo2.contenido);
                }
            }
        } catch (error) {
            settitulo("Problemas en comunicación con el servidor");
        }
    }

    // Carga inicial
    useEffect(() => {
        cargarTitulos();
        cargarTextos();
        setUltimaActualizacion(new Date().toLocaleString('es-CL'));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setCargando(true);

        try {
            // Usar la constante API en lugar de URL hardcodeada
            const res = await fetch(`${API}/titulo`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nuevoTitulo }),
            });

            const data = await res.json();

            if (res.ok) {
                setMensaje("✅ " + (data.message || "Actualizado correctamente"));
                localStorage.setItem('medify-titulo-principal', nuevoTitulo);
                settitulo(nuevoTitulo);
                setNuevoTitulo("");
                setUltimaActualizacion(new Date().toLocaleString('es-CL'));
            } else {
                setMensaje("❌ " + (data.error || "No se pudo actualizar"));
            }
        } catch (err) {
            setMensaje("❌ Error de conexión con el backend");
        } finally {
            setCargando(false);
        }
    }

    async function handleUpdateSubtitulo(e) {
        e.preventDefault();
        setCargando(true);

        try {
            // Usar la constante API en lugar de URL hardcodeada
            const res = await fetch(`${API}/titulo/subtitulo`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nuevoSubtitulo }),
            });

            const data = await res.json();

            if (res.ok) {
                setmensajeSubTitulo("✅ " + (data.message || "Actualizado"));
                localStorage.setItem('medify-subtitulo', nuevoSubtitulo);
                setsubtitulo(nuevoSubtitulo);
                setNuevoSubtitulo("");
                setUltimaActualizacion(new Date().toLocaleString('es-CL'));
            } else {
                setmensajeSubTitulo("❌ " + (data.error || "No se pudo actualizar"));
            }
        } catch (err) {
            setmensajeSubTitulo("❌ Error de conexión con el backend");
        } finally {
            setCargando(false);
        }
    }

    async function handleUpdateSobreNosotros(event) {
        event.preventDefault();
        if (!nuevoSobreNosotros || !nuevoSobreNosotros.trim()) {
            setmensajeSobreNosotros("⚠️ Debes escribir un texto para 'Sobre nosotros'");
            return;
        }
        setCargando(true);
        try {
            // Usar la constante API en lugar de URL hardcodeada
            const res = await fetch(`${API}/titulo/sobrenosotros`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nuevoSobreNosotros: (nuevoSobreNosotros || "").trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setmensajeSobreNosotros("✅ " + (data.message || "Actualizado"));
                setsobreNosotros(nuevoSobreNosotros.trim());
                setNuevoSobreNosotros("");
                setUltimaActualizacion(new Date().toLocaleString('es-CL'));
            } else {
                setmensajeSobreNosotros("❌ " + (data.error || "No se pudo actualizar"));
            }
        } catch (err) {
            setmensajeSobreNosotros("❌ Error de conexión con el backend");
        } finally {
            setCargando(false);
        }
    }

    async function handleSubmitProyectos(evento) {
        evento.preventDefault();
        setCargando(true);

        try {
            const res = await fetch(`${API}/titulo/proyectos`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nuevoTituloProyecto }),
            });

            const data = await res.json();

            if (res.ok) {
                setmensajeProyectos(
                    (data.message) || "✅ Se ha cambiado el titulo de la seccion Portafolio/Proyectos"
                );
                setnuevoTituloProyecto("");
                setUltimaActualizacion(new Date().toLocaleString('es-CL'));
            } else {
                setmensajeProyectos("❌ " + (data.error || "No se ha podido cambiar el titulo"));
            }
        } catch (error) {
            setmensajeProyectos("❌ Error de conexión con el backend");
        } finally {
            setCargando(false);
        }
    }

    async function handleSubmitContacto(evento) {
        evento.preventDefault();
        setCargando(true);

        try {
            const res = await fetch(`${API}/titulo/contacto`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contactoTitulo }),
            });

            const data = await res.json();

            if (res.ok) {
                setMensajeContacto("✅ " + (data.message || "Se ha cambiado el titulo de la seccion Contacto"));
                settituloContacto(contactoTitulo);
                setcontactoTitulo("");
                setUltimaActualizacion(new Date().toLocaleString('es-CL'));
            } else {
                setMensajeContacto("❌ " + (data.error || "No se ha podido cambiar el titulo de la seccion Contacto"));
            }
        } catch (err) {
            setMensajeContacto("❌ Error de conexión con el backend");
        } finally {
            setCargando(false);
        }
    }

    async function handleSubmitText1(event) {
        event.preventDefault();
        setCargando(true);

        try {
            const res = await fetch(`${API}/textos/texto1`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texto1 }),
            });

            const data = await res.json();

            if (res.ok) {
                setMensajeTexto1("✅ " + (data.message || "Parrafo cambiado correctamente"));
                settexto1("");
                setUltimaActualizacion(new Date().toLocaleString('es-CL'));
            } else {
                setMensajeTexto1("❌ " + (data.error || "No se pudo actualizar"));
            }
        } catch (err) {
            setMensajeTexto1("❌ Error de conexión con el backend");
        } finally {
            setCargando(false);
        }
    }

    async function handleSubmitText2(event) {
        event.preventDefault();

        try {
            // Usar la constante API en lugar de URL hardcodeada
            const res = await fetch(`${API}/textos/texto2`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texto2 }),
            });
            const data = await res.json();

            if (res.ok) {
                setMensajeTexto2("✅ " + (data.message || "Parrafo cambiado correctamente"));
            } else {
                setMensajeTexto2("❌ " + (data.error || "No se pudo actualizar"));
            }
        } catch (err) {
            setMensajeTexto2("Error de conexión con el backend");
        }
    }


    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

                {/* ── Header ── */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuración Web</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Gestión de <span className="text-[#6E56CF]">Contenido</span>
                        </h1>
                        <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
                            Personaliza los textos y contenido de la página web pública.
                        </p>
                    </div>
                    <div className="h-12 px-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center shadow-sm shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Última actualización</span>
                        <span suppressHydrationWarning className="text-[12px] font-bold text-slate-700 mt-0.5 leading-none">{ultimaActualizacion || '—'}</span>
                    </div>
                </div>

                <div className="grid gap-6">

                    {/* ── Título Principal ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Título Principal</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{titulo || 'No hay título configurado'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo Título</label>
                                    <textarea value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} placeholder="Escribe el nuevo título"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={3} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Cambios
                                    </button>
                                    {mensaje && <p className={`text-[12px] font-medium ${mensaje.startsWith('✅') ? 'text-emerald-700' : 'text-amber-700'}`}>{mensaje}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Subtítulo ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Subtítulo</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{subtitulo || '—'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleUpdateSubtitulo} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo Subtítulo</label>
                                    <textarea value={nuevoSubtitulo} onChange={(e) => setNuevoSubtitulo(e.target.value)} placeholder="Escribe el nuevo subtítulo"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={3} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Subtítulo
                                    </button>
                                    {mensajeSubTitulo && <p className="text-[12px] font-medium text-slate-600">{mensajeSubTitulo}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Sobre nosotros ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Título: Acerca de</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{sobreNosotros || '—'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleUpdateSobreNosotros} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo texto</label>
                                    <textarea value={nuevoSobreNosotros} onChange={(event) => setNuevoSobreNosotros(event.target.value)} placeholder="Escribe el nuevo 'Sobre nosotros'"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={3} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Sobre Nosotros
                                    </button>
                                    {mensajeSobreNosotros && <p className="text-[12px] font-medium text-slate-600">{mensajeSobreNosotros}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Título Proyectos ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Título: Proyectos</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{tituloProyectos || '—'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmitProyectos} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo título</label>
                                    <textarea value={nuevoTituloProyecto} onChange={(evento) => setnuevoTituloProyecto(evento.target.value)} placeholder="Nuevo titulo de la seccion Proyectos"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={2} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Título Proyecto
                                    </button>
                                    {mensajeProyectos && <p className="text-[12px] font-medium text-slate-600">{mensajeProyectos}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Título Contacto ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Título: Contacto</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{tituloContacto || '—'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmitContacto} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo título</label>
                                    <textarea value={contactoTitulo} onChange={(evento) => setcontactoTitulo(evento.target.value)} placeholder="Nuevo titulo de la seccion contacto"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={2} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Título Contacto
                                    </button>
                                    {MensajeContacto && <p className="text-[12px] font-medium text-slate-600">{MensajeContacto}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Párrafo 1 ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Primer Párrafo</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{primerParrafo || '—'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmitText1} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo texto</label>
                                    <textarea value={texto1} onChange={(event) => settexto1(event.target.value)} placeholder="Nuevo texto Párrafo"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={4} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Párrafo
                                    </button>
                                    {MensajeTexto1 && <p className="text-[12px] font-medium text-slate-600">{MensajeTexto1}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Párrafo 2 ── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Segundo Párrafo</h2>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto actual</label>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-700">{segundoParrafo || '—'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmitText2} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nuevo texto</label>
                                    <textarea value={texto2} onChange={(event) => settexto2(event.target.value)} placeholder="Nuevo texto Párrafo"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#6E56CF] focus:outline-none focus:ring-2 focus:ring-violet-50" rows={4} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button type="submit" disabled={cargando}
                                        className="h-10 px-6 rounded-xl bg-[#6E56CF] text-[12px] font-bold text-white hover:bg-[#5b45bc] transition-all disabled:opacity-50">
                                        Guardar Párrafo
                                    </button>
                                    {MensajeTexto2 && <p className="text-[12px] font-medium text-slate-600">{MensajeTexto2}</p>}
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}