import {
  siDiscord,
  siFacebook,
  siGithub,
  siInstagram,
  siTelegram,
  siTiktok,
  siWhatsapp,
  siX,
  siYoutube,
} from "simple-icons";
import { Globe, Mail } from "lucide-react";

const BRAND: Record<string, { path: string }> = {
  instagram: siInstagram,
  facebook: siFacebook,
  youtube: siYoutube,
  github: siGithub,
  x: siX,
  twitter: siX,
  tiktok: siTiktok,
  whatsapp: siWhatsapp,
  telegram: siTelegram,
  discord: siDiscord,
};

// Simple "in" mark (not included in simple-icons)
const LINKEDIN =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z";

export function SocialIcon({ platform, className = "size-4" }: { platform: string; className?: string }) {
  const key = platform.toLowerCase();
  if (key === "email") return <Mail className={className} aria-hidden />;
  const path = key === "linkedin" ? LINKEDIN : BRAND[key]?.path;
  if (!path) return <Globe className={className} aria-hidden />;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}

export function socialHref(platform: string, url: string) {
  if (platform.toLowerCase() === "email" && !url.startsWith("mailto:")) return `mailto:${url}`;
  return url;
}
