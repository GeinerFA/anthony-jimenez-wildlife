/**
 * Transformaciones de Cloudinary sobre URLs ya guardadas (sin credenciales; seguro en el cliente).
 * Ej: https://res.cloudinary.com/demo/image/upload/v1/x.jpg → .../image/upload/f_auto,q_auto,w_800/v1/x.jpg
 */
export function withTransform(url: string, transform: string) {
  return url.replace("/upload/", `/upload/${transform}/`);
}

/** Fotograma de un video como imagen (portada / poster). */
export function videoPoster(url: string, width = 1600) {
  return withTransform(url, `so_0,f_jpg,q_auto,w_${width}`).replace(/\.[a-z0-9]+$/i, ".jpg");
}

/** Versión web de un video: códec y calidad automáticos, ancho limitado (los originales 4K pesan mucho). */
export function videoStream(url: string, width = 1920) {
  return withTransform(url, `f_auto:video,q_auto,w_${width},c_limit`);
}
