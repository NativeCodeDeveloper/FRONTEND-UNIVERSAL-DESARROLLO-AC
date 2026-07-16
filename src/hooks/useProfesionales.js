'use client';
import { useState, useEffect } from 'react';

// Caché de módulo — solo una petición por sesión de navegador
let _cache = null;

export function useProfesionales() {
    const [profesionales, setProfesionales] = useState(_cache || []);

    useEffect(() => {
        if (_cache) return;
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) return;
        fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            mode: 'cors',
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (Array.isArray(data)) {
                    _cache = data;
                    setProfesionales(data);
                }
            })
            .catch(() => {});
    }, []);

    return profesionales;
}
