import type { Locale } from "@/i18n/routing";

/** Contrato de un proveedor de traducción. Para cambiar de DeepL a otro, implementar esto y registrarlo en index.ts. */
export interface Translator {
  readonly name: string;
  /** Traduce cada texto; devuelve un arreglo del mismo largo y en el mismo orden. */
  translate(texts: string[], from: Locale, to: Locale): Promise<string[]>;
}

/** Error con mensaje apto para mostrar en el panel. */
export class TranslationError extends Error {}
