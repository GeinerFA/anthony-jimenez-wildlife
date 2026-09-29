import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/auth/auth";
import { mediaRules, tourMediaFolder } from "@/config/media";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/env";
import { signUpload } from "@/lib/media/cloudinary";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";

const bodySchema = z.object({
  tourId: z.string().min(1).max(40),
  type: z.enum(["IMAGE", "VIDEO"]),
});

/**
 * Firma una subida directa del navegador a Cloudinary (el archivo no pasa por este servidor).
 * La firma fija la carpeta del tour y los formatos permitidos.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const { tourId, type } = body.data;

  const limit = rateLimit(`upload:${admin.id}`, rateLimits.upload);
  if (!limit.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(limit.retryAfterSec) },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary no está configurado en el servidor." }, { status: 503 });
  }
  if (!(await db.tour.findUnique({ where: { id: tourId }, select: { id: true } }))) {
    return NextResponse.json({ error: "El tour no existe." }, { status: 404 });
  }

  return NextResponse.json(
    signUpload(type, { folder: tourMediaFolder(tourId), allowed_formats: mediaRules[type].formats.join(",") }),
  );
}
