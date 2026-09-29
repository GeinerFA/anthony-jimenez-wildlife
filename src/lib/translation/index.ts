import "server-only";
import type { Locale } from "@/i18n/routing";
import { createDeepLTranslator } from "./deepl";
import type { Translator } from "./types";

export { TranslationError, type Translator } from "./types";

/** Proveedor según TRANSLATION_PROVIDER, o null si no hay uno configurado. */
export function getTranslator(): Translator | null {
  const provider = (process.env.TRANSLATION_PROVIDER || "deepl").toLowerCase();
  if (provider === "deepl") {
    const apiKey = process.env.DEEPL_API_KEY;
    return apiKey ? createDeepLTranslator(apiKey) : null;
  }
  return null;
}

/** Traduce saltándose los textos vacíos (no gastan cuota y algunos proveedores los rechazan). */
export async function translateTexts(translator: Translator, texts: string[], from: Locale, to: Locale) {
  const pending = texts.map((text, index) => ({ text: text.trim(), index })).filter((item) => item.text);
  const translated = pending.length ? await translator.translate(pending.map((item) => item.text), from, to) : [];

  const result = texts.map(() => "");
  pending.forEach((item, i) => {
    result[item.index] = translated[i] ?? "";
  });
  return result;
}
