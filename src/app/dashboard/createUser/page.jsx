"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleMinus,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus,
  UsersRound,
} from "lucide-react";
import {
  getAssignableDashboardRoles,
  getDashboardRoleLabel,
} from "@/lib/dashboard-access";

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
};

const ROLE_OPTIONS = getAssignableDashboardRoles();
const ROLE_OPTIONS_BY_VALUE = new Map(
  ROLE_OPTIONS.map((option) => [option.value, option])
);

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[12px] font-semibold text-slate-800">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
      {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function PasswordInput({ ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        {...props}
        type={show ? "text" : "password"}
        className="w-full bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={() => setShow(prev => !prev)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function RolePermissionDetails({ role }) {
  if (!role) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="mt-3 overflow-hidden rounded-[24px] border border-violet-200 bg-white shadow-[0_16px_40px_rgba(110,86,207,0.10)]"
    >
      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6E56CF] text-white shadow-lg shadow-violet-200">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E56CF]">
                Perfil seleccionado
              </p>
              <h3 className="mt-0.5 text-[16px] font-bold text-slate-900">{role.label}</h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-600">{role.description}</p>
            </div>
          </div>
          <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6E56CF]">
            {role.value}
          </span>
        </div>

        {role.recommendedFor ? (
          <div className="mt-4 rounded-2xl border border-violet-100 bg-white/80 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recomendado para
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-700">{role.recommendedFor}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Todos los accesos de este perfil
            </h4>
          </div>
          <ul className="mt-3 space-y-2.5">
            {role.access.map((permission) => (
              <li key={permission} className="flex items-start gap-2.5 text-[12px] leading-5 text-slate-600">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="flex items-center gap-2">
            <CircleMinus className="h-4 w-4 text-amber-600" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Restricciones importantes
            </h4>
          </div>
          {role.restrictions.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {role.restrictions.map((restriction) => (
                <li key={restriction} className="flex items-start gap-2.5 text-[12px] leading-5 text-slate-600">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{restriction}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[12px] leading-5 text-slate-500">
              Este perfil no tiene restricciones específicas configuradas.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function CreateUserPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState(null);

  const selectedRoleMeta = ROLE_OPTIONS_BY_VALUE.get(form.role) || null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCreatedUser(null);

    if (!form.email.trim()) {
      setError("Completa el correo.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("La confirmacion de contrasena no coincide.");
      return;
    }

    if (!selectedRoleMeta) {
      setError("Selecciona un perfil para revisar y asignar sus accesos.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const rawResponse = await response.text();
      let data = null;

      try {
        data = rawResponse ? JSON.parse(rawResponse) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          rawResponse ||
          `No se pudo crear el usuario. HTTP ${response.status}`
        );
      }

      setCreatedUser(data?.user || null);
      setForm({ ...initialForm, role: form.role });
    } catch (submitError) {
      setError(submitError.message || "No se pudo crear el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
      <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

        {/* ── Header ── */}
        <div className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Administración del Sistema</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
            Crear Usuario
          </h1>
          <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
            Crea un usuario en Clerk con correo y contraseña, y asígnale un perfil. El rol queda guardado en <code className="mx-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">publicMetadata.role</code> para que el middleware y el menú respeten sus permisos.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px] items-start">

          {/* ── Formulario principal ── */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Datos del nuevo usuario</h2>
              <div className="h-9 px-4 rounded-xl border border-slate-200 bg-white flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perfil:</span>
                <span className="text-[12px] font-bold text-[#6E56CF]">
                  {selectedRoleMeta?.label || "Sin seleccionar"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6">
              <Field label="Correo electronico" hint="Se usara como email principal del usuario">
                <Input
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="usuario@dominio.cl"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Contrasena" hint="Minimo 8 caracteres">
                  <PasswordInput
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="Ingresa una contrasena segura"
                  />
                </Field>
                <Field label="Confirmar contrasena" hint="Debe coincidir con la anterior">
                  <PasswordInput
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    placeholder="Repite la contrasena"
                  />
                </Field>
              </div>

              <Field
                label="Perfil del sistema"
                hint="Selecciona un perfil para desplegar todos sus accesos antes de crear el usuario"
              >
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-3 md:p-4">
                  <div className="relative">
                    <select
                      id="dashboard-role"
                      aria-label="Seleccionar perfil del sistema"
                      value={form.role}
                      onChange={(event) => {
                        updateField("role", event.target.value);
                        setError("");
                      }}
                      className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-[14px] font-semibold text-slate-800 shadow-sm outline-none transition-all hover:border-violet-300 focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="" disabled>
                        Selecciona un perfil de acceso
                      </option>
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6E56CF]"
                    />
                  </div>

                  {selectedRoleMeta ? (
                    <RolePermissionDetails role={selectedRoleMeta} />
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-violet-200 bg-white px-5 py-6 text-center">
                      <UsersRound className="mx-auto h-6 w-6 text-violet-300" />
                      <p className="mt-2 text-[13px] font-semibold text-slate-700">
                        Aún no has seleccionado un perfil
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Al elegirlo se desplegará aquí la lista completa de accesos y restricciones.
                      </p>
                    </div>
                  )}
                </div>
              </Field>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
              ) : null}

              {createdUser ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-[13px] text-emerald-800">
                  <p className="font-semibold">Usuario creado correctamente.</p>
                  <p className="mt-1">
                    {createdUser.email} fue creado con el perfil{" "}
                    <span className="font-semibold">{getDashboardRoleLabel(createdUser.role)}</span>.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedRoleMeta}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6E56CF] px-6 text-[13px] font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-[#5b45bc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting
                    ? "Creando usuario..."
                    : selectedRoleMeta
                      ? "Crear usuario"
                      : "Selecciona un perfil"}
                </button>
                <p className="text-[12px] text-slate-500">
                  El acceso final del usuario quedara determinado por el rol seleccionado.
                </p>
              </div>
            </form>
          </div>

          {/* ── Panel lateral ── */}
          <aside className="space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Metadata aplicada</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">publicMetadata.role</p>
                  <p className="mt-1.5 text-[15px] font-bold text-[#6E56CF]">
                    {form.role || "Pendiente de selección"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Resumen del perfil</p>
                  <p className="mt-1.5 text-[13px] font-bold text-slate-800">
                    {selectedRoleMeta?.label || "Sin perfil seleccionado"}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    {selectedRoleMeta?.description || "Selecciona un perfil para revisar el alcance de sus permisos."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      {selectedRoleMeta?.access.length || 0} capacidades
                    </span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      {selectedRoleMeta?.restrictions.length || 0} restricciones
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Como funciona</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[13px] font-bold text-slate-900">1. Clerk crea el usuario</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">Se registra correo y contrasena usando el Backend SDK.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[13px] font-bold text-slate-900">2. Se asigna el perfil</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    El rol queda guardado en <span className="font-semibold text-slate-700">publicMetadata.role</span> y{" "}
                    <span className="font-semibold text-slate-700">publicMetadata.rol</span>.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[13px] font-bold text-slate-900">3. El sistema restringe accesos</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">Middleware, sidebar y menu movil usan la misma tabla de permisos del dashboard.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
