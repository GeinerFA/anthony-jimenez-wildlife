"use client";

import { ChevronDown, Globe, Menu, User, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_OUT_EXPO } from "@/components/motion/reveal";
import { tourCategoryConfig, tourSubCategories } from "@/config/tour-categories";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./logo";

const navItems = [
  { href: "/", key: "home" },
  { href: "/tours", key: "tours" },
  { href: "/services", key: "services" },
  { href: "/contact", key: "contact" },
] as const;

/** Secciones de /tours que se despliegan bajo "Tours": enlazan a su ancla dentro de la misma página. */
const tourLinks = tourSubCategories.map((category) => ({
  href: { pathname: "/tours", hash: tourCategoryConfig[category].anchor } as const,
  key: tourCategoryConfig[category].messageKey,
}));

export function SiteHeader() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const otherLocale = locale === "es" ? "en" : "es";

  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Tras elegir algo en el submenú de Tours queda cerrado aunque el cursor siga encima; se rearma al salir.
  const [toursDismissed, setToursDismissed] = useState(false);
  const dismissTours = (event: { currentTarget: HTMLElement }) => {
    event.currentTarget.blur();
    setToursDismissed(true);
  };
  // Abre con el cursor encima o al llegar con el teclado (Tab), salvo recién elegida una opción.
  // Clases completas (no armadas por partes) para que Tailwind las genere.
  const toursPanelOpen = toursDismissed
    ? ""
    : "group-hover/tours:visible group-hover/tours:translate-y-0 group-hover/tours:opacity-100 group-focus-within/tours:visible group-focus-within/tours:translate-y-0 group-focus-within/tours:opacity-100";
  const toursChevronOpen = toursDismissed ? "" : "group-hover/tours:rotate-180 group-focus-within/tours:rotate-180";

  // Siempre visible (fija arriba); al bajar toma fondo oscuro para leerse sobre cualquier sección.
  useMotionValueEvent(scrollY, "change", (current) => setSolid(current > 40));

  // Cierra el menú al navegar.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Enlace al otro idioma. En páginas dinámicas (/tours/[slug]) se conserva el slug;
  // la página de destino redirige al slug traducido.
  const localeHref = { pathname, params };

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
                  <li
                    key={item.href}
                    className={item.href === "/tours" ? "group/tours relative" : undefined}
                    onMouseLeave={item.href === "/tours" ? () => setToursDismissed(false) : undefined}
                  >
                    <Link
                      href={item.href}
                      onClick={item.href === "/tours" ? dismissTours : undefined}
                      className="group relative inline-flex items-center gap-1 py-2 text-sm font-medium uppercase tracking-[0.16em]"
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      {t(item.key)}
                      {item.href === "/tours" && (
                        <ChevronDown
                          aria-hidden
                          className={`size-3.5 transition-transform duration-300 ${toursChevronOpen}`}
                        />
                      )}
                      <span
                        aria-hidden
                        className={`absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-lime transition-transform duration-500 ease-out-expo ${
                          isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </Link>

                    {/* Submenú: se abre con el cursor encima o al llegar con el teclado (Tab). El pt-4 hace de
                        puente invisible entre el enlace y el panel para que no se cierre al bajar el cursor. */}
                    {item.href === "/tours" && (
                      <div
                        className={`invisible absolute left-1/2 top-full z-10 -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition-all duration-300 ease-out-expo ${toursPanelOpen}`}
                      >
                        <ul aria-label={t("toursMenu")} className="min-w-60 rounded-sm border border-bone/10 bg-ink/90 p-2 shadow-2xl backdrop-blur-lg">
                          {tourLinks.map((link) => (
                            <li key={link.key}>
                              <Link
                                href={link.href}
                                onClick={dismissTours}
                                className="block whitespace-nowrap rounded-sm px-4 py-3 text-sm font-medium tracking-wide text-bone/85 transition-colors hover:bg-bone/10 hover:text-lime"
                              >
                                {t(link.key)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* En celular, idioma y panel viven dentro del menú: en la barra solo queda el botón del menú. */}
              <Link
                // @ts-expect-error -- los params corresponden al pathname actual
                href={localeHref}
                locale={otherLocale}
                hrefLang={otherLocale}
                lang={otherLocale}
                aria-label={t("switchLocale")}
                title={t("switchLocale")}
                className="group hidden h-11 items-center justify-center gap-2 rounded-full border border-bone/30 px-3.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-500 hover:border-lime hover:text-lime md:inline-flex"
              >
                <Globe className="size-[1.1rem] transition-transform duration-700 ease-out-expo group-hover:rotate-180" aria-hidden />
                <span aria-hidden>{otherLocale}</span>
              </Link>

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

              {/* Desde md, siempre el último a la derecha. El panel vive fuera de las rutas con idioma (/admin):
                  Link de Next, no el de next-intl. */}
              <NextLink
                href="/admin"
                prefetch={false}
                aria-label={t("admin")}
                title={t("admin")}
                className="hidden size-11 place-items-center rounded-full border border-bone/30 transition-colors duration-500 hover:border-lime hover:text-lime md:grid"
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
                    {item.href === "/tours" && (
                      <ul aria-label={t("toursMenu")} className="mb-2 mt-1 space-y-1 border-l border-bone/20 pl-5">
                        {tourLinks.map((link) => (
                          <li key={link.key}>
                            <Link
                              href={link.href}
                              // Ya en /tours el pathname no cambia y el menú no se cerraría solo.
                              onClick={() => setMenuOpen(false)}
                              className="block py-1 text-2xl text-bone/75 transition-colors hover:text-lime"
                            >
                              {t(link.key)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </li>
              ))}
            </motion.ul>

            <motion.div
              className="flex flex-col gap-3 border-t border-bone/15 pt-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.5 }}
            >
              <Link
                // @ts-expect-error -- los params corresponden al pathname actual
                href={localeHref}
                locale={otherLocale}
                hrefLang={otherLocale}
                lang={otherLocale}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-2 text-lg transition-colors hover:text-lime"
              >
                <span className="grid size-11 place-items-center rounded-full border border-bone/30">
                  <Globe className="size-5" aria-hidden />
                </span>
                {t("switchLocale")}
              </Link>
              <NextLink
                href="/admin"
                prefetch={false}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-2 text-lg transition-colors hover:text-lime"
              >
                <span className="grid size-11 place-items-center rounded-full border border-bone/30">
                  <User className="size-5" aria-hidden />
                </span>
                {t("admin")}
              </NextLink>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
