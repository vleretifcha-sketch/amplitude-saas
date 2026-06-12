'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  Dumbbell,
  Users,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LanguageSwitcher, useLocale } from '@/i18n/client';
import { AmplitudeLogo } from '@/components/layout/AmplitudeLogo';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const nav = [
    { href: '/', label: t('nav.overview'), icon: LayoutDashboard },
    { href: '/programs', label: t('nav.programs'), icon: Layers },
    { href: '/videos', label: t('nav.videos'), icon: PlayCircle },
    { href: '/exercises', label: t('nav.exercises'), icon: Dumbbell },
    { href: '/users', label: t('nav.users'), icon: Users },
    { href: '/community', label: t('nav.community'), icon: MessageSquare },
  ];

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full w-[17rem] shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-surface px-4 py-6">
      <div className="mb-8 px-2">
        <AmplitudeLogo className="h-10 w-auto" priority />
        <p className="mt-2 text-sm font-medium text-muted">{t('nav.admin')}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-button text-inverse font-medium'
                  : 'text-secondary hover:bg-surface-muted hover:text-foreground'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="min-w-0 leading-snug">{label}</span>
            </Link>
          );
        })}
      </nav>
      <LanguageSwitcher className="mt-6" />
      <button
        type="button"
        onClick={logout}
        className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-secondary hover:bg-surface-muted hover:text-foreground"
      >
        <LogOut size={18} />
        {t('nav.logout')}
      </button>
    </aside>
  );
}
