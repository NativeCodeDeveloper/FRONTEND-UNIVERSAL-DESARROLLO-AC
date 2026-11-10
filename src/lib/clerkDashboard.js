import { esES } from "@clerk/localizations";

/* Clerk dentro del dashboard: español y la ventana de reverificación con el estilo
 * de la plataforma (vidrio, paleta del sistema, botón azul en cápsula).
 *
 * La ventana la abre useReverification al firmar, registrar o revocar la firma
 * (docs/firma, Fase 5). Solo se estiliza <UserVerification/> (clave
 * `userVerification`): la pantalla de inicio de sesión no cambia.
 *
 * Tailwind 4: el sufijo "!" hace que las clases ganen a los estilos de Clerk. */

const reverificacion = esES.reverification ?? {};

export const localizacionDashboard = {
  ...esES,
  reverification: {
    ...reverificacion,
    password: {
      ...reverificacion.password,
      title: "Confirma que eres tú",
      subtitle: "Ingresa tu contraseña para continuar. Lo pedimos antes de firmar para que solo el titular pueda hacerlo.",
      actionLink: "¿Olvidaste tu contraseña?",
    },
    emailCode: {
      ...reverificacion.emailCode,
      title: "Confirma que eres tú",
      subtitle: "Te enviamos un código a tu correo. Ingrésalo para continuar.",
    },
    alternativeMethods: {
      ...reverificacion.alternativeMethods,
      title: "Confirma que eres tú",
    },
  },
};

const VIDRIO =
  "rounded-[28px]! border! border-white/70! bg-white/70! backdrop-blur-2xl! backdrop-saturate-150! " +
  "shadow-[0_30px_80px_-24px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.8)]!";

export const aparienciaDashboard = {
  userVerification: {
    variables: {
      colorPrimary: "#007AFF",
      colorText: "#16181C",
      colorTextSecondary: "#6E6E73",
      colorDanger: "#FF3B30",
      borderRadius: "14px",
      fontFamily: "inherit",
    },
    elements: {
      modalBackdrop: "bg-slate-900/25! backdrop-blur-md!",
      cardBox: `${VIDRIO} w-[min(400px,calc(100vw-32px))]!`,
      card: "bg-transparent! shadow-none! px-7! pt-7! pb-5! gap-6!",
      headerTitle: "text-[20px]! font-semibold! tracking-tight! text-[#16181C]!",
      headerSubtitle: "text-[13px]! leading-snug! text-[#6E6E73]!",
      identityPreview: "rounded-full! border-black/[0.06]! bg-white/60!",
      formFieldLabel: "text-[13px]! font-medium! text-[#3A3A3C]!",
      formFieldInput:
        "h-11! rounded-xl! border! border-black/10! bg-white/80! text-[15px]! shadow-none! " +
        "focus:border-[#007AFF]! focus:ring-4! focus:ring-[#007AFF]/15!",
      otpCodeFieldInput: "rounded-xl! border-black/10! bg-white/80!",
      formButtonPrimary:
        "h-11! rounded-full! bg-[#007AFF]! text-[15px]! font-semibold! normal-case! tracking-normal! " +
        "shadow-none! transition-colors! hover:bg-[#0062CC]! focus:ring-4! focus:ring-[#007AFF]/20!",
      formFieldAction: "text-[#007AFF]! font-medium!",
      alternativeMethodsBlockButton: "h-11! rounded-xl! border-black/10! bg-white/70! hover:bg-white!",
      footer: "bg-none! bg-transparent! border-t! border-black/[0.06]!",
      footerActionLink: "text-[#007AFF]! font-medium!",
      modalCloseButton: "rounded-full! text-[#6E6E73]! hover:bg-black/5!",
    },
  },
};
