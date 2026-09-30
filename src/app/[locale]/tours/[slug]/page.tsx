import { ArrowLeft, Check, Clock, Gauge, MapPin, X } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { JsonLd } from "@/components/site/json-ld";
import { TourGallery } from "@/components/site/tour-gallery";
import { ExternalButton, UnderlineLink } from "@/components/ui/button";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { SocialIcon } from "@/components/ui/social-icon";
import { siteConfig, whatsappUrl } from "@/config/site";
import { Link, redirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { formatDuration, isoDuration, paragraphs } from "@/lib/format";
import { videoPoster, videoStream, withTransform } from "@/lib/media/cloudinary-url";
import { absoluteUrl, localeAlternates } from "@/lib/seo";
import { findTranslatedSlug, getPublishedTourSlugs, getTourBySlug } from "@/server/tours";

export const revalidate = 300;
export const dynamicParams = true;

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateStaticParams() {
  const tours = await getPublishedTourSlugs();
  return tours.flatMap((tour) =>
    routing.locales.flatMap((locale) => (tour.slugs[locale] ? [{ locale, slug: tour.slugs[locale] }] : [])),
  );
}

function tourHrefs(slugs: Partial<Record<Locale, string>>, fallback: string) {
  return Object.fromEntries(
    routing.locales.map((l) => [l, { pathname: "/tours/[slug]" as const, params: { slug: slugs[l] ?? fallback } }]),
  ) as Record<Locale, { pathname: "/tours/[slug]"; params: { slug: string } }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = await getTourBySlug(locale, slug);
  if (!tour) return {};

  const cover = tour.media[0];
  const ogImage = cover
    ? cover.type === "VIDEO"
      ? videoPoster(cover.url, 1200)
      : withTransform(cover.url, "c_fill,w_1200,h_630,f_jpg,q_auto")
    : undefined;
  const title = tour.seoTitle ?? tour.title;
  const description = tour.seoDescription ?? tour.summary;

  return {
    title,
    description,
    alternates: localeAlternates(locale, tourHrefs(tour.slugs, slug)),
    openGraph: {
      type: "article",
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: tour.title }] : undefined,
    },
  };
}

export default async function TourPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tour = await getTourBySlug(locale, slug);
  if (!tour) {
    // Slug de otro idioma (cambio de idioma desde el header): redirigir al slug traducido.
    const translated = await findTranslatedSlug(locale, slug);
    if (translated) redirect({ href: { pathname: "/tours/[slug]", params: { slug: translated } }, locale });
    notFound();
  }

  const t = await getTranslations("Tours");
  const nav = await getTranslations("Nav");
  const contact = await getTranslations("Contact");

  const cover = tour.media[0];
  const altFor = (m: { altEs: string | null; altEn: string | null }) =>
    (locale === "en" ? m.altEn : m.altEs) ?? tour.title;
  const pageUrl = absoluteUrl(locale, { pathname: "/tours/[slug]", params: { slug } });
  const whatsappHref = whatsappUrl(contact("whatsappTourMessage", { tour: tour.title }));

  const facts = [
    tour.durationMinutes && { icon: Clock, label: t("duration"), value: formatDuration(tour.durationMinutes) },
    tour.difficulty && { icon: Gauge, label: t("difficultyLabel"), value: t(`difficulty.${tour.difficulty}`) },
    tour.location && { icon: MapPin, label: t("location"), value: tour.location },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip",
        name: tour.title,
        description: tour.summary,
        url: pageUrl,
        inLanguage: locale,
        image: tour.media.filter((m) => m.type === "IMAGE").map((m) => m.url),
        ...(tour.durationMinutes ? { duration: isoDuration(tour.durationMinutes) } : {}),
        ...(tour.location
          ? {
              touristType: "Nature",
              itinerary: { "@type": "Place", name: tour.location },
            }
          : {}),
        provider: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: nav("home"), item: absoluteUrl(locale, "/") },
          { "@type": "ListItem", position: 2, name: nav("tours"), item: absoluteUrl(locale, "/tours") },
          { "@type": "ListItem", position: 3, name: tour.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <article>
      <JsonLd data={jsonLd} />

      {/* Portada */}
      <header className="grain relative flex min-h-[88svh] items-end overflow-hidden bg-ink text-bone">
        {cover?.type === "VIDEO" && (
          <video
            className="absolute inset-0 size-full object-cover"
            src={videoStream(cover.url)}
            poster={videoPoster(cover.url)}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        )}
        {cover?.type === "IMAGE" && (
          <CloudinaryImage
            src={cover.url}
            alt={altFor(cover)}
            fill
            priority
            sizes="100vw"
            className="animate-ken-burns object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/30" />

        <div className="relative mx-auto w-full max-w-screen-2xl px-5 pb-14 md:px-10 md:pb-20">
          <Reveal y={12}>
            <Link
              href="/tours"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-bone/80 hover:text-lime"
            >
              <ArrowLeft className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" aria-hidden />
              {t("backToTours")}
            </Link>
          </Reveal>
          <SplitText
            as="h1"
            text={tour.title}
            immediate
            delay={0.15}
            className="mt-6 max-w-5xl font-display text-5xl leading-[1] tracking-tight md:text-8xl"
          />
          <Reveal delay={0.5} className="mt-6 max-w-2xl text-lg text-bone/80 md:text-xl">
            {tour.summary}
          </Reveal>

          {facts.length > 0 && (
            <Reveal delay={0.65}>
              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-bone/20 pt-6">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-lime">
                      <Icon className="size-3.5" aria-hidden />
                      {label}
                    </dt>
                    <dd className="mt-1 font-display text-xl">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </header>

      {/* Contenido + tarjeta de consulta */}
      <div className="mx-auto grid max-w-screen-2xl gap-16 px-5 py-24 md:px-10 lg:grid-cols-[1fr_380px] lg:py-32">
        <div className="max-w-3xl space-y-20">
          <Reveal className="space-y-6 text-lg leading-relaxed text-ink/85">
            {paragraphs(tour.description).map((p, i) => (
              <p key={i} className={i === 0 ? "font-display text-2xl leading-snug text-ink md:text-3xl" : ""}>
                {p}
              </p>
            ))}
          </Reveal>

          {tour.itinerary && (
            <Section title={t("itinerary")}>
              <div className="space-y-5 text-lg leading-relaxed text-ink/85">
                {paragraphs(tour.itinerary).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Section>
          )}

          {(tour.includes.length > 0 || tour.excludes.length > 0) && (
            <div className="grid gap-12 sm:grid-cols-2">
              {tour.includes.length > 0 && (
                <Section title={t("includes")}>
                  <CheckList items={tour.includes} icon="check" />
                </Section>
              )}
              {tour.excludes.length > 0 && (
                <Section title={t("excludes")}>
                  <CheckList items={tour.excludes} icon="x" />
                </Section>
              )}
            </div>
          )}

          {tour.whatToBring.length > 0 && (
            <Section title={t("whatToBring")}>
              <CheckList items={tour.whatToBring} icon="check" />
            </Section>
          )}

          {tour.meetingPoint && (
            <Section title={t("meetingPoint")}>
              <p className="text-lg text-ink/85">{tour.meetingPoint}</p>
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Reveal className="grain relative overflow-hidden rounded-sm bg-moss p-8 text-bone">
            <h2 className="font-display text-3xl">{t("askPrice")}</h2>
            <p className="mt-4 text-bone/75">{t("askPriceText")}</p>
            <div className="mt-8 flex flex-col gap-3">
              <ExternalButton href={whatsappHref} className="justify-between">
                <span className="inline-flex items-center gap-2">
                  <SocialIcon network="whatsapp" className="size-4" />
                  WhatsApp
                </span>
              </ExternalButton>
              <ExternalButton href={siteConfig.social.instagram} variant="light" className="justify-between">
                <span className="inline-flex items-center gap-2">
                  <SocialIcon network="instagram" className="size-4" />
                  Instagram
                </span>
              </ExternalButton>
            </div>
            <div className="mt-6 text-sm text-bone/80">
              <UnderlineLink href="/contact">{nav("contact")}</UnderlineLink>
            </div>
          </Reveal>
        </aside>
      </div>

      {/* Galería: la portada entra al carrusel pero no se repite en la cuadrícula. */}
      <TourGallery media={tour.media.map((m) => ({ ...m, alt: altFor(m) }))} />
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-fern">
        <span aria-hidden className="h-px w-8 bg-fern" />
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </Reveal>
  );
}

function CheckList({ items, icon }: { items: string[]; icon: "check" | "x" }) {
  const Icon = icon === "check" ? Check : X;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-ink/85">
          <Icon className={`mt-1 size-4 shrink-0 ${icon === "check" ? "text-fern" : "text-ink/40"}`} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}
