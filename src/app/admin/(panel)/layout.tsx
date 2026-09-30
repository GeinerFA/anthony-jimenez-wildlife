import { House } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin, signOut } from "@/auth/auth";
import { Logo } from "@/components/site/logo";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  // El middleware ya exige sesión; aquí además se confirma que el correo siga activo en la lista blanca.
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login?error=AccessDenied");

  return (
    <div className="min-h-screen">
      {/* Fija arriba al hacer scroll, como la barra del sitio público. */}
      <header className="sticky z-40 border-b border-ink/10 bg-ink text-bone" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/admin">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-bone/70 md:inline">{admin.email}</span>
            <Link
              href="/es"
              prefetch={false}
              title="Ver sitio"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-lime px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-white sm:px-4"
            >
              <House className="size-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Ver sitio</span>
            </Link>
            <form
              action={async () => {
                "use server";
                // Al inicio del sitio; el middleware elige /es o /en según el idioma del visitante.
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="rounded-full border border-bone/30 px-4 py-1.5 hover:border-lime hover:text-lime">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10">{children}</div>
    </div>
  );
}
