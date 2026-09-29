import { useTranslations } from "next-intl";
import { siteConfig, whatsappUrl } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { SocialIcon, type SocialNetwork } from "@/components/ui/social-icon";
import { Logo } from "./logo";

const footerNav = [
  { href: "/", key: "home" },
  { href: "/tours", key: "tours" },
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
      <div className="mx-auto max-w-screen-2xl px-5 pb-10 pt-24 md:px-10">
        <div className="grid gap-16 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo size="lg" />
            <p className="mt-6 max-w-sm text-bone/70">{t("tagline")}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-3">
              {footerNav.map((item) => (
                <li key={item.href}>
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
          className="mt-24 select-none font-display text-[18vw] leading-[0.8] tracking-tighter text-bone/[0.06] md:text-[14vw]"
        >
          Pura vida
        </p>

        <p className="mt-10 border-t border-bone/10 pt-6 text-xs text-bone/50">
          © {new Date().getFullYear()} {siteConfig.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
