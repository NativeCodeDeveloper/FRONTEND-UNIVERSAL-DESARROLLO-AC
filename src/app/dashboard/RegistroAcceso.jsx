'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * Avisa al backend que alguien abrió la plataforma.
 *
 * Alimenta la tabla registro_accesos, que cumple dos funciones:
 *   1. Es la única fuente de "días sin actividad" del Health Score de Finance
 *      (la señal que más pesa: permite detectar que una clínica se está
 *      apagando antes de que cancele).
 *   2. Deja el registro de fecha, hora y usuario que exige la ley de
 *      protección de datos para tratar datos sensibles de salud.
 *
 * Se dispara al cargar el dashboard, no al iniciar sesión. Esa distinción
 * importa: una clínica que trabaja a diario con la sesión abierta casi nunca
 * pasa por el sign-in, y contar solo los inicios de sesión la haría aparecer
 * inactiva. Lo que se quiere medir es "alguien abrió la plataforma".
 *
 * El token de Clerk se manda para que el backend verifique la firma y sepa
 * QUIÉN entró. Si no hay token o no se puede verificar, el acceso igual queda
 * registrado sin identidad: para el Health Score sirve igual.
 *
 * Nunca muestra un error ni bloquea nada. Es telemetría: si falla, se ignora.
 */
export default function RegistroAcceso() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const yaRegistrado = useRef(false);

    useEffect(() => {
        // Esperar a que Clerk resuelva, para no mandar el latido sin identidad
        // cuando en realidad sí hay sesión.
        if (!isLoaded || !isSignedIn) return;

        // Una vez por carga de la app. El backend además limita a un registro
        // por usuario por hora, así que navegar entre secciones no acumula.
        if (yaRegistrado.current) return;
        yaRegistrado.current = true;

        (async () => {
            try {
                const token = await getToken();
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health-metrics/acceso`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    keepalive: true,
                });
            } catch {
                // Silencio a propósito: el cliente no debe enterarse nunca.
            }
        })();
    }, [isLoaded, isSignedIn, getToken]);

    return null;
}
