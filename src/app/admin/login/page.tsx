import type { Metadata } from "next";
import { signIn } from "@/auth/auth";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = { title: "Iniciar sesión" };

const errorMessages: Record<string, string> = {
  AccessDenied: "Este correo no tiene acceso al panel. Pedile a un administrador que lo agregue.",
  Configuration: "Error de configuración del inicio de sesión. Revisá las variables AUTH_* del servidor.",
};

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

/** Solo se permite volver a rutas internas del panel (evita redirecciones abiertas). */
function safeCallback(url?: string) {
  return url && url.startsWith("/admin") && !url.startsWith("//") ? url : "/admin";
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallback(callbackUrl);

  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden bg-moss px-5 text-bone">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-10 font-display text-4xl">Panel administrativo</h1>
        <p className="mt-3 text-bone/70">Ingresá con la cuenta de Google autorizada.</p>

        {error && (
          <p role="alert" className="mt-6 rounded-sm border border-lime/40 bg-lime/10 p-4 text-sm">
            {errorMessages[error] ?? "No se pudo iniciar sesión. Intentá de nuevo."}
          </p>
        )}

        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-bone px-6 py-4 font-semibold text-ink transition-colors hover:bg-lime"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
            </svg>
            Continuar con Google
          </button>
        </form>
      </div>
    </main>
  );
}
