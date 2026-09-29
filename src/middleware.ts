import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user);

  if (pathname.startsWith("/api/admin")) {
    return isLoggedIn
      ? NextResponse.next()
      : NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") {
      // Con ?error se deja pasar: un admin desactivado conserva un JWT válido y, si se le
      // redirigiera a /admin, el panel lo devolvería aquí en un ciclo infinito.
      const bounceToPanel = isLoggedIn && !req.nextUrl.searchParams.has("error");
      return bounceToPanel ? NextResponse.redirect(new URL("/admin", req.nextUrl)) : NextResponse.next();
    }
    if (!isLoggedIn) {
      const loginUrl = new URL("/admin/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) return NextResponse.next();

  return intlMiddleware(req);
});

export const config = {
  // Todo excepto los endpoints de Auth.js, internos de Next y archivos estáticos (con extensión).
  matcher: ["/((?!api/auth|_next|_vercel|.*\\..*).*)"],
};
