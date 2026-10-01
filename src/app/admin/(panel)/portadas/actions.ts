"use server";

import { z } from "zod";
import { requireAdmin } from "@/auth/auth";
import type { ActionResult } from "@/components/admin/form-state";
import { heroMediaFolder, heroPages, type HeroPageKey } from "@/config/media";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/env";
import { deleteAsset } from "@/lib/media/cloudinary";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";
import { verifyUploadedResource } from "@/server/admin/media";
import { revalidateSite } from "@/server/admin/tours";

async function adminOrThrow() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("No autorizado");
  return admin;
}

const registerSchema = z.object({
  page: z.enum(heroPages),
  publicId: z.string().min(1).max(300),
  type: z.enum(["IMAGE", "VIDEO"]),
});

/**
 * Guarda como hero de una página un archivo que el navegador ya subió a Cloudinary.
 * Reemplaza al anterior y lo borra de Cloudinary para no acumular archivos huérfanos.
 */
export async function registerHeroMedia(input: z.input<typeof registerSchema>): Promise<ActionResult> {
  const admin = await adminOrThrow();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos de subida inválidos." };
  const { page, publicId, type } = parsed.data;

  const limit = rateLimit(`upload:${admin.id}`, rateLimits.upload);
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSec) };

  if (!publicId.startsWith(`${heroMediaFolder(page)}/`)) return { ok: false, message: "El archivo no pertenece a esta portada." };

  const previous = await db.heroMedia.findUnique({ where: { page }, select: { publicId: true, type: true } });
  if (previous?.publicId === publicId) return { ok: true };

  const verified = await verifyUploadedResource(publicId, type);
  if (!verified.ok) return verified;
  const { resource } = verified;

  const data = {
    type,
    publicId,
    url: resource.secure_url,
    format: resource.format,
    width: resource.width ?? 0,
    height: resource.height ?? 0,
    bytes: resource.bytes,
    durationSec: type === "VIDEO" ? (resource.duration ?? null) : null,
  };
  await db.heroMedia.upsert({ where: { page }, create: { page, ...data }, update: data });

  if (previous) {
    await deleteAsset(previous.publicId, previous.type).catch((error) =>
      console.error("No se pudo borrar la portada anterior en Cloudinary", previous.publicId, error),
    );
  }
  revalidateSite();
  return { ok: true };
}

/** Quita el hero propio de la página: vuelve a su fondo por defecto. */
export async function removeHeroMedia(page: HeroPageKey): Promise<ActionResult> {
  await adminOrThrow();
  if (!heroPages.includes(page)) return { ok: false, message: "Página inválida." };
  const hero = await db.heroMedia.findUnique({ where: { page }, select: { publicId: true, type: true } });
  if (!hero) return { ok: true };
  if (!isCloudinaryConfigured()) return { ok: false, message: "Faltan las credenciales de Cloudinary." };

  try {
    await deleteAsset(hero.publicId, hero.type);
  } catch (error) {
    console.error("Error al borrar en Cloudinary", hero.publicId, error);
    return { ok: false, message: "No se pudo borrar el archivo en Cloudinary." };
  }

  await db.heroMedia.deleteMany({ where: { page } });
  revalidateSite();
  return { ok: true };
}
