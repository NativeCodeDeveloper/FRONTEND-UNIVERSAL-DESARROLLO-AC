/*
 * Enlaces de contacto de la página pública, armados con los datos del centro (datosempresa).
 * Todo enlace a WhatsApp o correo lleva un mensaje predeterminado que dice desde dónde viene.
 * Si el dato no existe, la función devuelve null y el botón o enlace no se muestra.
 */

export function crearEnlaces(datosEmpresa = {}) {
  const nombre = datosEmpresa.empresaNombre || "el centro";
  const numeroWhatsapp = String(datosEmpresa.contactoWhatsapp || datosEmpresa.contactoTelefono || "").replace(/[^\d]/g, "");

  const whatsapp = (mensaje) => (numeroWhatsapp ? `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}` : null);

  const correo = (asunto, cuerpo) => {
    if (!datosEmpresa.contactoEmail) return null;
    const partes = [`subject=${encodeURIComponent(asunto)}`];
    if (cuerpo) partes.push(`body=${encodeURIComponent(cuerpo)}`);
    return `mailto:${datosEmpresa.contactoEmail}?${partes.join("&")}`;
  };

  const telefono = () => (datosEmpresa.contactoTelefono ? `tel:${String(datosEmpresa.contactoTelefono).replace(/[^\d+]/g, "")}` : null);

  /* Si el centro configuró su enlace de Google Maps se usa ese; si no, se busca la dirección */
  const mapa = () => {
    if (datosEmpresa.contactoUrlMapa) return datosEmpresa.contactoUrlMapa;
    if (!datosEmpresa.contactoDireccion) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(datosEmpresa.contactoDireccion)}`;
  };

  const mapaEmbebido = () =>
    datosEmpresa.contactoDireccion ? `https://www.google.com/maps?q=${encodeURIComponent(datosEmpresa.contactoDireccion)}&output=embed` : null;

  const mensajes = {
    whatsappGeneral: `Hola ${nombre}, vengo desde su sitio web y me gustaría hacer una consulta.`,
    whatsappServicio: (servicio) => `Hola ${nombre}, vengo desde su sitio web y quiero más información sobre ${servicio}.`,
    whatsappReserva: (profesional) => `Hola ${nombre}, estoy agendando con ${profesional} desde su sitio web y tengo una duda.`,
    whatsappOrientacion: `Hola ${nombre}, vengo desde su sitio web y no sé con qué profesional agendar. ¿Me pueden orientar?`,
    correoAsunto: `Consulta desde el sitio web de ${nombre}`,
    correoCuerpo: "Hola, mi nombre es:\nTeléfono:\nMi consulta es:\n",
  };

  /* Redes configuradas (solo las que tienen URL) */
  const redes = () =>
    [
      { etiqueta: "Instagram", href: datosEmpresa.socialInstagramUrl },
      { etiqueta: "Facebook", href: datosEmpresa.socialFacebookUrl },
      { etiqueta: "TikTok", href: datosEmpresa.socialTiktokUrl },
      { etiqueta: "LinkedIn", href: datosEmpresa.socialLinkedinUrl },
      { etiqueta: "YouTube", href: datosEmpresa.socialYoutubeUrl },
      { etiqueta: "X", href: datosEmpresa.socialTwitterUrl },
      { etiqueta: "Sitio web", href: datosEmpresa.socialOtraUrl },
    ].filter((r) => r.href);

  return { whatsapp, correo, telefono, mapa, mapaEmbebido, mensajes, redes };
}
