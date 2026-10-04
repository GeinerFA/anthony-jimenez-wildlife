import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { tourDataValues, translationValues } from "@/components/admin/tour-form-values";
import { TourForm } from "@/components/admin/tour-forms";
import { parseTourCategory, tourCategoryConfig } from "@/config/tour-categories";
import { saveTour } from "../actions";

export const metadata: Metadata = { title: "Nuevo tour" };

type Props = { searchParams: Promise<{ categoria?: string }> };

/** ?categoria=DAY_TOUR|GIRA: la sección desde la que se pulsó "Nuevo" (por defecto, Tours). */
export default async function NewTourPage({ searchParams }: Props) {
  const category = parseTourCategory((await searchParams).categoria);
  const config = tourCategoryConfig[category];

  return (
    <>
      <Link href={config.adminHref} className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        {config.label}
      </Link>
      <h1 className="mt-4 font-display text-4xl">{config.newLabel}</h1>
      <p className="mt-2 text-ink/60">Se crea como borrador. Después podés agregar fotos y videos, revisar el inglés y publicarlo.</p>

      <div className="mt-8">
        <TourForm
          action={saveTour.bind(null, null)}
          content={translationValues()}
          data={tourDataValues(null, category)}
          submitLabel="Crear"
        />
      </div>
    </>
  );
}
