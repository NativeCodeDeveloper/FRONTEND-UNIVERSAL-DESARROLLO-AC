import Link from "next/link";
import FooterPremiumMedico from "@/Componentes/Footer";
//mejora
export default function FooterPreviewPage() {
  return (
    <main className="bg-[#f6f7fb] text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 pb-12 pt-24 text-center md:pb-16 md:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Footer
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl">Vista de bloque final</h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Esta ruta existe solo como vista de revisión. El footer oficial vive en el layout
          público y se renderiza automáticamente al final de cada página.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-slate-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Volver al inicio
        </Link>
      </section>

      <div className="pt-8 md:pt-12">
        <FooterPremiumMedico />
      </div>
    </main>
  );
}
