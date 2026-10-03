// PENDIENTE: reemplazar el número de WhatsApp, Facebook y TikTok por los reales de Natural Land CR.
export const siteConfig = {
  name: "Natural Land CR",
  /** Variantes con las que la gente busca la marca (datos estructurados WebSite). */
  alternateNames: ["Natural Land", "Natural Land Costa Rica", "NaturalLandCR", "Tierras Naturales Costa Rica"],
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  email: "info@naturallandcr.com",
  social: {
    /** Número en formato internacional, solo dígitos (506 = Costa Rica). */
    whatsapp: "50663372143",
    instagram: "https://www.instagram.com/tierras_naturales_costarica",
    facebook: "https://www.facebook.com/naturallandcr",
    tiktok: "https://www.tiktok.com/@naturallandcr",
  },
} as const;

export function whatsappUrl(message: string) {
  return `https://wa.me/${siteConfig.social.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const socialProfiles = [
  siteConfig.social.instagram,
  siteConfig.social.facebook,
  siteConfig.social.tiktok,
];
