/* Exporta la plantilla base del consentimiento informado y los procedimientos de ejemplo
 * (src/lib/consentimientos/plantillasProcedimiento.js) al JSON que carga el backend con
 * scripts/cargar_plantillas_consentimiento.mjs.
 *
 * Correr cada vez que cambie un texto (y subir su `version`):
 *   node scripts/exportar-plantillas-consentimiento.mjs <backend>/migraciones/plantillas_ejemplo_consentimiento.json
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { PLANTILLA_BASE, ANEXOS_PROCEDIMIENTO } from "../src/lib/consentimientos/plantillasProcedimiento.js";
import { tituloPlantilla } from "../src/lib/consentimientos/procedimientos.js";

const salida = process.argv[2];
if (!salida) {
  console.error("Indica la ruta del JSON del backend.");
  process.exit(1);
}

const sha256 = (texto) => createHash("sha256").update(texto, "utf8").digest("hex");
const fila = (codigo, categoria, version, titulo, cuerpo) => ({ codigo, categoria, version, titulo, cuerpo, sha256: sha256(cuerpo) });

const plantillas = [
  fila(PLANTILLA_BASE.codigo, "consentimiento_base", PLANTILLA_BASE.version, PLANTILLA_BASE.titulo, PLANTILLA_BASE.cuerpo),
  ...ANEXOS_PROCEDIMIENTO.map((a) => fila(a.codigo, "anexo_procedimiento", a.version, tituloPlantilla(a.grupo, a.nombre), a.cuerpo)),
];

writeFileSync(salida, JSON.stringify({ origen: "src/lib/consentimientos/plantillasProcedimiento.js (front)", plantillas }, null, 2) + "\n");
console.log(`${plantillas.length} plantillas → ${salida}`);
