import { useTranslations } from "next-intl";
import { siteConfig, whatsappUrl } from "@/config/site";
import { tourCategoryConfig } from "@/config/tour-categories";
import { Link } from "@/i18n/navigation";
import { SocialIcon, type SocialNetwork } from "@/components/ui/social-icon";
import { Logo } from "./logo";

/** Todas las páginas del sitio, en el orden del menú; las secciones de tours enlazan a su ancla en /tours. */
const footerNav = [
  { href: "/", key: "home" },
  { href: "/tours", key: "tours" },
  { href: { pathname: "/tours", hash: tourCategoryConfig.DAY_TOUR.anchor }, key: tourCategoryConfig.DAY_TOUR.messageKey },
  { href: { pathname: "/tours", hash: tourCategoryConfig.GIRA.anchor }, key: tourCategoryConfig.GIRA.messageKey },
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/plan-your-trip", key: "planTrip" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");
  const contact = useTranslations("Contact");

  const socials: { network: SocialNetwork; href: string; label: string }[] = [
    { network: "whatsapp", href: whatsappUrl(contact("whatsappMessage")), label: "WhatsApp" },
    { network: "instagram", href: siteConfig.social.instagram, label: "Instagram" },
    { network: "facebook", href: siteConfig.social.facebook, label: "Facebook" },
    { network: "tiktok", href: siteConfig.social.tiktok, label: "TikTok" },
  ];

  return (
    <footer className="grain relative overflow-hidden bg-ink text-bone">
      <div className="mx-auto max-w-screen-2xl px-5 pb-8 pt-14 md:px-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          <div>
            <Logo size="lg" />
            <p className="mt-4 max-w-sm text-bone/70">{t("tagline")}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-3">
              {footerNav.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-bone/80 transition-colors hover:text-lime">
                    {nav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bone/50">{t("follow")}</p>
            <ul className="mt-4 flex gap-3">
              {socials.map((social) => (
                <li key={social.network}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="grid size-11 place-items-center rounded-full border border-bone/20 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-lime hover:bg-lime hover:text-ink"
                  >
                    <SocialIcon network={social.network} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          aria-hidden
          className="mt-12 select-none font-display text-[13vw] leading-[0.8] tracking-tighter text-bone/[0.06] md:text-[9vw]"
        >
          Pura vida
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-bone/10 pt-5 text-xs text-bone/50">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {t("rights")}
          </p>
          <Link href="/privacy" className="transition-colors hover:text-lime">
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
