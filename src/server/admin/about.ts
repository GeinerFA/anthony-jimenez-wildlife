import "server-only";
import { aboutMediaFolder, type AboutAsset } from "@/config/media";
import { db } from "@/lib/db";
import { getTranslator, translateTexts } from "@/lib/translation";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";
import { verifyUploadedResource } from "./media";

/** Textos de un registro de "Acerca de mí" tal como están guardados ("" = vacío). */
type StoredTexts = { es: string[]; en: string[]; enManual: boolean };

export type EnglishResult = { en: (string | null)[]; enManual: boolean; warning?: string };

const sameTexts = (a: string[], b: string[]) => a.length === b.length && a.every((text, i) => text === b[i]);

/**
 * Decide el inglés de un registro al guardar (biografía, cifra o aliado), con la misma regla que los tours:
 * - Si se escribió o corrigió el inglés en el formulario, se guarda tal cual y queda como "editado a mano".
 * - Si no se tocó y el español no cambió, se conserva.
 * - Si el español cambió (o se vació el inglés), se traduce con la API, salvo que el inglés esté
 *   editado a mano: entonces se conserva y se avisa para revisarlo.
 * El sitio muestra el español cuando falta el inglés, así que un fallo de la API no rompe nada.
 */
export async function resolveEnglish(adminId: string, es: string[], submittedEn: string[], stored: StoredTexts | null): Promise<EnglishResult> {
  const keep = (warning?: string): EnglishResult => ({
    en: (stored?.en ?? es.map(() => "")).map((text) => text || null),
    enManual: stored?.enManual ?? false,
    warning,
  });

  const touched = stored ? !sameTexts(submittedEn, stored.en) : submittedEn.some(Boolean);
  const cleared = touched && !submittedEn.some(Boolean);
  if (touched && !cleared) return { en: submittedEn.map((text) => text || null), enManual: true };

  if (!cleared && stored && sameTexts(es, stored.es)) return keep();
  if (!cleared && stored?.enManual) return keep("Cambiaste el español, pero el inglés fue editado a mano y no se tocó: revisalo.");

  const translator = getTranslator();
  if (!translator) {
    return cleared
      ? { en: es.map(() => null), enManual: false, warning: "No hay traducción automática configurada (DEEPL_API_KEY): el sitio en inglés muestra el español." }
      : keep("No hay traducción automática configurada (DEEPL_API_KEY): escribí el inglés a mano.");
  }

  const limit = rateLimit(`translate:${adminId}`, rateLimits.translate);
  if (!limit.ok) return keep(`Se guardó sin traducir al inglés. ${rateLimitMessage(limit.retryAfterSec)}`);

  try {
    const out = await translateTexts(translator, es, "es", "en");
    return { en: out.map((text) => text || null), enManual: false };
  } catch (error) {
    console.error("Error al traducir Acerca de mí", error);
    return keep("Se guardó, pero la traducción al inglés falló. Probá guardar de nuevo más tarde.");
  }
}

/**
 * Comprueba una imagen recién subida a Cloudinary para "Acerca de mí": que esté en su carpeta
 * y que cumpla formato y tamaño (si no, verifyUploadedResource la borra).
 */
export async function verifyAboutImage(publicId: string, asset: AboutAsset) {
  if (!publicId.startsWith(`${aboutMediaFolder(asset)}/`)) return { ok: false as const, message: "La imagen no pertenece a esta sección." };
  const verified = await verifyUploadedResource(publicId, "IMAGE");
  if (!verified.ok) return verified;
  const { resource } = verified;
  return { ok: true as const, image: { publicId, url: resource.secure_url, width: resource.width ?? 0, height: resource.height ?? 0 } };
}

/** Todo lo de "Acerca de mí" para el panel. */
export async function getAboutForAdmin() {
  const [profile, stats, partners] = await Promise.all([
    db.aboutProfile.findUnique({ where: { id: "about" } }),
    db.socialStat.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    db.partner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
  ]);
  return { profile, stats, partners };
}
