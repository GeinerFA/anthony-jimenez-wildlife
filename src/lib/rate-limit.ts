import "server-only";

/**
 * Límite de solicitudes con ventana fija, en memoria. Solo para el panel (admins ya autenticados):
 * con varias instancias serverless cada una lleva su propia cuenta, así que no sirve para tráfico
 * público. El formulario público usa los límites de @/server/request-limits, sobre la base de datos.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const rateLimits = {
  /** Firmas de subida y registro de archivos en Cloudinary. */
  upload: { limit: 120, windowMs: 10 * 60_000 },
  /** Llamadas a la API de traducción (consumen cuota de DeepL). */
  translate: { limit: 30, windowMs: 10 * 60_000 },
} as const;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > 1000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  bucket.count++;
  return { ok: true };
}

export function rateLimitMessage(retryAfterSec: number) {
  const minutes = Math.ceil(retryAfterSec / 60);
  return `Demasiadas solicitudes seguidas. Intentá de nuevo en ${minutes} min.`;
}
