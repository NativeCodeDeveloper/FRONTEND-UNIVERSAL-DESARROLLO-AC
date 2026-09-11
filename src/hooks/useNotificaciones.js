'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { suscribirsePush } from '@/lib/pushSubscription';

// Feed real: consume /notificaciones/* del backend (poblado por el cron de
// recordatorios 12h/6h/1h). Antes esto se calculaba 100% en el cliente sobre
// /reservaPacientes/seleccionarReservados — ya no hace falta, el backend ahora
// tiene su propio feed persistente + push real.

const API = () => process.env.NEXT_PUBLIC_API_URL;

// El backend ya filtra por fecha_evento, pero esto evita esperar al próximo
// poll (cada 30s) para que una notificación desaparezca justo al pasar su hora.
function noHaExpirado(n) {
    if (!n.fecha_evento) return true;
    return new Date(n.fecha_evento).getTime() >= Date.now();
}

export function useNotificaciones() {
    const [notifs,  setNotifs]  = useState([]);
    const [permiso, setPermiso] = useState('default');
    const intervalRef = useRef(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await fetch(`${API()}/notificaciones/pendientes`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                mode: 'cors',
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotifs(Array.isArray(data) ? data.filter(noHaExpirado) : []);
        } catch {}
    }, []);

    useEffect(() => {
        fetchNotifs();
        intervalRef.current = setInterval(fetchNotifs, 30_000);
        return () => clearInterval(intervalRef.current);
    }, [fetchNotifs]);

    // Barrido local cada 30s para descartar notificaciones cuya hora ya pasó,
    // sin esperar al próximo fetch al backend.
    useEffect(() => {
        const t = setInterval(() => {
            setNotifs((current) => current.filter(noHaExpirado));
        }, 30_000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (typeof Notification === 'undefined') return;
        setPermiso(Notification.permission);
    }, []);

    const pedirPermiso = useCallback(async () => {
        if (typeof Notification === 'undefined') return;
        const result = await Notification.requestPermission();
        setPermiso(result);
        if (result === 'granted') {
            suscribirsePush();
        }
    }, []);

    const marcarLeida = useCallback((id) => {
        setNotifs(n => n.filter(x => x.id !== id));
        fetch(`${API()}/notificaciones/${id}/leer`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            mode: 'cors',
        }).catch(() => {});
    }, []);

    const marcarTodasLeidas = useCallback(() => {
        setNotifs(current => {
            if (current.length === 0) return current;
            fetch(`${API()}/notificaciones/leer-todas`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                mode: 'cors',
            }).catch(() => {});
            return [];
        });
    }, []);

    return { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas };
}
