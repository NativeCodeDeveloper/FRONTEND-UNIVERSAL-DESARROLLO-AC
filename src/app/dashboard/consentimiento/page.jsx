"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import PadFirma from "@/Componentes/firma/PadFirma";
import VisorPdf from "@/Componentes/documentos/VisorPdf";
import ToasterClient from "@/Componentes/ToasterClient";
import { validarFirma } from "@/lib/firma/procesarTrazo";
import { useDatosEmpresa } from "@/hooks/useDatosEmpresa";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useProcedimientos } from "@/hooks/useProcedimientos";
import { useSesionProfesional } from "@/hooks/useSesionProfesional";
import { datosProfesionalParaDocumento, profesionalPorId } from "@/lib/profesional";
import { formatRut } from "@/lib/designTokens";
import { bloquesDeTexto } from "@/lib/consentimientos/textosLegales";
import { renderizarConsentimiento } from "@/lib/consentimientos/plantillasProcedimiento";
import { PROCEDIMIENTOS_EN_SERVIDOR } from "@/lib/consentimientos/apiProcedimientos";
import { generarConsentimientoInformadoPdf } from "@/lib/documentos/generadores/consentimientoInformado";
import { formatearFechaCivil, formatearFechaLargaCivil, hoyCivil, ZONA_CLINICA } from "@/lib/fechas";
import { imprimirPdf } from "@/lib/documentos/imprimirPdf";

const campo = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#6E56CF] focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-500";
const etiqueta = "mb-1.5 block text-xs font-semibold text-slate-700";

function horaClinica() {
    return new Intl.DateTimeFormat("es-CL", {
        timeZone: ZONA_CLINICA,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(new Date());
}

export default function PaginaConsentimiento() {
    return (
        <Suspense fallback={<div className="p-8 text-sm text-slate-500">Cargando consentimiento…</div>}>
            <ModuloConsentimiento />
        </Suspense>
    );
}

function ModuloConsentimiento() {
    const router = useRouter();
    const idPaciente = useSearchParams().get("id_paciente");
    const API = process.env.NEXT_PUBLIC_API_URL;
    const empresa = useDatosEmpresa();
    const profesionales = useProfesionales();
    const sesion = useSesionProfesional();
    const { procedimientos, cargando: cargandoProcedimientos, error: errorProcedimientos, recargar: recargarProcedimientos } = useProcedimientos();
    const firmaPacienteRef = useRef(null);
    const firmaProfesionalRef = useRef(null);
    const guardadoEnCursoRef = useRef(false);

    const [paciente, setPaciente] = useState(null);
    const [cargandoPaciente, setCargandoPaciente] = useState(true);
    const [errorPaciente, setErrorPaciente] = useState("");
    const [archivos, setArchivos] = useState([]);
    const [idProfesional, setIdProfesional] = useState("");
    const [codigoAnexo, setCodigoAnexo] = useState("");
    const [fecha, setFecha] = useState(hoyCivil);
    const [hora, setHora] = useState(horaClinica);
    const [centro, setCentro] = useState("");
    const [motivo, setMotivo] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [conRepresentante, setConRepresentante] = useState(false);
    const [representante, setRepresentante] = useState({ nombre: "", documento: "" });
    const [aceptacion, setAceptacion] = useState(false);
    const [documentoRevisado, setDocumentoRevisado] = useState(false);
    const [tintaPaciente, setTintaPaciente] = useState("azul");
    const [tintaProfesional, setTintaProfesional] = useState("azul");
    const [firmaPacienteVacia, setFirmaPacienteVacia] = useState(true);
    const [firmaProfesionalVacia, setFirmaProfesionalVacia] = useState(true);
    const [vistaPrevia, setVistaPrevia] = useState(null);
    const [archivoFirmado, setArchivoFirmado] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [imprimiendo, setImprimiendo] = useState(false);
    const [error, setError] = useState("");
    const [enlaceImpresion, setEnlaceImpresion] = useState("");

    useEffect(() => {
        if (!idPaciente || !/^\d+$/.test(idPaciente) || !API) {
            setErrorPaciente("Abre el consentimiento desde la ficha de un paciente.");
            setCargandoPaciente(false);
            return;
        }
        const controlador = new AbortController();
        async function cargarPaciente() {
            setCargandoPaciente(true);
            setErrorPaciente("");
            try {
                const respuesta = await fetch(API + "/pacientes/pacientesEspecifico", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id_paciente: idPaciente }),
                    signal: controlador.signal,
                });
                if (!respuesta.ok) throw new Error("No se pudo cargar al paciente.");
                const datos = await respuesta.json();
                const encontrado = Array.isArray(datos) ? datos[0] : datos;
                if (!encontrado?.id_paciente) throw new Error("No se encontró al paciente.");
                setPaciente(encontrado);
            } catch (e) {
                if (!controlador.signal.aborted) setErrorPaciente(e.message || "No se pudo cargar al paciente.");
            } finally {
                if (!controlador.signal.aborted) setCargandoPaciente(false);
            }
        }
        cargarPaciente();
        return () => controlador.abort();
    }, [API, idPaciente]);

    const cargarArchivos = useCallback(async () => {
        if (!idPaciente || !API) return;
        try {
            const respuesta = await fetch(API + "/archivoPaciente/listar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_paciente: idPaciente }),
            });
            if (!respuesta.ok) return;
            const datos = await respuesta.json();
            setArchivos(Array.isArray(datos)
                ? datos.filter((item) => String(item.nombre_documento || "").startsWith("Consentimiento informado - "))
                : []);
        } catch {
            setArchivos([]);
        }
    }, [API, idPaciente]);

    useEffect(() => { cargarArchivos(); }, [cargarArchivos]);
    useEffect(() => {
        if (sesion.idProfesional) setIdProfesional((actual) => actual || String(sesion.idProfesional));
    }, [sesion.idProfesional]);
    useEffect(() => {
        if (empresa.empresaNombre) setCentro((actual) => actual || empresa.empresaNombre);
    }, [empresa.empresaNombre]);

    const anexo = procedimientos.find((item) => item.codigo === codigoAnexo);
    const profesionalRegistrado = profesionalPorId(profesionales, idProfesional);
    const profesional = profesionalRegistrado ? datosProfesionalParaDocumento(profesionalRegistrado) : null;
    const datosPaciente = paciente ? {
        nombre: [paciente.nombre, paciente.apellido].filter(Boolean).join(" ").trim(),
        documento: paciente.rut
            ? (paciente.tipo_documento === "pasaporte" ? "Pasaporte " + paciente.rut : "RUT " + (formatRut(paciente.rut) || paciente.rut))
            : "",
        representante: conRepresentante ? {
            nombre: representante.nombre.trim(),
            documento: representante.documento.trim() ? "RUT " + representante.documento.trim() : "",
        } : null,
    } : null;
    const texto = anexo && datosPaciente
        ? renderizarConsentimiento({ anexo, empresa, profesional: profesional || {}, paciente: datosPaciente, observaciones })
        : "";
    const bloqueado = Boolean(archivoFirmado);

    useEffect(() => {
        if (archivoFirmado) return;
        setDocumentoRevisado(false);
        setVistaPrevia(null);
        setAceptacion(false);
        firmaPacienteRef.current?.limpiar();
        firmaProfesionalRef.current?.limpiar();
    }, [texto, archivoFirmado]);

    function cambiar(actualizar, valor) {
        actualizar(valor);
        setVistaPrevia(null);
        setDocumentoRevisado(false);
        setAceptacion(false);
        firmaPacienteRef.current?.limpiar();
        firmaProfesionalRef.current?.limpiar();
        setError("");
    }

    function validarDatos() {
        if (!paciente || !datosPaciente?.nombre || !datosPaciente.documento) return "Faltan datos de identificación del paciente.";
        if (!anexo) return "Selecciona el procedimiento.";
        if (!profesional?.nombre || !profesional.rut) return "Selecciona un profesional con nombre y RUT registrados.";
        if (!fecha || !hora || !centro.trim() || !motivo.trim()) return "Completa la fecha, hora, centro y motivo de la consulta.";
        if (conRepresentante && (!representante.nombre.trim() || !representante.documento.trim())) return "Completa el nombre y RUT del representante.";
        return "";
    }

    function generarPdf(firmas = null) {
        return generarConsentimientoInformadoPdf({
            modo: "manuscrita",
            borrador: false,
            empresa,
            texto,
            procedimiento: anexo.nombre,
            paciente: datosPaciente,
            profesional,
            fechaEmisionTexto: formatearFechaLargaCivil(fecha),
            consulta: {
                fecha: formatearFechaCivil(fecha),
                hora,
                centro: centro.trim(),
                motivo: motivo.trim(),
            },
            firmas,
        }).blob;
    }

    function previsualizar() {
        const falta = archivoFirmado ? "" : validarDatos();
        if (falta) { setError(falta); return; }
        try {
            setVistaPrevia(archivoFirmado?.blob || generarPdf());
            setDocumentoRevisado(true);
            setError("");
        } catch {
            setError("No se pudo generar la vista previa.");
        }
    }

    async function imprimir() {
        const falta = archivoFirmado ? "" : validarDatos();
        if (falta) { setError(falta); return; }
        setImprimiendo(true);
        setError("");
        try {
            const resultado = await imprimirPdf(archivoFirmado?.blob || generarPdf());
            setEnlaceImpresion(resultado.modo === "bloqueado" ? resultado.url : "");
        } catch {
            setError("No se pudo abrir la impresión.");
        } finally {
            setImprimiendo(false);
        }
    }

    async function guardarFirmado() {
        if (guardadoEnCursoRef.current || archivoFirmado) return;
        const falta = validarDatos();
        if (falta) { setError(falta); return; }
        if (!documentoRevisado) { setError("Abre y revisa la vista previa del PDF antes de firmar."); return; }
        if (!aceptacion) { setError("Confirma que el paciente revisó el documento y expresó su decisión."); return; }
        const errorPacienteFirma = validarFirma(firmaPacienteRef.current?.trazos() || []);
        const errorProfesionalFirma = validarFirma(firmaProfesionalRef.current?.trazos() || []);
        if (errorPacienteFirma || errorProfesionalFirma) {
            setError(errorPacienteFirma ? "Firma del paciente: " + errorPacienteFirma : "Firma del profesional: " + errorProfesionalFirma);
            return;
        }
        guardadoEnCursoRef.current = true;
        setGuardando(true);
        setError("");
        try {
            const [salidaPaciente, salidaProfesional] = await Promise.all([
                firmaPacienteRef.current.exportar(),
                firmaProfesionalRef.current.exportar(),
            ]);
            if (!salidaPaciente || !salidaProfesional) throw new Error("No se pudieron leer las firmas.");
            const [datosFirmaPaciente, datosFirmaProfesional] = await Promise.all([
                salidaPaciente.blob.arrayBuffer(),
                salidaProfesional.blob.arrayBuffer(),
            ]);
            URL.revokeObjectURL(salidaPaciente.url);
            URL.revokeObjectURL(salidaProfesional.url);
            const blob = generarPdf({
                paciente: { datos: new Uint8Array(datosFirmaPaciente), ancho: salidaPaciente.ancho, alto: salidaPaciente.alto },
                profesional: { datos: new Uint8Array(datosFirmaProfesional), ancho: salidaProfesional.ancho, alto: salidaProfesional.alto },
            });
            const nombre = "consentimiento_" + idPaciente + "_" + fecha + "_" + Date.now() + ".pdf";
            const formulario = new FormData();
            formulario.append("archivo", new File([blob], nombre, { type: "application/pdf" }));
            formulario.append("id_paciente", idPaciente);
            formulario.append("profesional", profesional.nombre);
            formulario.append("nombre_documento", "Consentimiento informado - " + anexo.nombre + " - " + formatearFechaCivil(fecha) + ".pdf");
            const respuesta = await fetch(API + "/archivoPaciente/subir", { method: "POST", body: formulario });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.ok) throw new Error("No se pudo guardar el documento en la ficha del paciente.");
            setArchivoFirmado({ blob, id: resultado.id_archivo, nombre });
            setVistaPrevia(blob);
            await cargarArchivos();
        } catch (e) {
            setError(e.message || "No se pudo guardar el consentimiento.");
        } finally {
            guardadoEnCursoRef.current = false;
            setGuardando(false);
        }
    }

    function descargarFirmado() {
        if (!archivoFirmado) return;
        const url = URL.createObjectURL(archivoFirmado.blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = archivoFirmado.nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    async function abrirArchivado(archivo) {
        const ventana = window.open("about:blank", "_blank");
        try {
            const respuesta = await fetch(API + "/archivoPaciente/descargar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_archivo: archivo.id_archivo }),
            });
            const datos = await respuesta.json();
            if (!respuesta.ok || !datos.ok || !datos.url) throw new Error("No se pudo abrir el documento.");
            if (ventana) ventana.location.href = datos.url;
            else setError("El navegador bloqueó la pestaña del documento. Permite ventanas emergentes e inténtalo nuevamente.");
        } catch {
            ventana?.close();
            setError("No se pudo abrir el documento archivado.");
        }
    }

    function nuevoDocumento() {
        setArchivoFirmado(null);
        setVistaPrevia(null);
        setDocumentoRevisado(false);
        setAceptacion(false);
        setError("");
        firmaPacienteRef.current?.limpiar();
        firmaProfesionalRef.current?.limpiar();
    }

    return (
        <main className="min-h-screen bg-[#FAFAFB] px-4 pb-14 pt-6 text-slate-900 sm:px-6 lg:px-8">
            <ToasterClient />
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E56CF]">Documentación clínica</p>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Consentimiento informado</h1>
                        <p className="mt-2 text-sm text-slate-500">Completa la atención, revisa el documento y recoge ambas firmas en la tablet.</p>
                    </div>
                    <button type="button" onClick={() => router.push(idPaciente ? "/dashboard/FichasPacientes/" + idPaciente : "/dashboard")} className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Volver a la ficha
                    </button>
                </header>

                {error ? <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

                {cargandoPaciente ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando datos del paciente…</p> : null}
                {errorPaciente ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{errorPaciente}</p> : null}
                {paciente ? (
                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)]">
                        <div className="space-y-5">
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">01</span><h2 className="font-semibold">Datos del paciente</h2></div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2"><span className={etiqueta}>Nombre completo</span><p className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium">{datosPaciente.nombre}</p></div>
                                    <div><span className={etiqueta}>Documento</span><p className="rounded-xl bg-slate-50 px-3 py-3 text-sm">{datosPaciente.documento || "Sin registrar"}</p></div>
                                    <div><span className={etiqueta}>Nacimiento</span><p className="rounded-xl bg-slate-50 px-3 py-3 text-sm">{formatearFechaCivil(paciente.nacimiento, "Sin registrar")}</p></div>
                                </div>
                                <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
                                    <input type="checkbox" checked={conRepresentante} disabled={bloqueado} onChange={(e) => cambiar(setConRepresentante, e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6E56CF]" />
                                    Firma un representante legal
                                </label>
                                {conRepresentante ? (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <label><span className={etiqueta}>Nombre del representante</span><input value={representante.nombre} disabled={bloqueado} onChange={(e) => cambiar(setRepresentante, { ...representante, nombre: e.target.value })} className={campo} /></label>
                                        <label><span className={etiqueta}>RUT del representante</span><input value={representante.documento} disabled={bloqueado} onChange={(e) => cambiar(setRepresentante, { ...representante, documento: e.target.value })} className={campo} /></label>
                                    </div>
                                ) : null}
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">02</span><h2 className="font-semibold">Profesional tratante</h2></div>
                                <label><span className={etiqueta}>Profesional</span>
                                    <select value={idProfesional} disabled={bloqueado} onChange={(e) => cambiar(setIdProfesional, e.target.value)} className={campo}>
                                        <option value="">Selecciona un profesional</option>
                                        {profesionales.map((item) => <option key={item.id_profesional} value={item.id_profesional}>{item.nombreProfesional}</option>)}
                                    </select>
                                </label>
                                {profesional ? <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2"><p>RUT: <strong className="text-slate-900">{profesional.rut || "Sin registrar"}</strong></p><p>Registro: <strong className="text-slate-900">{profesional.registroSis || "Sin registrar"}</strong></p><p className="sm:col-span-2">Especialidad: <strong className="text-slate-900">{profesional.especialidad || "Sin registrar"}</strong></p></div> : null}
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">03</span><h2 className="font-semibold">Datos de la consulta</h2></div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label><span className={etiqueta}>Fecha</span><input type="date" value={fecha} disabled={bloqueado} onChange={(e) => cambiar(setFecha, e.target.value)} className={campo} /></label>
                                    <label><span className={etiqueta}>Hora</span><input type="time" value={hora} disabled={bloqueado} onChange={(e) => cambiar(setHora, e.target.value)} className={campo} /></label>
                                    <label className="sm:col-span-2"><span className={etiqueta}>Centro o sede</span><input value={centro} disabled={bloqueado} onChange={(e) => cambiar(setCentro, e.target.value)} className={campo} /></label>
                                    <label className="sm:col-span-2"><span className={etiqueta}>Procedimiento</span>
                                        <select value={codigoAnexo} disabled={bloqueado || cargandoProcedimientos} onChange={(e) => cambiar(setCodigoAnexo, e.target.value)} className={campo}>
                                            <option value="">{cargandoProcedimientos ? "Cargando procedimientos…" : "Selecciona un procedimiento"}</option>
                                            {procedimientos.map((item) => <option key={item.codigo} value={item.codigo}>{item.grupo} · {item.nombre}</option>)}
                                        </select>
                                        {errorProcedimientos ? <span className="mt-2 block text-xs text-red-700">No se pudieron cargar las plantillas vigentes. <button type="button" onClick={recargarProcedimientos} className="font-semibold underline">Reintentar</button></span> : null}
                                        {!PROCEDIMIENTOS_EN_SERVIDOR ? <span className="mt-2 block text-xs leading-5 text-amber-800">Esta instancia usa textos de procedimiento de ejemplo. Revisa su contenido y ajusta las observaciones del caso antes de recoger las firmas.</span> : null}
                                    </label>
                                    <label className="sm:col-span-2"><span className={etiqueta}>Motivo de consulta</span><input value={motivo} disabled={bloqueado} onChange={(e) => cambiar(setMotivo, e.target.value)} className={campo} /></label>
                                    <label className="sm:col-span-2"><span className={etiqueta}>Observaciones y riesgos del caso</span><textarea rows={4} maxLength={1500} value={observaciones} disabled={bloqueado} onChange={(e) => cambiar(setObservaciones, e.target.value)} className={campo + " h-auto min-h-28 py-3"} placeholder="Antecedentes o riesgos particulares informados al paciente" /></label>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-5">
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                                    <div><h2 className="text-sm font-semibold">Documento para revisión</h2><p className="mt-1 text-xs text-slate-500">Texto específico del procedimiento y PDF imprimible.</p></div>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={previsualizar} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Vista previa PDF</button>
                                        <button type="button" onClick={imprimir} disabled={imprimiendo} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{imprimiendo ? "Preparando…" : archivoFirmado ? "Imprimir PDF firmado" : "Imprimir para firmar en papel"}</button>
                                    </div>
                                </div>
                                {enlaceImpresion ? <a href={enlaceImpresion} target="_blank" rel="noreferrer" className="block px-5 py-2 text-xs font-semibold text-[#6E56CF]">Abrir PDF para imprimir</a> : null}
                                {vistaPrevia ? <div className="bg-slate-100 p-3 sm:p-5"><VisorPdf blob={vistaPrevia} titulo="Consentimiento informado" alto="68dvh" /></div> : (
                                    <div className="max-h-[540px] overflow-y-auto px-5 py-6 sm:px-8">
                                        {texto ? bloquesDeTexto(texto).map((bloque, indice) => bloque.tipo === "titulo"
                                            ? <h3 key={indice} className="mb-2 mt-5 text-sm font-semibold first:mt-0">{bloque.texto}</h3>
                                            : bloque.tipo === "subtitulo"
                                            ? <h4 key={indice} className="mb-2 mt-4 text-xs font-semibold">{bloque.texto}</h4>
                                            : bloque.tipo === "lista"
                                            ? <ul key={indice} className="mb-3 list-disc space-y-1 pl-5 text-xs leading-6 text-slate-600">{bloque.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
                                            : <p key={indice} className="mb-3 text-xs leading-6 text-slate-600">{bloque.texto}</p>) : <p className="py-10 text-center text-sm text-slate-500">Selecciona el procedimiento y el profesional para revisar el consentimiento.</p>}
                                    </div>
                                )}
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5"><h2 className="text-sm font-semibold">Firmas con lápiz o dedo</h2><p className="mt-1 text-xs leading-5 text-slate-500">El paciente y el profesional deben revisar el PDF antes de firmar. La firma dibujada queda incorporada al PDF; el flujo de firma electrónica con verificación de identidad está disponible en la carpeta del paciente.</p></div>
                                <div className="space-y-6">
                                    <div><p className="mb-2 text-xs font-semibold text-slate-700">Firma del {conRepresentante ? "representante legal" : "paciente"} {firmaPacienteVacia ? "" : "· Capturada"}</p><PadFirma ref={firmaPacienteRef} tinta={tintaPaciente} onCambioTinta={setTintaPaciente} onCambio={({ vacio }) => { setFirmaPacienteVacia(vacio); setAceptacion(false); setError(""); }} deshabilitado={bloqueado || guardando} /></div>
                                    <div><p className="mb-2 text-xs font-semibold text-slate-700">Firma del profesional {firmaProfesionalVacia ? "" : "· Capturada"}</p><PadFirma ref={firmaProfesionalRef} tinta={tintaProfesional} onCambioTinta={setTintaProfesional} onCambio={({ vacio }) => { setFirmaProfesionalVacia(vacio); setAceptacion(false); setError(""); }} deshabilitado={bloqueado || guardando} /></div>
                                </div>
                                <label className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-700">
                                    <input type="checkbox" checked={aceptacion} disabled={bloqueado || guardando} onChange={(e) => setAceptacion(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#6E56CF]" />
                                    Confirmo que el documento fue explicado y revisado con el paciente o representante, y que ambas firmas corresponden a las personas identificadas.
                                </label>
                                {archivoFirmado ? (
                                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-sm font-semibold text-emerald-900">Consentimiento guardado en la ficha del paciente.</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button type="button" onClick={descargarFirmado} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white">Descargar PDF firmado</button>
                                            <button type="button" onClick={nuevoDocumento} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-900">Nuevo consentimiento</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button type="button" onClick={guardarFirmado} disabled={guardando || firmaPacienteVacia || firmaProfesionalVacia} className="mt-5 w-full rounded-xl bg-[#6E56CF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5D46BC] disabled:cursor-not-allowed disabled:opacity-50">
                                        {guardando ? "Guardando documento…" : "Guardar consentimiento firmado"}
                                    </button>
                                )}
                            </section>

                            {archivos.length ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-3 text-sm font-semibold">Consentimientos archivados</h2><ul className="divide-y divide-slate-100">{archivos.map((archivo) => <li key={archivo.id_archivo} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0 truncate text-xs text-slate-700">{archivo.nombre_documento}</span><button type="button" onClick={() => abrirArchivado(archivo)} className="shrink-0 text-xs font-semibold text-[#6E56CF]">Abrir PDF</button></li>)}</ul></section> : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
