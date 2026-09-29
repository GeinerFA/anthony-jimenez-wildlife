import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";

const coverSelect = {
  orderBy: { position: "asc" },
  take: 1,
  select: { type: true, url: true, width: true, height: true, altEs: true, altEn: true },
} as const;

/** Tours publicados con traducción en el idioma pedido, ordenados como en el admin. */
export const getPublishedTours = cache(async (locale: Locale, options: { featured?: boolean; limit?: number } = {}) => {
  const tours = await db.tour.findMany({
    where: {
      status: "PUBLISHED",
      ...(options.featured ? { featured: true } : {}),
      translations: { some: { locale } },
    },
    orderBy: [{ position: "asc" }, { publishedAt: "desc" }],
    take: options.limit,
    select: {
      id: true,
      durationMinutes: true,
      difficulty: true,
      location: true,
      translations: { where: { locale }, select: { slug: true, title: true, summary: true } },
      media: coverSelect,
    },
  });

  return tours.map(({ translations, media, ...tour }) => ({
    ...tour,
    ...translations[0],
    cover: media[0] ?? null,
  }));
});

export type TourCardData = Awaited<ReturnType<typeof getPublishedTours>>[number];

export const getTourBySlug = cache(async (locale: Locale, slug: string) => {
  const translation = await db.tourTranslation.findUnique({
    where: { locale_slug: { locale, slug } },
    select: {
      title: true,
      summary: true,
      description: true,
      itinerary: true,
      includes: true,
      excludes: true,
      whatToBring: true,
      meetingPoint: true,
      seoTitle: true,
      seoDescription: true,
      tour: {
        select: {
          id: true,
          status: true,
          durationMinutes: true,
          difficulty: true,
          location: true,
          latitude: true,
          longitude: true,
          updatedAt: true,
          translations: { select: { locale: true, slug: true } },
          media: {
            orderBy: { position: "asc" },
            select: { id: true, type: true, url: true, width: true, height: true, durationSec: true, altEs: true, altEn: true },
          },
        },
      },
    },
  });

  if (!translation || translation.tour.status !== "PUBLISHED") return null;

  const { tour, ...content } = translation;
  const slugs = Object.fromEntries(tour.translations.map((t) => [t.locale, t.slug])) as Partial<Record<Locale, string>>;
  return { ...content, ...tour, slugs };
});

/**
 * Si el slug pertenece a otro idioma (p. ej. al cambiar de idioma desde el header),
 * devuelve el slug correcto para `locale` para redirigir.
 */
export async function findTranslatedSlug(locale: Locale, slug: string) {
  const match = await db.tourTranslation.findFirst({
    where: { slug, locale: { not: locale }, tour: { status: "PUBLISHED" } },
    select: { tour: { select: { translations: { where: { locale }, select: { slug: true } } } } },
  });
  return match?.tour.translations[0]?.slug ?? null;
}

/** Slugs de ambos idiomas para el sitemap y generateStaticParams. */
export async function getPublishedTourSlugs() {
  const tours = await db.tour.findMany({
    where: { status: "PUBLISHED" },
    select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
  });
  return tours.map((tour) => ({
    updatedAt: tour.updatedAt,
    slugs: Object.fromEntries(tour.translations.map((t) => [t.locale, t.slug])) as Partial<Record<Locale, string>>,
  }));
}
