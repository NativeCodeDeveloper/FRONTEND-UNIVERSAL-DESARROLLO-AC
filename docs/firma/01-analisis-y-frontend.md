# Firma Electrónica Simple (FES) — 01 · Análisis del repo y especificación del frontend

> Documento autocontenido. Un agente que solo lea este archivo debe poder
> implementar la fase 1 (frontend) completa. Los contratos de API que aquí se
> consumen están detallados en `02-contrato-endpoints.md`, pero las formas de
> cada respuesta se repiten en este documento para que el front pueda
> construirse con datos simulados antes de que exista el backend.

Orden de implementación del proyecto: **frontend (este documento) → contrato → backend y tablas**.

> **Para implementar el backend, empezar por `04-guia-backend-paso-a-paso.md`:** el código
> completo y probado está en `docs/firma/backend/`, y la guía indica fase por fase
> qué copiar y qué líneas agregar en los archivos existentes.

---

## 0. Restricciones no negociables (aplican a todo el documento)

1. **Marco legal.** Ley 19.799, art. 3: la firma electrónica tiene el mismo valor
   que la firma manuscrita. Implementamos **FES** (firma electrónica simple)
   nativa, sin terceros. FEA queda fuera de alcance. Con FES, si el firmante niega
   haber firmado, la carga de la prueba es nuestra: todo el diseño existe para
   ganar esa discusión con tres patas:
   - **Identificación:** reverificación de Clerk en el momento de firmar.
   - **Voluntad:** el profesional ve el borrador exacto y acciona "Firmar".
   - **Integridad:** SHA-256 del PDF final, calculado en el servidor.
2. **El PNG de la firma NO es la firma.** Es la grafía. La firma legal es la fila
   de evidencia del backend (hash + método de autenticación + marca de tiempo).
3. **El front nunca calcula el hash que vale, nunca fija `firmado_at`, nunca
   incrusta la firma en el PDF.** El front genera el *cuerpo* del documento con
   el espacio del pie reservado; el servidor estampa grafía, QR y leyenda, calcula
   el SHA-256 y guarda los bytes (camino B acordado).
4. **El PDF firmado no se regenera nunca.** Ver, descargar, imprimir y enviar
   usan siempre los bytes guardados por el backend.
5. **La imagen de la firma nunca viaja en base64 dentro de un JSON a la BD** y no
   se guarda en `localStorage`. Se sube como archivo (`multipart/form-data`) y se
   lee solo por endpoint autenticado.
6. **Solo el propio profesional dibuja su firma**, desde su sesión de Clerk
   (usuario con `publicMetadata.idProfesionalAgenda` igual al `id_profesional`).
   Un administrador nunca ve el pad: ve el estado ("Pendiente" / "Registrada").
7. **Ley 21.719 (vigente 1-dic-2026):** minimización de datos. La página pública
   de verificación no muestra datos clínicos ni del paciente. Los consentimientos
   de datos y de atención son **dos casillas separadas**.
8. **Recetas: NO se integran a la FES.** El tipo "receta" no existe en el flujo
   de firma electrónica. Las tres pantallas de receta (`recetaPacientes`,
   `recetaRapida`, `recetaLentes`) solo ofrecen **Imprimir para firma de puño y
   letra** (sin descarga). Motivo: la receta electrónica para dispensación exige
   firma electrónica avanzada (FEA), y ni una FES ni una declaración o
   autorización del profesional cambian ese requisito. Esto no se puede saltar con
   una validación: simplemente no se implementa.
9. **Fechas:** cumplir `CLAUDE.md`. `firmado_at` es un **instante** → `new Date()`
   es correcto (marcar con `// fecha-ok:`), pero se formatea siempre en
   `America/Santiago` con el desfase calculado, nunca hardcodeado. `npm run fechas`
   debe pasar.
10. **Responsive obligatorio.** Cada pantalla nueva o modificada se verifica con
    captura real a 360 px, 390 px, 768 px y 1280 px de ancho.

---

## 1. Análisis del repositorio (Fase 0)

### 1.1 Backend — `BACKEND-DESARROLLO-UNIVERSAL-AC`

| Tema | Realidad encontrada | Archivo de referencia |
|---|---|---|
| Framework | Express 5, JavaScript ESM (`"type":"module"`), sin TypeScript | `app.js` |
| Capas | `view/*Routes.js` → `controller/*Controller.js` (métodos `static`) → `model/*.js` (clases con SQL plano) | `view/profesionalesRoutes.js`, `controller/ProfesionalesController.js`, `model/Profesionales.js` |
| Rutas | Prefijo por router en `app.js`; acciones **POST** en camelCase con verbo: `/profesionales/insertarProfesional`, `/archivoPaciente/descargar` | `app.js` |
| Validación | Manual en el controller (`if (!campo) return res.status(400).json({message:"sindata"})`). `express-validator` instalado y sin uso | `controller/ProfesionalesController.js` |
| Respuestas | Éxito `{message:true}`; error de datos `400 {message:"sindata"}`; conflicto `{message:"conflicto"}`; servidor `500 {message:"serverError"}`. **Inconsistencia:** `ArchivoPacienteController` responde `{error:"..."}` y `{ok:true}` | `controller/ArchivoPacienteController.js` |
| BD | **MySQL 8.0** vía `mysql2/promise`, singleton `DataBase.getInstance().ejecutarQuery(sql, params)` | `config/Database.js` |
| Migraciones | Sin herramienta. Archivos `.sql` aditivos sueltos | `migration_notificaciones_ics.sql` |
| PK | `INT AUTO_INCREMENT` en todas las tablas existentes | dump SQL |
| Multi-tenant | **Una instancia de backend + una BD por clínica/plan**; dentro, varios profesionales. No hay `clinica_id` (salvo `resenas.clinica_id`, legado) | `datos_empresa` con una fila |
| Clerk | `middleware/verificarUsuarioClerk.js` — *fail-open*, deja `req.usuario = {clerkId,email,nombre,rol,idProfesional}`. Solo lo usa `/health-metrics/acceso` | `view/healthMetricsRoutes.js` |
| Seguridad | **Casi todos los endpoints son abiertos** (sin token). El front no envía token salvo `RegistroAcceso.jsx` | `app.js` |
| Archivos | Cloudflare R2 (`@aws-sdk/client-s3`), URLs prefirmadas | `services/r2Storage.js` |
| PDF backend | `jspdf` — genera la cotización y la envía con nodemailer | `services/envioCotizacionCorreo.js`, `controller/EnvioCotizacionesController.js` |
| Usuario ↔ profesional | `publicMetadata.idProfesionalAgenda` en Clerk. Columna `profesionales.usuarioAsignadoClerk` existe pero está vacía. Sin tabla local de usuarios | `src/app/api/dashboard/users/route.js` (front) |
| Registro SIS | `perfilProfesional.registro_sis` existe; ningún modelo lo usa | dump SQL |

### 1.2 Frontend — este repo

| Tema | Realidad encontrada | Archivo de referencia |
|---|---|---|
| Framework | Next 16, App Router, React 19, **JavaScript** (`.jsx`) | `package.json` |
| Estilos | Tailwind v4 + shadcn (`src/components/ui/*`). Conviven restos de MUI, react-bootstrap, material-tailwind, styled-components (**no usar en código nuevo**) | `components.json` |
| Componentes base | `ShadcnInput` (`Componentes/shadcnInput2.jsx`), `ShadcnSelect` (`Componentes/shadcnSelect.jsx`), `RutInput`, `PhoneInput`, `ModalBase`, `StatusBadge`, `EmptyState`, `SkeletonLoader` | `src/Componentes/` |
| Formularios | Estado manual + función `validarX()` exportada + `toast` (`react-hot-toast`). `react-hook-form`/`zod` instalados pero el modal de profesional no los usa → **seguir el patrón manual** | `src/Componentes/ProfesionalModal.jsx` |
| Llamadas API | `fetchConCarga` (envoltorio que activa la carga global) + `process.env.NEXT_PUBLIC_API_URL` en cada componente. Sin cliente central | `src/lib/fetchConCarga.js` |
| Auth | `clerkMiddleware` + roles en `publicMetadata.role` | `src/middleware.ts`, `src/lib/dashboard-access.js` |
| Modal profesional | Portal propio (no `ModalBase`), hoja inferior en móvil (`items-end`, `rounded-t-[24px]`), subcomponente `Campo`, `data-campo` para scroll al error, `data-tour` para el tutorial | `src/Componentes/ProfesionalModal.jsx` |
| Lista profesionales | Tarjetas con avatar de iniciales; **no filtra por profesional** (todos ven todas) | `src/app/dashboard/profesionales/page.jsx` |
| Crear usuario | Admin crea usuario Clerk (username + contraseña) y asigna `idProfesionalAgenda` | `src/app/dashboard/createUser/page.jsx`, `src/app/api/dashboard/users/route.js` |
| RUT | `RutInput` valida solo largo. **Módulo 11 existe** en `src/lib/paginaPublica/rut.js` (`rutValido`, `formatearRut`, `limpiarRut`), usado solo en la reserva pública | `src/Componentes/PaginaPublica/Reserva/Reserva.jsx` |
| PDF | jsPDF en el navegador. Pie de firma único `dibujarBloqueFirma` | `src/lib/pdfFirma.js` |
| Generadores PDF clínicos | `FichasPacientes/[id_paciente]`, `detalleCotizacion/[id_cotizacion_paciente]`, `presupuestoTratamiento`, `examenDocumento`, `recetaPacientes/[id_paciente]`, `recetaRapida`, `recetaLentes` | `src/app/dashboard/*/page.jsx` |
| QR | `qrcode` instalado | `package.json` |
| Visor PDF | `pdfjs-dist` instalado | `package.json` |
| Notificaciones | Campana `NotificationBell` + `useNotificaciones` (`/notificaciones/pendientes`) | `src/components/NotificationBell.jsx`, `src/hooks/useNotificaciones.js` |
| Reserva pública | Pasos con `Paso`, clases `caja`, `campo`, `boton`, `boton-principal`; dos caminos: con pago (`/pagosMercadoPago/create-order`) y sin pago (`/reservaPacientes/insertarReservaPacienteFicha`) | `src/Componentes/PaginaPublica/Reserva/Reserva.jsx` |
| Fechas | Todo en `src/lib/fechas.js`; guardián `npm run fechas` | `CLAUDE.md` |

### 1.3 Inconsistencias detectadas (no resueltas en silencio)

1. Formato de error del backend: `{message}` vs `{error}`/`{ok}`. **Lo nuevo usa `{message}`** (mayoritario).
2. Backend abierto sin autenticación. Lo nuevo exige token de Clerk (*fail-closed*); el resto queda como deuda antes del 1-dic (ver `02`).
3. Tres librerías de UI legadas. Lo nuevo usa solo Tailwind + shadcn.
4. `RutInput` y la reserva pública validan RUT distinto. Se unifica (§3).
5. `/dashboard/profesionales` muestra todas las tarjetas a cualquier rol con acceso. Se filtra (§5.5).
6. Dos flujos de reserva pública: `Componentes/PaginaPublica/Reserva/Reserva.jsx` y `app/(public)/formularioReservaProfesional/[id_profesional]/page.jsx`. Las casillas de consentimiento van en **ambos**.

---

## 2. Arquitectura del front para esta integración

```
src/
├── lib/
│   ├── rut.js                         NUEVO  validación única RUT/pasaporte
│   ├── paginaPublica/rut.js           MOD    re-exporta desde lib/rut.js
│   ├── fechas.js                      MOD    + formatearInstanteConOffset()
│   ├── pdfFirma.js                    MOD    + línea "Reg. Superintendencia" en modo manuscrito
│   ├── firma/
│   │   ├── apiFirma.js                NUEVO  cliente HTTP con token Clerk + modo mock
│   │   ├── mockFirma.js               NUEVO  respuestas simuladas con la forma exacta del contrato
│   │   ├── procesarTrazo.js           NUEVO  bbox, recorte, normalizado (vista previa)
│   │   └── constantes.js              NUEVO  tintas, tipos de documento, estados
│   └── documentos/
│       ├── motorDocumento.js          NUEVO  diagramación por bloques sin superposición
│       ├── zonaFirma.js               NUEVO  medidas del pie reservado (compartidas con backend)
│       └── imprimirPdf.js             NUEVO  imprimir sin descargar
├── hooks/
│   ├── useSesionProfesional.js        NUEVO
│   └── usePendientesProfesional.js    NUEVO
├── Componentes/
│   ├── RutInput.jsx                   MOD    módulo 11 + modo pasaporte
│   ├── ProfesionalModal.jsx           MOD    + 2 secciones expandibles
│   ├── firma/
│   │   ├── SeccionExpandible.jsx      NUEVO
│   │   ├── PadFirma.jsx               NUEVO
│   │   ├── SeccionFirmaElectronica.jsx NUEVO
│   │   ├── SeccionRegistroSis.jsx     NUEVO
│   │   └── ActaAdhesionModal.jsx      NUEVO
│   ├── documentos/
│   │   ├── EmisionDocumento.jsx       NUEVO  panel reutilizable de emisión
│   │   ├── VisorPdf.jsx               NUEVO
│   │   ├── EstadoDocumentoBadge.jsx   NUEVO
│   │   └── ListaDocumentosPaciente.jsx NUEVO
│   └── PaginaPublica/Reserva/
│       └── ConsentimientosReserva.jsx NUEVO
└── app/
    ├── (public)/verificar/[codigo]/page.jsx   NUEVO  verificación pública
    └── dashboard/documentosPorFirmar/page.jsx NUEVO  bandeja del profesional
```

**Principio de reutilización:** cada generador de PDF existente solo aporta una
función `generarCuerpoPdf() → Blob` construida con `motorDocumento`. Todo lo
demás (previsualizar, firmar, enviar, imprimir, bitácora) lo resuelve
`EmisionDocumento` una sola vez.

---

## 3. RUT y documento extranjero — `src/lib/rut.js`

Mover la lógica de `src/lib/paginaPublica/rut.js` a `src/lib/rut.js` y dejar el
archivo antiguo como re-export (`export * from "@/lib/rut";`) para no romper
`Reserva.jsx`.

```js
export const TIPOS_DOCUMENTO = { RUT: "rut", PASAPORTE: "pasaporte" };

export function limpiarRut(valor)            // "12.345.678-k" → "12345678K"
export function formatearRut(valor)          // "12345678K" → "12.345.678-K"
export function rutValido(valor)             // módulo 11 (algoritmo actual de paginaPublica/rut.js)
export function limpiarPasaporte(valor)      // mayúsculas, solo [A-Z0-9], máx 20
export function pasaporteValido(valor)       // 5–20 caracteres alfanuméricos
export function validarDocumento({ tipo, valor }) // → "" | mensaje de error
```

- `rutValido` exige cuerpo de 7–8 dígitos + DV. Mensaje: **"El RUT no es válido (revisa el dígito verificador)."**
- `formatRut`/`cleanRut` de `src/lib/designTokens.js` se mantienen (se usan en
  muchos sitios); internamente pueden delegar en `lib/rut.js`.

### 3.1 `RutInput` modificado

Props nuevas, todas opcionales para no romper los 6 usos actuales:

| Prop | Tipo | Default | Uso |
|---|---|---|---|
| `permitirExtranjero` | bool | `false` | Muestra selector segmentado **RUT · Pasaporte** |
| `tipoDocumento` | `"rut"\|"pasaporte"` | `"rut"` | Controlado por el padre |
| `onTipoDocumentoChange` | fn | — | |
| `onValidez` | fn(bool) | — | Informa validez al padre |

- Valida módulo 11 al perder foco y al escribir si ya fue tocado.
- En modo pasaporte: sin formateo, sin módulo 11, `inputMode="text"`, placeholder "N° de pasaporte".
- El selector segmentado: dos botones `h-9 rounded-lg text-[13px]`, activo `bg-slate-900 text-white`; en móvil ocupan el ancho completo sobre el input.
- **Usos a revisar** (heredan la validación al cambiar el componente; confirmar que su validación local no contradiga):
  `ProfesionalModal.jsx`, `NuevoPacienteModal.jsx`, `AppointmentDrawer.jsx`,
  `app/dashboard/FichasPacientes/[id_paciente]/page.jsx`,
  `app/dashboard/paciente/[id_paciente]/page.jsx`, `app/dashboard/FichaClinica/page.jsx`,
  `app/dashboard/listaPacientes/page.jsx`, `app/dashboard/agendaCitas/page.jsx`.
- **Pacientes:** `permitirExtranjero` activado en todos los formularios de paciente y en ambas reservas públicas. **Profesionales:** solo RUT.
- El backend hoy guarda `"RUTDESCONOCIDO"` en algunas reservas; el pasaporte viaja con `tipo_documento: "pasaporte"` (columna nueva, ver `03`).

`validarProfesional()` en `ProfesionalModal.jsx` reemplaza la regla de largo por `rutValido()`.

---

## 4. Fechas — `src/lib/fechas.js`

Agregar (no crear otro archivo de fechas):

```js
/**
 * Instante (ISO UTC del backend) → "22-10-2026 22:25:57 (UTC-03:00)"
 * en America/Santiago. El desfase se calcula con Intl (timeZoneName:"longOffset"),
 * así en invierno sale (UTC-04:00) sin tocar código.
 */
export function formatearInstanteConOffset(iso) { ... }
```

Usar `// fecha-ok: instante real del servidor (firmado_at)` sobre el `new Date(iso)`.
Pruebas obligatorias (CLAUDE.md): `TZ=America/Santiago|UTC|Asia/Tokyo|Pacific/Niue`,
instantes de enero (UTC−3) y julio (UTC−4), y 23:59:59 local.

---

## 5. Profesional: firma y registro de la Superintendencia

### 5.1 Quién ve qué

`src/hooks/useSesionProfesional.js`:

```js
// → { cargado, clerkUserId, rol, idProfesional, esAdministrador }
// idProfesional = String(user.publicMetadata.idProfesionalAgenda || "")
// esAdministrador = rol ∈ {"admin","super-usuario-nativecode","administrador-clinico"}
export function useSesionProfesional() { ... }
```

| Sección del modal | Profesional dueño (`idProfesional === id_profesional`) | Administrador | Otro rol |
|---|---|---|---|
| Datos actuales | Edita | Edita | Según permisos actuales |
| Firma electrónica | **Dibuja, reemplaza, revoca** | Solo estado (sin imagen) | Oculta |
| Registro SIS | Declara número y adjunta certificado | Declara, adjunta, **verifica/rechaza** | Oculta |

Al crear un profesional nuevo (modal en modo "Nuevo") las dos secciones se
muestran **colapsadas y deshabilitadas** con el texto: *"Disponible después de
registrar al profesional. La firma la dibuja el propio profesional desde su
cuenta."* El registro SIS sí puede llenarse al crear (es un dato declarado).

### 5.2 `ProfesionalModal.jsx` — cambios

Se conserva todo lo actual (campos, `Campo`, validación, portal, foco, Escape,
Tab atrapado, hoja inferior en móvil, `data-tour`). Profesión/Especialidad
**sigue siendo texto libre de 65 caracteres** (decisión del cliente).

Debajo del grid actual, separadas por `border-t border-slate-100 pt-4 mt-2`:

```
┌──────────────────────────────────────────────┐
│ ▸ N° Registro Superintendencia de Salud   [Declarado]   │  ← SeccionExpandible
├──────────────────────────────────────────────┤
│ ▸ Firma electrónica                       [Pendiente]   │  ← SeccionExpandible
└──────────────────────────────────────────────┘
```

- El modal pasa de `max-w-xl` a `max-w-2xl` en `sm:` cuando hay una sección abierta (transición de ancho), el cuerpo ya tiene `overflow-y-auto`.
- El guardado de los **datos** sigue usando `/profesionales/insertarProfesional|actualizarProfesional` con el mismo payload; ahora agrega `registro_sis_numero` (opcional).
- La firma **no se guarda con el botón "Guardar cambios"**: tiene su propio botón dentro de la sección ("Registrar firma"), porque exige reverificación y acta. Así un error en la firma no bloquea guardar los datos, y viceversa.

### 5.3 `SeccionExpandible.jsx`

Acordeón accesible reutilizable (no usar el de MUI): botón `aria-expanded`,
`aria-controls`, chevron que rota, contenido con `grid-rows-[0fr]→[1fr]`
animado. Prop `insignia` para el estado a la derecha (usar `StatusBadge` o un
`span rounded-full px-2.5 py-0.5 text-[11px] font-semibold`).

Insignias:
- Registro SIS: `No informado` (slate), `Declarado` (amber), `Verificado` (teal), `Rechazado` (rose).
- Firma: `Pendiente` (amber), `Registrada` (teal), `Revocada` (rose).

### 5.4 `SeccionRegistroSis.jsx`

Campos:
- **N° de registro** (`ShadcnInput`, solo dígitos, 1–10 caracteres, `inputMode="numeric"`). Opcional.
- **Certificado de inscripción** (opcional): PDF/JPG/PNG ≤ 5 MB. Zona de arrastre + botón "Adjuntar"; en móvil solo botón. Muestra nombre y peso; botón "Quitar".
- Texto de ayuda: *"Verificable en rnpi.superdesalud.gob.cl. Adjuntar el certificado permite marcarlo como verificado."* (enlace `target="_blank" rel="noopener noreferrer"`).
- **Sin scraping, sin consultas automáticas** a la Superintendencia.
- Solo administrador: botones **"Marcar verificado"** y **"Rechazar"** (con motivo obligatorio, textarea 3 filas). Muestra "Verificado por {nombre} el {formatearInstanteConOffset}".
- Al cambiar el número, el estado vuelve a `declarado` (lo decide el backend; el front solo lo refleja).

Llamadas: `apiFirma.actualizarRegistroSis(formData)`, `apiFirma.verificarRegistroSis({...})`.

### 5.5 Lista de profesionales — `app/dashboard/profesionales/page.jsx`

- Si `esAdministrador` → todas las tarjetas (como hoy).
- Si el usuario tiene `idProfesional` y no es administrador → **solo su tarjeta**, y el botón "Eliminar" oculto.
- En la tarjeta, bajo el RUT, una fila nueva con dos micro-insignias: **Firma** y **Reg. SIS**, con los mismos colores de §5.3. Si falta alguna, la tarjeta del propio profesional muestra un aviso `bg-amber-50 text-amber-800 rounded-xl px-3 py-2 text-[12px]`: *"Completa tu firma y tu N° de registro para emitir documentos firmados."* con botón "Completar" que abre el modal ya expandido en la sección faltante.
- El estado de firma/registro llega en `seleccionarTodosProfesionales` (columnas nuevas, ver `02`). Los profesionales antiguos sin esas columnas se muestran como "Pendiente"/"No informado".

### 5.6 `PadFirma.jsx`

Captura con Pointer Events (mouse, dedo, lápiz). Referencia funcional: el
prototipo HTML del cliente (solo lógica; la UI se hace con nuestro stack).

Props: `tinta` (`"azul"|"negro"`), `onCambio({ vacio, trazos })`, `deshabilitado`.

- Lienzo con `touch-action: none`, `ResizeObserver` para adaptarse al ancho del contenedor, escala por `devicePixelRatio`, redibuja desde los vectores al redimensionar (no se pierde la firma al girar el teléfono).
- Alto: `h-44` (176 px) en móvil, `sm:h-52` (208 px).
- Fondo blanco con línea guía punteada al 70 % del alto y texto tenue "Firme aquí" que desaparece al primer trazo.
- Trazos `lineCap/lineJoin = "round"`, grosor 2.4 px CSS, suavizado con puntos medios (curvas cuadráticas).
- Se guardan los vectores: `[[{x,y,t}, ...], ...]` en coordenadas CSS.
- Barra inferior: selector de tinta (dos círculos 28 px: **Azul `#1b3fa8`**, **Negro `#15131f`**, con `aria-pressed` y anillo en el activo), botón **Deshacer** y **Limpiar** (deshabilitados sin trazos), contador "3 trazos".
- Cambiar la tinta redibuja todos los trazos con el nuevo color (una firma, un color).
- Validación mínima antes de permitir guardar: ≥ 1 trazo, ≥ 20 puntos, bbox ≥ 60×20 px CSS. Mensaje: *"La firma es demasiado pequeña o simple."*

### 5.7 `procesarTrazo.js` (vista previa local)

Funciones puras, probables con `node --test`:

```js
export function calcularCajaTinta(imageData)          // bbox de píxeles con alfa > 8
export function recortarYNormalizar(canvas, { alto: 200, anchoMax: 600, margen: 7 })
  // → { blob: PNG con alfa, ancho, alto }
```

Sirve **solo** para mostrar la vista previa y enviar un PNG razonable. **El
servidor vuelve a recortar y normalizar** (regla: no se confía en el cliente).

### 5.8 `SeccionFirmaElectronica.jsx` — flujo del profesional

Estados:

1. **Sin firma:** texto explicativo corto + `PadFirma` + casilla obligatoria
   *"He leído y acepto el Acta de adhesión a firma electrónica simple (Ley 19.799)"* con enlace **"Ver acta"** (abre `ActaAdhesionModal` con el texto vigente de `apiFirma.seleccionarActaVigente()`; muestra versión).
   Botón **"Registrar firma"** (negro, `h-11 rounded-xl`) habilitado solo con firma válida + acta aceptada.
2. **Al pulsar:** se llama `apiFirma.registrarFirma(formData)` envuelto en
   `useReverification` de Clerk (§7). Si Clerk pide verificación, aparece su
   ventana (contraseña o código). Al confirmar, la llamada se reintenta sola.
3. **Firma registrada:** miniatura (imagen pedida a `seleccionarImagenFirma`, mostrada con `URL.createObjectURL`, revocada al desmontar), tinta, fecha de registro con `formatearInstanteConOffset`, versión del acta. Botones **"Reemplazar firma"** (vuelve al estado 1; la anterior queda `reemplazada`) y **"Revocar"** (confirmación en línea, sin `window.confirm`).
4. **Vista administrador:** solo insignia y fecha. Sin imagen.

Texto fijo bajo el pad (pequeño, slate-500):
*"Tu trazo es la representación visual de tu firma. La validez legal la da el registro de evidencia que se genera cada vez que firmas: identidad verificada, fecha y hora del servidor y huella SHA-256 del documento."*

### 5.9 Aviso en la campana — `usePendientesProfesional.js`

Calcula desde el profesional de la sesión: `{ faltaFirma, faltaRegistroSis }`.
`NotificationBell` antepone un ítem fijo (no persistido, no se marca como leído)
cuando hay pendientes: *"Completa tu firma electrónica y N° de registro"* →
navega a `/dashboard/profesionales?completar=firma`. La página lee el parámetro y
abre el modal expandido. Si el profesional no tiene agenda asignada, no aparece.

---

## 6. Motor de documentos — `src/lib/documentos/motorDocumento.js`

Objetivo: que lo nuevo quede **mejor estructurado que lo actual**. Ningún texto
se monta sobre otro, los saltos de página se calculan antes de dibujar y todos
los documentos comparten jerarquía visual.

### 6.1 API

```js
const motor = crearDocumento({ formato: "letter", margen: 18, empresa, logo });

motor.encabezado({ titulo, subtitulo, folio, fechaEmision });   // repetido en cada página
motor.seccion("Datos del paciente");
motor.tablaDatos([["Nombre", "..."], ["RUT", "..."]], { columnas: 2 });
motor.parrafo(texto, { tamano: 10 });
motor.lista(items);
motor.tabla({ cabeceras, filas, anchos });                        // jspdf-autotable
motor.espacio(4);
motor.reservarZonaFirma({ modo: "fes" | "manuscrita" });          // SIEMPRE el último bloque
const { blob, paginas, zonaFirma } = motor.finalizar();
```

### 6.2 Reglas de diagramación

- Cada bloque implementa `medir()` y `dibujar()`. El motor llama a `medir()`, y
  si no cabe en lo que queda de página (descontando pie de página), inserta salto
  **antes** de dibujar. Párrafos largos se parten por líneas; tablas usan el salto
  nativo de autotable con `margin.top` = alto del encabezado.
- Tipografía: Helvetica; título 15 pt bold, sección 10.5 pt bold con filete
  inferior slate-200, cuerpo 10 pt, notas 8 pt. Interlineado 1.35.
- Colores: texto `[30,41,59]`, secundario `[100,116,139]`, filetes `[226,232,240]`.
- Pie de página en cada hoja: "{empresa} · Página n de N" (8 pt) + código de verificación cuando existe.
- `reservarZonaFirma` garantiza que la zona completa quepa en la última página;
  si no cabe, salta de página. Devuelve `zonaFirma = { pagina, x, y, ancho, alto }`
  en mm, que se envía al backend para estampar exactamente ahí.

### 6.3 Zona de firma — `src/lib/documentos/zonaFirma.js`

Medidas compartidas con el backend (copiar idénticas en `03`):

```js
export const ZONA_FIRMA = {
  alto: 56,             // mm
  anchoQr: 30,          // mm, columna derecha
  separacionQr: 6,      // mm
  altoGrafia: 18,       // mm, imagen sobre la línea
  anchoMaxGrafia: 70,   // mm
};
```

Diseño (según la maqueta aprobada):

```
┌────────────────────────────────────────────────────────────┬──────────┐
│                 [grafía PNG, 18 mm de alto]                │ ┌──────┐ │
│ ──────────────────────────────────────────────             │ │  QR  │ │
│ María González Rivas                     (10 pt bold)      │ └──────┘ │
│ Cirujano dentista                        (9 pt)            │ A7K2-9QX4│
│ Reg. Superintendencia de Salud N° 438291 (9 pt)            │          │
│ Firmado electrónicamente · FES, Ley 19.799   (8 pt gris)   │          │
│ 22-10-2026 22:25:57 (UTC-03:00) · Código A7K2-9QX4         │          │
│ Consentimiento v3 · plantilla base + anexo armonización    │          │
└────────────────────────────────────────────────────────────┴──────────┘
```

- **Modo `fes`:** el front deja la zona **en blanco** con un marco tenue de
  borrador y el texto "Vista previa — se completará al firmar" **solo en la
  previsualización local**; el PDF que se envía al backend lleva la zona vacía
  (sin marco). El servidor dibuja todo lo de arriba.
- **Modo `manuscrita`:** el front dibuja con `dibujarBloqueFirma` extendido:
  línea para firma (sin grafía), nombre, RUT, profesión, **"Reg. Superintendencia
  de Salud N° …"** (si existe), leyenda **"Firma y timbre del profesional"**,
  empresa. Sin QR, sin leyenda FES. `pdfFirma.js` recibe una prop nueva
  `registroSis` (línea omitida si está vacía).
- Líneas que no existen se omiten sin dejar huecos (sin registro SIS no aparece "Reg. … N°").

---

## 7. Reverificación con Clerk

No se cierra sesión ni se pide usuario. Funcionamiento:

- La acción sensible (registrar firma, firmar documento) se envuelve con
  `useReverification` de `@clerk/nextjs` (instalado: 6.39.4).
- El backend exige que la última verificación del usuario tenga **≤ 10 minutos**
  (claim `fva` del token de sesión). Si no, responde 403 con la señal de
  reverificación de Clerk (forma exacta en `02`, §2.3).
- `useReverification` detecta esa respuesta, muestra la ventana de Clerk
  (contraseña o código por correo, según lo configurado en la instancia), y
  **reintenta la misma llamada** al confirmar. Si el usuario cancela, la promesa
  se rechaza con `isReverificationCancelledError` → `toast("Firma cancelada")`.
- Firmar 8 documentos seguidos dentro de 10 minutos pide la verificación una vez.
- Requisito en el dashboard de Clerk de **cada instancia**: tener habilitada la
  verificación por contraseña y/o código de correo (ya lo está para el login).

```js
// patrón
const firmar = useReverification((id) => apiFirma.firmarDocumento({ id_documento: id }));
```

**Importante:** el `fetcher` pasado a `useReverification` debe **devolver el JSON
parseado** (no el `Response`), porque Clerk inspecciona el cuerpo.

---

## 8. Cliente de API — `src/lib/firma/apiFirma.js`

Primer cliente centralizado del proyecto, acotado a esta integración.

```js
export function crearApiFirma(getToken) {
  // getToken viene de useAuth() de Clerk
  // Base: process.env.NEXT_PUBLIC_API_URL
  // Siempre: Authorization: Bearer <token>, fetchConCarga, mode:"cors"
  // Devuelve SIEMPRE el JSON parseado (o Blob en endpoints binarios)
  // Si NEXT_PUBLIC_FIRMA_MOCK === "1" → delega en mockFirma.js
}
```

Hook de conveniencia: `useApiFirma()` → `crearApiFirma(useAuth().getToken)` memorizado.

Métodos (rutas y formas exactas en `02`):

| Método | Ruta backend | Respuesta |
|---|---|---|
| `seleccionarEstadoFirma({id_profesional})` | `POST /firmaProfesional/seleccionarEstadoFirma` | `{message:true, firma:{...}\|null, registroSis:{...}}` |
| `seleccionarActaVigente()` | `POST /firmaProfesional/seleccionarActaVigente` | `{message:true, acta:{version, titulo, cuerpo, sha256}}` |
| `registrarFirma(formData)` | `POST /firmaProfesional/registrarFirma` | `{message:true, firma:{...}}` |
| `seleccionarImagenFirma({id_profesional})` | `POST /firmaProfesional/seleccionarImagenFirma` | `Blob image/png` |
| `revocarFirma({id_profesional, motivo})` | `POST /firmaProfesional/revocarFirma` | `{message:true}` |
| `actualizarRegistroSis(formData)` | `POST /profesionales/actualizarRegistroSis` | `{message:true, registroSis:{...}}` |
| `verificarRegistroSis({...})` | `POST /profesionales/verificarRegistroSis` | `{message:true, registroSis:{...}}` |
| `prepararDocumento(formData)` | `POST /documentos/prepararDocumento` | `{message:true, documento:{...}}` |
| `seleccionarBorrador({id_documento})` | `POST /documentos/seleccionarBorrador` | `Blob application/pdf` |
| `firmarDocumento({id_documento})` | `POST /documentos/firmarDocumento` | `{message:true, documento:{...}}` |
| `descargarDocumento({id_documento, accion})` | `POST /documentos/descargarDocumento` | `Blob application/pdf` |
| `enviarDocumentoCorreo({id_documento, correo?})` | `POST /documentos/enviarDocumentoCorreo` | `{message:true, enviadoA}` |
| `listarDocumentosPaciente({id_paciente})` | `POST /documentos/listarDocumentosPaciente` | `{message:true, documentos:[...]}` |
| `listarPendientesFirma()` | `POST /documentos/listarPendientesFirma` | `{message:true, documentos:[...]}` |
| `anularDocumento({id_documento, motivo})` | `POST /documentos/anularDocumento` | `{message:true}` |
| `listarConsentimientosPaciente({id_paciente})` | `POST /consentimientos/listarPorPaciente` | `{message:true, aceptaciones:[...]}` |
| `descargarConsentimiento({id_aceptacion, accion})` | `POST /consentimientos/descargarAceptacion` | `Blob application/pdf` |
| `enviarConsentimientoCorreo({id_aceptacion})` | `POST /consentimientos/enviarAceptacionCorreo` | `{message:true, enviadoA}` |

Manejo de errores: mapa único `MENSAJES_ERROR` de códigos del backend (`sindata`,
`noAutorizado`, `sinPermiso`, `firmaInexistente`, `firmaNoActiva`,
`documentoYaFirmado`, `registroSisRequerido`, `pngInvalido`, `pdfInvalido`,
`tipoDocumentoNoPermitido`, `serverError`) a textos en español para `toast`.

`mockFirma.js` devuelve exactamente las mismas formas, con latencia simulada de
400–900 ms, y estado en memoria (no `localStorage`). Permite probar todo el front
—incluida la reverificación, simulando el 403 una vez— antes del backend.

---

## 9. Emisión de documentos — `EmisionDocumento.jsx`

Panel reutilizable que se monta en cada pantalla que hoy genera un PDF.

### 9.1 Props

```js
<EmisionDocumento
  tipoDocumento="cotizacion"          // ver constantes.TIPOS_DOCUMENTO
  titulo="Cotización N° 48"
  referencia={{ tabla: "cotizaciones_pacientes", id: 48 }}
  paciente={{ id_paciente, nombre, correo }}
  profesional={profesionalAsignado}   // automático: el de la agenda (idProfesionalAgenda) o el elegido en el documento
  generarCuerpoPdf={async ({ modo }) => blob}  // usa motorDocumento; modo "fes"|"manuscrita"
  metadatos={{ plantillas: [...], resumen: "..." }} // snapshot para la evidencia
/>
```

### 9.2 Flujo y estados

```
[Previsualizar] → [Firmar con FES] → [Firmado ✓] → [Enviar al correo] · [Descargar] · [Imprimir]
       └──────────── [Imprimir para firma de puño y letra] (siempre disponible)
```

1. **Previsualizar:** genera el cuerpo en modo `fes` y lo muestra en `VisorPdf`
   con la zona de firma marcada como borrador. Botón "Firmar con FES".
2. **Firmar con FES:**
   - Precondiciones visibles: profesional con firma activa (si no: aviso
     *"El profesional aún no registra su firma electrónica"* y solo queda la
     salida manuscrita). Si quien opera **no es** el profesional firmante, el
     botón dice **"Enviar a firma de {nombre}"** y solo llama a
     `prepararDocumento`; el documento queda en la bandeja del profesional (§9.5).
   - Si quien opera es el firmante: `prepararDocumento` (sube el PDF borrador +
     `zonaFirma` + metadatos) → `firmarDocumento` (envuelto en `useReverification`)
     → `descargarDocumento({accion:"visto"})` → muestra el PDF **final del servidor**.
3. **Firmado:** insignia verde, código de verificación, fecha con
   `formatearInstanteConOffset(documento.firmado_at)`, huella abreviada
   (`a3f9…7c21`, con botón copiar la completa). Acciones:
   - **Enviar al correo** — precarga `paciente.correo`, editable con validación;
     confirma en línea; llama `enviarDocumentoCorreo`.
   - **Descargar** — `descargarDocumento({accion:"descargado"})`.
   - **Imprimir** — `descargarDocumento({accion:"impreso"})` → `imprimirPdf(blob)`.
4. **Imprimir para firma de puño y letra:** genera el cuerpo en modo
   `manuscrita` **en el navegador** e imprime sin descargar. No pasa por el
   backend de firma y **no genera evidencia FES** (es un documento para firmar en
   papel). Registro de bitácora opcional: ver decisión abierta D6.

### 9.3 Recetas: solo impresión para firma de puño y letra

Las recetas **no usan `EmisionDocumento`** ni ningún endpoint de firma. Componente
liviano `ImpresionManuscrita.jsx` (`src/Componentes/documentos/`):

- Un solo botón principal **"Imprimir para firmar"** (negro, `h-11 rounded-xl`,
  ancho completo en móvil) que genera el PDF con `motorDocumento` en modo
  `manuscrita` y llama a `imprimirPdf(blob)`. No descarga el archivo.
- Nota fija bajo el botón (12 px, slate-500): *"Las recetas se firman de puño y
  letra. La firma electrónica simple no es válida para su dispensación en farmacia."*
- El pie usa `dibujarBloqueFirma` con línea para firma, nombre, RUT, profesión,
  N° de registro de la Superintendencia (si existe) y "Firma y timbre del
  profesional". Sin QR, sin leyenda FES, sin grafía.
- Se elimina el botón actual de descarga en estas tres pantallas (decisión
  abierta D5 si se quiere conservar la descarga).
- No existe ninguna casilla de autorización ni declaración del profesional para
  firmar recetas electrónicamente: no tendría efecto legal.

### 9.4 `imprimirPdf.js` — imprimir sin descargar

```js
export async function imprimirPdf(blob) {
  // Escritorio: iframe oculto con URL.createObjectURL(blob) → iframe.contentWindow.print()
  // iOS/Android: los iframes con PDF no imprimen de forma confiable →
  //   abrir el blob en una pestaña nueva (window.open) para que el usuario use "Imprimir/Compartir".
  // Revocar la URL 60 s después. Nunca crear <a download>.
}
```

Detección: `/iPad|iPhone|iPod|Android/i.test(navigator.userAgent)` o
`matchMedia("(pointer: coarse)")`.

### 9.5 Bandeja del profesional — `/dashboard/documentosPorFirmar`

- Lista de `listarPendientesFirma()`: tarjetas con tipo, paciente (nombre), quién
  lo preparó, hace cuánto. Botón **"Revisar y firmar"** → `VisorPdf` del borrador
  (`seleccionarBorrador`) + botón firmar (mismo flujo de §9.2).
- Agregar la ruta en `src/lib/dashboard-access.js` para los roles clínicos y al
  menú lateral con contador.
- Contador en la campana: "Tienes N documentos por firmar".

### 9.6 `VisorPdf.jsx`

- Escritorio (`≥ 768 px`): `<iframe>` con blob URL, alto `70dvh`.
- Móvil: render con `pdfjs-dist` página por página en `<canvas>` a ancho completo
  (los iframes de PDF no se ven en iOS Safari). Carga diferida de páginas.
- Estados: cargando (`SkeletonLoader`), error con reintento.

### 9.7 Integración en las pantallas existentes

Orden (de menor a mayor riesgo, todo antes del 1-dic):

| # | Pantalla | Tipo | Notas |
|---|---|---|---|
| 1 | `detalleCotizacion/[id_cotizacion_paciente]` | `cotizacion` | Ya tiene envío por correo; reemplazar por `enviarDocumentoCorreo` del documento firmado |
| 2 | `presupuestoTratamiento` | `presupuesto` | |
| 3 | `examenDocumento` | `orden_examen` | |
| 4 | `FichasPacientes/[id_paciente]` | `ficha_clinica` | |
| 5 | Carpeta del paciente | `consentimiento_*` | §10.3 |
| 6 | `recetaPacientes/[id_paciente]` | — (sin FES) | Solo `ImpresionManuscrita` (§9.3) |
| 7 | `recetaRapida` | — (sin FES) | Solo `ImpresionManuscrita` |
| 8 | `recetaLentes` | — (sin FES) | Solo `ImpresionManuscrita` |

En las pantallas 1–5: extraer la construcción actual del PDF a
`generarCuerpoPdf({modo})` usando `motorDocumento`, eliminar el pie dibujado a
mano y montar `EmisionDocumento`. El botón actual "Descargar PDF" se reemplaza por
el panel. En las recetas (6–8) se usa el mismo motor en modo `manuscrita`, pero
solo con el botón de impresión. `finanzas` y `periodontogramaPaciente/archivos.mjs` quedan fuera (no
son documentos al paciente).

---

## 10. Consentimientos en la reserva pública

### 10.1 `ConsentimientosReserva.jsx`

Se monta al final del paso "Tus datos" en **ambos** flujos de reserva.

```
☐ Acepto la política de privacidad y autorizo el tratamiento     Leer política
  de mis datos personales y de salud
  Tu aceptación queda registrada con fecha y hora…
  Derechos y deberes del paciente                                 (enlace, sin casilla)
```

- **Una sola casilla obligatoria: la política de privacidad**, desmarcada por defecto (Ley 21.719: consentimiento libre, específico, inequívoco; no premarcado). Bloquea "Confirmar", "Pagar" y "Finalizar" hasta marcarla.
- **"Derechos y deberes del paciente"** (Ley 20.584) va más abajo como **enlace de texto, sin casilla**: abre la carta en el mismo diálogo, sin botón "Acepto". La ley exige informarlos, no aceptarlos; el consentimiento de cada procedimiento se firma aparte en la consulta.
- Qué texto lleva casilla lo define `CODIGOS_OBLIGATORIOS` en `src/lib/consentimientos/textosLegales.js` (y su copia en el backend, `ConsentimientosController.js`). Solo esos se envían y se registran.
- Interruptor propio: `NEXT_PUBLIC_CONSENTIMIENTOS_HABILITADOS=1` registra la aceptación en el backend (sin él, la casilla igual es obligatoria pero no queda registro en el servidor).
- Estilo de la página pública (`caja`, `text-tinta-2`, error `text-[#e30000]`); casilla nativa de 20 px con `accent-color` del tema, área táctil ≥ 44 px.
- "Ver política" / "Ver consentimiento" abren un diálogo (hoja inferior en móvil) con el texto **vigente** obtenido de `GET /consentimientos/seleccionarVigentes` (público), mostrando título, versión y fecha de vigencia. El texto se interpola con datos de la clínica (`datosEmpresa`: razón social, dirección, correo de contacto) y del profesional elegido.
- `confirmar()` en `Reserva.jsx` no avanza si falta alguna casilla (marca error y hace scroll).
- Flujo de guardado:
  1. Antes de crear la reserva o la orden de pago: `POST /consentimientos/registrarAceptacion` con los datos del paciente, ambas plantillas (`id_plantilla`, `version`, `sha256` recibidos en `seleccionarVigentes`) e `id_profesional` → `{message:true, token_aceptacion}`.
  2. El `token_aceptacion` se agrega al payload de `insertarReservaPacienteFicha` y de `create-order` (campo opcional nuevo). El backend vincula la aceptación con la reserva y el paciente.
- **Fecha, hora e IP las fija el servidor.** El front no envía fecha.

### 10.2 Textos

El texto legal es del cliente y lo carga el backend (tabla de plantillas). El
front trae un **texto de respaldo** solo para el modo mock. Debe cubrir:
- **Datos (Ley 21.719 / 19.628):** responsable (clínica) y encargado (NativeCode), finalidad (agenda, ficha clínica, comunicaciones de la atención), datos sensibles de salud, base de licitud (consentimiento explícito), plazo de conservación (ficha clínica: mínimo 15 años, Ley 20.584 art. 13), derechos (acceso, rectificación, supresión, oposición, portabilidad, bloqueo), cómo ejercerlos (correo de la clínica), revocabilidad, transferencias a proveedores (alojamiento, correo, WhatsApp).
- **Derechos y deberes del paciente (Ley 20.584), solo lectura:** trato digno, privacidad, información sobre su salud y sobre los valores, aceptar o rechazar procedimientos (cada uno con su consentimiento informado), acceso a la ficha clínica, reclamos (y Superintendencia de Salud); deberes de veracidad, respeto, cuidado de las instalaciones y aviso de inasistencia.

### 10.3 Carpeta del paciente — `ListaDocumentosPaciente.jsx`

En `app/dashboard/paciente/[id_paciente]` (y acceso desde la ficha), sección
**"Documentos y consentimientos"**:
- Pestañas (segmentado, desplazable en móvil): **Documentos firmados** · **Consentimientos**.
- Cada ítem: tipo, título, fecha (`formatearInstanteConOffset`), firmante, código, `EstadoDocumentoBadge`.
- Acciones: **Ver** (visor), **Enviar al correo**, **Descargar**, **Imprimir**.
- Consentimientos: "Ver consentimiento informado" muestra el PDF generado por el
  servidor al momento de la aceptación, con el bloque de aceptación del paciente:
  nombre, documento, fecha y hora con desfase, método ("Aceptación electrónica en
  formulario web"), versión del texto, código y QR.

---

## 10.5 Pantalla de procedimientos del consentimiento informado

Ruta: `/dashboard/procedimientosConsentimiento` (menú **Plantillas → Consentimientos
informados**). Archivo: `src/app/dashboard/procedimientosConsentimiento/page.jsx`.

**Qué hace.** La clínica crea sus propios procedimientos (anexos del consentimiento
informado) llenando campos fijos; el texto se arma solo con el formato de siempre.
Editar publica una versión nueva; lo firmado conserva la versión que leyó el paciente.
Los procedimientos aparecen en el selector del panel de consentimiento de la carpeta
del paciente (`ConsentimientoInformadoPanel.jsx`, vía `hooks/useProcedimientos.js`).

**Quién.** Administradores (y el técnico NativeCode, como soporte) crean, editan y
retiran. Los profesionales consultan (ven la lista, el contenido y el historial).

**Piezas.**

| Archivo | Rol |
|---|---|
| `src/lib/consentimientos/procedimientos.js` | Campos fijos (`CAMPOS_ANEXO`), armado del texto (`construirCuerpoAnexo`), lectura para editar (`camposDesdeCuerpo`), validación (`validarProcedimiento`). **El backend usa una copia exacta** (`services/firma/anexos.js`) |
| `src/lib/consentimientos/apiProcedimientos.js` | Cliente de `/procedimientos/*`; en modo de prueba, almacén en memoria con los 14 anexos de ejemplo |
| `src/hooks/useProcedimientos.js` | Lista vigente + API; lo usan la pantalla y el panel |

**Campos (Ley 20.584, art. 14).** En qué consiste\*, riesgos frecuentes\* (uno por
línea), riesgos poco frecuentes\* (uno por línea), alternativas\*, contraindicaciones,
si no se realiza\*, cuidados posteriores. (\* obligatorio). Cada campo muestra una
ayuda y un ejemplo real como texto de ejemplo.

**Diseño (estilo Apple, sin colores genéricos).**

- **Estructura:** título grande (32 px, bold, `#1D1D1F`) con antetítulo azul
  "Configuración clínica"; aviso informativo con fondo `#007AFF` al 6 %; buscador
  estilo iOS (`#767680` al 12 %); filtros por especialidad como cápsulas (activa en
  `#1D1D1F`); **lista agrupada tipo iOS**: encabezado de grupo en mayúsculas
  `#6E6E73`, tarjetas blancas de 20 px de radio sobre `#F2F2F7`, filas con ícono
  cuadrado de color, separadores con sangría y chevron `#C7C7CC`.
- **Color por especialidad:** paleta del sistema de Apple, asignada siempre igual al
  mismo nombre: `#007AFF` azul, `#5856D6` índigo, `#AF52DE` morado, `#FF2D55`
  rosado, `#FF9500` naranjo, `#34C759` verde, `#30B0C7` turquesa, `#00C7BE`
  menta, `#5AC8FA` celeste, `#A2845E` café. **Sin rojo**: en iOS significa error
  o acción destructiva, y aquí solo se usa en "Retirar".
- **Hojas (modales):** hoja inferior en el celular con tirador y esquinas de 24 px;
  diálogo centrado en escritorio. Fondo `#F2F2F7`, botón de cerrar circular gris,
  pie translúcido con desenfoque. Botón principal en cápsula `#007AFF` (hover
  `#0062CC`), secundario como texto azul, destructivo en `#FF3B30`.
- **Editor:** en escritorio, formulario a la izquierda y **vista previa en vivo** a la
  derecha ("Así lo leerá el paciente"); en el celular, control segmentado iOS
  "Editar | Vista previa". Etiquetas "Obligatorio" (azul) y "Opcional" (gris).
- **Detalle:** segmentado "Contenido | Historial"; el historial muestra cada versión
  (vigente en verde `#34C759`, retirada en gris), quién la publicó y cuándo.
- **Tipografía:** `font-system-apple` (SF en Apple). Grises de texto: `#1D1D1F`
  principal, `#3A3A3C` cuerpo, `#6E6E73` secundario, `#86868B` ayudas,
  `#AEAEB2` texto de ejemplo.
- **Responsive verificado** con capturas reales a 1280 px y 390 px.

**Reglas.** No se permiten dos procedimientos vigentes con el mismo nombre en la
misma especialidad (sin distinguir mayúsculas ni tildes): se pide editar el existente.
Una nueva versión idéntica a la vigente se rechaza ("No hay cambios para publicar").
Retirar no borra: deja de ofrecerse en consentimientos nuevos.

## 11. Verificación pública — `app/(public)/verificar/[codigo]/page.jsx`

- Server component; consulta `GET /verificacion/:codigo` (público).
- Muestra **solo**: documento existe/no existe, tipo, emisor (nombre, profesión,
  N° registro SIS), clínica, fecha y hora de firma con desfase, código, estado
  (vigente / anulado). **Nunca** nombre del paciente ni contenido clínico.
- Opción "Comprobar un archivo": `<input type="file" accept="application/pdf">` → `POST /verificacion/compararHash` (multipart) → "El archivo coincide con el documento firmado" (verde) o "El archivo NO coincide: fue modificado o no es el original" (rojo).
- `robots: noindex`. Diseño de la página pública (clases `caja`, tipografía del sitio). Responsive.
- El QR del PDF apunta a `{URL pública de la clínica}/verificar/{codigo}`.

---

## 12. Decisiones registradas y abiertas

**Registradas**

| # | Decisión |
|---|---|
| R1 | MySQL 8 existente; sin cambio de motor |
| R2 | Aislamiento por instancia (una BD por clínica) |
| R3 | Profesión/Especialidad: texto libre, 65 caracteres |
| R4 | Firma y registro SIS opcionales, en secciones expandibles |
| R5 | Solo el profesional dibuja su firma, desde su sesión |
| R6 | Reverificación Clerk, ventana 10 min |
| R7 | Camino B: el front genera el cuerpo; el servidor estampa, hashea y guarda |
| R8 | Recetas fuera de la FES: solo "Imprimir para firmar" de puño y letra. Sin declaraciones ni autorizaciones sustitutas |
| R9 | Dos casillas separadas en la reserva pública |
| R10 | Pasaporte para pacientes extranjeros |

**Abiertas (necesitan confirmación)**

| # | Pregunta | Propuesta |
|---|---|---|
| D1 | Ventana de reverificación | 10 min |
| D2 | ¿El administrador puede anular un documento firmado? | Sí, con motivo; el documento no se borra, queda "anulado" y la verificación pública lo muestra |
| D3 | Textos legales definitivos (política de privacidad y derechos y deberes) | El cliente los entrega o valida con su abogado; dejamos borrador |
| D4 | ¿Quiénes son "administrador" para verificar registro SIS? | `admin`, `super-usuario-nativecode`, `administrador-clinico` |
| D5 | ¿Conservar el botón de descarga en las recetas además de imprimir? | No; solo imprimir, para que el archivo no quede en el equipo |
| D6 | ¿Registrar en bitácora las impresiones manuscritas? | Sí, evento liviano sin evidencia FES |
| D7 | URL pública de verificación por clínica | Variable `URL_PUBLICA_SITIO` en el backend de cada instancia |

---

## 13. Criterios de aceptación de la fase 1 (frontend)

1. `npm run build` y `npm run fechas` sin errores; `npm run lint` sin errores nuevos.
2. Con `NEXT_PUBLIC_FIRMA_MOCK=1` se puede: registrar firma (azul y negro), ver
   la reverificación simulada, preparar, firmar, ver el PDF "final", enviar,
   descargar e imprimir; y aceptar ambos consentimientos en la reserva.
3. `RutInput` rechaza `12.345.678-0` y acepta `12.345.678-5`; modo pasaporte operativo en formularios de paciente.
4. Un administrador nunca ve el pad ni la imagen de la firma.
5. Un profesional solo ve su tarjeta en `/dashboard/profesionales`.
6. Ningún texto del PDF se superpone (probar nombre de 60 caracteres, especialidad de 65, 40 ítems de tabla, párrafo de 3 páginas).
7. Capturas reales a 360/390/768/1280 px de: modal con ambas secciones abiertas, pad, panel de emisión en cada estado, bandeja, carpeta del paciente, reserva con consentimientos, verificación pública.
8. Las fechas de firma se ven idénticas con `TZ=America/Santiago`, `UTC`, `Asia/Tokyo`, `Pacific/Niue`, en enero y julio.
9. Nada del front calcula el hash oficial, fija la hora de firma ni dibuja la grafía en un PDF FES.
10. Las tres pantallas de receta no muestran ninguna opción de firma electrónica; solo "Imprimir para firmar".

---

## 14. Estado de la implementación (rama `feat/firma-fes-front`)

### 14.1 Activación por variables de entorno

| Variable | Efecto |
|---|---|
| *(ninguna)* | Producción actual intacta: las pantallas conservan su flujo anterior. Sí quedan activos el módulo 11, el pasaporte y la impresión de recetas |
| `NEXT_PUBLIC_FIRMA_MOCK=1` | Todo el flujo funciona con el backend simulado (`src/lib/firma/mockFirma.js`), incluido el estampado real del PDF con `pdf-lib` |
| `NEXT_PUBLIC_FIRMA_MOCK_REVERIFICACION=1` | En mock, la primera firma pide la reverificación real de Clerk |
| `NEXT_PUBLIC_FIRMA_HABILITADA=1` | Usa el backend real. Activarla en cada instancia cuando su backend tenga la fase 3 desplegada |

### 14.2 Hecho

| Área | Archivos |
|---|---|
| RUT módulo 11 + pasaporte | `src/lib/rut.js`, `src/Componentes/RutInput.jsx`, `NuevoPacienteModal.jsx`, `paciente/[id_paciente]`, `ProfesionalModal.jsx`, ambas reservas públicas |
| Fechas con desfase | `formatearInstanteConOffset`, `desfaseZona` en `src/lib/fechas.js` + `tests/rutYFechasFirma.test.mjs` |
| Capa de datos | `src/lib/firma/{constantes,apiFirma,mockFirma,errores,procesarTrazo,actaAdhesion}.js`, `src/hooks/{useApiFirma,useSesionProfesional,useDatosEmpresa,usePendientesProfesional}.js` |
| Firma del profesional | `src/Componentes/firma/{PadFirma,SeccionFirmaElectronica,SeccionRegistroSis,SeccionExpandible,InsigniaEstado}.jsx`, integrado en `ProfesionalModal.jsx` |
| Profesionales | Filtro "solo mi tarjeta", insignias, aviso "Completar", `?completar=firma\|registro` |
| Motor de documentos | `src/lib/documentos/{motorDocumento,zonaFirma,estamparFirmaPdf,imprimirPdf}.js`, `generadores/cotizacion.js` |
| Emisión | `src/Componentes/documentos/{EmisionDocumento,VisorPdf,TextoLegalModal,ImpresionManuscrita,ListaDocumentosPaciente}.jsx` |
| Pantallas | Cotización con FES; las 3 recetas solo con impresión; bandeja `/dashboard/documentosPorFirmar`; carpeta del paciente; `/verificar/[codigo]`; aviso en la campana |
| Consentimientos | `src/lib/consentimientos/{textosLegales,apiConsentimientos}.js`, `ConsentimientosReserva.jsx` en ambas reservas |
| Estilo | Colores de sistema de Apple (gris `#F2F2F7`, azul `#007AFF`, verde `#34C759`, rojo `#FF3B30`) y tipografía SF (`.font-system-apple`) en todo lo nuevo |

### 14.3 Segunda iteración

| Área | Detalle |
|---|---|
| Documentos con FES | Presupuesto (`generadores/cotizacion.js → generarDocumentoValorizadoPdf`), orden de exámenes (`generadores/ordenExamen.js`) y ficha clínica (`generadores/fichaClinica.js`, acciones "Imprimir · Firmar" en cada ficha) |
| Consentimiento informado | `lib/consentimientos/plantillasProcedimiento.js`: plantilla base + 14 anexos (7 armonización facial, 7 odontología). Panel `ConsentimientoInformadoPanel` en la carpeta del paciente, con representante legal y observaciones del caso. PDF en `generadores/consentimientoInformado.js` con firma del paciente y del profesional |
| Foto del profesional | `Componentes/firma/FotoProfesional.jsx` (recorte cuadrado, Cloudflare Images) en el modal; se muestra en la tarjeta del dashboard y en la página pública |
| Silueta | `Componentes/SiluetaProfesional.jsx` reemplaza las iniciales en el dashboard y la página pública |
| Página pública | Se eliminaron las categorías de profesionales (filtro, franja "especialidades disponibles" y consulta a la API) |

### 14.4 Pendiente

1. ~~Aceptación del paciente con código OTP~~ **Hecho:** `AceptacionPacienteOtp.jsx` integrado en `EmisionDocumento` (prop `requiereAceptacionPaciente`); el motor reserva la zona del paciente junto a la del profesional y `estamparFirmaPdf.js` la estampa. Contrato en `02` §6.9 y lógica de servidor en `03` §7.4.1.
2. Verificación con capturas reales a 360/390/768/1280 px.
3. Backend: aceptar `imagenProfesional` en insertar/actualizar profesional (`02` §5.1).
