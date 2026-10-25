# Firma Electrónica Simple (FES) — 02 · Contrato de endpoints

> Documento autocontenido. Define **exactamente** lo que el frontend envía y
> recibe, siguiendo las convenciones reales del backend
> `BACKEND-DESARROLLO-UNIVERSAL-AC` (Express 5 + MySQL 8). Un agente que solo lea
> este archivo puede implementar los controladores, y el front puede
> implementarse contra estas formas con datos simulados.

Orden del proyecto: frontend → **contrato (este documento)** → backend y tablas.

---

## 0. Restricciones no negociables

1. **Ley 19.799 art. 3 — FES.** La validez descansa en: identificación
   (reverificación Clerk al firmar), voluntad (el firmante ve el borrador exacto y
   acciona), integridad (SHA-256 del PDF final calculado **en el servidor**).
2. **El PNG no es la firma.** La firma legal es la fila de evidencia (`firma_evento`).
3. **Nunca se acepta del cliente:** hash, `firmado_at`, `ocurrido_at`, IP, ni el
   PDF final. Si el cuerpo trae esos campos, se **ignoran**.
4. **El PDF firmado se genera una sola vez** en `firmarDocumento`. Toda descarga,
   impresión o envío sirve esos bytes desde R2. **Prohibido regenerar.**
5. **La imagen de la firma** entra solo por `multipart/form-data`, se recorta y
   normaliza en el servidor, se guarda en R2 privado con clave no adivinable y se
   sirve solo por endpoint autenticado. Nunca base64 en columnas.
6. **Recetas: no existen en este contrato.** Ningún endpoint de firma acepta
   recetas (`recetas_pacientes`, receta rápida, receta de lentes). Se imprimen en
   el front para firma de puño y letra. La receta electrónica para dispensación
   exige FEA; ni la FES ni una declaración del profesional la sustituyen.
7. **Ley 21.719:** los endpoints públicos no devuelven datos clínicos ni del paciente.
8. **Multi-tenant por instancia:** cada clínica tiene su backend y su BD. No hay
   `clinica_id` en el contrato.
9. **Clerk identifica al operador**, no necesariamente al firmante. Quien
   *prepara* y quien *firma* se registran por separado.

---

## 1. Convenciones (copiadas del backend actual)

| Aspecto | Convención | Fuente |
|---|---|---|
| Montaje | `app.use("/prefijo", router)` en `app.js` | `app.js` |
| Archivos | `view/<nombre>Routes.js`, `controller/<Nombre>Controller.js` (métodos `static async`), `model/<Nombre>.js` | `view/profesionalesRoutes.js` |
| Verbo | **POST** para todo lo autenticado, rutas camelCase con verbo (`seleccionar…`, `insertar…`, `actualizar…`, `listar…`, `descargar…`) | `view/archivoPacienteRoutes.js` |
| Públicos de lectura | `GET` (precedente: `/datosempresa/seleccionartodos`, `/notificaciones/:id/leer`) | |
| Archivos subidos | `multer({ storage: multer.memoryStorage() })`, `upload.single("campo")` | `view/archivoPacienteRoutes.js` |
| Validación | Manual en el controller | `controller/ProfesionalesController.js` |
| Éxito | `200 {message:true, ...datos}` | |
| Falta dato | `400 {message:"sindata"}` | |
| Error servidor | `500 {message:"serverError"}` (sin detalles al cliente; `console.error` en el servidor) | |
| Límite de tasa | `express-rate-limit`, respuesta `{message:"demasiadasSolicitudes"}` | `view/resenasRoutes.js` |
| Correo | API de Brevo + `construirCorreoBase` | `services/envioCotizacionCorreo.js`, `services/emailTemplateBase.js` |
| Archivos R2 | `subirArchivo`, `generarUrlDescarga`, `eliminarArchivoR2` | `services/r2Storage.js` |

**Nota de inconsistencia:** `ArchivoPacienteController` usa `{error}`/`{ok}`. Lo
nuevo usa **solo** `{message}`.

### 1.1 Códigos de error nuevos

Todos con forma `{message:"<codigo>"}`. Códigos en camelCase, como `sindata` y `conflicto`.

| HTTP | `message` | Cuándo |
|---|---|---|
| 400 | `sindata` | Falta un campo obligatorio |
| 401 | `noAutorizado` | Sin token o token inválido (mismo texto que `verificarApiKey`) |
| 403 | `sinPermiso` | Rol o profesional no corresponde |
| 403 | `reverificacionRequerida` | Ver §2.3 (lleva además `clerk_error`) |
| 404 | `noEncontrado` | Recurso inexistente |
| 409 | `firmaInexistente` | El firmante no tiene firma activa |
| 409 | `documentoYaFirmado` | Se intenta firmar un documento ya firmado |
| 409 | `documentoAnulado` | Operación sobre un documento anulado |
| 409 | `actaNoAceptada` | Registro de firma sin aceptar el acta vigente |
| 409 | `actaDesactualizada` | La versión de acta enviada no es la vigente |
| 422 | `rutInvalido` | RUT no pasa módulo 11 |
| 422 | `documentoInvalido` | Pasaporte con formato inválido |
| 422 | `pngInvalido` | Imagen de firma corrupta, no PNG, vacía o fuera de límites |
| 422 | `pdfInvalido` | Borrador no es PDF, excede tamaño o la zona de firma no calza |
| 422 | `archivoInvalido` | Certificado SIS con tipo o tamaño no permitido |
| 422 | `correoInvalido` | Correo destino inválido |
| 422 | `tipoDocumentoNoPermitido` | Tipo fuera del catálogo (incluye cualquier intento de "receta") |
| 409 | `otpRequerido` | Consentimiento sin la aceptación del paciente por código |
| 422 | `otpInvalido` | Código incorrecto |
| 409 | `otpExpirado` | Código vencido o inexistente |
| 429 | `otpIntentosAgotados` | Se superaron los 5 intentos |
| 422 | `sinDatoContacto` | El paciente no tiene el correo o teléfono elegido en su ficha |
| 429 | `demasiadasSolicitudes` | Límite de tasa |
| 503 | `servicioOcupado` | Hay demasiadas firmas procesándose a la vez; reintentar en unos segundos (§9 de `03`) |
| 413 | `archivoDemasiadoGrande` | El archivo supera el límite del endpoint |
| 500 | `serverError` | Error inesperado |

---

## 2. Autenticación

### 2.1 `middleware/exigirUsuarioClerk.js` (nuevo, *fail-closed*)

Igual que `verificarUsuarioClerk.js` (reutilizar su lógica de `verifyToken` +
`users.getUser`), pero:
- Sin token, token inválido o sin `CLERK_SECRET_KEY` → `401 {message:"noAutorizado"}`.
- Si Clerk API no responde, `503 {message:"serverError"}` (no se continúa sin identidad).
- Deja `req.usuario`:

```js
req.usuario = {
  clerkId: "user_3Inh…",              // sub del token
  idUsuario: Buffer(16),               // fila en usuario_plataforma (upsert por clerk_user_id)
  email, nombre,
  rol: "administrador-clinico",        // publicMetadata.role
  idProfesional: 46 | null,            // publicMetadata.idProfesionalAgenda (Number)
  fva: [3, -1],                        // edad (min) de verificación 1er/2º factor, del token
  sesionId: "sess_…",                  // sid
};
req.contexto = { ip: req.ip, userAgent: (req.get("user-agent") || "").slice(0, 255) };
```

`app.set('trust proxy', 1)` ya está, así que `req.ip` es la IP real.

### 2.2 Roles

Implementado en `services/firma/roles.js` con la **misma lógica que el front**
(`src/lib/dashboard-access.js`, perfiles por cargo y especialidad):

- `esAdministrador`: `tecnico-nativecode`, los perfiles `admin-*` y un profesional
  con el interruptor "También administra" (`profesional-x+admin`). Los valores
  antiguos de Clerk se traducen (`administrador-clinico` → `admin-clinica`, etc.).
- `esRolClinico`: administradores y profesionales. **Recepción no** (no ve fichas).
- `esProfesionalDueno(u, id)`: `publicMetadata.idProfesionalAgenda` = `id`.
- Un rol vacío o desconocido **no** da acceso.

### 2.3 `middleware/exigirReverificacion.js` (nuevo)

`exigirReverificacion({ minutos = 10 })`. Usar después de `exigirUsuarioClerk`.

- Lee `req.usuario.fva`. Válido si `fva[0] >= 0 && fva[0] <= minutos` (primer
  factor). Si el usuario tiene 2FA, aceptar también `fva[1] >= 0 && fva[1] <= minutos`.
- Si no cumple, responde **exactamente**:

```http
HTTP/1.1 403
{
  "message": "reverificacionRequerida",
  "clerk_error": {
    "type": "forbidden",
    "reason": "reverification-error",
    "metadata": { "reverification": { "level": "first_factor", "afterMinutes": 10 } }
  }
}
```

  Esa forma es la que `useReverification` de `@clerk/nextjs` reconoce para
  mostrar la ventana y reintentar. Confirmar contra la versión instalada
  (`@clerk/nextjs` 6.39.4 / `@clerk/backend` 3.20.1) en la primera prueba.
- Deja `req.reverificacion = { metodo, autenticadoAt }`:
  - `metodo`: `"clerk_reverificacion_primer_factor"` o `"clerk_reverificacion_segundo_factor"`.
  - `autenticadoAt`: `ahora − fva[n] minutos` (ISO UTC, precisión de minuto; se
    documenta como aproximado porque Clerk expone la edad en minutos).

### 2.4 Endpoints públicos

Sin token, con `express-rate-limit` por IP:
- `GET /consentimientos/seleccionarVigentes` — 60 / 10 min
- `POST /consentimientos/registrarAceptacion` — 10 / 10 min
- `GET /verificacion/:codigo` — 30 / 10 min
- `POST /verificacion/compararHash` — 10 / 10 min

---

## 3. Formatos comunes

- **UUID:** strings canónicos `"0192b3c4-…"` (UUIDv7). En BD `BINARY(16)`.
- **Instantes:** ISO 8601 UTC con milisegundos: `"2026-10-23T01:25:57.123Z"`. El
  front los formatea con `formatearInstanteConOffset` (America/Santiago).
- **Código de verificación:** `"A7K2-9QX4"` — 8 caracteres Crockford base32 sin
  `I L O U`, agrupados 4-4.
- **Huella:** SHA-256 en hex minúscula, 64 caracteres.

### 3.1 Objeto `firma`

```json
{
  "id_firma": "0192b3c4-5d6e-7f80-9a1b-2c3d4e5f6a7b",
  "id_profesional": 46,
  "estado": "activa",
  "tinta": "azul",
  "ancho_px": 512,
  "alto_px": 200,
  "imagen_sha256": "9f2c…",
  "acta_version": "1.0",
  "registrada_at": "2026-10-23T01:20:11.402Z"
}
```

`estado`: `activa | reemplazada | revocada`. **Nunca** incluye la imagen ni su clave R2.

### 3.2 Objeto `registroSis`

```json
{
  "numero": "438291",
  "estado": "declarado",
  "tiene_certificado": true,
  "verificado_por": "Dan Sepúlveda",
  "verificado_at": null,
  "motivo_rechazo": null
}
```

`estado`: `no_informado | declarado | verificado | rechazado`.

### 3.3 Objeto `documento`

```json
{
  "id_documento": "0192b3c4-…",
  "codigo_verificacion": "A7K2-9QX4",
  "tipo_documento": "cotizacion",
  "titulo": "Cotización N° 48",
  "estado": "firmado",
  "id_paciente": 2283,
  "paciente_nombre": "Nicolas Ortega Carrasco",
  "id_profesional_firmante": 46,
  "firmante_nombre": "Maria Jose Pizarro",
  "preparado_por": "PRUEBAS EJEMPLO",
  "preparado_at": "2026-10-23T01:24:02.110Z",
  "firmado_at": "2026-10-23T01:25:57.123Z",
  "pdf_sha256": "a3f9…7c21",
  "paginas": 2,
  "anulado_at": null
}
```

`estado`: `pendiente_firma | firmado | anulado`. Antes de firmar, `firmado_at` y
`pdf_sha256` son `null`.

### 3.5 Descargas: URL firmada de R2

Los archivos (borradores, PDF firmados, constancias, certificados) **no pasan por el
backend** al descargarse: así no consumen su memoria ni su ancho de banda.

```json
// 200
{
  "message": true,
  "url": "https://<cuenta>.r2.cloudflarestorage.com/…?X-Amz-Signature=…",
  "expira_at": "2026-10-23T21:41:55.000Z",
  "sha256": "a3f9…7c21",
  "nombre": "cotizacion-A7K2-9QX4.pdf"
}
```

- La URL vence a los **60 segundos** (`generarUrlDescarga(key, 60)`) e incluye
  `ResponseContentDisposition: inline; filename="…"` y
  `ResponseCacheControl: no-store`.
- El front descarga desde esa URL y **comprueba que el SHA-256 del archivo sea
  `sha256`**; si no coincide, no lo muestra (`integridad`).
- La bitácora se escribe antes de entregar la URL: si la escritura falla, no se
  entrega la URL.
- Requiere **CORS en el bucket R2** que permita `GET` desde el dominio de cada
  clínica (y `localhost` en desarrollo). Sin eso el navegador bloquea la descarga.
- Excepción: `seleccionarImagenFirma` sigue entregando el PNG directo (pesa pocos KB y
  nunca debe tener una URL que pueda copiarse).

### 3.4 Catálogo `tipo_documento`

`cotizacion`, `presupuesto`, `orden_examen`, `ficha_clinica`,
`consentimiento_informado`, `indicaciones`, `certificado_atencion`.

**`receta` y `receta_lentes` no forman parte del catálogo** y no deben agregarse
mientras no exista integración con un prestador de FEA acreditado.

Cualquier otro valor → `422 tipoDocumentoNoPermitido`.

---

## 4. Firma del profesional — router `/firmaProfesional`

Archivo: `view/firmaProfesionalRoutes.js`. Montaje en `app.js`:
`app.use("/firmaProfesional", firmaProfesionalRoutes);`

Todas con `exigirUsuarioClerk`.

### 4.1 `POST /firmaProfesional/seleccionarEstadoFirma`

Permiso: administrador o profesional dueño.

```json
// Request
{ "id_profesional": 46 }
// 200
{ "message": true, "firma": { …objeto firma… } | null, "registroSis": { …objeto registroSis… } }
```

Errores: `400 sindata`, `403 sinPermiso`, `404 noEncontrado`.

### 4.2 `POST /firmaProfesional/seleccionarActaVigente`

Permiso: cualquier usuario autenticado.

```json
// 200
{ "message": true, "acta": { "version": "1.0", "titulo": "Acta de adhesión a firma electrónica simple", "cuerpo": "…", "sha256": "…" } }
```

### 4.3 `POST /firmaProfesional/registrarFirma`

Middlewares: `exigirUsuarioClerk`, `exigirReverificacion({minutos:10})`,
`upload.single("imagen")` con `limits: { fileSize: 512 * 1024 }`.

Permiso: **solo el profesional dueño** (`esProfesionalDueno`). Un administrador
recibe `403 sinPermiso` (la firma no se captura por terceros).

`multipart/form-data`:

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `imagen` | archivo PNG | Sí | ≤ 512 KB, PNG válido |
| `id_profesional` | int | Sí | = `req.usuario.idProfesional` |
| `tinta` | `azul\|negro` | Sí | |
| `trazos` | string JSON | Sí | `[[{x,y,t},…],…]`, ≥ 1 trazo, ≥ 20 puntos, ≤ 20 000 puntos |
| `acta_version` | string | Sí | = versión vigente |
| `acta_aceptada` | `"true"` | Sí | |

Servidor: valida, **recorta al bounding box y normaliza** (200 px de alto, máx
600 de ancho, PNG con alfa), calcula `imagen_sha256` sobre el PNG **normalizado**,
sube PNG y trazos a R2, en una transacción marca la firma anterior como
`reemplazada`, inserta la nueva `activa`, y registra eventos `acta_aceptada` y
`firma_registrada` (más `firma_reemplazada` si aplica) en la cadena de evidencia.

```json
// 200
{ "message": true, "firma": { …objeto firma… } }
```

Errores: `400 sindata`, `403 sinPermiso`, `403 reverificacionRequerida`,
`409 actaNoAceptada`, `409 actaDesactualizada`, `422 pngInvalido`.

### 4.4 `POST /firmaProfesional/seleccionarImagenFirma`

Permiso: **solo el profesional dueño**.

```json
{ "id_profesional": 46 }
```

200: cuerpo binario `image/png`, cabeceras `Cache-Control: no-store`,
`Content-Disposition: inline`. Errores JSON: `403 sinPermiso`, `409 firmaInexistente`.

### 4.5 `POST /firmaProfesional/revocarFirma`

Middlewares: `exigirUsuarioClerk`, `exigirReverificacion`. Permiso: profesional dueño **o** administrador.

```json
{ "id_profesional": 46, "motivo": "Cambio de firma" }
// 200
{ "message": true }
```

Registra `firma_revocada`. Los documentos ya firmados **no se tocan**.

---

## 5. Registro Superintendencia — router `/profesionales` (existente)

Se agregan rutas al archivo actual `view/profesionalesRoutes.js`.

### 5.1 Cambios a rutas existentes (compatibles hacia atrás)

- `POST /profesionales/insertarProfesional` y `actualizarProfesional`: aceptan
  campo **opcional** `registro_sis_numero` (string de dígitos, 1–10). Si cambia,
  el estado pasa a `declarado` (o `no_informado` si viene vacío) y se registra
  evento `registro_sis_declarado`. **Además** validan `rutProfesional` con módulo
  11 → `422 rutInvalido`. Respuesta sin cambios: `{message:true}`.
- **Foto del profesional** — `insertarProfesional` y `actualizarProfesional` aceptan
  además `imagenProfesional` (opcional): el id de Cloudflare Images que devuelve el
  endpoint existente `POST /cloudflare/subirimagenes`. Regla: `""` → guardar
  `NULL` (quita la foto); si viene, debe calzar con `/^[A-Za-z0-9-]{1,200}$/`
  (si no, `422 {message:"archivoInvalido"}`). Se guarda en la columna que **ya
  existe** `profesionales.imagenProfesional`. La página pública
  (`Componentes/PaginaPublica/Comunes/Avatar.jsx`) y la tarjeta del dashboard la
  muestran con `https://imagedelivery.net/<hash>/<id>/<variante>`; sin foto,
  muestran la silueta de profesional de salud.
- `GET /profesionales/seleccionarTodosProfesionales` y `seleccionarProfesional`:
  agregan a cada fila (sin quitar nada):

```json
{
  "registro_sis_numero": "438291",
  "registro_sis_estado": "declarado",
  "firma_estado": "activa"            // activa | ninguna  (calculado con LEFT JOIN)
}
```

  **Nunca** devuelven claves R2 ni datos de la firma.

> Deuda conocida: estas rutas siguen abiertas sin token. Se recomienda proteger
> `insertar/actualizar/eliminar` con `exigirUsuarioClerk` antes del 1-dic; la
> lectura la usa la página pública de agenda y debe seguir abierta (sin
> exponer datos nuevos sensibles).

### 5.2 `POST /profesionales/actualizarRegistroSis`

Middlewares: `exigirUsuarioClerk`, `upload.single("certificado")` con
`limits: { fileSize: 5 * 1024 * 1024 }`. Permiso: administrador o profesional dueño.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `id_profesional` | int | Sí | |
| `registro_sis_numero` | string | No | dígitos 1–10; vacío = borrar |
| `certificado` | archivo | No | `application/pdf`, `image/jpeg`, `image/png`; ≤ 5 MB; tipo comprobado por firma mágica, no solo por mimetype |

```json
// 200
{ "message": true, "registroSis": { …objeto registroSis… } }
```

### 5.3 `POST /profesionales/verificarRegistroSis`

Middleware: `exigirUsuarioClerk`. Permiso: **solo administrador**.

```json
{ "id_profesional": 46, "decision": "verificado" }
{ "id_profesional": 46, "decision": "rechazado", "motivo": "El número no corresponde al RUT en RNPI" }
// 200
{ "message": true, "registroSis": { … } }
```

`motivo` obligatorio si `rechazado`. Registra `registro_sis_verificado` o
`registro_sis_rechazado` con el administrador como actor.

### 5.4 `POST /profesionales/descargarCertificadoSis`

Permiso: administrador o profesional dueño. Responde una **URL firmada** (ver §3.5).

---

## 6. Documentos — router `/documentos`

Archivo: `view/documentosRoutes.js`. Montaje: `app.use("/documentos", documentosRoutes);`
Todas con `exigirUsuarioClerk`.

### 6.1 `POST /documentos/prepararDocumento`

Crea el documento en `pendiente_firma` con el **cuerpo** del PDF generado por el
front (sin firma). Puede llamarlo un operador distinto del firmante.

Middleware extra: `upload.single("pdf")`, `limits: { fileSize: 10 * 1024 * 1024 }`.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `pdf` | archivo | Sí | `%PDF-` al inicio, ≤ 10 MB, ≤ 40 páginas, abre con `pdf-lib` |
| `tipo_documento` | string | Sí | catálogo §3.4 |
| `titulo` | string | Sí | ≤ 255 |
| `id_profesional_firmante` | int | Sí | profesional activo |
| `id_paciente` | int | No (Sí en `consentimiento_informado`) | si viene, debe existir |
| `aceptante_nombre` / `aceptante_documento` | string | Solo consentimiento | quién acepta con el código: el paciente o su representante legal. Se estampa en la zona del paciente |
| `referencia_tabla` | string | No | lista blanca: `cotizaciones_pacientes`, `fichaClinica`, `examenes_clinicos`, `presupuesto` |
| `referencia_id` | int | No | |
| `zona_firma` | JSON | Sí | `{"pagina":2,"x":18,"y":190,"ancho":175.9,"alto":56}` mm; debe caber en la página indicada |
| `zona_paciente` | JSON | Solo `consentimiento_informado` | `{"pagina":2,"x":20,"y":42,"ancho":175.9,"alto":26}` mm: zona donde se estampa la aceptación del paciente por código. Si viene, el documento **exige** OTP antes de firmar |
| `metadatos` | JSON | Sí | ver abajo |

`metadatos` (snapshot para la evidencia; ≤ 64 KB):

```json
{
  "plantillas": [
    { "codigo": "consentimiento_base", "version": 3, "sha256": "…" },
    { "codigo": "anexo_armonizacion_facial", "version": 1, "sha256": "…" }
  ],
  "resumen": "Consentimiento v3 · plantilla base + anexo armonización facial",
  "texto_renderizado": "…texto completo que leyó el paciente…"
}
```

`resumen` es la última línea del pie de firma (≤ 90 caracteres).
`texto_renderizado` es obligatorio para `consentimiento_informado`.

Permiso: administrador, el propio firmante, o cualquier rol clínico con acceso al
paciente (mismos roles que hoy acceden a fichas, ver `canAccessFichasClinicas`
en el front). Registra en bitácora `generado` con el operador.

```json
// 200
{ "message": true, "documento": { …objeto documento, estado "pendiente_firma"… } }
```

### 6.2 `POST /documentos/seleccionarBorrador`

Permiso: firmante, quien lo preparó, o administrador. Responde una **URL firmada**
del borrador (§3.5) con su `borrador_sha256`. Registra `visto` (sobre borrador).

```json
{ "id_documento": "0192b3c4-…" }
```

### 6.3 `POST /documentos/firmarDocumento`

Middlewares: `exigirUsuarioClerk`, `exigirReverificacion({minutos:10})`.
Permiso: **solo el profesional firmante** (`esProfesionalDueno(req.usuario, documento.id_profesional_firmante)`).

```json
{ "id_documento": "0192b3c4-…" }
```

Servidor (en este orden, dentro de una transacción con bloqueo de fila):
1. Documento en `pendiente_firma` (si no: `409 documentoYaFirmado` / `documentoAnulado`).
2. Firma activa del firmante (si no: `409 firmaInexistente`).
3. `firmado_at = new Date()` del **servidor**.
4. Lee el borrador de R2, estampa en `zona_firma`: grafía, nombre, profesión,
   registro SIS (si existe), leyenda FES Ley 19.799, fecha y hora con desfase de
   America/Santiago calculado, código, `resumen`, QR → URL de verificación.
5. `pdf_sha256 = sha256(bytes finales)`. Sube a R2. Guarda.
6. Inserta evento `documento_firmado` en la cadena (método de reverificación, `autenticado_at`, IP, UA, hash).

La firma se registra como **evento de evidencia**, no como acción de bitácora.
La bitácora (`documento_acceso`) registra `generado` al preparar y después
`visto`, `descargado`, `enviado` e `impreso`.

```json
// 200
{ "message": true, "documento": { …estado "firmado", firmado_at, pdf_sha256… } }
```

### 6.4 `POST /documentos/descargarDocumento`

Permiso: firmante, preparador, administrador o rol clínico con acceso al paciente.

```json
{ "id_documento": "0192b3c4-…", "accion": "visto" }   // visto | descargado | impreso
```

Registra la acción en bitácora **antes** de responder y entrega una **URL firmada**
(§3.5) del PDF guardado, con su `pdf_sha256`. El archivo no pasa por el backend.
Si el documento aún no está firmado → `404 noEncontrado` (el borrador se lee solo
con `seleccionarBorrador`).

### 6.5 `POST /documentos/enviarDocumentoCorreo`

```json
{ "id_documento": "0192b3c4-…", "correo": "paciente@correo.cl" }   // correo opcional
```

- Si no viene `correo`, usa `pacienteDatos.correo`. Si no hay → `422 correoInvalido`.
- Adjunta **los bytes guardados** (base64 solo para el payload de Brevo, como hoy en cotizaciones).
- Correo con `construirCorreoBase`: tipo, título, profesional, código de verificación y enlace a la verificación pública. Sin contenido clínico en el cuerpo del correo (Ley 21.719: el detalle va solo en el adjunto).
- Registra `enviado` con `destinatario`.

```json
// 200
{ "message": true, "enviadoA": "p•••••e@correo.cl" }
```

### 6.6 `POST /documentos/listarDocumentosPaciente`

```json
{ "id_paciente": 2283 }
// 200
{ "message": true, "documentos": [ …objetos documento, más recientes primero… ] }
```

### 6.7 `POST /documentos/listarPendientesFirma`

Sin cuerpo. Devuelve los `pendiente_firma` cuyo firmante es `req.usuario.idProfesional`.

```json
{ "message": true, "documentos": [ … ] }
```

### 6.8 `POST /documentos/anularDocumento`

Middlewares: `exigirUsuarioClerk`, `exigirReverificacion`. Permiso: firmante o administrador.

```json
{ "id_documento": "0192b3c4-…", "motivo": "Error en el monto" }
// 200
{ "message": true }
```

No borra nada. Registra `documento_anulado`. La verificación pública lo muestra como anulado.

### 6.9 Aceptación del paciente por código (OTP)

Para el consentimiento informado: el paciente acepta con un código de 6 dígitos
enviado al correo o teléfono **ya registrado en su ficha** (`pacienteDatos`). Nunca
se acepta un destino escrito en el momento: eso es lo que permite atribuir la
aceptación al paciente. Implementado en el front
(`Componentes/documentos/AceptacionPacienteOtp.jsx`).

Orden del flujo: `prepararDocumento` (con `zona_paciente`) → `solicitarOtpPaciente`
→ `verificarOtpPaciente` → `firmarDocumento` (el servidor estampa la aceptación del
paciente y la firma del profesional en el mismo PDF, y recién ahí calcula el hash).

#### `POST /documentos/solicitarOtpPaciente`

Middleware: `exigirUsuarioClerk` (lo opera el profesional o recepción con el
paciente presente). Límite de tasa: 5 / 10 min por documento.

```json
{ "id_documento": "0192b3c4-…", "canal": "sms" }   // "sms" | "email"
// 200
{ "message": true, "destino": "+56 9 •••• 5678", "expira_at": "2026-10-23T21:50:55.000Z" }
```

- Genera un código de 6 dígitos con `crypto.randomInt`, guarda solo su HMAC en
  `paciente_otp` (nunca el código), vigencia **10 minutos**, máximo **5 intentos**.
  Un código nuevo invalida el anterior del mismo documento.
- Envía por Twilio (SMS) o por Brevo (correo), ambos ya usados por el backend.
- Errores: `404 noEncontrado`, `409 documentoYaFirmado`, `422 sinDatoContacto` (el
  paciente no tiene ese dato en su ficha), `422 tipoDocumentoNoPermitido` (el
  documento no tiene `zona_paciente`), `429 demasiadasSolicitudes`.
- En modo de prueba del front (mock) la respuesta trae además `codigo_prueba`. **El
  backend real nunca devuelve el código.**

#### `POST /documentos/verificarOtpPaciente`

```json
{ "id_documento": "0192b3c4-…", "codigo": "482913" }
// 200
{ "message": true, "aceptacion": { "canal": "sms", "destino": "+56 9 •••• 5678", "verificado_at": "2026-10-23T21:40:55.000Z" } }
```

- Compara en tiempo constante el HMAC del código. Si es correcto: marca
  `verificado_at`, guarda en `documento_emitido` los datos de la aceptación y
  registra el evento `otp_paciente_verificado` (`actor_tipo: "paciente"`,
  `metodo_autenticacion: "otp_sms"` u `"otp_email"`, IP y navegador de la consulta).
- Errores: `422 otpInvalido` (suma un intento), `409 otpExpirado`,
  `429 otpIntentosAgotados`.

#### Cambios en `firmarDocumento`

- Si el documento tiene `zona_paciente` y el paciente no aceptó →
  `409 otpRequerido`.
- Si aceptó, estampa en `zona_paciente`: nombre y documento del paciente (o de su
  representante), canal y destino enmascarado, fecha y hora de verificación con
  desfase, y la referencia a la Ley 19.799. Luego estampa la firma del profesional
  y calcula el SHA-256 del PDF con ambas.

---

## 7. Consentimientos — router `/consentimientos`

Archivo: `view/consentimientosRoutes.js`.

> **Una sola casilla obligatoria: la política de privacidad** (`tratamiento_datos`).
> Los "Derechos y deberes del paciente" (`derechos_deberes_paciente`, Ley 20.584) se
> muestran como **enlace de lectura, sin casilla**: la ley exige informarlos, no
> aceptarlos. La casilla es obligatoria en la reserva con y sin pago, aunque la
> instancia no tenga activado este backend: la Ley 21.719 rige
> desde el 1 de diciembre de 2026. Mientras `NEXT_PUBLIC_FIRMA_HABILITADA` no esté
> activo, el front muestra los textos de respaldo y **no registra** la aceptación en
> el servidor (`token_aceptacion: null`). Al activar este router, la aceptación queda
> guardada con versión, huella SHA-256, fecha, IP y constancia por correo: es lo
> único que permite **probar** el consentimiento, así que conviene activarlo antes
> del 1 de diciembre.

### 7.1 `GET /consentimientos/seleccionarVigentes` (público)

```json
// 200
{
  "message": true,
  "plantillas": [
    { "id_plantilla": "0192…", "codigo": "tratamiento_datos", "version": 2, "titulo": "Política de tratamiento de datos personales y de salud", "cuerpo": "…{{empresa.nombre}}…", "sha256": "…", "vigente_desde": "2026-11-15T03:00:00.000Z" },
    { "id_plantilla": "0192…", "codigo": "derechos_deberes_paciente", "version": 1, "titulo": "Derechos y deberes del paciente", "cuerpo": "…", "sha256": "…", "vigente_desde": "…" }
  ]
}
```

`sha256` se calcula sobre `cuerpo` **sin interpolar**. Variables permitidas:
`{{empresa.nombre}}`, `{{empresa.direccion}}`, `{{empresa.correo}}`, `{{empresa.telefono}}`, `{{profesional.nombre}}`.

### 7.2 `POST /consentimientos/registrarAceptacion` (público, con límite de tasa)

```json
{
  "aceptaciones": [
    { "codigo": "tratamiento_datos", "id_plantilla": "0192…", "version": 2, "sha256": "…" }
  ],
  "paciente": {
    "nombre": "Ana", "apellido": "Pérez",
    "tipo_documento": "rut", "documento": "123456785",
    "correo": "ana@correo.cl", "telefono": "+56912345678"
  },
  "id_profesional": 46
}
```

Validaciones: la aceptación de `tratamiento_datos` presente (los textos de solo lectura no se envían ni se registran); `id_plantilla`+`version`+`sha256`
deben ser las **vigentes** (si no: `409 actaDesactualizada` → el front recarga
textos); `rutInvalido`/`documentoInvalido`; correo válido.

Servidor: fija `aceptado_at`, IP y UA; renderiza el texto interpolado; genera
**una vez** el PDF de constancia (texto + bloque de aceptación del paciente +
código + QR), lo sube a R2 con su SHA-256; registra evento
`consentimiento_aceptado` por cada aceptación.

```json
// 200
{ "message": true, "token_aceptacion": "ca_9f2c…(32 hex)", "codigo_verificacion": "K3M8-QZ2P" }
```

### 7.3 Vinculación con la reserva (cambio a endpoints existentes)

- `POST /reservaPacientes/insertarReservaPacienteFicha` y
  `POST /pagosMercadoPago/create-order`: aceptan campo **opcional**
  `token_aceptacion`. Tras insertar la reserva (o al confirmar el pago), el
  backend actualiza `consentimiento_aceptacion.id_reserva` e `id_paciente` (por
  RUT/documento). Si el token no existe o ya fue usado, **no** falla la reserva:
  registra `console.error` y sigue (la reserva no debe perderse por esto).
- Respuestas sin cambios.

### 7.4 `POST /consentimientos/listarPorPaciente` (auth)

```json
{ "id_paciente": 2283 }
// 200
{ "message": true, "aceptaciones": [
  { "id_aceptacion": "0192…", "codigo": "tratamiento_datos", "titulo": "…", "version": 1,
    "aceptado_at": "…", "codigo_verificacion": "K3M8-QZ2P", "origen": "web", "revocado_at": null }
] }
```

### 7.5 `POST /consentimientos/descargarAceptacion` (auth)

```json
{ "id_aceptacion": "0192…", "accion": "visto" }   // visto | descargado | impreso
```

Registra en bitácora y responde una **URL firmada** (§3.5) de la constancia guardada.

### 7.6 `POST /consentimientos/enviarAceptacionCorreo` (auth)

```json
{ "id_aceptacion": "0192…" }
// 200
{ "message": true, "enviadoA": "a•••@correo.cl" }
```

### 7.7 `POST /consentimientos/revocarAceptacion` (auth, administrador)

Registra la revocación solicitada por el paciente (derecho de la Ley 21.719).
`{ id_aceptacion, motivo }` → `{message:true}`. No borra la constancia.


### 7.8 Procedimientos del consentimiento informado — router `/procedimientos`

Archivo: `view/procedimientosRoutes.js`. Todas con `exigirUsuarioClerk`. Se guardan en
`documento_plantilla` (categoría `anexo_procedimiento`), **sin tabla nueva**. El texto
lo arma el servidor desde campos fijos (`services/firma/anexos.js`, copia exacta de
`src/lib/consentimientos/procedimientos.js`). Pantalla: `/dashboard/procedimientosConsentimiento`.

Objeto `procedimiento`:

```json
{
  "id_plantilla": "0192…", "codigo": "anexo_bioestimulador_de_colageno",
  "grupo": "Armonización facial", "nombre": "Bioestimulador de colágeno",
  "version": 2, "cuerpo": "## En qué consiste\n…", "sha256": "…", "estado": "vigente",
  "vigente_desde": "2026-10-24T03:35:11.708Z", "retirada_at": null,
  "creado_por": "Admin Clínica", "origen": "clinica"
}
```

`origen`: `ejemplo` (los 14 del seed) | `clinica` (creado o editado por la clínica).

Campos (`campos` en crear y nuevaVersion), todos texto:

| Campo | Obligatorio | Formato en el anexo |
|---|---|---|
| `descripcion` | Sí | `## En qué consiste` + párrafos |
| `riesgos_frecuentes` | Sí | `## Riesgos frecuentes` + un ítem por línea |
| `riesgos_poco_frecuentes` | Sí | `## Riesgos poco frecuentes` + un ítem por línea |
| `alternativas` | Sí | `## Alternativas` + párrafos |
| `contraindicaciones` | No | `## Contraindicaciones` |
| `si_no_se_realiza` | Sí | `## Si no se realiza` |
| `cuidados` | No | `## Cuidados posteriores` |

Límites: nombre ≤ 120, especialidad ≤ 60, cada campo ≤ 2000, listas ≤ 15 ítems de ≤ 500.

| Endpoint | Permiso | Request | Respuesta |
|---|---|---|---|
| `POST /procedimientos/listar` | rol clínico | — | `{ message, procedimientos: [vigentes] }` |
| `POST /procedimientos/historial` | rol clínico | `{ codigo }` | `{ message, versiones: [todas, v más alta primero] }` |
| `POST /procedimientos/crear` | administrador | `{ nombre, grupo, campos }` | `{ message, procedimiento }` (v1) |
| `POST /procedimientos/nuevaVersion` | administrador | `{ codigo, nombre, grupo, campos }` | `{ message, procedimiento }` (v+1; la anterior queda `retirada`) |
| `POST /procedimientos/retirar` | administrador | `{ codigo }` | `{ message }` |

Errores: `422 datoinvalido` (falta un punto del art. 14 o excede un límite),
`409 procedimientoDuplicado` (ya hay uno vigente con el mismo nombre y especialidad,
sin distinguir mayúsculas ni tildes; responde también su `codigo` para editarlo),
`409 sinCambios` (nueva versión idéntica a la vigente), `404 noEncontrado`, `403 sinPermiso`.

Reglas: el código sale del nombre (`anexo_<slug>`; si ya existió, `_2`, `_3`…).
Publicar una versión retira la anterior **en la misma transacción** (una sola vigente
por código, índice `uq_plantilla_vigente`). Lo ya firmado no cambia: cada documento
guarda su propio texto renderizado y la huella de la versión usada.
---

## 8. Verificación pública — router `/verificacion`

### 8.1 `GET /verificacion/:codigo`

```json
// 200 — existe
{
  "message": true,
  "existe": true,
  "tipo": "documento",                 // documento | consentimiento
  "tipo_documento": "cotizacion",
  "estado": "firmado",                 // firmado | anulado
  "emisor": { "nombre": "Maria Jose Pizarro", "profesion": "Matrona", "registro_sis": "438291" },
  "clinica": "Clinica Salud Mujer",
  "firmado_at": "2026-10-23T01:25:57.123Z",
  "codigo": "A7K2-9QX4"
}
// 200 — no existe
{ "message": true, "existe": false }
```

Para `consentimiento`, `emisor` es `null` y se informa solo fecha de aceptación
(sin nombre del paciente). **Nunca** paciente, contenido ni hash completo.
Registra `verificado_publico` en bitácora (sin datos personales del visitante
más allá de IP).

### 8.2 `POST /verificacion/compararHash`

`multipart/form-data`: `codigo`, `pdf` (≤ 10 MB). El servidor calcula el SHA-256
del archivo recibido y lo compara con el guardado.

```json
{ "message": true, "coincide": true }
```

---

## 9. Variables de entorno nuevas (backend, por instancia)

| Variable | Uso |
|---|---|
| `FIRMA_HMAC_CLAVE` | Clave (≥ 32 bytes, base64) para sellar la cadena de evidencia. **Nunca** en el repo |
| `FIRMA_HMAC_VERSION` | Entero; permite rotar la clave sin romper la verificación histórica |
| `URL_PUBLICA_SITIO` | Base de la URL del QR: `https://<dominio-clinica>` (con `https://`) |
| `FIRMA_REVERIFICACION_MIN` | Opcional, default 10 |
| `R2_BUCKET_PRIVADO` | Opcional; si no existe se usa `R2_BUCKET` con prefijo `privado/` |

---

## 10. Matriz de permisos

| Endpoint | Admin | Profesional dueño / firmante | Operador clínico | Público |
|---|---|---|---|---|
| seleccionarEstadoFirma | ✓ | ✓ | — | — |
| registrarFirma | — | ✓ (+reverif.) | — | — |
| seleccionarImagenFirma | — | ✓ | — | — |
| revocarFirma | ✓ (+reverif.) | ✓ (+reverif.) | — | — |
| actualizarRegistroSis | ✓ | ✓ | — | — |
| verificarRegistroSis | ✓ | — | — | — |
| prepararDocumento | ✓ | ✓ | ✓ | — |
| seleccionarBorrador | ✓ | ✓ | preparador | — |
| firmarDocumento | — | ✓ (+reverif.) | — | — |
| descargar / enviar / listar | ✓ | ✓ | ✓ | — |
| anularDocumento | ✓ (+reverif.) | ✓ (+reverif.) | — | — |
| consentimientos (auth) | ✓ | ✓ | ✓ | — |
| procedimientos: listar / historial | ✓ | ✓ | ✓ | — |
| procedimientos: crear / nuevaVersion / retirar | ✓ | — | — | — |
| seleccionarVigentes / registrarAceptacion | | | | ✓ |
| verificación | | | | ✓ |

---

## 11. Decisiones abiertas

| # | Pregunta | Propuesta |
|---|---|---|
| C1 | ¿Proteger con token las rutas de escritura existentes (`/profesionales/insertar…`, `/archivoPaciente/*`, `/recetas/*`) antes del 1-dic? | Sí; requiere que el front mande el token en esas pantallas |
| C2 | Ventana de reverificación | 10 min |
| C3 | Recetas | Fuera de la FES; solo impresión manuscrita en el front |
| C4 | ¿Operador clínico puede descargar documentos de pacientes que no atiende? | Hoy no hay asignación paciente-profesional; mantener rol actual y registrar todo en bitácora |
| C5 | Correos enmascarados en respuestas (`enviadoA`) | Sí |
