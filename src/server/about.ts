import "server-only";
import { cache } from "react";
import type { SocialNetwork } from "@/components/ui/social-icon";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";

export type AboutStat = {
  id: string;
  value: number;
  suffix: string | null;
  label: string;
  featured: boolean;
  /** Red social (ícono y enlace al perfil); null = cifra propia. */
  network: Extract<SocialNetwork, "instagram" | "facebook" | "tiktok"> | null;
  href: string | null;
};

export type AboutPartner = { id: string; name: string; url: string | null; description: string | null; logo: { url: string; width: number; height: number } };

export type AboutContent = {
  bio: string | null;
  quote: string | null;
  photo: { url: string; width: number; height: number } | null;
  stats: AboutStat[];
  partners: AboutPartner[];
};

const empty: AboutContent = { bio: null, quote: null, photo: null, stats: [], partners: [] };

/**
 * Contenido de "Acerca de mí" en el idioma pedido (si falta el inglés, el español).
 * Solo aliados visibles. Un fallo de la base no debe tumbar la página: se registra y se devuelve vacío.
 */
export const getAboutContent = cache(async (locale: Locale): Promise<AboutContent> => {
  try {
    const [profile, stats, partners] = await Promise.all([
      db.aboutProfile.findUnique({ where: { id: "about" } }),
      db.socialStat.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
      db.partner.findMany({ where: { active: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    ]);
    const en = locale === "en";

    return {
      bio: (en && profile?.bioEn) || profile?.bioEs || null,
      quote: (en && profile?.quoteEn) || profile?.quoteEs || null,
      photo:
        profile?.photoUrl && profile.photoWidth && profile.photoHeight
          ? { url: profile.photoUrl, width: profile.photoWidth, height: profile.photoHeight }
          : null,
      stats: stats.map((stat) => {
        const network = stat.network ? (stat.network.toLowerCase() as NonNullable<AboutStat["network"]>) : null;
        return {
          id: stat.id,
          value: stat.value,
          suffix: stat.suffix,
          label: (en && stat.labelEn) || stat.labelEs,
          featured: stat.featured,
          network,
          href: network ? siteConfig.social[network] : null,
        };
      }),
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        url: partner.url,
        description: (en && partner.descEn) || partner.descEs,
        logo: { url: partner.logoUrl, width: partner.logoWidth, height: partner.logoHeight },
      })),
    };
  } catch (error) {
    console.error("No se pudo leer Acerca de mí", error);
    return empty;
  }
});
