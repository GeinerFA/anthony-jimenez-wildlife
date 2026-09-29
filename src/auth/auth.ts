import "server-only";
import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { assertAuthEnv } from "@/lib/env";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ account, profile }) {
      assertAuthEnv();
      if (account?.provider !== "google") return false;
      if (!profile?.email || profile.email_verified !== true) return false;

      const email = profile.email.toLowerCase();
      const admin = await db.adminUser.findUnique({ where: { email } });
      if (!admin?.active) return false;

      await db.adminUser.update({
        where: { email },
        data: { lastLoginAt: new Date(), name: admin.name ?? profile.name ?? null },
      });
      return true;
    },
  },
});

/**
 * Segunda capa de seguridad para server actions y rutas /api/admin: además del JWT válido,
 * el correo debe seguir activo en la lista blanca. Devuelve null si no está autorizado.
 */
export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const admin = await db.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, active: true },
  });
  return admin?.active ? admin : null;
}
