import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";

/**
 * Manifiesto del sitio público (app instalable). start_url "/" deja que el middleware elija /es o /en
 * según el idioma del visitante. El panel tiene su propio manifiesto en app/admin/manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: "AJ Wildlife",
    description: "Tours de vida silvestre y observación de aves en Costa Rica con un guía naturalista local.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#06140c",
    lang: routing.defaultLocale,
    categories: ["travel"],
    icons: [
      { src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
