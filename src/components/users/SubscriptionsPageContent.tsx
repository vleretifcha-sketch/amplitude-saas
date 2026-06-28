import { createAdminClient } from '@/lib/supabase/admin';
import { getStripeProductsWithStats } from '@/actions/stripe-products';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StripeProductsPanel } from '@/components/stripe/StripeProductsPanel';
import { formatStripeProductPrice } from '@/lib/stripe/product';
import { createTranslator } from '@/i18n';

export async function SubscriptionsPageContent({ locale }: { locale: 'fr' | 'en' }) {
  const t = createTranslator(locale);
  const db = createAdminClient();

  const [{ data: subs }, stripeProducts] = await Promise.all([
    db.from('subscriptions').select('status, price_monthly'),
    getStripeProductsWithStats(),
  ]);

  const mrr = (subs ?? [])
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.price_monthly), 0);
  const totalActiveSubscribers = stripeProducts.reduce((sum, product) => sum + product.activeSubscribers, 0);
  const activeProducts = stripeProducts.filter((product) => product.active);

  const priceLabels = {
    monthShort: t('stripe.monthShort'),
    yearShort: t('stripe.yearShort'),
    lifetime: t('stripe.billingLifetime'),
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('subscriptions.title')}
        description={t('subscriptions.description', { amount: mrr.toFixed(0) })}
      />

      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('subscriptions.statsLabel')}</p>
          <p className="mt-1 text-sm text-secondary">{t('subscriptions.statsDescription', { total: totalActiveSubscribers })}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeProducts.length === 0 ? (
            <Card className="text-sm text-muted">{t('stripe.emptyProducts')}</Card>
          ) : (
            activeProducts.map((product) => (
              <Card key={product.id}>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="mt-1 text-xs text-muted">{formatStripeProductPrice(product, priceLabels)}</p>
                <p className="mt-3 text-3xl font-semibold text-accent">{product.activeSubscribers}</p>
                <p className="mt-1 text-xs text-secondary">{t('subscriptions.activeSubscribersLabel')}</p>
              </Card>
            ))
          )}
        </div>
      </section>

      <StripeProductsPanel products={stripeProducts} />
    </div>
  );
}
