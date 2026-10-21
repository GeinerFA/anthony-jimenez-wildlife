import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { TourCard } from "@/components/site/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { tourCategories, tourCategoryConfig } from "@/config/tour-categories";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getHeroMedia } from "@/server/heroes";
import { getPublishedTours } from "@/server/tours";

export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tours" });
  return pageMetadata(locale, "/tours", { title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ToursPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tours");
  const nav = await getTranslations("Nav");
  const [hero, ...sections] = await Promise.all([
    getHeroMedia("TOURS"),
    ...tourCategories.map(async (category) => ({ category, tours: await getPublishedTours(locale, { category }) })),
  ]);

  const pageUrl = absoluteUrl(locale, "/tours");
  const allTours = sections.flatMap(({ tours }) => tours).filter((tour) => tour.slug);

  return (
    <>
      {/* Lista de tours (Google descubre y relaciona cada página de tour) y migas de pan. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("metaTitle"),
          description: t("metaDescription"),
          url: pageUrl,
          numberOfItems: allTours.length,
          itemListElement: allTours.map((tour, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(locale, { pathname: "/tours/[slug]", params: { slug: tour.slug! } }),
            name: tour.title,
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: nav("home"), url: absoluteUrl(locale, "/") },
          { name: nav("tours"), url: pageUrl },
        ])}
      />

      <PageHero eyebrow="Costa Rica" title={t("title")} media={hero}>
        {t("description")}
      </PageHero>

      {/* Una sección por categoría; el menú "Tours" del header enlaza a cada una por su ancla (#tours-de-un-dia, #giras). */}
      {sections.map(({ category, tours }, sectionIndex) => {
        const { anchor, messageKey } = tourCategoryConfig[category];
        return (
          <section
            key={category}
            id={anchor}
            aria-labelledby={`${anchor}-title`}
            // scroll-mt: el header fijo no tapa el título al llegar desde el menú.
            className={`scroll-mt-20 ${sectionIndex % 2 === 1 ? "bg-mist/50" : ""}`}
          >
            <div className="relative mx-auto max-w-screen-2xl px-5 py-10 md:px-10 md:py-15">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <Reveal>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t(`sections.${messageKey}.eyebrow`)}</p>
                  <h2 id={`${anchor}-title`} className="mt-3 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
                    {t(`sections.${messageKey}.title`)}
                  </h2>
                  <p className="mt-3 max-w-2xl text-lg text-ink/70">{t(`sections.${messageKey}.text`)}</p>
                </Reveal>

                {/* Solo en la primera sección, a la derecha (debajo en celular): invitación al formulario "Planifica tu viaje". */}
                {sectionIndex === 0 && (
                  <Reveal
                    delay={0.1}
                    // En pantallas grandes, arriba a la derecha a 4 px del hero (top-1).
                    className="relative flex w-full shrink-0 flex-col gap-4 overflow-hidden rounded-2xl bg-moss p-5 text-bone shadow-xl shadow-ink/15 sm:flex-row sm:items-center sm:justify-between lg:absolute lg:right-10 lg:top-1 lg:w-auto"
                  >
                    <div className="sm:whitespace-nowrap">
                      <p className="font-display text-2xl leading-tight">{t("readyTitle")}</p>
                      <p className="mt-1 text-sm text-bone/75">{t("readyText")}</p>
                    </div>
                    <ButtonLink href="/plan-your-trip" className="shrink-0 text-center sm:whitespace-nowrap">
                      {t("readyCta")}
                    </ButtonLink>
                  </Reveal>
                )}
              </div>

              {tours.length === 0 ? (
                <div className="mt-8 rounded-sm border border-dashed border-ink/20 px-6 py-14 text-center">
                  <p className="mx-auto max-w-md text-lg text-ink/70">{t(`sections.${messageKey}.empty`)}</p>
                  <ButtonLink href="/contact" variant="dark" className="mt-8">
                    {nav("contact")}
                  </ButtonLink>
                </div>
              ) : (
                <RevealGroup className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 md:mt-8">
                  {tours.map((tour, index) => (
                    <RevealItem key={tour.id}>
                      <TourCard tour={tour} priority={sectionIndex === 0 && index < 3} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
