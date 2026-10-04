import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { SectionFade } from "@/components/ui/section-fade";
import type { HeroBackground } from "@/server/heroes";
import { HeroMedia } from "./hero-media";

type Props = {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  /** Foto o video de fondo configurado en el panel; sin él, fondo verde liso. */
  media?: HeroBackground | null;
};

/**
 * Cabecera oscura de páginas internas; el header transparente se lee sobre ella.
 * Altura mínima fija con el texto abajo: todas miden lo mismo aunque su texto sea más corto.
 */
export function PageHero({ eyebrow, title, children, media }: Props) {
  return (
    <>
      <section className="grain relative flex min-h-[42rem] flex-col justify-end md:min-h-[48rem] overflow-hidden bg-moss text-bone">
        {media && (
          <>
            {/* object-[50%_35%]: encuadre vertical del video. Menos de 50% muestra más de arriba (la imagen "baja"). */}
            <HeroMedia media={media} zoom={false} position="object-[50%_35%]" />
            {/* Mismo velo que el hero del inicio: oscuro abajo (donde va el texto) y termina en ink sólido. */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />
          </>
        )}
        <div className="relative mx-auto w-full max-w-screen-2xl px-5 pb-20 pt-40 md:px-10 md:pb-28 md:pt-52">
          <Reveal y={16}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-lime">
              <span aria-hidden className="h-px w-10 bg-lime" />
              {eyebrow}
            </p>
          </Reveal>
          <SplitText
            as="h1"
            text={title}
            immediate
            delay={0.15}
            className="mt-6 max-w-5xl font-display text-5xl leading-[1.02] tracking-tight md:text-8xl"
          />
          {children && (
            <Reveal delay={0.5} className="mt-8 max-w-2xl text-lg text-bone/75 md:text-xl">
              {children}
            </Reveal>
          )}
        </div>
      </section>
      {/* Difumina el final del hero en el contenido, como en el inicio. */}
      <SectionFade from={media ? "var(--color-ink)" : "var(--color-moss)"} to="var(--color-bone)" />
    </>
  );
}
