/**
 * Genera src/config/countries.ts (código ISO + prefijo telefónico) y copia las banderas SVG a public/flags.
 * Solo hace falta volver a correrlo si se actualizan libphonenumber-js o country-flag-icons:
 *   npx tsx scripts/gen-countries.ts
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/min";

const flagsSource = join("node_modules", "country-flag-icons", "3x2");
const flagsTarget = join("public", "flags");
mkdirSync(flagsTarget, { recursive: true });

const countries: [string, string][] = [];
const missing: string[] = [];
for (const code of getCountries()) {
  const flag = join(flagsSource, `${code}.svg`);
  if (!existsSync(flag)) {
    missing.push(code);
    continue;
  }
  copyFileSync(flag, join(flagsTarget, `${code}.svg`));
  countries.push([code, getCountryCallingCode(code)]);
}

const body = countries.map(([code, dial]) => `  ["${code}", "${dial}"],`).join("\n");
writeFileSync(
  join("src", "config", "countries.ts"),
  `// Generado por scripts/gen-countries.ts: no editar a mano.
/** [código ISO 3166-1 alfa-2, prefijo telefónico sin "+"]. Las banderas están en /flags/{código}.svg. */
export const countries: readonly (readonly [code: string, dial: string])[] = [
${body}
];

export const countryCodes = new Set(countries.map(([code]) => code));
`,
);

console.log(`${countries.length} países generados.${missing.length ? ` Sin bandera (omitidos): ${missing.join(", ")}` : ""}`);
