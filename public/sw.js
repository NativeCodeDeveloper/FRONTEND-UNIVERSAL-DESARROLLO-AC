// ── Agenda Clínica — Service Worker ──────────────────────────────────────────
// CRÍTICO: Este SW NUNCA cachea datos de pacientes, fichas clínicas ni reservas.
// Solo se cachea el shell de la app y assets estáticos.

const CACHE_NAME = 'ac-shell-v1';

const SHELL_ASSETS = [
    '/',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png',
    '/logo.png',
    '/logofavcom.png',
    '/offline.html',
];

// ── Rutas que NUNCA se cachean (datos médicos y de negocio) ──────────────────
function esRutaSensible(pathname) {
    const sensibles = [
        '/api/',
        '/dashboard/FichasPacientes',
        '/dashboard/NuevaFicha',
        '/dashboard/EdicionFicha',
        '/dashboard/FichaClinica',
        '/dashboard/paciente',
        '/dashboard/calendario',
        '/dashboard/GestionPaciente',
        '/dashboard/listaPacientes',
        '/dashboard/recetaPacientes',
        '/dashboard/recetaRapida',
        '/dashboard/examenDocumento',
        '/dashboard/odontogramasPaciente',
        '/dashboard/presupuestoTratamiento',
    ];
    return sensibles.some(ruta => pathname.startsWith(ruta));
}

// ── Install: cachea solo el shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

// ── Activate: limpia caches viejos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Fetch: estrategia por tipo de recurso ───────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Siempre red para rutas sensibles (datos médicos, APIs)
    if (esRutaSensible(url.pathname)) return;

    // Assets estáticos de Next.js → cache first (son inmutables por hash)
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(request).then(cached => cached || fetch(request).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(request, clone));
                return res;
            }))
        );
        return;
    }

    // Imágenes del shell (logo, íconos) → cache first
    if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/) &&
        SHELL_ASSETS.some(a => url.pathname === a)) {
        event.respondWith(
            caches.match(request).then(cached => cached || fetch(request))
        );
        return;
    }

    // Navegación → network first, fallback a offline.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/offline.html'))
        );
        return;
    }
});
