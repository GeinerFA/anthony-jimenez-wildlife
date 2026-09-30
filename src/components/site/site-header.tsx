"use client";

import { Globe, Menu, User, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
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
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Siempre visible (fija arriba); al bajar toma fondo oscuro para leerse sobre cualquier sección.
  useMotionValueEvent(scrollY, "change", (current) => setSolid(current > 40));

  // Cierra el menú al navegar.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Globo + código del otro idioma. En páginas dinámicas (/tours/[slug]) se conserva el slug;
  // la página de destino redirige al slug traducido.
  const localeSwitch = (
    <Link
      // @ts-expect-error -- los params corresponden al pathname actual
      href={{ pathname, params }}
      locale={otherLocale}
      hrefLang={otherLocale}
      lang={otherLocale}
      aria-label={t("switchLocale")}
      title={t("switchLocale")}
      // En celular, círculo del mismo tamaño que los otros íconos (solo el código); desde sm, globo + código.
      className="group inline-flex size-11 items-center justify-center gap-2 rounded-full border border-bone/30 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-500 hover:border-lime hover:text-lime sm:w-auto sm:px-3.5 sm:tracking-[0.16em]"
    >
      <Globe className="hidden size-[1.1rem] transition-transform duration-700 ease-out-expo group-hover:rotate-180 sm:block" aria-hidden />
      <span aria-hidden>{otherLocale}</span>
    </Link>
  );

  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>

      <header className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div
          className={`transition-colors duration-500 ${
            solid && !menuOpen ? "bg-ink/60 backdrop-blur-lg" : "bg-transparent"
          } text-bone`}
        >
          <nav className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-5 md:px-10">
            <Link href="/" aria-label="Natural Land CR" className="relative z-10">
              <Logo priority />
            </Link>

            <div className="relative z-10 flex items-center gap-2 sm:gap-3 md:gap-8">
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
                        className={`absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-lime transition-transform duration-500 ease-out-expo ${
                          isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>

              {localeSwitch}

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="grid size-11 place-items-center rounded-full border border-bone/30 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>

              {/* Siempre el último a la derecha. El panel vive fuera de las rutas con idioma (/admin):
                  Link de Next, no el de next-intl. */}
              <NextLink
                href="/admin"
                prefetch={false}
                aria-label={t("admin")}
                title={t("admin")}
                className="grid size-11 place-items-center rounded-full border border-bone/30 transition-colors duration-500 hover:border-lime hover:text-lime"
              >
                <User className="size-5" aria-hidden />
              </NextLink>
            </div>
          </nav>
        </div>
      </header>

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
                      className={`block font-display text-6xl leading-tight ${isActive(item.href) ? "text-lime" : ""}`}
                    >
                      {t(item.key)}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
