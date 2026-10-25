/* Anula los documentos que llevan más de 30 días esperando firma.
 * No borra nada: el borrador se conserva y el evento queda en la cadena.
 *   node scripts/expirar_borradores.mjs */

import "dotenv/config";
import DataBase from "../config/Database.js";
import { registrarEvento } from "../services/firma/cadenaEvidencia.js";
import { ahoraUtc, aMysqlUtc } from "../services/firma/tiempo.js";

const db = DataBase.getInstance();
try {
    const vencidos = await db.ejecutarQuery(`
        SELECT BIN_TO_UUID(id_documento) AS id_documento, id_profesional_firmante, id_paciente, codigo_verificacion
        FROM documento_emitido
        WHERE estado = 'pendiente_firma' AND preparado_at < UTC_TIMESTAMP(3) - INTERVAL 30 DAY`);
    for (const d of vencidos) {
        const conexion = await db.obtenerConexion();
        try {
            await conexion.beginTransaction();
            const ahora = ahoraUtc();
            const [r] = await conexion.query(
                `UPDATE documento_emitido SET estado = 'anulado', anulado_at = ?, motivo_anulacion = 'Vencido: más de 30 días sin firma'
                 WHERE id_documento = UUID_TO_BIN(?) AND estado = 'pendiente_firma'`,
                [aMysqlUtc(ahora), d.id_documento]
            );
            if (r.affectedRows) {
                await registrarEvento(conexion, {
                    tipo_evento: "documento_anulado", id_documento: d.id_documento, id_profesional: d.id_profesional_firmante,
                    id_paciente: d.id_paciente, actor_tipo: "sistema", metodo_autenticacion: "tarea_programada",
                    datos: { motivo: "vencido", codigo: d.codigo_verificacion },
                });
            }
            await conexion.commit();
        } catch (error) {
            await conexion.rollback().catch(() => {});
            console.error(`No se pudo anular ${d.codigo_verificacion}:`, error.message);
        } finally {
            conexion.release();
        }
    }
    console.log(`${vencidos.length} documento(s) vencido(s) revisado(s).`);
} catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
} finally {
    await db.cerrarConexion();
    // Salida explícita: config/Database.js vuelve a cerrar el pool en "beforeExit".
    process.exit(process.exitCode ?? 0);
}
