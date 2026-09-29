import type { Metadata } from "next";
import { siteConfig, socialProfiles } from "@/config/site";
import { getPathname, type Href } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export const ogLocales: Record<Locale, string> = { es: "es_CR", en: "en_US" };

export function absoluteUrl(locale: Locale, href: Href) {
  return siteConfig.url + getPathname({ locale, href });
}

/** Una ruta por idioma; si se pasa una sola, se usa la misma para ambos. */
export type LocalizedHrefs = Href | Record<Locale, Href>;

function hrefFor(hrefs: LocalizedHrefs, locale: Locale): Href {
  return typeof hrefs === "object" && "es" in hrefs && "en" in hrefs ? hrefs[locale] : (hrefs as Href);
}

/** canonical + hreflang es/en + x-default (español). */
export function localeAlternates(locale: Locale, hrefs: LocalizedHrefs): Metadata["alternates"] {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, absoluteUrl(l, hrefFor(hrefs, l))]),
  );
  return {
    canonical: absoluteUrl(locale, hrefFor(hrefs, locale)),
    languages: { ...languages, "x-default": absoluteUrl(routing.defaultLocale, hrefFor(hrefs, routing.defaultLocale)) },
  };
}

export function organizationJsonLd(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: absoluteUrl(locale, "/"),
    description,
    email: siteConfig.email,
    areaServed: { "@type": "Country", name: "Costa Rica" },
    address: { "@type": "PostalAddress", addressCountry: "CR" },
    sameAs: socialProfiles,
  };
}
