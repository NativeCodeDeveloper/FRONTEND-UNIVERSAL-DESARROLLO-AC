import {Router} from 'express';
import ProfesionalesController from '../controller/ProfesionalesController.js';
// FIRMA: registro de la Superintendencia de Salud y sesión de Clerk.
import RegistroSisController from '../controller/RegistroSisController.js';
import { verificarUsuarioClerk } from '../middleware/verificarUsuarioClerk.js';
import { exigirUsuarioClerk } from '../middleware/exigirUsuarioClerk.js';
import { subirCertificado, manejarErrorArchivo } from '../middleware/limitesArchivos.js';

const router = Router();

// verificarUsuarioClerk (no bloquea): si el front manda el token, queda en
// req.usuario quién creó o editó el profesional (evidencia del N° de registro).
// Pendiente C1 (docs/firma/02 §11): cambiar por exigirUsuarioClerk antes del 1-dic.
router.post('/insertarProfesional', verificarUsuarioClerk, ProfesionalesController.insertarProfesionalController);
router.post('/actualizarProfesional', verificarUsuarioClerk, ProfesionalesController.actualizarProfesionalController);
router.post('/seleccionarProfesional', ProfesionalesController.seleccionarProfesionalController);
router.post('/eliminarProfesional', ProfesionalesController.eliminarProfesionalController);
router.get('/seleccionarTodosProfesionales', ProfesionalesController.seleccionarTodosLosProfesionales);

// FIRMA: registro Superintendencia de Salud (sesión obligatoria)
router.post('/actualizarRegistroSis', exigirUsuarioClerk, subirCertificado.single('certificado'), manejarErrorArchivo, RegistroSisController.actualizarRegistroSis);
router.post('/verificarRegistroSis', exigirUsuarioClerk, RegistroSisController.verificarRegistroSis);
router.post('/descargarCertificadoSis', exigirUsuarioClerk, RegistroSisController.descargarCertificadoSis);

export default router;
