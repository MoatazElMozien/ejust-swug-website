import Link from "next/link";
import type { SocialLink } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { SocialIcon, socialHref } from "@/components/SocialIcon";
import { site } from "@/lib/site";

export function Footer({ socials }: { socials: SocialLink[] }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-muted">{site.description}</p>
        </div>
        <div>
          <p className="label mb-4 text-faint">Explore</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-fg" href="/projects">All projects</Link></li>
            <li><Link className="hover:text-fg" href="/#about">About the club</Link></li>
            <li><Link className="hover:text-fg" href="/#connect">Join & connect</Link></li>
          </ul>
        </div>
        <div>
          <p className="label mb-4 text-faint">Follow us</p>
          {socials.length ? (
            <ul className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={socialHref(s.platform, s.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    title={s.platform}
                    className="grid size-10 place-items-center rounded-md border border-line text-muted transition-colors hover:border-brand hover:text-fg"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">Links coming soon.</p>
          )}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} {site.name} · {site.university}</span>
          <span>{site.location}</span>
        </div>
      </div>
    </footer>
  );
}
