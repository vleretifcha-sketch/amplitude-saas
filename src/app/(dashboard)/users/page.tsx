import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { createTranslator, getDateLocale, getLocale, translateStatus } from '@/i18n';
import type { Profile, SubscriptionStatus } from '@/lib/types';

const subTone: Record<SubscriptionStatus, 'success' | 'accent' | 'warning' | 'muted'> = {
  active: 'success',
  trial: 'accent',
  expired: 'warning',
  none: 'muted',
};

export default async function UsersPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const db = createAdminClient();
  const { data } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  const users = (data ?? []) as Profile[];

  return (
    <div>
      <PageHeader title={t('users.title')} description={t('users.description')} />
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
            {users.map((u) => (
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
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
