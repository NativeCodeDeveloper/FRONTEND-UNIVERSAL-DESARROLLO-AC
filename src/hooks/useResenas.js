'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

// Lee las reseñas activas de un profesional + su promedio/total.
// Uso: const { resenas, promedio, totalResenas, cargando, recargar } = useResenasProfesional(id_profesional);
export function useResenasProfesional(id_profesional) {
    const [resenas, setResenas] = useState([]);
    const [promedio, setPromedio] = useState(null);
    const [totalResenas, setTotalResenas] = useState(0);
    const [cargando, setCargando] = useState(true);

    const cargarResenas = useCallback(async () => {
        if (!id_profesional || !API) {
            setCargando(false);
            return;
        }
        setCargando(true);
        try {
            const [resListado, resPromedio] = await Promise.all([
                fetch(`${API}/resenas/seleccionarPorProfesional`, {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profesional_id: id_profesional }),
                    mode: 'cors',
                }),
                fetch(`${API}/resenas/promedioPorProfesional`, {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profesional_id: id_profesional }),
                    mode: 'cors',
                }),
            ]);

            const dataListado = resListado.ok ? await resListado.json() : [];
            const dataPromedio = resPromedio.ok ? await resPromedio.json() : null;

            setResenas(Array.isArray(dataListado) ? dataListado : []);
            setPromedio(dataPromedio?.promedio != null ? Number(dataPromedio.promedio) : null);
            setTotalResenas(dataPromedio?.total ?? 0);
        } catch (error) {
            setResenas([]);
            setPromedio(null);
            setTotalResenas(0);
        } finally {
            setCargando(false);
        }
    }, [id_profesional]);

    useEffect(() => {
        cargarResenas();
    }, [cargarResenas]);

    return { resenas, promedio, totalResenas, cargando, recargar: cargarResenas };
}

// Lee todas las reseñas activas del centro (con nombre de paciente y profesional ya unidos).
// Uso: const { resenas, cargando } = useTodasLasResenas();
export function useTodasLasResenas() {
    const [resenas, setResenas] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarTodas = useCallback(async () => {
        if (!API) {
            setCargando(false);
            return;
        }
        setCargando(true);
        try {
            const r = await fetch(`${API}/resenas/seleccionarTodas`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors',
            });
            const data = r.ok ? await r.json() : [];
            setResenas(Array.isArray(data) ? data : []);
        } catch (error) {
            setResenas([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarTodas();
    }, [cargarTodas]);

    return { resenas, cargando, recargar: cargarTodas };
}

// Envía una reseña nueva desde el sitio público (formulario del paciente).
// Lanza Error con un mensaje legible; el componente que llama debe hacer try/catch + toast.
export async function insertarResena({ rating, comentario, paciente_id, profesional_id, clinica_id, nombre_invitado, apellido_invitado }) {
    if (!API) throw new Error('Falta configurar NEXT_PUBLIC_API_URL.');

    const res = await fetch(`${API}/resenas/insertarResena`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comentario, paciente_id, profesional_id, clinica_id, nombre_invitado, apellido_invitado }),
        mode: 'cors',
    });

    let respuesta = null;
    try {
        respuesta = await res.json();
    } catch (error) {
        respuesta = null;
    }

    if (!res.ok || respuesta?.message !== true) {
        if (respuesta?.message === 'sindata') {
            throw new Error('Completa la calificación, el comentario y a quién va dirigida la reseña.');
        }
        if (respuesta?.message === 'ratingInvalido') {
            throw new Error('La calificación debe ser un valor entre 1 y 5.');
        }
        if (res.status === 429) {
            throw new Error('Ya enviaste varias reseñas seguidas. Intenta de nuevo más tarde.');
        }
        throw new Error('No se pudo enviar la reseña, intenta nuevamente.');
    }

    return true;
}

// Desactiva (borrado lógico) una reseña. La usa el dashboard para "quitar"/"desactivar" testimonios.
// Lanza Error con un mensaje legible; el componente que llama debe hacer try/catch + toast.
export async function eliminarResena(id_resena) {
    if (!API) throw new Error('Falta configurar NEXT_PUBLIC_API_URL.');

    const res = await fetch(`${API}/resenas/eliminarResena`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_resena }),
        mode: 'cors',
    });

    let respuesta = null;
    try {
        respuesta = await res.json();
    } catch (error) {
        respuesta = null;
    }

    if (!res.ok || respuesta?.message !== true) {
        if (respuesta?.message === 'noEncontrada') {
            throw new Error('Esta reseña ya no existe o ya fue desactivada.');
        }
        throw new Error('No se pudo desactivar la reseña, intenta nuevamente.');
    }

    return true;
}
