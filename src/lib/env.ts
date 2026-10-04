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

const mailSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  /** Remitente visible. Debe ser el mismo buzón de SMTP_USER (o un alias autorizado). */
  MAIL_FROM: z.string().min(1).default("Natural Land CR <info@naturallandcr.com>"),
  /** A quién llega el aviso de cada solicitud nueva. */
  MAIL_NOTIFY_TO: z.string().min(1).default("info@naturallandcr.com"),
});

/** Correo saliente (SMTP del buzón info@). Sin configurar, las solicitudes se guardan igual y se ven en el panel. */
export function mailEnv() {
  return parse(mailSchema);
}

export function isMailConfigured() {
  return mailSchema.safeParse(process.env).success;
}

const recaptchaSchema = z.object({
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(1),
  RECAPTCHA_SECRET_KEY: z.string().min(1),
  /** Puntaje mínimo de reCAPTCHA v3 para aceptar un envío (0 = bot, 1 = humano). */
  RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),
});

export function recaptchaEnv() {
  return parse(recaptchaSchema);
}

export function isRecaptchaConfigured() {
  return recaptchaSchema.safeParse(process.env).success;
}
