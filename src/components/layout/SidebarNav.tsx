'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

export type SidebarNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type SidebarNavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: Omit<SidebarNavLink, 'icon'>[];
};

function linkClass(active: boolean) {
  return `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
    active
      ? 'bg-button text-inverse font-medium'
      : 'text-secondary hover:bg-surface-muted hover:text-foreground'
  }`;
}

function subLinkClass(active: boolean) {
  return `flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${
    active
      ? 'bg-surface-muted font-medium text-foreground'
      : 'text-secondary hover:bg-surface-muted/60 hover:text-foreground'
  }`;
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname: string, items: Omit<SidebarNavLink, 'icon'>[]) {
  return items.some((item) => isActive(pathname, item.href));
}

export function SidebarNavLinkItem({ href, label, icon: Icon }: SidebarNavLink) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link href={href} prefetch className={linkClass(active)}>
      <Icon size={18} className="shrink-0" />
      <span className="min-w-0 leading-snug">{label}</span>
    </Link>
  );
}

export function SidebarNavGroupSection({ group }: { group: SidebarNavGroup }) {
  const pathname = usePathname();
  const childActive = groupIsActive(pathname, group.items);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
          childActive
            ? 'bg-surface-muted font-medium text-foreground'
            : 'text-secondary hover:bg-surface-muted hover:text-foreground'
        }`}
        aria-expanded={open}
      >
        <group.icon size={18} className="shrink-0" />
        <span className="min-w-0 flex-1 leading-snug">{group.label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? (
        <div className="ml-4 space-y-0.5 border-l border-border-subtle pl-2">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={subLinkClass(isActive(pathname, item.href))}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
