import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { TourCard } from "@/components/site/tour-card";
import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";
import { getPublishedTours } from "@/server/tours";

export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tours" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates(locale, "/tours"),
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function ToursPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tours");
  const nav = await getTranslations("Nav");
  const tours = await getPublishedTours(locale);

  return (
    <>
      <PageHero eyebrow="Costa Rica" title={t("title")}>
        {t("description")}
      </PageHero>

      <section className="mx-auto max-w-screen-2xl px-5 py-24 md:px-10 md:py-32">
        {tours.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mx-auto max-w-md text-lg text-ink/70">{t("empty")}</p>
            <ButtonLink href="/contact" variant="dark" className="mt-8">
              {nav("contact")}
            </ButtonLink>
          </div>
        ) : (
          <RevealGroup className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour, index) => (
              <RevealItem key={tour.id}>
                <TourCard tour={tour} priority={index < 3} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>
    </>
  );
}
