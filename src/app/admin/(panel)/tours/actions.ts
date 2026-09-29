"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/auth";
import type { ActionResult, FormState } from "@/components/admin/form-state";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/env";
import { deleteAssets } from "@/lib/media/cloudinary";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { TranslationError } from "@/lib/translation";
import {
  parseForm,
  tourDataKeys,
  tourDataSchema,
  translationKeys,
  translationSchema,
  type FieldErrors,
} from "@/server/admin/tour-schema";
import { revalidateSite } from "@/server/admin/tours";
import { contentHash, syncEnglish, uniqueSlug } from "@/server/admin/translation";

async function adminOrThrow() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("No autorizado");
  return admin;
}

function invalid(fieldErrors: FieldErrors): FormState {
  return { status: "error", message: "Revisá los campos marcados.", fieldErrors };
}

/** Actualiza el inglés y devuelve un aviso si no se pudo (nunca bloquea el guardado del español). */
async function translateEnglish(tourId: string, adminId: string, force = false): Promise<ActionResult> {
  try {
    const result = await syncEnglish(tourId, {
      force,
      beforeTranslate() {
        const limit = rateLimit(`translate:${adminId}`, rateLimits.translate);
        if (!limit.ok) throw new TranslationError(rateLimitMessage(limit.retryAfterSec));
      },
    });
    switch (result) {
      case "translated":
        return { ok: true, message: "Versión en inglés actualizada." };
      case "up-to-date":
        return { ok: true };
      case "manual":
        return { ok: false, message: "La versión en inglés fue editada a mano y no se actualizó. Revisala en la pestaña Inglés." };
      case "not-configured":
        return { ok: false, message: "La traducción automática no está configurada (falta DEEPL_API_KEY)." };
    }
  } catch (error) {
    if (!(error instanceof TranslationError)) console.error("Error al traducir el tour", tourId, error);
    return { ok: false, message: `No se pudo traducir al inglés: ${error instanceof TranslationError ? error.message : "error inesperado."}` };
  }
}

/** Crea (tourId null) o actualiza un tour con su contenido en español, y lo traduce al inglés. */
export async function saveTour(tourId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminOrThrow();

  const content = parseForm(translationSchema, translationKeys, formData);
  const data = parseForm(tourDataSchema, tourDataKeys, formData);
  if (!content.success || !data.success) {
    return invalid({ ...(content.success ? {} : content.fieldErrors), ...(data.success ? {} : data.fieldErrors) });
  }
  const { slug: slugInput, ...fields } = content.data;

  if (tourId && !(await db.tour.findUnique({ where: { id: tourId }, select: { id: true } }))) {
    return { status: "error", message: "Este tour ya no existe." };
  }

  let slug: string;
  if (slugInput) {
    const taken = await db.tourTranslation.findFirst({
      where: { locale: "es", slug: slugInput, ...(tourId ? { tourId: { not: tourId } } : {}) },
      select: { id: true },
    });
    if (taken) return invalid({ slug: ["Otro tour ya usa este slug."] });
    slug = slugInput;
  } else {
    // Vacío: se conserva el actual (para no romper enlaces) o se genera a partir del título.
    const current = tourId
      ? await db.tourTranslation.findUnique({ where: { tourId_locale: { tourId, locale: "es" } }, select: { slug: true } })
      : null;
    slug = current?.slug ?? (await uniqueSlug("es", slugify(fields.title), tourId ?? undefined));
  }

  const es = { ...fields, slug, source: "ORIGINAL" as const };
  let id: string;
  if (tourId) {
    await db.tour.update({
      where: { id: tourId },
      data: {
        ...data.data,
        translations: {
          upsert: { where: { tourId_locale: { tourId, locale: "es" } }, create: { locale: "es", ...es }, update: es },
        },
      },
    });
    id = tourId;
  } else {
    const last = await db.tour.aggregate({ _max: { position: true } });
    const tour = await db.tour.create({
      data: { ...data.data, position: (last._max.position ?? -1) + 1, translations: { create: { locale: "es", ...es } } },
      select: { id: true },
    });
    id = tour.id;
  }

  const translation = await translateEnglish(id, admin.id);
  revalidateSite();

  if (!tourId) redirect(`/admin/tours/${id}?nuevo=1`);
  return {
    status: "saved",
    message: ["Cambios guardados.", translation.ok && translation.message].filter(Boolean).join(" "),
    warning: translation.ok ? undefined : translation.message,
  };
}

/** Guarda el inglés corregido a mano: desde ahí la traducción automática no lo sobrescribe. */
export async function saveEnglish(tourId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await adminOrThrow();

  const content = parseForm(translationSchema, translationKeys, formData);
  if (!content.success) return invalid(content.fieldErrors);
  const { slug: slugInput, ...fields } = content.data;

  const [es, en] = await Promise.all([
    db.tourTranslation.findUnique({ where: { tourId_locale: { tourId, locale: "es" } } }),
    db.tourTranslation.findUnique({ where: { tourId_locale: { tourId, locale: "en" } }, select: { slug: true } }),
  ]);
  if (!es) return { status: "error", message: "Primero guardá el contenido en español." };

  let slug: string;
  if (slugInput) {
    const taken = await db.tourTranslation.findFirst({
      where: { locale: "en", slug: slugInput, tourId: { not: tourId } },
      select: { id: true },
    });
    if (taken) return invalid({ slug: ["Otro tour ya usa este slug."] });
    slug = slugInput;
  } else {
    slug = en?.slug ?? (await uniqueSlug("en", slugify(fields.title), tourId));
  }

  // El hash del español actual marca esta versión como al día hasta que el español vuelva a cambiar.
  const data = { ...fields, slug, source: "MANUAL" as const, sourceHash: contentHash(es) };
  await db.tourTranslation.upsert({
    where: { tourId_locale: { tourId, locale: "en" } },
    create: { tourId, locale: "en", ...data },
    update: data,
  });
  revalidateSite();
  return { status: "saved", message: "Versión en inglés guardada. La traducción automática ya no la sobrescribirá." };
}

/** Retraduce el inglés desde el español, reemplazando también las correcciones manuales. */
export async function retranslateTour(tourId: string): Promise<ActionResult> {
  const admin = await adminOrThrow();
  const result = await translateEnglish(tourId, admin.id, true);
  if (result.ok) revalidateSite();
  return result;
}

export async function setTourStatus(tourId: string, status: "DRAFT" | "PUBLISHED") {
  await adminOrThrow();
  const tour = await db.tour.findUnique({ where: { id: tourId }, select: { publishedAt: true } });
  if (!tour) return;
  await db.tour.update({
    where: { id: tourId },
    data: { status, publishedAt: status === "PUBLISHED" ? (tour.publishedAt ?? new Date()) : tour.publishedAt },
  });
  revalidateSite();
}

export async function toggleFeatured(tourId: string) {
  await adminOrThrow();
  const tour = await db.tour.findUnique({ where: { id: tourId }, select: { featured: true } });
  if (!tour) return;
  await db.tour.update({ where: { id: tourId }, data: { featured: !tour.featured } });
  revalidateSite();
}

/** Sube o baja un tour una posición en el listado del sitio. */
export async function moveTour(tourId: string, direction: "up" | "down") {
  await adminOrThrow();
  const tours = await db.tour.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, position: true },
  });
  const from = tours.findIndex((t) => t.id === tourId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= tours.length) return;

  [tours[from], tours[to]] = [tours[to], tours[from]];
  await db.$transaction(
    tours.flatMap((tour, position) =>
      tour.position === position ? [] : [db.tour.update({ where: { id: tour.id }, data: { position } })],
    ),
  );
  revalidateSite();
}

/** Borra el tour, sus traducciones y sus archivos en Cloudinary. */
export async function deleteTour(tourId: string): Promise<ActionResult> {
  await adminOrThrow();
  const media = await db.media.findMany({ where: { tourId }, select: { publicId: true, type: true } });

  if (media.length > 0) {
    if (!isCloudinaryConfigured()) {
      return { ok: false, message: "Faltan las credenciales de Cloudinary para borrar los archivos del tour." };
    }
    try {
      await deleteAssets(media);
    } catch (error) {
      console.error("Error al borrar archivos de Cloudinary", error);
      return { ok: false, message: "No se pudieron borrar los archivos en Cloudinary. El tour no se eliminó." };
    }
  }

  await db.tour.deleteMany({ where: { id: tourId } });
  revalidateSite();
  redirect("/admin");
}
