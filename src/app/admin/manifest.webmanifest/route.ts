import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Manifiesto del panel: se instala como una app aparte del sitio (id y alcance propios, ícono claro
 * para distinguirlo en la pantalla de inicio). Queda fuera del middleware por tener extensión,
 * así que el navegador lo lee sin sesión; no expone nada del panel.
 */
const manifest: MetadataRoute.Manifest = {
  id: "/admin",
  name: "Admin · Anthony Jimenez Wildlife",
  short_name: "AJ Admin",
  description: "Panel de administración de tours, solicitudes y portadas.",
  start_url: "/admin",
  scope: "/admin",
  display: "standalone",
  background_color: "#f4f7ef",
  theme_color: "#06140c",
  lang: "es",
  icons: [
    { src: "/icons/admin-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/admin-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/admin-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function GET() {
  return Response.json(manifest, { headers: { "content-type": "application/manifest+json" } });
}
