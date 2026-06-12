import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UsersTable } from '@/components/users/UsersTable';
import { createTranslator, getDateLocale, getLocale } from '@/i18n';
import type { Profile } from '@/lib/types';

export default async function UsersPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const db = createAdminClient();

  const [{ data: profiles }, { data: subs }] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
    db.from('subscriptions').select('status, price_monthly'),
  ]);

  const users = (profiles ?? []) as Profile[];
  const activeCount = users.filter((u) => u.subscription_status === 'active').length;
  const mrr = (subs ?? [])
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.price_monthly), 0);

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        description={t('users.descriptionMerged', { active: activeCount, mrr: mrr.toFixed(0) })}
        action={
          <Link href="/users/new">
            <Button>{t('users.new')}</Button>
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-secondary">{t('dashboard.activeSubscriptions')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t('users.estimatedMrr')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">€{mrr.toFixed(0)}</p>
        </Card>
      </div>
      <UsersTable users={users} dateLocale={dateLocale} />
    </div>
  );
}
