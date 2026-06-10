'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import { translateStatus } from '@/i18n/translator';
import type { Profile, SubscriptionStatus } from '@/lib/types';

const subTone: Record<SubscriptionStatus, 'success' | 'accent' | 'warning' | 'muted'> = {
  active: 'success',
  trial: 'accent',
  expired: 'warning',
  none: 'muted',
};

export function UsersTable({ users, dateLocale }: { users: Profile[]; dateLocale: string }) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q) || user.email.toLowerCase().includes(q);
    });
  }, [query, users]);

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('users.searchPlaceholder')}
        aria-label={t('users.searchPlaceholder')}
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('users.colName')}</th>
              <th className="px-6 py-3">{t('users.colEmail')}</th>
              <th className="px-6 py-3">{t('users.colSubscription')}</th>
              <th className="px-6 py-3">{t('users.colJoined')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted">
                  {t('users.searchEmpty')}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-border-subtle/60 hover:bg-surface-muted/40">
                  <td className="px-6 py-4">
                    <Link href={`/users/${u.id}`} className="font-medium hover:text-accent">
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || t('common.dash')}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    <Badge tone={subTone[u.subscription_status]}>
                      {translateStatus(t, u.subscription_status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(u.created_at).toLocaleDateString(dateLocale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
