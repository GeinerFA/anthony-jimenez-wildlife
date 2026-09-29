"use server";

import { z } from "zod";
import { requireAdmin } from "@/auth/auth";
import type { ActionResult } from "@/components/admin/form-state";
import { mediaRules, tourMediaFolder } from "@/config/media";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/env";
import { deleteAsset, getResource } from "@/lib/media/cloudinary";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";
import { getTranslator, translateTexts } from "@/lib/translation";
import { revalidateSite } from "@/server/admin/tours";

async function adminOrThrow() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("No autorizado");
  return admin;
}

const registerSchema = z.object({
  tourId: z.string().min(1).max(40),
  publicId: z.string().min(1).max(300),
  type: z.enum(["IMAGE", "VIDEO"]),
});

/**
 * Guarda un archivo que el navegador ya subió a Cloudinary. Los metadatos se leen de Cloudinary
 * (no del navegador) y el archivo se borra si no cumple las reglas de tipo y tamaño.
 */
export async function registerMedia(input: z.input<typeof registerSchema>): Promise<ActionResult> {
  const admin = await adminOrThrow();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos de subida inválidos." };
  const { tourId, publicId, type } = parsed.data;

  const limit = rateLimit(`upload:${admin.id}`, rateLimits.upload);
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSec) };

  if (!publicId.startsWith(`${tourMediaFolder(tourId)}/`)) return { ok: false, message: "El archivo no pertenece a este tour." };
  if (!(await db.tour.findUnique({ where: { id: tourId }, select: { id: true } }))) {
    return { ok: false, message: "Este tour ya no existe." };
  }
  if (await db.media.findUnique({ where: { publicId }, select: { id: true } })) return { ok: true };

  const resource = await getResource(publicId, type);
  if (!resource) return { ok: false, message: "Cloudinary no encontró el archivo subido." };

  const rules = mediaRules[type];
  const problem = !(rules.formats as readonly string[]).includes(resource.format)
    ? `Formato no permitido (${resource.format}).`
    : resource.bytes > rules.maxBytes
      ? `El archivo supera el máximo de ${rules.maxLabel}.`
      : null;
  if (problem) {
    await deleteAsset(publicId, type).catch((error) => console.error("No se pudo borrar el archivo rechazado", publicId, error));
    return { ok: false, message: problem };
  }

  const last = await db.media.aggregate({ where: { tourId }, _max: { position: true } });
  await db.media.create({
    data: {
      tourId,
      type,
      publicId,
      url: resource.secure_url,
      format: resource.format,
      width: resource.width ?? 0,
      height: resource.height ?? 0,
      bytes: resource.bytes,
      durationSec: type === "VIDEO" ? (resource.duration ?? null) : null,
      position: (last._max.position ?? -1) + 1,
    },
  });
  revalidateSite();
  return { ok: true };
}

/** Nuevo orden de la galería; la primera posición es la portada. */
export async function reorderMedia(tourId: string, orderedIds: string[]): Promise<ActionResult> {
  await adminOrThrow();
  const media = await db.media.findMany({ where: { tourId }, select: { id: true, position: true } });

  const known = new Set(media.map((m) => m.id));
  if (orderedIds.length !== media.length || !orderedIds.every((id) => known.has(id))) {
    return { ok: false, message: "La galería cambió mientras la editabas. Recargá la página." };
  }

  const current = new Map(media.map((m) => [m.id, m.position]));
  await db.$transaction(
    orderedIds.flatMap((id, position) =>
      current.get(id) === position ? [] : [db.media.update({ where: { id }, data: { position } })],
    ),
  );
  revalidateSite();
  return { ok: true };
}

export async function deleteMedia(mediaId: string): Promise<ActionResult> {
  await adminOrThrow();
  const media = await db.media.findUnique({ where: { id: mediaId }, select: { tourId: true, publicId: true, type: true } });
  if (!media) return { ok: true };
  if (!isCloudinaryConfigured()) return { ok: false, message: "Faltan las credenciales de Cloudinary." };

  try {
    await deleteAsset(media.publicId, media.type);
  } catch (error) {
    console.error("Error al borrar en Cloudinary", media.publicId, error);
    return { ok: false, message: "No se pudo borrar el archivo en Cloudinary." };
  }

  await db.media.delete({ where: { id: mediaId } });
  // Reindexa para que la galería siga en 0..n-1 (la posición 0 es la portada).
  const rest = await db.media.findMany({ where: { tourId: media.tourId }, orderBy: { position: "asc" }, select: { id: true, position: true } });
  await db.$transaction(
    rest.flatMap((m, position) => (m.position === position ? [] : [db.media.update({ where: { id: m.id }, data: { position } })])),
  );
  revalidateSite();
  return { ok: true };
}

const altSchema = z.object({
  altEs: z.string().trim().max(200),
  altEn: z.string().trim().max(200),
});

/** Guarda los textos alternativos; si falta el inglés, intenta traducirlo del español. */
export async function updateMediaAlt(
  mediaId: string,
  input: z.input<typeof altSchema>,
): Promise<ActionResult & { altEn?: string }> {
  const admin = await adminOrThrow();
  const parsed = altSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Máximo 200 caracteres por texto." };
  const { altEs } = parsed.data;
  let { altEn } = parsed.data;

  let warning: string | undefined;
  const translator = getTranslator();
  if (altEs && !altEn && translator) {
    const limit = rateLimit(`translate:${admin.id}`, rateLimits.translate);
    if (limit.ok) {
      altEn = (await translateTexts(translator, [altEs], "es", "en").catch(() => [""]))[0];
      if (!altEn) warning = "Se guardó, pero no se pudo traducir al inglés.";
    } else {
      warning = rateLimitMessage(limit.retryAfterSec);
    }
  }

  const updated = await db.media.updateMany({ where: { id: mediaId }, data: { altEs: altEs || null, altEn: altEn || null } });
  if (updated.count === 0) return { ok: false, message: "El archivo ya no existe." };
  revalidateSite();
  return { ok: !warning, message: warning, altEn };
}
