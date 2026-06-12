import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripeProductsWithStats } from '@/actions/stripe-products';
import { fetchProfilesForList } from '@/lib/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StripeProductsPanel } from '@/components/stripe/StripeProductsPanel';
import { UsersTable } from '@/components/users/UsersTable';
import { createTranslator, getDateLocale } from '@/i18n';

export async function UsersPageContent({ locale }: { locale: 'fr' | 'en' }) {
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const db = createAdminClient();

  const [profiles, { data: subs }, stripeProducts] = await Promise.all([
    fetchProfilesForList(500),
    db.from('subscriptions').select('status, price_monthly'),
    getStripeProductsWithStats(),
  ]);

  const users = profiles;
  const activeCount = users.filter((u) => u.subscription_status === 'active' || u.subscription_status === 'trial').length;
  const mrr = (subs ?? [])
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.price_monthly), 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('users.title')}
        description={t('users.descriptionMerged', { active: activeCount, mrr: mrr.toFixed(0) })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-secondary">{t('dashboard.activeSubscriptions')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t('users.estimatedMrr')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">€{mrr.toFixed(0)}</p>
        </Card>
      </div>

      <StripeProductsPanel products={stripeProducts} />

      <section className="space-y-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('users.sectionUsersLabel')}</p>
            <h2 className="mt-1 text-xl font-semibold">{t('users.sectionUsersTitle')}</h2>
            <p className="mt-1 text-sm text-secondary">{t('users.sectionUsersDescription')}</p>
          </div>
          <Link href="/users/new">
            <Button>{t('users.new')}</Button>
          </Link>
        </div>
        <UsersTable users={users} dateLocale={dateLocale} />
      </section>
    </div>
  );
}
