import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { RequestForm } from "@/components/site/request-form";
import { ExternalButton } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/social-icon";
import { whatsappUrl } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { localeAlternates, openGraphBase } from "@/lib/seo";
import { getHeroMedia } from "@/server/heroes";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Request" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, "/plan-your-trip"),
    openGraph: { ...openGraphBase(locale), title: t("metaTitle"), description: t("metaDescription") },
  };
}

/** Formulario "Planifica tu viaje": las solicitudes llegan al panel (Solicitudes) y por correo a info@. */
export default async function PlanYourTripPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Request");
  const steps = t.raw("steps") as string[];
  const hero = await getHeroMedia("PLAN_TRIP");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} media={hero}>
        {t("subtitle")}
      </PageHero>

      <section className="mx-auto grid max-w-screen-2xl gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fern">{t("stepsTitle")}</p>
          <ol className="mt-6 space-y-6">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="font-display text-2xl leading-none text-fern">0{index + 1}</span>
                <p className="text-lg leading-snug text-ink/80">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 border-t border-ink/10 pt-8">
            <p className="font-display text-xl">{t("whatsappTitle")}</p>
            <ExternalButton href={whatsappUrl(t("whatsappMessage"))} variant="dark" className="mt-5">
              <span className="inline-flex items-center gap-2">
                <SocialIcon network="whatsapp" className="size-4" />
                WhatsApp
              </span>
            </ExternalButton>
          </div>
        </Reveal>

        <div className="lg:col-span-8">
          <RequestForm />
        </div>
      </section>
    </>
  );
}
