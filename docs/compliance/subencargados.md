# Subencargados y terceros con flujo de datos personales

Insumo para la lista de subencargados exigida por la Ley 21.719. Detectado por código/config del
workspace (26-10-2026). **Contratos/DPA: NO VERIFICABLE EN REPO** para todos — ver hallazgo F-13 y
Preguntas Abiertas del informe principal.

| Servicio | Qué recibe | ¿Puede recibir datos clínicos? | Evidencia | Transferencia |
|----------|-----------|-------------------------------|-----------|---------------|
| **Clerk** (autenticación) | Cuentas del dashboard: email, nombre, `publicMetadata` (rol, idProfesionalAgenda); JWT de sesión. NO datos de pacientes. | No (por diseño; los flujos de pacientes anónimos no pasan por Clerk) | `front/package.json` (`@clerk/nextjs`); `backend/middleware/exigirSesionClerk.js`; `verificarUsuarioClerk.js` (~50 instancias) | EE.UU. |
| **Twilio — WhatsApp/SMS** | Teléfono, nombre, apellido del paciente, fecha/hora/clínica de la cita (plantillas con `contentVariables`) | No en plantillas; el hecho de "tiene cita en la clínica X el día Y" es dato de salud indirecto — evaluar con legal | `backend/services/notificacionWhatsApp.js:53-81`; `backend/.env` (`TWILIO_*`) | EE.UU. |
| **Twilio Video** (telemedicina) | Audio y video EN VIVO de la consulta (salas `group`, `maxParticipants: 2`, **sin grabación**: `recordParticipantsOnConnect: false`) | **SÍ — tránsito de la consulta** (rojo: requiere DPA específico de salud y confirmar región de la sala; el código no fija `Region`) | `backend/services/telemedicina.js:7-33` | EE.UU. (región NO VERIFICABLE) |
| **Brevo** (correo transaccional) | Correo y nombre del destinatario; asunto/cuerpo (recordatorios de cita con fecha/hora, comprobantes, seguimiento) | El cuerpo de recordatorios revela la existencia de la cita | `backend/services/correoActualizacionProfesional.js:40-76` (`api.brevo.com/v3/smtp/email`); `backend/.env` (`BREVO_API_KEY`) | Francia/UE |
| **Mercado Pago** (pagos) | Comprador de tienda: email, identificación para la preferencia; tarjeta la maneja MP directamente (la política lo declara así) | No clínico | `backend/view/mercadoPagoRoutes.js`; `backend/model/PedidoCompras.js:41` (`preference_id`); `textosLegales.js:31-33` | Chile/LatAm |
| **Cloudflare Images** | Imágenes de publicaciones/portada/productos (contenido público de la clínica; hash de cuenta público) | No (verificar que nunca se suban imágenes de pacientes aquí) | `front/src/lib/cloudflare.js`; `front/next.config.mjs` (remotePattern); `backend/.env` (`API_TOKEN_CLOUDFLARE`) | Global (CDN) |
| **Cloudflare R2** (archivos de pacientes) | **Archivos del paciente** (exámenes, documentos) vía `archivoPaciente` con URLs firmadas de 1 h | **SÍ — documento clínico completo** (rojo: confirmar región/jurisdicción del bucket y DPA) | `backend/services/r2Storage.js:7-14,50-55`; `backend/model/ArchivoPaciente.js:21-27` | NO VERIFICABLE (sin location hint en código) |
| **Meta / WhatsApp** (`wa.me`) | Mensaje PRE-RELLENADO de soporte: nombre, correo, empresa, perfil, pantalla; y el flujo de WhatsApp-business va por Twilio (arriba) | No clínico | `front/src/lib/soporteWhatsapp.js:13-33`; `front/package.json` (`react-floating-whatsapp`) | EE.UU./Irlanda |
| **Google — YouTube** (embeds) | IP/datos del visor del video tutorial; se carga el iframe de youtube.com (no `youtube-nocookie`) | No clínico (pantallas internas y públicas) | `front/src/Componentes/VideoTutorial.jsx`; `front/src/app/dashboard/datosEmpresa/page.jsx:356` | EE.UU. |
| **Google — Maps** (embed) | IP/datos del visor del mapa en el sitio público | No clínico | `front/src/app/(paginaPublica)/page.jsx` (iframe `google.com/maps`) | EE.UU. |
| **NativeCode Finance** (interno, casa matriz) | Métricas AGREGADAS de uso por instancia: conteos de reservas/fichas/pacientes, % asistencia, días sin actividad + log de ingresos (clerk_id, email, IP, 1/hora). Sin contenido clínico. | No (agregados; verificar que nunca se amplíe) | `backend/controller/HealthMetricsController.js:14-75`; `backend/view/healthMetricsRoutes.js:9` (`verificarApiKey`) | Misma empresa (definir rol: subencargado o co-responsable interno) |
| **web-push (VAPID)** — autoalojado | Suscripciones push del navegador del personal; no es un tercero | No | `backend/services/pushService.js:1-26` | — (autoalojado) |

## Hallazgos asociados

1. **Ningún SDK de analítica de producto** (GA, Posthog, Mixpanel, Hotjar, Sentry) existe en
   `front/package.json` — buen punto de partida: no hay fuga clínica a analítica.
2. **Los dos flujos que SÍ tocan datos de salud con terceros** son Twilio Video (consulta en vivo)
   y Cloudflare R2 (archivos de pacientes). Ambos requieren DPA firmado y confirmación de región
   antes del 1-dic-2026 (hallazgo F-13, Ola 2 ítem 5).
3. **YouTube**: los embeds usan `youtube.com/embed` en vez de `youtube-nocookie.com` — cambio de
   una línea para reducir cookies de tercero en pantallas públicas.
4. La política pública ya declara el modelo responsable(clínica)↔encargado(NativeCode)
   (`front/src/lib/consentimientos/textosLegales.js:23-25`); falta el espejo contractual con cada
   subencargado de esta lista.
