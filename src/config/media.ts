/**
 * Reglas de subida de medios, compartidas por el navegador (validación previa) y el servidor
 * (firma y verificación del archivo ya subido). Cloudinary aplica además los límites de su plan
 * (en el plan gratuito: 10 MB por imagen y 100 MB por video).
 */
const MB = 1024 * 1024;

export const mediaRules = {
  IMAGE: { formats: ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"], maxBytes: 20 * MB, maxLabel: "20 MB" },
  VIDEO: { formats: ["mp4", "mov", "webm", "m4v"], maxBytes: 500 * MB, maxLabel: "500 MB" },
} as const;

export type UploadMediaType = keyof typeof mediaRules;

/** Los videos grandes se suben por partes; Cloudinary exige partes de al menos 5 MB. */
export const UPLOAD_CHUNK_BYTES = 20 * MB;

export const acceptedFileTypes = [...mediaRules.IMAGE.formats, ...mediaRules.VIDEO.formats].map((f) => `.${f}`).join(",");

export function mediaTypeForFile(fileName: string): UploadMediaType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if ((mediaRules.IMAGE.formats as readonly string[]).includes(ext)) return "IMAGE";
  if ((mediaRules.VIDEO.formats as readonly string[]).includes(ext)) return "VIDEO";
  return null;
}

/** Carpeta de Cloudinary por tour: permite verificar que un public_id pertenece al tour. */
export function tourMediaFolder(tourId: string) {
  return `natural-land-cr/tours/${tourId}`;
}

export function formatBytes(bytes: number) {
  return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
