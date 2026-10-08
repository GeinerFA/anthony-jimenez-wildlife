import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Límites del formulario público, contados sobre las solicitudes guardadas en la base de datos:
 * a diferencia de un contador en memoria, valen para todas las instancias serverless de Vercel.
 */
const limits = {
  /** Envíos por IP: frena inundaciones desde una misma conexión. */
  perIp: { max: 5, windowMs: 30 * 60_000 },
  /** Envíos por correo: frena que se use la confirmación para escribirle una y otra vez a un tercero. */
  perEmail: { max: 3, windowMs: 24 * 60 * 60_000 },
} as const;

/** HMAC de la IP con AUTH_SECRET: permite comparar envíos de la misma IP sin guardar la IP en claro. */
export function hashIp(ip: string | null) {
  const secret = process.env.AUTH_SECRET;
  if (!ip || !secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex");
}

/** `true` si todavía se puede aceptar una solicitud de esta IP y este correo. */
export async function withinRequestLimits(ipHash: string | null, email: string) {
  const since = (windowMs: number) => ({ gte: new Date(Date.now() - windowMs) });

  const [byIp, byEmail] = await Promise.all([
    ipHash ? db.contactRequest.count({ where: { ipHash, createdAt: since(limits.perIp.windowMs) } }) : 0,
    db.contactRequest.count({
      where: { email: { equals: email, mode: "insensitive" }, createdAt: since(limits.perEmail.windowMs) },
    }),
  ]);
  return byIp < limits.perIp.max && byEmail < limits.perEmail.max;
}
