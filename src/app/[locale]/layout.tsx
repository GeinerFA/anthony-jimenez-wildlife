import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { StandaloneZoomLock } from "@/components/pwa/standalone-zoom-lock";
import { BackToTop } from "@/components/site/back-to-top";
import { JsonLd } from "@/components/site/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { siteConfig } from "@/config/site";
import { siteTouchIcon } from "@/config/touch-icons";
import { routing } from "@/i18n/routing";
import { defaultOgImage, openGraphBase, siteJsonLd } from "@/lib/seo";
import { fraunces, interTight } from "../fonts";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#06140c",
  viewportFit: "cover",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t("title"), template: `%s · ${siteConfig.name}` },
    description: t("description"),
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.founder.name }],
    creator: siteConfig.founder.name,
    publisher: siteConfig.name,
    category: "travel",
    // Sin esto, iOS convierte en enlaces números sueltos (precios, horas del itinerario).
    formatDetection: { telephone: false, address: false, email: false },
    // Al instalarlo en iPhone/iPad (Compartir → Agregar a inicio) abre a pantalla completa, como app.
    appleWebApp: { capable: true, title: "AJ Wildlife", statusBarStyle: "black-translucent" },
    // Logo sobre fondo negro, incrustado: ver scripts/pwa-icons.ts.
    icons: { apple: [{ url: siteTouchIcon, sizes: "180x180", type: "image/png" }] },
    // Permite a Google mostrar fotos grandes y fragmentos completos en los resultados.
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: openGraphBase(locale),
    twitter: { card: "summary_large_image", images: [defaultOgImage.url] },
    // Meta de verificación de Google Search Console (opcional: también se puede verificar por DNS).
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const meta = await getTranslations({ locale, namespace: "Metadata" });
  const home = await getTranslations({ locale, namespace: "Home" });

  return (
    <html lang={locale} className={`${fraunces.variable} ${interTight.variable}`}>
      <body>
        <JsonLd
          data={siteJsonLd(locale, {
            description: meta("description"),
            slogan: home("pillars.responsible.motto"),
            jobTitle: meta("jobTitle"),
            knowsAbout: meta.raw("knowsAbout") as string[],
          })}
        />
        <NextIntlClientProvider>
          <SmoothScroll>
            <SiteHeader />
            <main id="contenido">{children}</main>
            <SiteFooter />
            <BackToTop />
          </SmoothScroll>
        </NextIntlClientProvider>
        <RegisterServiceWorker />
        <StandaloneZoomLock />
      </body>
      {/* Solo en el sitio público (no en el panel) y solo si hay ID de medición configurado. */}
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
