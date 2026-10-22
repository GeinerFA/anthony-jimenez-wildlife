import { House, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin, signOut } from "@/auth/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/site/logo";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function signOutToSite() {
  "use server";
  // Al inicio del sitio; el middleware elige /es o /en según el idioma del visitante.
  await signOut({ redirectTo: "/" });
}

/** Botones "Home" y "Salir": dentro del header oscuro desde sm; en celular, en una fila clara debajo. */
function PanelActions({ tone }: { tone: "dark" | "light" }) {
  const exitClass =
    tone === "dark"
      ? "border-bone/30 hover:border-lime hover:text-lime"
      : "border-ink/20 text-ink hover:border-lime-deep hover:text-lime-deep";
  return (
    <>
      <Link
        href="/es"
        prefetch={false}
        title="Ver sitio"
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-lime px-4 py-1.5 font-semibold text-ink transition-colors hover:bg-white"
      >
        <House className="size-4" aria-hidden />
        Home
      </Link>
      <form action={signOutToSite}>
        <button type="submit" className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 ${exitClass}`}>
          <LogOut className="size-4" aria-hidden />
          Salir
        </button>
      </form>
    </>
  );
}

export default async function PanelLayout({ children }: { children: ReactNode }) {
  // El middleware ya exige sesión; aquí además se confirma que el correo siga activo en la lista blanca.
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login?error=AccessDenied");

  return (
    <div className="min-h-screen">
      {/* Fija arriba al hacer scroll, como la barra del sitio público. El margen de la barra de estado va como
          relleno y no como `top`: con `top` el header bajaba sobre el contenido y tapaba Home/Salir en la app de iOS. */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ink text-bone" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5">
          <Link href="/admin" aria-label="Inicio del panel">
            <Logo size="md" />
          </Link>
          <div className="hidden items-center gap-4 text-sm sm:flex">
            <span className="hidden text-bone/70 md:inline">{admin.email}</span>
            <PanelActions tone="dark" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-3 text-sm sm:hidden">
          <span className="min-w-0 truncate text-ink/60">{admin.email}</span>
          <div className="flex shrink-0 items-center gap-2">
            <PanelActions tone="light" />
          </div>
        </div>
        <AdminNav newRequests={await db.contactRequest.count({ where: { status: "NEW" } })} />
        {children}
      </div>
    </div>
  );
}
