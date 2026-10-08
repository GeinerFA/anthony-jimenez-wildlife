import type { MetadataRoute } from "next";
import type { Href } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";
import { getPublishedTourSlugs } from "@/server/tours";

export const revalidate = 3600;

function entry(hrefs: Record<Locale, Href>, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, hrefs[l])]));
  // Una entrada por idioma, cada una con sus alternativas hreflang.
  return routing.locales.map((locale) => ({
    url: absoluteUrl(locale, hrefs[locale]),
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = (["/", "/tours", "/services", "/plan-your-trip", "/contact", "/privacy"] as const).flatMap((href) => entry({ es: href, en: href }));

  const tours = await getPublishedTourSlugs();
  const tourPages = tours
    .filter((tour) => tour.slugs.es && tour.slugs.en)
    .flatMap((tour) =>
      entry(
        {
          es: { pathname: "/tours/[slug]", params: { slug: tour.slugs.es! } },
          en: { pathname: "/tours/[slug]", params: { slug: tour.slugs.en! } },
        },
        tour.updatedAt,
      ),
    );

  return [...staticPages, ...tourPages];
}
