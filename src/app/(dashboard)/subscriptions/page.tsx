import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { createTranslator, getDateLocale, getLocale, translateStatus } from '@/i18n';
import type { Subscription } from '@/lib/types';

const statusTone = {
  active: 'success' as const,
  grace_period: 'accent' as const,
  cancelled: 'warning' as const,
  expired: 'muted' as const,
};

export default async function SubscriptionsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const db = createAdminClient();
  const { data } = await db
    .from('subscriptions')
    .select('*, profiles(email, first_name, last_name)')
    .order('created_at', { ascending: false });
  const subs = (data ?? []) as (Subscription & {
    profiles: { email: string; first_name: string | null; last_name: string | null } | null;
  })[];

  const mrr = subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.price_monthly), 0);

  return (
    <div>
      <PageHeader
        title={t('subscriptions.title')}
        description={t('subscriptions.description', { amount: mrr.toFixed(0) })}
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('subscriptions.colUser')}</th>
              <th className="px-6 py-3">{t('subscriptions.colProduct')}</th>
              <th className="px-6 py-3">{t('subscriptions.colStatus')}</th>
              <th className="px-6 py-3">{t('subscriptions.colPlatform')}</th>
              <th className="px-6 py-3">{t('subscriptions.colExpires')}</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => {
              const name =
                [s.profiles?.first_name, s.profiles?.last_name].filter(Boolean).join(' ') ||
                s.profiles?.email ||
                s.user_id;
              return (
                <tr key={s.id} className="border-b border-border-subtle/60 hover:bg-surface-muted/40">
                  <td className="px-6 py-4">
                    <Link href={`/users/${s.user_id}`} className="font-medium hover:text-accent">
                      {name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{s.product_id}</td>
                  <td className="px-6 py-4">
                    <Badge tone={statusTone[s.status]}>{translateStatus(t, s.status)}</Badge>
                  </td>
                  <td className="px-6 py-4 capitalize">{s.platform ?? t('common.dash')}</td>
                  <td className="px-6 py-4 text-muted">
                    {s.expires_at
                      ? new Date(s.expires_at).toLocaleDateString(dateLocale)
                      : t('common.dash')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
