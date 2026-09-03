"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Globe, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Shield, Lock, Twitter, Youtube } from "lucide-react";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "Agendar hora", href: "/agendaProfesionales" },
];

function normalizeWhatsAppNumber(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function extractIframeSrc(value) {
  const rawValue = String(value || "").trim();
  const iframeSrc = rawValue.match(/src=["']([^"']+)["']/i)?.[1];
  return iframeSrc || rawValue;
}

const initialContact = {
  companyName: "Agenda Clinica",
  phone: "",
  whatsappNumber: "",
  whatsappUrl: "",
  email: "",
  emailUrl: "",
  address: "",
  mapsUrl: "",
  instagramHandle: "",
  socials: {
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    tiktok: "",
    youtube: "",
    other: "",
    otherLabel: "Otra red",
  },
};

export default function Footer() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [publicContact, setPublicContact] = useState(initialContact);

  async function cargarDatosEmpresaFooter() {
    try {
      const res = await fetch(`${API}/datosempresa/seleccionartodos`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const datosEmpresa = Array.isArray(data) ? data[0] : data;

      if (!datosEmpresa) {
        return;
      }

      const whatsappNumber = datosEmpresa.contactoWhatsapp || datosEmpresa.contactoTelefono || "";
      const email = datosEmpresa.contactoEmail || "";

      setPublicContact({
        companyName: datosEmpresa.empresaNombre || "Agenda Clinica",
        phone: datosEmpresa.contactoTelefono || "",
        whatsappNumber,
        whatsappUrl: whatsappNumber ? `https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}` : "",
        email,
        emailUrl: email ? `mailto:${email}` : "",
        address: datosEmpresa.contactoDireccion || "",
        mapsUrl: extractIframeSrc(datosEmpresa.contactoUrlMapa),
        instagramHandle: datosEmpresa.socialInstagramHandle || "",
        socials: {
          instagram: datosEmpresa.socialInstagramUrl || "",
          facebook: datosEmpresa.socialFacebookUrl || "",
          twitter: datosEmpresa.socialTwitterUrl || "",
          linkedin: datosEmpresa.socialLinkedinUrl || "",
          tiktok: datosEmpresa.socialTiktokUrl || "",
          youtube: datosEmpresa.socialYoutubeUrl || "",
          other: datosEmpresa.socialOtraUrl || "",
          otherLabel: datosEmpresa.socialOtraEtiqueta || "Otra red",
        },
      });
    } catch (error) {
      console.error("Error cargando datos de empresa para footer", error);
    }
  }

  useEffect(() => {
    cargarDatosEmpresaFooter();
  }, []);

  const socialLinks = [
    { label: "Instagram", href: publicContact.socials.instagram, icon: Instagram },
    { label: "Facebook", href: publicContact.socials.facebook, icon: Facebook },
    { label: "WhatsApp", href: publicContact.whatsappUrl, icon: MessageCircle },
    { label: "Twitter", href: publicContact.socials.twitter, icon: Twitter },
    { label: "LinkedIn", href: publicContact.socials.linkedin, icon: Linkedin },
    { label: "YouTube", href: publicContact.socials.youtube, icon: Youtube },
    { label: publicContact.socials.otherLabel, href: publicContact.socials.other, icon: Globe },
  ].filter((item) => item.href);
  const hasContactInfo = publicContact.phone || publicContact.email || publicContact.address;
  const hasMap = publicContact.mapsUrl && publicContact.mapsUrl.startsWith("https://www.google.com/maps/embed");

  return (
    <footer id="footer" className="relative overflow-hidden bg-slate-950 text-slate-300 pt-20 pb-10">

      {/* Background watermark */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center select-none z-0">
        <span className="text-[12vw] font-black leading-none text-white whitespace-nowrap opacity-[0.05]">
          AGENDA CLÍNICA
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 border-b border-slate-800 pb-16">

          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Ir al inicio" className="group mt-4 mb-8 flex items-center justify-center lg:justify-start">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo-full.png"
                  alt="Agenda Clínica"
                  width={220}
                  height={55}
                  className="h-20 w-auto object-contain"
                />
              </div>
            </Link>

            <p className="text-slate-400 leading-relaxed max-w-xs mb-8 mt-4">
              Agenda tu hora en línea de forma rápida y segura, en cualquier momento del día.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                SSL Seguro
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5 text-indigo-400" />
                Datos Cifrados
              </div>
            </div>
          </div>

          {/* Links grid */}
          <div className="lg:col-span-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:w-fit lg:grid-cols-[200px_220px_360px] lg:gap-10">

            {/* Navegación */}
            <div>
              <h4 className="text-white font-semibold mb-5 uppercase tracking-wider text-xs">Explorar</h4>
              <ul className="space-y-3.5">
                {navLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-slate-400 text-sm transition hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Redes sociales */}
            <div>
              {socialLinks.length > 0 && (
                <>
                  <h4 className="text-white font-semibold mb-5 uppercase tracking-wider text-xs">Redes sociales</h4>
                  <div className="space-y-3 text-sm text-slate-400">
                    {socialLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 transition hover:text-white"
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-indigo-600 hover:text-white">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </>
              )}

              {!hasContactInfo && socialLinks.length === 0 && (
                <p className="text-sm text-slate-500">
                  Configura los datos de empresa desde el dashboard.
                </p>
              )}
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-semibold mb-5 uppercase tracking-wider text-xs">Contacto</h4>
              <div className="space-y-3.5 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-indigo-400" />
                  {publicContact.phone ? (
                    <a
                      href={`tel:${publicContact.phone}`}
                      className="transition hover:text-white"
                    >
                      {publicContact.phone}
                    </a>
                  ) : (
                    <span>Proximamente</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-indigo-400" />
                  {publicContact.email ? (
                    <a
                      href={publicContact.emailUrl}
                      className="break-all transition hover:text-white"
                    >
                      {publicContact.email}
                    </a>
                  ) : (
                    <span>Proximamente</span>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                  {publicContact.address ? (
                    publicContact.mapsUrl ? (
                      <a
                        href={publicContact.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-white"
                      >
                        {publicContact.address}
                      </a>
                    ) : (
                      <span>{publicContact.address}</span>
                    )
                  ) : (
                    <span>Proximamente</span>
                  )}
                </div>
              </div>
              {hasMap && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  <iframe
                    src={publicContact.mapsUrl}
                    width="600"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-56 w-full"
                    title={`Ubicacion de ${publicContact.companyName}`}
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between px-1">
          <p>
            © {new Date().getFullYear()} {publicContact.companyName}. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1.5">
            Desarrollado por{" "}
            <a
              href="https://nativecode.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-400 hover:text-white transition"
            >
              NativeCode
            </a>
            <span className="text-slate-700">·</span>
            Potenciado por{" "}
            <a
              href="https://agendaclinicas.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-300 hover:text-white transition"
            >
              Agenda Clínica
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
