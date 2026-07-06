'use client';
import { useState, useEffect } from 'react';

// Caché de módulo — solo una petición por sesión de navegador
let _cache = null;

export function useEmpresaNombre() {
    const [nombre, setNombre] = useState(_cache || '');

    useEffect(() => {
        if (_cache) return;
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) { setNombre('AgendaClínica'); return; }
        fetch(`${API}/datosempresa/seleccionartodos`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            mode: 'cors',
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const d = Array.isArray(data) ? data[0] : data;
                const n = d?.empresaNombre || 'AgendaClínica';
                _cache = n;
                setNombre(n);
            })
            .catch(() => setNombre('AgendaClínica'));
    }, []);

    return nombre || 'AgendaClínica';
}
