# Gap analysis técnico — Ley 21.719 (protección de datos personales, Chile)

**Fecha:** 26-10-2026 · **Vigencia de la ley:** 1-dic-2026 · **Alcance:** auditoría de solo lectura.

**Delimitación de alcance.** El repositorio auditado (`front/`) contiene la aplicación Next.js y un
stub de backend (`front/backend/view/productoRoutes.js`, 1 archivo). El backend real de la
plataforma vive en el directorio hermano del workspace (`backend/`, repositorio git separado), del
que esta aplicación depende para todo el tratamiento de datos. Sin él, los ejes 1, 3, 4, 5, 7, 8,
9 y 13 serían "no verificables". Decisión operativa de esta auditoría: **el ámbito primario es
este repo; el backend hermano se audita como alcance secundario explícitamente rotulado**, con
rutas `backend/…` en las evidencias. Todos los caminos son relativos a la carpeta del workspace
`Desarrollo/`. Si se desea el informe restringido a `front/` únicamente, las filas con evidencia
`backend/…` deben releerse como "no verificable en este repo".

**Rol asumido (a confirmar en contratos, ver F):** NativeCode = ENCARGADO del tratamiento de los
datos de pacientes de cada clínica cliente; RESPONSABLE de sus propios datos (cuentas de usuarios
del dashboard en Clerk, métricas de uso). El propio texto legal de la plataforma ya declara este
reparto: `front/src/lib/consentimientos/textosLegales.js:23-25` ("la clínica es responsable y
NativeCode, encargado de tratamiento"). Donde se mezclan ambos tratamientos: la telemetría
`registro_accesos` alimentada por `backend/controller/HealthMetricsController.js:14` ("FUNCION QUE
ENTREGA LAS METRICAS DE USO A NATIVECODE FINANCE") trata datos de usuarios de las clínicas
(clerk_id, email, nombre, IP) con un fin propio del encargado — legítimo, pero exige contrato de
encargo e información en la política de privacidad.

---

## A) RESUMEN EJECUTIVO

La plataforma no está indefensa: hay autenticación real en las rutas clínicas, secretos fuera de
los repos, un diseño de consentimientos versionados con huella SHA-256, borrado lógico de pacientes
y fichas, y URLs firmadas para archivos. Pero a 5 semanas de la vigencia hay 6 brechas críticas:
(1) no se registra quién lee cada ficha clínica — lo exigen la Ley 21.719 y el Decreto 41 —, (2)
el backend autentica pero no autoriza: los perfiles por cargo solo se aplican en la pantalla, así
que cualquier usuario autenticado puede leer cualquier ficha llamando directo a la API, (3) el
router de pedidos de la tienda está abierto sin login y expone RUT, dirección y teléfono de
compradores, (4) la ficha clínica se edita con UPDATE destructivo sin historial — no se puede
demostrar la autenticidad de los cambios que exige la Ley 20.584 —, (5) no existe detección de
brechas ni runbook, y sin registro por ficha tampoco se podría notificar a los titulares afectados,
y (6) el backend de consentimientos que el formulario de reserva ya invoca no está desplegado: la
casilla se muestra pero la aceptación puede no quedar registrada. Ninguna de las seis exige
rediseño: son cambios acotados que caben antes del 1 de diciembre (ver Plan, sección E).

### Semáforo

| # | Eje | Estado |
|---|-----|--------|
| 1 | Inventario de datos | **PARCIAL** — no existía; se entrega insumo en `inventario-datos.csv`; `datosDinamicos` (JSON clínico) sin esquema |
| 2 | Base de licitud y consentimiento | **PARCIAL** — diseño front sólido; backend no desplegado; revocación anunciada sin flujo |
| 3 | Control de acceso | **PARCIAL** — autenticación sí, autorización por rol/recurso no; `/pedidos` abierto |
| 4 | Registro de accesos (audit log) | **NO CUMPLE** para lectura de ficha; existe log de ingreso (1 fila/hora, fines de métricas) |
| 5 | Integridad y trazabilidad de la ficha | **NO CUMPLE** — UPDATE destructivo, sin versionado ni histórico |
| 6 | Cifrado y secretos | **PARCIAL** — secretos bien guardados; sin HSTS/CSP/helmet; TLS y cifrado en reposo NO VERIFICABLE |
| 7 | Derechos del titular (ARCO + portabilidad) | **PARCIAL** — canal de correo manual declarado; sin portabilidad ni flujos operables |
| 8 | Retención y eliminación | **NO CUMPLE** — sin política de 15 años ni purga; soft delete nunca purga |
| 9 | Brechas de seguridad | **NO CUMPLE** — sin detección, alertamiento ni runbook; imposible acotar afectados hoy |
| 10 | Terceros y subencargados | **PARCIAL** — inventario hecho (ver `subencargados.md`); contratos/DPA NO VERIFICABLE |
| 11 | Transferencias internacionales | **NO VERIFICABLE** — servicios identificados (EE.UU./UE); región de hosting y backups desconocida |
| 12 | Minimización y fugas pasivas | **PARCIAL** — PII en query strings y logs; sin analítica de producto ✓ |
| 13 | Decisiones automatizadas e IA | **CUMPLE** — no hay IA ni scoring activos; declarado en la política; hay 1 API key de LLM muerta por eliminar |

---

## B) TABLA DE HALLAZGOS

Severidad: CRÍTICO = expone datos sensibles o impide una obligación legal. Esfuerzo: S (<1 día),
M (1-5 días), L (>1 semana).

| ID | Eje | Hallazgo | Evidencia | Severidad | Impacto legal | Remediación propuesta | Esfuerzo |
|----|-----|----------|-----------|-----------|---------------|----------------------|----------|
| F-01 | 4, 9 | **No se registra la lectura de fichas clínicas.** `registro_accesos` solo anota el ingreso a la plataforma, deduplicado 1 fila por usuario/hora y con fines de métricas de facturación; ninguna lectura de ficha escribe registro (quién, qué ficha, cuándo, IP). | `backend/controller/HealthMetricsController.js:40-75` (dedupe `INTERVAL 1 HOUR`, comentario "Un registro por usuario por hora"); `backend/view/healthMetricsRoutes.js:14`; `backend/view/fichaRoutes.js:6-13` (lecturas sin log) | **CRÍTICO** | Incumple art. sobre registro de tratamiento y Decreto 41 art. 9 (REG 1.1); impide notificar a titulares tras brecha | Tabla `registro_accesos_ficha` (id_ficha, usuario, IP, fecha, acción) + 1 `INSERT` en los 5 endpoints de lectura de `fichaRoutes`/`archivoPaciente`. Anexar consulta de auditoría al panel del cliente | M |
| F-02 | 3 | **Autorización solo en el frontend.** El gate del backend valida el JWT (autenticación) pero no el rol ni el vínculo profesional–paciente: cualquier sesión válida lee cualquier ficha por API directa. El propio roadmap lo declara: "Puerta, no permisos… roles… Fase 2". El RBAC granular (`front/src/lib/dashboard-access.js`, p. ej. administradores sin fichas por Ley 20.584 art. 13) es eludible con una llamada curl. | `backend/middleware/exigirSesionClerk.js:6-21` (solo `verifyToken`); `docs/roadmap-proteccion-y-auditoria-20-dias.md` regla 2; `front/src/lib/dashboard-access.js:13-15` | **CRÍTICO** | Acceso indebido a datos sensibles (art. 16 bis); principio de mínimo necesario | Reutilizar `verificarUsuarioClerk` (ya resuelve rol desde Clerk) + middleware `exigirRol(...)` en routers clínicos; en fichas, validar vínculo id_paciente↔agenda del profesional | L |
| F-03 | 3, 9 | **`/pedidos` montado sin gate y sin gate interno**: `GET /pedidos/seleccionarPedidos` vuelca todos los pedidos y `POST /pedidos/seleccionarPorComprador` busca por nombre — con nombre, RUT (`identificacion_comprador`), dirección, teléfono y email de compradores. | `backend/app.js:86` (`app.use("/pedidos", pedidosRoutes)` sin `exigirSesionClerk`); `backend/view/pedidosRoutes.js:5-11` (0 gates); `backend/model/PedidoCompras.js:41` | **CRÍTICO** | Exposición presente de datos personales a cualquiera en internet | `app.use("/pedidos", exigirSesionClerk, pedidosRoutes)` salvo el endpoint que use el flujo de pago público (verificar cuál) | S |
| F-04 | 5 | **UPDATE destructivo sobre la ficha clínica** sin versionado ni histórico: la fila se sobrescribe in situ (anamnesis, diagnóstico, indicaciones, `datosDinamicos`). No es demostrable la autenticidad del contenido ni de los cambios (Ley 20.584). El borrado de ficha es lógico (bien), pero sin retención asociada. | `backend/model/FichaClinica.js:72` (`UPDATE fichaClinica SET … WHERE id_ficha = ?`); soft delete en `:102` | **CRÍTICO** | Incumple autenticidad de cambios (20.584 art. 13) y trazabilidad | Tabla espejo `fichaClinica_historial` alimentada por trigger BEFORE UPDATE (el cambio más pequeño que da append-only sin tocar la app) | M |
| F-05 | 9 | **Sin detección, alertamiento ni runbook de brechas.** No hay monitoreo de accesos anómalos, alertas, ni documento de incidentes en ningún repo. Hoy no se puede responder "qué titulares y qué datos se expusieron" (depende de F-01). | Ausencia: no hay carpeta/servicio de monitoreo en `backend/` ni `front/`; única evidencia de log: `backend/server.log` (130 bytes, legacy, sin PII) | **CRÍTICO** | Impide notificar a la Agencia y a titulares "sin dilaciones indebidas" | Runbook v1 versionado (`docs/compliance/runbook-brechas.md`) + alerta por volumen anómalo de lecturas de ficha sobre el log de F-01 | S (runbook) / M (alertas) |
| F-06 | 2 | **Backend de consentimientos no desplegado.** El front ya invoca `/consentimientos/seleccionarVigentes` y `/consentimientos/registrarAceptacion`, pero `backend/app.js` no monta ningún router `/consentimientos`; con el interruptor apagado, la casilla se muestra y la aceptación NO se registra (`token_aceptacion: null`). El diseño (versión + SHA-256 + IP/fecha por el servidor) ya está hecho en el front. | `front/src/lib/consentimientos/apiConsentimientos.js:1-14, 55-58`; ausencia de mount en `backend/app.js:84-116`; textos legales v1 en `front/src/lib/consentimientos/textosLegales.js:16-27` | **CRÍTICO** | Base de la licitud sin evidencia para el tratamiento que sí requiere consentimiento | Implementar los 2 endpoints según el contrato ya documentado (`front/docs/firma/02-contrato-endpoints.md`) + activar `NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1` por instancia | M |
| F-07 | 3 | **CORS abierto con credenciales**: `origin: true` refleja cualquier origen y `credentials: true`. Cualquier sitio puede llamar a la API con cookies del usuario. | `backend/app.js:73-80` | ALTO | Facilita CSRF/exfiltración asistida | Whitelist `FRONT_URL` (+ dominios públicos de la instancia) en `corsConfig.origin` | S |
| F-08 | 9 | **Webhook de Mercado Pago sin validar firma** (`x-signature` nunca se verifica): cualquiera puede postear pagos falsos y alterar el estado de reservas. | `backend/view/mercadoPagoRoutes.js:16`; sin matches de `x-signature` en `backend/controller/MercadoPagoController.js` | ALTO | Integridad de pagos/estados; disputas con titular sobre cobros | Validar HMAC del header `x-signature` con el secret del webhook (guía oficial MP) | S |
| F-09 | 3 | **Tokens de confirmar/cancelar por enlace con secret de respaldo débil** (`"agenda-clinica-token-dev"`) y firma HMAC truncada a 22 chars; en una instancia sin las vars de entorno, los enlaces de WhatsApp/email son falsificables y el id de reserva va en base36 (enumerable). | `backend/services/notificacionReservaToken.js:3-9, 28-33` | ALTO | Manipulación de citas de terceros | Obligar `NOTIFICACION_TOKEN_SECRET` (fallar cerrado como ya hace `verificarApiKey`); HMAC completo + aleatorización del id | S |
| F-10 | 7 | **Derechos ARCO sin flujos operables.** Acceso y rectificación existen de facto (la app muestra/edita la ficha), supresión = soft delete sin purga; no hay portabilidad (export solo de reservas a XLSX, no de la ficha); la oposición a decisiones automatizadas no aplica hoy. Existe canal manual: email de contacto declarado en la página pública. | `front/src/app/(public)/terminosCondiciones/page.jsx:54-58`; `front/src/app/dashboard/page.jsx` (`exportarAExcel`); sin endpoint de export de ficha en `backend/view/fichaRoutes.js` | ALTO | Obligación de responder solicitudes en plazo; portabilidad expresa | Endpoint `GET /ficha/exportar/{id_paciente}` (JSON estructurado de ficha+recetas+archivos) reutilizando los SELECT existentes | M |
| F-11 | 8 | **Sin política de retención implementada.** No hay job de retención de fichas (15 años) ni de purga de soft-deletes; la única limpieza es de notificaciones in-app. Backups: NO VERIFICABLE. | `backend/app.js:170-190` (CRONs de recordatorios y limpieza de notificaciones); sin jobs de retención en `backend/scripts/` | ALTO | Conservación mínima sin política de eliminación posterior | Definir política (decisión legal: plazo y destino final) + job anual de archivado/purga sobre `estado_paciente=0`/`estadoFicha=0` con log | M (+decisión legal) |
| F-12 | 6 | **Cabeceras y hardening incompletos.** Front: sin HSTS ni CSP (`front/next.config.mjs:10-30`). Backend: sin helmet, sin rate limit, sin redirección HTTPS (¿proxy? NO VERIFICABLE). Pool MySQL sin `ssl`. | `front/next.config.mjs:10-30`; `backend/app.js:66-80`; `backend/config/Database.js:8-13` | ALTO | Transporte y superficie de ataque | Añadir HSTS+CSP en `next.config.mjs`; `helmet` + `express-rate-limit` en app.js; confirmar TLS del proxy (F) | S-M |
| F-13 | 10, 11 | **Contratos de subencargados no evidenciables en el repo** (Clerk, Brevo, Twilio, Mercado Pago, Cloudflare, Meta/WhatsApp, Google, NativeCode Finance). La relación encargado↔responsable sí está redactada en la política. Requiere decisión de negocio/legal. | `front/src/lib/consentimientos/textosLegales.js:23-25`; lista completa en `subencargados.md` | ALTO | Art. sobre encargados: contratos escritos e instrucciones | Firmar/actualizar DPA con cada uno; registrarlos en el Registro de Actividades (insumo: `inventario-datos.csv`) | L (documental) |
| F-14 | 3 | **Autorización delegada al cliente cuando el token no trae rol** (middleware deja pasar) y **flag de bypass versionado** (`BYPASS_DASHBOARD_AUTH`) — residual de desarrollo. | `front/src/middleware.ts:10-11, 37-41` | ALTO | Acceso no autorizado si la instancia Clerk no tiene la plantilla de sesión | Completar verificación server-side (F-02 lo absorbe); eliminar el flag | S (flag) |
| F-15 | 12 | **PII en query strings**: el calendario recibe nombre, apellido, RUT, teléfono y email del paciente por URL (queda en historial, proxies y logs de acceso). | `front/src/app/dashboard/calendario/page.jsx:345-349` | MEDIO | Fuga pasiva en logs de terceros | Pasar el prefill a estado de sesión (sessionStorage) o POST | S |
| F-16 | 12 | **Logs con PII**: controllers del backend imprimen `req.body` completo (datos del paciente) y el front loguea payloads de actualización. | `backend/controller/FichaClinicaController.js:165`; `backend/controller/PacienteController.js:224`; `front/src/app/dashboard/FichasPacientes/[id_paciente]/page.jsx:569`; 164 `console.*` en `front/src` | MEDIO | Fuga pasiva a logs; base de incidentes | Eliminar/depurar los `console.log(req.body)` y loguear solo ids/no-PII | S |
| F-17 | 12 | **Importación masiva de pacientes desde un XLSX del escritorio de un desarrollador** (`/Users/nicolas/Desktop/htM6TatHpa_base_de_pacientes_1.xlsx`): proceso fuera de pipeline, sin control de datos de prueba vs reales. El archivo no está en el repo (verificado). | `backend/scripts/importar_pacientes_desde_excel.mjs:4` | MEDIO | Tratamiento sin salvaguardas; riesgo de datos reales en entornos de desarrollo | Mover la importación a un proceso documentado con anonimización para staging | S |
| F-18 | 6 | **`OPENAI_API_KEY` almacenada sin uso** (0 referencias en el código). Credencial muerta con acceso facturable. | `backend/.env` (nombre de variable; valor no leído); 0 matches de `openai|gpt` en `backend/{controller,model,services,view}` | MEDIO | Superficie de fuga innecesaria | Revocar/eliminar la variable (o documentar el uso previsto) | S |
| F-19 | 1, 5 | **Campos nuevos sin persistencia**: el front envía `prevision` y `comentario` de la reserva, sin columnas en BD (migración pendiente documentada). Mientras tanto, datos que el titular cree registrados no se guardan. | `front/src/app/dashboard/calendario/page.jsx` (guía de migración, bloque PASO 1-4); `backend/model/ReservaPacientes.js:295,471` (INSERT sin esos campos) | MEDIO | Brecha entre expectativa del titular y tratamiento real | Ejecutar la migración documentada + mapear en los INSERT | M |
| F-20 | 4 | **`registro_accesos` es mutable y no consultable**: vive en la misma MySQL de la app, sin append-only, sin UI de consulta para el cliente prestador (el Decreto 41 exige ponerlo a disposición). | `backend/controller/HealthMetricsController.js:40-75`; sin endpoints de consulta en `backend/view/healthMetricsRoutes.js` | MEDIO | Valor probatorio del log; obligación de acceso del cliente | Vista append-only + endpoint de consulta por ficha/usuario para el admin de la clínica (después de F-01) | M |
| F-21 | 6 | **Comparación de API key no timing-safe** y dos claves distintas para el mismo fin (`TEST_API_KEY` en `app.js` vs `HEALTH_METRICS_API_KEY` en el middleware). | `backend/middleware/verificarApiKey.js:21`; `backend/app.js:120, 139` | BAJO | Endurecimiento | `crypto.timingSafeEqual`; unificar variable | S |
| F-22 | 12 | **`server.log` legacy en la raíz del backend** (130 bytes, sin RUTs detectados) sin política de logging. | `backend/server.log` | BAJO | Higiene | Definir logging estructurado sin PII + gitignore de logs | S |
| F-23 | 9 | **Sin rate limiting en endpoints públicos de reserva** (`/reservaPacientes/validar`, `/insertarReservaPaciente`, alta de pedidos): permite enumeración/abuso automatizado. | `backend/view/reservaPacienteRoutes.js:6-8`; `backend/app.js:66-80` | BAJO | Abuso, spam de reservas | `express-rate-limit` global + específico en públicos | S |
| F-24 | 3 | **Endpoint público de profesionales devuelve datos de contacto** (alcance exacto de campos por verificar en el controller): expuesto por diseño para el formulario de reserva. | `backend/view/profesionalesRoutes.js:9-10` | BAJO | Minimización | Proyectar solo nombre/especialidad/descripción en la variante pública | S |

**Lo que sí cumple (para el balance, no es exhaustivo):** gate de autenticación Clerk en los
routers clínicos con excepciones documentadas (`backend/view/reservaPacientesRoutes.js:5-14`,
`docs/auditoria/rutas-clasificacion.md`); el escape crítico `GET /persistence/obtenerTOKEN` que su
propia auditoría detectó ya está cerrado (`backend/view/mercadoPagoPersistenceRoutes.js:13,22`);
`.env` fuera de ambos repos y sin historial (`git ls-files` = 0 en backend; primer commit de front
solo agregó `.env.example`); RBAC front granular por cargo/especialidad con administradores sin
acceso a fichas (`front/src/lib/dashboard-access.js:13-15`); consentimientos versionados con
SHA-256 e IP/fecha fijadas por el servidor en el diseño; firma electrónica con revocación y
reverificación step-up (`front/src/Componentes/firma/SeccionFirmaElectronica.jsx:39-142`);
archivos de pacientes con URLs firmadas a 1 hora (`backend/services/r2Storage.js:50-55`); salas de
telemedicina sin grabación (`backend/services/telemedicina.js:30`); notificaciones push
self-hosted con VAPID (`backend/services/pushService.js`); sin SDKs de analítica de producto en
`front/package.json`; borrado lógico de pacientes y fichas (`backend/model/Pacientes.js:214`,
`FichaClinica.js:102`).

---

## E) PLAN EN 3 OLAS

> Criterio de la Ola 1: solo lo que evita infracción inmediata o exposición presente, con el
> cambio más pequeño posible. "Listo" debe poder verificarse con un curl o un log.

### Ola 1 — antes del 1-dic-2026 (evitar infracción/exposición)

| # | Qué | Archivos | Listo cuando |
|---|-----|----------|--------------|
| 1 | Cerrar `/pedidos` tras el gate (F-03) | `backend/app.js:86`, `backend/view/pedidosRoutes.js` | `curl` sin token a `/pedidos/seleccionarPedidos` responde 401; el flujo de pago público sigue operando (verificar cuál endpoint usa el sitio) |
| 2 | Desplegar backend de consentimientos y activarlo por instancia (F-06) | `backend/view/` (router nuevo), `backend/app.js` (mount), migración de tablas según `front/docs/firma/03-backend-y-tablas.md`; env por instancia | Reserva de prueba deja fila de aceptación con versión+SHA-256+IP y `token_aceptacion` no nulo |
| 3 | Registro por lectura de ficha (F-01) | `backend/model/` (tabla `registro_accesos_ficha`), `backend/view/fichaRoutes.js`, `archivoPacienteRoutes.js` | Cada GET/POST de lectura deja fila con usuario, ficha, IP, fecha; una consulta SQL responde "quién vio la ficha X" |
| 4 | Validar firma del webhook de Mercado Pago (F-08) | `backend/controller/MercadoPagoController.js` | Webhook sin firma válida responde 401; un pago real de prueba procesa |
| 5 | CORS whitelist (F-07) | `backend/app.js:73-80` | Request con `Origin:` ajeno no recibe `Access-Control-Allow-Origin` |
| 6 | Quitar secret de respaldo de tokens de notificación (F-09) | `backend/services/notificacionReservaToken.js:3-9` | El servicio falla cerrado sin `NOTIFICACION_TOKEN_SECRET`; enlaces de prueba siguen funcionando |
| 7 | Sacar PII de logs (F-16, parcial) y quitar flag `BYPASS_DASHBOARD_AUTH` (F-14) | `backend/controller/FichaClinicaController.js:165`, `PacienteController.js:224`, `front/src/middleware.ts:10-11`, `front …/FichasPacientes/[id_paciente]/page.jsx:569` | 0 `console.log(req.body)` en controllers; flag eliminado del repo |
| 8 | Runbook de brechas v1 + HSTS/CSP + eliminar `OPENAI_API_KEY` muerta (F-05, F-12, F-18) | `front/docs/compliance/runbook-brechas.md` (nuevo), `front/next.config.mjs`, `backend/.env` | Runbook revisado por el equipo; headers visibles con curl -I; variable fuera del .env |
| 9 | Ejecutar la migración de `prevision`/`comentario` (F-19) | BD + `backend/model/ReservaPacientes.js` + controllers | Reserva guarda y devuelve ambos campos (el SQL ya está documentado en el front) |

### Ola 2 — 90 días (obligaciones operables)

| # | Qué | Archivos | Listo cuando |
|---|-----|----------|--------------|
| 1 | Autorización por rol en backend (F-02, F-14): middleware `exigirRol` con el rol de `verificarUsuarioClerk`, y validación profesional↔paciente en fichas | `backend/middleware/`, routers clínicos | Un token de recepción recibe 403 en `/ficha/*`; pruebas automatizadas por perfil |
| 2 | Versionado de ficha (F-04): trigger `fichaClinica_historial` | SQL + `backend/model/FichaClinica.js` | Todo UPDATE deja copia previa con autor/fecha; diff consultable |
| 3 | Portabilidad ARCO (F-10): export JSON de ficha+recetas+archivos | `backend/view/fichaRoutes.js`, controller | Endpoint entrega paquete legible por máquina del titular X |
| 4 | Consulta del log de accesos para el cliente (F-20) + alerta de volumen anómalo (F-05) | `backend/view/healthMetricsRoutes.js`, panel admin | El admin ve "quién accedió a la ficha X"; alerta dispara al 5× baseline |
| 5 | Contratos/DPA con los 8 subencargados + Registro de Actividades firmado (F-13) — **decisión legal/negocio** | `subencargados.md` → contratos externos | DPA firmados o en revisión legal; registro publicado internamente |
| 6 | Política de retención (F-11) — **decisión legal** (plazo y destino) + job de archivado | `backend/scripts/` | Job anual en seco (dry-run) con reporte; política documentada |
| 7 | PII fuera de URLs (F-15) y rate limiting público (F-23) | `front/src/app/dashboard/calendario/page.jsx`, `backend/app.js` | Logs de access log sin RUTs; límites activos con prueba de carga |
| 8 | Importador de pacientes con pipeline y anonimización para staging (F-17) | `backend/scripts/importar_pacientes_desde_excel.mjs` | Staging solo contiene datos sintéticos verificables |

### Ola 3 — deuda estructural

- Cifrado en reposo verificable de la BD y de R2 (configuración de nube, no código) y evaluación
  de cifrado a nivel de columna para `datosDinamicos`/diagnósticos.
- Log inmutable (WORM/escalado a almacén append-only) y retención del propio log.
- Break-glass formal: acceso de soporte NativeCode a instancias de clientes con autorización y
  registro por incidente (hoy el rol `tecnico-nativecode` tiene acceso total —
  `front/src/lib/dashboard-access.js:17`).
- Revisión de arquitectura multi-tenant: confirmar y documentar aislamiento entre las ~50
  instancias de clientes (`backend/middleware/verificarUsuarioClerk.js:14-18`).
- Pentest externo sobre los endpoints públicos (reserva, pagos, confirmación por token).
- Template de sesión de Clerk con rol embebido para eliminar la dependencia del guard de cliente.

---

## F) PREGUNTAS ABIERTAS (requieren una persona, no el repo)

1. **Hosting y región**: ¿dónde corre el backend (proveedor y región) y dónde la base MySQL?
   Necesito: cuenta/proveedor de nube y región del deploy y de la BD. (Eje 11; `backend/.env`
   tiene `DB_HOST`/`BACKEND_URL`, pero leí solo nombres, no valores.)
2. **Modelo multi-tenant**: ¿un despliegue por clínica (~50 instancias Clerk mencionadas en
   `backend/middleware/verificarUsuarioClerk.js`) con BD por instancia, o BD compartida? Determina
   la gravedad real de F-02/F-03.
3. **Backups**: proveedor, región, retención y quién puede restaurar (MySQL y R2). Eje 8/11.
4. **TLS en producción**: ¿quién termina HTTPS (proxy/nube)? ¿HSTS activo? `NEXT_PUBLIC_API_URL`
   en el `.env` local es `http://localhost:3010` (desarrollo).
5. **Contratos**: ¿existen DPA/contratos de encargo con Clerk, Brevo, Twilio, Mercado Pago,
   Cloudflare y Meta? ¿Hay contrato responsable↔encargado con cada clínica? (F-13; decisión
   legal.)
6. **Twilio Video**: ¿región de las salas (el código no fija `Region`/`Geometry`) y DPA/BAA de
   Twilio para video de consultas? El código desactiva grabación
   (`backend/services/telemedicina.js:30`), pero falta confirmar retención del lado Twilio.
7. **Consentimientos en producción**: ¿algún cliente ya tiene
   `NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1`? Determina si F-06 ya está materializado o solo es
   riesgo de despliegue.
8. **Procesos manuales de derechos**: ¿quién responde hoy las solicitudes ARCO que llegan al
   email de privacidad y en qué plazo? (`front/src/app/(public)/terminosCondiciones/page.jsx:58`.)
9. **Endpoint público de profesionales**: confirmar qué campos devuelve
   `GET /profesionales/seleccionarTodosProfesionales` (F-24) — el SELECT exacto no quedó
   identificado en `backend/model/Profesionales.js`.
10. **Mercado Pago**: ¿el webhook tiene configurado el secret para validar `x-signature`? (F-08.)
11. **Datos en entornos no productivos**: ¿staging/desarrollo compartidos usan copias reales de la
    BD? El script de import (F-17) sugiere que sí ha ocurrido.
12. **Claves `R` sin nombre en `backend/.env`**: hay 4 líneas que no calzan con `^[A-Z_]+`;
    verificar qué son (posibles valores multilínea) y si alguna es credencial.

---

*Auditoría realizada el 26-10-2026 sobre el estado actual del código (sin modificar nada).
Las referencias `front/…` corresponden a este repositorio; `backend/…` al repositorio hermano del
workspace, auditado como alcance secundario declarado en el encabezado.*
