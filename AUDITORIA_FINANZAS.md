# Auditoría técnica — Módulo Finanzas (Fase 1-3, antes de implementar)

**Fecha:** 2026-08-25
**Alcance de esta auditoría:** solo frontend (`src/`). No hay acceso al backend real en este repo — la carpeta `backend/` local contiene un único archivo huérfano (`backend/view/productoRoutes.js`, con un `import` de path absoluto `/backend/controller/...` que no existe en el disco) y no es el backend en producción. Todo lo que sigue se dedujo de llamadas `fetch` reales en el frontend, con cita `archivo:línea` en cada afirmación. Donde no se pudo confirmar algo sin ver el backend, se dice explícitamente.

**Estado:** informe de auditoría + propuesta técnica. **No se ha escrito código de Finanzas todavía.** Requiere tu aprobación antes de pasar a Fase 5 (backend).

---

## 0. Resumen ejecutivo (para leer en 30 segundos)

- El precio de una cita **sí se congela históricamente** (`monto_reserva`), copiado desde la tarifa vigente al momento de crear/editar la reserva. No se recalcula después. → Responde la duda central de la sección 17 del prompt: es **Caso A**.
- **No existe ningún dato confiable de pago real** (monto pagado, método, fecha de pago) en ningún endpoint de citas. Hay un campo `estadoPago` que la UI *lee* en dos componentes pero que **nunca se escribe** en ningún flujo — es un campo fantasma. La "pasarela de pago" (`/dashboard/pasarelaPago`) es solo configuración de la cuenta Mercado Pago (activa/inactiva, token), no un registro de transacciones.
- El reagendamiento es un **UPDATE in-place** sobre el mismo `id_reserva` (nunca crea una fila nueva) → cero riesgo de doble conteo de ingresos por reagendamiento.
- **No existe reasignación de profesional** en la UI actual, ni campo `origen` (manual vs. público), ni concepto de comisión/porcentaje de reparto en ningún lugar del código.
- Servicio y Tarifa son **dos entidades separadas** (`serviciosProfesionales` sin precio, `tarifasProfesional` con precio+duración por profesional), y la reserva **no guarda FK** a ninguna de las dos — solo texto libre (`motivo_reserva`) y el monto congelado (`monto_reserva`).
- Ya existe un precedente de permisos reutilizable: `canAccessPaymentGateway()` en `src/lib/dashboard-access.js` y `canSeeReservationAmounts` en `dashboard/page.jsx` — el mismo patrón sirve para Finanzas.
- **Bloqueador real para las Fases 5-6:** el backend (Node/Express) y la base de datos no están en este repositorio. No puedo auditar rutas/controladores/SQL reales ni escribir endpoints nuevos sin que me compartas ese repo o los archivos relevantes.

---

## 1-21. Respuestas a las preguntas de la Fase 1 (Sección 45 del prompt)

### 1. ¿Cómo obtiene el frontend las citas?
Vía `fetch` directo a `process.env.NEXT_PUBLIC_API_URL` (sin capa de "API client"/hook centralizado — cada página hace sus propios `fetch`). El endpoint principal de listado es `GET /reservaPacientes/seleccionarReservados`, usado en `src/app/dashboard/calendario/page.jsx:934`, `src/app/dashboard/agendaCitas/page.jsx:224`, `src/app/dashboard/page.jsx:470`, y en polling cada 5 min en `src/hooks/useAppointmentNotifications.js:31`.

### 2. ¿Qué endpoint entrega las citas?
No hay uno solo — hay 8 variantes según el filtro:
`seleccionarReservados` (todas), `seleccionarPorProfesional` (`{id_profesional}`), `seleccionarEspecifica` (`{id_reserva}`), `buscarEntreFechas` (`{fechaInicio, fechaFinalizacion}`), `seleccionarRut`, `seleccionarNombre`, `seleccionarSegunEstado` (`{estadoReserva}`), y `validar` (chequeo de disponibilidad, no lectura). Todos bajo el prefijo `/reservaPacientes/`. Ninguno es agregado — todos devuelven filas crudas de reservas.

### 3. ¿Qué campos contiene cada cita?
Confirmados por uso real en el código:
`id_reserva, nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_profesional, nombreProfesional, monto_reserva, motivo_reserva, estadoPeticion, estadoPago (fantasma, ver §10), nombre_prestacion/modalidad (pendientes de migración BD, ver más abajo)`.
No hay `id_servicioProfesional` ni `id_tarifaProfesional` en la reserva — el vínculo con el catálogo de servicios se pierde tras crearse (solo queda el texto `motivo_reserva`).

### 4. ¿Cómo se obtiene el servicio?
Catálogo genérico sin precio: `GET /serviciosProfesionales/seleccionarTodosServiciosProfesionales` → `{id_servicioProfesional, nombreServicio, descripcionServicio}`. Gestionado en `src/app/dashboard/serviciosAgendamiento/page.jsx`. No tiene profesional ni precio asociado.

### 5. ¿Cómo se obtiene el precio?
A través de la **tarifa**, no del servicio: `POST /tarifasProfesional/seleccionarTarifasPorProfesional` (`{profesional_id}`) → `{id_tarifaProfesional, nombreServicio, duracion_min, precio}`. Gestionado en `src/app/dashboard/tarifaServicio/page.jsx`. Al elegir una tarifa en el formulario de reserva, `AppointmentDrawer.jsx:380-381` copia `tarifa.precio` → `monto_reserva` de la reserva. Ese valor queda **congelado** — no se vuelve a leer `tarifasProfesional` para mostrar precios de citas ya creadas.

### 6. ¿Cómo se obtiene el profesional?
`GET /profesionales/seleccionarTodosProfesionales` → `{id_profesional, nombreProfesional, descripcionProfesional}`. La reserva guarda `id_profesional` como FK real (no solo texto), más `nombreProfesional` denormalizado como respaldo si el backend no lo retorna.

### 7. ¿Cuáles son exactamente los estados de las citas?
`estadoReserva` (string, con alias legacy normalizados en frontend: `reservado→reservada`, `confirmado→confirmada`, `anulado→anulada`, `no asistio→no asiste`):
- `"reservada"`, `"confirmada"`, `"asiste"`, `"no asiste"`, `"finalizado"`, `"anulada"`, `"pendiente pago"`.
- ⚠️ `"pendiente pago"` **solo existe como opción en el dropdown de `AgendaDetalle`** — no aparece en el calendario ni en el drawer de edición rápida (`AppointmentDrawer.jsx:43-49` no la incluye). Inconsistencia real entre pantallas, a tener en cuenta si Finanzas la usa como criterio.

Además existe un campo **numérico separado y distinto**, `estadoPeticion`: `0` = slot libre, `1` = reserva válida (único valor que el dashboard principal cuenta), `3` = "pago en curso" (hold temporal mientras el paciente está en el checkout de Mercado Pago). El significado de otros valores numéricos no se pudo determinar desde el frontend.

### 8. ¿Cómo se detectan cancelaciones/anulaciones?
Por el valor de `estadoReserva === "anulada"` (con alias `"anulado"`). Se cambia vía `POST /reservaPacientes/actualizarEstado` (`{estadoReserva, id_reserva}`), endpoint dedicado y separado de `actualizarReservacion` (que reescribe toda la fila).

### 9. ¿Cómo funcionan las citas manuales?
Confirmado: se crean desde `src/app/dashboard/calendario/page.jsx` → `AppointmentDrawer` en modo `create` → `POST /reservaPacientes/insertarReservaPacienteFicha`. **Es el mismo endpoint** que usa el formulario público (`formularioReservaProfesional/[id_profesional]/page.jsx:193`), con payload casi idéntico. **No existe ningún campo `origen`/`canal`** que distinga una cita manual de una pública — se confirmó con grep exhaustivo sobre todo `src/`. El estado inicial siempre es `"reservada"` (no seleccionable).

### 10. ¿Qué información de pagos existe actualmente?
Muy poca y desconectada de las citas:
- Existe `estadoPago` como campo que se **lee** en `AppointmentCard.jsx:75` y `AppointmentDrawer.jsx:74` (con `?? ""`), y tiene tokens de color propios en `src/lib/designTokens.js:108-153` (`pagado`, `pagada`, `"pend. pago"`, `pendiente`) — pero **no hay un solo lugar en todo el frontend donde ese campo se escriba o actualice**. Es un campo previsto en el diseño visual pero sin flujo funcional detrás.
- No existe `monto_pagado`, `metodo_pago`, `fecha_pago`, `abono` ni `reembolso` en ningún endpoint de reservas.
- Sí existe `abono_paciente` pero es de **presupuestos de tratamiento** (`detalleCotizacion`), una función completamente distinta y no ligada a citas.

### 11. ¿Cómo funciona la pasarela de pagos desde el frontend?
Mercado Pago Checkout Pro, un solo flujo:
1. `GET /persistence/obtenerPersistencia` — consulta si hay una cuenta MP activa (`estado_pasarela`), no el estado de un pago puntual.
2. Si está activa, el formulario público llama `POST /pagosMercadoPago/create-order` → recibe `init_point` → `window.location.href` (redirect externo real a Mercado Pago).
3. Mercado Pago redirige de vuelta a una de 4 páginas **estáticas** (`pagoAprobado`, `pagoEnProceso`, `pagoRechazado`, `comprobantePago`) que **no verifican nada contra el backend** — son solo mensajes fijos según a qué URL te mandó Mercado Pago.
4. **No existe ningún endpoint que consulte el estado real de un pago** (ni webhook visible desde el frontend — de existir, vive en el backend externo).
5. La página `/dashboard/pasarelaPago` es solo un formulario de configuración de credenciales (nombre de cuenta, access token, activo/inactivo), no un panel de transacciones.

**Conclusión directa para el modelo financiero:** "Ingreso cobrado" (sección 7 del prompt) **no se puede calcular hoy con evidencia real** — ni siquiera para las citas pagadas por Mercado Pago, porque el frontend nunca confirma el resultado del pago contra el backend. Coincide exactamente con la cautela que ya pedía el prompt maestro.

### 12. ¿Cómo se comportan los reagendamientos?
Los 3 caminos (drag-and-drop, resize, edición manual en el drawer) convergen en la misma función y el mismo endpoint: `POST /reservaPacientes/actualizarReservacion` enviando el **mismo `id_reserva`** original. Es un `UPDATE in-place` (a nivel de lo que el frontend hace — no se puede confirmar el 100% del comportamiento en la base de datos sin ver el backend, pero no hay ningún indicio de que cree una fila nueva). No existe endpoint `/reagendar` separado ni campo `id_reserva_original`/`reemplaza_a`.

### 13. ¿Cómo se comportan los cambios de servicio?
Mismo endpoint que el reagendamiento (`actualizarReservacion`). Al elegir una tarifa distinta en el drawer, se sobreescriben `monto_reserva` y `motivo_reserva` con los nuevos valores — **sin dejar rastro del valor anterior** (no hay historial de cambios).

### 14. ¿Cómo se comportan los cambios de profesional?
**No existe esa función en la UI actual.** El campo profesional se muestra como texto de solo lectura en el drawer de edición; el único selector de profesional en el calendario es a nivel de página (para filtrar qué agenda ver), no un campo editable de la reserva individual. El `id_profesional` enviado al actualizar siempre es el mismo que ya tenía la cita.

### 15. ¿Cómo se maneja el precio histórico?
Ya respondido en el resumen ejecutivo y en el punto 5: **se conserva** (Caso A del prompt). `monto_reserva` es un snapshot numérico en la propia fila de la reserva, sin FK hacia la tarifa que lo originó, y un input de texto libre editable manualmente en el formulario (no hay validación estricta de tipo numérico en frontend).

### 16. ¿Qué endpoints existentes pueden reutilizarse?
Para leer datos crudos, sí — pero **ninguno hace agregación** (SUM/COUNT/GROUP BY). Todos devuelven listas de filas individuales:
- `GET /reservaPacientes/seleccionarReservados` — base para todo el módulo, pero sin filtro de rango de fechas eficiente (existe `buscarEntreFechas` para eso).
- `GET /profesionales/seleccionarTodosProfesionales`, `GET /tarifasProfesional/seleccionarTodasTarifasConNombres` — para nombres y catálogo.
- El patrón de permisos (`canAccessPaymentGateway`, `canSeeReservationAmounts`) — reutilizable tal cual para gatear el acceso a Finanzas.

### 17. ¿Qué endpoints nuevos serían necesarios?
Sí, varios — porque calcular "ingreso reservado/confirmado por profesional, mes a mes" sumando en el cliente 150-1000+ filas cada vez que se abre el dashboard viola directamente la sección 26 del prompt (evitar N+1 / cálculo crítico solo en frontend). Ver propuesta en la sección 3 de este documento.

### 18. ¿Es necesario modificar Node/Express?
Sí, casi con certeza — para los endpoints de agregación. **No puedo confirmar el detalle** (estructura de `routes/controllers/services` real) porque el backend no está en este repositorio.

### 19. ¿Es necesario modificar SQL?
No para los datos que YA existen (reservas/precio/profesional) — esos se pueden agregar con `GROUP BY`/`SUM` sobre las tablas actuales. **Sí** sería necesaria una tabla nueva solo para la configuración de distribución profesional/clínica (ver sección 3.3), porque ese concepto no existe en ningún lugar del sistema actual.

### 20. ¿Qué nueva tabla sería necesaria?
Una sola, para configuración de reparto profesional/clínica con historial (nombre referencial, a ajustar a la convención real de BD que no tengo acceso a confirmar): ver sección 3.3 más abajo.

### 21. Propuesta final de arquitectura para Finanzas
Ver sección 3 completa a continuación.

---

## 2. Modelo financiero V1 aplicado a los datos reales

Traduciendo el modelo conceptual del prompt (secciones 5-9) a los nombres de campo reales confirmados:

```
Ingreso reservado =
  SUM(monto_reserva) de reservas donde estadoReserva ∈ {"reservada", "confirmada", "asiste", "no asiste", "finalizado"}
  Y estadoPeticion === 1 (excluye holds de pago en curso / slots libres)
  Y NO estadoReserva ∈ {"anulada"}

Ingreso confirmado =
  SUM(monto_reserva) de reservas donde estadoReserva ∈ {"confirmada", "asiste", "no asiste", "finalizado"}
  Y estadoPeticion === 1
  Y NO estadoReserva ∈ {"anulada"}

Tasa de confirmación =
  citas_confirmadas / citas_reservadas × 100   (0 si citas_reservadas === 0)
```

Notas importantes de esta traducción:
- Incluyo `"asiste"`, `"no asiste"` y `"finalizado"` dentro de "confirmada" porque, según la sección 8-9 del prompt, esos son estados **operacionales posteriores** a la confirmación — una cita no puede llegar a "asiste" sin haber pasado por "confirmada" en el flujo real, así que excluirla del ingreso confirmado violaría la regla explícita de la sección 9 ("no depender de Completada/Asistió"). **Esto asume que el flujo de estados es lineal y no hay forma de llegar a "asiste" sin pasar por "confirmada"** — no pude confirmar esa transición exacta en el backend; si un estado como "asiste" se puede setear directamente desde "reservada" sin pasar por "confirmada", este SUM se corregiría fácilmente ajustando el filtro. Lo marco como supuesto a validar contigo antes de implementar.
- `"pendiente pago"` la dejo fuera de ambos SUM por ahora dado que es inconsistente entre pantallas (solo existe en `AgendaDetalle`) y semánticamente no está claro si es "antes de reservada" o "reservada pero sin pago" — pido tu confirmación explícita de qué significa este estado antes de decidir dónde entra.
- "Ingreso cobrado" (sección 7 del prompt): **no se implementa en V1**, tal como pide el prompt — no hay evidencia de pago confiable hoy (§10-11 arriba). Dejo el campo `estadoPago` (hoy fantasma) como el punto de enganche futuro cuando exista un flujo real que lo escriba.

---

## 3. Propuesta técnica (Fase 3)

### 3.1 Endpoints nuevos propuestos (nombres conceptuales, a ajustar a la convención real del backend)

Todos de **solo lectura**, agregados en backend (no en frontend), respetando la sección 26 del prompt:

| Endpoint propuesto | Qué agrega | Reemplaza cálculo en frontend de |
|---|---|---|
| `GET /finanzas/resumen?desde&hasta` | `ingreso_reservado`, `ingreso_confirmado`, `citas_reservadas`, `citas_confirmadas`, `tasa_confirmacion` para el rango | Recorrer todas las reservas del período en el cliente |
| `GET /finanzas/profesionales?desde&hasta` | Por profesional: `reservadas`, `confirmadas`, `ingreso_confirmado` (y validación de que la suma calce con el total de `/resumen`) | Agrupar por `id_profesional` en el cliente |
| `GET /finanzas/profesionales/:id_profesional/servicios?desde&hasta` | Detalle expandible: por texto de `motivo_reserva`, cantidad de citas y suma de `monto_reserva` | Se carga solo al expandir una fila (evita N+1 de entrada) |
| `GET /finanzas/evolucion?meses=6` | Ingreso confirmado agrupado por mes, últimos N meses | Cálculo mes a mes en el cliente |
| `GET /finanzas/configuracion` | Config actual de distribución por profesional (ver 3.3) | — |
| `PUT /finanzas/configuracion/:id_profesional` | Actualiza % profesional/clínica, crea una nueva versión con historial | — |

⚠️ **Sobre `/finanzas/profesionales/:id/servicios`**: como la reserva no tiene FK a servicio (solo el texto libre `motivo_reserva`), agrupar "por servicio" en backend será agrupar por el string exacto de `motivo_reserva`. Si dos citas del mismo servicio tienen el texto escrito con variación (mayúsculas, espacios), aparecerán como servicios distintos. Es una limitación real del modelo de datos actual, no algo que Finanzas pueda arreglar sin tocar cómo se guarda la reserva — lo señalo para que decidas si es aceptable en V1 o si conviene normalizar el texto en el backend (`TRIM`+`LOWER` al agrupar, por ejemplo) como mitigación barata.

### 3.2 Frontend — qué se reutiliza

- Patrón de acceso: replicar `canAccessPaymentGateway()`/`hasFullDashboardAccess()` de `src/lib/dashboard-access.js` con un `FINANCE_ROLES` nuevo (propongo `admin` + `administrador-clinico`, ya que ese último rol ya ve montos de reserva y gestiona tarifas/servicios; a confirmar contigo).
- Item de sidebar nuevo en `DASHBOARD_NAV_SECTIONS` (`src/lib/dashboard-access.js`), sección propia "Finanzas" con ícono a definir (no hay ícono de gráfico/tendencia en el `ICONS` map actual de `SidebarNav.jsx`/`MobileNav.jsx` — habría que sumar uno, ej. `TrendingUp` de lucide-react).
- Componentes ya existentes reutilizables tal cual: `Accordion`/`AccordionItem` (mismo patrón de filas expandibles ya usado en `NuevaFicha`), formato de RUT/moneda si existe un helper (no encontré un `formatCurrency` centralizado — cada página formatea el monto inline; conviene crear uno solo y usarlo en Finanzas, sin tocar las demás pantallas).
- **No** tocar `AppointmentDrawer.jsx`, `calendario/page.jsx` ni la lógica de reservas — Finanzas es puramente de lectura sobre esos datos.

### 3.3 Base de datos — la única tabla nueva propuesta

Nombre **solo referencial** (ajustar a la convención real, que no puedo confirmar sin acceso a la BD/backend):

```
tabla: distribucionProfesional   (referencial)

Columnas:
  id_distribucion            PK, autoincremental
  id_profesional              FK → profesionales.id_profesional
  porcentaje_profesional      numeric, 0-100
  porcentaje_clinica          numeric, 0-100   (validación: suma = 100)
  vigente_desde                fecha — inicio de vigencia de este % (para historial, sección 22 del prompt)
  vigente_hasta                fecha, nullable — null = configuración actual
  created_at, updated_at
  creado_por                   (opcional, si existe un patrón de auditoría en el backend actual)

Índices sugeridos:
  (id_profesional, vigente_desde)
  índice único parcial: un solo registro con vigente_hasta IS NULL por id_profesional
```

**Por qué con historial de vigencia y no solo un campo `%` mutable**: la sección 22 del prompt es explícita — cambiar el porcentaje actual de un profesional no debe alterar liquidaciones pasadas. Con `vigente_desde`/`vigente_hasta`, cualquier cálculo histórico de reparto usa el % que estaba vigente en la fecha de la cita, y el % "actual" es simplemente el registro con `vigente_hasta IS NULL`. Actualizar el % = cerrar el registro vigente (`vigente_hasta = hoy`) + insertar uno nuevo, nunca un `UPDATE` sobre el `%` mismo.

No propongo ninguna otra tabla nueva — reservas, servicios, tarifas y profesionales ya existen y no se duplican.

### 3.4 Precisión monetaria (sección 28 del prompt)

No pude confirmar el tipo de columna real de `precio`/`monto_reserva` en la base de datos (sin acceso al backend). El frontend actualmente trata `monto_reserva` como string/number sin normalización estricta (`AppointmentDrawer.jsx:395-398` es un input de texto libre). Recomendación para Finanzas: los `SUM()` de los endpoints nuevos deben hacerse en SQL (no en JS) precisamente para evitar que esta falta de tipado estricto en frontend contamine los totales — otra razón más para que los endpoints de agregación vivan en backend y no se repliquen en el cliente.

---

## 4. Decisiones que necesito que confirmes antes de seguir (Fase 4 — aprobación técnica)

1. **Rango de estados que cuentan como "confirmado"**: ¿`asiste`/`no asiste`/`finalizado` deben sumar como ingreso confirmado (mi supuesto actual), o solo `confirmada` estrictamente? Depende de si el backend permite saltar directo a esos estados sin pasar por `confirmada`.
2. **Qué hacer con `"pendiente pago"`**: ¿cuenta como reservado? ¿Se excluye de todo hasta que se aclare su semántica real (dado que hoy es inconsistente entre pantallas)?
3. **Roles con acceso a Finanzas**: ¿`admin` + `administrador-clinico`, o solo `admin`?
4. **Acceso al backend**: para las Fases 5-6 (endpoints y SQL reales) necesito que compartas el repositorio del backend, o que me pegues los archivos de rutas/controladores de `reservaPacientes` y `profesionales` para poder proponer el código real en vez de solo el contrato conceptual de arriba.
5. **Agrupación "por servicio" vía texto libre** (`motivo_reserva`): ¿aceptable para V1, o prefieres que primero se resuelva a nivel de datos (normalizar el texto, o agregar la FK faltante a servicio) antes de construir el detalle expandible por servicio?

No voy a escribir código de implementación hasta que resolvamos estos 5 puntos — tal como pide explícitamente el prompt maestro.
