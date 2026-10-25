/* Acta de adhesión a firma electrónica simple, versión 1.0.
 *
 * La versión oficial la entrega el backend (POST /firmaProfesional/seleccionarActaVigente)
 * desde la tabla documento_plantilla; este texto es el seed y el respaldo del modo mock.
 * Mismo formato que lib/consentimientos/textosLegales.js. */

export const ACTA_RESPALDO = {
  version: "1.0",
  titulo: "Acta de adhesión a firma electrónica simple",
  cuerpo: `En conformidad con la Ley N° 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha Firma, y en particular con su artículo 3°, que otorga a los actos y contratos suscritos por medio de firma electrónica la misma validez y efectos que los celebrados por escrito y en soporte de papel, declaro:

- Que adopto voluntariamente el procedimiento de firma electrónica simple que {{empresa.nombre}} dispone en esta plataforma, para suscribir los documentos clínicos y administrativos que emita en el ejercicio de mi profesión.
- Que el trazo que registro es la representación gráfica de mi firma y que lo dibujé personalmente desde mi propia cuenta.
- Que cada documento que firme quedará vinculado a mi identidad mediante la verificación de mi cuenta al momento de firmar, la fecha y hora del servidor y una huella digital SHA-256 del documento, que permite detectar cualquier alteración posterior.
- Que mantendré la confidencialidad de mis credenciales de acceso, y que toda firma realizada con ellas me es atribuible, salvo que haya informado antes su pérdida o uso indebido.
- Que conozco que las recetas médicas no se firman por este medio y deben firmarse de puño y letra.
- Que puedo revocar esta adhesión en cualquier momento, sin que ello afecte la validez de los documentos firmados con anterioridad.`,
};
