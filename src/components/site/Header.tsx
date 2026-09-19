"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/#about", label: "About" },
  { href: "/#team", label: "Team" },
  { href: "/#connect", label: "Connect" },
];

export function Header({ showTeam }: { showTeam: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const nav = NAV.filter((n) => showTeam || n.label !== "Team");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        scrolled || open ? "border-b border-line bg-ink/85 backdrop-blur-lg" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition-colors hover:text-fg ${
                pathname.startsWith("/projects") && n.href === "/projects" ? "text-fg" : "text-muted"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/projects" className="btn btn-primary">
            Explore projects
          </Link>
        </nav>
        <button
          className="grid size-10 place-items-center rounded-md border border-line md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line px-4 pb-4 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-sm text-muted">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
