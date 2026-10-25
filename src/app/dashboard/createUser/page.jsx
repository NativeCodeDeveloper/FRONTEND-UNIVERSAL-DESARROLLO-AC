"use client";

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Eye, EyeOff, KeyRound, Minus, RefreshCw, Search, Trash2, UserPlus, UsersRound } from "lucide-react";
import {
  GRUPOS_PERFIL,
  getCreatableDashboardRoles,
  getDashboardRoleLabel,
  normalizeDashboardRole,
} from "@/lib/dashboard-access";
import { ZONA_CLINICA } from "@/lib/fechas";

/*
 * Usuarios y perfiles (solo técnico NativeCode). Los usuarios no se registran
 * solos: se crean aquí con nombre de usuario, contraseña y perfil. A los
 * profesionales se les asigna su agenda, que define qué ven y con qué identidad
 * firman. Reglas de perfiles: src/lib/dashboard-access.js.
 */

const PERFILES = getCreatableDashboardRoles();
const PERFIL_POR_VALOR = new Map(PERFILES.map((p) => [p.value, p]));
const ORDEN_GRUPOS = ["nativecode", "administracion", "profesionales", "operacion"];

const FORMULARIO_INICIAL = {
  nombre: "",
  apellido: "",
  nombreUsuario: "",
  password: "",
  confirmPassword: "",
  role: "",
  idProfesionalAgenda: "",
  administraClinica: false,
};

async function leerRespuesta(response) {
  const texto = await response.text();
  try {
    return texto ? JSON.parse(texto) : null;
  } catch {
    return { error: texto };
  }
}

function formatearUltimoIngreso(valor) {
  if (!valor) return "Nunca ha ingresado";
  // fecha-ok: lastSignInAt de Clerk es un instante real; se muestra en la zona de la clínica.
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: ZONA_CLINICA }).format(new Date(valor));
}

// ── Piezas visuales ─────────────────────────────────────────────────────────

const campoClase =
  "h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] text-[#1D1D1F] outline-none transition placeholder:text-[#AEAEB2] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15 disabled:bg-[#F5F5F7]";

function Campo({ etiqueta, ayuda, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[13px] font-medium text-[#1D1D1F]">{etiqueta}</span>
      {ayuda ? <span className="mt-0.5 block text-[12px] text-[#86868B]">{ayuda}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function CampoContrasena(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${campoClase} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SelectorPerfil({ value, onChange, disabled = false, incluirVacio = true, valorAntiguo }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${campoClase} appearance-none pr-10 font-medium`}
      >
        {incluirVacio ? <option value="" disabled>Selecciona un perfil</option> : null}
        {valorAntiguo ? <option value={valorAntiguo} disabled>{getDashboardRoleLabel(valorAntiguo)} (valor anterior)</option> : null}
        {ORDEN_GRUPOS.map((grupo) => (
          <optgroup key={grupo} label={GRUPOS_PERFIL[grupo]}>
            {PERFILES.filter((p) => p.grupo === grupo).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]" />
    </div>
  );
}

function SelectorAgenda({ value, onChange, profesionales, disabled = false, requerida = false }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${campoClase} appearance-none pr-10`}>
        <option value="">{requerida ? "Selecciona la agenda del profesional" : "Sin agenda asignada"}</option>
        {profesionales.map((p) => (
          <option key={p.id_profesional} value={String(p.id_profesional)}>{p.nombreProfesional}</option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]" />
    </div>
  );
}

/** Interruptor estilo iOS. */
function Interruptor({ activo, onCambio, etiqueta, descripcion, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F5F5F7] px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#1D1D1F]">{etiqueta}</p>
        {descripcion ? <p className="mt-0.5 text-[12px] leading-snug text-[#86868B]">{descripcion}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        disabled={disabled}
        onClick={() => onCambio(!activo)}
        className={`relative mt-0.5 h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${activo ? "bg-[#34C759]" : "bg-[#E9E9EB]"}`}
      >
        <span
          className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-200 ${activo ? "translate-x-[22px]" : "translate-x-[2px]"}`}
        />
      </button>
    </div>
  );
}

function DetallePerfil({ perfil }) {
  if (!perfil) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.1] px-5 py-7 text-center">
        <UsersRound className="mx-auto h-6 w-6 text-[#C7C7CC]" />
        <p className="mt-2 text-[13px] font-medium text-[#1D1D1F]">Elige un perfil</p>
        <p className="mt-0.5 text-[12px] text-[#86868B]">Aquí verás todo lo que puede y no puede hacer.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-[#F5F5F7]" aria-live="polite">
      <div className="px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#007AFF]">{perfil.grupoLabel}</p>
        <p className="mt-0.5 text-[15px] font-semibold text-[#1D1D1F]">{perfil.label}</p>
        <p className="mt-0.5 text-[13px] text-[#6E6E73]">{perfil.description}</p>
      </div>
      <div className="grid gap-px bg-black/[0.06] sm:grid-cols-2">
        <div className="bg-white px-4 py-3.5">
          <p className="text-[12px] font-semibold text-[#1D1D1F]">Puede</p>
          <ul className="mt-2 space-y-1.5">
            {perfil.access.map((a) => (
              <li key={a} className="flex items-start gap-2 text-[13px] leading-snug text-[#3A3A3C]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34C759]" strokeWidth={3} />
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white px-4 py-3.5">
          <p className="text-[12px] font-semibold text-[#1D1D1F]">No puede</p>
          <ul className="mt-2 space-y-1.5">
            {perfil.restrictions.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] leading-snug text-[#6E6E73]">
                <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#AEAEB2]" strokeWidth={3} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Aviso({ tono = "error", children }) {
  const clases = tono === "ok" ? "bg-[#34C759]/12 text-[#1E7B34]" : "bg-[#FF3B30]/10 text-[#C4291D]";
  return <div className={`rounded-xl px-4 py-3 text-[13px] ${clases}`}>{children}</div>;
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function CrearUsuarioPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [form, setForm] = useState(FORMULARIO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [creado, setCreado] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState("");
  const [mensajeUsuarios, setMensajeUsuarios] = useState("");
  const [profesionales, setProfesionales] = useState([]);
  const [errorProfesionales, setErrorProfesionales] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  const perfil = PERFIL_POR_VALOR.get(form.role) || null;
  const nombreAgenda = useMemo(
    () => Object.fromEntries(profesionales.map((p) => [String(p.id_profesional), p.nombreProfesional])),
    [profesionales]
  );

  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true);
    setErrorUsuarios("");
    try {
      const response = await fetch("/api/dashboard/users", { cache: "no-store" });
      const data = await leerRespuesta(response);
      if (!response.ok) throw new Error(data?.error || "No se pudieron cargar los usuarios.");
      setUsuarios(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setErrorUsuarios(e.message || "No se pudieron cargar los usuarios.");
    } finally {
      setCargandoUsuarios(false);
    }
  }, []);

  const cargarProfesionales = useCallback(async () => {
    if (!API) {
      setErrorProfesionales("No se configuró la conexión para cargar las agendas.");
      return;
    }
    try {
      const response = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("No se pudieron cargar las agendas profesionales.");
      const lista = await response.json();
      setProfesionales(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setErrorProfesionales(e.message || "No se pudieron cargar las agendas profesionales.");
    }
  }, [API]);

  useEffect(() => {
    cargarUsuarios();
    cargarProfesionales();
  }, [cargarUsuarios, cargarProfesionales]);

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError("");
  }

  function cambiarPerfil(valor) {
    const esProfesional = PERFIL_POR_VALOR.get(valor)?.esProfesional;
    // Agenda e interruptor solo existen en perfiles profesionales.
    setForm((f) => ({
      ...f,
      role: valor,
      idProfesionalAgenda: esProfesional ? f.idProfesionalAgenda : "",
      administraClinica: esProfesional ? f.administraClinica : false,
    }));
    setError("");
  }

  async function crear(e) {
    e.preventDefault();
    setError("");
    setCreado(null);

    if (!form.nombre.trim()) return setError("Completa el nombre.");
    if (!form.nombreUsuario.trim()) return setError("Completa el nombre de usuario.");
    if (!form.password) return setError("Completa la contraseña.");
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden.");
    if (!perfil) return setError("Selecciona un perfil.");
    if (perfil.esProfesional && !form.idProfesionalAgenda) {
      return setError("Asigna la agenda del profesional: define qué ve y con qué identidad firma.");
    }

    setEnviando(true);
    try {
      const response = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          nombreUsuario: form.nombreUsuario,
          password: form.password,
          role: form.role,
          idProfesionalAgenda: form.idProfesionalAgenda,
          administraClinica: form.administraClinica,
        }),
      });
      const data = await leerRespuesta(response);
      if (!response.ok) throw new Error(data?.error || `No se pudo crear el usuario (HTTP ${response.status}).`);
      setCreado(data?.user || null);
      setForm({ ...FORMULARIO_INICIAL, role: form.role });
      await cargarUsuarios();
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario.");
    } finally {
      setEnviando(false);
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      const grupo = PERFIL_POR_VALOR.get(normalizeDashboardRole(u.perfil || u.role).replace("+admin", ""))?.grupo;
      if (filtroGrupo !== "todos" && grupo !== filtroGrupo) return false;
      if (!termino) return true;
      return [u.nombre, u.nombreUsuario, getDashboardRoleLabel(u.perfil || u.role), nombreAgenda[u.idProfesionalAgenda]]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(termino));
    });
  }, [usuarios, busqueda, filtroGrupo, nombreAgenda]);

  return (
    <div className="font-system-apple min-h-screen bg-[#FAFAFB]">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8">
          <h1 className="text-[26px] font-semibold tracking-tight text-[#1D1D1F]">Usuarios y perfiles</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-[#6E6E73]">
            Crea los accesos de cada clínica. A los profesionales se les asigna su agenda: define qué ven y con qué identidad firman.
          </p>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── Nuevo usuario ── */}
          <form onSubmit={crear} className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,40,120,0.18)] ring-1 ring-black/[0.05] md:p-7">
            <h2 className="text-[17px] font-semibold text-[#1D1D1F]">Nuevo usuario</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Campo etiqueta="Nombre">
                <input value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} placeholder="María" className={campoClase} />
              </Campo>
              <Campo etiqueta="Apellido" ayuda="Opcional">
                <input value={form.apellido} onChange={(e) => actualizar("apellido", e.target.value)} placeholder="González" className={campoClase} />
              </Campo>
              <Campo etiqueta="Nombre de usuario" ayuda="Con él inicia sesión" className="md:col-span-2">
                <input
                  value={form.nombreUsuario}
                  onChange={(e) => actualizar("nombreUsuario", e.target.value.replace(/\s+/g, "").toLowerCase())}
                  placeholder="maria.gonzalez"
                  autoCapitalize="none"
                  className={campoClase}
                />
              </Campo>
              <Campo etiqueta="Contraseña">
                <CampoContrasena value={form.password} onChange={(e) => actualizar("password", e.target.value)} placeholder="Contraseña segura" />
              </Campo>
              <Campo etiqueta="Confirmar contraseña">
                <CampoContrasena value={form.confirmPassword} onChange={(e) => actualizar("confirmPassword", e.target.value)} placeholder="Repite la contraseña" />
              </Campo>
            </div>

            <div className="mt-6 space-y-4 border-t border-black/[0.06] pt-6">
              <Campo etiqueta="Perfil" ayuda="Según su cargo y, si es profesional, su especialidad">
                <SelectorPerfil value={form.role} onChange={cambiarPerfil} />
              </Campo>

              {perfil?.esProfesional ? (
                <>
                  <Campo etiqueta="Agenda del profesional" ayuda="Obligatoria: verá solo esta agenda y firmará como este profesional">
                    <SelectorAgenda
                      value={form.idProfesionalAgenda}
                      onChange={(v) => actualizar("idProfesionalAgenda", v)}
                      profesionales={profesionales}
                      requerida
                    />
                    {errorProfesionales ? <span className="mt-1 block text-[12px] text-[#C4291D]">{errorProfesionales}</span> : null}
                  </Campo>
                  <Interruptor
                    activo={form.administraClinica}
                    onCambio={(v) => actualizar("administraClinica", v)}
                    etiqueta="También administra la clínica"
                    descripcion={`Para el dueño que atiende: suma los módulos de ${perfil.administradorAsociado} y ve todas las agendas.`}
                  />
                </>
              ) : null}

              <DetallePerfil perfil={perfil} />
            </div>

            <div className="mt-6 space-y-3">
              {error ? <Aviso>{error}</Aviso> : null}
              {creado ? (
                <Aviso tono="ok">
                  <span className="font-semibold">@{creado.nombreUsuario}</span> quedó creado como{" "}
                  <span className="font-semibold">{getDashboardRoleLabel(creado.perfil || creado.role)}{creado.administraClinica ? " · administra la clínica" : ""}</span>.
                </Aviso>
              ) : null}
              <button
                type="submit"
                disabled={enviando || !perfil}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC] disabled:bg-[#007AFF]/40 sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                {enviando ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </form>

          {/* ── Cómo funciona ── */}
          <aside className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,40,120,0.18)] ring-1 ring-black/[0.05] md:p-6">
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">Cómo funcionan los perfiles</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Por cargo y especialidad", "Cada perfil ve solo lo que su trabajo necesita. Un médico no hace lo mismo que un psicólogo ni que un odontólogo."],
                ["Administración por categoría", "El administrador gestiona la clínica (agenda, finanzas, configuración) sin ver el contenido de las fichas clínicas."],
                ["Profesional dueño", "Con «También administra la clínica», un profesional suma lo administrativo de su categoría."],
                ["Soporte NativeCode", "El técnico ve todo para dar soporte, con autorización de la clínica y quedando registrado."],
              ].map(([titulo, texto], i) => (
                <li key={titulo} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-[12px] font-semibold text-white">{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">{titulo}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[#6E6E73]">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {/* ── Usuarios ── */}
        <section className="mt-8 rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,40,120,0.18)] ring-1 ring-black/[0.05]">
          <div className="flex flex-col gap-4 border-b border-black/[0.06] px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
            <div>
              <h2 className="text-[17px] font-semibold text-[#1D1D1F]">Usuarios de esta clínica</h2>
              <p className="text-[13px] text-[#86868B]">{usuarios.length} {usuarios.length === 1 ? "usuario" : "usuarios"}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar usuario, perfil o agenda"
                  aria-label="Buscar usuario"
                  className="h-10 w-full rounded-full bg-[#F5F5F7] pl-9 pr-4 text-[14px] text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:ring-4 focus:ring-[#007AFF]/15 sm:w-64"
                />
              </div>
              <button
                type="button"
                onClick={cargarUsuarios}
                disabled={cargandoUsuarios}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#007AFF]/10 px-4 text-[13px] font-semibold text-[#007AFF] transition-colors hover:bg-[#007AFF]/15 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${cargandoUsuarios ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="sin-barra overflow-x-auto px-5 pt-4 md:px-7">
            <div role="tablist" className="inline-flex rounded-full bg-[#F5F5F7] p-1">
              {[["todos", "Todos"], ...ORDEN_GRUPOS.map((g) => [g, GRUPOS_PERFIL[g]])].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  role="tab"
                  aria-selected={filtroGrupo === valor}
                  onClick={() => setFiltroGrupo(valor)}
                  className={`h-8 whitespace-nowrap rounded-full px-3.5 text-[12px] font-medium transition-all ${
                    filtroGrupo === valor ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-[#6E6E73]"
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-5 md:p-7">
            {errorUsuarios ? <Aviso>{errorUsuarios}</Aviso> : null}
            {mensajeUsuarios ? <Aviso tono="ok">{mensajeUsuarios}</Aviso> : null}

            {cargandoUsuarios ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-[#F5F5F7]" />)}
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/[0.1] px-5 py-10 text-center">
                <UsersRound className="mx-auto h-7 w-7 text-[#C7C7CC]" />
                <p className="mt-2 text-[14px] font-medium text-[#1D1D1F]">
                  {usuarios.length === 0 ? "Aún no hay usuarios." : "Ningún usuario coincide con la búsqueda."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
                {usuariosFiltrados.map((usuario) => (
                  <FilaUsuario
                    key={usuario.id}
                    usuario={usuario}
                    profesionales={profesionales}
                    nombreAgenda={nombreAgenda}
                    onActualizado={(datos) => {
                      setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, ...datos } : u)));
                    }}
                    onEliminado={() => setUsuarios((lista) => lista.filter((u) => u.id !== usuario.id))}
                    onMensaje={(m) => {
                      setMensajeUsuarios(m);
                      setErrorUsuarios("");
                    }}
                    onError={(m) => {
                      setErrorUsuarios(m);
                      setMensajeUsuarios("");
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Fila de usuario con edición en línea ───────────────────────────────────

function FilaUsuario({ usuario, profesionales, nombreAgenda, onActualizado, onEliminado, onMensaje, onError }) {
  const perfilActual = normalizeDashboardRole(usuario.perfil || usuario.role).replace("+admin", "");
  const valorAntiguo = usuario.role && usuario.role !== perfilActual ? usuario.role : "";
  const [abierta, setAbierta] = useState(false);
  const [role, setRole] = useState(PERFIL_POR_VALOR.has(perfilActual) ? perfilActual : "");
  const [agenda, setAgenda] = useState(String(usuario.idProfesionalAgenda || ""));
  const [administra, setAdministra] = useState(Boolean(usuario.administraClinica));
  const [contrasena, setContrasena] = useState("");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [accion, setAccion] = useState("");

  const perfil = PERFIL_POR_VALOR.get(role) || null;
  const etiqueta = getDashboardRoleLabel(perfilActual);
  const sinPerfil = !PERFIL_POR_VALOR.has(perfilActual);

  async function patch(cuerpo, mensaje) {
    const response = await fetch(`/api/dashboard/users/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = await leerRespuesta(response);
    if (!response.ok) throw new Error(data?.error || "No se pudo actualizar el usuario.");
    onMensaje(mensaje);
    return data;
  }

  async function guardarPerfil() {
    if (!perfil) return onError("Selecciona un perfil válido.");
    if (perfil.esProfesional && !agenda) return onError("Asigna la agenda del profesional antes de guardar.");
    setAccion("perfil");
    try {
      const data = await patch(
        { role, idProfesionalAgenda: perfil.esProfesional ? agenda : "", administraClinica: perfil.esProfesional && administra },
        `Perfil de @${usuario.nombreUsuario} actualizado.`
      );
      onActualizado({
        role: data.role,
        perfil: data.perfil,
        idProfesionalAgenda: data.idProfesionalAgenda,
        administraClinica: data.administraClinica,
      });
      setAbierta(false);
    } catch (e) {
      onError(e.message);
    } finally {
      setAccion("");
    }
  }

  async function cambiarContrasena() {
    if (!contrasena) return onError("Ingresa la nueva contraseña.");
    setAccion("contrasena");
    try {
      await patch({ password: contrasena }, `Contraseña de @${usuario.nombreUsuario} actualizada.`);
      setContrasena("");
    } catch (e) {
      onError(e.message);
    } finally {
      setAccion("");
    }
  }

  async function eliminar() {
    setAccion("eliminar");
    try {
      const response = await fetch(`/api/dashboard/users/${usuario.id}`, { method: "DELETE" });
      const data = await leerRespuesta(response);
      if (!response.ok) throw new Error(data?.error || "No se pudo eliminar el usuario.");
      onMensaje(`@${usuario.nombreUsuario} fue eliminado.`);
      onEliminado();
    } catch (e) {
      onError(e.message);
      setConfirmandoEliminar(false);
    } finally {
      setAccion("");
    }
  }

  return (
    <li className="bg-white">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[#1D1D1F]">{usuario.nombre || "Sin nombre"}</p>
          <p className="truncate text-[13px] text-[#86868B]">
            @{usuario.nombreUsuario || "sin-usuario"} · {formatearUltimoIngreso(usuario.lastSignInAt)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sinPerfil ? "bg-[#FF3B30]/10 text-[#C4291D]" : "bg-[#007AFF]/10 text-[#0062CC]"}`}>
              {sinPerfil ? "Sin perfil · sin acceso" : etiqueta}
            </span>
            {usuario.administraClinica && PERFIL_POR_VALOR.get(perfilActual)?.esProfesional ? (
              <span className="rounded-full bg-[#34C759]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E7B34]">Administra la clínica</span>
            ) : null}
            {usuario.idProfesionalAgenda && PERFIL_POR_VALOR.get(perfilActual)?.esProfesional ? (
              <span className="rounded-full bg-[#F2F2F7] px-2.5 py-0.5 text-[11px] font-medium text-[#636366]">
                Agenda: {nombreAgenda[usuario.idProfesionalAgenda] || `#${usuario.idProfesionalAgenda}`}
              </span>
            ) : null}
            {valorAntiguo ? (
              <span title="Se actualiza al nombre nuevo cuando guardes el perfil" className="rounded-full bg-[#F2F2F7] px-2.5 py-0.5 text-[11px] text-[#8E8E93]">
                valor anterior: {valorAntiguo}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAbierta((a) => !a)}
          aria-expanded={abierta}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-[#007AFF]/10 px-4 text-[13px] font-semibold text-[#007AFF] transition-colors hover:bg-[#007AFF]/15 sm:self-auto"
        >
          {abierta ? "Cerrar" : "Editar"}
          <ChevronDown className={`h-4 w-4 transition-transform ${abierta ? "rotate-180" : ""}`} />
        </button>
      </div>

      {abierta ? (
        <div className="space-y-4 border-t border-black/[0.06] bg-[#FBFBFD] px-4 py-4 sm:px-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Campo etiqueta="Perfil">
              <SelectorPerfil
                value={role}
                onChange={(v) => {
                  setRole(v);
                  if (!PERFIL_POR_VALOR.get(v)?.esProfesional) setAdministra(false);
                }}
                disabled={Boolean(accion)}
                incluirVacio={!role}
              />
            </Campo>
            {perfil?.esProfesional ? (
              <Campo etiqueta="Agenda del profesional">
                <SelectorAgenda value={agenda} onChange={setAgenda} profesionales={profesionales} disabled={Boolean(accion)} requerida />
              </Campo>
            ) : null}
          </div>
          {perfil?.esProfesional ? (
            <Interruptor
              activo={administra}
              onCambio={setAdministra}
              disabled={Boolean(accion)}
              etiqueta="También administra la clínica"
              descripcion={`Suma los módulos de ${perfil.administradorAsociado} y ve todas las agendas.`}
            />
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={guardarPerfil}
              disabled={Boolean(accion)}
              className="h-10 rounded-full bg-[#007AFF] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0062CC] disabled:opacity-50"
            >
              {accion === "perfil" ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>

          <div className="grid gap-4 border-t border-black/[0.06] pt-4 md:grid-cols-2">
            <Campo etiqueta="Nueva contraseña">
              <div className="flex gap-2">
                <CampoContrasena value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder="Nueva contraseña" disabled={Boolean(accion)} />
                <button
                  type="button"
                  onClick={cambiarContrasena}
                  disabled={Boolean(accion) || !contrasena}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#007AFF]/10 px-4 text-[13px] font-semibold text-[#007AFF] transition-colors hover:bg-[#007AFF]/15 disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  {accion === "contrasena" ? "…" : "Cambiar"}
                </button>
              </div>
            </Campo>

            <div className="flex items-end justify-end">
              {confirmandoEliminar ? (
                <div className="flex w-full flex-col gap-2 rounded-2xl bg-[#FF3B30]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[13px] text-[#C4291D]">¿Eliminar a @{usuario.nombreUsuario} de forma permanente?</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmandoEliminar(false)} disabled={Boolean(accion)} className="h-9 rounded-full px-4 text-[13px] font-medium text-[#007AFF] hover:bg-white/60">
                      Cancelar
                    </button>
                    <button type="button" onClick={eliminar} disabled={Boolean(accion)} className="h-9 rounded-full bg-[#FF3B30] px-4 text-[13px] font-semibold text-white hover:bg-[#E0352B] disabled:opacity-50">
                      {accion === "eliminar" ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                  disabled={Boolean(accion)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#FF3B30]/10 px-4 text-[13px] font-semibold text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/15 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar usuario
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}
