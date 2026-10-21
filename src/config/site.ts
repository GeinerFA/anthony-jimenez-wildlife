// PENDIENTE: reemplazar el número de WhatsApp, Facebook y TikTok por los reales de Anthony Jimenez Wildlife.
export const siteConfig = {
  name: "Anthony Jimenez Wildlife",
  /** Variantes con las que la gente busca la marca (datos estructurados WebSite). */
  alternateNames: ["Anthony Jimenez", "Anthony Jimenez Wildlife Costa Rica", "AJ Wildlife"],
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  email: "info@anthonyjimenezwildlife.com",
  social: {
    /** Número en formato internacional, solo dígitos (506 = Costa Rica). */
    whatsapp: "50663372143",
    instagram: "https://www.instagram.com/anthony_jimenez_wildlife_",
    facebook: "https://www.facebook.com/anthony.jimenez.56",
    tiktok: "https://www.tiktok.com/@anthonyjimenezwildlife",
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
