import { siFacebook, siInstagram, siTiktok, siWhatsapp } from "simple-icons";

export const socialIcons = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  facebook: siFacebook,
  tiktok: siTiktok,
} as const;

export type SocialNetwork = keyof typeof socialIcons;

export const socialNetworkNames: Record<SocialNetwork, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d={socialIcons[network].path} />
    </svg>
  );
}
