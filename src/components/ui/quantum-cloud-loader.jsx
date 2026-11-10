"use client";

// ── Quantum Cloud Loader ─────────────────────────────────────────────────────
// Partículas en órbitas horizontales suaves (sin gradientes ni cambios de
// dirección bruscos; curvas largas y velocidades distintas que interactúan
// entre sí). Va bajo el logo en la pantalla de carga
// (src/components/ui/pantalla-anillos.jsx).
//
// Los cuatro tonos son una escalera derivada del azul de la plataforma (#007AFF,
// el de los botones principales): una esfera lo lleva exacto y las otras tres se
// separan hacia claro, pálido y profundo. Antes era morado (#6E56CF), de la marca
// anterior.
// El contenedor NO pinta fondo: se dibuja sobre lo que haya detras.

export default function CloudLoader() {
  return (
    <div className="flex min-h-24 items-center justify-center overflow-hidden pl-8">
      <div className="relative isolate flex h-24 w-44 items-center justify-center">

        {/* AZUL CLARO — Partícula rápida interior */}
        <div className="absolute z-30 h-5 w-5 animate-quantum-claro">
          <div className="h-full w-full rounded-full bg-[#4DA3FF] shadow-[0_0_12px_rgba(77,163,255,0.75),0_0_24px_rgba(77,163,255,0.3)]" />
        </div>

        {/* AZUL PROFUNDO — Partícula exterior grande */}
        <div className="absolute z-10 h-7 w-7 animate-quantum-profundo">
          <div className="h-full w-full rounded-full bg-[#0058CC] shadow-[0_0_16px_rgba(0,88,204,0.7),0_0_30px_rgba(0,88,204,0.25)]" />
        </div>

        {/* AZUL DE LA PLATAFORMA — Partícula central */}
        <div className="absolute z-40 h-6 w-6 animate-quantum-marca">
          <div className="h-full w-full rounded-full bg-[#007AFF] shadow-[0_0_14px_rgba(0,122,255,0.75),0_0_26px_rgba(0,122,255,0.3)]" />
        </div>

        {/* AZUL PÁLIDO — Partícula orbital lenta */}
        <div className="absolute z-0 h-4 w-4 animate-quantum-palido">
          <div className="h-full w-full rounded-full bg-[#CCE4FF] shadow-[0_0_12px_rgba(204,228,255,0.75),0_0_24px_rgba(204,228,255,0.3)]" />
        </div>

      </div>

      <style>{`
        /*
         * Quantum Cloud Loader
         *
         * Principios de diseño:
         * - Sin gradientes
         * - Sin cambios de dirección bruscos
         * - Curvas de animación largas y suaves
         * - Profundidad sutil con escala + opacidad
         * - Velocidades orbitales distintas crean interacción natural
         */

        /* --------------------------------
           AZUL CLARO
           Órbita horizontal rápida pero suave
        --------------------------------- */

        @keyframes quantum-claro {
          0% {
            transform: translate3d(-46px, 7px, 0) scale(0.72);
            opacity: 0.45;
          }

          25% {
            transform: translate3d(-23px, -7px, 0) scale(0.95);
            opacity: 0.78;
          }

          50% {
            transform: translate3d(46px, 0, 0) scale(1.18);
            opacity: 1;
          }

          75% {
            transform: translate3d(23px, 7px, 0) scale(0.95);
            opacity: 0.78;
          }

          100% {
            transform: translate3d(-46px, 7px, 0) scale(0.72);
            opacity: 0.45;
          }
        }

        .animate-quantum-claro {
          animation:
            quantum-claro
            3.8s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite;
          will-change: transform, opacity;
        }


        /* --------------------------------
           AZUL PROFUNDO
           Movimiento orbital lento y pesado
        --------------------------------- */

        @keyframes quantum-profundo {
          0% {
            transform: translate3d(38px, -4px, 0) scale(1);
            opacity: 0.95;
          }

          25% {
            transform: translate3d(19px, 7px, 0) scale(0.88);
            opacity: 0.72;
          }

          50% {
            transform: translate3d(-38px, 3px, 0) scale(0.68);
            opacity: 0.42;
          }

          75% {
            transform: translate3d(-19px, -7px, 0) scale(0.88);
            opacity: 0.72;
          }

          100% {
            transform: translate3d(38px, -4px, 0) scale(1);
            opacity: 0.95;
          }
        }

        .animate-quantum-profundo {
          animation:
            quantum-profundo
            5.6s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite;
          will-change: transform, opacity;
        }


        /* --------------------------------
           AZUL DE LA PLATAFORMA
           Oscilador central suave
        --------------------------------- */

        @keyframes quantum-marca {
          0% {
            transform: translate3d(-27px, 2px, 0) scale(0.82);
            opacity: 0.65;
          }

          20% {
            transform: translate3d(-17px, -5px, 0) scale(0.94);
            opacity: 0.82;
          }

          50% {
            transform: translate3d(27px, 0, 0) scale(1.08);
            opacity: 1;
          }

          80% {
            transform: translate3d(17px, 5px, 0) scale(0.94);
            opacity: 0.82;
          }

          100% {
            transform: translate3d(-27px, 2px, 0) scale(0.82);
            opacity: 0.65;
          }
        }

        .animate-quantum-marca {
          animation:
            quantum-marca
            3.1s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite;
          will-change: transform, opacity;
        }


        /* --------------------------------
           AZUL PÁLIDO
           Barrido orbital lento y amplio
        --------------------------------- */

        @keyframes quantum-palido {
          0% {
            transform: translate3d(64px, 6px, 0) scale(0.52);
            opacity: 0.25;
          }

          20% {
            transform: translate3d(43px, -5px, 0) scale(0.68);
            opacity: 0.45;
          }

          50% {
            transform: translate3d(0, 3px, 0) scale(1);
            opacity: 0.9;
          }

          80% {
            transform: translate3d(-43px, -5px, 0) scale(0.68);
            opacity: 0.45;
          }

          100% {
            transform: translate3d(-64px, 6px, 0) scale(0.52);
            opacity: 0.25;
          }
        }

        .animate-quantum-palido {
          animation:
            quantum-palido
            6.4s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite alternate;
          will-change: transform, opacity;
        }


        /* --------------------------------
           Accesibilidad
        --------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .animate-quantum-claro,
          .animate-quantum-profundo,
          .animate-quantum-marca,
          .animate-quantum-palido {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
