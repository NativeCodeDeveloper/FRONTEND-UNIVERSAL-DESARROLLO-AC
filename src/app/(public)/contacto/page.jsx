"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Clock3, Facebook, Globe, Instagram, Linkedin, Mail, MapPin, MessageCircle, Send, Twitter, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
/*
 * CONEXIÓN PENDIENTE — Página de Contacto
 * Toda la información de contacto y redes sociales viene de publicContact (src/lib/publicContact.js).
 * Una vez conectado el backend, hacer fetch de:
 *   GET /datosEmpresa/seleccionarDatosEmpresa
 * y reemplazar publicContact por los valores del objeto retornado.
 * Campos usados: address, mapsUrl, phone, whatsappUrl, email, emailUrl,
 *   instagramHandle, socials.instagram, socials.facebook, socials.linkedin,
 *   socials.twitter, socials.youtube, socials.other, socials.otherLabel
 * REGLA: cada ítem ya filtra por .filter(item => item.value) — los vacíos no se muestran.
 */
import { publicContact } from "@/lib/publicContact";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const API = process.env.NEXT_PUBLIC_API_URL;
  const contactCards = [
    {
      title: "Ubicacion",
      value: publicContact.address,
      href: publicContact.mapsUrl || null,
      icon: MapPin,
    },
    {
      title: "WhatsApp",
      value: publicContact.phone || publicContact.whatsappNumber,
      href: publicContact.whatsappUrl || null,
      icon: MessageCircle,
    },
    {
      title: "Email",
      value: publicContact.email,
      href: publicContact.emailUrl || null,
      icon: Mail,
    },
    {
      title: "Instagram",
      value: publicContact.instagramHandle,
      href: publicContact.socials.instagram || null,
      icon: Instagram,
    },
    {
      title: "Facebook",
      value: publicContact.socials.facebook ? "Facebook" : "",
      href: publicContact.socials.facebook || null,
      icon: Facebook,
    },
    {
      title: "LinkedIn",
      value: publicContact.socials.linkedin ? "LinkedIn" : "",
      href: publicContact.socials.linkedin || null,
      icon: Linkedin,
    },
    {
      title: "Twitter",
      value: publicContact.socials.twitter ? "Twitter" : "",
      href: publicContact.socials.twitter || null,
      icon: Twitter,
    },
    {
      title: "YouTube",
      value: publicContact.socials.youtube ? "YouTube" : "",
      href: publicContact.socials.youtube || null,
      icon: Youtube,
    },
    {
      title: publicContact.socials.otherLabel,
      value: publicContact.socials.other ? publicContact.socials.otherLabel : "",
      href: publicContact.socials.other || null,
      icon: Globe,
    },
  ].filter((item) => item.value || item.href);

  async function enviarCorreo() {
    try {
      if (!nombre || !email || !mensaje) {
        return toast.error("Completa todos los campos para enviar tu mensaje.");
      }

      const res = await fetch(`${API}/correo/contacto`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, email, mensaje }),
        mode: "cors",
        cache: "no-cache",
      });

      if (!res.ok) {
        return toast.error("No se pudo enviar tu solicitud. Intenta nuevamente.");
      }

      const respuestaBackend = await res.json();

      if (respuestaBackend.message === true) {
        setNombre("");
        setEmail("");
        setMensaje("");
        return toast.success("Tu consulta fue enviada correctamente.");
      }

      return toast.error("Correo no válido. Verifica e intenta otra vez.");
    } catch (error) {
      console.error(error);
      return toast.error("Ocurrió un error inesperado. Intenta nuevamente.");
    }
  }

  return (
    <main className="bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden py-24 md:py-28">

        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[1fr_1.2fr] xl:px-12 xl:gap-14">

          {/* Informative Aside Block */}
          <aside className="rounded-[2.5rem] bg-slate-900 p-8 shadow-sm md:p-12 text-white relative overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Contáctanos
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Inicia tu evaluacion en {publicContact.companyName}.
            </h1>
            <p className="mt-6 max-w-xl text-slate-300 text-lg">
              Nuestro equipo clínico está listo para guiarte. Indica tus datos para agendar o realizar consultas.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {contactCards.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.title}
                    </p>
                    <p
                      className={[
                        "mt-2 min-w-0 text-sm font-semibold leading-relaxed text-white",
                        item.title === "Email" ? "break-all" : "break-words",
                      ].join(" ")}
                    >
                      {item.value}
                    </p>
                  </>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6"
                  >
                    {content}
                  </article>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Horario de atención
              </p>
              <div className="mt-4 flex items-start gap-4 text-sm font-medium">
                <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                <div className="space-y-2 text-slate-300">
                  <p>Lunes a Viernes: 9:00 a 19:00</p>
                  <p>Sábado: 10:00 a 14:00</p>
                  <p>Domingo: Cerrado</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Form Block */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Tratamiento asistido
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Déjanos tu mensaje.
            </h2>
            <p className="mt-3 text-base text-slate-500">
              Un especialista se pondrá en contacto a la brevedad.
            </p>

            <form
              className="mt-10 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                enviarCorreo();
              }}
            >
              <div className="space-y-3">
                <label htmlFor="nombre" className="text-sm font-bold text-slate-700">
                  Nombre completo
                </label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Camila Perez"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="email" className="text-sm font-bold text-slate-700">
                  Email de contacto
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: correo@ejemplo.com"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="mensaje" className="text-sm font-bold text-slate-700">
                  ¿Cómo podemos ayudarte?
                </label>
                <Textarea
                  id="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe tu consulta médica..."
                  className="min-h-[160px] rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-slate-900 focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white transition hover:bg-slate-800 hover:scale-105"
              >
                Enviar mi solicitud
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

      </section>
    </main>
  );
}
