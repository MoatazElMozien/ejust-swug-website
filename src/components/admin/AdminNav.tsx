"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Share2,
  UserCog,
  Users,
  X,
  Contact,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/admin/actions/auth";
import type { SessionUser } from "@/lib/auth";

export function AdminNav({ user, pending }: { user: SessionUser; pending: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isSuper = user.role === "SUPER_ADMIN";

  const items = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban, badge: pending },
    ...(isSuper
      ? [
          { href: "/admin/team", label: "Team", icon: Contact },
          { href: "/admin/socials", label: "Social links", icon: Share2 },
          { href: "/admin/users", label: "Admin accounts", icon: Users },
        ]
      : []),
    { href: "/admin/account", label: "My account", icon: UserCog },
  ];

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active ? "bg-panel-2 text-fg" : "text-muted hover:bg-panel-2/60 hover:text-fg"
            }`}
          >
            <Icon className="size-4" />
            {it.label}
            {"badge" in it && it.badge ? (
              <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">{it.badge}</span>
            ) : null}
          </Link>
        );
      })}
      <a href="/" target="_blank" className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:text-fg">
        <ExternalLink className="size-4" /> View site
      </a>
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-4">
      <p className="truncate text-sm font-medium">{user.name}</p>
      <p className="truncate text-xs text-faint">{user.email}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="label rounded bg-panel-2 px-2 py-1 text-[10px] text-muted">
          {isSuper ? "Super admin" : "Editor"}
        </span>
        <form action={logout}>
          <button className="flex items-center gap-1.5 text-xs text-muted hover:text-fg">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/90 px-4 backdrop-blur lg:hidden">
        <Logo href="/admin" sub="Admin panel" />
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" className="grid size-9 place-items-center rounded-md border border-line">
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col border-t border-line bg-panel lg:hidden">
          {nav}
          {footer}
        </div>
      )}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-panel lg:flex">
        <div className="border-b border-line p-4">
          <Logo href="/admin" sub="Admin panel" />
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
