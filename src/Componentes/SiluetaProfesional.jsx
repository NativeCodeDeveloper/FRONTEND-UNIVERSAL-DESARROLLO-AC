/*
 * Avatar por defecto de un profesional sin foto: silueta blanca sobre el azul de
 * sistema de Apple, con el mismo degradado suave que usan los contactos de iOS.
 *
 * Sin hooks ni ids de SVG: sirve igual en componentes de servidor (página
 * pública) y de cliente (dashboard), y varias instancias en la misma página no
 * chocan. El degradado va en CSS; el SVG solo dibuja la silueta.
 */
export default function SiluetaProfesional({ className = "", etiqueta = "Profesional de salud" }) {
  return (
    <div
      role="img"
      aria-label={etiqueta}
      className={`relative overflow-hidden ${className}`}
      style={{ background: "linear-gradient(180deg, #4DA3FF 0%, #007AFF 100%)" }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <circle cx="50" cy="39" r="16.5" fill="#FFFFFF" />
        <path d="M13 104 C13 77 30 63.5 50 63.5 C70 63.5 87 77 87 104 Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
