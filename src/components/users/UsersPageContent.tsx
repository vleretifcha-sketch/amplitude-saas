import Link from 'next/link';
import { getStripeProductsWithStats } from '@/actions/stripe-products';
import { fetchUsersWithSubscriptions } from '@/lib/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { UsersTable } from '@/components/users/UsersTable';
import { createTranslator, getDateLocale } from '@/i18n';

export async function UsersPageContent({ locale }: { locale: 'fr' | 'en' }) {
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);

  const [users, stripeProducts] = await Promise.all([
    fetchUsersWithSubscriptions(500),
    getStripeProductsWithStats(),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader title={t('users.listTitle')} description={t('users.listDescription')} />

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
        <UsersTable users={users} dateLocale={dateLocale} stripeProducts={stripeProducts} />
      </section>
    </div>
  );
}
