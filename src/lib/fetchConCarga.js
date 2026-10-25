import { iniciarCarga } from "./cargaGlobal.js";

const lectores = new Set(["json", "text", "blob", "arrayBuffer", "formData", "bytes"]);

function observarRespuesta(respuesta) {
  return new Proxy(respuesta, {
    get(objetivo, propiedad) {
      const valor = Reflect.get(objetivo, propiedad, objetivo);
      if (propiedad === "clone") {
        return () => observarRespuesta(objetivo.clone());
      }
      if (lectores.has(propiedad) && typeof valor === "function") {
        return async (...argumentos) => {
          const finalizar = iniciarCarga();
          try {
            return await valor.apply(objetivo, argumentos);
          } finally {
            finalizar();
          }
        };
      }
      return typeof valor === "function" ? valor.bind(objetivo) : valor;
    },
  });
}

const BASE_API = process.env.NEXT_PUBLIC_API_URL;

// El layout del dashboard registra acá cómo obtener el JWT de Clerk.
// Fuera del dashboard queda en null: el sitio público no manda Authorization.
let proveedorToken = null;

export function definirProveedorToken(fn) {
  proveedorToken = typeof fn === "function" ? fn : null;
}

// El token se pide por llamada y nunca se guarda acá: Clerk lo cachea y lo
// renueva solo, así que una copia propia terminaría mandando un JWT vencido.
async function conAutorizacion(recurso, opciones) {
  if (!proveedorToken || !BASE_API) return [recurso, opciones];

  const url = typeof recurso === "string" ? recurso : recurso?.url;
  // Solo las llamadas al backend propio llevan el header; Clerk u otros
  // servicios quedan intactos. Host exacto o su raíz ("/"), no cualquier
  // prefijo: evita que "https://<BASE_API>.atacante.com" matchee.
  if (!url || !(url === BASE_API || url.startsWith(BASE_API + "/"))) return [recurso, opciones];

  try {
    const token = await proveedorToken();
    if (!token) return [recurso, opciones];
    // new Headers(...) conserva lo que ya puso cada pantalla (Content-Type, Accept...)
    const headers = new Headers(opciones?.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    return [recurso, { ...opciones, headers }];
  } catch {
    // Sin token se va sin header: el front no decide si la llamada se
    // autentica — si el endpoint lo exige, el backend responde 401.
    return [recurso, opciones];
  }
}

export async function fetchConCarga(recurso, opciones) {
  // El fetch nativo queda intacto para Next, Clerk, telemetría y sondeos.
  if (typeof window === "undefined") return globalThis.fetch(recurso, opciones);

  const [recursoFinal, opcionesFinal] = await conAutorizacion(recurso, opciones);

  const finalizar = iniciarCarga();
  try {
    const respuesta = await globalThis.fetch(recursoFinal, opcionesFinal);
    return observarRespuesta(respuesta);
  } finally {
    finalizar();
  }
}
