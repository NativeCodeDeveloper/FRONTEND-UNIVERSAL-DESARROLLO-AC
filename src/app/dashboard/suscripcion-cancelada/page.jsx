"use client";

import Link from "next/link";
import { Michroma } from "next/font/google";
import { motion } from "framer-motion";

const michroma = Michroma({ weight: "400", subsets: ["latin"], display: "swap" });

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};

const highlights = [
  "Suscripcion cancelada",
  "Acceso suspendido",
  "Regularizacion pendiente",
];

export default function SuscripcionCanceladaPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-6 flex items-center justify-between"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1.5 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <span className="text-[11px] font-medium text-rose-700">Suscripcion suspendida por pagos</span>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:gap-10">
          {/* Left: info */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="flex flex-col justify-center"
          >
            <div className="mb-4 inline-flex w-fit items-center rounded-full border border-rose-100 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-700 shadow-sm">
              Estado de suscripcion
            </div>

            <h1 className={michroma.className + " text-[1.75rem] leading-[1.1] text-slate-900 sm:text-[2rem] lg:text-[2.4rem]"}>
              <span className="bg-gradient-to-r from-rose-700 via-rose-600 to-orange-600 bg-clip-text text-transparent">
                Suscripcion Cancelada
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-[14px] leading-6 text-slate-600">
              Por favor regularice su situacion de pagos para recuperar el acceso. De no renovar su suscripcion en 15 dias, su cuenta sera eliminada.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.map((item, index) => (
                <motion.div
                  key={item}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={1.4 + index * 0.2}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm"
                >
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="w-full lg:justify-self-end"
          >
            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">Pago pendiente</p>
                <h2 className={michroma.className + " mt-2.5 text-[18px] text-slate-900"}>Acceso suspendido</h2>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">
                  Tu cuenta se encuentra con la suscripcion cancelada y el acceso fue deshabilitado temporalmente.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(254,226,226,0.92))] px-4 py-4 shadow-[0_18px_40px_rgba(244,63,94,0.12)]">
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-300/40 blur-2xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-rose-400/80 to-transparent" />
                <div className="relative flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-[0_12px_24px_rgba(244,63,94,0.24)]">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">Estado de cuenta</p>
                    <p className={michroma.className + " mt-1 text-[15px] text-rose-950"}>Suscripcion cancelada</p>
                    <p className="mt-2 text-[12px] leading-5 text-rose-800/90">
                      Regularice su situacion de pagos para recuperar el acceso. Si no renueva en 15 dias, la cuenta sera eliminada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-[12px] font-semibold text-white shadow-[0_18px_40px_rgba(244,63,94,0.24)] transition-all hover:from-rose-500 hover:to-orange-500"
                >
                  Volver al sitio
                </Link>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-center text-[11px] text-slate-400">
                  Una vez regularizado el pago, el acceso puede ser reactivado por el sistema.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
