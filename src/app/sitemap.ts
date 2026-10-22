import type { MetadataRoute } from "next";
import type { Href } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";
import { getPublishedTourSlugs } from "@/server/tours";

export const revalidate = 3600;

type Options = { lastModified?: Date; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" };

function entry(hrefs: Record<Locale, Href>, { lastModified, priority, changeFrequency }: Options): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, hrefs[l])]));
  // Una entrada por idioma, cada una con sus alternativas hreflang.
  return routing.locales.map((locale) => ({
    url: absoluteUrl(locale, hrefs[locale]),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Prioridad relativa dentro del sitio (Bing la usa; Google se guía por los enlaces internos).
  const staticPages = (
    [
      ["/", { priority: 1, changeFrequency: "weekly" }],
      ["/tours", { priority: 0.9, changeFrequency: "weekly" }],
      ["/services", { priority: 0.7, changeFrequency: "monthly" }],
      ["/about", { priority: 0.7, changeFrequency: "monthly" }],
      ["/plan-your-trip", { priority: 0.7, changeFrequency: "monthly" }],
      ["/contact", { priority: 0.6, changeFrequency: "monthly" }],
      ["/privacy", { priority: 0.2, changeFrequency: "yearly" }],
    ] as const
  ).flatMap(([href, options]) => entry({ es: href, en: href }, options));

  const tours = await getPublishedTourSlugs();
  const tourPages = tours
    .filter((tour) => tour.slugs.es && tour.slugs.en)
    .flatMap((tour) =>
      entry(
        {
          es: { pathname: "/tours/[slug]", params: { slug: tour.slugs.es! } },
          en: { pathname: "/tours/[slug]", params: { slug: tour.slugs.en! } },
        },
        { lastModified: tour.updatedAt, priority: 0.8, changeFrequency: "weekly" },
      ),
    );

  return [...staticPages, ...tourPages];
}
