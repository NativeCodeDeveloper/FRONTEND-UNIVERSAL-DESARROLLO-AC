/* Error de la API de firma: `codigo` es el `message` del backend (ver constantes.MENSAJES_ERROR). */
export class ErrorFirma extends Error {
  constructor(codigo, status) {
    super(codigo);
    this.name = "ErrorFirma";
    this.codigo = codigo;
    this.status = status;
  }
}
