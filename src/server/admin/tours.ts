import "server-only";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import type { TourCategory } from "@/config/tour-categories";
import { db } from "@/lib/db";
import { englishStatus } from "./translation";

const translationContent = {
  title: true,
  summary: true,
  description: true,
  itinerary: true,
  includes: true,
  excludes: true,
  whatToBring: true,
  prices: true,
  meetingPoint: true,
  seoTitle: true,
  seoDescription: true,
} as const;

/** Los tours de una sección (borradores incluidos) en el orden en que se muestran en el sitio. */
export async function listToursForAdmin(category: TourCategory) {
  const tours = await db.tour.findMany({
    where: { category },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      featured: true,
      location: true,
      updatedAt: true,
      translations: { select: { locale: true, slug: true, source: true, sourceHash: true, ...translationContent } },
      media: { orderBy: { position: "asc" }, take: 1, select: { type: true, url: true } },
      _count: { select: { media: true } },
    },
  });

  return tours.map(({ translations, media, _count, ...tour }) => {
    const es = translations.find((t) => t.locale === "es");
    const en = translations.find((t) => t.locale === "en");
    return {
      ...tour,
      title: es?.title ?? "(sin título)",
      slugEs: es?.slug ?? null,
      english: englishStatus(es, en),
      cover: media[0] ?? null,
      mediaCount: _count.media,
    };
  });
}

/** Cacheado por solicitud: lo usan el layout del tour y cada pestaña. */
export const getTourForAdmin = cache(async (id: string) => {
  const tour = await db.tour.findUnique({
    where: { id },
    include: {
      translations: true,
      media: { orderBy: { position: "asc" } },
    },
  });
  if (!tour) return null;

  const { translations, ...rest } = tour;
  const es = translations.find((t) => t.locale === "es");
  const en = translations.find((t) => t.locale === "en");
  return { ...rest, es, en, english: englishStatus(es, en) };
});

export type AdminTour = NonNullable<Awaited<ReturnType<typeof getTourForAdmin>>>;

/** El sitio público cachea las páginas (revalidate); tras un cambio en el admin se regeneran. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
