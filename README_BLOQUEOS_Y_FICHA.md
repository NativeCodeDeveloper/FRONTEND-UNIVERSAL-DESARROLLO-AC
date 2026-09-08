# Actualización: Bloqueo de Agenda, Edición de Ficha Clínica, Notificaciones, Calendario Público y Agendamiento Múltiple

Este documento describe en detalle los cambios implementados en varios módulos del dashboard y del calendario público. Está pensado para que otro desarrollador (o instancia de Claude) entienda exactamente qué se hizo, por qué, y cómo funciona.

---

## 1. Bloqueo de Agenda — `/dashboard/bloqueosAgenda`

**Archivo:** `src/app/dashboard/bloqueosAgenda/page.jsx`

### 1.1 Qué había antes

La página anterior usaba un selector de rango de fechas (fecha inicio → fecha fin) que generaba **un único registro de bloqueo** en la base de datos abarcando todo el rango. Esto impedía al usuario liberar días individuales dentro de ese rango sin eliminar el bloqueo completo.

### 1.2 Qué se hizo

Se rediseñó completamente el flujo. Ahora **cada día seleccionado genera un registro independiente** en la base de datos (`fechaInicio = fechaFinalizacion = ese día`). Esto permite que el usuario elimine un día específico sin afectar los demás.

### 1.3 Dos modos de selección

#### Modo "Días específicos"
- Muestra un calendario `react-day-picker` con `mode="multiple"`.
- El usuario hace clic en los días que quiere bloquear (pueden ser no consecutivos, ej: solo los miércoles del mes).
- El calendario tiene `disabled={{ before: hoy }}` para impedir seleccionar fechas pasadas.

#### Modo "Rango de fechas"
- El usuario define una fecha de inicio y fin.
- Selecciona los días de la semana (L M X J V S D) que deben incluirse dentro de ese rango.
- Al hacer clic en "Generar días →" se ejecuta `generarDiasDesdeRango()` que usa `eachDayOfInterval` de `date-fns` + filtro `getDay()` para extraer solo los días que coincidan con los días de semana seleccionados.
- Los días generados se **fusionan** con los ya seleccionados sin duplicar (usando `Set` de `toDateString()`).
- Se muestra un toast con cuántos días se agregaron.

> **Caso de uso típico:** bloquear todos los miércoles de junio a diciembre en un solo paso, sin hacer clic uno por uno.

### 1.4 Estado del formulario

```js
const [diasSeleccionados, setDiasSeleccionados] = useState([]);  // Date[]
const [horaInicio, setHoraInicio] = useState("");
const [horaFinalizacion, setHoraFinalizacion] = useState("");
const [motivo, setMotivo] = useState("");
const [id_profesional, setId_profesional] = useState("");
const [modoSeleccion, setModoSeleccion] = useState("especifico"); // "especifico" | "rango"
const [rangoDesde, setRangoDesde] = useState("");
const [rangoHasta, setRangoHasta] = useState("");
const [diasSemanaSeleccionados, setDiasSemanaSeleccionados] = useState([]); // [0..6]
const [cargandoInsercion, setCargandoInsercion] = useState(false);
const [modalEliminarTodos, setModalEliminarTodos] = useState(false); // false | "paso1" | "paso2"
const [cargandoEliminarTodos, setCargandoEliminarTodos] = useState(false);
```

### 1.5 Función de inserción: `insertarBloqueosMultiples()`

- Valida que haya profesional, horas, motivo y al menos un día seleccionado.
- Valida que `horaFinalizacion > horaInicio`.
- Ordena los días ascendente antes de iterar.
- Por cada día ejecuta un `POST /bloqueoAgenda/InsertarBloqueo` con:
  ```json
  {
    "id_profesional": "...",
    "fechaInicio": "2026-06-18",
    "horaInicio": "09:00:00",
    "fechaFinalizacion": "2026-06-18",
    "horaFinalizacion": "14:00:00",
    "motivo": "Vacaciones"
  }
  ```
- Contabiliza `exitosos`, `conflictoReserva` (hay pacientes agendados), `conflictoBloqueo` (ya existe bloqueo).
- Al terminar muestra un toast con el resumen.
- Limpia el formulario completo.

### 1.6 Chips de días seleccionados

Debajo del calendario se muestran chips con el formato `mié 18 jun` (usando `format(dia, "EEE d MMM", { locale: es })`). Cada chip tiene un botón `×` para eliminar ese día individualmente. También hay un botón "Limpiar todo".

### 1.7 Banner de resumen

Cuando hay días seleccionados + horas definidas aparece un banner:

> Se crearán **N** bloqueo(s) independiente(s)
> Horario: 09:00 — 14:00 · Cada día se puede eliminar por separado

### 1.8 Tabla de bloqueos activos

Columnas: **Profesional | Motivo | Día | Horario | Ver**

- Cada fila es un bloqueo independiente.
- Al hacer clic en una fila (o el botón Ver) abre un modal de detalle.
- El filtro de profesional (`useEffect([id_profesional])`) actualiza la tabla automáticamente al seleccionar un profesional.
- La función `recargarBloqueos()` respeta el filtro activo: si hay un profesional seleccionado llama `filtrarPorProfesional(id)`, si no llama `verTodosLosBloqueos()`.

### 1.9 Botón "Eliminar todos" con modal de dos pasos

**Condición de visibilidad:** solo aparece cuando `id_profesional` está seleccionado Y `listaBloqueos.length > 0`. Esto garantiza que nunca se eliminen bloqueos de todos los profesionales por accidente.

**Paso 1 (confirmación):**
- Muestra el nombre del profesional: `listaProfesionales.find(p => String(p.id_profesional) === String(id_profesional))?.nombreProfesional`
- Texto explícito: "Los demás profesionales no serán afectados."

**Paso 2 (confirmación definitiva):**
- Fondo y borde rose para indicar acción destructiva.
- Botón con spinner durante la operación.

**Función `eliminarTodosLosBloqueos()`:**
- Itera `listaBloqueos` haciendo un `POST /bloqueoAgenda/eliminarBloqueo` por cada registro.
- Contabiliza eliminados y errores.
- Al finalizar llama `recargarBloqueos()` para refrescar la tabla respetando el filtro.

### 1.10 Bugs corregidos durante la auditoría

| Bug | Causa | Fix |
|-----|-------|-----|
| Crash al deseleccionar todos los días | `onSelect` de react-day-picker pasa `undefined` cuando el array queda vacío | `onSelect={(days) => setDiasSeleccionados(days ?? [])}` |
| Fechas desfasadas un día en modo rango | `parseISO("2026-06-15")` crea medianoche UTC, que en UTC-3/4 es el día anterior | Reemplazado por `new Date(rangoDesde + "T00:00:00")` para hora local |
| Post-delete mostraba todos los profesionales | `eliminarBloqueo` y `eliminarTodosLosBloqueos` llamaban `verTodosLosBloqueos()` ignorando el filtro activo | Creada función `recargarBloqueos(profId?)` que respeta `id_profesional` |
| Errores de red silenciosos | `verTodosLosBloqueos` y `filtrarPorProfesional` sin `res.ok` check | Agregados los checks con `toast.error` |

### 1.11 Compatibilidad con el calendario público

La lógica del calendario público (`/agendaEspecificaProfersional/[id_profesional]`) que bloquea un día completo si `horaInicio <= "09:00"` y `horaFinalizacion >= "22:00"` **sigue funcionando correctamente**. Con el nuevo esquema de bloqueos por día individual, el while loop del calendario itera una sola vez por registro, lo que produce el mismo resultado que antes.

---

## 2. Edición de Ficha Clínica — `/dashboard/EdicionFicha/[id_ficha]`

**Archivo:** `src/app/dashboard/EdicionFicha/[id_ficha]/page.jsx`

### 2.1 Qué había antes

La página usaba un sistema de estilos antiguo con:
- Fondo con gradiente radial complejo (`radial-gradient` + `linear-gradient`).
- Header de la card con gradiente oscuro `#0f172a → #312e81 → #0891b2`.
- Botón guardar con gradiente `from-indigo-700 to-teal-600`.
- Cards con `border-slate-300`, `shadow-[0_18px_50px_rgba(15,23,42,0.12)]`, `rounded-[24px]`.
- Color primario `text-indigo-700` / `focus:ring-indigo-500`.
- Labels `text-sm font-medium`.

### 2.2 Qué se hizo

Se actualizó únicamente el bloque `return` (JSX) al sistema de diseño actual del dashboard. **La lógica de negocio no fue modificada.**

### 2.3 Sistema de diseño aplicado (consistente con todo el dashboard)

| Elemento | Antes | Ahora |
|----------|-------|-------|
| Fondo | `radial-gradient` complejo | `bg-[#FAFAFB]` |
| Cards | `rounded-[24px] border-slate-300 shadow-[0_18px_50px...]` | `rounded-3xl border-slate-200 shadow-sm` |
| Header de card | Gradiente oscuro `#0f172a→#312e81` | Blanco con ícono en `bg-violet-50` / `bg-amber-50` |
| Color primario | `indigo-700` / `teal-600` | `#6E56CF` |
| Botón principal | Gradiente `from-indigo-700 to-teal-600` | `bg-[#6E56CF] hover:bg-[#5b45bc]` sólido |
| Botón secundario | `border-slate-300 rounded-xl` | `rounded-2xl border-slate-200` |
| Labels | `text-sm font-medium text-slate-700` | `text-[11px] font-bold uppercase tracking-wider text-slate-500` |
| Inputs / Select | `border-slate-300 rounded-lg focus:ring-indigo-500/20` | `rounded-xl border-slate-200 focus:ring-[#6E56CF]/30 focus:border-[#6E56CF]` |
| Separadores de sección | `bg-slate-100/80` con `text-sm uppercase` | `bg-slate-50/60` con punto `●` violeta + label |
| Textarea | `border-slate-300 focus:border-indigo-500` | `rounded-xl border-slate-200 focus:border-[#6E56CF] focus:ring-[#6E56CF]/20` |
| Chips de plantilla/profesional | `bg-indigo-100 border-indigo-200 text-indigo-800` | `bg-violet-50 border-violet-100 text-[#6E56CF]` |

### 2.4 Estructura de la página (sin cambios de lógica)

```
EdicionFichaClinica
├── Header (título + botón Volver)
├── Card "Datos Actuales" (lectura)
│   ├── Header: ícono violeta + Ficha #ID + fecha
│   ├── Badges: plantilla/motivo + profesional
│   └── Grid de campos por categoría (si tiene plantilla dinámica)
├── Card "Actualizar Información" (formulario)
│   ├── Header: ícono amber + título
│   ├── Select plantilla *
│   ├── Grid fecha + profesional
│   ├── [Si plantilla seleccionada] Secciones dinámicas por categoría
│   │   └── Textarea por campo
│   └── [Si sin plantilla] Formulario legacy
│       ├── Motivo de consulta
│       ├── Diagnóstico + Indicaciones
│       └── Anotaciones clínicas
└── Botones: Cancelar + Actualizar Ficha
```

### 2.5 Lógica de negocio (sin cambios)

- **Fichas con plantilla dinámica:** carga `datosDinamicos` (JSON enriquecido) desde la API, extrae los valores simples para el formulario, y al guardar reconstruye el JSON enriquecido con `nombreCampo`, `nombreCategoria`, `categoriaOrden`, `campoOrden`.
- **Fichas legacy (sin plantilla):** usa los campos `tipoAtencion`, `diagnostico`, `indicaciones`, `anotacionConsulta`.
- **Campo `observaciones`:** almacena el nombre del profesional a cargo.
- **Validación:** campos con `requerido === 1` bloquean el guardado y muestran toast con los nombres faltantes.
- **Endpoint guardar:** `POST /ficha/editarFichaPaciente`
- **Endpoint cargar:** `POST /ficha/seleccionarFichaID`
- **Endpoint plantillas:** `GET /fichaPlantilla/listarPlantillas` + `POST /fichaPlantilla/obtenerPlantillaCompleta`

---

## 3. Notificaciones de citas próximas

### 3.1 Qué se hizo

Se implementó un sistema de notificaciones nativas del navegador (Opción A — sin Service Worker, solo mientras la pestaña está abierta) que avisa al usuario 30 minutos antes de cada cita del día.

### 3.2 Archivos creados

| Archivo | Rol |
|---------|-----|
| `src/hooks/useAppointmentNotifications.js` | Hook de polling — lógica de detección y disparo |
| `src/components/NotificationProvider.jsx` | Componente client — banner de permiso + activa el hook |

**Dónde se montó:** `src/app/dashboard/layout.jsx` — se agregó `<NotificationProvider />` justo antes del cierre de `</ClerkProvider>`, fuera del div principal para que no afecte el layout.

### 3.3 Cómo funciona el flujo completo

```
1. Usuario entra al dashboard
2. NotificationProvider monta → lee Notification.permission
   ├─ "granted"  → arranca polling directamente, sin banner
   ├─ "default"  → espera 3 segundos → muestra banner
   │    ├─ "Activar"    → Notification.requestPermission() → si granted → arranca polling
   │    └─ "Ahora no"   → guarda descarte en localStorage por 7 días → sin banner
   └─ "denied"   → no hace nada
3. Polling cada 5 minutos → GET /reservaPacientes/seleccionarReservados
4. Filtra citas de hoy con horaInicio en los próximos 30 min
5. Por cada cita no notificada → new Notification(...)
6. Guarda id_reserva en sessionStorage para no repetir
```

### 3.4 Hook: `useAppointmentNotifications(enabled)`

**Parámetro:** `enabled: boolean` — el hook no hace nada si es `false`.

**Constantes configurables** (líneas 4-5 del hook):
```js
const POLL_INTERVAL_MS = 5 * 60 * 1000  // intervalo de polling (default: 5 min)
const ANTICIPACION_MIN = 30              // minutos de anticipación (default: 30)
```

**Lógica de tiempo:**
- Convierte `horaInicio` ("HH:MM:SS" o "HH:MM") a minutos totales.
- Calcula `minutosAhora` y `limite = minutosAhora + ANTICIPACION_MIN`.
- Solo notifica si `minutosAhora <= minutosCita <= limite`.
- Filtra también por `fechaInicio === hoy` (formato `"YYYY-MM-DD"`).

**Deduplicación:**
- Usa `sessionStorage` con la key `"notif_mostradas"` — persiste dentro de la sesión del tab pero se limpia al cerrar.
- Además usa el atributo `tag` de la Notification API para que el OS no apile la misma notificación.

**Campos que consume de la API** (`GET /reservaPacientes/seleccionarReservados`):
```js
r.id_reserva        // clave de deduplicación
r.fechaInicio       // "YYYY-MM-DD..." — compara slice(0,10) con hoyISO()
r.horaInicio        // "HH:MM" o "HH:MM:SS"
r.nombrePaciente    // cuerpo de la notificación
r.apellidoPaciente  // cuerpo de la notificación
r.nombreProfesional // cuerpo de la notificación
```

**Texto de la notificación:**
```
Título: "Cita próxima — AgendaClínica"
Cuerpo: "En ~30 min · Juan Pérez con Dra. Andrea Moran a las 10:00"
Ícono:  "/logo.png"
```

### 3.5 Componente: `NotificationProvider`

- Es un componente client (`"use client"`) que no renderiza nada visible excepto el banner.
- El banner solo aparece cuando `Notification.permission === "default"` y el usuario no lo ha descartado recientemente.
- Al hacer clic en "Ahora no" guarda en `localStorage` la key `"notif_banner_dismissed_until"` con un timestamp Unix de expiración (7 días). La próxima vez que cargue el dashboard, `bannerFueDescartado()` comprueba si ese timestamp aún está vigente.
- Si el usuario hace clic en "Activar" y luego deniega en el prompt del navegador, el estado queda `"denied"` y el componente no hace nada más.

### 3.6 Bugs encontrados y corregidos en auditoría

| Bug | Causa | Fix |
|-----|-------|-----|
| Banner reaparecía en cada refresh | "Ahora no" solo actualizaba estado React, que se resetea | Persistir descarte en `localStorage` con TTL de 7 días |
| `"use client"` innecesario en el hook | Los hooks no son componentes, no necesitan la directiva | Removido |

### 3.7 Dependencias requeridas

- `tw-animate-css` — para la animación `animate-in slide-in-from-bottom-4` del banner. Ya instalado en el proyecto (`"tw-animate-css": "^1.4.0"`) e importado en `globals.css` con `@import "tw-animate-css"`.
- **No requiere cambios en el backend.**
- **No requiere Service Worker.**

### 3.8 Limitaciones conocidas (Opción A)

- Las notificaciones solo funcionan mientras la pestaña del dashboard está abierta.
- En iOS Safari solo funciona si la app está instalada como PWA (iOS 16.4+).
- Si se desea notificaciones con pestaña cerrada, se debe implementar Opción B (Web Push + Service Worker + backend que almacene suscripciones VAPID y dispare pushes al crear/recordar reservas).

---

## 4. Calendario público — recuperación de horarios tras bloqueos parciales

**Archivo:** `src/app/(public)/agendaEspecificaProfersional/[id_profesional]/page.jsx`
**Fecha:** 2026-08-23 · **Estado:** integrado en `main`, pendiente de paso a producción.

### 4.1 El problema reportado

El calendario público genera bloques de horario consecutivos según la duración del servicio elegido (`duracion_min` de la tarifa), ej. servicio de 60 min → 09:00–10:00, 10:00–11:00, 11:00–12:00... Cuando un profesional creaba un **bloqueo parcial** (ej. 30 min o 15 min) dentro de esa grilla, el bloque completo que lo contenía quedaba inválido y el calendario "saltaba" directo al siguiente bloque de la grilla fija, perdiendo el tiempo libre real que quedaba entre el fin del bloqueo y el siguiente bloque (hasta 45 min perdidos por bloqueo, según el caso). Esto le generó al negocio la pérdida de al menos 2 clientes.

### 4.2 Intentos descartados (documentados para que no se repitan)

1. **Granularidad fija de paso (ej. cada 15 min) en vez de `dur`:** resuelve el hueco, pero genera candidatos que se solapan entre sí cuando `duracionMinutos` no es múltiplo de la granularidad (ej. servicio de 25 min → aparecían opciones cada 15 min en vez de cada 25, algo que nunca pasaba antes del cambio). **Descartado.**
2. **Grilla original intacta + candidato extra pegado al fin del bloqueo, cortando la cadena extra en el próximo punto de la grilla original:** el candidato extra podía **terminar después** de ese próximo punto (ej. bloqueo 09:30–10:30 con servicio de 60 min generaba el candidato 10:30–11:30, que se solapa 30 min con el candidato original 11:00–12:00 que seguía mostrándose al lado). Esto llegó a probarse visualmente en el calendario real y mostró **dos horarios solapados simultáneamente disponibles** — inaceptable, porque implicaría que el profesional podría quedar doble-agendado si dos pacientes distintos tomaban cada opción. **Descartado** (capturas de pantalla del 2026-08-23 muestran el bug: día con bloqueo mostraba `10:45–11:45` y `11:00–12:00` como opciones simultáneas).

### 4.3 Solución final integrada

`attentionSlots` (dentro del componente) genera **una sola cadena consecutiva** — nunca dos fuentes de horarios en paralelo, por lo tanto nunca puede haber dos candidatos que se solapen entre sí, por construcción:

```js
const attentionSlots = useMemo(() => {
    if (!fechaSeleccionada || !servicioActivo) return [];
    if (fechaSeleccionada.getDay() === 0) return []; // domingo cerrado

    const inicio = 9 * 60, fin = 22 * 60, dur = duracionMinutos;
    const slots = [];
    let cur = inicio;
    while (cur + dur <= fin) {
        const candidateEnd = cur + dur;
        const bloqueo = bloqueosDelDia.find(b => {
            const bIni = toMinutes(b.ini), bFin = toMinutes(b.fin);
            return cur < bFin && bIni < candidateEnd; // overlap real
        });
        if (bloqueo) {
            cur = toMinutes(bloqueo.fin); // salta al minuto EXACTO en que termina el bloqueo
            continue;
        }
        slots.push({start: formatMin(cur), end: formatMin(candidateEnd)});
        cur += dur;
    }
    return slots;
}, [fechaSeleccionada, servicioActivo, duracionMinutos, bloqueosDelDia]);
```

- La cadena arranca en 09:00 y avanza de a `duracionMinutos` (la duración del servicio activo — funciona igual sin importar si es un servicio de 10, 25, 35 o 60 min, porque el paso y la duración nunca se desacoplan de una grilla fija externa).
- Si el candidato se solaparía con un bloqueo del día, la cadena **salta exactamente al minuto en que termina ese bloqueo** (sin redondear a ningún horario fijo — funciona igual con bloqueos creados a cualquier hora, ej. 10:07) y continúa desde ahí.
- Si no hay bloqueos ese día, el resultado es **idéntico** al comportamiento anterior (cero regresión).
- Cada candidato generado sigue pasando por la validación existente contra el backend (`validarSlot` → `POST /reservaPacientes/validar`) dentro de `checkBlocked` — este cambio no toca esa validación, solo cambia qué candidatos se le proponen. El backend sigue siendo la única fuente de verdad final sobre disponibilidad real (reservas incluidas).

### 4.4 Datos nuevos que alimentan la cadena

- **`bloqueosProfesional`** (estado nuevo): guarda la respuesta cruda de `POST /bloqueoAgenda/seleccionarBloqueosPorProfesional` (ya se pedía antes solo para calcular `diasBloqueados`; no se agregó ningún fetch nuevo).
- **`bloqueosDelDia`** (`useMemo` nuevo): filtra `bloqueosProfesional` por el día seleccionado y extrae `{ini, fin}` en formato `"HH:MM"`.
- El cálculo de `diasBloqueados` (bloqueo de jornada completa, día no seleccionable) **no se tocó** — sigue funcionando exactamente igual que antes.

### 4.5 Verificación realizada antes de integrar

Se simuló el algoritmo exacto (extraído literal del archivo) en Node con 12 escenarios — sin bloqueos (60/25/35 min, para confirmar cero regresión), bloqueos de 15/30 min, bloqueos en horario arbitrario no alineado (ej. termina a las 10:07), bloqueo que termina justo en un punto ya cubierto por la grilla, dos bloqueos el mismo día, bloqueos adyacentes, un bloqueo que cubre casi todo el día, y bloqueos desordenados en el array de entrada. Cada escenario se pasó por un assert automático que compara **todos los pares de slots generados** y lanza error si alguno se solapa. Los 12 casos pasaron sin solapamientos. Luego se confirmó visualmente en el navegador con bloqueos reales creados desde el dashboard.

### 4.6 Fuera de alcance (a tener en cuenta a futuro)

- Esta lógica de "salto por bloqueo" **no** considera reservas ya confirmadas al generar candidatos (solo bloqueos). Las reservas siguen dependiendo exclusivamente de la validación del backend (`validarSlot`) para ser excluidas — funciona hoy porque toda reserva se crea a partir de un candidato de la grilla, pero si en el futuro se detectan huecos perdidos alrededor de reservas parciales (no solo bloqueos), aplicaría el mismo patrón aquí descrito.
- No se tocó `src/app/dashboard/calendario/page.jsx` (calendario del dashboard) ni `src/app/dashboard/calendarioGeneral/page.jsx` (copia legacy huérfana, ver auditoría previa) — ninguno de los dos tiene este problema porque no arman una grilla de slots fijos por duración.

---

## 5. Agendamiento múltiple — repetir una cita en varias fechas desde el popup de reservas

**Archivos:** `src/Componentes/AppointmentDrawer.jsx` (UI) · `src/app/dashboard/calendario/page.jsx` (lógica de inserción)
**Fecha:** 2026-09-07 · **Estado:** integrado en `main`, probado manualmente por el usuario tras corregir un bug real de duplicación (ver 5.5).

### 5.1 Qué se pidió

Desde el popup de "Nueva reserva" que se abre en `/dashboard/calendario` al seleccionar un horario, permitir agendar al **mismo paciente, mismo profesional, mismo horario** en **varias fechas adicionales** de una sola vez (ej.: terapia todos los martes por 2 meses), sin crear duplicados ni pisar citas/bloqueos existentes. Explícitamente **no** es una página aparte — vive dentro del mismo drawer de agendamiento (`AppointmentDrawer`, `mode="create"`).

### 5.2 UI: `RepetirFechasSection` (dentro de `AppointmentDrawer.jsx`)

Componente nuevo, usado solo cuando `mode === "create"`. Es un **desplegable** (colapsado por defecto, con contador violeta cuando ya hay fechas elegidas):

- Header tipo botón con flecha que rota 180° al abrir (`useState` local `abierto`).
- Al expandir: un `Calendar` (`@/components/ui/calendar`, el mismo wrapper de react-day-picker que usa `bloqueosAgenda`) en `mode="multiple"`, a **tamaño natural** (sin transform de escala — ver 5.5 por qué importa), con `showOutsideDays={false}` y los días pasados / el día principal ya agendado deshabilitados (`disabled={[{before: hoy}, {after: limite(+3 meses)}, selectionDraft.start]}`).
- Chips debajo con cada fecha elegida (`format(dia, "EEE d MMM", {locale: es})`), removibles individualmente, más botón "Limpiar todo".
- **Checkbox de confirmación obligatoria** (ver 5.4).

Las fechas elegidas se guardan en `popupForm.fechasRepeticion` (`Date[]`), un campo nuevo agregado al estado `popupForm` que ya vive en `calendario/page.jsx` (mismo patrón que `prestacion`, `modalidad`, etc. — se actualiza vía `onPopupFormChange("fechasRepeticion", ...)`).

### 5.3 Lógica de inserción (`calendario/page.jsx`)

No se tocó `insertarNuevaReserva` (la reserva del día principal sigue exactamente igual). Se agregaron dos funciones nuevas, ejecutadas **después** de que la reserva principal se crea con éxito:

- **`crearReservaEnFecha(...)`**: POST crudo a `/reservaPacientes/insertarReservaPacienteFicha` para una fecha puntual — mismo endpoint y mismo shape de body que usa la reserva principal, sin validaciones ni toasts propios (la validación de horario/campos ya se hizo una sola vez, porque es igual en todas las fechas).
- **`insertarReservasEnFechasAdicionales(fechasExtra, datosBase)`**: itera las fechas (deduplicadas y sin repetir el día principal), y por cada una:
  1. Descarta fechas pasadas.
  2. Corre **la misma validación de choques que usa el resto de la agenda** — `isOverlapping()` (revisa `dataAgenda` + `dataBloqueos`, citas y bloqueos) — como pre-chequeo.
  3. Si pasa, llama a `crearReservaEnFecha`. El backend es la autoridad final: si igual devuelve conflicto, esa fecha se cuenta como no-agendada y se sigue con las demás.
  4. Al final hace **un solo** `refrescarCalendario()` y muestra un toast resumen (`X agendadas, Y no se pudieron por hora ocupada/bloqueada/pasada`).

Nunca se sobreescribe ni se duplica una hora ya ocupada — cada fecha se valida de forma independiente contra el estado real de la agenda.

### 5.4 Confirmación obligatoria antes de agendar múltiple

El botón **"Agendar"** del footer del drawer queda **deshabilitado** (`disabled`, opacidad reducida) mientras `popupForm.fechasRepeticion.length > 0` y no se haya marcado el checkbox `popupForm.confirmacionFechasRepeticion`. Este campo:

- Se resetea a `false` automáticamente cada vez que la lista de fechas cambia (agregar, quitar, limpiar) — función `actualizarFechas()` dentro de `RepetirFechasSection`.
- Se revisa **dos veces**: en el `disabled` del botón (UI) y de nuevo dentro de `confirmarAgendamientoDesdePopup` en `calendario/page.jsx` antes de correr el loop de inserción múltiple (defensa en profundidad — nunca debe dispararse el agendamiento múltiple sin la confirmación explícita, aunque algo bypasee la UI).

### 5.5 Bug real encontrado en pruebas y su corrección

Durante las pruebas del usuario, seleccionar fechas en el mini-calendario produjo **citas en un día distinto al elegido** (ej. seleccionó jueves y se agendó también/solo el viernes siguiente). Causa más probable identificada: el mini-calendario se había renderizado con `className="... scale-[0.85] origin-top"` para verse más compacto dentro del drawer angosto (400px) — esto reduce el tamaño real de las celdas de día, dejando columnas vecinas (jueves/viernes) muy juntas y con un blanco de clic pequeño, fácil de errar sin notarlo en un flujo de "clic, clic, clic" repetido por varias semanas.

**Corrección aplicada (no se pudo reproducir en vivo con DevTools — el fix ataca la causa más probable + agrega una barrera independiente de la causa exacta):**

1. Se quitó el `scale-[0.85]` — el calendario vuelve a su tamaño natural, igual que en `bloqueosAgenda` (probado en producción sin este problema).
2. Se agregó `showOutsideDays={false}` a este calendario específico, para no mostrar días de meses adyacentes (otra fuente de clics ambiguos cerca del borde del mes).
3. Se agregó el checkbox de confirmación obligatoria descrito en 5.4, como última barrera: obliga a revisar la lista de fechas (con formato "día de semana + fecha", ej. "jue 10 sep") antes de que el botón "Agendar" se habilite.

Verificado visualmente (Chrome headless, vía ruta temporal fuera de dashboard borrada después de la captura) en los tres estados: colapsado, expandido con fechas seleccionadas, botón deshabilitado y habilitado tras marcar el checkbox. El usuario confirmó luego con pruebas manuales reales que funciona correctamente.

Ver también [[cautela-cambios-agenda]] — este fue exactamente el tipo de incidente que esa memoria advierte evitar.

### 5.6 Estilo visual

- Header del desplegable en `text-emerald-600 font-bold` (mismo verde que "Paciente encontrado" en este mismo archivo) para que resalte como sección relevante.
- Contador de fechas: `bg-violet-100 text-[#6E56CF]` (mismo patrón de chip violeta que el resto del drawer).
- Checkbox de confirmación: neutro (`border-slate-200 bg-white`, texto `text-slate-600`) con el checkbox en violeta de marca (`accent-violet-600`) — **sin colores tipo "warning" (amber/yellow)**, para no verse como una caja de advertencia genérica de IA; el usuario pidió explícitamente mantener el estilo limpio tipo Apple del resto del dashboard.

### 5.7 Fuera de alcance / pendiente

- No hay límite de fechas por lote (se probó con ~8-9 fechas en 2 meses); no se ha probado con volúmenes mucho mayores.
- El pre-chequeo `isOverlapping()` usa el estado `dataAgenda`/`dataBloqueos` cargado en el cliente — puede quedar desactualizado entre el POST de la reserva principal y el loop de fechas adicionales si otro usuario agenda al mismo profesional en simultáneo; esto no genera duplicados porque el backend sigue siendo la fuente de verdad final (devuelve conflicto igual), solo podría hacer que el pre-chequeo no detecte algo que el backend sí rechaza — comportamiento seguro, solo potencialmente menos eficiente (un POST de más que termina en conflicto).

---

## Tokens de diseño comunes (todo el dashboard)

Para mantener consistencia en cualquier página nueva o modificada:

```
Color primario:     #6E56CF
Hover primario:     #5b45bc
Fondo de página:    #FAFAFB
Card border:        border-slate-200
Card shadow:        shadow-sm
Card radius:        rounded-3xl
Card header:        px-6 py-5 border-b border-slate-100
Ícono contenedor:   h-10 w-10 rounded-xl bg-{color}-50 flex items-center justify-center text-{color}
Label campo:        text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1
Input base:         rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700
Input focus:        focus:outline-none focus:ring-2 focus:ring-[#6E56CF]/30 focus:border-[#6E56CF] transition-all
Botón primario:     bg-[#6E56CF] text-white font-bold rounded-2xl hover:bg-[#5b45bc] shadow-lg shadow-indigo-200 active:scale-[0.98]
Botón secundario:   rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98]
Botón destructivo:  rounded-2xl bg-rose-600 text-white font-semibold hover:bg-rose-700 active:scale-[0.98]
Section separator:  px-6 py-3 border-t border-slate-100 bg-slate-50/60 + dot violeta + label uppercase
```
