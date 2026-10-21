import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { getHeroMedia } from "@/server/heroes";

type Props = { params: Promise<{ locale: Locale }> };

type Section = { title: string; text: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return pageMetadata(locale, "/privacy", { title: t("metaTitle"), description: t("metaDescription") });
}

/** Política de privacidad: los textos viven en messages/*.json, en "Privacy". */
export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");
  const sections = t.raw("sections") as Section[];
  const hero = await getHeroMedia("PRIVACY");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} media={hero}>
        {t("subtitle")}
      </PageHero>

      <section className="mx-auto max-w-3xl px-5 py-14 md:px-10 md:py-20">
        <p className="text-sm text-ink/55">{t("updated")}</p>
        <div className="mt-10 space-y-12">
          {sections.map((section) => (
            <Reveal key={section.title}>
              <h2 className="font-display text-2xl md:text-3xl">{section.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink/80">{section.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
