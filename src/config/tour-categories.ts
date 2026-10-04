/** Secciones de tours: cada una tiene su bloque en /tours y su lista aparte en el panel. */
export const tourCategories = ["TOUR", "DAY_TOUR", "GIRA"] as const;
export type TourCategory = (typeof tourCategories)[number];

export const tourCategoryConfig = {
  TOUR: { anchor: "tours", messageKey: "tours", adminHref: "/admin", label: "Tours", newLabel: "Nuevo tour" },
  DAY_TOUR: {
    anchor: "tours-de-un-dia",
    messageKey: "dayTours",
    adminHref: "/admin/tours-de-un-dia",
    label: "Tours de un día",
    newLabel: "Nuevo tour de un día",
  },
  GIRA: { anchor: "giras", messageKey: "giras", adminHref: "/admin/giras", label: "Giras", newLabel: "Nueva gira" },
} as const satisfies Record<TourCategory, { anchor: string; messageKey: string; adminHref: string; label: string; newLabel: string }>;

/** Categorías que se despliegan bajo "Tours" en el menú del sitio. */
export const tourSubCategories = ["DAY_TOUR", "GIRA"] as const satisfies readonly TourCategory[];

export function parseTourCategory(value: unknown): TourCategory {
  return tourCategories.includes(value as TourCategory) ? (value as TourCategory) : "TOUR";
}
