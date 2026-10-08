import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  // Los hreflang se generan en la metadata de cada página: los slugs de tours cambian por idioma
  // y el header Link automático apuntaría a URLs inexistentes.
  alternateLinks: false,
  // Las claves son las rutas internas (carpetas en app/[locale]); los valores, las URLs públicas por idioma.
  pathnames: {
    "/": "/",
    "/tours": "/tours",
    "/tours/[slug]": "/tours/[slug]",
    "/services": { es: "/otros-servicios", en: "/other-services" },
    "/plan-your-trip": { es: "/planifica-tu-viaje", en: "/plan-your-trip" },
    "/contact": { es: "/contacto", en: "/contact" },
    "/privacy": { es: "/privacidad", en: "/privacy" },
  },
});

export type Locale = (typeof routing.locales)[number];
