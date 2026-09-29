import "server-only";
import { z } from "zod";

const authSchema = z.object({
  AUTH_SECRET: z.string().min(32, "Generar con: npx auth secret"),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
});

function parse<T extends z.ZodType>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Variables de entorno inválidas o faltantes: ${keys}`);
  }
  return parsed.data;
}

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

/**
 * Valida en tiempo de ejecución (no en el build) que las credenciales de Auth.js existan,
 * para fallar con un mensaje claro en vez de un error genérico de OAuth.
 */
export function assertAuthEnv() {
  parse(authSchema);
}

export function cloudinaryEnv() {
  return parse(cloudinarySchema);
}

/** Para avisar en el panel en vez de fallar: sin Cloudinary no se pueden subir ni borrar medios. */
export function isCloudinaryConfigured() {
  return cloudinarySchema.safeParse(process.env).success;
}
