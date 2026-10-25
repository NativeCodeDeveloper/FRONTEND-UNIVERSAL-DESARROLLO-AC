import Profesionales from '../model/Profesionales.js';
// FIRMA: validación de RUT, foto y N° de registro de la Superintendencia de Salud.
import { rutValido } from "../services/firma/rut.js";
import { declararRegistroSis } from "./RegistroSisController.js";

// imagenProfesional: id de Cloudflare Images (POST /cloudflare/subirimagenes).
// "" quita la foto (se guarda NULL); undefined no la toca.
function normalizarImagen(imagenProfesional) {
    if (imagenProfesional === undefined) return { ok: true, valor: undefined };
    const valor = String(imagenProfesional ?? "").trim();
    if (!valor) return { ok: true, valor: null };
    return /^[A-Za-z0-9-]{1,200}$/.test(valor) ? { ok: true, valor } : { ok: false };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// correo_profesional es opcional (no todos los profesionales lo cargan de inmediato),
// pero si viene, debe tener formato válido para no guardar basura que luego rompa el envío del .ics.
// valor: null significa "guardar vacío" (el cliente mandó "" o null explícito).
function normalizarCorreoProfesional(correo_profesional) {
    const valor = String(correo_profesional).trim();
    if (!valor) return { ok: true, valor: null };
    if (!EMAIL_REGEX.test(valor)) return { ok: false, valor: null };
    return { ok: true, valor };
}

export default class ProfesionalesController {

    constructor() {
    }

    //FUNCION PARA INSERTAR UN NUEVO PROFESIONAL
    static async insertarProfesionalController(req, res) {
        try{
            const {
                nombreProfesional,
                descripcionProfesional,
                correoContacto,
                numeroTelefono,
                rutProfesional,
                imagenProfesional,
                registro_sis_numero
            } = req.body;

            if (!nombreProfesional || !descripcionProfesional || !correoContacto || !numeroTelefono || !rutProfesional ) {
                return res.status(400).json({ message: "sindata" });
            }
            if (!rutValido(rutProfesional)) return res.status(422).json({ message: "rutInvalido" });
            const imagen = normalizarImagen(imagenProfesional);
            if (!imagen.ok) return res.status(422).json({ message: "archivoInvalido" });
            const numeroSis = String(registro_sis_numero ?? "").trim();
            if (numeroSis && !/^\d{1,10}$/.test(numeroSis)) return res.status(422).json({ message: "datoinvalido" });

            const profesionalClass = new Profesionales();
            const resultado = await profesionalClass.insertarProfesionalModel(
                nombreProfesional,
                descripcionProfesional,
                correoContacto,
                numeroTelefono,
                rutProfesional,
                imagen.valor ?? null
            );
            if (resultado.affectedRows > 0) {
                // El N° de registro queda "declarado" y con su evento de evidencia.
                // Si esto falla, el profesional igual quedó creado: se puede declarar después.
                if (numeroSis) {
                    await declararRegistroSis({ id_profesional: resultado.insertId, numero: numeroSis, usuario: req.usuario, contexto: { ip: req.ip, userAgent: req.get("user-agent") } })
                        .catch((error) => console.error("[FIRMA] registro SIS al crear profesional:", error.message));
                }
                res.status(200).json({ message: true });
            }else {
                res.status(500).json({ message: false });
            }
        }catch (error) {
            console.error("[PROFESIONALES] insertar:", error.message);
            res.status(500).json({ message: "serverError" });
        }

    }

    static async actualizarProfesionalController(req, res) {
        try{
            const {
                nombreProfesional,
                descripcionProfesional,
                correoContacto,
                numeroTelefono,
                rutProfesional,
                id_profesional,
                imagenProfesional
            } = req.body;

            if (!nombreProfesional ||
                !descripcionProfesional ||
                !id_profesional  ||
                !correoContacto ||
                !numeroTelefono ||
                !rutProfesional ) {
                return res.status(400).json({ message: "sindata" });
            }
            if (!rutValido(rutProfesional)) return res.status(422).json({ message: "rutInvalido" });
            const imagen = normalizarImagen(imagenProfesional);
            if (!imagen.ok) return res.status(422).json({ message: "archivoInvalido" });

            const profesionalClass = new Profesionales();
            const resultado = await profesionalClass.actualizarProfesionalModel(
                nombreProfesional,
                descripcionProfesional,
                correoContacto,
                numeroTelefono,
                rutProfesional,
                id_profesional,
                imagen.valor
            );

            if (resultado.affectedRows > 0) {
                res.status(200).json({ message: true });
            }else {
                res.status(500).json({ message: false });
            }
        }catch (error) {
            res.status(500).json({ message: "serverError" });
        }
    }


    //FUNCION PARA SELECCIONAR POR ID UN NUEVO PROFESIONAL
    static async seleccionarProfesionalController(req, res) {
        try{
            const {id_profesional} = req.body;
            if (!id_profesional) {
                return res.status(400).json({ message: "sindata" });
            }
            const profesionalClass = new Profesionales();
            const resultado = await profesionalClass.seleccionarProfesionalPorID(id_profesional);

            if (resultado) {
                res.status(200).json(resultado);
            }else {
                res.status(500).json({ message: false });
            }
        }catch (error) {
            res.status(500).json({ message: "serverError" });
        }


    }
    //FUNCION PARA ELIMINAR LOGICAMENTE CAMBIANDO ESTADO DE CERO A UNO UN PROFESIONAL
    static async eliminarProfesionalController(req, res) {
        try {
            const {id_profesional} = req.body;
            if (!id_profesional) {
                return res.status(400).json({message: "sindata"});
            }
            const profesionalClass = new Profesionales();
            const resultado = await profesionalClass.eliminarProfesionalPorId(id_profesional);

            if (resultado.affectedRows > 0) {
                res.status(200).json({message: true});
            } else {
                res.status(500).json({message: false});
            }
        } catch (error) {
            res.status(500).json({message: "serverError"});
        }
    }


    //FUNCION PARA SELECCIONAR LISTADO DE PROFESIONALES
    static async seleccionarTodosLosProfesionales(req, res) {
        try{
            const profesionalClass = new Profesionales();
            const resultado = await profesionalClass.seleccionarProfesionales();

            if (resultado) {
                res.status(200).json(resultado);
            } else {
                res.status(500).json({message: false});
            }
        } catch (error) {
            res.status(500).json({message: "serverError"});
        }
    }

}