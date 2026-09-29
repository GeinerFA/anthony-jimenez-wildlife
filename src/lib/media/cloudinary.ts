import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryEnv } from "@/lib/env";

export type MediaKind = "IMAGE" | "VIDEO";
export type ResourceType = "image" | "video";

export const resourceTypeOf = (type: MediaKind): ResourceType => (type === "IMAGE" ? "image" : "video");

function configured() {
  const env = cloudinaryEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return env;
}

/**
 * Firma los parámetros de una subida directa desde el navegador. El secreto nunca sale del
 * servidor; Cloudinary rechaza la subida si el navegador cambia algún parámetro firmado.
 */
export function signUpload(type: MediaKind, params: Record<string, string>) {
  const env = configured();
  const signed = { ...params, timestamp: String(Math.round(Date.now() / 1000)) };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceTypeOf(type)}/upload`,
    params: { ...signed, api_key: env.CLOUDINARY_API_KEY },
    signature: cloudinary.utils.api_sign_request(signed, env.CLOUDINARY_API_SECRET),
  };
}

export type UploadedResource = {
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  secure_url: string;
  duration?: number;
};

/** Datos del archivo según Cloudinary (no según el navegador), para validarlo antes de guardarlo. */
export async function getResource(publicId: string, type: MediaKind): Promise<UploadedResource | null> {
  configured();
  try {
    return (await cloudinary.api.resource(publicId, { resource_type: resourceTypeOf(type) })) as UploadedResource;
  } catch (error) {
    if ((error as { error?: { http_code?: number } })?.error?.http_code === 404) return null;
    throw error;
  }
}

export async function deleteAsset(publicId: string, type: MediaKind) {
  configured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceTypeOf(type), invalidate: true });
}

export async function deleteAssets(items: { publicId: string; type: MediaKind }[]) {
  if (items.length === 0) return;
  configured();
  for (const type of ["IMAGE", "VIDEO"] as const) {
    const ids = items.filter((item) => item.type === type).map((item) => item.publicId);
    // La API de administración borra hasta 100 recursos por llamada.
    for (let i = 0; i < ids.length; i += 100) {
      await cloudinary.api.delete_resources(ids.slice(i, i + 100), { resource_type: resourceTypeOf(type), invalidate: true });
    }
  }
}
