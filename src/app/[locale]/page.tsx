import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { HeroMedia } from "@/components/site/hero-media";
import { JsonLd } from "@/components/site/json-ld";
import { TourCard } from "@/components/site/tour-card";
import { ButtonLink, ExternalButton, UnderlineLink } from "@/components/ui/button";
import { SectionFade } from "@/components/ui/section-fade";
import { whatsappUrl } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { paragraphs } from "@/lib/format";
import { localeAlternates, openGraphBase, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getHeroMedia } from "@/server/heroes";
import { getPublishedTours } from "@/server/tours";

export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: { absolute: t("title") },
    alternates: localeAlternates(locale, "/"),
    openGraph: { ...openGraphBase(locale), title: t("title"), description: t("description") },
  };
}

const pillarKeys = ["local", "small", "responsible"] as const;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const meta = await getTranslations("Metadata");
  const contact = await getTranslations("Contact");

  const [featured, hero] = await Promise.all([getPublishedTours(locale, { featured: true, limit: 6 }), getHeroMedia("HOME")]);
  // Portada propia del panel; si no hay, la del primer tour destacado.
  const heroBackground = hero ?? featured[0]?.cover;

  return (
    <>
      <JsonLd data={websiteJsonLd(locale)} />
      <JsonLd data={organizationJsonLd(locale, meta("description"))} />

      {/* Hero a pantalla completa */}
      <section className="grain relative flex min-h-svh items-end overflow-hidden bg-ink text-bone">
        {heroBackground ? <HeroMedia media={heroBackground} /> : <HeroFallback />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />

        <div className="relative mx-auto w-full max-w-screen-2xl px-5 pb-16 md:px-10 md:pb-24">
          <Reveal y={16}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-lime">
              <span aria-hidden className="h-px w-10 bg-lime" />
              {t("eyebrow")}
            </p>
          </Reveal>
          <SplitText
            as="h1"
            text={t("heroTitle")}
            immediate
            delay={0.2}
            className="mt-6 max-w-5xl font-display text-[2.75rem] leading-[1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          />
          <div className="mt-10 flex flex-col items-start gap-8">
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
            <span className="block h-full w-full animate-scroll-cue bg-lime" />
          </span>
        </div>
      </section>

      <SectionFade from="var(--color-ink)" to="var(--color-bone)" />

      {/* Quiénes somos */}
      <section className="mx-auto max-w-screen-2xl px-5 py-28 md:px-10 md:py-40">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t("introEyebrow")}</p>
        </Reveal>
        <SplitText
          as="h2"
          text={t("introTitle")}
          className="mt-8 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl"
        />

        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:gap-16">
          <Reveal className="text-xl leading-relaxed text-ink/85 md:text-2xl lg:col-span-6">
            {t("introLead")}
          </Reveal>
          <RevealGroup className="grid content-start gap-6 text-ink/70 md:text-lg lg:col-span-6 lg:border-l lg:border-ink/15 lg:pl-12">
            <RevealItem>
              <p className="leading-relaxed">{t("introText1")}</p>
            </RevealItem>
            <RevealItem>
              <p className="leading-relaxed">{t("introText2")}</p>
            </RevealItem>
          </RevealGroup>
        </div>

        <RevealGroup className="mt-24 grid gap-12 border-t border-ink/15 pt-12 md:grid-cols-3">
          {pillarKeys.map((key, index) => (
            <RevealItem key={key}>
              <p className="font-display text-sm text-fern">0{index + 1}</p>
              <h2 className="mt-4 font-display text-2xl">{t(`pillars.${key}.title`)}</h2>
              {paragraphs(t(`pillars.${key}.text`)).map((text) => (
                <p key={text} className="mt-3 leading-relaxed text-ink/70">
                  {text}
                </p>
              ))}
              {key === "responsible" && (
                <p className="mt-5 font-display text-lg italic text-fern">{t("pillars.responsible.motto")}</p>
              )}
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
      <section className="relative overflow-hidden bg-lime text-ink">
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

/** Degradado de la marca cuando no hay portada propia ni tour destacado con foto. */
function HeroFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 animate-ken-burns bg-[radial-gradient(ellipse_at_20%_20%,var(--color-fern)_0%,transparent_55%),radial-gradient(ellipse_at_80%_70%,var(--color-moss)_0%,transparent_60%),linear-gradient(160deg,var(--color-ink)_0%,var(--color-ink-soft)_100%)]"
    />
  );
}
