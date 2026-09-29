import { UPLOAD_CHUNK_BYTES } from "@/config/media";

/** Respuesta de /api/admin/media/sign. */
export type SignedUpload = { uploadUrl: string; params: Record<string, string>; signature: string };

export type CloudinaryUploadResult = { public_id: string; resource_type: string; format: string; bytes: number };

/**
 * Sube un archivo directo del navegador a Cloudinary con parámetros firmados por el servidor.
 * Los archivos grandes se envían por partes (mismo X-Unique-Upload-Id, un Content-Range por parte);
 * Cloudinary devuelve el resultado completo en la última.
 */
export async function uploadToCloudinary(file: File, signed: SignedUpload, onProgress: (fraction: number) => void) {
  const total = file.size;
  const chunked = total > UPLOAD_CHUNK_BYTES;
  const uploadId = crypto.randomUUID();
  let result: CloudinaryUploadResult | null = null;

  for (let start = 0; start < total; start = chunked ? start + UPLOAD_CHUNK_BYTES : total) {
    const end = chunked ? Math.min(start + UPLOAD_CHUNK_BYTES, total) : total;
    const body = new FormData();
    for (const [key, value] of Object.entries(signed.params)) body.append(key, value);
    body.append("signature", signed.signature);
    body.append("file", chunked ? file.slice(start, end) : file, file.name);

    const headers: Record<string, string> = chunked
      ? { "X-Unique-Upload-Id": uploadId, "Content-Range": `bytes ${start}-${end - 1}/${total}` }
      : {};
    result = await post(signed.uploadUrl, body, headers, (loaded) => onProgress(Math.min(1, (start + loaded) / total)));
  }

  if (!result?.public_id) throw new Error("Cloudinary no devolvió el archivo subido.");
  return result;
}

function post(url: string, body: FormData, headers: Record<string, string>, onProgress: (loaded: number) => void) {
  // XMLHttpRequest (no fetch) para poder mostrar el progreso de la subida.
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () => {
      let data: (CloudinaryUploadResult & { error?: { message?: string } }) | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data) resolve(data);
      else reject(new Error(data?.error?.message ?? `Cloudinary respondió con un error (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Se perdió la conexión con Cloudinary."));
    xhr.send(body);
  });
}
