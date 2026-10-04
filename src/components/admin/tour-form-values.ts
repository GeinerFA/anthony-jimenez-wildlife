/** Valores iniciales (texto) de los formularios del tour, a partir de lo guardado en la base de datos. */

import type { TourCategory } from "@/config/tour-categories";

type StoredTranslation = {
  title: string;
  summary: string;
  description: string;
  itinerary: string | null;
  includes: string[];
  excludes: string[];
  whatToBring: string[];
  prices: string[];
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
    prices: t?.prices.join("\n") ?? "",
    meetingPoint: t?.meetingPoint ?? "",
    seoTitle: t?.seoTitle ?? "",
    seoDescription: t?.seoDescription ?? "",
  };
}

type StoredTourData = {
  category: TourCategory;
  durationMinutes: number | null;
  difficulty: string | null;
  location: string | null;
  priceFrom: number | null;
};

export type TourDataValues = {
  durationHours: string;
  durationMins: string;
  difficulty: string;
  location: string;
  priceFrom: string;
  category: TourCategory;
};

/** `category`: sección en la que se crea un tour nuevo (el de la lista desde la que se pulsó "Nuevo"). */
export function tourDataValues(tour?: StoredTourData | null, category: TourCategory = "TOUR"): TourDataValues {
  const minutes = tour?.durationMinutes;
  return {
    durationHours: minutes ? String(Math.floor(minutes / 60)) : "",
    durationMins: minutes ? String(minutes % 60) : "",
    difficulty: tour?.difficulty ?? "",
    location: tour?.location ?? "",
    priceFrom: tour?.priceFrom != null ? String(tour.priceFrom) : "",
    category: tour?.category ?? category,
  };
}
