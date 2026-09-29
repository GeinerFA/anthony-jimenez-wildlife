"use client";

import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "./reveal";

type SplitTextProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  /** true: anima al montar (hero). false: anima al entrar en pantalla. */
  immediate?: boolean;
};

/**
 * Titular editorial: cada palabra sube desde detrás de una máscara.
 * Los lectores de pantalla leen el texto completo, no las palabras sueltas.
 */
export function SplitText({ text, as = "h2", className, delay = 0, immediate = false }: SplitTextProps) {
  const Tag = motion[as];
  const words = text.split(" ");
  const trigger = immediate
    ? { animate: "visible" as const }
    : { whileInView: "visible" as const, viewport: { once: true, margin: "0px 0px -10% 0px" } };

  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      {...trigger}
      variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-top">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%", rotate: 4 },
              visible: { y: "0%", rotate: 0, transition: { duration: 1.2, ease: EASE_OUT_EXPO } },
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
