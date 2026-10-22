"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { CountUp } from "@/components/motion/count-up";
import { EASE_OUT_EXPO } from "@/components/motion/reveal";
import { SocialIcon, socialNetworkNames } from "@/components/ui/social-icon";
import { formatCompact, formatPercent } from "@/lib/format";
import type { AboutStat } from "@/server/about";

export type NetworkStat = AboutStat & { network: NonNullable<AboutStat["network"]> };

/**
 * "Comunidad en redes" (fondo oscuro): el total de seguidores como cifra principal y una barra por red,
 * de largo proporcional a la red más grande, con su cantidad y su parte del total.
 * Un solo color: el objetivo es comparar tamaños; cada barra lleva el ícono y el nombre de su red,
 * y cada fila se lee completa en texto (lectores de pantalla) sin depender de la barra.
 */
export function CommunityChart({ stats }: { stats: NetworkStat[] }) {
  const t = useTranslations("About");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const max = Math.max(...stats.map((stat) => stat.value), 1);
  const networks = new Intl.ListFormat(locale, { type: "conjunction" }).format(stats.map((stat) => socialNetworkNames[stat.network]));

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
      {/* Cifra principal */}
      <div className="lg:col-span-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-bone/60">{t("communityLabel")}</p>
        <CountUp value={total} locale={locale} className="mt-4 block font-display text-7xl leading-none tracking-tight text-bone md:text-8xl" />
        <p className="mt-4 max-w-sm text-bone/70">{t("communityCaption", { networks })}</p>
      </div>

      {/* Una barra por red */}
      <ul className="space-y-8 lg:col-span-7">
        {stats.map((stat, index) => {
          const name = socialNetworkNames[stat.network];
          const value = `${formatCompact(stat.value, locale)}${stat.suffix ?? ""}`;
          const share = t("shareOfTotal", { percent: formatPercent(stat.value / (total || 1), locale) });
          const width = `${Math.max((stat.value / max) * 100, 2)}%`;
          return (
            <li key={stat.id}>
              <a
                href={stat.href ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name}: ${value} ${stat.label}, ${share}. ${t("followOn", { network: name })}`}
                className="group block"
              >
                <div className="flex items-end justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bone/10 text-lime transition-colors duration-500 group-hover:bg-lime group-hover:text-ink">
                      <SocialIcon network={stat.network} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-bone">{name}</span>
                      <span className="block truncate text-sm text-bone/55">{stat.label}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <CountUp value={stat.value} suffix={stat.suffix} locale={locale} className="block font-display text-3xl leading-none text-bone md:text-4xl" />
                    <span className="mt-1 block text-xs text-bone/55">{share}</span>
                  </span>
                </div>
                {/* Pista y barra: 12 px de alto, base recta y punta redondeada; crece desde la izquierda. */}
                <div className="mt-3 h-3 rounded-r-[4px] bg-bone/10">
                  <motion.div
                    className="h-full rounded-r-[4px] bg-lime transition-colors duration-500 group-hover:bg-white"
                    initial={{ width: reduceMotion ? width : "0%" }}
                    whileInView={{ width }}
                    viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                    transition={{ duration: 1.6, ease: EASE_OUT_EXPO, delay: 0.15 * index }}
                  />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
