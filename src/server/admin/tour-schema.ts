import "server-only";
import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const required = (max: number, message: string) => text(max).min(1, message);
const optionalText = (max: number) => text(max).transform((value) => value || null);

/** Un elemento por línea (textarea) → arreglo sin líneas vacías. */
const lines = z
  .string()
  .transform((value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(200, "Cada línea admite 200 caracteres.")).max(30, "Máximo 30 líneas."));

function optionalNumber(min: number, max: number, { integer = false } = {}) {
  const number = z.number({ error: "Número inválido." }).min(min, `Mínimo ${min}.`).max(max, `Máximo ${max}.`);
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value.replace(",", "."))))
    .pipe((integer ? number.int("Debe ser un número entero.") : number).nullable());
}

/** Contenido que se escribe por idioma (español original o inglés editado a mano). */
export const translationSchema = z.object({
  title: required(120, "El título es obligatorio."),
  slug: text(90).refine((value) => value === "" || SLUG_PATTERN.test(value), "Solo minúsculas, números y guiones."),
  summary: required(300, "El resumen es obligatorio."),
  description: required(20_000, "La descripción es obligatoria."),
  itinerary: optionalText(20_000),
  includes: lines,
  excludes: lines,
  whatToBring: lines,
  meetingPoint: optionalText(300),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

/** Datos del tour que no dependen del idioma. */
export const tourDataSchema = z
  .object({
    durationHours: optionalNumber(0, 240, { integer: true }),
    durationMins: optionalNumber(0, 59, { integer: true }),
    difficulty: z.enum(["", "EASY", "MODERATE", "CHALLENGING"]).transform((value) => value || null),
    location: optionalText(120),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
  })
  .refine((data) => (data.latitude === null) === (data.longitude === null), {
    message: "Completá latitud y longitud, o dejá ambas vacías.",
    path: ["longitude"],
  })
  .transform(({ durationHours, durationMins, ...data }) => ({
    ...data,
    durationMinutes: durationHours || durationMins ? (durationHours ?? 0) * 60 + (durationMins ?? 0) : null,
  }));

export type TranslationInput = z.infer<typeof translationSchema>;

export type FieldErrors = Record<string, string[] | undefined>;

/** Lee del FormData solo las claves del esquema; las ausentes llegan como "" (checkbox, campos opcionales). */
export function parseForm<T extends z.ZodType>(schema: T, keys: readonly string[], formData: FormData) {
  const raw = Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
  const result = schema.safeParse(raw);
  return result.success
    ? ({ success: true, data: result.data as z.infer<T> } as const)
    : ({ success: false, fieldErrors: z.flattenError(result.error).fieldErrors as FieldErrors } as const);
}

export const translationKeys = translationSchema.keyof().options;
export const tourDataKeys = ["durationHours", "durationMins", "difficulty", "location", "latitude", "longitude"] as const;
