import "server-only";
import { RECAPTCHA_ACTION } from "@/config/recaptcha";
import { isRecaptchaConfigured, recaptchaEnv } from "@/lib/env";

export type RecaptchaResult =
  | { ok: true; score: number | null }
  /** `detail`: explicación técnica para la terminal (y para el formulario solo en desarrollo). */
  | { ok: false; reason: "missing-token" | "invalid" | "low-score" | "unavailable"; detail: string };

function reject(reason: Exclude<RecaptchaResult, { ok: true }>["reason"], detail: string): RecaptchaResult {
  console.warn(`reCAPTCHA rechazó el envío: ${detail}`);
  return { ok: false, reason, detail };
}

/**
 * Verifica un token de reCAPTCHA v3. Sin claves configuradas deja pasar (score null):
 * el formulario sigue protegido por el límite de envíos y el campo trampa.
 */
export async function verifyRecaptcha(token: string | null, ip: string | null): Promise<RecaptchaResult> {
  if (!isRecaptchaConfigured()) return { ok: true, score: null };
  if (!token) return reject("missing-token", "el formulario llegó sin token de reCAPTCHA.");

  const { RECAPTCHA_SECRET_KEY, RECAPTCHA_MIN_SCORE } = recaptchaEnv();
  const body = new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token, ...(ip ? { remoteip: ip } : {}) });

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const result = (await response.json()) as { success: boolean; score?: number; action?: string; hostname?: string; "error-codes"?: string[] };

    if (!result.success) return reject("invalid", `Google respondió error ${JSON.stringify(result["error-codes"] ?? [])}.`);
    if (result.action !== RECAPTCHA_ACTION) {
      return reject("invalid", `acción "${result.action ?? "(ninguna)"}" en lugar de "${RECAPTCHA_ACTION}" (¿claves de v2?).`);
    }
    const score = result.score ?? 0;
    if (score < RECAPTCHA_MIN_SCORE) {
      return reject("low-score", `puntaje ${score} menor al mínimo ${RECAPTCHA_MIN_SCORE} (RECAPTCHA_MIN_SCORE), dominio ${result.hostname}.`);
    }
    return { ok: true, score };
  } catch (error) {
    console.error("No se pudo verificar reCAPTCHA", error);
    return { ok: false, reason: "unavailable", detail: `no se pudo contactar a Google (${error instanceof Error ? error.message : String(error)}).` };
  }
}
