import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { SocialIcon, type SocialNetwork } from "@/components/ui/social-icon";
import { siteConfig, whatsappUrl } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { getHeroMedia } from "@/server/heroes";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return pageMetadata(locale, "/contact", { title: t("metaTitle"), description: t("metaDescription") });
}

function handleFrom(url: string) {
  return "@" + new URL(url).pathname.replace(/^\/@?/, "").replace(/\/$/, "");
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");
  const hero = await getHeroMedia("CONTACT");

  const channels: { network: SocialNetwork; name: string; href: string; detail: string }[] = [
    {
      network: "whatsapp",
      name: "WhatsApp",
      href: whatsappUrl(t("whatsappMessage")),
      detail: `+${siteConfig.social.whatsapp.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1 $2 $3")}`,
    },
    { network: "instagram", name: "Instagram", href: siteConfig.social.instagram, detail: handleFrom(siteConfig.social.instagram) },
    { network: "facebook", name: "Facebook", href: siteConfig.social.facebook, detail: handleFrom(siteConfig.social.facebook) },
    { network: "tiktok", name: "TikTok", href: siteConfig.social.tiktok, detail: handleFrom(siteConfig.social.tiktok) },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: t("metaTitle"),
          url: absoluteUrl(locale, "/contact"),
          about: { "@id": `${siteConfig.url}/#organization` },
        }}
      />

      <PageHero eyebrow={t("eyebrow")} title={t("title")} media={hero}>
        {t("subtitle")}
      </PageHero>

      <section className="mx-auto max-w-screen-2xl px-5 py-24 md:px-10 md:py-32">
        <RevealGroup className="grid gap-px overflow-hidden rounded-sm bg-ink/10 sm:grid-cols-2">
          {channels.map((channel) => (
            <RevealItem key={channel.network}>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative isolate flex min-h-72 flex-col justify-between overflow-hidden bg-bone p-8 transition-colors duration-700 hover:text-bone md:min-h-96 md:p-12"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-moss transition-transform duration-700 ease-out-expo group-hover:scale-y-100"
                />
                <div className="flex items-start justify-between">
                  <SocialIcon
                    network={channel.network}
                    className="size-10 transition-transform duration-700 ease-out-expo group-hover:scale-110 group-hover:text-lime md:size-12"
                  />
                  <span className="grid size-14 place-items-center rounded-full border border-current/20 transition-all duration-700 ease-out-expo group-hover:rotate-45 group-hover:border-lime group-hover:bg-lime group-hover:text-ink">
                    <ArrowUpRight className="size-6" aria-hidden />
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
                    {t(`channels.${channel.network}`)}
                  </p>
                  <p className="mt-3 font-display text-5xl tracking-tight transition-transform duration-700 ease-out-expo group-hover:translate-x-2 md:text-7xl">
                    {channel.name}
                  </p>
                  <p className="mt-2 opacity-70">{channel.detail}</p>
                </div>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
