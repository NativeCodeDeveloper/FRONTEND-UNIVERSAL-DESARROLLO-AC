"use client";

import { useEffect, useRef } from "react";

/* Aparición sutil al entrar en pantalla, como en las páginas de producto de Apple */
export default function Revelar({ children, className = "", retraso = 0, como: Etiqueta = "div" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.classList.add("visible");
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <Etiqueta ref={ref} className={`revelar ${className}`} style={retraso ? { transitionDelay: `${retraso}ms` } : undefined}>
      {children}
    </Etiqueta>
  );
}
