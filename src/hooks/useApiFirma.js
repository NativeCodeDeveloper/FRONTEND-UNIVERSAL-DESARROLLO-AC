"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { crearApiFirma } from "@/lib/firma/apiFirma";

/** Cliente de la API de firma con el token de Clerk de la sesión actual. */
export function useApiFirma() {
  const { getToken } = useAuth();
  return useMemo(() => crearApiFirma(getToken), [getToken]);
}
