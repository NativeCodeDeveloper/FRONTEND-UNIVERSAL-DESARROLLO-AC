'use client';
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useEffect, useState } from 'react';

// Misma estrategia que useEmpresaNombre: una petición por sesión de navegador,
// compartiendo la promesa en vuelo entre componentes que montan a la vez.
let _cache = null;
let _enVuelo = null;

export function pedirDatosEmpresa() {
    if (_cache) return Promise.resolve(_cache);
    if (_enVuelo) return _enVuelo;

    const API = process.env.NEXT_PUBLIC_API_URL;
    if (!API) return Promise.resolve({});

    _enVuelo = fetch(`${API}/datosempresa/seleccionartodos`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        mode: 'cors',
    })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
            const d = (Array.isArray(data) ? data[0] : data) || {};
            _cache = d;
            return d;
        })
        .catch(() => ({}))
        .finally(() => { _enVuelo = null; });

    return _enVuelo;
}

/** Fila de datos_empresa (empresaNombre, contactoDireccion, contactoEmail, contactoTelefono…). */
export function useDatosEmpresa() {
    const [datos, setDatos] = useState(_cache || {});

    useEffect(() => {
        if (_cache) return undefined;
        let vivo = true;
        pedirDatosEmpresa().then(d => { if (vivo) setDatos(d); });
        return () => { vivo = false; };
    }, []);

    return datos;
}
