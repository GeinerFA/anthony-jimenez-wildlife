import "server-only";
import type { Locale } from "@/i18n/routing";
import { TranslationError, type Translator } from "./types";

const SOURCE_LANG: Record<Locale, string> = { es: "ES", en: "EN" };
const TARGET_LANG: Record<Locale, string> = { es: "ES", en: "EN-US" };

/** DeepL acepta hasta 50 textos por solicitud. */
const BATCH_SIZE = 50;

const statusMessages: Record<number, string> = {
  403: "La clave de DeepL (DEEPL_API_KEY) es inválida.",
  429: "DeepL recibió demasiadas solicitudes. Intentá de nuevo en un momento.",
  456: "Se agotó la cuota mensual de DeepL.",
};

export function createDeepLTranslator(apiKey: string): Translator {
  // Las claves del plan gratuito terminan en ":fx" y usan otro dominio.
  const endpoint = apiKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";

  async function translateBatch(texts: string[], from: Locale, to: Locale) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: texts,
          source_lang: SOURCE_LANG[from],
          target_lang: TARGET_LANG[to],
          preserve_formatting: true,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new TranslationError("No se pudo conectar con DeepL.");
    }

    if (!response.ok) {
      throw new TranslationError(statusMessages[response.status] ?? `DeepL respondió con un error (${response.status}).`);
    }
    const data = (await response.json()) as { translations: { text: string }[] };
    return data.translations.map((t) => t.text);
  }

  return {
    name: "DeepL",
    async translate(texts, from, to) {
      const results: string[] = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        results.push(...(await translateBatch(texts.slice(i, i + BATCH_SIZE), from, to)));
      }
      return results;
    },
  };
}
