import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Configuración sin acceso a base de datos, apta para el middleware (runtime edge).
 * La verificación contra la lista blanca vive en auth.ts, que sí corre en Node.
 */
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
    // Sesiones cortas: si se desactiva un admin, su token expira en pocas horas
    // (y requireAdmin() lo bloquea de inmediato en cada acción del servidor).
    maxAge: 8 * 60 * 60,
  },
} satisfies NextAuthConfig;
