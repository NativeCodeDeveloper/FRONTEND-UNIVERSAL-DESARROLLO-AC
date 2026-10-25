# Propuesta · Perfiles de acceso por cargo y especialidad

> Estado: **implementado** en la rama `feat/firma-fes-front` (pendiente de revisión visual y commit).
> Decisiones D1–D9: se toman las recomendaciones como base acordada.
> Fuente actual: `src/lib/dashboard-access.js` (roles, rutas y menú), usada por
> `src/middleware.ts`, la barra lateral y `src/app/api/dashboard/users/*`.

---

## 1. Contexto y principios

- **Nadie se registra solo.** Los usuarios los crea únicamente NativeCode, como
  técnico, desde `/dashboard/createUser`. Al profesional se le asigna su agenda
  (`publicMetadata.idProfesionalAgenda`).
- **El perfil se define por el cargo** y, en los profesionales, **por la
  especialidad**: un médico no hace lo mismo que un psicólogo, ni un psicólogo
  lo mismo que un odontólogo.
- **Cada perfil ve solo lo que su trabajo necesita** (Ley 21.719: minimización
  de datos; Ley 20.584 art. 13: la ficha clínica es para quienes participan en la
  atención).
- **"Administrador de la clínica" administra la clínica, no el sistema.** Ve lo
  administrativo que sus trabajadores no ven, pero no crea usuarios ni toca la
  configuración técnica.
- **Los usuarios existentes no se rompen:** los valores antiguos se traducen
  solos al perfil nuevo (§5).

---

## 2. Diagnóstico de lo que hay hoy

| Hallazgo | Detalle |
|---|---|
| **Riesgo de seguridad** | Un usuario **sin rol** se trata como `default` y `default` = **administrador con acceso total** (`normalizeDashboardRole`, `hasFullDashboardAccess`). Además, el middleware lee el rol desde los *claims* de la sesión: si la plantilla de sesión de Clerk de una instancia no expone `publicMetadata`, el rol llega vacío y todos entrarían como administrador |
| 17 roles definidos | Solo 7 se pueden asignar desde el formulario; 8 están ocultos pero vigentes (`recepcionista`, `basico`, `centro-estetico`, `clinico-medico`, `odontologico`, `oftalmologia`, `agenda`, `configuracion`) |
| Duplicados | `recepcionista` y `secretaria` tienen exactamente los mismos permisos |
| Etiquetas que no calzan | "Profesional de Salud" (`operador-clinico`) no emite ningún documento; "Odontólogo" no maneja su propio calendario; "Administrador Clínico" no ve receta de lentes ni odontograma |
| Mezcla de cargos | `basico`, `clinico-medico`, `odontologico`, `oftalmologia` y `centro-estetico` mezclan atención clínica con configuración y contenido web |
| Usuarios sin correo | Se crean con usuario y contraseña. La reverificación de Clerk para firmar usará la contraseña (funciona; no habrá código por correo) |

---

## 3. Perfiles propuestos (15, en 4 grupos)

### A. NativeCode

| Valor | Perfil | Para quién | Qué hace |
|---|---|---|---|
| `tecnico-nativecode` | **Técnico NativeCode (super usuario)** | Ustedes | **Acceso total**: crea usuarios, asigna perfiles y agendas, configura la pasarela de pago y puede revisar cualquier módulo (agenda, pacientes, fichas, documentos) para dar soporte, **siempre con autorización de la clínica** (ver §3.1) |

### 3.1 Acceso de soporte de NativeCode

NativeCode ayuda a sus clientes revisando su agenda y su información con su
autorización. Para la Ley 21.719, NativeCode es **encargado de tratamiento**: puede
acceder a los datos de la clínica **por instrucción del responsable** (la clínica),
y debe poder demostrarlo. Por eso el acceso total va acompañado de:

- **Respaldo contractual:** el contrato o los términos con cada clínica autorizan el
  acceso de soporte (mandato de encargado de tratamiento).
- **Registro de accesos:** cada ingreso del técnico queda en `registro_accesos` (ya
  existe) con usuario, fecha, IP y ruta. Las vistas, descargas e impresiones de
  documentos clínicos quedan además en la bitácora de documentos de la firma
  electrónica.
- **Aviso visible:** una franja discreta "Modo soporte NativeCode" en el dashboard,
  para que siempre sea evidente que se está viendo como técnico.
- **Sin firmar por otros:** el técnico puede ver, pero **nunca firma** documentos ni
  dibuja firmas de profesionales (la firma es personal del profesional).

### B. Administración de la clínica (por categoría)

Administran la clínica, **no el sistema**: ven lo administrativo que sus
trabajadores no ven, pero no crean usuarios ni configuran la pasarela, y no ven el
contenido de las fichas clínicas (D1). Hay uno por **categoría de centro**, porque
cada tipo de clínica administra catálogos y documentos distintos.

**Base común de todo administrador:** agenda de todos los profesionales, bloqueos,
pacientes (datos administrativos), finanzas y montos, profesionales y agendas,
servicios y tarifas, plantillas de ficha, contenido web, **listado** de documentos
emitidos y de consentimientos (sin su contenido clínico), verificación del N° de
registro de la Superintendencia.

| Valor | Perfil | Para qué centro | Suma a la base |
|---|---|---|---|
| `admin-centro-salud` | **Administrador · Centro de salud** | Psicología, kinesiología, nutrición, fonoaudiología, terapia ocupacional | Nada más |
| `admin-clinica-medica` | **Administrador · Clínica médica** | Medicina general, especialidades médicas, matronería | Catálogo de exámenes clínicos |
| `admin-clinica-odontologica` | **Administrador · Clínica odontológica** | Odontología | Presupuestos y cotizaciones, tratamientos y categorías |
| `admin-centro-oftalmologico` | **Administrador · Centro oftalmológico** | Oftalmología, tecnología médica | Catálogo de exámenes clínicos |
| `admin-centro-estetico` | **Administrador · Centro estético** | Armonización facial, cosmetología | Presupuestos y cotizaciones, tratamientos y categorías, stock de productos |
| `admin-clinica` | **Administrador · Multiespecialidad** | Centros con varias especialidades | Todo lo anterior |

**Profesional que también administra (D2).** El dueño que atiende (por ejemplo,
un odontólogo) se crea con su perfil profesional y el interruptor **"También
administra la clínica"**: recibe además los módulos del administrador **de su misma
categoría** (odontólogo → Clínica odontológica). Así ve sus fichas como profesional y
finanzas y configuración como administrador, sin perfiles mixtos.

| Perfil profesional | Con "También administra" suma los módulos de |
|---|---|
| Profesional de salud (básico) | Administrador · Centro de salud |
| Médico, Matrona | Administrador · Clínica médica |
| Odontólogo | Administrador · Clínica odontológica |
| Oftalmología | Administrador · Centro oftalmológico |
| Estética | Administrador · Centro estético |

### C. Profesionales (por especialidad)

**Base común de todo profesional:**
- **Solo su propia agenda** y sus bloqueos.
- Pacientes: listado y registro.
- Ficha clínica y archivos de sus pacientes.
- Consentimientos informados.
- Firma electrónica: su firma, su N° de registro y documentos por firmar.

| Valor | Perfil | Especialidades que cubre | Suma a la base |
|---|---|---|---|
| `profesional-salud` | **Profesional de salud (básico)** | Psicología, kinesiología, nutrición, fonoaudiología, terapia ocupacional, enfermería | Nada más: ficha, certificados e indicaciones. Sin recetas ni exámenes |
| `profesional-medico` | **Médico** | Medicina general y especialidades médicas | Recetas y orden de exámenes |
| `profesional-odontologo` | **Odontólogo** | Odontología | Odontograma, presupuestos, recetas y exámenes. **Sin periodontograma por ahora** (se habilita cuando esté listo) |
| `profesional-matrona` | **Matrona** | Obstetricia y ginecología | Recetas y exámenes |
| `profesional-oftalmologia` | **Oftalmología** | Oftalmólogo, tecnólogo médico | Receta de lentes y exámenes |
| `profesional-estetica` | **Estética** | Armonización facial, cosmetología | Presupuestos y consentimientos de procedimientos. Sin recetas |

### D. Operación

| Valor | Perfil | Qué hace |
|---|---|---|
| `recepcion` | **Recepción y secretaría** (une las dos actuales) | Agenda de todos, reservas, bloqueos, registro y datos administrativos de pacientes, cotizaciones. **Sin acceso a fichas ni documentos clínicos** |
| `suspendido` | **Suspendido** | Solo ve la pantalla de suscripción cancelada |

---

## 4. Matriz de accesos

✓ = acceso · ◐ = acceso limitado · — = sin acceso

| Módulo | Técnico | Admin (base) | Básico | Médico | Odontólogo | Matrona | Oftalm. | Estética | Recepción |
|---|---|---|---|---|---|---|---|---|---|
| Panel de reservas | ✓ | ✓ | ◐ propias | ◐ propias | ◐ propias | ◐ propias | ◐ propias | ◐ propias | ✓ |
| Calendario y reservas | ✓ | ✓ todas | ◐ propia | ◐ propia | ◐ propia | ◐ propia | ◐ propia | ◐ propia | ✓ todas |
| Bloqueos de agenda | ✓ | ✓ | ◐ propios | ◐ propios | ◐ propios | ◐ propios | ◐ propios | ◐ propios | ✓ |
| Ver montos de reservas | ✓ | ✓ | — | — | ✓ | — | — | ✓ | ✓ |
| Listado y registro de pacientes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ficha clínica y archivos | ✓ | ver D1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Consentimiento informado | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Firma electrónica y documentos por firmar | ◐ ver, no firma | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Receta médica (solo impresión) | ✓ | — | — | ✓ | ✓ | ✓ | — | — | — |
| Receta de lentes (solo impresión) | ✓ | — | — | — | — | — | ✓ | — | — |
| Orden de exámenes | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| Odontograma | ✓ | — | — | — | ✓ | — | — | — | — |
| Periodontograma | ✓ | — | — | — | — *(próximo)* | — | — | — | — |
| Presupuestos y cotizaciones | ✓ | ✓ | — | — | ✓ | — | — | ✓ | ◐ cotizaciones |
| Resumen financiero | ✓ | ✓ | — | — | — | — | — | — | — |
| Profesionales y agendas | ✓ | ✓ | ◐ su tarjeta | ◐ su tarjeta | ◐ su tarjeta | ◐ su tarjeta | ◐ su tarjeta | ◐ su tarjeta | — |
| Servicios y tarifas | ✓ | ✓ | — | — | — | — | — | — | — |
| Tratamientos y categorías | ✓ | ✓ | — | — | ◐ consultar | — | — | ◐ consultar | — |
| Plantillas de ficha | ✓ | ✓ | — | — | — | — | — | — | — |
| Exámenes clínicos (catálogo) | ✓ | ✓ | — | — | — | — | — | — | — |
| Contenido web | ✓ | ✓ | — | — | — | — | — | — | — |
| Crear usuarios y perfiles | ✓ | — | — | — | — | — | — | — | — |
| Pasarela de pago | ✓ | — | — | — | — | — | — | — | — |
| Stock, pedidos y cupones | ✓ | ✓ | — | — | — | — | — | — | — |

---

La columna **Admin (base)** muestra lo común a los seis administradores; los
módulos que cada categoría suma están en §3 B. En la columna, "Presupuestos",
"Tratamientos" y "Exámenes clínicos (catálogo)" aplican solo a las categorías que
los suman.

## 5. Traducción de los perfiles actuales (sin tocar Clerk)

Los valores antiguos se siguen aceptando y se traducen al leerlos, así ningún
usuario existente pierde el acceso:

| Valor actual en Clerk | Perfil nuevo |
|---|---|
| `super-usuario-nativecode` | `tecnico-nativecode` |
| `admin`, `default` | `tecnico-nativecode` (acceso total de soporte) |
| `administrador-clinico`, `configuracion` | `admin-clinica` (multiespecialidad: conserva el acceso amplio que tenía; luego se puede pasar a su categoría) |
| `operador-clinico`, `basico`, `agenda` | `profesional-salud` |
| `operador-medico`, `clinico-medico` | `profesional-medico` |
| `operador-odontologico`, `odontologico` | `profesional-odontologo` |
| `oftalmologia` | `profesional-oftalmologia` |
| `centro-estetico` | `profesional-estetica` |
| `secretaria`, `recepcionista` | `recepcion` |
| `cancelado` | `suspendido` |
| *(vacío o desconocido)* | **sin acceso** |

Al editar un usuario desde el formulario, se guarda el valor nuevo.

---

## 6. Cambios de fondo incluidos

1. **Sin rol, sin acceso.** Se elimina el `default = administrador`. El acceso total queda solo para el técnico NativeCode, asignado explícitamente.
2. **Profesional = agenda obligatoria.** El formulario no deja crear un perfil
   profesional sin agenda asignada: define qué ve y con qué identidad firma.
3. **Formulario agrupado.** El desplegable de "Crear usuario" muestra los grupos
   NativeCode, Administración, Profesionales y Operación, con la lista de accesos y
   restricciones de cada perfil (como hoy).
4. **Una sola fuente de permisos.** Middleware, barra lateral, menú móvil y API
   siguen leyendo la misma tabla en `dashboard-access.js`.
5. **Modo soporte NativeCode:** franja visible y registro de accesos (§3.1).
6. **Firma electrónica alineada.** Solo los perfiles profesionales tienen firma y
   bandeja de documentos. El N° de registro de la Superintendencia lo verifica el
   administrador de la clínica (no el técnico NativeCode).

---

## 7. Decisiones abiertas

| # | Pregunta | Recomendación |
|---|---|---|
| **D1** | ¿El administrador de la clínica ve el **contenido** de las fichas clínicas? | **No.** La Ley 20.584 reserva la ficha a quienes atienden. Para el caso típico de dueño que también atiende, ver D2 |
| **D2** | ¿Agregamos un interruptor **"También administra la clínica"** a los perfiles profesionales? | **Sí.** El odontólogo dueño atiende a sus pacientes y además ve finanzas y configuración, sin crear perfiles mixtos. Se guarda como `publicMetadata.administraClinica: true` |
| **D3** | ¿Qué profesionales ven **montos**? | Odontólogo y estética (porque hacen presupuestos); los demás no. El administrador y recepción sí |
| **D4** | ¿`admin` / `default` siguen existiendo? | Se traducen a técnico NativeCode (acceso total), y solo si el valor está escrito explícitamente; un rol **vacío** no da acceso |
| **D9** | ¿El técnico debe indicar un **motivo** al entrar a datos clínicos (por ejemplo, "soporte ticket 123")? | Opcional para empezar; el registro de accesos ya deja usuario, fecha, IP y ruta |
| **D5** | ¿Matrona y Oftalmología como perfiles propios, o dentro de Médico? | Propios: son más precisos y no complican el formulario |
| **D6** | ¿Enfermería va en "básico" o tiene un perfil propio (con indicaciones de procedimientos)? | En "básico" por ahora |
| **D7** | ¿El panel de reservas del profesional muestra solo sus citas? | Sí, igual que hoy el calendario con agenda asignada |
| **D8** | ¿Recepción puede ver los consentimientos que el paciente aceptó al reservar? | Solo el listado (aceptado, fecha), sin abrir el contenido |

---

## 8. Plan de implementación (cuando apruebes)

1. `dashboard-access.js`: los 15 perfiles (6 administradores por categoría), sus rutas, sus ítems de menú y sus
   descripciones; tabla de traducción de valores antiguos; eliminar el acceso total
   por rol vacío.
2. `createUser`: desplegable agrupado, agenda obligatoria en profesionales,
   interruptor "También administra la clínica" (si D2 = sí).
3. API `users` y `users/[userId]`: aceptar los valores nuevos y el interruptor.
4. Pantallas con reglas propias por rol (ficha clínica, odontograma, recetas desde
   la ficha, panel de reservas, montos): usar las funciones de permiso nuevas.
5. Firma electrónica: `ROLES_ADMINISTRADOR` → administrador de la clínica +
   interruptor; bandeja y firma solo para profesionales.
6. Pruebas: matriz de rutas por perfil (cada perfil contra cada ruta del
   dashboard) y traducción de valores antiguos.
7. Verificar en el panel de Clerk de cada instancia que la plantilla de sesión
   exponga `publicMetadata` (si no, el rol no llega al middleware).

---

## 9. Implementación

| Pieza | Archivo |
|---|---|
| Perfiles, rutas, traducción de valores antiguos, interruptor, agenda restringida | `src/lib/dashboard-access.js` |
| Reglas de la API (autorización, agenda obligatoria, interruptor) | `src/lib/usuariosClerkServidor.js`, `src/app/api/dashboard/users/*` |
| Pantalla "Usuarios y perfiles" (estilo Apple) | `src/app/dashboard/createUser/page.jsx` |
| Middleware tolerante a instancias sin plantilla de sesión + guardia del cliente para todos los perfiles | `src/middleware.ts`, `src/app/dashboard/SecretariaRouteGuard.jsx` |
| Agenda restringida solo para el profesional que no administra | panel de reservas, calendario, bloqueos |
| Montos visibles según perfil | `canSeeReservationAmounts` |
| Contenido clínico solo para perfiles clínicos en la carpeta del paciente | `paciente/[id_paciente]`, `ListaDocumentosPaciente` |
| Pruebas | `tests/perfilesAcceso.test.mjs` (matriz de rutas por perfil) |

**Plantilla de sesión de Clerk.** Para que el middleware aplique los permisos en
el servidor, cada instancia debe tener en *Sessions → Customize session token*:
`{"metadata": "{{user.public_metadata}}"}`. Sin ella el sistema sigue funcionando:
decide el guardia del cliente y la API consulta el usuario a Clerk.

---

## 10. Pendientes de este tema

| # | Pendiente | Responsable |
|---|---|---|
| 1 | Plantilla de sesión en cada instancia de Clerk: `{"metadata": "{{user.public_metadata}}"}` (por panel o con el CLI oficial: `npx clerk@latest config patch --json '{"session":{"claims":{"metadata":"{{user.public_metadata}}"}}}'`; probar primero en desarrollo y respaldar con `config pull`) | NativeCode (con Nicolás) |
| 2 | Revisar a los usuarios que eran `administrador-clinico`: quien sea dueño y atienda pasa a su perfil profesional con "También administra la clínica" | NativeCode |
| 3 | Cerrar el registro abierto: modo *Restricted* en Clerk (*User & Authentication → Restrictions*) y quitar o redirigir la página `/sign-up` | NativeCode + front |
| 4 | ✅ **Hecho.** Franja "Modo soporte NativeCode" para el técnico (§3.1): `src/app/dashboard/FranjaModoSoporte.jsx` | Front |
| 5 | ✅ **Hecho.** Observación, antecedentes clínicos y su edición, ocultos para administración y recepción en `paciente/[id_paciente]` (completa D1; al editar, esos valores se conservan) | Front |
| 6 | Revisión visual de "Usuarios y perfiles" y del menú de cada perfil, en celular y escritorio | NativeCode |
| 7 | Commit de la rama `feat/firma-fes-front` | Front |
