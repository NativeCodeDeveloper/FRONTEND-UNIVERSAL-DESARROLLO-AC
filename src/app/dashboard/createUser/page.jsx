"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, UserPlus, BadgeCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import {
  getAssignableDashboardRoles,
  getDashboardRoleAccessList,
  getDashboardRoleDescription,
  getDashboardRoleLabel,
} from "@/lib/dashboard-access";

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  role: "basico",
};

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <div>
        <span className="text-[12px] font-semibold text-slate-800">{label}</span>
        {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </label>
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

export default function CreateUserPage() {
  const roleOptions = useMemo(() => getAssignableDashboardRoles(), []);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState(null);

  const selectedRoleMeta = useMemo(
    () => roleOptions.find((option) => option.value === form.role) || roleOptions[0],
    [form.role, roleOptions]
  );
  const selectedRoleAccess = selectedRoleMeta?.access?.length
    ? selectedRoleMeta.access
    : getDashboardRoleAccessList(form.role);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_32px_90px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(8,145,178,0.06),rgba(79,70,229,0.08))] px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Provision de usuarios
                  </div>
                  <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[34px]">
                    Crear usuarios Clerk con perfil del dashboard
                  </h1>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-slate-600">
                    Este formulario crea el usuario en Clerk usando solo correo y contrasena, y le asigna el perfil en
                    <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-700">publicMetadata.role</code>
                    para que el middleware y el menu respeten sus permisos.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Perfil seleccionado
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-slate-900">
                    {selectedRoleMeta?.label || getDashboardRoleLabel(form.role)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
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

              <Field label="Perfil del sistema" hint="Este valor se guardara en publicMetadata.role y publicMetadata.rol">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    {roleOptions.map((option) => {
                      const isActive = form.role === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField("role", option.value)}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            isActive
                              ? "border-cyan-200 bg-white shadow-[0_12px_30px_rgba(8,145,178,0.12)]"
                              : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-semibold text-slate-900">{option.label}</p>
                              <p className="mt-1 text-[11px] leading-5 text-slate-500">{option.description}</p>
                              {option.access?.length ? (
                                <ul className="mt-2 space-y-1 text-[11px] leading-4 text-slate-500">
                                  {option.access.slice(0, 4).map((accessItem) => (
                                    <li key={accessItem} className="flex gap-2">
                                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan-500" />
                                      <span>{accessItem}</span>
                                    </li>
                                  ))}
                                  {option.access.length > 4 ? (
                                    <li className="pl-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      + {option.access.length - 4} accesos mas
                                    </li>
                                  ) : null}
                                </ul>
                              ) : null}
                            </div>
                            {isActive ? <BadgeCheck className="mt-0.5 h-4 w-4 text-cyan-600" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Field>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                  {error}
                </div>
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

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0891b2,#4f46e5)] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(8,145,178,0.24)] transition-all hover:translate-y-[-1px] hover:shadow-[0_22px_50px_rgba(8,145,178,0.30)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? "Creando usuario..." : "Crear usuario"}
                </button>

                <p className="text-[12px] text-slate-500">
                  El acceso final del usuario quedara determinado por el rol seleccionado.
                </p>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Metadata aplicada
              </p>
              <div className="mt-4 rounded-2xl bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">publicMetadata.role</p>
                <p className="mt-2 text-[16px] font-semibold text-white">{form.role}</p>
              </div>
              <div className="mt-3 rounded-2xl bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Resumen del perfil</p>
                <p className="mt-2 text-[14px] font-semibold text-white">
                  {selectedRoleMeta?.label || getDashboardRoleLabel(form.role)}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-slate-300">
                  {selectedRoleMeta?.description || getDashboardRoleDescription(form.role)}
                </p>
                {selectedRoleAccess.length ? (
                  <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    {selectedRoleAccess.map((accessItem) => (
                      <li key={accessItem} className="flex gap-2 text-[12px] leading-5 text-slate-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                        <span>{accessItem}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Como funciona
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[13px] font-semibold text-slate-900">1. Clerk crea el usuario</p>
                  <p className="mt-1 text-[12px] leading-6 text-slate-500">
                    Se registra correo y contrasena usando el Backend SDK.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[13px] font-semibold text-slate-900">2. Se asigna el perfil</p>
                  <p className="mt-1 text-[12px] leading-6 text-slate-500">
                    El rol queda guardado en <span className="font-semibold text-slate-700">publicMetadata.role</span> y{" "}
                    <span className="font-semibold text-slate-700">publicMetadata.rol</span>.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[13px] font-semibold text-slate-900">3. El sistema restringe accesos</p>
                  <p className="mt-1 text-[12px] leading-6 text-slate-500">
                    Middleware, sidebar y menu movil usan la misma tabla de permisos del dashboard.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
