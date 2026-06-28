'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { archiveStripeProduct } from '@/actions/stripe-products';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreatePromoCodeForm } from '@/components/stripe/CreatePromoCodeForm';
import { CreateStripeProductForm } from '@/components/stripe/CreateStripeProductForm';
import { LinkStripeProductForm } from '@/components/stripe/LinkStripeProductForm';
import { StripePaymentLinkField } from '@/components/stripe/StripePaymentLinkField';
import { StripePromoCodesList } from '@/components/stripe/StripePromoCodesList';
import { paginate, Pagination } from '@/components/ui/Pagination';
import { billingTypeLabel, formatStripeProductPrice } from '@/lib/stripe/product';
import { useLocale } from '@/i18n/client';
import type { StripeProductRow } from '@/lib/types';

export function StripeProductsPanel({ products }: { products: StripeProductRow[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [archiving, setArchiving] = useState<string | null>(null);
  const paged = paginate(products, page);

  const priceLabels = {
    monthShort: t('stripe.monthShort'),
    yearShort: t('stripe.yearShort'),
    lifetime: t('stripe.billingLifetime'),
  };

  const billingLabels = {
    monthly: t('stripe.billingMonthly'),
    annual: t('stripe.billingAnnual'),
    lifetime: t('stripe.billingLifetime'),
  };

  async function onArchive(id: string) {
    if (!window.confirm(t('stripe.archiveConfirm'))) return;
    setArchiving(id);
    try {
      await archiveStripeProduct(id);
      toast.success(t('toast.updated'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setArchiving(null);
    }
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('stripe.sectionLabel')}</p>
          <h2 className="mt-1 text-xl font-semibold">{t('stripe.sectionTitle')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('stripe.sectionDescription')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkStripeProductForm onLinked={() => router.refresh()} />
          <CreateStripeProductForm onCreated={() => router.refresh()} />
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="text-sm text-muted">{t('stripe.emptyProducts')}</Card>
      ) : (
        <div className="space-y-4">
          {paged.map((product) => (
            <Card key={product.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-medium">{product.name}</h3>
                    <Badge tone={product.active ? 'success' : 'muted'}>
                      {product.active ? t('stripe.statusActive') : t('stripe.statusArchived')}
                    </Badge>
                    <Badge tone="muted">
                      {billingTypeLabel(product.billing_type ?? 'monthly', billingLabels)}
                    </Badge>
                  </div>
                  {product.description ? (
                    <p className="mt-1 text-sm text-secondary">{product.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-secondary">
                    {formatStripeProductPrice(product, priceLabels)}
                    {' · '}
                    {t('stripe.subscribers', { count: product.activeSubscribers })}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {product.stripe_product_id}
                    {product.stripe_price_id ? ` · ${product.stripe_price_id}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.active ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={archiving === product.id}
                      onClick={() => onArchive(product.id)}
                    >
                      {archiving === product.id ? t('common.deleting') : t('stripe.archive')}
                    </Button>
                  ) : null}
                </div>
              </div>
              {product.active ? (
                <div className="space-y-4 border-t border-border-subtle pt-4">
                  <StripePaymentLinkField
                    productId={product.id}
                    initialUrl={product.stripe_payment_link_url}
                  />
                  <StripePromoCodesList promoCodes={product.promoCodes} />
                  <CreatePromoCodeForm product={product} onCreated={() => router.refresh()} />
                </div>
              ) : null}
            </Card>
          ))}
          <Pagination page={page} totalItems={products.length} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}
