import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/auth/auth";
import { aboutAssets, aboutMediaFolder, heroMediaFolder, heroPages, mediaRules, tourMediaFolder } from "@/config/media";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/env";
import { signUpload } from "@/lib/media/cloudinary";
import { rateLimit, rateLimitMessage, rateLimits } from "@/lib/rate-limit";

const type = z.enum(["IMAGE", "VIDEO"]);
/** Destino de la subida: la galería de un tour, el hero de una página pública o una imagen de "Acerca de mí". */
const bodySchema = z.union([
  z.object({ tourId: z.string().min(1).max(40), type }),
  z.object({ heroPage: z.enum(heroPages), type }),
  z.object({ aboutAsset: z.enum(aboutAssets), type: z.literal("IMAGE") }),
]);

/**
 * Firma una subida directa del navegador a Cloudinary (el archivo no pasa por este servidor).
 * La firma fija la carpeta (del tour o del hero) y los formatos permitidos.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const { type } = body.data;

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

  let folder: string;
  if ("tourId" in body.data) {
    if (!(await db.tour.findUnique({ where: { id: body.data.tourId }, select: { id: true } }))) {
      return NextResponse.json({ error: "El tour no existe." }, { status: 404 });
    }
    folder = tourMediaFolder(body.data.tourId);
  } else if ("heroPage" in body.data) {
    folder = heroMediaFolder(body.data.heroPage);
  } else {
    folder = aboutMediaFolder(body.data.aboutAsset);
  }

  return NextResponse.json(signUpload(type, { folder, allowed_formats: mediaRules[type].formats.join(",") }));
}
