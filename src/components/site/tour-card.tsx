import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { Link } from "@/i18n/navigation";
import { formatDuration } from "@/lib/format";
import { videoPoster } from "@/lib/media/cloudinary-url";
import type { TourCardData } from "@/server/tours";

export function TourCard({ tour, priority = false }: { tour: TourCardData; priority?: boolean }) {
  const t = useTranslations("Tours");
  const locale = useLocale();
  const cover = tour.cover;
  const coverSrc = cover ? (cover.type === "VIDEO" ? videoPoster(cover.url) : cover.url) : null;
  const alt = (locale === "en" ? cover?.altEn : cover?.altEs) ?? tour.title ?? "";

  return (
    <Link
      href={{ pathname: "/tours/[slug]", params: { slug: tour.slug! } }}
      className="group block focus-visible:outline-offset-8"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-moss">
        {coverSrc && (
          <CloudinaryImage
            src={coverSrc}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

        <span className="absolute right-5 top-5 grid size-12 translate-y-2 place-items-center rounded-full bg-lime text-ink opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-6 text-bone">
          {tour.location && (
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
              <MapPin className="size-3.5" aria-hidden />
              {tour.location}
            </p>
          )}
          <h3 className="mt-3 font-display text-3xl leading-tight">{tour.title}</h3>
          {tour.durationMinutes && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-bone/75">
              <Clock className="size-3.5" aria-hidden />
              <span className="sr-only">{t("duration")}:</span>
              {formatDuration(tour.durationMinutes)}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-ink/70">{tour.summary}</p>
    </Link>
  );
}
