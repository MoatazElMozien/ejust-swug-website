import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: { default: `${site.name} — ${site.fullName}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.fullName}`,
    description: site.description,
    images: ["/assets/images/logo.png"],
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#07080b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
