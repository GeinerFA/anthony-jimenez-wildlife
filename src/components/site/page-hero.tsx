import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";

/** Cabecera oscura de páginas internas; el header transparente se lee sobre ella. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="grain relative overflow-hidden bg-moss text-bone">
      <div className="mx-auto max-w-screen-2xl px-5 pb-20 pt-40 md:px-10 md:pb-28 md:pt-52">
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
  );
}
