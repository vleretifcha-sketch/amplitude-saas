'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  LogOut,
  Settings,
  FolderOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LanguageSwitcher, useLocale } from '@/i18n/client';
import { AmplitudeLogo } from '@/components/layout/AmplitudeLogo';
import { SidebarNavGroupSection, SidebarNavLinkItem } from '@/components/layout/SidebarNav';

export function Sidebar() {
  const router = useRouter();
  const { t } = useLocale();

  const contentGroup = {
    id: 'content',
    label: t('nav.content'),
    icon: FolderOpen,
    items: [
      { href: '/methods', label: t('nav.programs') },
      { href: '/videos', label: t('nav.videos') },
      { href: '/exercises', label: t('nav.exercises') },
    ],
  };

  const usersGroup = {
    id: 'users',
    label: t('nav.users'),
    icon: Users,
    items: [
      { href: '/users', label: t('nav.usersList'), excludePrefix: '/users/subscriptions' },
      { href: '/users/subscriptions', label: t('nav.subscriptions') },
    ],
  };

  const mailingGroup = {
    id: 'mailing',
    label: t('nav.mailing'),
    icon: Mail,
    items: [
      { href: '/newsletter/campaigns', label: t('nav.mailingCampaigns') },
      { href: '/newsletter/campaigns/new', label: t('nav.mailingNewCampaign') },
      { href: '/newsletter/subscribers', label: t('nav.mailingSubscribers') },
    ],
  };

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
        <SidebarNavLinkItem href="/" label={t('nav.overview')} icon={LayoutDashboard} />
        <SidebarNavGroupSection group={contentGroup} />
        <SidebarNavGroupSection group={usersGroup} />
        <SidebarNavGroupSection group={mailingGroup} />
        <SidebarNavLinkItem href="/community" label={t('nav.community')} icon={MessageSquare} />
        <SidebarNavLinkItem href="/settings" label={t('nav.settings')} icon={Settings} />
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
