import { obtenerDatosEmpresa } from "@/lib/paginaPublica/api";
import { formatearInstanteConOffset } from "@/lib/fechas";
import { TIPOS_DOCUMENTO } from "@/lib/firma/constantes";
import ComprobarArchivo from "./ComprobarArchivo";

const API = process.env.NEXT_PUBLIC_API_URL;
const FORMATO_CODIGO = /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

export const metadata = {
  title: "Verificar documento",
  robots: { index: false, follow: false },
};

/*
 * Verificación pública de un documento firmado (destino del QR del pie de firma).
 *
 * Ley 21.719: aquí NO se muestran datos clínicos ni del paciente. Solo si el
 * documento existe, quién lo emitió, su registro, la fecha de firma y su estado.
 * El contenido solo lo tiene quien recibió el PDF; con "Comprobar un archivo"
 * puede confirmar que no fue modificado (el servidor compara la huella SHA-256).
 */
async function consultar(codigo) {
  if (!API || !FORMATO_CODIGO.test(codigo)) return { existe: false };
  try {
    const res = await fetch(`${API}/verificacion/${encodeURIComponent(codigo)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { error: true };
    const datos = await res.json();
    return datos?.message === true ? datos : { error: true };
  } catch {
    return { error: true };
  }
}

function Dato({ etiqueta, children }) {
  if (!children) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-linea-suave py-3.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[14px] text-tinta-2">{etiqueta}</dt>
      <dd className="text-[16px] font-medium text-tinta sm:text-right">{children}</dd>
    </div>
  );
}

export default async function VerificarDocumento({ params }) {
  const { codigo: crudo } = await params;
  const codigo = decodeURIComponent(String(crudo || "")).trim().toUpperCase();
  const [resultado, empresa] = await Promise.all([consultar(codigo), obtenerDatosEmpresa()]);

  const anulado = resultado.estado === "anulado";
  const esConsentimiento = resultado.tipo === "consentimiento";

  return (
    <section className="pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-[640px] px-5 md:px-6">
        <header className="mb-8">
          <p className="text-[14px] font-medium text-tinta-2">{empresa.empresaNombre || "Centro de salud"}</p>
          <h1 className="titular-2 mt-1">Verificación de documento</h1>
          <p className="bajada mt-3">
            Código <span className="font-mono tracking-wider text-tinta">{codigo || "—"}</span>
          </p>
        </header>

        {resultado.error ? (
          <div className="caja p-6 md:p-7">
            <p className="text-[17px] font-semibold text-tinta">No pudimos verificar el documento ahora</p>
            <p className="mt-2 text-[15px] text-tinta-2">Intenta nuevamente en unos minutos.</p>
          </div>
        ) : !resultado.existe ? (
          <div className="caja p-6 md:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[#D70015]" aria-hidden="true">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
              </span>
              <p className="text-[17px] font-semibold text-tinta">No existe un documento con este código</p>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-tinta-2">
              Revisa que el código coincida con el impreso bajo el QR del documento. Si el problema continúa, contacta al centro que lo emitió.
            </p>
          </div>
        ) : (
          <>
            <div className="caja p-6 md:p-7">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    anulado ? "bg-[#FF3B30]/10 text-[#D70015]" : "bg-[#34C759]/15 text-[#248A3D]"
                  }`}
                  aria-hidden="true"
                >
                  {anulado ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  )}
                </span>
                <div>
                  <p className="text-[17px] font-semibold text-tinta">
                    {anulado ? "Documento anulado" : esConsentimiento ? "Aceptación registrada" : "Documento firmado electrónicamente"}
                  </p>
                  <p className="text-[14px] text-tinta-2">
                    {anulado
                      ? "El emisor anuló este documento: ya no tiene validez."
                      : esConsentimiento
                      ? "Aceptación electrónica conforme a la Ley N° 19.799."
                      : "Firma electrónica simple conforme a la Ley N° 19.799."}
                  </p>
                </div>
              </div>

              <dl className="mt-5">
                <Dato etiqueta="Documento">{esConsentimiento ? "Consentimiento" : TIPOS_DOCUMENTO[resultado.tipo_documento] || "Documento clínico"}</Dato>
                <Dato etiqueta="Emitido por">{resultado.emisor?.nombre}</Dato>
                <Dato etiqueta="Profesión">{resultado.emisor?.profesion}</Dato>
                <Dato etiqueta="Reg. Superintendencia de Salud">{resultado.emisor?.registro_sis ? `N° ${resultado.emisor.registro_sis}` : null}</Dato>
                <Dato etiqueta="Centro">{resultado.clinica}</Dato>
                <Dato etiqueta={esConsentimiento ? "Aceptado" : "Firmado"}>{formatearInstanteConOffset(resultado.firmado_at, null)}</Dato>
              </dl>
            </div>

            {!esConsentimiento && !anulado ? <ComprobarArchivo codigo={codigo} /> : null}
          </>
        )}

        <p className="mt-8 text-[13px] leading-relaxed text-tinta-3">
          Por protección de datos personales, esta página no muestra información del paciente ni el contenido del documento.
        </p>
      </div>
    </section>
  );
}
