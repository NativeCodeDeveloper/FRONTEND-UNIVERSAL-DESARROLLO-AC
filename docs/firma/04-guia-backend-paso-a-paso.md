# 04 · Guía del backend paso a paso

Implementación del backend de la firma electrónica y los consentimientos, ordenada
**de lo más fácil a lo más difícil**. Cada fase deja algo que funciona por sí solo
y se puede activar sin esperar a las siguientes.

- **El código ya está escrito y probado.** Está en `docs/firma/backend/` (copia en
  `~/Desktop/firma-fes/backend/`), con la misma estructura de carpetas que tu backend
  `BACKEND-DESARROLLO-UNIVERSAL-AC`. Los archivos **nuevos** se copian tal cual. En los
  archivos **existentes** esta guía te dice qué línea buscar y qué agregar.
- **Se probó contra tu dump** `AGENDA_CLINICA_DESARROLLO-2.sql` en MySQL 9.6, con
  el servidor real (`app.js`) y 42 comprobaciones de punta a punta: política de
  privacidad, reserva con token, verificación pública, firma, registro SIS, documentos,
  OTP, descargas, correo, anulación, dos firmas simultáneas, procedimientos del
  consentimiento y alteración de la evidencia.
  Lo único simulado fue R2, Clerk, Brevo y Twilio (no hay credenciales en la prueba).
- Documentos de referencia: `02-contrato-endpoints.md` (qué recibe y responde cada
  endpoint) y `03-backend-y-tablas.md` (tablas, reglas y cumplimiento legal).

| Fase | Qué queda funcionando | Dificultad | Se activa en el front con |
|---|---|---|---|
| **A** | **Previsión y comentario de la reserva + estadística por previsión en Finanzas** (requerimiento 28-10-2026, ya implementado en la rama `feat/prevision-reserva`) | Muy fácil | (automático) |
| **B** | **Página pública: pulir el aporte de Nicolás (navbar, portada, datos) y categorías de atención en la reserva** (01-11-2026; front listo, falta 1 columna en el backend) | Fácil | (automático) |
| 0 | Rama, respaldo, dependencias y variables | Muy fácil | — |
| 1 | Tablas nuevas y textos legales en la base | Fácil | — |
| 2 | **Política de privacidad en la reserva pública** (una casilla), con constancia en PDF | Fácil | `NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1` |
| 2b | **Procedimientos del consentimiento informado** (la clínica crea los suyos). Se despliega junto con la 2 | Fácil | (el mismo interruptor) |
| 3 | Verificación pública (`/verificar/CODIGO`, destino del QR) | Fácil | (automático) |
| 4 | N° de registro SIS, foto del profesional y listado sin datos privados | Media | (automático) |
| 5 | Sesión de Clerk obligatoria y reverificación | Media | — |
| 6 | Firma (grafía) del profesional | Media | parte de la fase 7 |
| 7 | Documentos firmados: cotización, presupuesto, orden de exámenes, ficha clínica y consentimiento informado con código OTP | Alta | `NEXT_PUBLIC_FIRMA_HABILITADA=1` |
| 8 | Operación: tareas programadas, pm2, monitoreo e interruptor | Media | — |

> **Las recetas no pasan por el backend de firma** (se imprimen para firmar a mano).
> Los otros 5 documentos sí llevan firma electrónica.

---

## Fase A · Previsión y comentario de la reserva (primera integración)

Requerimiento del 28-10-2026, plazo viernes 30-10-2026. Es la integración más
fácil y **ya está hecha** en la rama `feat/prevision-reserva` de ambos repos: aquí
queda qué se cambió, cómo aplicarlo y cómo comprobarlo. No depende de la firma.

**Qué hace**

- Cada reserva guarda **previsión** y **comentario**, ambos opcionales. Vacíos o
  ausentes se guardan como `No indicado`.
- La previsión solo acepta el catálogo de `src/lib/previsiones.js` (FONASA, ISAPRE,
  CONVENIO, SIN PREVISION, CAPREDENA, DIPRECA, **PARTICULAR**). Cualquier otro valor →
  `400 prevision-invalida`. "Particular" (id 7) también queda disponible en las fichas.
- El paciente puede indicar su previsión en la **página pública**
  (`/agendaEspecificaProfersional/[id]`, paso "Tus datos", opcional). Viaja igual por
  la reserva directa y por el pago con **Mercado Pago** (se guarda al crear la orden,
  y se valida antes de crear la preferencia de pago).
- El comentario se limpia (sin saltos de línea ni caracteres de control) y no puede
  pasar de 100 caracteres → si no, `400 comentario-invalido`. Nada se corrige en silencio.
- Finanzas muestra **Reservas por previsión**: cantidad y porcentaje por previsión,
  calculados en la base con `GROUP BY`, con el mismo filtro de período del panel y
  el mismo universo del total de reservas (`estadoPeticion = 1`). Los porcentajes
  siempre suman exactamente 100 % (método del mayor resto).

**Archivos del backend**

| Archivo | Cambio |
|---|---|
| `migraciones/2026-10-28_prevision_comentario_reserva.sql` | **Nuevo.** 2 columnas `NOT NULL DEFAULT 'No indicado'` + índice. Aditiva, trae reversión. |
| `services/camposReserva.js` | **Nuevo.** Reglas puras: catálogo, limpieza, límite, fechas civiles y porcentajes. |
| `model/ReservaPacientes.js` | INSERT y UPDATE con los 2 campos; `actualizarComentario`; `contarReservasPorPrevision`. |
| `controller/ReservaPacienteController.js` | Valida antes de guardar; 2 controladores nuevos; errores 400 claros. |
| `controller/MercadoPagoController.js` | `create-order` valida y guarda previsión/comentario en la reserva pendiente de pago. |
| `view/reservaPacienteRoutes.js` | 2 rutas nuevas **después** del gate de Clerk. |
| `middleware/exigirSesionClerk.js` | Guarda la sesión verificada en `req.sesionClerk` para la bitácora. |
| `pruebas/reservas/camposReserva.test.mjs` | **Nuevo.** 13 pruebas (`npm run test:reservas`). |
| `.gitignore` | `!migraciones/*.sql`: las migraciones se versionan (adelanta el paso 0.4). |

**Endpoints**

| Ruta | Sesión | Recibe | Responde |
|---|---|---|---|
| `POST /reservaPacientes/insertar`, `/insertarReservasMultiples`, `/insertarReservaPacienteFicha` | (como antes) | además `prevision?`, `comentario?` | igual que antes |
| `POST /reservaPacientes/actualizarReservacion` | Clerk | además `prevision?`, `comentario?` | igual. **Si el campo no viene, se conserva lo guardado** (el calendario general no los envía). |
| `POST /reservaPacientes/actualizarComentario` | Clerk | `{ id_reserva, comentario }` | `{ message: true, comentario }` · 400 · 404 |
| `POST /reservaPacientes/estadisticaPorPrevision` | Clerk | `{ fechaInicio, fechaFinalizacion }` (`AAAA-MM-DD`) | `{ total, distribucion: [{ prevision, cantidad, porcentaje }] }` |

Las consultas existentes (`SELECT *` / `reservaPacientes.*`) ya devuelven los dos campos
sin cambios. `POST /pagosMercadoPago/create-order` también acepta `prevision?`.

**Seguridad y auditoría**

- Todo con consultas parametrizadas; la previsión es lista blanca; el comentario
  pasa por límite real de caracteres (igual que `VARCHAR(100)`).
- Las 2 rutas nuevas exigen sesión de Clerk (quedan bajo `router.use(exigirSesionClerk)`).
- Editar un comentario deja en el log `[AUDITORIA] reserva.comentario.actualizado`
  con `id_reserva`, usuario de Clerk y fecha. **El texto no se registra**: puede
  contener datos de salud.

### A.1 Aplicar

```bash
cd ~/NativeCode_Proyectos/Back_Proyect/BACKEND-DESARROLLO-UNIVERSAL-AC
git checkout feat/prevision-reserva
mysqldump -u <usuario> -p AGENDA_CLINICA_DESARROLLO reservaPacientes > ~/respaldo-reservas-$(date +%F).sql
mysql -u <usuario> -p AGENDA_CLINICA_DESARROLLO < migraciones/2026-10-28_prevision_comentario_reserva.sql
npm run test:reservas        # 13/13
pm2 restart <backend>        # o reiniciar node app.js
```

Si la base no tiene `reservaPacientes.fechaExpiracionPago` (la usa el pago con Mercado
Pago desde agosto), aplicar también `migraciones/2026-10-29_fecha_expiracion_pago.sql`:
sin ella el pago no crea la reserva y el cron de expiración falla cada minuto.

**Aplicado en el servidor de desarrollo el 29-10-2026** (rama `feat/prevision-reserva`,
ambas migraciones, con respaldo previo en `/root/respaldos/`).

El orden importa: **primero la migración, después el código**. Con el código nuevo y
sin las columnas, los INSERT fallan.

### A.2 Comprobar

1. Agendar desde el calendario con previsión y comentario → la reserva los muestra al editarla.
2. Agendar sin completarlos → en el Panel de Reservaciones se ven "NO INDICADA" y "Sin Comentarios".
3. Editar el comentario con el lápiz del Panel y recargar → sigue ahí.
4. Mover una reserva en el calendario general → la previsión y el comentario no se pierden.
5. Página pública: agendar eligiendo "Particular" → el panel muestra PARTICULAR en esa cita.
6. Finanzas → "Reservas por previsión" muestra "✓ Cuadra con el total"; cambiar a
   Mes anterior y a un rango personalizado → la lista cambia con el período.

Probado contra el dump en MySQL 9.6 aislado: 34 comprobaciones de punta a punta
(crear con y sin campos, valores inválidos que no se guardan, actualizar sin enviar
los campos, comentario desde el panel, reservas antiguas, Mercado Pago, estadística
contra un `COUNT(*)` directo en 3 períodos, rangos inválidos, inyección y sin sesión).

### A.3 Estado y pendientes del sprint

**Cerrado el 29-10-2026** y publicado en desarrollo: front en Vercel
(`desarrollo.agendaclinicas.cl`, `main` b5f4b03) y backend en el servidor `desarrollo`
(`main` 82e6c0e, ambas migraciones aplicadas con respaldo). Pruebas sobre el servidor:
17/17 endpoints, 9/9 lógica con datos reales, sin bucles de peticiones, pm2 estable.

Pendientes para el próximo sprint:

| # | Pendiente | Dónde | Prioridad |
|---|---|---|---|
| 1 | Quitar o enmascarar `console.log(req.body)`: `out.log` guarda RUT, teléfono y nombre del paciente en texto plano | Backend, controladores de reservas y pagos | **Alta** (SENS / Ley 21.719) |
| 2 | Reservar con un profesional inactivo guarda la reserva pero responde 500 (`correoEnArray[0]` es `undefined`) | `controller/ReservaPacienteController.js` | Media |
| 3 | Capturas del dashboard (Finanzas "Reservas por previsión" y Panel de Reservaciones) a 390 px y escritorio | Front | Media |
| 4 | `validar` responde 404 cuando la hora está ocupada (ruido en consola); evaluar 200 con `{ message: false }` coordinando con el front | Backend + `Reserva.jsx` | Baja |
| 5 | pm2 del servidor con la versión en memoria desactualizada (`pm2 update`) | Servidor `desarrollo` | Baja |

---

## Fase B · Página pública: pulir el aporte de Nicolás y categorías de atención

Revisión del 01-11-2026 sobre `desarrollo.agendaclinicas.cl` (`main` 6d0af51, los dos
commits de Nicolás del 29-10: `9a423af` y `6d0af51`). **Nada se rompió**: se conserva
el color teal y la estructura que armó, y se le pone el acabado premium de la
plataforma. Ordenado de lo más fácil a lo más difícil; cada paso se publica solo.

**Reglas de toda la fase**

- Antes de tocar un componente, revisarlo en el link de desarrollo y comparar después.
- Conservar la paleta teal de Nicolás (`#007f89`, `#00858f`, `#c6df86`), pero llevada a
  tokens de `paginaPublica.css`: nada de colores sueltos `bg-[#…]` en los componentes.
- Títulos y párrafos **sutiles**: las clases de la plataforma (`titular-portada`,
  `titular-2`, `text-tinta-2`) en vez de tamaños inline grandes.
- **Sin íconos decorativos** (lucide fuera de navbar, portada y datos); sin eyebrows
  ni líneas de adorno.
- Todo lo que muestra el centro sale del **backend** (`datosempresa`, portadas,
  profesionales). Nada hardcodeado.
- Responsive con captura real a **390 px, 768 px y escritorio**.

### B.1 Navbar (muy fácil) ✅

Se conserva el diseño de Nicolás (lo pidió así el 01-11), afinado:

- Izquierda: **nombre del centro desde `datosEmpresa.empresaNombre`** (el layout lo pasa
  por prop). Se borró el logo fijo `public/fonts/asdasd.png`.
- Cápsula teal con "Buscar profesional o especialidad" (lleva a `/agendaProfesionales`)
  y "Agendar hora" en verde lima. Solo queda la lupa, que indica búsqueda; el ícono de
  calendario salió. Colores como tokens (`acento`, `lima`), sin hex sueltos.
- Segunda fila con el menú, que **se pliega al hacer scroll** (queda una sola fila de
  72 px y no tapa contenido).
- Celular: nombre + "Agendar hora" + menú.
- Espacio superior ajustado en inicio, profesionales, reserva y verificación.

### B.2 Portada / hero (fácil)

- Se mantiene el bloque teal con la imagen a la derecha (el color quedó bien integrado).
- **Quitar la línea verde** de arriba del título.
- Título con `titular-portada` y párrafo en tamaño de lectura (17 px), no 22 px.
- Botones sin ícono, con las clases `boton` de la plataforma adaptadas al fondo teal.
  El secundario dice **"Conócenos"** (sirve para profesional independiente, centro o clínica).
- Texto, imagen y título siguen saliendo de `carruselPortada` / `datosempresa`.
- Revisar de paso que el nombre de la instancia sea coherente: en desarrollo la
  pestaña dice "Clinica Salud Mujer" y la portada "Centro Clínico Costanera" (es dato,
  no código, pero se ve en la revisión).

### B.3 Datos bajo la portada (fácil)

Hoy correo y dirección van en una sola píldora, pegados y separados por un punto.
Queda: **celdas separadas** (correo, teléfono, dirección; cada una solo si existe),
con su rótulo pequeño (`Correo`, `Dirección`) y el valor debajo, en una grilla que en
móvil pasa a una columna. Sin íconos. Cada celda sigue siendo enlace (mailto, mapa).

### B.4 Reserva: quitar sucursales (fácil)

El paso **Sucursal** de `SelectorAtencion.jsx` se elimina (las 3 sucursales eran de
relleno). Flujo nuevo en `/agendaProfesionales`:

**Tipo de atención → Profesional → Hora** (la hora sigue en `/agendaEspecificaProfersional/[id]`).

Mientras no exista B.5, el paso de tipo de atención no se muestra y se ve la grilla
de profesionales directo, como antes. Nunca se muestran las 9 categorías de relleno.

### B.5 Categorías de atención — ✅ cerrado y en `main` (probado por el usuario el 01-11)

Decisión del 01-11-2026: la categoría se escribe **al crear o editar al profesional**
(Odontología, Psicología… las que el centro quiera). Es **un solo campo en
`profesionales`**: la reserva pública arma la lista de categorías con los profesionales
que ya trae, así que **no hacen falta tablas ni endpoints nuevos**.

El front **ya envía** `categoriaProfesional` en `insertarProfesional` y
`actualizarProfesional`; hoy el backend lo ignora sin error. Para conectarlo:

```sql
-- migraciones/2026-11-XX_categoria_profesional.sql  (respaldo antes, como en la Fase A)
ALTER TABLE profesionales
  ADD COLUMN categoriaProfesional VARCHAR(60) NULL AFTER descripcionProfesional,
  ADD INDEX idx_categoria_profesional (categoriaProfesional);
```

| Archivo | Cambio |
|---|---|
| `controller/ProfesionalesController.js` → `insertarProfesionalController` y `actualizarProfesionalController` | Leer `categoriaProfesional` del `req.body`; limpiar (espacios simples, sin saltos) y cortar a 60; vacío → `NULL` |
| `model/Profesionales.js` → `INSERT` y `UPDATE` | Agregar la columna |
| `SELECT` de `seleccionarTodosProfesionales` y `seleccionarProfesional` | Nada: ya usan `SELECT *` (`model/Profesionales.js`), la columna sale sola |

Comprobar: crear un profesional con categoría, editarlo, dejarla vacía (→ `NULL`), y
que `/profesionales/seleccionarTodosProfesionales` la devuelva.

**Hecho (01-11):** `migraciones/2026-11-01_categoria_profesional.sql` (columna + índice),
`services/categoriaProfesional.js` (mismos caracteres que el front; `undefined` = no tocar al
editar, `""` = NULL, inválida → 400 `categoria-invalida`), model y controller de profesionales.
De paso se quitó el `console.log(req.body)` de ese controlador (RUT, teléfono y correo en el
log: pendiente #1 de A.3, ahora solo operación y usuario). Pruebas: `pruebas/profesionales/`
4 unitarias + 7 de punta a punta en MySQL con la tabla real (23 profesionales del dump).

**Sugerencias chilenas (front):** 78 categorías en `CATEGORIAS_SUGERIDAS` (medicina,
odontología, salud mental, rehabilitación, estética, apoyo diagnóstico), sin duplicados y
todas válidas para el backend; en el dashboard se ofrecen primero las que ya usa el centro y
luego las comunes en orden alfabético. Apenas haya **dos o
más categorías distintas**, la reserva pública muestra el paso solo.

### B.6 Categorías en el dashboard — front ✅

`ProfesionalModal.jsx`: campo opcional **"Categoría de atención"** (texto libre, 60
caracteres) con sugerencias: primero las que ya usa el centro, después las comunes
(`src/lib/categoriasAtencion.js`). La tarjeta del profesional en el dashboard la muestra
bajo la especialidad.

### B.7 Categorías en la reserva pública — front ✅

`SelectorAtencion.jsx`, paso 1: **"¿Qué tipo de atención necesitas?"**

- Las categorías se agrupan ignorando tildes, mayúsculas y espacios
  ("Odontología" = " odontologia ").
- Tarjetas sobrias (nombre + cuántos profesionales), sin íconos; 1 columna en
  celular, 2 en tablet y 3 en escritorio. Tocar una avanza directo, sin "Continuar".
- **Más de 8:** buscador arriba.
- **Menos de 2 categorías:** no hay paso y se ve la grilla directa (es lo que pasa hoy,
  mientras el backend no guarde el campo).
- "No sé cuál elegir: ver los N profesionales" siempre visible.
- La elección queda en la URL (`?atencion=odontologia`): funcionan "atrás" y los enlaces compartidos.
- Barra de pasos: Atención → Profesional → Hora.

### B.8 Orden y pulido de `/agendaProfesionales` (fácil, al final)

Encabezado sutil, una sola explicación (hoy el texto repite lo del panel), espacios
consistentes con el inicio y revisión completa a 390 px / 768 px / escritorio.

### B.9b Logo del centro (01-11-2026) — ✅ cerrado y en `main`

**Dashboard → Datos de la clínica → Datos generales**, antes de "Nombre de tu centro o clínica" (opcional, fila compacta con las recomendaciones plegadas). El usuario elige el archivo, lo
recorta en **círculo** (mismo `ImageCropperModal` de publicaciones, ahora con
`cropShape="round"`) y se sube a Cloudflare con el endpoint de siempre. Se guarda **al
confirmar el recorte**, con un endpoint propio: no depende de "Guardar todos los datos"
(que exige campos que no tienen que ver con el logo).

- Requisitos que se muestran y se validan antes de abrir el recorte: PNG, JPG o WebP;
  hasta **5 MB**; mínimo **200 × 200 px** (ideal 512 × 512). Aviso suave si es de baja
  resolución o alargado. Lógica en `src/lib/logoEmpresa.js` (pruebas `tests/logoEmpresa.test.mjs`).
- Se exporta como **PNG 512 × 512** para conservar la transparencia (antes el recorte
  siempre exportaba JPG: un logo transparente habría quedado con fondo negro).
- **Página pública:** círculo de 36/40 px antes del nombre en el navbar. Sin logo, solo el nombre.
- Quitar pide confirmación y guarda `NULL`.

**Backend** (rama `feat/logo-empresa` de `BACKEND-DESARROLLO-UNIVERSAL-AC`, commit `ca46f07`, en origin):

| Archivo | Cambio |
|---|---|
| `migraciones/2026-11-01_logo_empresa.sql` | `ALTER TABLE datos_empresa ADD COLUMN logoEmpresa VARCHAR(100) NULL AFTER empresaNombre` |
| `services/logoEmpresa.js` | Valida: solo id de Cloudflare (sin URL, `/`, `:` ni espacios, ≤100); `""`/`null` → `NULL`. `id_empresa` entero positivo |
| `model/DatosEmpresa.js` | `actualizarLogoEmpresa(logo, id)` — `UPDATE … WHERE id_empresa = ? AND estadoActivo <> 0` |
| `controller/DatosEmpresaController.js` | `actualizarLogo`: 200 `{message:true, logoEmpresa}` · 400 `logo-invalido`/`empresa-invalida` · 404 `empresa-no-encontrada` · 500. Bitácora `[AUDITORIA]` sin datos personales |
| `view/datosEmpresaRoutes.js` | `POST /datosempresa/actualizarLogo`, **después** del gate de Clerk |

Los `SELECT *` ya devuelven la columna, y `actualizar` (guardar todos los datos) **no la toca**.

Pruebas (01-11, MySQL 9.6 aislado con la tabla real del dump): `node --test pruebas/datosEmpresa/`
→ **14/14** (6 unitarias + 8 de punta a punta: 401 sin token o con token falso, guardar,
GET público, guardar el resto no borra el logo, 7 valores inválidos, 404, quitar y bitácora).

**Desplegado el 01-11-2026** en el servidor `desarrollo`: respaldo
`/root/respaldos/AGENDA_CLINICA_DESARROLLO_antes-logo_20261101-045648.sql` → checkout de
`feat/logo-empresa` (`ca46f07`) → migración aplicada → `pm2 restart agendaclinica-backend`
(solo esa app; las otras 7 siguieron arriba). Comprobado en el servidor: el GET público
devuelve `logoEmpresa`, `actualizarLogo` responde 401 sin token y con token falso, los demás
endpoints 200 y el log sin errores. **Probado por el usuario en desarrollo el 01-11 (funcionó).**
Fusionado a `main` (fast-forward, `ca46f07`) y servidor de vuelta en `main`.

### B.9c Revisión de seguridad de la fase (01-11-2026)

**Desplegado el 01-11-2026:** backend `96167c5` (rama `fix/endurecer-logo-y-subidas`) en el
servidor `desarrollo` con respaldo `…antes-categoria_20261101-054751.sql`, migración de la
categoría aplicada (27 profesionales, todos NULL) y solo `agendaclinica-backend` reiniciado;
front `bbd9313` en `main` (Vercel). Verificado en el servidor: públicos 200, `/pedidos`,
logo, subida y escritura de profesionales → 401 sin token, `categoriaProfesional` en el
listado, log sin errores. Probado por el usuario; fusionado a `main` y servidor de vuelta en `main`.

| # | Hallazgo | Riesgo | Arreglo | Prueba |
|---|---|---|---|---|
| 1 | `actualizarLogo` solo pedía sesión: un profesional o recepción podía cambiar el logo llamando la API | Medio | `middleware/exigirAdministradorClinica.js` + `services/rolesClinica.js` (mismas reglas que `dashboard-access.js`; falla cerrado → 403) | 401/200/403 por perfil, Clerk caído → 403, rol en el token |
| 2 | Rol como arreglo `["admin-clinica"]` se aceptaba (`String()` lo convertía) | Medio | Solo se acepta texto; alias con `Object.hasOwn` | casos `[…]`, `constructor`, `__proto__` |
| 3 | `/cloudflare/subirimagenes` sin límite de tamaño ni tipo (multer en memoria: un archivo enorme tumba el proceso de un servidor compartido) | Alto | 10 MB, 1 archivo, solo jpeg/png/webp/gif/avif; errores 413/415 en JSON | 413 con 10 MB + 1, el proceso sigue vivo |
| 4 | El tipo lo declara el navegador (falseable) | Medio | `services/firmaImagen.js`: verifica los bytes reales | PHP/SVG/PDF disfrazados de PNG → 415 |
| 5 | El log de subida imprimía el `req.file` completo | Bajo | Solo tipo y tamaño | — |
| 6 | **`/pedidos` totalmente abierto**: cualquiera podía leer nombre, teléfono, correo, RUT y dirección de los compradores y cambiar el estado de un pedido | **Alto** (afecta a todas las instancias) | Todo exige sesión salvo `ingresarNuevoPedido`; las pantallas ya mandan el token | 6 rutas × sin token / token falso → 401 |
| 7 | Front: un valor raro de `logoEmpresa` (p. ej. URL) terminaría como `src` | Bajo | `idLogoValido` antes de armar la URL (navbar y dashboard) | `tests/logoEmpresa.test.mjs` |
| 8 | Front: los rechazos se mostraban como error genérico | Bajo | Mensajes por motivo (sin permiso, sesión, pesada, formato) | idem |

Revisado sin hallazgos: SQL parametrizado; validación del id del logo (sin URL, rutas ni
inyección); bitácora sin datos personales; sin bucles de peticiones en navbar, selector de
categorías ni dashboard (efectos con dependencias estables, una carga por pantalla); URL de
categoría validada contra las existentes; React escapa la categoría y el nombre.

Pruebas: backend 32/32 (seguridad 13, logo 6, reservas 13) + 8 de punta a punta en MySQL
aislado; front 7 + 5 + 7 + 10 (perfiles); build OK; `npm run fechas` OK.

**Queda fuera de esta fase (anotado para el sprint):**
- El resto de las pantallas web (`/datosempresa/actualizar`, portada, publicaciones,
  servicios, testimonios) piden sesión pero no rol: aplicar `exigirAdministradorClinica`.
- `/cloudflare/api/images/direct-upload` crea URLs de subida para cualquier sesión.
- `/notificacion/whatsapp/respuesta` (webhook) sin verificación de firma de Twilio a la vista.
- Sin límite de peticiones (rate limit) en el backend.
- "Guardar todos los datos" exige en el backend 8 campos y el front solo 3: si falta
  "Sobre nosotros", falla con un error genérico.

### B.9 Estado

| # | Paso | Estado |
|---|---|---|
| B.1 | Navbar | ✅ Front (01-11) |
| B.2 | Portada | ✅ Front (01-11) |
| B.3 | Datos bajo la portada | ✅ Front (01-11) |
| B.4 | Quitar sucursales | ✅ Front (01-11) |
| B.5 | Categorías: backend (1 columna) | ✅ Cerrado: `96167c5` en `main`, probado por el usuario |
| B.6 | Categorías: dashboard | ✅ Front (01-11) |
| B.7 | Categorías: reserva pública | ✅ Front (01-11) |
| B.8 | Pulido `/agendaProfesionales` | ✅ Front (01-11) |
| B.9b | Logo del centro | ✅ Cerrado: front `5224b59` y backend `ca46f07` en `main`, probado en desarrollo |

Verificado el 01-11 en una copia aislada (build OK, sin desborde horizontal a 390 / 768 /
1440 px); el paso de categorías se probó con categorías ficticias inyectadas solo en
esa copia. Capturas en `~/Desktop/firma-fes/capturas/fase-B/`. Pruebas:
`node --test tests/categoriasAtencion.test.mjs` (7/7).

---

## Fase 0 · Preparación

### 0.1 Rama y respaldo

```bash
cd ~/NativeCode_Proyectos/Back_Proyect/BACKEND-DESARROLLO-UNIVERSAL-AC
git checkout -b feat/firma-electronica
mysqldump -u <usuario> -p AGENDA_CLINICA_DESARROLLO > ~/respaldo-antes-firma-$(date +%F).sql
```

### 0.2 Dependencias nuevas

```bash
npm i pdf-lib@1.17.1 sharp@0.33.5 qrcode@1.5.4 uuid@11.0.3
```

| Paquete | Para qué |
|---|---|
| `pdf-lib` | Estampar la firma, el QR y el texto legal sobre el PDF |
| `sharp` | Recortar y normalizar la imagen de la firma (en Ubuntu se instala solo, con binarios precompilados) |
| `qrcode` | Generar el QR de verificación |
| `uuid` | Identificadores UUIDv7 |

### 0.3 Variables de entorno

Agrega al `.env` del backend (desarrollo y, después, cada instancia):

```bash
# ── FIRMA ELECTRÓNICA ──────────────────────────────────────────
# Clave que sella la evidencia. Generarla UNA vez por instancia:
#   openssl rand -base64 48
# Guardarla también FUERA del servidor (gestor de contraseñas): sin ella no se
# puede demostrar que la evidencia no fue alterada.
FIRMA_HMAC_CLAVE=
FIRMA_HMAC_VERSION=1
# Dominio público de la clínica, con https:// (va en el QR de cada documento)
URL_PUBLICA_SITIO=https://desarrollo.agendaclinicas.cl
# Interruptor de emergencia: 0 apaga la firma sin desplegar código
FIRMA_HABILITADA=1
# Cuántas firmas se procesan a la vez (protege CPU y memoria)
FIRMA_CONCURRENCIA=2
# Opcional: minutos de validez de la reverificación de Clerk (por defecto 10)
FIRMA_REVERIFICACION_MIN=10
# Opcional (fase 7): número de Twilio habilitado para SMS (el de WhatsApp no sirve)
TWILIO_SMS_FROM=
```

Las demás que usa la firma ya existen en tu `.env`: `R2_*`, `BREVO_API_KEY`,
`CORREO_REMITENTE`, `CLERK_SECRET_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.

### 0.4 Versionar las migraciones

Tu `.gitignore` ignora `*.sql`. Agrega **al final** de `.gitignore`:

```gitignore
# Migraciones de la firma electrónica: sí se versionan
!migraciones/*.sql
```

---

## Fase 1 · Base de datos

### 1.1 Copiar las migraciones

```
docs/firma/backend/migraciones/2026-10-23_firma_electronica.sql       → migraciones/
docs/firma/backend/migraciones/2026-10-23_firma_electronica_seed.sql  → migraciones/
```

- La primera crea 9 tablas nuevas y agrega columnas a `profesionales`,
  `pacienteDatos` y `reservaPacientes`. **No borra ni renombra nada.**
- La segunda carga los 18 textos legales (acta de adhesión, política de privacidad,
  derechos y deberes del paciente, consentimiento base y 14 anexos de procedimientos).
  Cada uno con su huella SHA-256, que **coincide con la del front**.

### 1.2 Ejecutarlas

Por terminal (recomendado):

```bash
mysql -u <usuario> -p AGENDA_CLINICA_DESARROLLO < migraciones/2026-10-23_firma_electronica.sql
mysql -u <usuario> -p AGENDA_CLINICA_DESARROLLO < migraciones/2026-10-23_firma_electronica_seed.sql
```

Por phpMyAdmin: pestaña SQL, pega el archivo. El último trigger
(`trg_documento_firmado_inmutable`) usa `DELIMITER`: en phpMyAdmin escribe `$$`
en el campo **Delimitador** y borra las dos líneas `DELIMITER`.

### 1.3 Comprobar

```sql
SELECT codigo, version, estado FROM documento_plantilla ORDER BY categoria, codigo;  -- 18 filas, todas 'vigente'
SELECT * FROM firma_cadena_estado;                                                  -- 1 fila: 0 y 64 ceros
SHOW TRIGGERS LIKE 'firma_evento';                                                  -- 2 triggers
UPDATE firma_evento SET ip = 'x' WHERE 1 = 0;   -- debe funcionar (no afecta filas)
```

> **Requisito:** MySQL 8.0.16 o superior (usa `CHECK`, columnas generadas y
> `DEFAULT (expresión)`). Verifícalo con `SELECT VERSION();`.

---

## Fase 2 · Política de privacidad (página pública)

**Resultado:** al reservar (con o sin pago) el paciente marca **una casilla**, la
política de privacidad. El servidor guarda **qué texto exacto aceptó, cuándo y desde
qué IP**, genera la constancia en PDF, la guarda en R2 con su huella, la envía al
correo del paciente y la vincula con la reserva. Es lo que exige la Ley 21.719 desde
el 1 de diciembre. Más abajo, "Derechos y deberes del paciente" es un enlace de
lectura, sin casilla (la Ley 20.584 exige informarlos, no aceptarlos): no se registra.

### 2.1 Copiar archivos nuevos

| Copiar a tu backend | Para qué |
|---|---|
| `services/firma/identificadores.js` | IDs UUIDv7, códigos de verificación (`A7K2-9QX4`) y tokens |
| `services/firma/tiempo.js` | Hora del servidor en UTC y formato `23-10-2026 18:40:55 (UTC-03:00)` |
| `services/firma/rut.js` | RUT módulo 11 y pasaporte (misma regla que el front) |
| `services/firma/huellas.js` | SHA-256, HMAC y JSON canónico |
| `services/firma/cadenaEvidencia.js` | Registra eventos encadenados y sellados |
| `services/firma/bitacora.js` | Registra quién vio, descargó o envió cada documento |
| `services/firma/plantillas.js` | Interpola los textos legales igual que el front |
| `services/firma/roles.js` | Roles de Clerk con la misma lógica que el front |
| `services/firma/constanciaConsentimiento.js` | PDF de constancia con QR |
| `services/firma/correoFirma.js` | Correos por Brevo (sin datos clínicos en el cuerpo) |
| `model/DocumentoPlantilla.js` | Lee los textos legales vigentes |
| `model/ConsentimientoAceptacion.js` | Guarda y lista las aceptaciones |
| `model/UsuarioPlataforma.js` | Copia local de los usuarios de Clerk |
| `controller/ConsentimientosController.js` | Lógica de los consentimientos |
| `view/consentimientosRoutes.js` | Rutas `/consentimientos/*` |
| `middleware/exigirUsuarioClerk.js` | Sesión obligatoria (las rutas del dashboard de consentimientos la usan) |
| `middleware/limitesTasa.js` | Límites de peticiones por IP y por usuario |

### 2.2 Reemplazar `services/r2Storage.js`

Reemplaza el archivo completo por `docs/firma/backend/services/r2Storage.js`.
**Es compatible:** las 4 funciones que ya usas (`construirKey`, `subirArchivo`,
`eliminarArchivoR2`, `generarUrlDescarga`) quedan iguales y funcionan como hoy. Lo
que cambia:

- Cada operación con R2 tiene un tiempo límite de 15 s. Si Cloudflare no responde,
  falla con un error controlado en vez de quedar colgada.
- `generarUrlDescarga(key, segundos, { nombre, tipo })`: el tercer parámetro es
  opcional. Las llamadas existentes, con dos parámetros, no cambian.
- Nuevas: `construirKeyPrivada`, `descargarArchivoComoBuffer`, `listarClaves`.

### 2.3 `app.js`: montar las rutas

**Debajo de la línea 48** (`import healthMetricsRoutes from "./view/healthMetricsRoutes.js";`), agrega:

```js
// FIRMA ELECTRÓNICA (docs/firma): consentimientos, verificación pública, firma y documentos
import consentimientosRoutes from "./view/consentimientosRoutes.js";
```

**Debajo de la línea 114** (`app.use("/notificaciones", notificacionesPushRoutes);`), agrega:

```js
// FIRMA ELECTRÓNICA
app.use("/consentimientos", consentimientosRoutes);
```

### 2.4 `controller/ReservaPacienteController.js`: vincular la aceptación con la reserva

El front ya envía `token_aceptacion` en el cuerpo de la reserva. Tres cambios:

**a) Arriba, antes de la línea 1** (`import ReservaPacientes from "../model/ReservaPacientes.js";`):

```js
import { vincularAceptacionConReserva } from "./ConsentimientosController.js";
```

**b) En `insertarReservaPaciente` (línea 368), en la desestructuración del body:**
busca (líneas 385-389)

```js
                origen

            } = req.body;

            console.log(req.body);
```

y reemplázalo por

```js
                origen,
                token_aceptacion

            } = req.body;
```

(Se quita el `console.log(req.body)`: ahora el cuerpo trae datos personales y
consentimientos, y no deben quedar en los logs. Ley 21.719, minimización.)

**c) En la misma función, línea 412** (`if (resultadoQuery.affectedRows > 0) {`),
agrega justo debajo:

```js
                // FIRMA: une las dos aceptaciones de la reserva pública con esta reserva.
                await vincularAceptacionConReserva(token_aceptacion, resultadoQuery.insertId, rut);
```

`vincularAceptacionConReserva` **nunca lanza**: si el token no existe o ya se usó,
lo registra en el log y la reserva sigue. Una reserva nunca se pierde por esto.

> La ruta `/reservaPacientes/insertarReservaPacienteFicha` (la que usa la página
> pública) apunta a `insertarReservaPaciente`, así que con este cambio queda cubierta.

### 2.5 `controller/MercadoPagoController.js`: lo mismo para las reservas con pago

**a) Debajo de la línea 8** (`import Profesionales from "../model/Profesionales.js";`):

```js
import { vincularAceptacionConReserva } from "./ConsentimientosController.js";
```

**b) En `createOrder`, línea 67:** busca

```js
            totalPago,
            id_profesional
        } = req.body;
```

y reemplázalo por

```js
            totalPago,
            id_profesional,
            token_aceptacion
        } = req.body;
```

**c) Línea 175** (`if (resultadoInsert && resultadoInsert.affectedRows > 0) {`), agrega debajo:

```js
                // FIRMA: une las aceptaciones de la reserva pública con la reserva pendiente de pago.
                await vincularAceptacionConReserva(token_aceptacion, resultadoInsert.insertId, rut);
```

### 2.6 Probar

```bash
npm run dev   # o node app.js
curl -s localhost:3000/consentimientos/seleccionarVigentes | head -c 300
```

Debe responder `{"message":true,"plantillas":[...]}` con 2 plantillas: `tratamiento_datos`
(con casilla) y `derechos_deberes_paciente` (solo lectura).

### 2.7 Activar en el front

En el `.env` del front de la instancia:

```bash
NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1
```

Haz una reserva de prueba en la página pública y comprueba:

```sql
SELECT plantilla_codigo, codigo_verificacion, aceptado_at, id_reserva, id_paciente
FROM consentimiento_aceptacion ORDER BY aceptado_at DESC LIMIT 2;
SELECT secuencia, tipo_evento FROM firma_evento ORDER BY secuencia DESC LIMIT 2;
```

Debe aparecer 1 aceptación (`tratamiento_datos`) con `id_reserva` y 1 evento
`consentimiento_aceptado`. El paciente recibe un correo con la constancia en PDF.

> Sin esta variable la casilla **igual es obligatoria**, pero la aceptación no
> queda registrada en el servidor y no hay cómo probarla después. Actívala antes
> del 1 de diciembre de 2026.

---

## Fase 2b · Procedimientos del consentimiento informado

**Resultado:** la clínica crea sus propios procedimientos en **Plantillas →
Consentimientos informados** (`/dashboard/procedimientosConsentimiento`) llenando
campos fijos (en qué consiste, riesgos, alternativas, contraindicaciones, si no se
realiza, cuidados). Aparecen al emitir un consentimiento desde la carpeta del
paciente. Editar publica una versión nueva; lo firmado no cambia. **Sin tabla nueva:**
usa `documento_plantilla` (categoría `anexo_procedimiento`) de la fase 1.

> Despliégala **junto con la fase 2**: el front lee los procedimientos del backend
> apenas se activa `NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1`. (Si el backend no
> respondiera, el panel del paciente usa los 14 de ejemplo y nunca se bloquea.)

### 2b.1 Copiar

| Archivo | Para qué |
|---|---|
| `services/firma/anexos.js` | Campos fijos, armado del texto y validación. **Copia exacta** de `src/lib/consentimientos/procedimientos.js` del front: si cambias uno, cambia el otro |
| `model/DocumentoPlantilla.js` | Ya copiado en la fase 2; incluye las consultas de procedimientos (historial, vigentes, publicar, retirar) |
| `controller/ProcedimientosController.js` | Listar, historial, crear, nueva versión y retirar |
| `view/procedimientosRoutes.js` | Rutas `/procedimientos/*` (sesión obligatoria) |

### 2b.2 `app.js`

```js
import procedimientosRoutes from "./view/procedimientosRoutes.js";   // con los imports
app.use("/procedimientos", procedimientosRoutes);                    // con los app.use
```

### 2b.3 Reglas que ya trae el código

- Crear, editar y retirar: solo administradores (y el técnico). Consultar: también profesionales.
- El servidor **arma el texto** desde los campos: el cliente nunca manda texto libre.
- Faltando un punto obligatorio del art. 14 → `422`. Mismo nombre y especialidad que
  uno vigente → `409 procedimientoDuplicado` (hay que editar el existente). Nueva
  versión idéntica → `409 sinCambios`.
- Publicar una versión retira la anterior en la misma transacción (una sola vigente).

## Fase 3 · Verificación pública

**Resultado:** el QR de cada documento y constancia lleva a
`https://<clinica>/verificar/CODIGO`, que muestra si existe, quién lo emitió, cuándo
y si está vigente o anulado. **Nunca** muestra datos del paciente. Además se puede
subir el PDF para comprobar que no fue modificado.

### 3.1 Copiar

| Archivo | Para qué |
|---|---|
| `model/Verificacion.js` | Consultas públicas (sin datos del paciente) |
| `controller/VerificacionController.js` | Consulta por código y comparación de huella |
| `view/verificacionRoutes.js` | `GET /verificacion/:codigo` y `POST /verificacion/compararHash` |
| `middleware/limitesArchivos.js` | Tamaños máximos de archivos y errores 413 |

### 3.2 `app.js`

Junto a los imports de la fase 2:

```js
import verificacionRoutes from "./view/verificacionRoutes.js";
```

Junto a los `app.use` de la fase 2:

```js
app.use("/verificacion", verificacionRoutes);
```

### 3.3 Probar

Con el código de una constancia de la fase 2:

```bash
curl -s localhost:3000/verificacion/K3M8-QZ2P
```

Y en el navegador: `http://localhost:3000/verificar/K3M8-QZ2P` (front).

---

## Fase 4 · Registro SIS, foto del profesional y listado seguro

**Resultado:** el N° de registro de la Superintendencia de Salud se declara, se
verifica y aparece en el pie de firma. La foto del profesional se guarda. El listado
de profesionales deja de usar `SELECT *`, que después de la migración expondría la
clave privada del certificado.

### 4.1 Copiar archivos nuevos

| Archivo | Para qué |
|---|---|
| `model/RegistroSis.js` | Lee y actualiza las columnas `registro_sis_*` |
| `controller/RegistroSisController.js` | Declarar, verificar y descargar el certificado |

### 4.2 Reemplazar 3 archivos existentes

Los tres están en `docs/firma/backend/` y **conservan todo lo que ya hacen**. Cada
cambio está marcado con un comentario `FIRMA`.

| Archivo | Qué cambia |
|---|---|
| `model/Profesionales.js` | `seleccionarProfesionales` y `seleccionarProfesionalPorID` devuelven columnas explícitas + `firma_estado` (antes `SELECT *`). `insertar` y `actualizar` aceptan `imagenProfesional` (opcional; en `actualizar`, si no viene, no se toca) |
| `controller/ProfesionalesController.js` | Valida el RUT con módulo 11 (`422 rutInvalido`), valida el id de la foto (`422 archivoInvalido`), y al crear declara el `registro_sis_numero` con su evento. Quita los `console.log(req.body)` |
| `view/profesionalesRoutes.js` | Agrega `actualizarRegistroSis`, `verificarRegistroSis` y `descargarCertificadoSis` (con sesión obligatoria). En `insertar` y `actualizar` agrega `verificarUsuarioClerk` (no bloquea: si viene el token, registra quién lo hizo) |

> El front ya envía el token de Clerk al guardar un profesional (`ProfesionalModal.jsx`).
> **Pendiente C1:** cuando confirmes que todas las pantallas que llaman a
> `insertar/actualizar/eliminarProfesional` mandan el token, cambia
> `verificarUsuarioClerk` por `exigirUsuarioClerk` en esas rutas.

### 4.3 Probar

```bash
curl -s localhost:3000/profesionales/seleccionarTodosProfesionales | head -c 400
```

Cada profesional trae `registro_sis_numero`, `registro_sis_estado` y `firma_estado`,
y **no** trae `registro_sis_certificado_key`.

---

## Fase 5 · Sesión de Clerk obligatoria y reverificación

**Resultado:** las rutas de firma solo funcionan con una sesión válida de Clerk.
Firmar, registrar la firma y anular piden además haber ingresado la contraseña o un
código en los últimos 10 minutos (Ley 19.799: demostrar que firmó el titular).

### 5.1 Copiar

| Archivo | Para qué |
|---|---|
| `middleware/exigirUsuarioClerk.js` | Ya copiado en la fase 2. Sin token válido → 401; si Clerk no responde → 503 |
| `middleware/exigirReverificacion.js` | Si la verificación tiene más de 10 minutos, responde la señal que abre la ventana de Clerk en el front |

`middleware/verificarUsuarioClerk.js` **no se toca**: sigue igual para el registro de accesos.

### 5.2 Comprobar el claim `fva` (una vez por instancia de Clerk)

La reverificación lee el claim `fva` del token de sesión. Clerk lo incluye en los
tokens de sesión v2. Para comprobarlo, agrega temporalmente en
`exigirUsuarioClerk.js`, después de `verifyToken`:

```js
console.log("[CLERK] fva del token:", datos.fva); // TEMPORAL: borrar después de comprobar
```

Entra al dashboard, abre un profesional y mira el log. Debe mostrar algo como
`[ 3, -1 ]`. Si sale `undefined`, avísame: la alternativa es leer la sesión con
`clerk.sessions.getSession(sid)`.

---

## Fase 6 · Firma (grafía) del profesional

**Resultado:** cada profesional dibuja su firma en el dashboard (solo él, nunca un
tercero), acepta el acta de adhesión y la firma queda guardada en R2. Una sola
activa por profesional; las anteriores se conservan.

### 6.1 Copiar

| Archivo | Para qué |
|---|---|
| `services/firma/procesarImagenFirma.js` | Recorta y normaliza la firma con `sharp` (máximo 200 px de alto y 600 de ancho) |
| `services/firma/limitador.js` | Máximo 2 operaciones pesadas a la vez y 10 en espera; con la cola llena responde 503 |
| `middleware/firmaHabilitada.js` | Interruptor de emergencia y control de `FIRMA_HMAC_CLAVE` |
| `model/ProfesionalFirma.js` | Firma activa, reemplazo y revocación |
| `controller/FirmaProfesionalController.js` | Estado, acta, registrar, imagen y revocar |
| `view/firmaProfesionalRoutes.js` | Rutas `/firmaProfesional/*` |

### 6.2 `app.js`

```js
import firmaProfesionalRoutes from "./view/firmaProfesionalRoutes.js";   // con los imports
app.use("/firmaProfesional", firmaProfesionalRoutes);                    // con los app.use
```

---

## Fase 7 · Documentos firmados y consentimiento informado con OTP

**Resultado:** cotización, presupuesto, orden de exámenes, ficha clínica y
consentimiento informado se firman electrónicamente. El servidor estampa la firma,
el texto legal y el QR, calcula la huella, guarda el PDF **una sola vez** y desde
ahí siempre entrega ese mismo archivo. En el consentimiento, el paciente acepta
antes con un código enviado al correo o teléfono de su ficha.

### 7.1 Copiar

| Archivo | Para qué |
|---|---|
| `services/firma/zonaFirma.js` | Medidas del pie de firma (idénticas al front) |
| `services/firma/estamparFirmaPdf.js` | Estampa grafía, texto, QR y aceptación del paciente (el mismo archivo que usa el front) |
| `services/firma/envioOtp.js` | Envía el código por SMS (Twilio) o correo (Brevo) |
| `model/DocumentoEmitido.js` | Documentos y sus estados |
| `model/PacienteOtp.js` | Códigos OTP (solo se guarda su HMAC, nunca el código) |
| `controller/DocumentosController.js` | Preparar, firmar, descargar, enviar, listar, anular y OTP |
| `view/documentosRoutes.js` | Rutas `/documentos/*` |

### 7.2 `app.js`

```js
import documentosRoutes from "./view/documentosRoutes.js";   // con los imports
app.use("/documentos", documentosRoutes);                    // con los app.use
```

Y **antes de la línea 166** (`const PORT = process.env.PORT || 3000;`):

```js
// FIRMA: un error no controlado en una promesa se registra y el proceso sigue;
// una excepción no capturada registra y termina, para que pm2 reinicie limpio.
process.on("unhandledRejection", (error) => console.error("[proceso] promesa rechazada sin manejar:", error));
process.on("uncaughtException", (error) => { console.error("[proceso] excepción no capturada:", error); process.exit(1); });
```

### 7.3 CORS del bucket R2 (obligatorio para las descargas)

Las descargas no pasan por el backend: el navegador baja el PDF directo de R2 con
una URL que vence en 60 segundos. Cloudflare → R2 → tu bucket → **Settings → CORS
policy**:

```json
[
  {
    "AllowedOrigins": ["https://desarrollo.agendaclinicas.cl", "http://localhost:3000"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 600
  }
]
```

En producción, un origen por dominio de clínica. **Nunca `"*"`.**

### 7.4 SMS del OTP (opcional)

Para enviar el código por SMS hace falta `TWILIO_SMS_FROM`: un número de Twilio
habilitado para SMS en Chile (el de WhatsApp no sirve). Sin él, el SMS responde
`503` y el profesional usa el correo, que funciona con lo que ya tienes en Brevo.

### 7.5 Activar en el front

```bash
NEXT_PUBLIC_FIRMA_HABILITADA=1
```

Con esto el front deja el modo de prueba y usa el backend real. Recorrido de prueba:

1. Como profesional (con `idProfesionalAgenda` en Clerk): Profesionales → tu tarjeta → Firma electrónica → dibujar → aceptar el acta. Clerk pide la contraseña.
2. Detalle de una cotización → **Firmar con FES** → vista previa → firmar → descargar → escanear el QR.
3. Carpeta del paciente → Consentimiento informado → enviar código → ingresarlo → firmar.
4. `node scripts/verificar_cadena_firma.mjs` → `Cadena íntegra (N eventos).`

---

## Fase 8 · Operación y protección

### 8.1 Scripts (copiar a `scripts/`)

| Script | Cuándo | Qué hace |
|---|---|---|
| `verificar_cadena_firma.mjs` | Diario | Recalcula huellas y sellos de toda la evidencia. Sale con código 1 si algo fue alterado |
| `verificar_cadena_firma.mjs --con-pdf` | Semanal | Además baja cada PDF firmado y compara su huella |
| `limpiar_huerfanos_r2.mjs` | Semanal | Lista (o borra con `--borrar`) archivos de más de 24 h que ninguna fila referencia. Nunca toca uno referenciado |
| `expirar_borradores.mjs` | Diario | Anula documentos con más de 30 días sin firmar (no borra nada) |

`crontab -e` en el servidor:

```cron
0 3 * * *  cd /ruta/backend && node scripts/verificar_cadena_firma.mjs >> logs/firma.log 2>&1 || echo "Cadena de firma con problemas" | mail -s "ALERTA firma" soporte@nativecode.cl
0 4 * * 0  cd /ruta/backend && node scripts/verificar_cadena_firma.mjs --con-pdf >> logs/firma.log 2>&1
30 4 * * 0 cd /ruta/backend && node scripts/limpiar_huerfanos_r2.mjs --borrar >> logs/firma.log 2>&1
15 3 * * * cd /ruta/backend && node scripts/expirar_borradores.mjs >> logs/firma.log 2>&1
```

### 8.2 pm2

```bash
pm2 start app.js --name backend --max-memory-restart 600M --kill-timeout 10000
pm2 save
```

- `--max-memory-restart`: reinicia si el proceso supera esa memoria (ajústalo a la RAM del servidor).
- `--kill-timeout`: da 10 s a las firmas en curso antes de reiniciar.

### 8.3 Pruebas

```bash
node --test "pruebas/firma/*.test.mjs"
for tz in America/Santiago UTC Asia/Tokyo Pacific/Niue; do TZ=$tz node --test "pruebas/firma/*.test.mjs"; done
```

Las 7 pruebas deben pasar en los 4 husos horarios (el resultado no depende del huso del servidor).

### 8.4 Interruptor de emergencia

Si algo falla en producción: `FIRMA_HABILITADA=0` en el `.env` y `pm2 restart backend`.
Preparar, firmar y el OTP responden 503. Descargar lo ya firmado, la verificación
pública y todo el resto de la plataforma siguen funcionando.

---

## Antes del 1 de diciembre de 2026 (por instancia)

**Técnico**
- [ ] Fases 0, 1, 2, 2b y 3 desplegadas y `NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1` activo.
- [ ] `FIRMA_HMAC_CLAVE` generada y guardada fuera del servidor.
- [ ] CORS del bucket R2 configurado.
- [ ] Cron de `verificar_cadena_firma.mjs` con alerta.
- [ ] Respaldo diario de la base y respaldo periódico del bucket.

**Legal** (con el abogado de la clínica; ver `03` §8)
- [ ] Contrato de encargo de tratamiento clínica ↔ NativeCode.
- [ ] Política de privacidad revisada (el texto está en la tabla `documento_plantilla`).
- [ ] Revisión de los 14 anexos de ejemplo por el director técnico (editarlos desde la pantalla publica la versión revisada).
- [ ] Bucket Lock de 15 años en R2 para `privado/documentos/firmados/` y `privado/consentimientos/` (no se puede acortar después: aplicarlo con calma).

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `503 serverError` en todo `/documentos` y log `[FIRMA] FIRMA_HMAC_CLAVE no configurada` | Falta la clave o mide menos de 32 bytes | `openssl rand -base64 48` y reiniciar |
| `409 actaDesactualizada` al reservar | El texto cambió mientras el paciente leía | El front recarga los textos solo; el paciente vuelve a aceptar |
| La descarga falla en el navegador con error de CORS | Falta la política CORS del bucket | Paso 7.3 |
| `403 reverificacionRequerida` en un bucle | El token no trae `fva` | Paso 5.2 |
| `503 servicioOcupado` | Más de 12 firmas al mismo tiempo, o `FIRMA_HABILITADA=0` | Reintentar; revisar el interruptor |
| `422 sinDatoContacto` al pedir el OTP | El paciente no tiene correo o teléfono en su ficha | Actualizar la ficha o imprimir para firmar a mano |
| SMS del OTP responde 503 | Falta `TWILIO_SMS_FROM` | Paso 7.4, o usar correo |
| `ER_CHECK_CONSTRAINT_VIOLATED` al firmar un consentimiento | Se intentó firmar sin la aceptación del paciente | Es la protección esperada (`chk_documento_aceptacion`) |
| `firma_evento es append-only` | Alguien intentó modificar la evidencia | Es la protección esperada |

> **Encontrado en la prueba, ajeno a la firma:** con tu dump de desarrollo, el cron
> de expiración de reservas registra cada minuto
> `Unknown column 'fechaExpiracionPago' in 'where clause'`. La base de desarrollo no
> tiene esa columna que el código de `ReservaPacientes.expirarReservasPendientes`
> espera. Conviene revisarlo aparte.

---

## Mapa completo de archivos

| Archivo | Acción | Fase |
|---|---|---|
| `migraciones/2026-10-23_firma_electronica.sql` | Nuevo | 1 |
| `migraciones/2026-10-23_firma_electronica_seed.sql` | Nuevo | 1 |
| `services/r2Storage.js` | Reemplazar (compatible) | 2 |
| `services/firma/identificadores.js` · `tiempo.js` · `rut.js` · `huellas.js` · `roles.js` | Nuevos | 2 |
| `services/firma/cadenaEvidencia.js` · `bitacora.js` · `plantillas.js` | Nuevos | 2 |
| `services/firma/constanciaConsentimiento.js` · `correoFirma.js` | Nuevos | 2 |
| `model/DocumentoPlantilla.js` · `ConsentimientoAceptacion.js` · `UsuarioPlataforma.js` | Nuevos | 2 |
| `controller/ConsentimientosController.js` · `view/consentimientosRoutes.js` | Nuevos | 2 |
| `middleware/exigirUsuarioClerk.js` · `limitesTasa.js` | Nuevos | 2 |
| `app.js` | Modificar (imports, `app.use`, manejo de errores) | 2, 2b, 3, 6, 7 |
| `services/firma/anexos.js` · `controller/ProcedimientosController.js` · `view/procedimientosRoutes.js` | Nuevos | 2b |
| `controller/ReservaPacienteController.js` | Modificar (3 cambios) | 2 |
| `controller/MercadoPagoController.js` | Modificar (3 cambios) | 2 |
| `model/Verificacion.js` · `controller/VerificacionController.js` · `view/verificacionRoutes.js` | Nuevos | 3 |
| `middleware/limitesArchivos.js` | Nuevo | 3 |
| `model/RegistroSis.js` · `controller/RegistroSisController.js` | Nuevos | 4 |
| `model/Profesionales.js` · `controller/ProfesionalesController.js` · `view/profesionalesRoutes.js` | Reemplazar (compatibles) | 4 |
| `middleware/exigirReverificacion.js` | Nuevo | 5 |
| `services/firma/procesarImagenFirma.js` · `limitador.js` · `middleware/firmaHabilitada.js` | Nuevos | 6 |
| `model/ProfesionalFirma.js` · `controller/FirmaProfesionalController.js` · `view/firmaProfesionalRoutes.js` | Nuevos | 6 |
| `services/firma/zonaFirma.js` · `estamparFirmaPdf.js` · `envioOtp.js` | Nuevos | 7 |
| `model/DocumentoEmitido.js` · `PacienteOtp.js` · `controller/DocumentosController.js` · `view/documentosRoutes.js` | Nuevos | 7 |
| `scripts/verificar_cadena_firma.mjs` · `limpiar_huerfanos_r2.mjs` · `expirar_borradores.mjs` | Nuevos | 8 |
| `pruebas/firma/unitarias.test.mjs` | Nuevo | 8 |
| `.gitignore` | Agregar 2 líneas | 0 |
