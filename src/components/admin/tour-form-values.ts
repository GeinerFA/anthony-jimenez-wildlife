/** Valores iniciales (texto) de los formularios del tour, a partir de lo guardado en la base de datos. */

type StoredTranslation = {
  title: string;
  summary: string;
  description: string;
  itinerary: string | null;
  includes: string[];
  excludes: string[];
  whatToBring: string[];
  meetingPoint: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type TranslationValues = Record<keyof StoredTranslation, string>;

export function translationValues(t?: StoredTranslation | null): TranslationValues {
  return {
    title: t?.title ?? "",
    summary: t?.summary ?? "",
    description: t?.description ?? "",
    itinerary: t?.itinerary ?? "",
    includes: t?.includes.join("\n") ?? "",
    excludes: t?.excludes.join("\n") ?? "",
    whatToBring: t?.whatToBring.join("\n") ?? "",
    meetingPoint: t?.meetingPoint ?? "",
    seoTitle: t?.seoTitle ?? "",
    seoDescription: t?.seoDescription ?? "",
  };
}

type StoredTourData = {
  durationMinutes: number | null;
  difficulty: string | null;
  location: string | null;
};

export type TourDataValues = {
  durationHours: string;
  durationMins: string;
  difficulty: string;
  location: string;
};

export function tourDataValues(tour?: StoredTourData | null): TourDataValues {
  const minutes = tour?.durationMinutes;
  return {
    durationHours: minutes ? String(Math.floor(minutes / 60)) : "",
    durationMins: minutes ? String(minutes % 60) : "",
    difficulty: tour?.difficulty ?? "",
    location: tour?.location ?? "",
  };
}
