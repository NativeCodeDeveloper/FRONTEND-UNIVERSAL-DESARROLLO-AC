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
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
    };
}
