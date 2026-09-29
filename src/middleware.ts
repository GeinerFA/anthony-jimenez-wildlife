import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";
import { authConfig } from "@/auth/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * El login con Google solo funciona en la dirección de AUTH_URL: Google rechaza IPs privadas
 * (p. ej. la URL "Network" de next dev) y las cookies de verificación son por dominio.
 *
 * Se usa el encabezado Host porque req.nextUrl no refleja la dirección real (Next la arma con su
 * hostname interno, y auth() la reescribe con AUTH_URL). Y se redirige desde el navegador en vez
 * de con un 307: Next convierte en relativo un Location que coincide con su URL interna, y el
 * navegador volvería a la misma IP.
 */
function redirectToCanonicalHost(req: NextRequest) {
  const canonical = process.env.AUTH_URL ? new URL(process.env.AUTH_URL) : null;
  const host = req.headers.get("host");
  if (!canonical || !host || host === canonical.host || !isAdminPath(req.nextUrl.pathname)) return null;

  const target = escapeHtml(new URL(req.nextUrl.pathname + req.nextUrl.search, canonical).toString());
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><title>Redirigiendo…</title><p>El panel se abre en <a href="${target}">${target}</a>.</p>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user);

  if (pathname.startsWith("/api/admin")) {
    return isLoggedIn
      ? NextResponse.next()
      : NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isAdminPath(pathname)) {
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
  // auth(handler) también sirve como route handler y sus tipos no incluyen la firma de middleware.
}) as unknown as NextMiddleware;

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  return redirectToCanonicalHost(req) ?? authMiddleware(req, event);
}

export const config = {
  // Todo excepto los endpoints de Auth.js, internos de Next y archivos estáticos (con extensión).
  matcher: ["/((?!api/auth|_next|_vercel|.*\\..*).*)"],
};
