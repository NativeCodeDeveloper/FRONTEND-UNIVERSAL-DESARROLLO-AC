export default function manifest() {
    return {
        name: 'Agenda Clínica',
        short_name: 'Agenda Clínica',
        description: 'Sistema de agendamiento médico clínico online',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6E56CF',
        orientation: 'portrait-primary',
        lang: 'es',
        // `any` y `maskable` van en entradas separadas: declarar ambos propositos en
        // el mismo archivo deja que el sistema elija, y en Android el recorte
        // circular del icono maskable puede comerse los bordes del logo.
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
