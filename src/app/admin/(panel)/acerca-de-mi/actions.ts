"use server";

import { z } from "zod";
import { requireAdmin } from "@/auth/auth";
import type { ActionResult, FormState } from "@/components/admin/form-state";
import type { AboutAsset } from "@/config/media";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/env";
import { deleteAsset } from "@/lib/media/cloudinary";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";
import { resolveEnglish, verifyAboutImage } from "@/server/admin/about";
import { parseForm, type FieldErrors } from "@/server/admin/tour-schema";
import { revalidateSite } from "@/server/admin/tours";

async function adminOrThrow() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("No autorizado");
  return admin;
}

function invalid(fieldErrors: FieldErrors): FormState {
  return { status: "error", message: "Revisá los campos marcados.", fieldErrors };
}

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const required = (max: number, message: string) => text(max).min(1, message);
const checkbox = z.string().transform((value) => value === "on");

/** Enlace externo: se acepta "hotel.com" y se guarda como "https://hotel.com". */
const externalUrl = text(300)
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .refine((value) => !value || URL.canParse(value), "Enlace inválido.")
  .transform((value) => value || null);

/**
 * Imagen recién subida (si la hay): se verifica antes de guardarla y se devuelve junto con la
 * anterior, que se borra de Cloudinary después de guardar.
 */
async function newImage(adminId: string, publicId: string, current: string | null | undefined, asset: AboutAsset) {
  if (!publicId || publicId === current) return { ok: true as const, image: null };
  const limit = rateLimit(`upload:${adminId}`, rateLimits.upload);
  if (!limit.ok) return { ok: false as const, message: rateLimitMessage(limit.retryAfterSec) };
  return verifyAboutImage(publicId, asset);
}

async function deleteOldImage(publicId: string | null | undefined) {
  if (!publicId) return;
  await deleteAsset(publicId, "IMAGE").catch((error) => console.error("No se pudo borrar la imagen anterior en Cloudinary", publicId, error));
}

/** Mueve un elemento de una lista ordenada (cifras o aliados) una posición arriba o abajo. */
function reorder<T extends { id: string; position: number }>(items: T[], id: string, direction: "up" | "down") {
  const from = items.findIndex((item) => item.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= items.length) return [];
  [items[from], items[to]] = [items[to], items[from]];
  return items.flatMap((item, position) => (item.position === position ? [] : [{ id: item.id, position }]));
}

const savedMessage = (warning?: string): FormState => ({ status: "saved", message: "Cambios guardados.", warning });

// ── Biografía ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  bioEs: required(5000, "Escribí la biografía."),
  quoteEs: text(200),
  bioEn: text(5000),
  quoteEn: text(200),
  photoPublicId: text(300),
});

export async function saveAboutProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminOrThrow();
  const parsed = parseForm(profileSchema, profileSchema.keyof().options, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors);
  const input = parsed.data;

  const stored = await db.aboutProfile.findUnique({ where: { id: "about" } });
  const photo = await newImage(admin.id, input.photoPublicId, stored?.photoPublicId, "photo");
  if (!photo.ok) return { status: "error", message: photo.message };

  const english = await resolveEnglish(
    admin.id,
    [input.bioEs, input.quoteEs],
    [input.bioEn, input.quoteEn],
    stored && { es: [stored.bioEs, stored.quoteEs ?? ""], en: [stored.bioEn ?? "", stored.quoteEn ?? ""], enManual: stored.enManual },
  );

  const data = {
    bioEs: input.bioEs,
    quoteEs: input.quoteEs || null,
    bioEn: english.en[0],
    quoteEn: english.en[1],
    enManual: english.enManual,
    ...(photo.image && {
      photoPublicId: photo.image.publicId,
      photoUrl: photo.image.url,
      photoWidth: photo.image.width,
      photoHeight: photo.image.height,
    }),
  };
  await db.aboutProfile.upsert({ where: { id: "about" }, create: { id: "about", ...data }, update: data });
  if (photo.image) await deleteOldImage(stored?.photoPublicId);

  revalidateSite();
  return savedMessage(english.warning);
}

export async function removeAboutPhoto(): Promise<ActionResult> {
  await adminOrThrow();
  const stored = await db.aboutProfile.findUnique({ where: { id: "about" }, select: { photoPublicId: true } });
  if (!stored?.photoPublicId) return { ok: true };
  if (!isCloudinaryConfigured()) return { ok: false, message: "Faltan las credenciales de Cloudinary." };

  await db.aboutProfile.update({
    where: { id: "about" },
    data: { photoPublicId: null, photoUrl: null, photoWidth: null, photoHeight: null },
  });
  await deleteOldImage(stored.photoPublicId);
  revalidateSite();
  return { ok: true, message: "Foto quitada." };
}

// ── Cifras ───────────────────────────────────────────────────────────────────

const statSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Escribí el número.")
    .transform((value) => Number(value.replace(/[.,\s]/g, "")))
    .pipe(z.number({ error: "Número inválido." }).int("Debe ser un número entero.").min(0, "Mínimo 0.").max(2_000_000_000, "Número demasiado grande.")),
  suffix: text(3),
  network: z.enum(["", "INSTAGRAM", "FACEBOOK", "TIKTOK"]).transform((value) => value || null),
  labelEs: required(60, "Escribí qué mide la cifra."),
  labelEn: text(60),
  featured: checkbox,
});

/** Crea (id null) o actualiza una cifra. */
export async function saveStat(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminOrThrow();
  const parsed = parseForm(statSchema, statSchema.keyof().options, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors);
  const input = parsed.data;

  const stored = id ? await db.socialStat.findUnique({ where: { id } }) : null;
  if (id && !stored) return { status: "error", message: "La cifra ya no existe." };

  const english = await resolveEnglish(
    admin.id,
    [input.labelEs],
    [input.labelEn],
    stored && { es: [stored.labelEs], en: [stored.labelEn ?? ""], enManual: stored.enManual },
  );
  const data = {
    value: input.value,
    suffix: input.suffix || null,
    network: input.network,
    labelEs: input.labelEs,
    labelEn: english.en[0],
    enManual: english.enManual,
    featured: input.featured,
  };

  if (stored) {
    await db.socialStat.update({ where: { id: stored.id }, data });
  } else {
    const last = await db.socialStat.aggregate({ _max: { position: true } });
    await db.socialStat.create({ data: { ...data, position: (last._max.position ?? -1) + 1 } });
  }
  revalidateSite();
  return { ...savedMessage(english.warning), message: stored ? "Cifra guardada." : "Cifra agregada." };
}

export async function toggleStatFeatured(id: string) {
  await adminOrThrow();
  const stat = await db.socialStat.findUnique({ where: { id }, select: { featured: true } });
  if (!stat) return;
  await db.socialStat.update({ where: { id }, data: { featured: !stat.featured } });
  revalidateSite();
}

export async function moveStat(id: string, direction: "up" | "down") {
  await adminOrThrow();
  const stats = await db.socialStat.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, position: true } });
  const changes = reorder(stats, id, direction);
  await db.$transaction(changes.map((change) => db.socialStat.update({ where: { id: change.id }, data: { position: change.position } })));
  revalidateSite();
}

export async function deleteStat(id: string): Promise<ActionResult> {
  await adminOrThrow();
  await db.socialStat.deleteMany({ where: { id } });
  revalidateSite();
  return { ok: true };
}

// ── Aliados ──────────────────────────────────────────────────────────────────

const partnerSchema = z.object({
  name: required(80, "Escribí el nombre."),
  url: externalUrl,
  descEs: text(200),
  descEn: text(200),
  active: checkbox,
  logoPublicId: text(300),
});

/** Crea (id null) o actualiza un aliado. El logo ya lo subió el navegador a Cloudinary. */
export async function savePartner(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminOrThrow();
  const parsed = parseForm(partnerSchema, partnerSchema.keyof().options, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors);
  const input = parsed.data;

  const stored = id ? await db.partner.findUnique({ where: { id } }) : null;
  if (id && !stored) return { status: "error", message: "El aliado ya no existe." };
  if (!stored && !input.logoPublicId) return invalid({ logo: ["Subí el logo."] });

  const logo = await newImage(admin.id, input.logoPublicId, stored?.logoPublicId, "partner");
  if (!logo.ok) return { status: "error", message: logo.message };

  const english = await resolveEnglish(
    admin.id,
    [input.descEs],
    [input.descEn],
    stored && { es: [stored.descEs ?? ""], en: [stored.descEn ?? ""], enManual: stored.enManual },
  );
  const data = {
    name: input.name,
    url: input.url,
    descEs: input.descEs || null,
    descEn: english.en[0],
    enManual: english.enManual,
    active: input.active,
  };
  const logoData = logo.image && {
    logoPublicId: logo.image.publicId,
    logoUrl: logo.image.url,
    logoWidth: logo.image.width,
    logoHeight: logo.image.height,
  };

  if (stored) {
    await db.partner.update({ where: { id: stored.id }, data: { ...data, ...logoData } });
    if (logoData) await deleteOldImage(stored.logoPublicId);
  } else if (logoData) {
    const last = await db.partner.aggregate({ _max: { position: true } });
    await db.partner.create({ data: { ...data, ...logoData, position: (last._max.position ?? -1) + 1 } });
  }
  revalidateSite();
  return { ...savedMessage(english.warning), message: stored ? "Aliado guardado." : "Aliado agregado." };
}

export async function togglePartnerActive(id: string) {
  await adminOrThrow();
  const partner = await db.partner.findUnique({ where: { id }, select: { active: true } });
  if (!partner) return;
  await db.partner.update({ where: { id }, data: { active: !partner.active } });
  revalidateSite();
}

export async function movePartner(id: string, direction: "up" | "down") {
  await adminOrThrow();
  const partners = await db.partner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, position: true } });
  const changes = reorder(partners, id, direction);
  await db.$transaction(changes.map((change) => db.partner.update({ where: { id: change.id }, data: { position: change.position } })));
  revalidateSite();
}

/** Borra el aliado y su logo en Cloudinary. */
export async function deletePartner(id: string): Promise<ActionResult> {
  await adminOrThrow();
  const partner = await db.partner.findUnique({ where: { id }, select: { logoPublicId: true } });
  if (!partner) return { ok: true };
  if (!isCloudinaryConfigured()) return { ok: false, message: "Faltan las credenciales de Cloudinary para borrar el logo." };

  await db.partner.delete({ where: { id } });
  await deleteOldImage(partner.logoPublicId);
  revalidateSite();
  return { ok: true };
}
