"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatCompact } from "@/lib/format";
import { EASE_OUT_EXPO } from "./reveal";

type Props = {
  value: number;
  locale: string;
  /** Se muestra pegado al número: "+", "%". */
  suffix?: string | null;
  /** Segundos que tarda en llegar al valor. */
  duration?: number;
  className?: string;
};

/**
 * Número que cuenta desde 0 hasta `value` al entrar en pantalla (una sola vez), en formato corto
 * ("12 mil" / "12K"). El HTML del servidor ya trae el valor final (buscadores, sin JavaScript) y los
 * lectores de pantalla leen solo ese: la cuenta es decorativa. Con "reducir movimiento" no se anima.
 */
export function CountUp({ value, locale, suffix, duration = 2, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduceMotion = useReducedMotion();
  const final = `${formatCompact(value, locale)}${suffix ?? ""}`;

  // Al montar arranca en 0 (el padre aparece con un fade, así que no se ve el salto desde el valor final).
  useEffect(() => {
    if (!reduceMotion && ref.current) ref.current.textContent = `${formatCompact(0, locale)}${suffix ?? ""}`;
  }, [reduceMotion, locale, suffix]);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate(latest) {
        if (ref.current) ref.current.textContent = `${formatCompact(Math.round(latest), locale)}${suffix ?? ""}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, locale, suffix, duration]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden className="tabular-nums">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
