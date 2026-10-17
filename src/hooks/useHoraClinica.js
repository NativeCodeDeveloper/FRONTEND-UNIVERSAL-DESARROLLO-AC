"use client";

import { useSyncExternalStore } from "react";
import { horaClinica } from "@/lib/paginaPublica/agenda";

/*
 * Día y minuto actuales en la zona de la clínica, solo en el cliente: en el servidor devuelve null
 * para no generar HTML con una hora que no calce con la del navegador (evita errores de hidratación).
 * Se calcula una vez por carga de página.
 */
let valor = null;
const suscribir = () => () => {};
const leer = () => (valor ??= horaClinica());
const leerEnServidor = () => null;

export function useHoraClinica() {
  return useSyncExternalStore(suscribir, leer, leerEnServidor);
}
