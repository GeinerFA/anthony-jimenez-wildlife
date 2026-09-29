import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { JsonLd } from "@/components/site/json-ld";
import { TourCard } from "@/components/site/tour-card";
import { ButtonLink, ExternalButton, UnderlineLink } from "@/components/ui/button";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { whatsappUrl } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { videoPoster, videoStream } from "@/lib/media/cloudinary-url";
import { localeAlternates, organizationJsonLd } from "@/lib/seo";
import { getPublishedTours, type TourCardData } from "@/server/tours";

export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: { absolute: t("title") },
    alternates: localeAlternates(locale, "/"),
    openGraph: { title: t("title"), description: t("description") },
  };
}

const pillarKeys = ["local", "small", "responsible"] as const;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const meta = await getTranslations("Metadata");
  const contact = await getTranslations("Contact");

  const featured = await getPublishedTours(locale, { featured: true, limit: 6 });

  return (
    <>
      <JsonLd data={organizationJsonLd(locale, meta("description"))} />

      {/* Hero a pantalla completa */}
      <section className="grain relative flex min-h-svh items-end overflow-hidden bg-ink text-bone">
        <HeroBackground tour={featured[0]} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />

        <div className="relative mx-auto w-full max-w-screen-2xl px-5 pb-16 md:px-10 md:pb-24">
          <Reveal y={16}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-sun">
              <span aria-hidden className="h-px w-10 bg-sun" />
              {t("eyebrow")}
            </p>
          </Reveal>
          <SplitText
            as="h1"
            text={t("heroTitle")}
            immediate
            delay={0.2}
            className="mt-6 max-w-6xl font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl md:text-[8.5rem]"
          />
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <Reveal delay={0.7} className="max-w-md text-lg text-bone/80">
              {t("heroSubtitle")}
            </Reveal>
            <Reveal delay={0.85}>
              <ButtonLink href="/tours">{t("heroCta")}</ButtonLink>
            </Reveal>
          </div>
        </div>

        <div aria-hidden className="absolute bottom-8 right-10 hidden flex-col items-center gap-3 md:flex">
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-bone/60 [writing-mode:vertical-rl]">
            {t("scroll")}
          </span>
          <span className="h-16 w-px bg-bone/20">
            <span className="block h-full w-full animate-scroll-cue bg-sun" />
          </span>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="mx-auto max-w-screen-2xl px-5 py-28 md:px-10 md:py-40">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t("introEyebrow")}</p>
        </Reveal>
        <SplitText
          as="p"
          text={t("intro")}
          className="mt-8 max-w-5xl font-display text-3xl leading-snug tracking-tight md:text-5xl md:leading-[1.15]"
        />

        <RevealGroup className="mt-24 grid gap-12 border-t border-ink/15 pt-12 md:grid-cols-3">
          {pillarKeys.map((key, index) => (
            <RevealItem key={key}>
              <p className="font-display text-sm text-fern">0{index + 1}</p>
              <h2 className="mt-4 font-display text-2xl">{t(`pillars.${key}.title`)}</h2>
              <p className="mt-3 text-ink/70">{t(`pillars.${key}.text`)}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Tours destacados */}
      {featured.length > 0 && (
        <section className="bg-mist/50 py-28 md:py-40">
          <div className="mx-auto max-w-screen-2xl px-5 md:px-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Reveal>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t("featuredEyebrow")}</p>
                </Reveal>
                <SplitText text={t("featuredTitle")} className="mt-4 font-display text-5xl tracking-tight md:text-7xl" />
              </div>
              <Reveal>
                <UnderlineLink href="/tours">{t("viewAll")}</UnderlineLink>
              </Reveal>
            </div>

            <RevealGroup className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((tour, index) => (
                <RevealItem key={tour.id}>
                  <TourCard tour={tour} priority={index < 3} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* Llamado a la acción: los precios se consultan por DM */}
      <section className="relative overflow-hidden bg-sun text-ink">
        <div className="mx-auto max-w-screen-2xl px-5 py-28 md:px-10 md:py-36">
          <SplitText text={t("ctaTitle")} className="max-w-4xl font-display text-5xl leading-[1] tracking-tight md:text-8xl" />
          <Reveal delay={0.2} className="mt-8 max-w-xl text-lg text-ink/80">
            {t("ctaText")}
          </Reveal>
          <Reveal delay={0.35} className="mt-12 flex flex-wrap gap-4">
            <ExternalButton href={whatsappUrl(contact("whatsappMessage"))} variant="dark">
              WhatsApp
            </ExternalButton>
            <ButtonLink href="/contact" variant="dark">
              {t("ctaButton")}
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** Fondo del hero: el video o la foto de portada del primer tour destacado, o un degradado de respaldo. */
function HeroBackground({ tour }: { tour?: TourCardData }) {
  const cover = tour?.cover;

  if (cover?.type === "VIDEO") {
    return (
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
    );
  }

  if (cover) {
    return (
      <CloudinaryImage
        src={cover.url}
        alt=""
        fill
        priority
        sizes="100vw"
        className="animate-ken-burns object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="absolute inset-0 animate-ken-burns bg-[radial-gradient(ellipse_at_20%_20%,#2f5d43_0%,transparent_55%),radial-gradient(ellipse_at_80%_70%,#1f3a2b_0%,transparent_60%),linear-gradient(160deg,#0b0f0c_0%,#1a211c_100%)]"
    />
  );
}
