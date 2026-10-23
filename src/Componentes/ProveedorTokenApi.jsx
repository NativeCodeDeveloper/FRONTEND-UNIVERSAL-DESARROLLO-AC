"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { definirProveedorToken } from "@/lib/fetchConCarga";

// Registra en fetchConCarga cómo obtener el JWT de Clerk. No renderiza nada.
// Mientras está montado (solo en el dashboard) toda llamada al backend lleva
// Authorization: Bearer; al desmontarse se desregistra, para que una navegación
// al sitio público vuelva a llamarse sin token.
export default function ProveedorTokenApi() {
    const { getToken } = useAuth();

    useEffect(() => {
        definirProveedorToken(() => getToken());
        return () => definirProveedorToken(null);
    }, [getToken]);

    return null;
}
