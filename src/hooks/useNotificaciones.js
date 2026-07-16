'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { obtenerCitasProximas } from '@/lib/citasProximas';

// Frontend-only: no depende de un backend de notificaciones (aún no existe /notificaciones/*).
// Reusa /reservaPacientes/seleccionarReservados, que ya funciona, para armar el panel.

const API = () => process.env.NEXT_PUBLIC_API_URL;
const ANTICIPACION_MIN = 30;
const DESCARTADAS_KEY = 'notif_descartadas';

function getDescartadas() {
    try {
        const raw = sessionStorage.getItem(DESCARTADAS_KEY);
        return new Set(JSON.parse(raw) || []);
    } catch {
        return new Set();
    }
}

function saveDescartadas(set) {
    try {
        sessionStorage.setItem(DESCARTADAS_KEY, JSON.stringify([...set]));
    } catch {}
}

export function useNotificaciones() {
    const [notifs,  setNotifs]  = useState([]);
    const [permiso, setPermiso] = useState('default');
    const intervalRef = useRef(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await fetch(`${API()}/reservaPacientes/seleccionarReservados`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors',
            });
            if (!res.ok) return;
            const reservas = await res.json();

            const descartadas = getDescartadas();
            const citas = obtenerCitasProximas(reservas, ANTICIPACION_MIN)
                .filter(n => !descartadas.has(n.id));

            setNotifs(citas);
        } catch {}
    }, []);

    useEffect(() => {
        fetchNotifs();
        intervalRef.current = setInterval(fetchNotifs, 30_000);
        return () => clearInterval(intervalRef.current);
    }, [fetchNotifs]);

    useEffect(() => {
        if (typeof Notification === 'undefined') return;
        setPermiso(Notification.permission);
    }, []);

    const pedirPermiso = useCallback(async () => {
        if (typeof Notification === 'undefined') return;
        const result = await Notification.requestPermission();
        setPermiso(result);
    }, []);

    const marcarLeida = useCallback((id) => {
        const descartadas = getDescartadas();
        descartadas.add(id);
        saveDescartadas(descartadas);
        setNotifs(n => n.filter(x => x.id !== id));
    }, []);

    const marcarTodasLeidas = useCallback(() => {
        setNotifs(current => {
            if (current.length === 0) return current;
            const descartadas = getDescartadas();
            current.forEach(n => descartadas.add(n.id));
            saveDescartadas(descartadas);
            return [];
        });
    }, []);

    return { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas };
}
