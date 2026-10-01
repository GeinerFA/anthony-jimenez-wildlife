import "server-only";
import { mediaRules, type UploadMediaType } from "@/config/media";
import { deleteAsset, getResource, type UploadedResource } from "@/lib/media/cloudinary";

/**
 * Lee de Cloudinary (no del navegador) un archivo recién subido y comprueba formato y tamaño.
 * Si no cumple las reglas, lo borra de Cloudinary.
 */
export async function verifyUploadedResource(
  publicId: string,
  type: UploadMediaType,
): Promise<{ ok: true; resource: UploadedResource } | { ok: false; message: string }> {
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
  return { ok: true, resource };
}
