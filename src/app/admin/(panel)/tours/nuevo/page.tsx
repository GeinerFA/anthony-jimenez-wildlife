import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { tourDataValues, translationValues } from "@/components/admin/tour-form-values";
import { TourForm } from "@/components/admin/tour-forms";
import { saveTour } from "../actions";

export const metadata: Metadata = { title: "Nuevo tour" };

export default function NewTourPage() {
  return (
    <>
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        Tours
      </Link>
      <h1 className="mt-4 font-display text-4xl">Nuevo tour</h1>
      <p className="mt-2 text-ink/60">Se crea como borrador. Después podés agregar fotos y videos, revisar el inglés y publicarlo.</p>

      <div className="mt-8">
        <TourForm action={saveTour.bind(null, null)} content={translationValues()} data={tourDataValues()} submitLabel="Crear tour" />
      </div>
    </>
  );
}
