"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import NeuralBg from "@/components/NeuralBg";

/* SF Pro en Apple, Inter/Helvetica en otros */
const SF = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Inter", Arial, sans-serif`;

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Page() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) router.replace("/dashboard");
  }, [isAuthLoaded, isSignedIn, router]);

  if (!isLoaded || !isAuthLoaded || isSignedIn) {
    return (
      <main style={{ background: "#fff", fontFamily: SF }}
            className="grid min-h-dvh place-items-center">
        <div className="text-sm text-slate-400">Cargando...</div>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await signIn.create({
        strategy: "password",
        identifier: email.trim(),
        password,
      });

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("No pudimos completar el inicio de sesión. Revisa que el correo tenga contraseña habilitada en Clerk.");
      }
    } catch (err) {
      setError(err?.errors?.[0]?.message || "No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="relative min-h-dvh bg-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 45% at 12% 100%, rgba(59,70,255,0.28), rgba(59,70,255,0) 72%), " +
            "radial-gradient(58% 48% at 50% 112%, rgba(192,38,211,0.32), rgba(192,38,211,0) 72%), " +
            "radial-gradient(50% 45% at 88% 100%, rgba(49,46,180,0.26), rgba(49,46,180,0) 72%), " +
            "radial-gradient(45% 38% at 15% 0%, rgba(59,70,255,0.16), rgba(59,70,255,0) 70%), " +
            "radial-gradient(50% 40% at 50% -8%, rgba(192,38,211,0.18), rgba(192,38,211,0) 70%), " +
            "radial-gradient(45% 38% at 85% 0%, rgba(49,46,180,0.14), rgba(49,46,180,0) 70%)",
        }}
      />
      <NeuralBg hue={220} saturation={0.8} chroma={0.6} />
      <div style={{ fontFamily: SF }} className="relative z-10 flex min-h-dvh flex-col px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Top bar ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="mx-auto flex w-full max-w-6xl items-center justify-start">
          <img src="/logo-full.png" alt="AgendaClínica" className="h-14 w-auto object-contain" />
        </motion.div>

        {/* ── Contenido principal ── */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="w-full max-w-[360px] rounded-[2rem] border border-white/60 bg-white/30 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
            style={{ backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}>

            <h2 className="text-[19px] font-semibold tracking-tight text-slate-900">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Accede a tu panel de administración clínica.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white/40 px-3.5 text-[14px] text-slate-900 placeholder:text-slate-300 outline-none transition-colors focus:border-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password" type={showPass ? "text" : "password"} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white/40 px-3.5 pr-10 text-[14px] text-slate-900 placeholder:text-slate-300 outline-none transition-colors focus:border-slate-400"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-rose-500">{error}</p>
              )}

              <button type="submit" disabled={submitting}
                className="h-11 w-full rounded-lg bg-slate-900 text-[14px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                {submitting ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <p className="mt-8 text-center text-[12px] text-slate-400">
              ¿Sin acceso? Contacta al administrador.
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              <span className="text-[11px] text-slate-400">Secured by</span>
              <img src="/clerk-logo.png" alt="Clerk" className="h-3.5 w-auto object-contain opacity-70" />
            </div>
          </motion.div>
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-6xl flex-wrap items-center justify-center gap-4 pb-2 text-[10px] text-slate-400">
          <span>AgendaClínica v2.0</span>
          <span className="hidden h-3 w-px bg-slate-200 sm:block" />
          <span>Powered by NativeCode</span>
        </div>

      </div>
    </div>
  );
}
