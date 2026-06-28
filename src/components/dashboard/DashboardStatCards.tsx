'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/i18n/client';
import type { DashboardStats } from '@/lib/types';

const statLinks: Record<keyof DashboardStats, string> = {
  users: '/users',
  activeSubscriptions: '/users/subscriptions',
  programs: '/methods',
  publishedVideos: '/videos',
  sessionsThisMonth: '/users',
  communityPosts: '/community',
};

export function DashboardStatCards({ stats }: { stats: DashboardStats }) {
  const { t } = useLocale();

  const statLabels: { key: keyof DashboardStats; label: string }[] = [
    { key: 'users', label: t('dashboard.users') },
    { key: 'activeSubscriptions', label: t('dashboard.activeSubscriptions') },
    { key: 'programs', label: t('dashboard.programs') },
    { key: 'publishedVideos', label: t('dashboard.publishedSessions') },
    { key: 'sessionsThisMonth', label: t('dashboard.sessionsThisMonth') },
    { key: 'communityPosts', label: t('dashboard.communityPosts') },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {statLabels.map(({ key, label }) => (
        <Link key={key} href={statLinks[key]} className="group block">
          <Card className="transition-colors group-hover:border-accent/40 group-hover:bg-surface-muted/50">
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-accent">{stats[key]}</p>
            <p className="mt-3 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
              {t('dashboard.viewSection')}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
