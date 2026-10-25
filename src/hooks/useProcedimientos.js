"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { crearApiProcedimientos, PROCEDIMIENTOS_RESPALDO } from "@/lib/consentimientos/apiProcedimientos";

/**
 * Procedimientos vigentes del consentimiento informado (anexos), con la API
 * para crearlos y versionarlos. Lo usan la pantalla de procedimientos y el panel
 * de consentimiento de la carpeta del paciente.
 *
 * respaldoSiFalla: el panel de la carpeta del paciente pasa a los 14 anexos de
 * ejemplo si el backend no responde, para que emitir un consentimiento nunca se
 * bloquee. La pantalla de procedimientos muestra el error (ahí se edita).
 */
export function useProcedimientos({ respaldoSiFalla = false } = {}) {
  const { getToken } = useAuth();
  const api = useMemo(() => crearApiProcedimientos(getToken), [getToken]);
  const [procedimientos, setProcedimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { procedimientos: lista } = await api.listar();
      setProcedimientos(Array.isArray(lista) ? lista : []);
    } catch (e) {
      if (respaldoSiFalla) setProcedimientos(PROCEDIMIENTOS_RESPALDO);
      else setError(e?.codigo || "serverError");
    } finally {
      setCargando(false);
    }
  }, [api, respaldoSiFalla]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { api, procedimientos, cargando, error, recargar };
}
