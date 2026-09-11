// Suscripción Web Push real (VAPID) — reemplaza el uso de Notification.requestPermission()
// a secas. Con esto, las notificaciones llegan aunque la pestaña/app esté cerrada,
// igual que una notificación nativa (siempre que el navegador/SO lo soporte).
//
// Restricción real de iOS (no es un bug de este código): Safari solo entrega Web Push
// a PWAs agregadas a la pantalla de inicio. En una pestaña normal de Safari, 'PushManager'
// ni siquiera existe en window — soportaPush() da false y no se intenta suscribir.

const API = () => process.env.NEXT_PUBLIC_API_URL;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function soportaPush() {
    return typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window;
}

export function esIOS() {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function esPWAInstalada() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
}

async function enviarSuscripcionAlBackend(subscription) {
    const payload = subscription.toJSON();
    await fetch(`${API()}/notificaciones/push-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ endpoint: payload.endpoint, keys: payload.keys }),
    });
}

// Devuelve { ok, motivo? }. Nunca lanza — un fallo de suscripción no debe romper el dashboard.
export async function suscribirsePush() {
    if (!soportaPush()) return { ok: false, motivo: 'no-soportado' };

    try {
        const registration = await navigator.serviceWorker.ready;

        const existente = await registration.pushManager.getSubscription();
        if (existente) {
            await enviarSuscripcionAlBackend(existente);
            return { ok: true };
        }

        const res = await fetch(`${API()}/notificaciones/vapid-key`, {
            headers: { Accept: 'application/json' },
            mode: 'cors',
        });
        if (!res.ok) return { ok: false, motivo: 'sin-vapid-key' };
        const { key } = await res.json();
        if (!key) return { ok: false, motivo: 'sin-vapid-key' };

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
        });

        await enviarSuscripcionAlBackend(subscription);
        return { ok: true };
    } catch (error) {
        console.error('[PUSH] No se pudo suscribir:', error);
        return { ok: false, motivo: 'error' };
    }
}

export async function desuscribirsePush() {
    if (!soportaPush()) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return;

        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch(`${API()}/notificaciones/push-unsubscribe`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ endpoint }),
        });
    } catch (error) {
        console.error('[PUSH] No se pudo desuscribir:', error);
    }
}
