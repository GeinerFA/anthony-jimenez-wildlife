/**
 * Crea (o reemplaza) un tour de demostración con las fotos y videos de una carpeta local,
 * subiéndolos a Cloudinary. Solo para previsualizar el diseño mientras no existe el panel admin.
 *
 *   npm run demo:tour                   (usa la carpeta demo-media/ del proyecto)
 *   npm run demo:tour -- /ruta/a/carpeta
 *   npm run demo:tour -- --remove        (borra el tour demo y sus archivos en Cloudinary)
 *
 * Los archivos se ordenan por nombre: el primero es la portada (y el fondo del inicio).
 * Tip: nombrarlos 01-..., 02-... para controlar el orden.
 */
import "dotenv/config";
import { readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_ID = "demo-tour";
const FOLDER = "natural-land-cr/demo";
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".m4v"]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function removeDemo() {
  const media = await db.media.findMany({ where: { tourId: DEMO_ID }, select: { publicId: true, type: true } });
  for (const type of ["IMAGE", "VIDEO"] as const) {
    const ids = media.filter((m) => m.type === type).map((m) => m.publicId);
    if (ids.length) await cloudinary.api.delete_resources(ids, { resource_type: type === "IMAGE" ? "image" : "video" });
  }
  await db.tour.deleteMany({ where: { id: DEMO_ID } });
  if (media.length) console.log(`Tour demo anterior eliminado (${media.length} archivos borrados de Cloudinary).`);
}

function uploadVideo(path: string) {
  // Subida por partes: necesaria para videos grandes (4K).
  return new Promise<UploadApiResponse>((ok, fail) => {
    cloudinary.uploader.upload_large(
      path,
      { resource_type: "video", folder: FOLDER, chunk_size: 20_000_000 },
      (error, result) => (error || !result ? fail(error ?? new Error("Subida sin respuesta")) : ok(result)),
    );
  });
}

async function main() {
  const args = process.argv.slice(2);
  await removeDemo();
  if (args[0] === "--remove") return;

  const dir = resolve(args[0] ?? "demo-media");
  const files = (await readdir(dir))
    .filter((name) => IMAGE_EXT.has(extname(name).toLowerCase()) || VIDEO_EXT.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (files.length === 0) throw new Error(`No hay imágenes ni videos en ${dir}`);

  const uploaded: { type: "IMAGE" | "VIDEO"; result: UploadApiResponse }[] = [];
  for (const [index, name] of files.entries()) {
    const path = join(dir, name);
    const isVideo = VIDEO_EXT.has(extname(name).toLowerCase());
    const sizeMb = ((await stat(path)).size / 1_048_576).toFixed(1);
    process.stdout.write(`[${index + 1}/${files.length}] ${name} (${sizeMb} MB)... `);
    const result = isVideo
      ? await uploadVideo(path)
      : await cloudinary.uploader.upload(path, { resource_type: "image", folder: FOLDER });
    uploaded.push({ type: isVideo ? "VIDEO" : "IMAGE", result });
    console.log(`ok ${result.width}x${result.height}`);
  }

  await db.tour.create({
    data: {
      id: DEMO_ID,
      status: "PUBLISHED",
      featured: true,
      position: -1,
      durationMinutes: 300,
      difficulty: "MODERATE",
      location: "La Fortuna, Alajuela",
      publishedAt: new Date(),
      translations: {
        create: [
          {
            locale: "es",
            slug: "tour-demo-volcan-arenal",
            title: "Volcán Arenal y Río Celeste",
            summary: "Caminata entre coladas de lava, bosque lluvioso y aguas turquesa. (Tour de demostración)",
            description:
              "Un día completo en el corazón volcánico de Costa Rica, caminando sobre antiguas coladas de lava cubiertas de selva.\n\nNuestros guías te muestran perezosos, tucanes y ranas de ojos rojos mientras cuentan la historia de la erupción de 1968.\n\nCerramos el día en aguas termales naturales, con el volcán de fondo.",
            itinerary:
              "7:00 a. m. — Salida desde La Fortuna.\n\n8:00 a. m. — Caminata por el Parque Nacional Volcán Arenal.\n\n12:30 p. m. — Almuerzo típico en finca local.\n\n3:00 p. m. — Aguas termales y regreso.",
            includes: ["Guía bilingüe certificado", "Transporte desde La Fortuna", "Entradas al parque"],
            excludes: ["Almuerzo", "Propinas"],
            whatToBring: ["Zapatos cerrados", "Repelente", "Capa para lluvia", "Traje de baño"],
            meetingPoint: "Parque central de La Fortuna, frente a la iglesia.",
            source: "ORIGINAL",
          },
          {
            locale: "en",
            slug: "demo-tour-arenal-volcano",
            title: "Arenal Volcano & Celeste River",
            summary: "Hike across lava flows, rainforest and turquoise waters. (Demo tour)",
            description:
              "A full day in Costa Rica's volcanic heartland, hiking over old lava flows now covered by jungle.\n\nOur guides spot sloths, toucans and red-eyed tree frogs while telling the story of the 1968 eruption.\n\nWe end the day in natural hot springs with the volcano in the background.",
            itinerary:
              "7:00 a.m. — Departure from La Fortuna.\n\n8:00 a.m. — Hike in Arenal Volcano National Park.\n\n12:30 p.m. — Traditional lunch at a local farm.\n\n3:00 p.m. — Hot springs and return.",
            includes: ["Certified bilingual guide", "Transport from La Fortuna", "Park entrance fees"],
            excludes: ["Lunch", "Tips"],
            whatToBring: ["Closed shoes", "Insect repellent", "Rain jacket", "Swimsuit"],
            meetingPoint: "La Fortuna central park, in front of the church.",
            source: "MACHINE",
          },
        ],
      },
      media: {
        create: uploaded.map(({ type, result }, position) => ({
          type,
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          durationSec: type === "VIDEO" ? (result.duration as number | undefined) : undefined,
          position,
        })),
      },
    },
  });

  console.log(`\nTour demo creado con ${uploaded.length} archivos.`);
  console.log("Ver: http://localhost:3000/es y http://localhost:3000/es/tours/tour-demo-volcan-arenal");
}

main()
  .catch((error) => {
    console.error("\nError:", error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
