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
      <header className="border-b border-ink/10 bg-ink text-bone">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/admin">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-bone/70 sm:inline">{admin.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button type="submit" className="rounded-full border border-bone/30 px-4 py-1.5 hover:border-sun hover:text-sun">
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
