import type { CSSProperties } from "react";

type Props = {
  /** Color del bloque de arriba (cualquier color CSS, p. ej. "var(--color-ink)"). */
  from: string;
  /** Color del bloque de abajo. */
  to: string;
  className?: string;
};

/** Franja que difumina un bloque en el siguiente, en lugar de un corte recto entre colores. */
export function SectionFade({ from, to, className = "" }: Props) {
  return (
    <div
      aria-hidden
      className={`section-fade pointer-events-none relative -mt-px h-10 md:h-16 ${className}`}
      style={{ "--fade-from": from, "--fade-to": to } as CSSProperties}
    />
  );
}
