"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO } from "@/components/motion/reveal";

/** Transición de entrada en cada navegación entre páginas. */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
