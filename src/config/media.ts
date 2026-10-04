/**
 * Reglas de subida de medios, compartidas por el navegador (validación previa) y el servidor
 * (firma y verificación del archivo ya subido). Los máximos son los del plan gratuito de Cloudinary
 * (10 MB por imagen, 100 MB por video): con un límite mayor, Cloudinary rechaza la subida con un
 * mensaje en inglés. Si se cambia de plan, subirlos aquí.
 */
const MB = 1024 * 1024;

export const mediaRules = {
  IMAGE: { formats: ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"], maxBytes: 10 * MB, maxLabel: "10 MB" },
  VIDEO: { formats: ["mp4", "mov", "webm", "m4v"], maxBytes: 100 * MB, maxLabel: "100 MB" },
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

/** Páginas públicas con hero configurable (enum HeroPage de Prisma), en el orden del panel. */
export const heroPages = ["HOME", "TOURS", "SERVICES", "PLAN_TRIP", "CONTACT"] as const;
export type HeroPageKey = (typeof heroPages)[number];

/** Carpeta de Cloudinary por hero, aparte de la de los tours. */
export function heroMediaFolder(page: HeroPageKey) {
  return `natural-land-cr/heroes/${page.toLowerCase()}`;
}

export function formatBytes(bytes: number) {
  return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
