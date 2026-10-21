import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";

/** Manifiesto web: nombre, íconos y colores cuando se agrega el sitio a la pantalla de inicio. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "AJ Wildlife",
    description: "Tours de vida silvestre y observación de aves en Costa Rica con un guía naturalista local.",
    start_url: `/${routing.defaultLocale}`,
    display: "standalone",
    background_color: "#06140c",
    theme_color: "#06140c",
    lang: routing.defaultLocale,
    categories: ["travel"],
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
