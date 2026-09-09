import Navbar from "@/Componentes/Navbar";
import FooterPremiumMedico from "@/Componentes/Footer";
import ToasterClient from "@/Componentes/ToasterClient";
import WhatsAppFloatButton from "@/Componentes/WhatsAppFloatButton";
import CarritoProvider from "@/ContextosGlobales/CarritoContext";
import ObjetoPagarProvider from "@/ContextosGlobales/ObjetoPagarContext";

export default function PublicLayout({ children }) {
  return (
    <CarritoProvider>
      <ObjetoPagarProvider>
        <link rel="preload" as="image" href="/bg-swoosh-azul.webp" fetchPriority="high" />
        <div className="relative min-h-screen bg-slate-50 text-slate-900 font-sans">
          {/* Fondo base */}
          <div className="pointer-events-none fixed inset-0 z-0" />
          <ToasterClient />
          <Navbar />
          <main className="relative z-10 pt-24 md:pt-0.5">{children}</main>
          <FooterPremiumMedico />
          <WhatsAppFloatButton />
        </div>
      </ObjetoPagarProvider>
    </CarritoProvider>
  );
}
