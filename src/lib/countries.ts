import { countries } from "@/config/countries";

export type CountryOption = { code: string; dial: string; name: string };

const dialByCode = new Map(countries.map(([code, dial]) => [code, dial]));

/** Nombre del país en el idioma pedido ("CR" → "Costa Rica"), con los datos del navegador / Node (Intl). */
export function countryName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function dialCode(code: string) {
  return dialByCode.get(code) ?? null;
}

/** Todos los países con prefijo y nombre traducido, ordenados alfabéticamente en ese idioma. */
export function countryOptions(locale: string): CountryOption[] {
  return countries
    .map(([code, dial]) => ({ code, dial, name: countryName(code, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export const flagSrc = (code: string) => `/flags/${code}.svg`;
