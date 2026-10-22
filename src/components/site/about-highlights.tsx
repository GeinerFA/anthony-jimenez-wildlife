import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CountUp } from "@/components/motion/count-up";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { SocialIcon, socialNetworkNames } from "@/components/ui/social-icon";
import { formatCompact } from "@/lib/format";
import type { AboutPartner, AboutStat } from "@/server/about";

// Clases completas (no armadas con plantillas) para que Tailwind las genere.
const gridColumns = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" } as const;

/**
 * Cifras de "Acerca de mí" (seguidores y datos propios) que cuentan desde 0 al entrar en pantalla.
 * Las de una red enlazan a su perfil. `tone`: "dark" sobre fondo ink, "light" sobre fondo claro.
 */
export function StatsGrid({ stats, tone }: { stats: AboutStat[]; tone: "dark" | "light" }) {
  const t = useTranslations("About");
  const locale = useLocale();
  const dark = tone === "dark";
  // Con 1 a 3 cifras, una columna por cifra desde sm; con 4 o más, 2 por fila en celular y 4 desde lg.
  const columns = gridColumns[Math.min(stats.length, 4) as 1 | 2 | 3 | 4];

  return (
    <RevealGroup className={`grid gap-px overflow-hidden rounded-sm ${columns} ${dark ? "bg-bone/10" : "bg-ink/10"}`}>
      {stats.map((stat) => {
        const content = (
          <>
            <span className={`grid size-11 place-items-center rounded-full ${dark ? "bg-bone/10 text-lime" : "bg-moss text-lime"}`}>
              {stat.network ? <SocialIcon network={stat.network} className="size-4" /> : <Sparkles className="size-4" aria-hidden />}
            </span>
            <CountUp value={stat.value} suffix={stat.suffix} locale={locale} className="mt-6 block font-display text-5xl leading-none tracking-tight md:text-6xl" />
            <span className={`mt-3 block text-sm leading-snug md:text-base ${dark ? "text-bone/70" : "text-ink/70"}`}>{stat.label}</span>
          </>
        );
        const cell = `block h-full p-6 md:p-8 ${dark ? "bg-ink" : "bg-bone"}`;
        return (
          <RevealItem key={stat.id}>
            {stat.href && stat.network ? (
              <a
                href={stat.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${formatCompact(stat.value, locale)}${stat.suffix ?? ""} ${stat.label} · ${t("followOn", { network: socialNetworkNames[stat.network] })}`}
                className={`${cell} transition-colors duration-500 ${dark ? "hover:bg-ink-soft" : "hover:bg-mist"}`}
              >
                {content}
              </a>
            ) : (
              <div className={cell}>{content}</div>
            )}
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}

/**
 * Logos de los aliados: en gris hasta pasar el cursor. Con `detailed`, el nombre y la descripción
 * debajo de cada logo (página "Acerca de mí"); sin él, solo los logos (franja del inicio).
 */
export function PartnerLogos({ partners, detailed = false }: { partners: AboutPartner[]; detailed?: boolean }) {
  const t = useTranslations("About");

  return (
    <RevealGroup className={`grid gap-4 ${detailed ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`} stagger={0.06}>
      {partners.map((partner) => {
        const logo = (
          <span className="relative block h-20 w-full md:h-24">
            <CloudinaryImage
              src={partner.logo.url}
              alt={partner.name}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain opacity-80 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
            />
          </span>
        );
        const card = "group flex h-full flex-col rounded-sm border border-ink/10 bg-white p-5 transition-colors duration-500";
        const body = (
          <>
            {logo}
            {detailed && (
              <span className="mt-5 block border-t border-ink/10 pt-4">
                <span className="block font-display text-xl">{partner.name}</span>
                {partner.description && <span className="mt-1 block text-sm leading-relaxed text-ink/65">{partner.description}</span>}
              </span>
            )}
          </>
        );
        return (
          <RevealItem key={partner.id}>
            {partner.url ? (
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                title={t("visitPartner", { name: partner.name })}
                className={`${card} hover:border-fern/40`}
              >
                {body}
              </a>
            ) : (
              <div className={card}>{body}</div>
            )}
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
