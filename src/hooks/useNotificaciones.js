'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const API = () => process.env.NEXT_PUBLIC_API_URL;

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const reg = await navigator.serviceWorker.register('/sw.js');

    const keyRes = await fetch(`${API()}/notificaciones/vapid-key`);
    if (!keyRes.ok) return;
    const { key } = await keyRes.json();
    if (!key) return;

    const existing = await reg.pushManager.getSubscription();
    const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
    });

    await fetch(`${API()}/notificaciones/push-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.toJSON().keys.p256dh, auth: sub.toJSON().keys.auth },
        }),
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function useNotificaciones() {
    const [notifs,  setNotifs]  = useState([]);
    const [permiso, setPermiso] = useState('default');
    const intervalRef = useRef(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await fetch(`${API()}/notificaciones/pendientes`);
            if (!res.ok) return;
            const data = await res.json();
            setNotifs(Array.isArray(data) ? data : []);
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
        if (Notification.permission === 'granted') subscribeToPush().catch(() => {});
    }, []);

    const pedirPermiso = useCallback(async () => {
        if (typeof Notification === 'undefined') return;
        const result = await Notification.requestPermission();
        setPermiso(result);
        if (result === 'granted') {
            try { await subscribeToPush(); } catch {}
        }
    }, []);

    const marcarLeida = useCallback(async (id) => {
        try {
            await fetch(`${API()}/notificaciones/${id}/leer`, { method: 'POST' });
            setNotifs(n => n.filter(x => x.id !== id));
        } catch {}
    }, []);

    const marcarTodasLeidas = useCallback(async () => {
        try {
            await fetch(`${API()}/notificaciones/leer-todas`, { method: 'POST' });
            setNotifs([]);
        } catch {}
    }, []);

    return { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas };
}
