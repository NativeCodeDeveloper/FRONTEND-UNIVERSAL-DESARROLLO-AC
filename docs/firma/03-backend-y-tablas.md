# Firma Electrónica Simple (FES) — 03 · Backend, migraciones y SQL

> Documento autocontenido para implementar el backend en
> `BACKEND-DESARROLLO-UNIVERSAL-AC` (Express 5, ESM, MySQL 8.0, Cloudflare R2).
> Un agente que solo lea este archivo debe poder crear las tablas, los modelos,
> los servicios y los controladores. Las formas exactas de request/response
> están también en `02-contrato-endpoints.md`; aquí se repiten las esenciales.

Orden del proyecto: frontend → contrato → **backend y tablas (este documento)**.
El cliente ejecuta la migración en el servidor de desarrollo.

> **Para implementar el backend, empezar por `04-guia-backend-paso-a-paso.md`:** el código
> completo y probado está en `docs/firma/backend/`, y la guía indica fase por fase
> qué copiar y qué líneas agregar en los archivos existentes.

---

## 0. Restricciones no negociables

1. **Ley 19.799 art. 3 — FES nativa.** Si el firmante niega haber firmado, la
   prueba es nuestra. Tres patas: identificación (reverificación Clerk ≤ 10 min),
   voluntad (firma sobre el borrador que el firmante vio), integridad (SHA-256 del
   PDF final calculado aquí).
2. **El PNG no es la firma.** La firma legal es la fila de `firma_evento`.
3. **El PDF firmado se genera una sola vez** (`firmarDocumento`). Se guardan los
   bytes en R2 y se sirven tal cual siempre. **Nunca regenerar al descargar.**
4. **El hash se calcula en el servidor** sobre los bytes finales con la grafía
   incrustada. Jamás aceptar un hash del cliente.
5. **`firmado_at` y todo `*_at` vienen del reloj del servidor.**
6. **Zona horaria:** MySQL no tiene `timestamptz`. Equivalente adoptado:
   `DATETIME(3)` **siempre en UTC**, escrito desde la app como texto UTC
   (`'2026-10-23 01:25:57.123'`), nunca pasando objetos `Date` a `mysql2` (el pool
   usa `timezone:'local'` por defecto y no se cambia para no afectar el código
   existente). Se renderiza en `America/Santiago` con el desfase **calculado** por
   `Intl`, nunca hardcodeado. No usar `TIMESTAMP` (límite 2038 y conversión por
   sesión).
7. **Evidencia append-only:** `firma_evento` y `documento_acceso` rechazan UPDATE
   y DELETE por trigger, la cadena se encadena con `hash_anterior` y se sella con
   HMAC-SHA256 (`FIRMA_HMAC_CLAVE`). `REVOKE` al usuario de la app: ver §3.4
   (MySQL no permite revocar sobre una tabla lo concedido a nivel de base).
8. **Imagen de firma:** nunca base64 en BD. R2 privado, clave aleatoria no
   adivinable, servida solo por endpoint autenticado. En BD: clave, hash, mime,
   dimensiones.
9. **Recorte y normalizado del PNG en el servidor** (`sharp`): PNG con alfa,
   recortado al bounding box, 200 px de alto, máx 600 px de ancho.
10. **Una sola firma activa por profesional**, garantizado por la BD: columna
    generada + `UNIQUE` (equivalente MySQL del índice parcial único).
11. **UUID como PK en tablas nuevas.** El repo usa `INT AUTO_INCREMENT` y no tiene
    convención UUID → se adopta **UUIDv7 generado en la app**, guardado en
    `BINARY(16)` con `UUID_TO_BIN(?)` (sin el flag de swap: v7 ya es ordenado por
    tiempo). Justificación: inserción al final del índice clustered de InnoDB
    (sin fragmentación como v4), 16 bytes en vez de 36, no enumerable.
12. **Multi-tenant por instancia:** una BD por clínica. Las tablas nuevas **no**
    llevan `clinica_id` (mismo mecanismo que el resto del proyecto).
13. **Verificación pública sin datos clínicos** ni del paciente.
14. **Recetas: no se implementan en la FES.** El ENUM `tipo_documento` no incluye
    `receta` ni `receta_lentes`, y no deben agregarse mientras no haya integración
    con un prestador de FEA acreditado. Las recetas se imprimen en el front para
    firma de puño y letra; la receta electrónica para dispensación exige FEA, y
    ninguna declaración del profesional la sustituye.
15. **Clerk identifica al operador.** Quien prepara y quien firma se guardan en
    columnas distintas. `clerk_user_id` se guarda como `VARCHAR(191)` (no es UUID),
    mapeado a `usuario_plataforma` y **denormalizado** en la evidencia.

---

## 1. Estado actual relevante (análisis)

| Tema | Encontrado | Archivo |
|---|---|---|
| Capas | `view/` → `controller/` (static) → `model/` (SQL plano) | `view/profesionalesRoutes.js` |
| BD | `DataBase.getInstance().ejecutarQuery(sql, params)`; `obtenerConexion()` para transacciones | `config/Database.js` |
| Respuestas | `{message:true}`, `400 {message:"sindata"}`, `500 {message:"serverError"}` | `controller/ProfesionalesController.js` |
| Clerk | `verificarUsuarioClerk` (*fail-open*) | `middleware/verificarUsuarioClerk.js` |
| R2 | `subirArchivo`, `generarUrlDescarga`, `eliminarArchivoR2` | `services/r2Storage.js` |
| Correo | Brevo API + `construirCorreoBase` | `services/envioCotizacionCorreo.js` |
| PDF | `jspdf` en servidor (cotización) | `services/envioCotizacionCorreo.js` |
| Rate limit | `express-rate-limit` | `view/resenasRoutes.js` |
| Migraciones | `.sql` sueltos; **`.gitignore` ignora `*.sql`** | `migration_notificaciones_ics.sql` |
| `profesionales` | `id_profesional INT`, `rutProfesional VARCHAR(20)`, `usuarioAsignadoClerk` (vacío) | dump |
| `pacienteDatos` | `rut VARCHAR(20) UNIQUE`, `correo`, `telefono` | dump |
| `perfilProfesional.registro_sis` | Existe, sin uso | dump |
| Antipatrón | `archivoPaciente.r2_url` guarda URLs prefirmadas que expiran. **No repetir**: guardar solo la clave | dump |

---

## 2. Dependencias nuevas

```bash
npm i pdf-lib@^1.17.1 sharp@^0.33.5 qrcode@^1.5.4 uuid@^11.0.3
```

| Paquete | Uso |
|---|---|
| `pdf-lib` | Estampar grafía, texto y QR sobre el borrador; validar PDFs |
| `sharp` | Recorte y normalizado del PNG de la firma |
| `qrcode` | QR de verificación (PNG) |
| `uuid` | `v7()` para PKs |

`.gitignore`: agregar `!migraciones/*.sql` para versionar las migraciones.

---

## 3. Migración SQL

Archivo: `migraciones/2026-10-23_firma_electronica.sql`. **Aditiva**: no borra ni
renombra nada existente. Antes de correr: `mysqldump` de `profesionales`,
`pacienteDatos` y `reservaPacientes`. Compatible con phpMyAdmin: todos los
triggers son de una sentencia salvo `trg_documento_firmado_inmutable`, que va al
final del archivo con `DELIMITER`.

```sql
-- =====================================================================
-- Firma Electrónica Simple (FES) — Ley 19.799
-- Migración aditiva · MySQL 8.0.16+ (CHECK y defaults por expresión)
-- Todos los *_at en UTC, DATETIME(3).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 3.1 Usuarios de la plataforma (mapeo local de Clerk)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario_plataforma (
  id_usuario        BINARY(16)   NOT NULL,
  clerk_user_id     VARCHAR(191) NOT NULL,
  id_profesional    INT          NULL,
  nombre            VARCHAR(255) NULL,
  email             VARCHAR(255) NULL,
  rol               VARCHAR(60)  NULL,
  creado_at         DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  actualizado_at    DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_clerk (clerk_user_id),
  KEY idx_usuario_profesional (id_profesional),
  CONSTRAINT fk_usuario_profesional FOREIGN KEY (id_profesional)
    REFERENCES profesionales (id_profesional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 3.2 Profesionales: registro Superintendencia de Salud (RNPI)
-- ---------------------------------------------------------------------
ALTER TABLE profesionales
  ADD COLUMN registro_sis_numero            VARCHAR(10)  NULL AFTER rutProfesional,
  ADD COLUMN registro_sis_estado            ENUM('no_informado','declarado','verificado','rechazado')
                                            NOT NULL DEFAULT 'no_informado' AFTER registro_sis_numero,
  ADD COLUMN registro_sis_certificado_key   VARCHAR(500) NULL AFTER registro_sis_estado,
  ADD COLUMN registro_sis_certificado_mime  VARCHAR(50)  NULL AFTER registro_sis_certificado_key,
  ADD COLUMN registro_sis_certificado_sha256 CHAR(64)    NULL AFTER registro_sis_certificado_mime,
  ADD COLUMN registro_sis_verificado_por    BINARY(16)   NULL AFTER registro_sis_certificado_sha256,
  ADD COLUMN registro_sis_verificado_at     DATETIME(3)  NULL AFTER registro_sis_verificado_por,
  ADD COLUMN registro_sis_motivo_rechazo    VARCHAR(500) NULL AFTER registro_sis_verificado_at,
  ADD CONSTRAINT chk_registro_sis_numero CHECK (registro_sis_numero IS NULL OR registro_sis_numero REGEXP '^[0-9]{1,10}$'),
  ADD CONSTRAINT fk_registro_sis_verificador FOREIGN KEY (registro_sis_verificado_por)
    REFERENCES usuario_plataforma (id_usuario);

-- ---------------------------------------------------------------------
-- 3.3 Pacientes y reservas: documento extranjero
-- ---------------------------------------------------------------------
ALTER TABLE pacienteDatos
  ADD COLUMN tipo_documento ENUM('rut','pasaporte') NOT NULL DEFAULT 'rut' AFTER rut;

ALTER TABLE reservaPacientes
  ADD COLUMN tipo_documento ENUM('rut','pasaporte') NOT NULL DEFAULT 'rut' AFTER rut;

-- ---------------------------------------------------------------------
-- 3.4 Plantillas versionadas (acta FES, consentimientos, anexos)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documento_plantilla (
  id_plantilla      BINARY(16)   NOT NULL,
  codigo            VARCHAR(80)  NOT NULL,           -- acta_adhesion_fes | tratamiento_datos | derechos_deberes_paciente | consentimiento_base | anexo_<procedimiento>
  categoria         ENUM('acta_fes','consentimiento_publico','consentimiento_base','anexo_procedimiento') NOT NULL,
  version           INT UNSIGNED NOT NULL,
  titulo            VARCHAR(255) NOT NULL,
  cuerpo            MEDIUMTEXT   NOT NULL,           -- texto sin interpolar
  cuerpo_sha256     CHAR(64)     NOT NULL,           -- SHA2(cuerpo,256), utf8mb4
  estado            ENUM('borrador','vigente','retirada') NOT NULL DEFAULT 'borrador',
  vigente_desde     DATETIME(3)  NULL,
  retirada_at       DATETIME(3)  NULL,
  creado_por_clerk  VARCHAR(191) NULL,
  creado_at         DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  -- una sola versión vigente por código
  vigente_unica     VARCHAR(80)  GENERATED ALWAYS AS (IF(estado = 'vigente', codigo, NULL)) STORED,
  PRIMARY KEY (id_plantilla),
  UNIQUE KEY uq_plantilla_codigo_version (codigo, version),
  UNIQUE KEY uq_plantilla_vigente (vigente_unica),
  KEY idx_plantilla_categoria (categoria, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 3.5 Firma (grafía) del profesional
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profesional_firma (
  id_firma          BINARY(16)   NOT NULL,
  id_profesional    INT          NOT NULL,
  estado            ENUM('activa','reemplazada','revocada') NOT NULL DEFAULT 'activa',
  origen            ENUM('propia') NOT NULL DEFAULT 'propia',   -- solo el profesional captura su firma
  tinta             ENUM('azul','negro') NOT NULL,
  imagen_key        VARCHAR(500) NOT NULL,           -- R2 privado, clave aleatoria
  imagen_sha256     CHAR(64)     NOT NULL,           -- del PNG normalizado
  imagen_mime       VARCHAR(30)  NOT NULL DEFAULT 'image/png',
  ancho_px          SMALLINT UNSIGNED NOT NULL,
  alto_px           SMALLINT UNSIGNED NOT NULL,
  trazos_key        VARCHAR(500) NOT NULL,           -- JSON de vectores en R2
  trazos_sha256     CHAR(64)     NOT NULL,
  id_plantilla_acta BINARY(16)   NOT NULL,           -- versión exacta del acta aceptada
  acta_sha256       CHAR(64)     NOT NULL,
  acta_aceptada_at  DATETIME(3)  NOT NULL,
  id_usuario        BINARY(16)   NOT NULL,           -- quién la registró (debe ser el propio profesional)
  clerk_user_id     VARCHAR(191) NOT NULL,           -- denormalizado
  ip                VARCHAR(45)  NULL,
  user_agent        VARCHAR(255) NULL,
  registrada_at     DATETIME(3)  NOT NULL,
  cerrada_at        DATETIME(3)  NULL,               -- cuando pasa a reemplazada/revocada
  motivo_cierre     VARCHAR(255) NULL,
  -- equivalente MySQL del índice parcial único: una firma activa por profesional
  activa_de         INT GENERATED ALWAYS AS (IF(estado = 'activa', id_profesional, NULL)) STORED,
  PRIMARY KEY (id_firma),
  UNIQUE KEY uq_firma_activa_por_profesional (activa_de),
  KEY idx_firma_profesional (id_profesional, registrada_at),
  CONSTRAINT chk_firma_cierre CHECK ((estado = 'activa' AND cerrada_at IS NULL) OR (estado <> 'activa' AND cerrada_at IS NOT NULL)),
  CONSTRAINT chk_firma_dimensiones CHECK (alto_px BETWEEN 20 AND 200 AND ancho_px BETWEEN 20 AND 600),
  CONSTRAINT fk_firma_profesional FOREIGN KEY (id_profesional) REFERENCES profesionales (id_profesional),
  CONSTRAINT fk_firma_usuario     FOREIGN KEY (id_usuario)     REFERENCES usuario_plataforma (id_usuario),
  CONSTRAINT fk_firma_acta        FOREIGN KEY (id_plantilla_acta) REFERENCES documento_plantilla (id_plantilla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 3.6 Documentos emitidos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documento_emitido (
  id_documento            BINARY(16)   NOT NULL,
  codigo_verificacion     CHAR(9)      NOT NULL,     -- 'A7K2-9QX4'
  tipo_documento          ENUM('cotizacion','presupuesto','orden_examen','ficha_clinica',
                               'consentimiento_informado','indicaciones','certificado_atencion') NOT NULL, -- sin receta: requiere FEA
  titulo                  VARCHAR(255) NOT NULL,
  estado                  ENUM('pendiente_firma','firmado','anulado') NOT NULL DEFAULT 'pendiente_firma',
  referencia_tabla        VARCHAR(60)  NULL,
  referencia_id           INT          NULL,
  id_paciente             INT          NULL,
  id_profesional_firmante INT          NOT NULL,

  -- snapshot (lo que se firmó, independiente de cambios futuros en plantillas)
  metadatos_json          JSON         NOT NULL,     -- {plantillas:[{codigo,version,sha256}], resumen, texto_renderizado?}
  zona_firma_json         JSON         NOT NULL,     -- {pagina,x,y,ancho,alto} en mm
  zona_paciente_json      JSON         NULL,         -- solo consentimiento: zona de la aceptación por OTP

  -- aceptación del paciente por código (consentimiento informado)
  paciente_otp_id         BINARY(16)   NULL,
  paciente_acepto_at      DATETIME(3)  NULL,
  paciente_canal          ENUM('email','sms') NULL,
  paciente_destino        VARCHAR(100) NULL,         -- enmascarado, tal como se estampa
  paciente_firmante       VARCHAR(255) NULL,         -- paciente o representante legal

  -- borrador (cuerpo enviado por el front)
  borrador_key            VARCHAR(500) NOT NULL,
  borrador_sha256         CHAR(64)     NOT NULL,
  borrador_bytes          INT UNSIGNED NOT NULL,
  paginas                 SMALLINT UNSIGNED NOT NULL,

  -- generación (operador autenticado en Clerk)
  preparado_por_usuario   BINARY(16)   NOT NULL,
  preparado_por_clerk_id  VARCHAR(191) NOT NULL,
  preparado_por_nombre    VARCHAR(255) NULL,
  preparado_at            DATETIME(3)  NOT NULL,
  preparado_ip            VARCHAR(45)  NULL,

  -- firma (profesional firmante, distinto campo que el operador)
  id_firma                BINARY(16)   NULL,
  firmado_por_usuario     BINARY(16)   NULL,
  firmado_por_clerk_id    VARCHAR(191) NULL,
  firmado_at              DATETIME(3)  NULL,
  pdf_key                 VARCHAR(500) NULL,
  pdf_sha256              CHAR(64)     NULL,
  pdf_bytes               INT UNSIGNED NULL,

  -- anulación
  anulado_por_usuario     BINARY(16)   NULL,
  anulado_at              DATETIME(3)  NULL,
  motivo_anulacion        VARCHAR(500) NULL,

  PRIMARY KEY (id_documento),
  UNIQUE KEY uq_documento_codigo (codigo_verificacion),
  KEY idx_documento_paciente (id_paciente, preparado_at),
  KEY idx_documento_firmante_estado (id_profesional_firmante, estado),
  KEY idx_documento_referencia (referencia_tabla, referencia_id),
  CONSTRAINT chk_documento_firmado CHECK (
    estado = 'pendiente_firma'
    OR (estado = 'firmado' AND firmado_at IS NOT NULL AND pdf_sha256 IS NOT NULL AND pdf_key IS NOT NULL AND id_firma IS NOT NULL)
    OR (estado = 'anulado' AND anulado_at IS NOT NULL)
  ),
  CONSTRAINT chk_documento_aceptacion CHECK (
    zona_paciente_json IS NULL OR estado <> 'firmado' OR paciente_acepto_at IS NOT NULL
  ),
  CONSTRAINT chk_documento_codigo CHECK (codigo_verificacion REGEXP '^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$'),
  CONSTRAINT fk_documento_paciente    FOREIGN KEY (id_paciente) REFERENCES pacienteDatos (id_paciente),
  CONSTRAINT fk_documento_firmante    FOREIGN KEY (id_profesional_firmante) REFERENCES profesionales (id_profesional),
  CONSTRAINT fk_documento_firma       FOREIGN KEY (id_firma) REFERENCES profesional_firma (id_firma),
  CONSTRAINT fk_documento_preparador  FOREIGN KEY (preparado_por_usuario) REFERENCES usuario_plataforma (id_usuario),
  CONSTRAINT fk_documento_firmador    FOREIGN KEY (firmado_por_usuario) REFERENCES usuario_plataforma (id_usuario),
  CONSTRAINT fk_documento_anulador    FOREIGN KEY (anulado_por_usuario) REFERENCES usuario_plataforma (id_usuario)
  -- paciente_otp_id no lleva FOREIGN KEY: paciente_otp referencia a documento_emitido
  -- (dependencia circular); se valida en la aplicación.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 3.7 Consentimientos aceptados en la reserva pública
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consentimiento_aceptacion (
  id_aceptacion           BINARY(16)   NOT NULL,
  token_aceptacion        CHAR(35)     NOT NULL,     -- 'ca_' + 32 hex, para vincular la reserva
  codigo_verificacion     CHAR(9)      NOT NULL,
  id_plantilla            BINARY(16)   NOT NULL,
  plantilla_codigo        VARCHAR(80)  NOT NULL,
  plantilla_version       INT UNSIGNED NOT NULL,
  plantilla_sha256        CHAR(64)     NOT NULL,
  texto_renderizado       MEDIUMTEXT   NOT NULL,     -- snapshot interpolado que vio el paciente
  texto_sha256            CHAR(64)     NOT NULL,
  id_profesional          INT          NULL,
  id_reserva              INT          NULL,
  id_paciente             INT          NULL,
  paciente_nombre         VARCHAR(255) NOT NULL,
  paciente_apellido       VARCHAR(255) NOT NULL,
  paciente_tipo_documento ENUM('rut','pasaporte') NOT NULL,
  paciente_documento      VARCHAR(20)  NOT NULL,
  paciente_correo         VARCHAR(255) NOT NULL,
  paciente_telefono       VARCHAR(30)  NULL,
  origen                  ENUM('web','dashboard') NOT NULL DEFAULT 'web',
  aceptado_at             DATETIME(3)  NOT NULL,
  ip                      VARCHAR(45)  NULL,
  user_agent              VARCHAR(255) NULL,
  pdf_key                 VARCHAR(500) NOT NULL,     -- constancia generada UNA vez
  pdf_sha256              CHAR(64)     NOT NULL,
  vinculado_at            DATETIME(3)  NULL,
  revocado_at             DATETIME(3)  NULL,
  revocado_por_usuario    BINARY(16)   NULL,
  motivo_revocacion       VARCHAR(500) NULL,
  PRIMARY KEY (id_aceptacion),
  UNIQUE KEY uq_aceptacion_codigo (codigo_verificacion),
  KEY idx_aceptacion_token (token_aceptacion),
  KEY idx_aceptacion_paciente (id_paciente, aceptado_at),
  KEY idx_aceptacion_documento (paciente_documento),
  KEY idx_aceptacion_reserva (id_reserva),
  CONSTRAINT fk_aceptacion_plantilla   FOREIGN KEY (id_plantilla) REFERENCES documento_plantilla (id_plantilla),
  CONSTRAINT fk_aceptacion_paciente    FOREIGN KEY (id_paciente)  REFERENCES pacienteDatos (id_paciente),
  CONSTRAINT fk_aceptacion_profesional FOREIGN KEY (id_profesional) REFERENCES profesionales (id_profesional),
  CONSTRAINT fk_aceptacion_revocador   FOREIGN KEY (revocado_por_usuario) REFERENCES usuario_plataforma (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Nota: un mismo token agrupa las dos aceptaciones (datos + general) de una reserva.

-- ---------------------------------------------------------------------
-- 3.8 OTP del paciente (modelado ahora; implementación posterior)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paciente_otp (
  id_otp            BINARY(16)   NOT NULL,
  id_documento      BINARY(16)   NOT NULL,
  id_paciente       INT          NOT NULL,
  canal             ENUM('email','sms') NOT NULL,
  destino_mascarado VARCHAR(100) NOT NULL,
  codigo_hash       CHAR(64)     NOT NULL,           -- HMAC-SHA256(clave, codigo + id_otp); nunca el código
  intentos          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  creado_at         DATETIME(3)  NOT NULL,
  expira_at         DATETIME(3)  NOT NULL,
  verificado_at     DATETIME(3)  NULL,
  ip_verificacion   VARCHAR(45)  NULL,
  PRIMARY KEY (id_otp),
  KEY idx_otp_documento (id_documento, creado_at),
  CONSTRAINT chk_otp_intentos CHECK (intentos <= 5),
  CONSTRAINT fk_otp_documento FOREIGN KEY (id_documento) REFERENCES documento_emitido (id_documento),
  CONSTRAINT fk_otp_paciente  FOREIGN KEY (id_paciente)  REFERENCES pacienteDatos (id_paciente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 3.9 Bitácora de accesos a documentos (append-only, sin cadena)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documento_acceso (
  id_acceso         BINARY(16)   NOT NULL,
  id_documento      BINARY(16)   NULL,
  id_aceptacion     BINARY(16)   NULL,
  accion            ENUM('generado','visto','descargado','impreso','enviado','verificado_publico','impreso_manuscrito') NOT NULL,
  actor_usuario     BINARY(16)   NULL,               -- NULL en accesos públicos
  actor_clerk_id    VARCHAR(191) NULL,               -- denormalizado: sobrevive al borrado en Clerk
  actor_nombre      VARCHAR(255) NULL,
  actor_rol         VARCHAR(60)  NULL,
  destinatario      VARCHAR(255) NULL,               -- solo para 'enviado'
  ip                VARCHAR(45)  NULL,
  user_agent        VARCHAR(255) NULL,
  ocurrido_at       DATETIME(3)  NOT NULL,
  PRIMARY KEY (id_acceso),
  KEY idx_acceso_documento (id_documento, ocurrido_at),
  KEY idx_acceso_aceptacion (id_aceptacion, ocurrido_at),
  KEY idx_acceso_actor (actor_clerk_id, ocurrido_at),
  CONSTRAINT chk_acceso_objetivo CHECK (id_documento IS NOT NULL OR id_aceptacion IS NOT NULL OR accion = 'impreso_manuscrito'),
  CONSTRAINT fk_acceso_documento  FOREIGN KEY (id_documento)  REFERENCES documento_emitido (id_documento),
  CONSTRAINT fk_acceso_aceptacion FOREIGN KEY (id_aceptacion) REFERENCES consentimiento_aceptacion (id_aceptacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 3.10 Evidencia de firma (append-only, encadenada y sellada)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS firma_cadena_estado (
  id                TINYINT UNSIGNED NOT NULL,       -- siempre 1: fila de control para serializar
  ultima_secuencia  BIGINT UNSIGNED  NOT NULL,
  ultimo_hash       CHAR(64)         NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_cadena_unica CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO firma_cadena_estado (id, ultima_secuencia, ultimo_hash)
VALUES (1, 0, REPEAT('0', 64));

CREATE TABLE IF NOT EXISTS firma_evento (
  id_evento            BINARY(16)      NOT NULL,
  secuencia            BIGINT UNSIGNED NOT NULL,
  tipo_evento          ENUM('acta_aceptada','firma_registrada','firma_reemplazada','firma_revocada',
                            'documento_firmado','documento_anulado',
                            'registro_sis_declarado','registro_sis_verificado','registro_sis_rechazado',
                            'consentimiento_aceptado','consentimiento_revocado',
                            'otp_paciente_verificado') NOT NULL,
  id_documento         BINARY(16)      NULL,
  id_firma             BINARY(16)      NULL,
  id_aceptacion        BINARY(16)      NULL,
  id_profesional       INT             NULL,
  id_paciente          INT             NULL,
  actor_tipo           ENUM('profesional','operador','paciente','sistema') NOT NULL,
  actor_usuario        BINARY(16)      NULL,
  actor_clerk_id       VARCHAR(191)    NULL,         -- denormalizado
  actor_nombre         VARCHAR(255)    NULL,
  metodo_autenticacion VARCHAR(60)     NOT NULL,     -- clerk_reverificacion_primer_factor | clerk_reverificacion_segundo_factor | clerk_sesion | otp_email | otp_sms | formulario_publico
  autenticado_at       DATETIME(3)     NULL,
  documento_sha256     CHAR(64)        NULL,
  datos_json           JSON            NOT NULL,     -- detalle del evento (versión de acta, motivo, etc.)
  ip                   VARCHAR(45)     NULL,
  user_agent           VARCHAR(255)    NULL,
  ocurrido_at          DATETIME(3)     NOT NULL,
  hash_anterior        CHAR(64)        NOT NULL,
  hash_evento          CHAR(64)        NOT NULL,     -- SHA-256(canónico)
  sello_hmac           CHAR(64)        NOT NULL,     -- HMAC-SHA256(FIRMA_HMAC_CLAVE, hash_evento)
  clave_version        TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_evento),
  UNIQUE KEY uq_evento_secuencia (secuencia),
  UNIQUE KEY uq_evento_hash (hash_evento),
  KEY idx_evento_documento (id_documento),
  KEY idx_evento_firma (id_firma),
  KEY idx_evento_profesional (id_profesional, ocurrido_at),
  KEY idx_evento_aceptacion (id_aceptacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Sin FOREIGN KEY a propósito: la evidencia debe sobrevivir aunque se depuren
-- otras tablas. Los IDs se validan en la aplicación al insertar.

-- Append-only por trigger (aplica a TODOS los usuarios de MySQL, incluido root vía app)
CREATE TRIGGER trg_firma_evento_sin_update BEFORE UPDATE ON firma_evento
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'firma_evento es append-only';

CREATE TRIGGER trg_firma_evento_sin_delete BEFORE DELETE ON firma_evento
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'firma_evento es append-only';

CREATE TRIGGER trg_documento_acceso_sin_update BEFORE UPDATE ON documento_acceso
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'documento_acceso es append-only';

CREATE TRIGGER trg_documento_acceso_sin_delete BEFORE DELETE ON documento_acceso
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'documento_acceso es append-only';

CREATE TRIGGER trg_documento_emitido_sin_delete BEFORE DELETE ON documento_emitido
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'documento_emitido no se elimina; usar anulado';

-- Un documento firmado no cambia de contenido: solo puede pasar a 'anulado'.
-- Lleva punto y coma interno: requiere DELIMITER (en phpMyAdmin, poner "$$" en el
-- campo "Delimitador" de la pestaña SQL y quitar las líneas DELIMITER).
DELIMITER $$
CREATE TRIGGER trg_documento_firmado_inmutable BEFORE UPDATE ON documento_emitido
FOR EACH ROW
BEGIN
  IF OLD.estado IN ('firmado','anulado') AND (
       NOT (NEW.pdf_sha256 <=> OLD.pdf_sha256) OR NOT (NEW.pdf_key <=> OLD.pdf_key)
    OR NOT (NEW.firmado_at <=> OLD.firmado_at) OR NOT (NEW.id_firma <=> OLD.id_firma)
    OR NOT (NEW.borrador_sha256 <=> OLD.borrador_sha256)
    OR (OLD.estado = 'anulado' AND NEW.estado <> 'anulado')
    OR (OLD.estado = 'firmado' AND NEW.estado NOT IN ('firmado','anulado'))
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'documento firmado inmutable';
  END IF;
END$$
DELIMITER ;
```

### 3.4 Privilegios (equivalente del `REVOKE UPDATE, DELETE`)

MySQL no permite revocar privilegios de una tabla si se concedieron a nivel de
base (`GRANT ALL ON db.*`); `partial_revokes` solo opera a nivel de esquema. Por
eso la protección real tiene tres capas:

1. **Triggers** (arriba): bloquean UPDATE/DELETE para cualquier usuario.
2. **Cadena + HMAC**: cualquier alteración (incluido quien desactive triggers) se
   detecta con `scripts/verificar_cadena_firma.mjs`.
3. **Privilegios por tabla** (recomendado en producción): el usuario de la app no
   debe tener `TRIGGER`, `ALTER`, `DROP` ni `SUPER`. Para lograrlo:

```sql
-- Ejecutar como administrador. Reemplazar 'app_agenda'@'%' por el usuario real (ver .env DB_USER).
-- 1) Ver qué tiene hoy:
SHOW GRANTS FOR 'app_agenda'@'%';

-- 2) Si tiene GRANT ALL ON <db>.*, generar grants por tabla:
SELECT CONCAT('GRANT SELECT, INSERT, UPDATE, DELETE ON `', TABLE_SCHEMA, '`.`', TABLE_NAME, '` TO ''app_agenda''@''%'';')
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME NOT IN ('firma_evento', 'documento_acceso');

-- 3) Evidencia: solo lectura e inserción
GRANT SELECT, INSERT ON `AGENDA_CLINICA_DESARROLLO`.`firma_evento`     TO 'app_agenda'@'%';
GRANT SELECT, INSERT ON `AGENDA_CLINICA_DESARROLLO`.`documento_acceso` TO 'app_agenda'@'%';

-- 4) Recién entonces quitar el grant de base:
-- REVOKE ALL PRIVILEGES ON `AGENDA_CLINICA_DESARROLLO`.* FROM 'app_agenda'@'%';
-- (y ejecutar los GRANT generados en el paso 2)
```

> Hacer el paso 4 en una ventana de mantenimiento: si falta un grant, la app
> falla. En desarrollo basta con las capas 1 y 2.

### 3.5 Datos iniciales (seed)

Archivo: `migraciones/2026-10-23_firma_electronica_seed.sql`. Carga la versión 1
vigente de: el acta de adhesión FES; los dos textos de la reserva pública (la política de privacidad — Ley 19.628/21.719 —,
que el paciente acepta con casilla, y los derechos y deberes del paciente — Ley 20.584 —,
solo de lectura); y el consentimiento informado por procedimiento (Ley 20.584, art. 14):
la plantilla base `consentimiento_base` y 14 anexos `anexo_*` (7 de armonización
facial y 7 de odontología).

**Fuente única:** el SQL se genera desde `src/lib/firma/actaAdhesion.js`,
`src/lib/consentimientos/textosLegales.js` y
`src/lib/consentimientos/plantillasProcedimiento.js` del front. No editar los textos a
mano aquí: el `cuerpo_sha256` debe coincidir byte a byte con el que calcula el
front, o `registrarAceptacion` responderá `actaDesactualizada`. Para cambiar
un texto se publica una **versión nueva** (la anterior pasa a `retirada`), nunca
se edita la vigente: lo aceptado queda ligado a su versión y su huella.

Antes de producción, cada clínica debe validar los textos con su asesor legal
(asumen el modelo estándar: la clínica es responsable del tratamiento y
NativeCode, encargado).

```sql
SET NAMES utf8mb4;

-- Generado desde src/lib/firma/actaAdhesion.js, src/lib/consentimientos/textosLegales.js
-- y src/lib/consentimientos/plantillasProcedimiento.js del front.
-- No editar a mano: el SHA-256 de cada texto debe coincidir con el del front.

-- acta_adhesion_fes v1 · sha256 2eea9b4647e42aa94f77fbaf1636b21a3baaf83aabbd4d1011b86d6613f14cdc
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'acta_adhesion_fes', 'acta_fes', 1, 'Acta de adhesión a firma electrónica simple',
'En conformidad con la Ley N° 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha Firma, y en particular con su artículo 3°, que otorga a los actos y contratos suscritos por medio de firma electrónica la misma validez y efectos que los celebrados por escrito y en soporte de papel, declaro:

- Que adopto voluntariamente el procedimiento de firma electrónica simple que {{empresa.nombre}} dispone en esta plataforma, para suscribir los documentos clínicos y administrativos que emita en el ejercicio de mi profesión.
- Que el trazo que registro es la representación gráfica de mi firma y que lo dibujé personalmente desde mi propia cuenta.
- Que cada documento que firme quedará vinculado a mi identidad mediante la verificación de mi cuenta al momento de firmar, la fecha y hora del servidor y una huella digital SHA-256 del documento, que permite detectar cualquier alteración posterior.
- Que mantendré la confidencialidad de mis credenciales de acceso, y que toda firma realizada con ellas me es atribuible, salvo que haya informado antes su pérdida o uso indebido.
- Que conozco que las recetas médicas no se firman por este medio y deben firmarse de puño y letra.
- Que puedo revocar esta adhesión en cualquier momento, sin que ello afecte la validez de los documentos firmados con anterioridad.',
'2eea9b4647e42aa94f77fbaf1636b21a3baaf83aabbd4d1011b86d6613f14cdc', 'vigente', UTC_TIMESTAMP(3));

-- tratamiento_datos v1 · sha256 7a3ef5b0d1641d96df9f207339c4d753d668fb140fa3d65f1ac34af9350b694d
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'tratamiento_datos', 'consentimiento_publico', 1, 'Política de privacidad y tratamiento de datos personales y de salud',
'Esta política le informa cómo {{empresa.nombre}} trata sus datos personales cuando reserva una hora, paga en línea o se atiende con nosotros. Se rige por la Ley N° 19.628 sobre Protección de la Vida Privada, modificada por la Ley N° 21.719, y por la Ley N° 20.584 que regula los Derechos y Deberes de los Pacientes. Léala antes de aceptar: su aceptación es libre, y la de esta política es independiente de cualquier otra.

## 1. Responsable del tratamiento
El responsable de sus datos es {{empresa.nombre}}, con domicilio en {{empresa.direccion}}, correo {{empresa.correo}} y teléfono {{empresa.telefono}}. A esos mismos datos puede dirigir cualquier consulta o solicitud sobre su información personal.

La plataforma de agenda, ficha clínica y documentos es provista por NativeCode SpA, que actúa como encargado del tratamiento: trata sus datos solo por cuenta de {{empresa.nombre}} y según sus instrucciones, bajo contrato y deber de confidencialidad, y no puede usarlos para fines propios.

## 2. Datos que tratamos
- Identificación y contacto: nombre, apellidos, RUT o número de pasaporte, correo electrónico y teléfono.
- Reserva y pago: profesional, servicio, fecha, hora, monto y estado del pago. Si paga en línea, los datos de su tarjeta los recibe directamente el procesador de pagos; nosotros no los vemos ni los guardamos.
- Salud: los antecedentes que usted entregue y los que el equipo de salud registre en su ficha clínica (diagnósticos, tratamientos, exámenes, recetas y consentimientos). La ley los califica como datos sensibles y les otorga protección reforzada.
- Respaldo de su aceptación: fecha y hora, dirección IP, navegador y la versión exacta de los textos que aceptó.

## 3. Datos obligatorios y voluntarios
Los datos de identificación y contacto son necesarios para reservar: sin ellos no podemos agendar su hora ni confirmársela. Los datos de salud son necesarios para atenderle de forma segura; si decide no entregarlos, el profesional podría no estar en condiciones de realizar ciertas prestaciones.

## 4. Finalidades
- Agendar, confirmar, reprogramar y recordarle sus horas por correo, SMS o WhatsApp.
- Procesar el pago de su reserva, cuando corresponda.
- Llevar su ficha clínica y prestarle la atención de salud que solicita.
- Emitir y enviarle los documentos de su atención: presupuestos, órdenes de exámenes, recetas, indicaciones y consentimientos, incluidos los que se firman electrónicamente.
- Cumplir las obligaciones legales y sanitarias del centro y atender los requerimientos de la autoridad.

No usamos sus datos para publicidad, no elaboramos perfiles comerciales y no tomamos decisiones que le afecten basadas únicamente en un tratamiento automatizado. No vendemos ni cedemos sus datos con fines comerciales. Si quisiéramos enviarle información promocional, le pediremos una autorización aparte, que será opcional.

## 5. Bases de licitud
- Sus datos de salud: su consentimiento expreso, que otorga al marcar la casilla correspondiente, y lo necesario para la prestación de salud que solicita.
- La reserva y el pago: la ejecución de la prestación que usted pide.
- La ficha clínica y su conservación: el cumplimiento de obligaciones legales de los prestadores de salud.

## 6. Destinatarios
Solo accede a sus datos el personal del centro que lo necesita para su función, y los proveedores que nos prestan servicios como encargados de tratamiento, obligados por contrato a protegerlos y a usarlos solo para ese fin:
- Alojamiento de la plataforma, base de datos y almacenamiento de documentos.
- Autenticación de los usuarios del centro.
- Envío de correos electrónicos, SMS y mensajes de WhatsApp.
- Procesamiento de pagos en línea, cuando usted paga al reservar.

También comunicaremos sus datos cuando una ley o una autoridad competente lo exija, o a otro prestador de salud cuando usted lo solicite o sea necesario para su atención.

## 7. Transferencia internacional
Algunos de estos proveedores almacenan o procesan datos fuera de Chile. En esos casos la transferencia se hace con las garantías que exige la ley, como cláusulas contractuales que aseguran un nivel de protección adecuado.

## 8. Plazo de conservación
La ficha clínica, y los documentos y consentimientos que forman parte de ella, se conservan por un mínimo de quince años desde la última atención, como exigen la Ley N° 20.584 y su reglamento. Los demás datos se conservan mientras sean necesarios para las finalidades indicadas y para atender reclamos, y después se eliminan o anonimizan.

## 9. Seguridad
Aplicamos medidas técnicas y organizativas proporcionales al riesgo: acceso restringido según la función de cada persona, autenticación de los usuarios, cifrado de las comunicaciones y del almacenamiento, registro de cada acceso a los documentos, respaldos y deber de confidencialidad de todo el personal. Si ocurre una vulneración de seguridad que afecte sus datos, la comunicaremos a la Agencia de Protección de Datos Personales y, cuando corresponda, a usted, en los términos que establece la ley.

## 10. Sus derechos
En cualquier momento, y en forma gratuita, puede:
- Acceder a sus datos y saber cómo los tratamos.
- Rectificarlos si son inexactos, están desactualizados o incompletos.
- Solicitar su supresión cuando ya no sean necesarios o retire su consentimiento, salvo los que la ley nos obliga a conservar, como la ficha clínica durante su plazo legal.
- Oponerse a determinados tratamientos.
- Solicitar la portabilidad de sus datos en un formato estructurado y de uso común.
- Solicitar el bloqueo temporal de sus datos mientras se resuelve una solicitud.

Para ejercerlos, escriba a {{empresa.correo}} indicando su nombre, RUT o pasaporte y lo que solicita. Podremos pedirle que acredite su identidad. Le responderemos dentro de los plazos que fija la ley. Si considera que no hemos respetado sus derechos, puede reclamar ante la Agencia de Protección de Datos Personales.

Además, como paciente, tiene derecho a acceder a su ficha clínica y a obtener copia de ella conforme a la Ley N° 20.584.

## 11. Retiro del consentimiento
Puede retirar su consentimiento en cualquier momento, sin expresión de causa, escribiendo a {{empresa.correo}}. El retiro rige desde que lo comunica: no afecta el tratamiento realizado antes ni los datos que la ley nos obliga a conservar.

## 12. Niñas, niños, adolescentes y personas representadas
Los datos de niñas y niños menores de 14 años, y los datos de salud de adolescentes menores de 16 años, solo se tratan con el consentimiento de su madre, padre o representante legal. Si reserva para otra persona, declara contar con la facultad legal para hacerlo y para otorgar este consentimiento en su nombre.

## 13. Cambios a esta política
Si modificamos esta política, publicaremos la nueva versión en este sitio y, cuando el cambio requiera un nuevo consentimiento, se lo pediremos antes de su próxima reserva. Cada aceptación queda asociada a la versión exacta que usted leyó.',
'7a3ef5b0d1641d96df9f207339c4d753d668fb140fa3d65f1ac34af9350b694d', 'vigente', UTC_TIMESTAMP(3));

-- derechos_deberes_paciente v1 · sha256 e8d624bfe3a2bf4b185c7485f6da483ff4ec5f44373fbeed07f707dc0c756a04
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'derechos_deberes_paciente', 'consentimiento_publico', 1, 'Derechos y deberes del paciente',
'Como paciente de {{empresa.nombre}}, la Ley N° 20.584, que regula los Derechos y Deberes de las Personas en relación con acciones vinculadas a su atención en salud, le reconoce los siguientes derechos y deberes.

## Sus derechos
- Recibir una atención oportuna y sin discriminación arbitraria, con trato digno, amable y respetuoso.
- Que se resguarde su privacidad y la confidencialidad de su información de salud durante la atención.
- Conocer el nombre y la función de quienes lo atienden.
- Recibir información clara, oportuna y comprensible sobre su estado de salud, el diagnóstico, las alternativas de tratamiento disponibles, sus riesgos y el pronóstico.
- Recibir información sobre el valor de las prestaciones y la forma de pago antes de realizarlas.
- Aceptar o rechazar libremente cualquier procedimiento o tratamiento, salvo las excepciones que establece la ley. Antes de cada procedimiento se le pedirá un consentimiento informado específico.
- Que su ficha clínica sea reservada, y acceder a ella o solicitar una copia en los términos que fija la ley.
- Ser acompañado por un familiar o persona de su confianza, según las normas del centro.
- Presentar reclamos y sugerencias, y recibir una respuesta.

## Sus deberes
- Entregar información veraz y completa sobre su identidad, su salud, sus alergias y los medicamentos que usa.
- Informarse sobre el funcionamiento del centro, sus horarios y la forma de pedir y cancelar horas.
- Tratar con respeto al equipo de salud, al personal y a los demás pacientes.
- Cuidar las instalaciones y el equipamiento del centro.
- Avisar con anticipación si no puede asistir a su hora.

## Reclamos
Puede presentar un reclamo o sugerencia escribiendo a {{empresa.correo}} o en {{empresa.direccion}}. Si no queda conforme con la respuesta, puede recurrir a la Superintendencia de Salud.',
'e8d624bfe3a2bf4b185c7485f6da483ff4ec5f44373fbeed07f707dc0c756a04', 'vigente', UTC_TIMESTAMP(3));

-- consentimiento_base v1 · sha256 defa509fe7d90c0a873dcc4fc19aec2405ea65e9c1c6baa57d521b77fa27d0b9
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'consentimiento_base', 'consentimiento_base', 1, 'Consentimiento informado',
'Yo, {{paciente.nombre}}, {{paciente.documento}}{{paciente.representacion}}, declaro que {{profesional.nombre}}{{profesional.rut}}, {{profesional.profesion}}{{profesional.registro}}, de {{empresa.nombre}}, me ha informado en forma clara, comprensible y suficiente sobre el procedimiento {{procedimiento.nombre}}, cuya información se detalla en este documento.

## Declaraciones del paciente
Declaro que:
- Se me explicó en qué consiste el procedimiento, su objetivo y los beneficios que razonablemente se pueden esperar.
- Se me informaron sus riesgos frecuentes y poco frecuentes, las alternativas disponibles y las consecuencias de no realizarlo, conforme al artículo 14 de la Ley N° 20.584.
- Tuve la oportunidad de hacer preguntas y todas fueron respondidas de forma satisfactoria.
- Informé de manera veraz mis antecedentes de salud, alergias, medicamentos que uso, embarazo o lactancia y tratamientos previos. Entiendo que ocultar información puede aumentar los riesgos.
- Comprendo que la medicina y la odontología no son ciencias exactas y que no se me ha garantizado un resultado determinado.
- Si durante el procedimiento surge una situación imprevista que lo requiera, autorizo al profesional a adoptar las medidas necesarias para resguardar mi salud.

## Anestesia local
Cuando el procedimiento lo requiera, se usará anestesia local. Puede producir adormecimiento temporal, hematoma o dolor en el sitio de punción, palpitaciones transitorias y, en forma excepcional, reacciones alérgicas o alteración prolongada de la sensibilidad.

## Revocación
Sé que puedo revocar este consentimiento en cualquier momento antes de realizar el procedimiento, sin expresión de causa, y que esa decisión no afectará mi atención futura en el centro.

## Protección de datos personales
Los datos de este documento y de mi ficha clínica son datos sensibles y serán tratados con reserva, solo para mi atención y para cumplir las obligaciones legales del centro, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada, modificada por la Ley N° 21.719, y a la Ley N° 20.584. Puedo ejercer mis derechos escribiendo a {{empresa.correo}}.

## Autorización
Por lo anterior, en forma libre, voluntaria e informada, autorizo la realización del procedimiento indicado.',
'defa509fe7d90c0a873dcc4fc19aec2405ea65e9c1c6baa57d521b77fa27d0b9', 'vigente', UTC_TIMESTAMP(3));

-- anexo_toxina_botulinica v1 · sha256 0d95623302a9bc248cb293589dc4a568f7097cc28f7d8258e954f21f49532243
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_toxina_botulinica', 'anexo_procedimiento', 1, 'Armonización facial · Aplicación de toxina botulínica',
'## En qué consiste
Inyección de toxina botulínica tipo A en músculos específicos de la cara, con agujas finas, para relajar su contracción y suavizar las arrugas de expresión (frente, entrecejo, patas de gallo u otras zonas indicadas). El efecto aparece entre 3 y 14 días después y dura en promedio entre 3 y 6 meses.

## Riesgos frecuentes
- Dolor leve, enrojecimiento, hinchazón o hematoma en los puntos de inyección.
- Dolor de cabeza transitorio.
- Asimetría leve que puede requerir un ajuste.

## Riesgos poco frecuentes
- Caída transitoria del párpado o de la ceja (ptosis), que se resuelve en semanas.
- Sensación de pesadez en la frente, visión doble o sequedad ocular.
- Reacción alérgica.
- Resultado menor al esperado o ausencia de respuesta.

## Alternativas
Rellenos con ácido hialurónico, tratamientos de superficie de la piel (peeling, láser) o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, enfermedades neuromusculares (miastenia gravis, síndrome de Eaton-Lambert), infección activa en la zona y alergia a la toxina o a la albúmina.

## Si no se realiza
Las arrugas de expresión siguen su evolución natural. No hay consecuencias para la salud.

## Cuidados posteriores
No acostarse ni masajear la zona durante 4 horas, evitar ejercicio intenso, calor y alcohol por 24 horas, y asistir al control indicado.',
'0d95623302a9bc248cb293589dc4a568f7097cc28f7d8258e954f21f49532243', 'vigente', UTC_TIMESTAMP(3));

-- anexo_acido_hialuronico v1 · sha256 104fc8c692c67ccbac81b98feaed5c7df1ceb093b6b75263facc827208da5647
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_acido_hialuronico', 'anexo_procedimiento', 1, 'Armonización facial · Relleno con ácido hialurónico',
'## En qué consiste
Inyección de ácido hialurónico, sustancia reabsorbible, en zonas como labios, surcos, pómulos, mentón, mandíbula u ojeras, para dar volumen, contorno o hidratación. El efecto es inmediato y dura en promedio entre 6 y 18 meses según la zona y el producto.

## Riesgos frecuentes
- Hinchazón, enrojecimiento, dolor y hematomas por varios días.
- Pequeños nódulos o irregularidades palpables, que suelen mejorar con masaje o con el tiempo.
- Asimetría.

## Riesgos poco frecuentes
- Infección o reacción inflamatoria tardía.
- Reactivación de herpes labial.
- Coloración azulada bajo la piel (efecto Tyndall).
- Oclusión vascular: el producto puede comprimir u obstruir un vaso sanguíneo y producir daño de la piel (necrosis) y, de forma excepcional, alteraciones de la visión. Es una urgencia: si nota dolor intenso, palidez o manchas en la piel, o cambios en la visión, debe avisar de inmediato. El ácido hialurónico puede disolverse con hialuronidasa.

## Alternativas
Bioestimuladores de colágeno, injerto de grasa, cirugía o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa en la zona, enfermedades autoinmunes no controladas, tendencia a cicatrización anómala y alergia conocida al producto o a la lidocaína.

## Si no se realiza
Se mantiene la condición actual. No hay consecuencias para la salud.

## Cuidados posteriores
Frío local las primeras horas, evitar maquillaje por 12 horas, y calor intenso, sauna y ejercicio por 48 horas. No masajear salvo indicación.',
'104fc8c692c67ccbac81b98feaed5c7df1ceb093b6b75263facc827208da5647', 'vigente', UTC_TIMESTAMP(3));

-- anexo_bioestimuladores v1 · sha256 3112cc6b00f4221aeeee964414f3fe494935f7e561ff15afec21956da379781b
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_bioestimuladores', 'anexo_procedimiento', 1, 'Armonización facial · Bioestimuladores de colágeno',
'## En qué consiste
Inyección de sustancias como hidroxiapatita de calcio o ácido poli-L-láctico que estimulan la producción de colágeno propio, para mejorar firmeza, flacidez y calidad de la piel. El resultado es progresivo, se aprecia entre 1 y 3 meses y puede requerir varias sesiones.

## Riesgos frecuentes
- Hinchazón, enrojecimiento, dolor y hematomas transitorios.
- Sensibilidad en la zona por algunos días.

## Riesgos poco frecuentes
- Nódulos o granulomas palpables o visibles, que pueden aparecer meses después y requerir tratamiento.
- Infección.
- Oclusión vascular con daño de la piel; de forma excepcional, alteraciones visuales. A diferencia del ácido hialurónico, estos productos no se pueden disolver.
- Resultado menor al esperado.

## Alternativas
Rellenos con ácido hialurónico, tecnologías de radiofrecuencia o ultrasonido, cirugía o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa, enfermedades autoinmunes no controladas y antecedente de cicatrización anómala.

## Si no se realiza
La piel sigue su envejecimiento natural. No hay consecuencias para la salud.

## Cuidados posteriores
Masaje según la indicación del profesional (en el caso del ácido poli-L-láctico, habitualmente 5 minutos, 5 veces al día, por 5 días) y evitar calor intenso por 48 horas.',
'3112cc6b00f4221aeeee964414f3fe494935f7e561ff15afec21956da379781b', 'vigente', UTC_TIMESTAMP(3));

-- anexo_hilos_tensores v1 · sha256 2134df6ebb86599716f0e020c4234d75fb5af069a77286dd385b0ba474e6d3c2
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_hilos_tensores', 'anexo_procedimiento', 1, 'Armonización facial · Hilos tensores reabsorbibles',
'## En qué consiste
Inserción bajo la piel, con cánula o aguja, de hilos reabsorbibles (polidioxanona u otros) para reposicionar tejidos y estimular colágeno en zonas con flacidez. Los hilos se reabsorben en meses y el efecto puede durar entre 6 y 18 meses.

## Riesgos frecuentes
- Hinchazón, hematomas y dolor por varios días.
- Irregularidades u hoyuelos en la piel, que suelen corregirse solos.
- Molestia al abrir la boca o al gesticular durante los primeros días.

## Riesgos poco frecuentes
- Infección, que puede requerir antibióticos o retirar el hilo.
- Asomo o palpación del hilo bajo la piel.
- Asimetría o resultado menor al esperado.
- Lesión de nervios o glándulas, generalmente transitoria.

## Alternativas
Bioestimuladores, rellenos, tecnologías de tensado no invasivas, cirugía o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa, trastornos de coagulación, enfermedades autoinmunes no controladas y tendencia a cicatrización anómala.

## Si no se realiza
La flacidez sigue su evolución natural. No hay consecuencias para la salud.

## Cuidados posteriores
Evitar gesticulación exagerada, masajes faciales, tratamientos dentales prolongados y ejercicio intenso por 2 a 3 semanas. Dormir boca arriba la primera semana.',
'2134df6ebb86599716f0e020c4234d75fb5af069a77286dd385b0ba474e6d3c2', 'vigente', UTC_TIMESTAMP(3));

-- anexo_skinbooster_mesoterapia v1 · sha256 957e7663227501d75962f3f0f55b8a6e63600ed5319e43ac84b09c6ef64465ea
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_skinbooster_mesoterapia', 'anexo_procedimiento', 1, 'Armonización facial · Skinbooster y mesoterapia facial',
'## En qué consiste
Microinyecciones superficiales de ácido hialurónico no reticulado, vitaminas, aminoácidos u otros activos para mejorar hidratación, luminosidad y textura de la piel. Habitualmente requiere varias sesiones.

## Riesgos frecuentes
- Pequeñas pápulas en los puntos de inyección por 24 a 72 horas.
- Enrojecimiento, hinchazón y hematomas leves.

## Riesgos poco frecuentes
- Infección.
- Reacción alérgica.
- Reactivación de herpes.
- Nódulos persistentes.

## Alternativas
Tratamientos tópicos, peeling, láser o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección o herpes activo en la zona y alergia a los componentes.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
No maquillarse por 12 horas y evitar sol directo, sauna y ejercicio intenso por 48 horas. Usar protector solar.',
'957e7663227501d75962f3f0f55b8a6e63600ed5319e43ac84b09c6ef64465ea', 'vigente', UTC_TIMESTAMP(3));

-- anexo_peeling_quimico v1 · sha256 bb3fc9bebd7980eadd8741d498865adbf61400e9d1217ad6bed5d9603358f277
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_peeling_quimico', 'anexo_procedimiento', 1, 'Armonización facial · Peeling químico',
'## En qué consiste
Aplicación de uno o más agentes químicos sobre la piel para producir una exfoliación controlada, con el fin de mejorar manchas, textura, acné o fotoenvejecimiento. Según su profundidad puede producir descamación por varios días.

## Riesgos frecuentes
- Ardor y enrojecimiento durante y después de la aplicación.
- Descamación y sensibilidad por varios días.

## Riesgos poco frecuentes
- Manchas oscuras (hiperpigmentación) o claras (hipopigmentación), más probables en fototipos altos o con exposición solar.
- Infección o reactivación de herpes.
- Cicatrices, de forma excepcional.

## Alternativas
Tratamientos tópicos, láser, microdermoabrasión o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, uso reciente de isotretinoína, herpes o heridas activas en la zona y exposición solar intensa reciente o prevista.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
No arrancar la piel que se descama, hidratar según indicación y usar protector solar de amplio espectro de forma estricta.',
'bb3fc9bebd7980eadd8741d498865adbf61400e9d1217ad6bed5d9603358f277', 'vigente', UTC_TIMESTAMP(3));

-- anexo_lipolisis_inyectable v1 · sha256 e2b27395c36cf6e1741e6b34c8616a30eb2c11f7618f127b3d9962aae5f6969a
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_lipolisis_inyectable', 'anexo_procedimiento', 1, 'Armonización facial · Lipólisis inyectable (papada u otras zonas)',
'## En qué consiste
Inyección de sustancias lipolíticas, como el ácido deoxicólico, en depósitos localizados de grasa (por ejemplo, la papada) para reducir su volumen. Suele requerir entre 2 y 4 sesiones separadas por algunas semanas.

## Riesgos frecuentes
- Hinchazón marcada, enrojecimiento, dolor y endurecimiento de la zona por varios días.
- Hematomas y adormecimiento transitorio.

## Riesgos poco frecuentes
- Lesión transitoria del nervio que mueve la comisura de la boca (sonrisa asimétrica).
- Dificultad para tragar, transitoria.
- Úlcera o daño de la piel, alopecia en la zona y nódulos.

## Alternativas
Cambios de estilo de vida, tecnologías no invasivas de reducción de grasa, liposucción o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa en la zona, trastornos de deglución y bocio o patología tiroidea en estudio.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
Frío local, analgesia según indicación y control para evaluar una nueva sesión.',
'e2b27395c36cf6e1741e6b34c8616a30eb2c11f7618f127b3d9962aae5f6969a', 'vigente', UTC_TIMESTAMP(3));

-- anexo_exodoncia v1 · sha256 1c2be228267cccf3ddc0e56d2c4dee9ad44c35996e322efbde5c1194d9862211
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_exodoncia', 'anexo_procedimiento', 1, 'Odontología · Extracción dental (exodoncia)',
'## En qué consiste
Retiro de una o más piezas dentarias bajo anestesia local. Puede requerir separar la pieza, retirar hueso o suturar. Incluye la extracción de terceros molares (muelas del juicio) cuando corresponda.

## Riesgos frecuentes
- Dolor, inflamación y hematoma por algunos días.
- Sangrado leve las primeras horas.
- Dificultad transitoria para abrir la boca.

## Riesgos poco frecuentes
- Alveolitis (infección o inflamación del alvéolo) con dolor intenso entre el 2° y 4° día.
- Infección.
- Alteración de la sensibilidad del labio, mentón o lengua por cercanía a nervios, generalmente transitoria y excepcionalmente permanente.
- Fractura de raíz o de la pieza, que puede dejar un fragmento.
- Comunicación con el seno maxilar en piezas superiores.
- Daño a piezas vecinas o restauraciones.

## Alternativas
Según el caso: endodoncia, tratamiento periodontal, restauración, controles periódicos o no realizar el tratamiento.

## Si no se realiza
Pueden persistir o aumentar el dolor, la infección y el daño a piezas vecinas o al hueso.

## Cuidados posteriores
Morder la gasa 30 minutos, no escupir ni enjuagar con fuerza ni usar bombilla por 24 horas, no fumar, frío local, dieta blanda y tomar la medicación indicada.',
'1c2be228267cccf3ddc0e56d2c4dee9ad44c35996e322efbde5c1194d9862211', 'vigente', UTC_TIMESTAMP(3));

-- anexo_endodoncia v1 · sha256 d232aca45a2680690617f033559baf4c045523c7e085300a1f67f67e8359999c
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_endodoncia', 'anexo_procedimiento', 1, 'Odontología · Tratamiento de conducto (endodoncia)',
'## En qué consiste
Retiro de la pulpa (nervio) dañada o infectada del interior del diente, limpieza y desinfección de los conductos y su sellado, bajo anestesia local. Puede requerir una o más sesiones y, después, una restauración definitiva o corona.

## Riesgos frecuentes
- Molestia o dolor al masticar por algunos días.
- Sensibilidad de la zona.

## Riesgos poco frecuentes
- Reagudización de la infección o inflamación.
- Fractura de un instrumento dentro del conducto o perforación de la raíz.
- Imposibilidad de tratar conductos muy curvos o calcificados.
- Fractura del diente, más probable si no se restaura a tiempo.
- Fracaso del tratamiento, que puede requerir retratamiento, cirugía o extracción.

## Alternativas
Extracción de la pieza (y luego su reemplazo con implante, puente o prótesis) o no realizar el tratamiento.

## Si no se realiza
La infección puede avanzar, producir dolor, abscesos y pérdida del diente.

## Cuidados posteriores
No masticar con la pieza hasta su restauración definitiva, tomar la medicación indicada y asistir a la restauración final.',
'd232aca45a2680690617f033559baf4c045523c7e085300a1f67f67e8359999c', 'vigente', UTC_TIMESTAMP(3));

-- anexo_implante_dental v1 · sha256 52a00ced394a436648520c5077dc109a1531bdd55cf202a7c3f337b51f94e537
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_implante_dental', 'anexo_procedimiento', 1, 'Odontología · Implante dental',
'## En qué consiste
Colocación quirúrgica, bajo anestesia local, de un tornillo de titanio u otro material biocompatible en el hueso maxilar o mandibular para reemplazar la raíz de un diente perdido. Tras un período de integración (habitualmente de 3 a 6 meses) se instala la corona o prótesis. Puede requerir injerto de hueso o elevación del seno maxilar.

## Riesgos frecuentes
- Dolor, inflamación y hematoma por algunos días.
- Sangrado leve.

## Riesgos poco frecuentes
- Falta de integración del implante con el hueso, con necesidad de retirarlo.
- Infección (periimplantitis), más probable en fumadores, diabéticos o con higiene deficiente.
- Alteración de la sensibilidad del labio o mentón por cercanía al nervio.
- Comunicación con el seno maxilar o con la cavidad nasal.
- Fractura del implante o de sus componentes a largo plazo.

## Alternativas
Puente fijo, prótesis removible o no reemplazar la pieza.

## Contraindicaciones
Enfermedades no controladas (diabetes, inmunosupresión), tratamiento con bifosfonatos o radioterapia en la zona, consumo intenso de tabaco y embarazo, según evaluación.

## Si no se realiza
Puede haber desplazamiento de piezas vecinas, pérdida de hueso y dificultades para masticar.

## Cuidados posteriores
Dieta blanda, no fumar, higiene cuidadosa, medicación indicada y controles periódicos de por vida.',
'52a00ced394a436648520c5077dc109a1531bdd55cf202a7c3f337b51f94e537', 'vigente', UTC_TIMESTAMP(3));

-- anexo_blanqueamiento v1 · sha256 ae18fedecebaddb45443e263e8381b45c7c932b849f213ae6734dcd7312fd7cf
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_blanqueamiento', 'anexo_procedimiento', 1, 'Odontología · Blanqueamiento dental',
'## En qué consiste
Aplicación de agentes aclaradores (peróxido de hidrógeno o de carbamida) sobre los dientes, en clínica, en casa con cubetas o combinado, para aclarar su color. El resultado varía según cada persona y no es permanente.

## Riesgos frecuentes
- Sensibilidad dental durante el tratamiento y algunos días después.
- Irritación transitoria de las encías.

## Riesgos poco frecuentes
- Resultado desigual o menor al esperado.
- Las restauraciones, coronas o carillas no cambian de color y pueden requerir reemplazo para armonizar.

## Alternativas
Limpieza y pulido, carillas o coronas, o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, caries o enfermedad de encías sin tratar, sensibilidad dental severa y menores de edad, según evaluación.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
Evitar alimentos y bebidas con colorantes (café, té, vino tinto) y tabaco durante el tratamiento y 48 horas después. Usar pasta desensibilizante si se indica.',
'ae18fedecebaddb45443e263e8381b45c7c932b849f213ae6734dcd7312fd7cf', 'vigente', UTC_TIMESTAMP(3));

-- anexo_ortodoncia v1 · sha256 5511f0a481b27542de96184177b5ea8df1882934bccee4cccd2958c1a0d614c3
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_ortodoncia', 'anexo_procedimiento', 1, 'Odontología · Tratamiento de ortodoncia',
'## En qué consiste
Corrección de la posición de los dientes y de la mordida mediante aparatos fijos (brackets) o removibles (alineadores), durante un período que habitualmente va de 12 a 36 meses, seguido de una etapa de contención con retenedores.

## Riesgos frecuentes
- Molestias o dolor leve tras cada activación.
- Úlceras o roces en la mucosa.
- Acumulación de placa y mayor riesgo de caries o inflamación de encías si la higiene es deficiente.

## Riesgos poco frecuentes
- Manchas blancas en el esmalte (descalcificación).
- Reabsorción de las raíces.
- Molestias en la articulación temporomandibular.
- Recidiva (los dientes vuelven a moverse) si no se usan los retenedores.
- Duración mayor a la estimada si no se cumplen las indicaciones o los controles.

## Alternativas
Tratamientos restauradores o protésicos, cirugía ortognática en casos indicados o no realizar el tratamiento.

## Si no se realiza
Puede mantenerse o agravarse la mala posición dentaria, con dificultad de higiene, desgaste o problemas de mordida.

## Cuidados posteriores
Higiene rigurosa, evitar alimentos duros o pegajosos, asistir a todos los controles y usar los retenedores según indicación.',
'5511f0a481b27542de96184177b5ea8df1882934bccee4cccd2958c1a0d614c3', 'vigente', UTC_TIMESTAMP(3));

-- anexo_periodoncia v1 · sha256 24d6f466203513fead14d7bedb54dec98de60c0ce71851cf7bbae8be9986f010
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_periodoncia', 'anexo_procedimiento', 1, 'Odontología · Tratamiento periodontal (destartraje y pulido radicular)',
'## En qué consiste
Retiro del sarro y la placa bacteriana sobre y bajo la encía, y alisado de las raíces, generalmente bajo anestesia local y en una o más sesiones, para tratar la enfermedad de las encías.

## Riesgos frecuentes
- Sensibilidad dental al frío o al calor por algunas semanas.
- Sangrado y molestia leve de encías.
- Retracción de las encías al desinflamarse, con dientes que se ven más largos o espacios entre ellos.

## Riesgos poco frecuentes
- Movilidad dentaria transitoria.
- Necesidad de cirugía periodontal si la enfermedad no se controla.

## Alternativas
Cirugía periodontal en casos avanzados o no realizar el tratamiento.

## Si no se realiza
La enfermedad periodontal puede avanzar, con pérdida de hueso, movilidad y pérdida de dientes.

## Cuidados posteriores
Higiene diaria con cepillo y elementos interdentales, enjuagues indicados y controles de mantención periódicos.',
'24d6f466203513fead14d7bedb54dec98de60c0ce71851cf7bbae8be9986f010', 'vigente', UTC_TIMESTAMP(3));

-- anexo_rehabilitacion_protesis v1 · sha256 df767d4ad0d32b00298976dc0de6e48ff7a47a19f6d6ca9ccc14fbbcd6b0f84a
INSERT INTO documento_plantilla (id_plantilla, codigo, categoria, version, titulo, cuerpo, cuerpo_sha256, estado, vigente_desde)
VALUES (UUID_TO_BIN(UUID(), 1), 'anexo_rehabilitacion_protesis', 'anexo_procedimiento', 1, 'Odontología · Rehabilitación con coronas o prótesis',
'## En qué consiste
Reemplazo o restauración de dientes mediante coronas, puentes, incrustaciones o prótesis removibles. Puede requerir desgastar dientes, tomar impresiones y usar provisorios durante el tratamiento.

## Riesgos frecuentes
- Sensibilidad dental tras el tallado.
- Período de adaptación a la prótesis, con molestias o roces.

## Riesgos poco frecuentes
- Inflamación de la pulpa que obligue a una endodoncia.
- Descementación, fractura o desgaste de la corona o la prótesis.
- Diferencias de color con los dientes naturales.

## Alternativas
Restauraciones directas, implantes, otro tipo de prótesis o no realizar el tratamiento.

## Si no se realiza
Puede haber fractura o pérdida de dientes debilitados, desplazamiento de piezas y dificultad para masticar.

## Cuidados posteriores
Higiene cuidadosa, evitar morder objetos duros y controles periódicos.',
'df767d4ad0d32b00298976dc0de6e48ff7a47a19f6d6ca9ccc14fbbcd6b0f84a', 'vigente', UTC_TIMESTAMP(3));
```

> `UUID_TO_BIN(UUID(), 1)` (v1 reordenado) porque MySQL no genera v7; ambos son
> `BINARY(16)` ordenados por tiempo. La app siempre usa v7.
> `SHA2(cuerpo, 256)` sobre utf8mb4 coincide con `crypto.createHash('sha256').update(cuerpo, 'utf8')`.

---

## 4. Estructura de archivos nueva

```
config/Database.js                        (sin cambios)
middleware/
  exigirUsuarioClerk.js                   NUEVO
  exigirReverificacion.js                 NUEVO
services/
  r2Storage.js                            MOD   + descargarArchivoComoBuffer, construirKeyPrivada
  firma/
    identificadores.js                    NUEVO uuidv7, uuidABuffer, bufferAUuid, codigoVerificacion
    tiempo.js                             NUEVO ahoraUtc, aMysqlUtc, aIsoUtc, formatearSantiagoConOffset
    rut.js                                NUEVO rutValido (módulo 11), pasaporteValido
    cadenaEvidencia.js                    NUEVO registrarEvento(conexion, evento), canonico()
    bitacora.js                           NUEVO registrarAcceso(...)
    procesarImagenFirma.js                NUEVO sharp
    estamparFirmaPdf.js                   NUEVO pdf-lib + qrcode
    constanciaConsentimiento.js           NUEVO jsPDF (patrón de envioCotizacionCorreo.js)
    correoDocumento.js                    NUEVO Brevo + construirCorreoBase
model/
  UsuarioPlataforma.js  ProfesionalFirma.js  DocumentoPlantilla.js
  DocumentoEmitido.js   DocumentoAcceso.js   FirmaEvento.js
  ConsentimientoAceptacion.js  PacienteOtp.js
  Profesionales.js                        MOD   registro SIS + firma_estado
controller/
  FirmaProfesionalController.js  DocumentosController.js
  ConsentimientosController.js   VerificacionController.js
  ProfesionalesController.js              MOD
  ReservaPacienteController.js            MOD   token_aceptacion
  MercadoPagoController.js                MOD   token_aceptacion
view/
  firmaProfesionalRoutes.js  documentosRoutes.js
  consentimientosRoutes.js   verificacionRoutes.js
  profesionalesRoutes.js                  MOD
migraciones/
  2026-10-23_firma_electronica.sql
  2026-10-23_firma_electronica_seed.sql
scripts/
  verificar_cadena_firma.mjs              NUEVO
pruebas/firma/*.test.mjs                  NUEVO (node --test)
```

`app.js`:

```js
import firmaProfesionalRoutes from "./view/firmaProfesionalRoutes.js";
import documentosRoutes from "./view/documentosRoutes.js";
import consentimientosRoutes from "./view/consentimientosRoutes.js";
import verificacionRoutes from "./view/verificacionRoutes.js";

app.use("/firmaProfesional", firmaProfesionalRoutes);
app.use("/documentos", documentosRoutes);
app.use("/consentimientos", consentimientosRoutes);
app.use("/verificacion", verificacionRoutes);
```

Al arrancar, validar `FIRMA_HMAC_CLAVE` (≥ 32 bytes decodificada). Si falta, los
routers de firma responden `503 {message:"serverError"}` y se loguea
`[FIRMA] FIRMA_HMAC_CLAVE no configurada` (falla cerrado; el resto del backend sigue).

---

## 5. Servicios

### 5.1 `identificadores.js`

```js
import { v7 as uuidv7 } from "uuid";
import { randomBytes } from "node:crypto";

export const nuevoId = () => uuidv7();                         // "0192b3c4-…"
// SQL: UUID_TO_BIN(?)  /  BIN_TO_UUID(col) AS id_x

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";             // Crockford, sin I L O U
export function codigoVerificacion() {
  const b = randomBytes(8);
  const c = [...b].map((x) => ALFABETO[x & 31]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;                      // reintentar si choca con UNIQUE
}
export const tokenAceptacion = () => `ca_${randomBytes(16).toString("hex")}`;
```

### 5.2 `tiempo.js`

```js
export const ahoraUtc = () => new Date();                       // reloj del servidor
export const aMysqlUtc = (d) => d.toISOString().replace("T", " ").replace("Z", ""); // '2026-10-23 01:25:57.123'
// Lectura: SELECT DATE_FORMAT(col, '%Y-%m-%dT%H:%i:%s.%fZ') AS col_iso → new Date(x).toISOString()
export const aIsoUtc = (textoMysql) => new Date(textoMysql).toISOString();

export function formatearSantiagoConOffset(d) {
  // → "22-10-2026 22:25:57 (UTC-03:00)"
  const tz = "America/Santiago";
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("es-CL", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(d).map((p) => [p.type, p.value])
  );
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
    .formatToParts(d).find((p) => p.type === "timeZoneName").value.replace("GMT", "UTC"); // "UTC-03:00"
  return `${partes.day}-${partes.month}-${partes.year} ${partes.hour}:${partes.minute}:${partes.second} (${offset})`;
}
```

Probar con `TZ=UTC`, `TZ=Asia/Tokyo`, `TZ=Pacific/Niue`, instantes de enero
(UTC−3) y julio (UTC−4): el resultado no debe depender del `TZ` del proceso.

### 5.3 `cadenaEvidencia.js`

```js
/**
 * Inserta un evento en firma_evento dentro de la transacción de `conexion`.
 * Serializa con SELECT … FOR UPDATE sobre firma_cadena_estado (fila id=1).
 */
export async function registrarEvento(conexion, evento) {
  const [[estado]] = await conexion.query(
    "SELECT ultima_secuencia, ultimo_hash FROM firma_cadena_estado WHERE id = 1 FOR UPDATE");
  const secuencia = Number(estado.ultima_secuencia) + 1;
  const ocurridoAt = ahoraUtc();
  const registro = { ...evento, id_evento: nuevoId(), secuencia,
                     ocurrido_at: ocurridoAt.toISOString(), hash_anterior: estado.ultimo_hash };
  const hashEvento = sha256(canonico(registro));
  const sello = hmacSha256(clave(), hashEvento);
  await conexion.query("INSERT INTO firma_evento (...) VALUES (UUID_TO_BIN(?), ?, ...)", [...]);
  await conexion.query(
    "UPDATE firma_cadena_estado SET ultima_secuencia = ?, ultimo_hash = ? WHERE id = 1",
    [secuencia, hashEvento]);
  return { id_evento: registro.id_evento, secuencia, hash_evento: hashEvento };
}
```

**Forma canónica** (lo que se hashea): JSON con claves en orden alfabético, sin
espacios, `null` explícito para campos vacíos, instantes como ISO UTC con
milisegundos, IDs como UUID texto. Campos incluidos: `secuencia, tipo_evento,
id_evento, id_documento, id_firma, id_aceptacion, id_profesional, id_paciente,
actor_tipo, actor_clerk_id, actor_nombre, metodo_autenticacion, autenticado_at,
documento_sha256, datos_json, ip, user_agent, ocurrido_at, hash_anterior`.
`datos_json` también se serializa con claves ordenadas (función recursiva).

`clave()` lee `FIRMA_HMAC_CLAVE` (base64) y `clave_version` = `FIRMA_HMAC_VERSION`.
Para rotar: nueva clave con versión +1; el verificador conserva las anteriores
en `FIRMA_HMAC_CLAVES_ANTERIORES` (JSON `{ "1": "base64…" }`).

### 5.4 `scripts/verificar_cadena_firma.mjs`

Recorre `firma_evento` por `secuencia` ascendente y comprueba: secuencia sin
huecos, `hash_anterior` = `hash_evento` del previo (el primero = 64 ceros),
`hash_evento` = SHA-256 del canónico recalculado, `sello_hmac` válido con la
clave de su versión, y que `firma_cadena_estado` apunte al último. Además, para
cada `documento_firmado`, descarga el PDF de R2 y compara su SHA-256 con
`documento_sha256`. Sale con código 1 ante cualquier diferencia e imprime la
primera secuencia rota. Uso: `node scripts/verificar_cadena_firma.mjs [--con-pdf]`.

### 5.5 `procesarImagenFirma.js`

```js
import sharp from "sharp";

export async function normalizarFirma(buffer) {
  const meta = await sharp(buffer).metadata();
  if (meta.format !== "png") throw codigo("pngInvalido");
  if (!meta.width || meta.width > 4000 || meta.height > 2000) throw codigo("pngInvalido");

  const salida = await sharp(buffer)
    .ensureAlpha()
    .trim({ threshold: 8 })                       // recorta al bounding box (fondo transparente)
    .resize({ height: 200, width: 600, fit: "inside" })   // 200 de alto; si excede 600 de ancho, manda el ancho
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = salida.info;
  if (width < 20 || height < 20) throw codigo("pngInvalido");   // vacío o casi vacío
  // Rechazar si > 98 % de píxeles son transparentes no aplica tras trim; validar con stats():
  const { channels } = await sharp(salida.data).stats();
  if (channels[3] && channels[3].max < 32) throw codigo("pngInvalido");
  return { buffer: salida.data, ancho: width, alto: height };
}
```

Además se valida el JSON de `trazos`: ≥ 1 trazo, entre 20 y 20 000 puntos, cada
punto `{x,y,t}` numérico finito.

### 5.6 `estamparFirmaPdf.js`

> **Ya implementado y probado en el front:** `src/lib/documentos/estamparFirmaPdf.js`
> (isomórfico: recibe y devuelve bytes, sin dependencias del navegador) y
> `src/lib/documentos/zonaFirma.js`. Copiarlos tal cual a `services/firma/` del
> backend; el código de abajo es la referencia. El backend le pasa el QR con
> `QRCode.toBuffer(url, { margin: 1, width: 360 })` y la fecha ya formateada con
> `formatearSantiagoConOffset(firmadoAt)`.

Medidas compartidas con el front (idénticas a `src/lib/documentos/zonaFirma.js`):

```js
export const ZONA_FIRMA = { alto: 56, anchoQr: 30, separacionQr: 6, altoGrafia: 18, anchoMaxGrafia: 70 }; // mm
const MM = 72 / 25.4;   // mm → pt
```

```js
export async function estamparFirma({ borrador, zona, grafiaPng, firmante, firmadoAt, codigo, resumen, urlVerificacion }) {
  const pdf = await PDFDocument.load(borrador, { updateMetadata: false });
  const pagina = pdf.getPage(zona.pagina - 1);
  const { height: altoPagina } = pagina.getSize();
  const y = (mm) => altoPagina - mm * MM;                  // pdf-lib mide desde abajo

  const fuente = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const imagen = await pdf.embedPng(grafiaPng);
  const qr = await pdf.embedPng(await QRCode.toBuffer(urlVerificacion,
                { type: "png", errorCorrectionLevel: "M", margin: 1, width: 360 }));

  // Columna de texto: zona.ancho − anchoQr − separacionQr
  // 1) grafía escalada a altoGrafia (máx anchoMaxGrafia), apoyada sobre la línea
  // 2) línea 0.6 pt, color [30,41,59]
  // 3) líneas (omitir vacías, cortar con widthOfTextAtSize para no salirse de la columna):
  //    nombre (10 pt bold) · profesión (9) · "Reg. Superintendencia de Salud N° X" (9)
  //    · "Firmado electrónicamente · FES, Ley 19.799" (8, gris)
  //    · `${formatearSantiagoConOffset(firmadoAt)} · Código ${codigo}` (8, gris)
  //    · resumen (8, gris)
  // 4) QR de anchoQr mm en la columna derecha, borde redondeado tenue, código debajo (7 pt, gris)
  // Si el texto no cabe en zona.alto → lanzar error 'pdfInvalido' (no debe pasar: el front reserva 56 mm)

  pdf.setTitle(`${firmante.tituloDocumento} · ${codigo}`);
  pdf.setProducer("AgendaClínica — FES Ley 19.799");
  pdf.setModificationDate(firmadoAt);
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}
```

- Helvetica estándar usa WinAnsi: admite tildes, ñ, `°` y `·`. Sanitizar
  caracteres fuera de WinAnsi (emojis, comillas tipográficas raras) antes de dibujar.
- URL del QR: `${URL_PUBLICA_SITIO}/verificar/${codigo}`.
- **Este es el único lugar donde se incrusta la grafía. Se llama una sola vez por documento.**

### 5.7 `bitacora.js`

```js
export async function registrarAcceso({ id_documento = null, id_aceptacion = null, accion,
                                        usuario = null, contexto, destinatario = null }, conexion = null)
```

Inserta en `documento_acceso` con `ocurrido_at = aMysqlUtc(ahoraUtc())`. Nunca
lanza hacia el controlador si falla una lectura (`visto`), pero sí si falla un
`enviado` (el envío debe quedar registrado o no reportarse como exitoso).

### 5.8 `correoDocumento.js`

Copia el patrón de `services/envioCotizacionCorreo.js` (Brevo, `BREVO_API_KEY`,
`CORREO_REMITENTE`, `replyTo` = correo de la clínica, `construirCorreoBase`):

- Asunto: `"{Tipo} - {empresaNombre}"` (sin datos clínicos).
- Cuerpo: saludo, tipo y título del documento, profesional firmante, código de
  verificación, botón "Verificar documento" → URL pública.
- Adjunto: **bytes leídos de R2** (`pdf_key`), en base64 solo para el payload.
- Devuelve `true` si Brevo responde 2xx.

### 5.9 `constanciaConsentimiento.js`

Genera con `jspdf` (como la cotización) el PDF de constancia **una vez**, al
registrar la aceptación: encabezado de la clínica, título y versión, texto
interpolado completo, y bloque final:

```
Aceptado electrónicamente por: Ana Pérez · RUT 12.345.678-5
Fecha y hora: 22-10-2026 22:25:57 (UTC-03:00)
Método: aceptación expresa en formulario web de reserva
Versión del texto: tratamiento_datos v1 · huella a3f9…7c21
Código de verificación: K3M8-QZ2P                                  [QR]
```

---

## 6. Middlewares

### 6.1 `exigirUsuarioClerk.js`

Basado en `verificarUsuarioClerk.js` (reutilizar el cliente Clerk de módulo), pero
falla cerrado:

```js
export const exigirUsuarioClerk = async (req, res, next) => {
  try {
    const cabecera = req.headers.authorization || "";
    const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7).trim() : null;
    if (!token || !process.env.CLERK_SECRET_KEY) return res.status(401).json({ message: "noAutorizado" });

    const datos = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const u = await obtenerClerk().users.getUser(datos.sub);

    const idProfesional = Number(u.publicMetadata?.idProfesionalAgenda) || null;
    const usuario = {
      clerkId: datos.sub,
      sesionId: datos.sid,
      fva: Array.isArray(datos.fva) ? datos.fva : [-1, -1],
      email: u.primaryEmailAddress?.emailAddress || null,
      nombre: [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || null,
      rol: u.publicMetadata?.role || u.publicMetadata?.rol || null,
      idProfesional,
    };
    usuario.idUsuario = await new UsuarioPlataforma().asegurar(usuario);   // upsert por clerk_user_id, devuelve Buffer
    req.usuario = usuario;
    req.contexto = { ip: req.ip, userAgent: (req.get("user-agent") || "").slice(0, 255) };
    next();
  } catch (error) {
    console.error("[CLERK] exigirUsuarioClerk:", error.message);
    return res.status(401).json({ message: "noAutorizado" });
  }
};
```

`UsuarioPlataforma.asegurar()` usa:

```sql
INSERT INTO usuario_plataforma (id_usuario, clerk_user_id, id_profesional, nombre, email, rol, creado_at, actualizado_at)
VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE id_profesional = VALUES(id_profesional), nombre = VALUES(nombre),
  email = VALUES(email), rol = VALUES(rol), actualizado_at = VALUES(actualizado_at);
SELECT id_usuario FROM usuario_plataforma WHERE clerk_user_id = ?;
```

Opcional: caché en memoria de 60 s por `clerkId` para no consultar Clerk en cada
request (la reverificación se lee del token, no de la caché).

### 6.2 `exigirReverificacion.js`

```js
export const exigirReverificacion = ({ minutos = Number(process.env.FIRMA_REVERIFICACION_MIN || 10) } = {}) =>
  (req, res, next) => {
    const [primer, segundo] = req.usuario?.fva || [-1, -1];
    const ok1 = primer >= 0 && primer <= minutos;
    const ok2 = segundo >= 0 && segundo <= minutos;
    if (!ok1 && !ok2) {
      return res.status(403).json({
        message: "reverificacionRequerida",
        clerk_error: { type: "forbidden", reason: "reverification-error",
                       metadata: { reverification: { level: "first_factor", afterMinutes: minutos } } },
      });
    }
    const edad = ok2 ? segundo : primer;
    req.reverificacion = {
      metodo: ok2 ? "clerk_reverificacion_segundo_factor" : "clerk_reverificacion_primer_factor",
      autenticadoAt: new Date(Date.now() - edad * 60_000),
      edadMinutos: edad,
    };
    next();
  };
```

> Verificar en la primera prueba que el token de sesión de la instancia trae el
> claim `fva` (Clerk lo incluye en tokens de sesión v2). Si no viniera, la
> alternativa es leer la sesión con `clerk.sessions.getSession(sid)` y su
> `factorVerificationAge`.

---

## 7. Controladores (lógica clave)

Rutas, permisos y formas de respuesta: ver `02-contrato-endpoints.md`. Aquí, lo
que no puede quedar a criterio:

### 7.1 `FirmaProfesionalController.registrarFirma`

```
1. Validar campos (sindata), esProfesionalDueno (sinPermiso), acta vigente (actaNoAceptada/actaDesactualizada).
2. normalizarFirma(req.file.buffer) → {buffer, ancho, alto}; validar trazos.
3. imagen_sha256 = sha256(buffer normalizado); trazos_sha256 = sha256(JSON trazos).
4. Subir a R2: privado/firmas/{id_profesional}/{randomBytes(16).hex}.png  y  …/{rand}.json
5. Transacción (conexion = await DataBase.getInstance().obtenerConexion()):
   a. SELECT … FROM profesional_firma WHERE id_profesional = ? AND estado = 'activa' FOR UPDATE
   b. si existe: UPDATE estado='reemplazada', cerrada_at, motivo_cierre='reemplazo'
      + registrarEvento(firma_reemplazada)
   c. INSERT nueva (estado 'activa')
   d. registrarEvento(acta_aceptada, datos_json:{acta_codigo, acta_version, acta_sha256})
   e. registrarEvento(firma_registrada, datos_json:{imagen_sha256, trazos_sha256, tinta, ancho, alto},
                      metodo = req.reverificacion.metodo, autenticado_at = req.reverificacion.autenticadoAt)
   f. COMMIT
6. Si la transacción falla: ROLLBACK y borrar los objetos subidos a R2.
```

El `UNIQUE (activa_de)` hace que dos registros simultáneos no puedan dejar dos
firmas activas: el segundo falla con `ER_DUP_ENTRY` → responder `409 {message:"conflicto"}`.

### 7.2 `DocumentosController.prepararDocumento`

```
1. Validar campos y catálogo (un tipo fuera del ENUM, incluida "receta", → 422 tipoDocumentoNoPermitido).
   La validación en la app es obligatoria: si el servidor MySQL no corre en modo
   estricto (`SELECT @@sql_mode` debe incluir `STRICT_TRANS_TABLES`), un valor fuera
   del ENUM se guardaría vacío en vez de fallar.
2. Validar PDF: empieza con %PDF-, PDFDocument.load sin error, páginas ≤ 30, zona_firma dentro de la página indicada
   (x ≥ 0, y ≥ 0, x+ancho ≤ anchoPagina, y+alto ≤ altoPagina, alto ≥ 62).
3. metadatos_json ≤ 64 KB; texto_renderizado obligatorio para consentimiento_informado.
4. borrador_sha256 = sha256(buffer); subir a privado/documentos/borradores/{yyyy}/{rand}.pdf
5. codigo_verificacion único (reintentar hasta 5 veces ante ER_DUP_ENTRY).
6. INSERT documento_emitido (preparado_* = req.usuario, req.contexto, ahoraUtc()).
7. registrarAcceso(accion:'generado').
```

### 7.3 `DocumentosController.firmarDocumento`

**Regla:** la transacción de MySQL nunca queda abierta mientras se baja o sube algo
de R2 ni mientras se estampa el PDF. El pool tiene 5 conexiones: si cada firma
retuviera una conexión con `FOR UPDATE` durante 1–3 s de red y CPU, cinco firmas
simultáneas dejarían sin conexión al resto de la aplicación (agenda, fichas, login
de pacientes). Por eso se hace en tres fases:

```
Fase A — validar (sin transacción, lecturas simples):
1. documento por id; estado = 'pendiente_firma' (si no → 409 documentoYaFirmado | documentoAnulado)
2. esProfesionalDueno(req.usuario, id_profesional_firmante) (si no → 403 sinPermiso)
3. zona_paciente_json no nulo y paciente_acepto_at nulo → 409 otpRequerido
4. firma activa del firmante (si no → 409 firmaInexistente)

Fase B — trabajo pesado (sin conexión a MySQL), dentro de limitarEstampado() (§9.2):
5. leer de R2 el borrador y el PNG; verificar sha256(borrador) = borrador_sha256
   y sha256(png) = imagen_sha256 (si no → 500 serverError + console.error)
6. firmadoAt = ahoraUtc()
7. bytes = estamparFirma({ borrador, zona, grafía, firmante: {nombre, rut (rutProfesional), profesion,
     registroSis (solo si estado ≠ rechazado)}, firmadoAt, codigo, resumen, qr,
     zonaPaciente, aceptacionPaciente })
8. pdf_sha256 = sha256(bytes); subir a privado/documentos/firmados/{yyyy}/{rand}.pdf

Fase C — confirmar (transacción corta, milisegundos):
9.  SELECT … FROM documento_emitido WHERE id_documento = ? FOR UPDATE
10. si estado ya no es 'pendiente_firma' (otra pestaña firmó o se anuló entre A y C):
      ROLLBACK, eliminar el objeto subido en el paso 8 → 409 documentoYaFirmado | documentoAnulado
11. UPDATE documento_emitido SET estado='firmado', id_firma, firmado_por_*, firmado_at = firmadoAt,
      pdf_key, pdf_sha256, pdf_bytes
12. registrarEvento(documento_firmado, documento_sha256 = pdf_sha256, actor_tipo='profesional',
      metodo = req.reverificacion.metodo, autenticado_at, datos_json: { codigo, tipo_documento,
      borrador_sha256, id_firma, imagen_sha256, id_otp, plantillas: metadatos.plantillas,
      preparado_por_clerk_id, preparado_at })
13. COMMIT. Cualquier error en la fase C: ROLLBACK + eliminar el objeto subido.
```

Si el paso 8 sube el archivo pero el proceso muere antes de la fase C, queda un
objeto huérfano en R2 sin fila que lo apunte: no tiene efecto legal (el documento
sigue en `pendiente_firma`) y lo limpia el script semanal de §9.6.

Si el borrador leído de R2 no coincide con `borrador_sha256` → abortar con
`500 serverError` y `console.error` (posible manipulación del almacenamiento).

### 7.4 Descargas (URL firmada, el archivo no pasa por el backend)

Contrato: `02` §3.5. Mismo mecanismo que ya usa `ArchivoPacienteController` con
`generarUrlDescarga`:

```js
// controller/DocumentosController.js
async descargarDocumento(req, res) {
  const { id_documento, accion } = req.body;
  const doc = await documentos.seleccionarPorId(id_documento);
  if (!doc || doc.estado === "pendiente_firma") return res.status(404).json({ message: "noEncontrado" });
  if (!(await puedeVerDocumento(req.usuario, doc))) return res.status(403).json({ message: "sinPermiso" });

  // Primero la bitácora: si no se puede registrar el acceso, no se entrega el archivo.
  await registrarAcceso({ id_documento, accion, usuario: req.usuario, ip: req.ip, ua: req.get("user-agent") });

  const nombre = `${doc.tipo_documento}-${doc.codigo_verificacion}.pdf`;
  const url = await generarUrlDescarga(doc.pdf_key, 60, {
    ResponseContentDisposition: `inline; filename="${nombre}"`,
    ResponseContentType: "application/pdf",
    ResponseCacheControl: "no-store",
  });
  res.set("Cache-Control", "no-store");
  return res.json({ message: true, url, sha256: doc.pdf_sha256, nombre,
    expira_at: new Date(Date.now() + 60_000).toISOString() });
}
```

- **No** llama a `estamparFirma` ni a ningún generador: se entrega el archivo guardado.
- La URL **nunca** se guarda en la BD, ni se escribe en logs, ni se envía por correo.
- El front comprueba el SHA-256 del archivo recibido. La integridad de lo almacenado
  la vigila además `verificar_cadena_firma.mjs --con-pdf` (§9.6).
- Si `generarUrlDescarga` hoy no acepta el tercer parámetro, se agrega: es un
  `GetObjectCommand` con esos campos `Response*`.
- `enviarDocumentoCorreo` sí lee el archivo (para adjuntarlo en Brevo); pasa por
  `limitarEstampado()` y verifica el hash antes de enviar.

### 7.4.1 Aceptación del paciente por código (OTP)

Contrato: `02` §6.9. Lógica que no puede quedar a criterio:

```
solicitarOtpPaciente({ id_documento, canal }):
1. Documento en pendiente_firma y con zona_paciente_json (si no: 409 / 422).
2. Destino = pacienteDatos.telefono (sms) o pacienteDatos.correo (email) del id_paciente
   del documento. Nunca un dato que venga del cliente. Sin dato → 422 sinDatoContacto.
3. codigo = crypto.randomInt(0, 1_000_000) con 6 dígitos.
4. INSERT paciente_otp: codigo_hash = HMAC-SHA256(FIRMA_HMAC_CLAVE, codigo + id_otp),
   destino_mascarado, intentos = 0, expira_at = ahora + 10 min.
   Un OTP anterior sin verificar del mismo documento queda inutilizable (expira_at = ahora).
5. Enviar: SMS con Twilio ("Tu código para aceptar el consentimiento de {clínica} es 482913.
   Vence en 10 minutos.") o correo con Brevo + construirCorreoBase.
6. Responder { destino (enmascarado), expira_at }. Nunca el código.

verificarOtpPaciente({ id_documento, codigo }):
1. Último paciente_otp del documento. Vencido o inexistente → 409 otpExpirado.
2. intentos >= 5 → 429 otpIntentosAgotados.
3. Comparar con crypto.timingSafeEqual el HMAC del código recibido.
   Incorrecto → intentos + 1 → 422 otpInvalido.
4. Correcto, en una transacción:
   - paciente_otp.verificado_at = ahora, ip_verificacion = req.ip
   - documento_emitido: paciente_otp_id, paciente_acepto_at, paciente_canal,
     paciente_destino, paciente_firmante (nombre y documento del paciente o representante)
   - registrarEvento(otp_paciente_verificado, actor_tipo "paciente",
     metodo "otp_sms" | "otp_email", autenticado_at = ahora, id_paciente, id_documento,
     datos_json { canal, destino, id_otp })
```

En `firmarDocumento` (§7.3), antes del paso 4: si `zona_paciente_json` no es nulo y
`paciente_acepto_at` es nulo → `409 otpRequerido`. Al estampar, se pasan
`zonaPaciente` y `aceptacionPaciente` a `estamparFirma` (ya implementado en
`src/lib/documentos/estamparFirmaPdf.js` del front). El evento `documento_firmado`
incluye en `datos_json` el `id_otp` de la aceptación.

### 7.5 `ProfesionalesController` (modificaciones)

- `insertar/actualizar`: validar `rutValido(rutProfesional)` → `422 rutInvalido`;
  aceptar `registro_sis_numero` opcional; si cambia → `registro_sis_estado`
  (`declarado` o `no_informado`), limpiar `verificado_*` y registrar
  `registro_sis_declarado` en la misma transacción. Mientras estas rutas sigan sin
  token (deuda C1 de `02`), el evento se registra con `actor_tipo='sistema'` y
  `metodo_autenticacion='sin_autenticacion'`; al protegerlas, pasa a
  `actor_tipo='operador'` con el usuario de Clerk y `'clerk_sesion'`.
- **Foto:** `insertarProfesionalModel` y `actualizarProfesionalModel` agregan la
  columna existente `imagenProfesional` a su INSERT/UPDATE (`imagenProfesional = ?`,
  con `NULL` cuando llega `""`). Validar el formato en el controlador (ver `02` §5.1).
  No requiere migración: la columna ya está en la tabla.
- `seleccionarTodosLosProfesionales` / `seleccionarProfesionalPorID`: agregar
  `registro_sis_numero`, `registro_sis_estado` y
  `IF(pf.id_firma IS NULL, 'ninguna', 'activa') AS firma_estado` con
  `LEFT JOIN profesional_firma pf ON pf.activa_de = p.id_profesional`.
  **No** devolver `registro_sis_certificado_key`.

### 7.6 Consentimientos

- `registrarAceptacion`: una transacción para las dos aceptaciones, mismo
  `token_aceptacion`; cada una con su `codigo_verificacion`, su texto interpolado,
  su constancia PDF y su evento `consentimiento_aceptado`
  (`actor_tipo='paciente'`, `metodo_autenticacion='formulario_publico'`).
- Vinculación desde `insertarReservaPaciente` / `createOrder`:
  ```sql
  UPDATE consentimiento_aceptacion
     SET id_reserva = ?, id_paciente = ?, vinculado_at = ?
   WHERE token_aceptacion = ? AND id_reserva IS NULL;
  ```
  `id_paciente` se resuelve por `pacienteDatos.rut = paciente_documento` cuando existe.
  Nunca debe hacer fallar la reserva.

---

### 7.7 Procedimientos del consentimiento informado

Contrato completo: `02` §7.8. Sin tabla nueva: cada procedimiento es una fila de
`documento_plantilla` con `categoria = anexo_procedimiento`, `titulo = "Especialidad · Nombre"`
y `creado_por_clerk` (NULL en los 14 de ejemplo del seed → `origen: "ejemplo"`).

- El texto lo arma el servidor con `services/firma/anexos.js` (copia exacta del front).
- Publicar = en una transacción: `SELECT … FOR UPDATE` de la vigente, `UPDATE … estado=retirada`
  y `INSERT` de la versión siguiente como `vigente` (el índice `uq_plantilla_vigente`
  garantiza una sola vigente por código).
- No pasa por la cadena de evidencia: lo que importa legalmente es el texto que leyó
  cada paciente, y ese queda como snapshot (`metadatos.texto_renderizado` y huellas de
  plantillas) en el evento `documento_firmado` de cada consentimiento.

## 8. Cumplimiento legal y protección de datos

> Base técnica para la revisión del abogado de la clínica; no reemplaza esa revisión.
> Marco: **Ley 19.799** (firma electrónica), **Ley 20.584** (derechos del paciente y
> ficha clínica) y su reglamento de fichas clínicas, y **Ley 19.628 modificada por la
> Ley 21.719** (protección de datos personales, plenamente vigente desde el
> **1 de diciembre de 2026**). Los datos de salud son **datos sensibles**.

### 8.1 Roles

| Quién | Rol en la Ley 21.719 | Consecuencia práctica |
|---|---|---|
| La clínica (cada instancia) | **Responsable** del tratamiento | Decide para qué se usan los datos; responde ante el paciente y la Agencia |
| NativeCode | **Encargado** del tratamiento | Trata los datos solo por instrucción de la clínica; requiere **contrato de encargo** firmado (objeto, duración, medidas de seguridad, confidencialidad, devolución o eliminación al término) |
| Cloudflare (R2), Brevo, Twilio, Clerk | **Subencargados** | Se listan en el contrato de encargo; la clínica debe poder conocerlos. Algunos procesan fuera de Chile → transferencia internacional (§8.6) |

### 8.2 Validez de la firma (Ley 19.799)

| Requisito | Cómo se cumple |
|---|---|
| Identificar al firmante | Sesión Clerk + **reverificación** (contraseña o código) de los últimos 10 min; se registra el método y la hora |
| Vincular la firma al documento | SHA-256 del PDF final en la evidencia; cualquier cambio de un byte lo invalida |
| Detectar alteraciones posteriores | Cadena de eventos con hash y sello HMAC; verificación pública por código o archivo |
| Hora confiable | Reloj del servidor (NTP), nunca la del navegador; se estampa con desfase horario |
| Voluntad de firmar | Acta de adhesión aceptada al registrar la grafía + acción explícita "Firmar con FES" sobre el documento previsualizado |
| Paciente (consentimiento) | Código OTP al dato **ya registrado** en su ficha; queda el canal, el destino enmascarado, la hora y la IP |

Es **firma electrónica simple**. No sirve para documentos que la ley exige con
firma avanzada o de puño y letra: por eso las **recetas** (en especial las de
psicotrópicos y estupefacientes) quedan solo como "Imprimir para firmar".

### 8.3 Conservación (Ley 20.584)

- La ficha clínica y lo que forma parte de ella (consentimientos informados,
  documentos firmados, evidencia) se conserva **mínimo 15 años** desde la última
  atención. Ningún endpoint ni script borra documentos firmados, evidencia ni
  constancias; la "anulación" es un estado, no un borrado.
- **Protección contra borrado en R2:** activar una regla de *Bucket Lock* sobre el
  prefijo `privado/documentos/firmados/` y `privado/consentimientos/` con
  retención de 15 años (verificar en el panel de Cloudflare antes de aplicarla:
  una regla de bloqueo no se puede acortar). Así, ni con las credenciales del
  backend se pueden borrar.
- **Respaldo:** copia periódica del bucket a una cuenta o proveedor distinto, y
  `mysqldump` diario cifrado. Probar una restauración al menos una vez al año.
- Al terminar el contrato con una clínica: se entrega a la clínica la totalidad de
  sus documentos y evidencia (PDF + exportación de tablas + clave HMAC), y recién
  después NativeCode elimina su copia, según el contrato de encargo.

### 8.4 Seguridad (deber de seguridad, Ley 21.719)

- **Cifrado en reposo:** R2 cifra los objetos (AES-256) por defecto; MySQL con
  disco cifrado. **En tránsito:** solo HTTPS (`NEXT_PUBLIC_API_URL` con `https://`).
- **Bucket privado:** sin acceso público ni dominio público; claves
  `privado/...` con 128 bits aleatorios (no adivinables, sin RUT ni nombre).
- **Descargas:** URL firmada de 60 s (§7.4); nunca guardada, registrada ni enviada.
- **Acceso mínimo:** cada endpoint valida el permiso por rol y por paciente
  (`puedeVerDocumento`); recepción no ve el contenido clínico.
- **Bitácora de accesos:** toda vista, descarga, impresión y envío queda en
  `documento_acceso` (quién, cuándo, desde qué IP). El técnico NativeCode queda
  identificado como tal.
- **Secretos:** `FIRMA_HMAC_CLAVE`, credenciales de R2, Brevo y Twilio solo en
  `.env`, fuera del repositorio, con copia en un gestor de secretos.
- **Logs:** sin `req.body`, archivos, URLs firmadas, OTP ni tokens.
- **Disponibilidad:** límites y protecciones del §9, para que un abuso no deje la
  ficha clínica inaccesible.

### 8.5 Minimización y transparencia

- **Verificación pública** (`/verificar/[codigo]`): muestra solo tipo de documento,
  clínica, profesional, fecha y estado. **Nunca** nombre, RUT ni datos clínicos del
  paciente.
- **SMS y correos del OTP:** solo el código, la clínica y el vencimiento. Ningún
  dato de salud ni nombre del procedimiento.
- **Correos con documentos:** asunto genérico ("Tienes un documento de
  {clínica}"), el contenido va en el adjunto.
- Destinos enmascarados en todas las respuestas (`a•••@correo.cl`, `+56 9 •••• 5678`).
- La política de privacidad de cada clínica debe mencionar: firma electrónica,
  proveedores (subencargados), plazo de conservación y cómo ejercer derechos.

### 8.6 Transferencia internacional

R2, Brevo, Twilio y Clerk pueden almacenar o procesar datos fuera de Chile. La
Ley 21.719 permite transferir cuando existen garantías adecuadas (por ejemplo,
cláusulas contractuales del proveedor). Acciones:

1. Guardar los acuerdos de tratamiento de datos (DPA) de cada proveedor.
2. En R2, usar *jurisdicción* o ubicación de bucket lo más cercana disponible.
3. Mencionar la transferencia en la política de privacidad de la clínica.

### 8.7 Derechos del paciente

| Derecho | Respuesta |
|---|---|
| Acceso / copia | El paciente puede pedir copia de sus documentos firmados; se entrega el PDF guardado (mismo hash). Ley 20.584 también le da acceso a su ficha |
| Rectificación | Un documento firmado no se edita: se anula con motivo y se emite uno nuevo; ambos quedan en la cadena |
| Supresión | **No procede** sobre la ficha clínica durante el plazo legal de conservación (obligación legal de la clínica). Sí sobre datos ajenos a la ficha (p. ej. marketing) |
| Retiro del consentimiento | Se registra como evento (`consentimiento_revocado`) y desde ese momento rige; no borra lo aceptado antes |
| Oposición / portabilidad | Se atienden por la clínica, con la exportación de §8.3 |

Plazo de respuesta y canal: los define la clínica en su política; el sistema
entrega los datos necesarios.

### 8.8 Incidentes de seguridad

Si hay acceso indebido, pérdida o alteración de datos (incluye que
`verificar_cadena_firma.mjs` detecte una cadena rota o un PDF alterado):

1. Contener: `FIRMA_HABILITADA=0` (§9.7), rotar credenciales afectadas.
2. Registrar: qué pasó, desde cuándo, qué datos y cuántos pacientes.
3. Avisar a la clínica (responsable) **de inmediato**; la clínica notifica a la
   **Agencia de Protección de Datos Personales** y, cuando corresponda, a los
   pacientes afectados, en los plazos que fije la ley y su reglamento.
4. Corregir y documentar la causa.

La clave HMAC permite demostrar **qué** eventos son auténticos aun después de un
incidente: por eso se guarda fuera del servidor.

---

## 9. Protección del backend

Objetivo: que la firma **nunca** pueda botar ni dejar lento el backend de una
clínica, aunque alguien suba un archivo enorme, firme muchas veces seguidas o R2
falle. Todo lo de esta sección es obligatorio antes de activar la firma en una
instancia.

### 9.1 Tamaño de lo que entra

| Dónde | Límite | Cómo |
|---|---|---|
| `express.json()` de las rutas nuevas | 100 KB | `express.json({ limit: "100kb" })` en el router; los JSON de firma son pequeños |
| PDF del borrador (`prepararDocumento`) | 10 MB, máx. 40 páginas | `multer({ storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20 } })`; contar páginas con `PDFDocument.load` y rechazar si excede |
| PNG de la firma | 512 KB, máx. 2000×1000 px | multer `fileSize` + `sharp(buffer, { limitInputPixels: 2_000_000 })` |
| Trazos (JSON) | 256 KB | multer `fileSize` |
| Certificado SIS | 5 MB, PDF/PNG/JPEG | multer `fileSize` + validar los primeros bytes (`%PDF`, `\x89PNG`, `\xFF\xD8`), no solo la extensión |

Un archivo más grande se corta mientras llega (multer deja de leer) y se responde
`413 archivoDemasiadoGrande`. El manejador de errores debe traducir
`MulterError LIMIT_FILE_SIZE` a ese código sin pasar por `serverError`.

### 9.2 CPU: cuántas firmas a la vez

Estampar (`pdf-lib`), normalizar la firma (`sharp`) y leer un PDF para el correo
son las únicas operaciones pesadas. Se ejecutan dentro de un limitador del proceso:

```js
// services/firma/limitador.js
const MAXIMO = Number(process.env.FIRMA_CONCURRENCIA || 2);
const COLA_MAXIMA = 10;
let activos = 0;
const cola = [];

export async function limitarEstampado(tarea) {
  if (activos >= MAXIMO) {
    if (cola.length >= COLA_MAXIMA) {
      const e = new Error("servicioOcupado"); e.status = 503; throw e;
    }
    await new Promise((r) => cola.push(r));
  }
  activos++;
  try { return await tarea(); }
  finally { activos--; cola.shift()?.(); }
}
```

- Con 2 a la vez y hasta 10 en espera, una ráfaga de firmas se atiende en orden y
  el resto de la aplicación sigue respondiendo.
- `sharp.concurrency(1)` y `sharp.cache(false)` al iniciar: `sharp` usa por defecto
  todos los núcleos y guarda caché en memoria.
- Límite de tasa por usuario: `firmarDocumento` 20 / 10 min,
  `prepararDocumento` 30 / 10 min, `registrarFirma` 5 / hora.

### 9.3 Conexiones a MySQL

- Ninguna transacción abarca llamadas a R2, Brevo, Twilio ni `estamparFirma` (§7.3).
- Toda transacción usa `try { … } finally { conexion.release() }`: una excepción
  nunca deja una conexión tomada.
- `registrarEvento` bloquea `firma_cadena_estado` solo durante el INSERT del evento
  (milisegundos). Si la espera supera `innodb_lock_wait_timeout` (50 s por defecto)
  se responde `503 servicioOcupado`, no `500`.

### 9.4 Servicios externos con tiempo límite

| Servicio | Tiempo límite | Si falla |
|---|---|---|
| R2 (subir / leer) | 15 s (`abortSignal: AbortSignal.timeout(15_000)` en cada `send`) | Se aborta la operación, se limpia lo subido, `503 servicioOcupado` |
| Brevo (correo) | 10 s | El documento queda firmado igual; el envío se informa como fallido y se puede reintentar |
| Twilio (SMS del OTP) | 10 s | `503`; el profesional puede pedir el código por correo |
| Clerk (verificar token) | lo maneja el SDK | `401` |

Ninguna llamada externa se reintenta en bucle dentro de la misma petición.

### 9.5 Errores que no botan el proceso

- Express 5 ya pasa al manejador los errores de funciones `async`. Los controladores
  nuevos no usan `.then()` sin `catch`.
- En `index.js`, si no existen:
  `process.on("unhandledRejection", (e) => console.error("[proceso]", e))` (registrar
  sin terminar) y `process.on("uncaughtException", …)` que registra y termina para que
  pm2 reinicie limpio.
- pm2: `max_memory_restart: "600M"` (ajustar a la RAM del servidor) y
  `kill_timeout: 10000` para que las firmas en curso terminen antes de reiniciar.
- Los logs nunca incluyen `req.body`, archivos, URLs firmadas, códigos OTP ni tokens.

### 9.6 Tareas programadas (fuera de horario, `node scripts/…` con cron)

| Script | Frecuencia | Qué hace |
|---|---|---|
| `verificar_cadena_firma.mjs` | diaria 03:00 | Recalcula hashes y HMAC de la cadena; avisa por correo al técnico si algo no cuadra |
| `verificar_cadena_firma.mjs --con-pdf` | semanal | Además baja cada PDF firmado y compara su SHA-256 (de a uno, sin paralelismo) |
| `limpiar_huerfanos_r2.mjs` | semanal | Borra objetos de `privado/documentos/` con más de 24 h que ninguna fila referencia (subidas interrumpidas). **Nunca** toca un objeto referenciado |
| `expirar_borradores.mjs` | diaria | Documentos en `pendiente_firma` con más de 30 días pasan a `anulado` con motivo "vencido" (el borrador se conserva; el evento queda en la cadena) |

### 9.7 Interruptor de emergencia

`FIRMA_HABILITADA=0` en el `.env` del backend hace que todas las rutas de
`/documentos` (salvo descargas de documentos ya firmados y la verificación pública)
respondan `503 servicioOcupado`. Así, si algo falla en producción, se apaga la firma
sin desplegar código y el resto de la plataforma sigue funcionando. El front ya
muestra un mensaje en ese caso.

---

## 10. Pruebas (`node --test "pruebas/firma/*.test.mjs"`)

1. `rut.test.mjs`: `12.345.678-5` válido; `12.345.678-0` inválido; K mayúscula/minúscula.
2. `tiempo.test.mjs`: `formatearSantiagoConOffset` con `TZ=America/Santiago|UTC|Asia/Tokyo|Pacific/Niue`
   → mismo texto; `2026-01-15T02:59:59.000Z` → `14-01-2026 23:59:59 (UTC-03:00)`;
   `2026-07-15T03:59:59.000Z` → `14-07-2026 23:59:59 (UTC-04:00)`; cambio de año y 29-02-2028.
3. `cadena.test.mjs`: 3 eventos encadenados verifican; alterar `ip` de uno rompe su `hash_evento`; alterar el sello rompe HMAC.
4. `imagen.test.mjs`: PNG con margen transparente → recortado, alto 200; PNG muy ancho → ancho 600; PNG vacío → `pngInvalido`; JPEG → `pngInvalido`.
5. `estampar.test.mjs`: estampar dos veces el mismo borrador produce PDFs distintos solo si cambia `firmadoAt`; el hash de lo guardado coincide con lo descargado.
6. SQL manual: `UPDATE firma_evento SET ip='x' LIMIT 1;` → error `append-only`; insertar segunda firma `activa` para el mismo profesional → `ER_DUP_ENTRY`; cambiar `pdf_sha256` de un documento firmado → error `inmutable`.
7. Concurrencia: 20 `registrarEvento` en paralelo → secuencias 1..20 sin huecos y cadena válida.
8. `limitador.test.mjs`: 15 tareas a la vez con `FIRMA_CONCURRENCIA=2` → nunca más de 2
   activas; la tarea 13 en adelante recibe `503 servicioOcupado`.
9. `proteccion.test.mjs`: PDF de 11 MB → `413`; PDF de 41 páginas → `413`; PNG de 5000×5000 → `pngInvalido`.
10. Firma con R2 caído (simular que `subirArchivo` falla) → `503`, documento sigue en
    `pendiente_firma`, ninguna conexión del pool queda tomada (`pool.pool._freeConnections.length === 5`).
11. Dos `firmarDocumento` simultáneos del mismo documento → uno `200`, el otro
    `409 documentoYaFirmado`, y en R2 queda un solo PDF referenciado.
12. Durante 10 firmas seguidas, `GET` a una ruta de agenda responde en menos de 500 ms.

---

## 11. Despliegue en desarrollo (lo ejecuta el cliente)

1. `mysqldump` de respaldo.
2. `npm i pdf-lib sharp qrcode uuid`.
3. Ejecutar `migraciones/2026-10-23_firma_electronica.sql` y luego el seed.
4. `.env`: `FIRMA_HMAC_CLAVE` (`openssl rand -base64 48`), `FIRMA_HMAC_VERSION=1`,
   `URL_PUBLICA_SITIO=https://desarrollo.agendaclinicas.cl`.
   **Guardar la clave HMAC fuera del servidor** (gestor de secretos): sin ella no se
   puede probar la integridad de la cadena.
5. Reiniciar el backend; verificar el log sin `[FIRMA] … no configurada`.
6. `node scripts/verificar_cadena_firma.mjs` → "Cadena íntegra (0 eventos)".
7. En Clerk (dashboard de la instancia): confirmar contraseña y/o código por correo habilitados.
8. **CORS del bucket R2** (Cloudflare → R2 → bucket → Settings → CORS policy), necesario
   para las descargas con URL firmada:
   ```json
   [{ "AllowedOrigins": ["https://desarrollo.agendaclinicas.cl", "http://localhost:3000"],
      "AllowedMethods": ["GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 600 }]
   ```
   En producción, un origen por dominio de clínica. Nunca `"*"`.
9. `.env`: `FIRMA_HABILITADA=1`, `FIRMA_CONCURRENCIA=2`.
10. pm2: `max_memory_restart` y `kill_timeout` (§9.5); cron de los scripts de §9.6.
11. Probar los casos 8 a 12 de §10 antes de activar `NEXT_PUBLIC_FIRMA_HABILITADA` en el front.

---

## 12. Decisiones abiertas

| # | Pregunta | Propuesta |
|---|---|---|
| B1 | ¿Quitar `GRANT ALL` al usuario de la app en producción (§3.4)? | Sí, en ventana de mantenimiento |
| B2 | ¿Bucket R2 separado para documentos firmados? | Mismo bucket, prefijo `privado/`; bucket aparte si hay presupuesto |
| B3 | Textos legales definitivos (acta, política de privacidad, derechos y deberes) | El cliente los valida con asesor legal; los seeds son borradores |
| B4 | ¿Sincronizar `perfilProfesional.registro_sis` con `profesionales.registro_sis_numero`? | No; `perfilProfesional` queda como está y la fuente única es `profesionales` |
| B5 | Proteger con token las rutas de escritura existentes antes del 1-dic | Sí (deuda C1 de `02`) |
| B6 | Recetas | Fuera de la FES por diseño (ENUM sin receta). Reevaluar solo con un prestador de FEA acreditado |
| B7 | ¿Respaldo externo periódico del último `hash_evento` (anclaje)? | Recomendado: enviar diariamente el último hash por correo a una casilla de NativeCode o guardarlo en otro bucket; endurece la prueba ante un atacante con acceso total a la BD |
