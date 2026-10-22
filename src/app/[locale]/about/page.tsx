import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { PartnerLogos, StatsGrid } from "@/components/site/about-highlights";
import { CommunityChart, type NetworkStat } from "@/components/site/community-chart";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { paragraphs } from "@/lib/format";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { getAboutContent } from "@/server/about";
import { getHeroMedia } from "@/server/heroes";

export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return pageMetadata(locale, "/about", { title: t("metaTitle"), description: t("metaDescription") });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const home = await getTranslations("Home");
  const [about, hero] = await Promise.all([getAboutContent(locale), getHeroMedia("ABOUT")]);

  // Mientras no haya biografía en el panel, la presentación del inicio.
  const bio = about.bio ? paragraphs(about.bio) : [home("introLead"), home("introText1"), home("introText2")];
  const quote = about.quote ?? home("pillars.responsible.motto");
  const pageUrl = absoluteUrl(locale, "/about");
  // Seguidores por red → gráfica de comunidad; cifras propias (años, especies…) → contadores debajo.
  const networkStats = about.stats.filter((stat): stat is NetworkStat => stat.network !== null);
  const ownStats = about.stats.filter((stat) => stat.network === null);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: pageUrl,
          name: t("metaTitle"),
          description: t("metaDescription"),
          inLanguage: locale,
          isPartOf: { "@id": `${siteConfig.url}/#website` },
          mainEntity: { "@id": `${siteConfig.url}/#anthony-jimenez` },
          ...(about.photo && { primaryImageOfPage: about.photo.url }),
          ...(about.partners.length > 0 && {
            mentions: about.partners.map((partner) => ({
              "@type": "Organization",
              name: partner.name,
              logo: partner.logo.url,
              ...(partner.url && { url: partner.url }),
            })),
          }),
        }}
      />

      <PageHero eyebrow={t("eyebrow")} title={t("title")} media={hero}>
        {t("subtitle")}
      </PageHero>

      {/* Mi historia */}
      <section className="mx-auto max-w-screen-2xl px-5 py-20 md:px-10 md:py-28">
        <div className={`grid gap-12 lg:gap-20 ${about.photo ? "lg:grid-cols-12" : ""}`}>
          {about.photo && (
            <Reveal className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-sm bg-mist" style={{ aspectRatio: `${about.photo.width} / ${about.photo.height}` }}>
                <CloudinaryImage
                  src={about.photo.url}
                  alt={t("photoAlt")}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <div className={about.photo ? "lg:col-span-7" : "max-w-4xl"}>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t("storyEyebrow")}</p>
            </Reveal>
            <SplitText as="h2" text={t("storyTitle")} className="mt-6 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl" />
            <Reveal className="mt-10 space-y-5 text-lg leading-relaxed text-ink/80">
              {bio.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </Reveal>
            <Reveal className="mt-10">
              <p className="border-l-2 border-lime pl-5 font-display text-2xl italic leading-snug text-fern md:text-3xl">{quote}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* En números */}
      {about.stats.length > 0 && (
        <section className="grain relative overflow-hidden bg-ink text-bone">
          <div className="mx-auto max-w-screen-2xl px-5 py-20 md:px-10 md:py-28">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime">{t("statsEyebrow")}</p>
            </Reveal>
            <SplitText text={t("statsTitle")} className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl" />
            {networkStats.length > 0 && (
              <div className="mt-14 border-t border-bone/10 pt-12">
                <CommunityChart stats={networkStats} />
              </div>
            )}
            {ownStats.length > 0 && (
              <div className="mt-14">
                <StatsGrid stats={ownStats} tone="dark" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Aliados */}
      {about.partners.length > 0 && (
        <section className="mx-auto max-w-screen-2xl px-5 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t("partnersEyebrow")}</p>
          </Reveal>
          <SplitText text={t("partnersTitle")} className="mt-6 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl" />
          <Reveal className="mt-5 max-w-2xl text-lg text-ink/70">{t("partnersText")}</Reveal>
          <div className="mt-14">
            <PartnerLogos partners={about.partners} detailed />
          </div>
        </section>
      )}

      {/* Cierre */}
      <section className="relative overflow-hidden bg-lime text-ink">
        <div className="mx-auto max-w-screen-2xl px-5 py-16 md:px-10 md:py-24">
          <SplitText text={t("closingTitle")} className="max-w-4xl font-display text-4xl leading-[1] tracking-tight md:text-6xl" />
          <Reveal delay={0.2} className="mt-5 max-w-xl text-ink/80 md:text-lg">
            {t("closingText")}
          </Reveal>
          <Reveal delay={0.35} className="mt-8">
            <ButtonLink href="/plan-your-trip" variant="dark">
              {t("closingCta")}
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
