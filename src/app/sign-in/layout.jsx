import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

const localization = {
  ...esES,
  signIn: {
    ...esES.signIn,
    start: {
      ...esES.signIn.start,
      title: "Inicia sesión",
      subtitle: "Accede con tus credenciales para acceder a tu panel de administración clínica.",
    },
  },
};

export default function SignInLayout({ children }) {
  return <ClerkProvider localization={localization}>{children}</ClerkProvider>;
}

