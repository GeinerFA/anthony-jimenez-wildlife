"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_OUT_EXPO } from "@/components/motion/reveal";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./logo";

const navItems = [
  { href: "/", key: "home" },
  { href: "/tours", key: "tours" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteHeader() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const otherLocale = locale === "es" ? "en" : "es";

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setSolid(current > 40);
    setHidden(current > previous && current > 160 && !menuOpen);
  });

  // Cierra el menú al navegar.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // En páginas dinámicas (/tours/[slug]) se conserva el slug; la página de destino redirige al slug traducido.
  const localeSwitch = (
    <Link
      // @ts-expect-error -- los params corresponden al pathname actual
      href={{ pathname, params }}
      locale={otherLocale}
      className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 transition-opacity hover:opacity-100"
      hrefLang={otherLocale}
    >
      {t("switchLocale")}
    </Link>
  );

  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>

      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        <div
          className={`transition-colors duration-500 ${
            solid && !menuOpen ? "bg-ink/85 backdrop-blur-md" : "bg-transparent"
          } text-bone`}
        >
          <nav className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-5 md:px-10">
            <Link href="/" aria-label="Natural Land CR" className="relative z-10">
              <Logo />
            </Link>

            <ul className="hidden items-center gap-10 md:flex">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group relative py-2 text-sm font-medium uppercase tracking-[0.16em]"
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {t(item.key)}
                    <span
                      aria-hidden
                      className={`absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-sun transition-transform duration-500 ease-out-expo ${
                        isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              ))}
              <li className="border-l border-bone/25 pl-10">{localeSwitch}</li>
            </ul>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="relative z-10 grid size-11 place-items-center rounded-full border border-bone/30 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="grain fixed inset-0 z-40 flex flex-col justify-between bg-moss px-5 pb-10 pt-28 text-bone md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            data-lenis-prevent
          >
            <motion.ul
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } } }}
            >
              {navItems.map((item) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.div
                    variants={{
                      hidden: { y: "100%" },
                      visible: { y: "0%", transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`block font-display text-6xl leading-tight ${isActive(item.href) ? "text-sun" : ""}`}
                    >
                      {t(item.key)}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </motion.ul>
            <div className="border-t border-bone/20 pt-6">{localeSwitch}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
