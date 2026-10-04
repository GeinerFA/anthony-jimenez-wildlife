import { ArrowDown, ArrowUp, Film, Image as ImageIcon, Plus, Star } from "lucide-react";
import Link from "next/link";
import { moveTour, toggleFeatured } from "@/app/admin/(panel)/tours/actions";
import { EnglishBadge, StatusBadge } from "@/components/admin/badges";
import { PendingButton } from "@/components/admin/form-hooks";
import { buttonClass, iconButtonClass, Notice } from "@/components/admin/ui";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { tourCategoryConfig, type TourCategory } from "@/config/tour-categories";
import { isCloudinaryConfigured } from "@/lib/env";
import { videoPoster } from "@/lib/media/cloudinary-url";
import { getTranslator } from "@/lib/translation";
import { listToursForAdmin } from "@/server/admin/tours";

/** Lista del panel de una sección (Tours, Tours de un día, Giras): mismas acciones, cada una con sus tours. */
export async function TourListPage({ category }: { category: TourCategory }) {
  const config = tourCategoryConfig[category];
  const tours = await listToursForAdmin(category);
  const published = tours.filter((t) => t.status === "PUBLISHED").length;
  const mediaTotal = tours.reduce((sum, t) => sum + t.mediaCount, 0);
  const newHref = `/admin/tours/nuevo?categoria=${category}`;

  const stats = [
    { label: "Publicados", value: published },
    { label: "Borradores", value: tours.length - published },
    { label: "Imágenes y videos", value: mediaTotal },
  ];

  const missingConfig = [
    !isCloudinaryConfigured() && "Cloudinary (CLOUDINARY_*): no se pueden subir ni borrar fotos y videos.",
    !getTranslator() && "Traducción automática (DEEPL_API_KEY): el inglés hay que escribirlo a mano.",
  ].filter(Boolean);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl">{config.label}</h1>
        <Link href={newHref} className={buttonClass("lime")}>
          <Plus className="size-4" aria-hidden />
          {config.newLabel}
        </Link>
      </div>

      {missingConfig.length > 0 && (
        <Notice tone="amber" className="mt-6">
          <p className="font-semibold">Falta configurar en el servidor:</p>
          <ul className="mt-1 list-disc pl-5">
            {missingConfig.map((item) => (
              <li key={item as string}>{item}</li>
            ))}
          </ul>
        </Notice>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-sm border border-ink/10 bg-white p-3 sm:p-6">
            <dt className="text-xs leading-tight text-ink/60 sm:text-sm">{stat.label}</dt>
            <dd className="mt-1 font-display text-2xl sm:mt-2 sm:text-4xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {tours.length === 0 ? (
        <div className="mt-10 rounded-sm border border-dashed border-ink/20 bg-white p-10 text-center">
          <p className="text-ink/70">Todavía no hay nada en {config.label}.</p>
          <Link href={newHref} className={buttonClass("primary", "md", "mt-6")}>
            Crear el primero
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-10 text-sm text-ink/60">
            El orden de esta lista es el de su sección en el sitio. Los destacados (★) aparecen en el inicio; el primero pone el fondo de la portada si no hay una propia en Portadas.
          </p>
          {/* Cada fila: en celular, imagen y título arriba y las acciones en su propia fila; desde sm, todo en una fila. */}
          <ul className="mt-3 divide-y divide-ink/10 rounded-sm border border-ink/10 bg-white">
            {tours.map((tour, index) => (
              <li key={tour.id} className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 sm:flex sm:flex-wrap">
                <Link href={`/admin/tours/${tour.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-mist">
                  {tour.cover ? (
                    <CloudinaryImage
                      src={tour.cover.type === "VIDEO" ? videoPoster(tour.cover.url, 200) : tour.cover.url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto size-5 text-ink/30" aria-hidden />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/admin/tours/${tour.id}`} className="font-display text-xl hover:text-fern">
                    {tour.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink/55">
                    <StatusBadge status={tour.status} />
                    <EnglishBadge status={tour.english} />
                    <span className="inline-flex items-center gap-1">
                      <Film className="size-3.5" aria-hidden />
                      {tour.mediaCount} {tour.mediaCount === 1 ? "archivo" : "archivos"}
                    </span>
                    {tour.location && <span>· {tour.location}</span>}
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end border-t border-ink/5 pt-3 sm:border-0 sm:pt-0">
                  <form action={toggleFeatured.bind(null, tour.id)}>
                    <PendingButton
                      className={`${iconButtonClass} ${tour.featured ? "text-lime-deep" : ""}`}
                      title={tour.featured ? "Quitar de destacados" : "Destacar en el inicio"}
                      aria-label={tour.featured ? "Quitar de destacados" : "Destacar en el inicio"}
                    >
                      <Star className="size-4" fill={tour.featured ? "currentColor" : "none"} aria-hidden />
                    </PendingButton>
                  </form>
                  <form action={moveTour.bind(null, tour.id, "up")}>
                    <PendingButton className={iconButtonClass} disabled={index === 0} title="Subir" aria-label="Subir">
                      <ArrowUp className="size-4" aria-hidden />
                    </PendingButton>
                  </form>
                  <form action={moveTour.bind(null, tour.id, "down")}>
                    <PendingButton className={iconButtonClass} disabled={index === tours.length - 1} title="Bajar" aria-label="Bajar">
                      <ArrowDown className="size-4" aria-hidden />
                    </PendingButton>
                  </form>
                  <Link href={`/admin/tours/${tour.id}`} className={buttonClass("secondary", "sm", "ml-2")}>
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
