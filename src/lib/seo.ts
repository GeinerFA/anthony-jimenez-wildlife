import type { Metadata } from "next";
import { siteConfig, socialProfiles } from "@/config/site";
import { getPathname, type Href } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export const ogLocales: Record<Locale, string> = { es: "es_CR", en: "en_US" };

/** Idioma de cada versión del sitio para schema.org (`inLanguage`). */
const schemaLanguages: Record<Locale, string> = { es: "es-CR", en: "en" };

const ids = {
  website: `${siteConfig.url}/#website`,
  organization: `${siteConfig.url}/#organization`,
  founder: `${siteConfig.url}/#anthony-jimenez`,
};

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

/** Imagen para compartir (1200 × 630) generada desde el logo; los tours usan su portada. */
export const defaultOgImage = {
  url: `${siteConfig.url}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: siteConfig.name,
};

/**
 * Campos de Open Graph comunes a todo el sitio. Next no fusiona `openGraph` entre layout y página
 * (la página lo reemplaza entero), así que cada página debe incluirlos con spread.
 */
export function openGraphBase(locale: Locale) {
  return {
    type: "website" as const,
    siteName: siteConfig.name,
    locale: ogLocales[locale],
    alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
    images: [defaultOgImage],
  };
}

/** Metadata de una página estática: título, descripción, canonical/hreflang y Open Graph/Twitter coherentes. */
export function pageMetadata(locale: Locale, href: LocalizedHrefs, { title, description }: { title: string; description: string }): Metadata {
  return {
    title,
    description,
    alternates: localeAlternates(locale, href),
    openGraph: { ...openGraphBase(locale), title, description, url: absoluteUrl(locale, hrefFor(href, locale)) },
    twitter: { card: "summary_large_image", title, description, images: [defaultOgImage.url] },
  };
}

type SiteTexts = {
  /** Descripción de la empresa (la misma de la metadata del inicio). */
  description: string;
  /** Lema de la marca. */
  slogan: string;
  /** Cargo del guía, p. ej. "Guía naturalista". */
  jobTitle: string;
  /** Temas en los que es experto: observación de aves, fotografía de naturaleza… */
  knowsAbout: string[];
};

/**
 * Grafo schema.org de la marca, en todas las páginas: sitio web, agencia de turismo y el guía.
 * Los tours y servicios lo referencian por `@id`.
 */
export function siteJsonLd(locale: Locale, { description, slogan, jobTitle, knowsAbout }: SiteTexts) {
  const phone = `+${siteConfig.social.whatsapp.slice(0, 3)} ${siteConfig.social.whatsapp.slice(3, 7)} ${siteConfig.social.whatsapp.slice(7)}`;
  const logo = { "@type": "ImageObject", url: `${siteConfig.url}/logo.png`, width: 512, height: 512 };
  const costaRica = { "@type": "Country", name: "Costa Rica" };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": ids.website,
        name: siteConfig.name,
        alternateName: siteConfig.alternateNames,
        url: `${siteConfig.url}/`,
        inLanguage: routing.locales.map((l) => schemaLanguages[l]),
        publisher: { "@id": ids.organization },
      },
      {
        "@type": "TravelAgency",
        "@id": ids.organization,
        name: siteConfig.name,
        alternateName: siteConfig.alternateNames,
        url: absoluteUrl(locale, "/"),
        logo,
        image: [defaultOgImage.url, logo.url],
        description,
        slogan,
        email: siteConfig.email,
        telephone: phone,
        address: { "@type": "PostalAddress", addressCountry: "CR" },
        areaServed: costaRica,
        knowsAbout,
        knowsLanguage: ["es", "en"],
        currenciesAccepted: "USD, CRC",
        founder: { "@id": ids.founder },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "reservations",
          telephone: phone,
          email: siteConfig.email,
          url: `https://wa.me/${siteConfig.social.whatsapp}`,
          availableLanguage: ["Spanish", "English"],
          areaServed: "Worldwide",
        },
        sameAs: socialProfiles,
      },
      {
        "@type": "Person",
        "@id": ids.founder,
        name: siteConfig.founder.name,
        alternateName: siteConfig.founder.alternateName,
        jobTitle,
        nationality: costaRica,
        knowsAbout,
        knowsLanguage: ["es", "en"],
        worksFor: { "@id": ids.organization },
        url: absoluteUrl(locale, "/"),
        sameAs: socialProfiles,
      },
    ],
  };
}

/** Migas de pan (Inicio › … › página actual) para que Google muestre la ruta en los resultados. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };
}
