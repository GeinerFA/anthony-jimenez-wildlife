import "server-only";
import { createHash } from "node:crypto";
import type { TourTranslation } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { getTranslator, translateTexts } from "@/lib/translation";

type TranslatableContent = Pick<
  TourTranslation,
  | "title"
  | "summary"
  | "description"
  | "itinerary"
  | "includes"
  | "excludes"
  | "whatToBring"
  | "meetingPoint"
  | "seoTitle"
  | "seoDescription"
>;

/** Hash del contenido traducible (sin el slug): si cambia, la traducción quedó desactualizada. */
export function contentHash(content: TranslatableContent) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        content.title,
        content.summary,
        content.description,
        content.itinerary,
        content.includes,
        content.excludes,
        content.whatToBring,
        content.meetingPoint,
        content.seoTitle,
        content.seoDescription,
      ]),
    )
    .digest("hex");
}

/** Slug libre en ese idioma; agrega -2, -3... si otro tour ya lo usa. */
export async function uniqueSlug(locale: Locale, base: string, tourId?: string) {
  const root = base || "tour";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const taken = await db.tourTranslation.findFirst({
      where: { locale, slug: candidate, ...(tourId ? { tourId: { not: tourId } } : {}) },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}

export type EnglishStatus = "missing" | "machine" | "machine-stale" | "manual" | "manual-stale";

export const englishStatusLabels: Record<EnglishStatus, string> = {
  missing: "Sin traducir",
  machine: "Traducida",
  "machine-stale": "Desactualizada",
  manual: "Editada a mano",
  "manual-stale": "Editada a mano · revisar",
};

export function englishStatus(es: TranslatableContent | undefined, en: Pick<TourTranslation, "source" | "sourceHash"> | undefined): EnglishStatus {
  if (!en) return "missing";
  const stale = !es || en.sourceHash !== contentHash(es);
  if (en.source === "MANUAL") return stale ? "manual-stale" : "manual";
  return stale ? "machine-stale" : "machine";
}

/** "manual": el español cambió pero el inglés fue corregido a mano, así que no se tocó. */
export type SyncResult = "translated" | "up-to-date" | "manual" | "not-configured";

/**
 * Genera o actualiza la versión en inglés a partir del español.
 * Sin `force` no toca traducciones corregidas a mano ni las que ya están al día.
 * `beforeTranslate` corre justo antes de llamar a la API (p. ej. para aplicar el rate limit).
 */
export async function syncEnglish(
  tourId: string,
  { force = false, beforeTranslate }: { force?: boolean; beforeTranslate?: () => void } = {},
): Promise<SyncResult> {
  const [es, en] = await Promise.all([
    db.tourTranslation.findUnique({ where: { tourId_locale: { tourId, locale: "es" } } }),
    db.tourTranslation.findUnique({ where: { tourId_locale: { tourId, locale: "en" } } }),
  ]);
  if (!es) throw new Error("El tour no tiene contenido en español.");

  const hash = contentHash(es);
  if (!force && en?.sourceHash === hash) return "up-to-date";
  if (!force && en?.source === "MANUAL") return "manual";

  const translator = getTranslator();
  if (!translator) return "not-configured";
  beforeTranslate?.();

  const scalars = [es.title, es.summary, es.description, es.itinerary ?? "", es.meetingPoint ?? "", es.seoTitle ?? "", es.seoDescription ?? ""];
  const texts = [...scalars, ...es.includes, ...es.excludes, ...es.whatToBring];
  const out = await translateTexts(translator, texts, "es", "en");

  const [title, summary, description, itinerary, meetingPoint, seoTitle, seoDescription] = out;
  let offset = scalars.length;
  const take = (count: number) => out.slice(offset, (offset += count));
  const includes = take(es.includes.length);
  const excludes = take(es.excludes.length);
  const whatToBring = take(es.whatToBring.length);

  const content = {
    title: title || es.title,
    summary: summary || es.summary,
    description: description || es.description,
    itinerary: itinerary || null,
    meetingPoint: meetingPoint || null,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    includes,
    excludes,
    whatToBring,
    source: "MACHINE" as const,
    sourceHash: hash,
    translatedAt: new Date(),
  };

  // El slug en inglés se genera una vez; después se conserva para no romper enlaces ya publicados.
  const slug = en?.slug ?? (await uniqueSlug("en", slugify(content.title), tourId));

  await db.tourTranslation.upsert({
    where: { tourId_locale: { tourId, locale: "en" } },
    create: { tourId, locale: "en", slug, ...content },
    update: content,
  });
  return "translated";
}
