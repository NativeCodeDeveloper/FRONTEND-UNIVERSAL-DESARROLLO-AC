"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* En celular, el botón de agendar queda siempre a mano después de la portada */
export default function BotonAgendarMovil() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alDesplazar = () => {
      const contacto = document.getElementById("contacto");
      const llegoAlFinal = contacto ? contacto.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(window.scrollY > 560 && !llegoAlFinal);
    };
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-500 ease-[cubic-bezier(0.28,0.11,0.32,1)] md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <Link href="/agendaProfesionales" className="boton boton-principal w-full shadow-flotante" tabIndex={visible ? 0 : -1}>
        Agendar hora
      </Link>
    </div>
  );
}
