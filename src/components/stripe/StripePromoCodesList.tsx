'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deactivateStripePromoCode } from '@/actions/stripe-products';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';
import type { Translator } from '@/i18n/translator';
import type { StripePromoCode } from '@/lib/types';

function formatDiscount(promo: StripePromoCode, t: Translator): string {
  if (promo.percent_off != null) return `${promo.percent_off}%`;
  if (promo.amount_off != null) return `${promo.amount_off} €`;
  return t('common.dash');
}

function formatDuration(promo: StripePromoCode, t: Translator): string {
  if (promo.duration === 'once') return t('stripe.durationOnce');
  if (promo.duration === 'forever') return t('stripe.durationForever');
  if (promo.duration === 'repeating') {
    return t('stripe.durationRepeating', { months: promo.duration_in_months ?? 3 });
  }
  return promo.duration;
}

export function StripePromoCodesList({ promoCodes }: { promoCodes: StripePromoCode[] }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  if (promoCodes.length === 0) {
    return <p className="text-sm text-muted">{t('stripe.noPromoCodes')}</p>;
  }

  async function onCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('stripe.promoCopied'));
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function onDeactivate(id: string) {
    if (!window.confirm(t('stripe.deactivatePromoConfirm'))) return;
    setDeactivating(id);
    try {
      await deactivateStripePromoCode(id);
      toast.success(t('toast.updated'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setDeactivating(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('stripe.promoListTitle')}</p>
      <ul className="divide-y divide-border-subtle rounded-[var(--radius-card)] border border-border-subtle">
        {promoCodes.map((promo) => (
          <li key={promo.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium">{promo.code}</span>
                <Badge tone={promo.active ? 'success' : 'muted'}>
                  {promo.active ? t('stripe.promoActive') : t('stripe.promoInactive')}
                </Badge>
              </div>
              <p className="text-sm text-secondary">
                {formatDiscount(promo, t)}
                {' · '}
                {formatDuration(promo, t)}
                {' · '}
                {t('stripe.promoUsage', {
                  used: promo.times_redeemed,
                  max: promo.max_redemptions ?? '∞',
                })}
                {promo.redeem_by
                  ? ` · ${t('stripe.promoValidUntil')} ${new Date(promo.redeem_by).toLocaleDateString(dateLocale)}`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {promo.active ? (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onCopy(promo.code)}>
                    {t('stripe.copyPromo')}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={deactivating === promo.id}
                    onClick={() => onDeactivate(promo.id)}
                  >
                    {deactivating === promo.id ? t('common.deleting') : t('stripe.deactivatePromo')}
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
