import { ChevronLeft, ExternalLink, Eye, EyeOff, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EnglishBadge, StatusBadge } from "@/components/admin/badges";
import { PendingButton } from "@/components/admin/form-hooks";
import { TourTabs } from "@/components/admin/tour-tabs";
import { buttonClass, Notice } from "@/components/admin/ui";
import { tourCategoryConfig } from "@/config/tour-categories";
import { getTourForAdmin } from "@/server/admin/tours";
import { setTourStatus, toggleFeatured } from "../actions";

type Props = { params: Promise<{ id: string }>; children: ReactNode };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const tour = await getTourForAdmin((await params).id);
  return { title: tour?.es?.title ?? "Tour" };
}

export default async function TourLayout({ params, children }: Props) {
  const { id } = await params;
  const tour = await getTourForAdmin(id);
  if (!tour) notFound();

  const published = tour.status === "PUBLISHED";
  const section = tourCategoryConfig[tour.category];
  const warnings = [
    tour.media.length === 0 && "No tiene fotos ni videos: se muestra sin portada.",
    tour.english === "missing" && "No tiene versión en inglés: no aparece en el sitio en inglés.",
  ].filter(Boolean);

  return (
    <>
      <Link href={section.adminHref} className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        {section.label}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-4xl">{tour.es?.title ?? "(sin título)"}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={tour.status} />
            <EnglishBadge status={tour.english} />
            {tour.featured && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-lime-deep">
                <Star className="size-3.5" fill="currentColor" aria-hidden /> Destacado
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {published && tour.es && (
            <a href={`/es/tours/${tour.es.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>
              <ExternalLink className="size-4" aria-hidden />
              Ver en el sitio
            </a>
          )}
          <form action={toggleFeatured.bind(null, tour.id)}>
            <PendingButton className={buttonClass("secondary", "sm")}>
              <Star className="size-4" fill={tour.featured ? "currentColor" : "none"} aria-hidden />
              {tour.featured ? "Quitar destacado" : "Destacar"}
            </PendingButton>
          </form>
          <form action={setTourStatus.bind(null, tour.id, published ? "DRAFT" : "PUBLISHED")}>
            <PendingButton className={buttonClass(published ? "secondary" : "lime", "sm")}>
              {published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              {published ? "Pasar a borrador" : "Publicar"}
            </PendingButton>
          </form>
        </div>
      </div>

      {warnings.length > 0 && (
        <Notice tone="amber" className="mt-6">
          <ul className="list-disc pl-5">
            {warnings.map((w) => (
              <li key={w as string}>{w}</li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="mt-8">
        <TourTabs tourId={tour.id} mediaCount={tour.media.length} />
      </div>
      <div className="mt-8">{children}</div>
    </>
  );
}
