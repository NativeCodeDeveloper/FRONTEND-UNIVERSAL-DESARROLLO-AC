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
    <footer id="footer" className="relative overflow-hidden bg-[#061a3a] pb-10 pt-20 font-[family-name:var(--font-outfit)] text-slate-300">

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-300/70 to-transparent" />

      {/* Background watermark */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center select-none z-0">
        <span className="whitespace-nowrap text-[11vw] font-extrabold leading-none tracking-[-0.06em] text-white opacity-[0.035]">
          AGENDA CLÍNICA
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="grid gap-12 border-b border-white/10 pb-16 lg:grid-cols-12 lg:gap-10">

          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Ir al inicio" className="group mb-7 flex items-center justify-center lg:justify-start">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo-full.png"
                  alt="Agenda Clínica"
                  width={220}
                  height={55}
                  className="h-16 w-auto object-contain"
                />
              </div>
            </Link>

            <p className="mb-8 max-w-xs text-base leading-7 text-white/65">
              Agenda tu hora en línea de forma rápida y segura, en cualquier momento del día.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/65">
                <Shield className="h-3.5 w-3.5 text-sky-300" />
                SSL Seguro
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/65">
                <Lock className="h-3.5 w-3.5 text-sky-300" />
                Datos Cifrados
              </div>
            </div>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-[180px_190px_1fr] lg:gap-10">

            {/* Navegación */}
            <div>
              <h4 className="mb-5 text-xs font-bold tracking-[0.18em] text-sky-200 uppercase">Explorar</h4>
              <ul className="space-y-3">
                {navLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-white/60 transition duration-200 hover:text-white"
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
                  <h4 className="mb-5 text-xs font-bold tracking-[0.18em] text-sky-200 uppercase">Redes sociales</h4>
                  <div className="space-y-3 text-sm text-white/60">
                    {socialLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 transition hover:text-white"
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-200 transition duration-200 group-hover:border-white/25 group-hover:bg-white group-hover:text-[#061a3a]">
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
                <p className="text-sm text-white/45">
                  Configura los datos de empresa desde el dashboard.
                </p>
              )}
            </div>

            {/* Contacto */}
            <div>
              <h4 className="mb-5 text-xs font-bold tracking-[0.18em] text-sky-200 uppercase">Contacto</h4>
              <div className="space-y-4 text-sm text-white/65">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-sky-300" />
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
                  <Mail className="h-4 w-4 shrink-0 text-sky-300" />
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
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
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
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
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
        <div className="mt-8 flex flex-col gap-3 px-1 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {publicContact.companyName}. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1.5">
            Desarrollado por{" "}
            <a
              href="https://nativecode.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/65 transition hover:text-white"
            >
              NativeCode
            </a>
            <span className="text-white/20">·</span>
            Potenciado por{" "}
            <a
              href="https://agendaclinicas.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/75 transition hover:text-white"
            >
              Agenda Clínica
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
