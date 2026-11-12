"use client";

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { etiquetaDocumento, formatearDocumento } from "@/lib/rut";
import { claveFechaCivil, formatearFechaCivil } from "@/lib/fechas";
import FichaClinicaModal from "@/Componentes/FichaClinicaModal";
import ToasterClient from "@/Componentes/ToasterClient";
import TelemedicinaSala from "@/Componentes/TelemedicinaSala";

export default function Telemedicina() {
    const { id_paciente } = useParams();
    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL;
    const { user, isLoaded: usuarioCargado } = useUser();

    const [paciente, setPaciente] = useState(null);
    const [pacienteCargando, setPacienteCargando] = useState(true);

    // ── Historial de fichas (el mismo de la carpeta del paciente) ──
    const [listaFichas, setListaFichas] = useState([]);
    const [cargandoFichas, setCargandoFichas] = useState(true);
    const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
    const [fichasExpandidas, setFichasExpandidas] = useState(new Set());

    // Mismos helpers que la carpeta del paciente: el backend guarda los campos
    // de la plantilla como JSON en datosDinamicos, agrupados por categoría.
    function parsearDatosDinamicos(datos) {
        if (!datos) return null
        let parsed = datos
        if (typeof datos === "string") {
            try { parsed = JSON.parse(datos) } catch { return null }
        }
        if (!parsed || typeof parsed !== "object") return null
        return parsed
    }

    function agruparPorCategoria(datos) {
        const categoriasMap = {}

        Object.keys(datos).forEach(key => {
            if (key === "_plantillaNombre") return
            const entry = datos[key]
            if (!entry || typeof entry !== "object" || !entry.nombreCategoria) return

            const catNombre = entry.nombreCategoria
            if (!categoriasMap[catNombre]) {
                categoriasMap[catNombre] = {
                    nombre: catNombre,
                    orden: entry.categoriaOrden || 0,
                    campos: []
                }
            }
            categoriasMap[catNombre].campos.push({
                nombre: entry.nombreCampo,
                valor: entry.valor,
                orden: entry.campoOrden || 0
            })
        })

        return Object.values(categoriasMap)
            .sort((a, b) => a.orden - b.orden)
            .map(cat => ({
                ...cat,
                campos: cat.campos.sort((a, b) => a.orden - b.orden)
            }))
    }

    async function listarFichas() {
        if (!id_paciente) return;
        setCargandoFichas(true);
        try {
            const res = await fetch(`${API}/ficha/seleccionarFichasPaciente`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id_paciente }),
                mode: "cors"
            })

            if (!res.ok) {
                setListaFichas([]);
                return;
            }

            const data = await res.json();
            const lista = Array.isArray(data) ? data : [];
            setListaFichas(lista);

            // Auto-expandir la más reciente: en teleconsulta lo normal es querer
            // ver de inmediato la última ficha (o la recién guardada).
            if (lista.length > 0) {
                const ordenada = [...lista].sort((a, b) => {
                    const fechaA = claveFechaCivil(a.fechaConsulta);
                    const fechaB = claveFechaCivil(b.fechaConsulta);
                    if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
                    return Number(b.id_ficha) - Number(a.id_ficha);
                });
                setFichasExpandidas(new Set([ordenada[0].id_ficha]));
            }
        } catch (error) {
            console.log(error);
            setListaFichas([]);
        } finally {
            setCargandoFichas(false);
        }
    }

    function toggleFichaExpandida(id_ficha) {
        setFichasExpandidas(prev => {
            const next = new Set(prev);
            if (next.has(id_ficha)) {
                next.delete(id_ficha);
            } else {
                next.add(id_ficha);
            }
            return next;
        });
    }

    // Mismo patrón que la carpeta del paciente: pacientesEspecifico por id.
    useEffect(() => {
        if (!id_paciente) return;
        let vigente = true;
        (async () => {
            try {
                const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ id_paciente })
                });
                if (!vigente) return;
                if (!res.ok) throw new Error("respuesta no ok");
                const data = await res.json();
                setPaciente(Array.isArray(data) ? data[0] : data);
            } catch (error) {
                console.log(error);
                if (vigente) setPaciente(null);
            } finally {
                if (vigente) setPacienteCargando(false);
            }
        })();
        return () => { vigente = false; };
    }, [id_paciente]);

    useEffect(() => {
        listarFichas();
    }, [id_paciente]);

    const nombreCompleto = paciente ? `${paciente.nombre || ""} ${paciente.apellido || ""}`.trim() : "";
    const iniciales = `${paciente?.nombre?.charAt(0) || ""}${paciente?.apellido?.charAt(0) || ""}`.toUpperCase();

    // Se ordenan como texto "AAAA-MM-DD" para no pasar por Date, que desplaza
    // el día según la zona horaria. Más recientes primero.
    const fichasOrdenadas = [...listaFichas].sort((a, b) => {
        const fechaA = claveFechaCivil(a.fechaConsulta);
        const fechaB = claveFechaCivil(b.fechaConsulta);
        if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
        return Number(b.id_ficha) - Number(a.id_ficha);
    });








    return (
        <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
            <ToasterClient/>

            {/* Con el cajon de ficha abierto, el contenido se corre a la izquierda
                (lg:pr-[512px]) para que la camara quede a la vista al lado del
                formulario. El padding transiciona en 300ms, junto con la entrada
                del cajon. En pantallas menores a lg el cajon cubre la pantalla:
                ahi no hay ancho de sobra. */}
            <div className={`flex-1 mx-auto w-full max-w-5xl px-4 py-6 transition-[padding] duration-300 ease-out md:px-8 md:py-10 ${modalFichaAbierto ? "lg:pr-[512px]" : ""}`}>

                {/* ── Encabezado ── */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/FichasPacientes/${id_paciente}`)}
                        aria-label="Volver a la carpeta del paciente"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#007AFF] ring-1 ring-black/[0.06] transition-colors hover:bg-[#007AFF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-[24px] font-semibold tracking-tight text-[#1D1D1F]">
                            {pacienteCargando ? "Cargando…" : nombreCompleto || "Paciente"}
                        </h1>
                        {!pacienteCargando && paciente && (
                            <p className="mt-0.5 truncate text-[13px] text-[#86868B]">
                                Telemedicina
                                <span className="mx-1.5 text-[#C7C7CC]">·</span>
                                {etiquetaDocumento(paciente.tipo_documento)} <span className="tabular-nums text-[#6E6E73]">{formatearDocumento(paciente.rut, paciente.tipo_documento) || "—"}</span>
                            </p>
                        )}
                    </div>
                    {/* Avatar con las iniciales, mismo estilo que la carpeta del paciente. */}
                    {paciente && (
                        <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E5E5EA] text-[15px] font-semibold text-[#6E6E73]">
                            {iniciales}
                        </div>
                    )}
                </div>

                <TelemedicinaSala
                    modo="profesional"
                    identidad={user?.id}
                    nombreProfesional={user?.fullName || user?.firstName || ""}
                />


                {/* ── Historial de fichas clínicas (el mismo de la carpeta del paciente) ── */}
                <div className="mt-10">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h2 className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-[#1D1D1F]">Historial de fichas clínicas</h2>
                        <span className="flex h-6 items-center justify-center rounded-full bg-[#F2F2F7] px-2.5 text-[12px] font-medium text-[#6E6E73]">
                            {listaFichas.length} registro{listaFichas.length === 1 ? "" : "s"}
                        </span>
                        {/* El mismo botón de "nueva ficha" de la carpeta: abre el mismo
                            popup (FichaClinicaModal) para registrar la consulta de acá mismo. */}
                        <button
                            onClick={() => setModalFichaAbierto(true)}
                            className="ml-auto flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-[#007AFF] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva ficha
                        </button>
                    </div>

                    {cargandoFichas ? (
                        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
                            <p className="text-sm text-slate-400">Cargando historial de fichas…</p>
                        </div>
                    ) : fichasOrdenadas.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                            <p className="text-sm font-medium text-slate-400">Este paciente aún no tiene fichas clínicas.</p>
                            <p className="mt-1 text-[12px] text-[#86868B]">Usa «Nueva ficha» para registrar esta consulta.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fichasOrdenadas.map((ficha) => {
                                const expandida = fichasExpandidas.has(ficha.id_ficha);
                                const datos = parsearDatosDinamicos(ficha.datosDinamicos);
                                return (
                                    <div key={ficha.id_ficha} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
                                        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[15px] font-medium text-[#1D1D1F]">
                                                    {datos?._plantillaNombre || ficha.tipoAtencion || "Consulta General"}
                                                </p>
                                                <p className="mt-0.5 truncate text-[13px] text-[#86868B]">
                                                    {formatearFechaCivil(ficha.fechaConsulta)}
                                                    <span className="mx-1.5 text-slate-300">·</span>
                                                    Prof. {ficha.observaciones || "No informado"}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[12px] tabular-nums text-[#86868B]">
                                                N° {ficha.id_ficha}
                                            </span>
                                            <button
                                                onClick={() => toggleFichaExpandida(ficha.id_ficha)}
                                                className="h-9 shrink-0 rounded-full bg-[#007AFF]/10 px-4 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40"
                                            >
                                                {expandida ? "Ocultar" : "Ver detalle"}
                                            </button>
                                        </div>

                                        {expandida && (
                                            <div className="border-t border-black/[0.06] bg-[#FBFBFD] p-5">
                                                {datos && datos._plantillaNombre ? (
                                                    <div className="space-y-5">
                                                        {agruparPorCategoria(datos).map((cat) => (
                                                            <div key={cat.nombre} className="space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[13px] font-semibold text-[#1D1D1F]">{cat.nombre}</span>
                                                                    <div className="h-px flex-1 bg-black/[0.06]" />
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    {cat.campos.map((campo, idx) => (
                                                                        <div key={idx} className="rounded-xl bg-white p-3.5 ring-1 ring-black/[0.06]">
                                                                            <span className="text-[12px] text-[#86868B]">{campo.nombre}</span>
                                                                            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#1D1D1F]">{campo.valor || "-"}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="py-2 text-center text-sm italic text-slate-400">No hay datos estructurados en esta ficha.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* El mismo popup de nueva ficha que usa la carpeta del paciente,
                pero en variante lateral (cajon derecho): asi la videoconsulta
                sigue a la vista mientras se llena la ficha. */}
            <FichaClinicaModal
                abierto={modalFichaAbierto}
                lateral
                paciente={paciente}
                id_paciente={id_paciente}
                idProfesionalAgendaAsignada={String(user?.publicMetadata?.idProfesionalAgenda || "").trim()}
                usuarioCargado={usuarioCargado}
                onCerrar={() => setModalFichaAbierto(false)}
                onGuardada={() => listarFichas()}
            />
        </div>
    )
}
