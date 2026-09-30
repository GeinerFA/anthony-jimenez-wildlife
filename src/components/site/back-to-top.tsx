"use client";

import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Botón flotante discreto para volver arriba; aparece tras bajar más de una pantalla. */
export function BackToTop() {
  const t = useTranslations("Nav");
  const lenis = useLenis();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => setVisible(current > window.innerHeight));

  const scrollToTop = () => {
    // Con Lenis el scroll nativo pelearía con su animación; sin él (movimiento reducido), salto directo.
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0 });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label={t("backToTop")}
          title={t("backToTop")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-30 grid size-10 place-items-center rounded-full border border-bone/20 bg-ink/60 text-bone shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-lime hover:bg-lime hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime md:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:right-6"
        >
          <ArrowUp className="size-4" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
