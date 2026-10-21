import { BedDouble, Check, Compass, Plane, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/social-icon";
import { siteConfig, whatsappUrl } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { getHeroMedia } from "@/server/heroes";

/** Página informativa (sin panel por ahora): los textos viven en messages/*.json, en "Services". */
const services: { key: "guide" | "flights" | "lodging"; icon: LucideIcon }[] = [
  { key: "guide", icon: Compass },
  { key: "flights", icon: Plane },
  { key: "lodging", icon: BedDouble },
];

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Services" });
  return pageMetadata(locale, "/services", { title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Services");
  const hero = await getHeroMedia("SERVICES");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": services.map(({ key }) => ({
            "@type": "Service",
            name: t(`items.${key}.title`),
            description: t(`items.${key}.text`),
            areaServed: { "@type": "Country", name: "Costa Rica" },
            provider: { "@id": `${siteConfig.url}/#organization` },
            url: absoluteUrl(locale, "/services"),
          })),
        }}
      />

      <PageHero eyebrow={t("eyebrow")} title={t("title")} media={hero}>
        {t("subtitle")}
      </PageHero>

      <section className="mx-auto max-w-screen-2xl px-5 py-14 md:px-10 md:py-20">
        <ol className="divide-y divide-ink/10 border-y border-ink/10">
          {services.map(({ key, icon: Icon }, index) => {
            const title = t(`items.${key}.title`);
            return (
              <li key={key}>
                <Reveal className="grid gap-8 py-12 md:py-16 lg:grid-cols-12 lg:gap-16">
                  {/* Número, ícono y título */}
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-4">
                      <span className="font-display text-sm text-fern">0{index + 1}</span>
                      <span className="grid size-14 place-items-center rounded-full bg-moss text-lime">
                        <Icon className="size-6" aria-hidden />
                      </span>
                    </div>
                    <h2 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{title}</h2>
                    <p className="mt-4 border-l-2 border-lime pl-5 font-display text-lg leading-relaxed text-ink/90 md:text-xl">
                      {t(`items.${key}.lead`)}
                    </p>
                  </div>

                  {/* Descripción, qué incluye y consulta */}
                  <div className="lg:col-span-7">
                    <p className="text-lg leading-relaxed text-ink/75">{t(`items.${key}.text`)}</p>
                    <p className="mt-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-fern">
                      <span aria-hidden className="h-px w-8 bg-fern" />
                      {t("includesLabel")}
                    </p>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {(t.raw(`items.${key}.points`) as string[]).map((point) => (
                        <li key={point} className="flex gap-3 text-ink/85">
                          <Check className="mt-1 size-4 shrink-0 text-fern" aria-hidden />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Cierre: invitación a armar el viaje completo */}
      <section className="grain relative overflow-hidden bg-moss text-bone">
        <Reveal className="mx-auto max-w-screen-2xl px-5 py-20 text-center md:px-10 md:py-28">
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">{t("closingTitle")}</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-bone/75">{t("closingText")}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {/* Lleva al formulario "Planifica tu viaje" (las solicitudes se ven en el panel). */}
            <ButtonLink href="/plan-your-trip">{t("contactCta")}</ButtonLink>
            <ExternalButton href={whatsappUrl(t("whatsappMessage", { service: t("title") }))} variant="light">
              <span className="inline-flex items-center gap-2">
                <SocialIcon network="whatsapp" className="size-4" />
                WhatsApp
              </span>
            </ExternalButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
