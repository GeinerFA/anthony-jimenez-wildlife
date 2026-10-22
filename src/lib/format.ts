/** "3 h", "45 min", "2 h 30 min" — formato corto válido en español e inglés. */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Duración ISO 8601 para JSON-LD (PT2H30M). */
export function isoDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `PT${hours ? `${hours}H` : ""}${rest ? `${rest}M` : ""}`;
}

/** "USD 1,500" (inglés) / "USD 1500" (español): el precio "a partir de" de la card. */
export function formatPrice(amount: number, locale: string) {
  return `USD ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)}`;
}

/**
 * Una tarifa de la sección "Precios": "Adultos: USD 500" → { label: "Adultos", value: "USD 500" }.
 * Sin ":" la línea entera es la etiqueta.
 */
export function splitPriceLine(line: string) {
  const index = line.lastIndexOf(":");
  if (index <= 0) return { label: line, value: null };
  return { label: line.slice(0, index).trim(), value: line.slice(index + 1).trim() || null };
}

/** Hora al inicio de un paso: "6:00 am", "6:30 a.m.", "14:00", "7 pm" (un número solo no cuenta). */
const stepTime = /^(\d{1,2}:\d{2}(?:\s*[ap]\.?\s?m\.?)?|\d{1,2}\s*[ap]\.?\s?m\.?)\s*(?:[-–—:|]\s*)?(.+)$/i;

/**
 * Itinerario como pasos, uno por línea: "6:00 am Salida del hotel" → { time: "6:00 am", text: "Salida del hotel" }.
 * Devuelve null si ninguna línea empieza con hora: entonces es texto corrido y se muestra en párrafos.
 */
export function itinerarySteps(text: string) {
  const steps = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = stepTime.exec(line);
      return match ? { time: match[1], text: capitalize(match[2].trim()) } : { time: null, text: line };
    });
  return steps.some((step) => step.time) ? steps : null;
}

/** Primera letra en mayúscula ("salida del hotel" → "Salida del hotel"). */
const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** Un párrafo por línea (sin líneas vacías): la descripción del tour se escribe así en el panel. */
export function lineParagraphs(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Separa texto plano en párrafos por líneas en blanco. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Cifras grandes en formato corto según el idioma: "12 mil" / "12K", "1,5 M" / "1.5M". */
export function formatCompact(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
