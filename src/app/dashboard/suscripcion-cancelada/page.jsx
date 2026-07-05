"use client";

import Link from "next/link";
import { Michroma } from "next/font/google";
import { motion } from "framer-motion";
import OrbBackground from "@/components/OrbBackground";

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
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
      <div className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-600">Estado de Cuenta</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Suscripción <span className="text-rose-600">Cancelada</span>
          </h1>
          <p className="mt-2 text-[13px] text-slate-500 max-w-2xl">
            Por favor regularice su situación de pagos para recuperar el acceso. De no renovar su suscripción en 15 días, su cuenta será eliminada.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] items-start">

          {/* ── Columna izquierda: info ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Detalle de la Situación</h2>
              </div>
              <div className="p-4 md:p-8 space-y-4">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Tu cuenta se encuentra con la suscripción cancelada y el acceso ha sido deshabilitado temporalmente. Regulariza el pago para restablecer el acceso completo al sistema.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {highlights.map((item, index) => (
                    <motion.div
                      key={item}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={1.4 + index * 0.2}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600"
                    >
                      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Columna derecha: alerta + acción ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-4 md:px-8 md:py-5 border-b border-slate-100 bg-slate-50/30">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Estado de Cuenta</p>
              </div>
              <div className="p-4 md:p-8 space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-700">Pago pendiente</p>
                      <p className="mt-1 text-[14px] font-bold text-rose-950">Acceso suspendido</p>
                      <p className="mt-2 text-[12px] leading-5 text-rose-800/90">
                        Regularice su situación de pagos para recuperar el acceso. Si no renueva en 15 días, la cuenta será eliminada.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/"
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-rose-600 text-[12px] font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Volver al Sitio
                </Link>

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
