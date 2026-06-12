'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createStripePromoCode } from '@/actions/stripe-products';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/i18n/client';
import type { StripeProductRow } from '@/lib/types';

export function CreatePromoCodeForm({
  product,
  onCreated,
}: {
  product: StripeProductRow;
  onCreated?: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<'once' | 'forever' | 'repeating'>('once');

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      formData.set('stripe_product_id', product.id);
      await createStripePromoCode(formData);
      toast.success(t('toast.created'));
      setOpen(false);
      onCreated?.();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {t('stripe.createPromo')}
      </Button>
    );
  }

  return (
    <Card className="space-y-4 border-dashed">
      <h4 className="text-sm font-medium">{t('stripe.createPromoFor', { name: product.name })}</h4>
      <p className="text-sm text-secondary">{t('stripe.promoHint')}</p>
      <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
        <Field>
          <Label htmlFor={`code-${product.id}`}>{t('stripe.promoCode')}</Label>
          <Input id={`code-${product.id}`} name="code" placeholder="LANCEMENT20" />
        </Field>
        <Field>
          <Label htmlFor={`discount_type-${product.id}`}>{t('stripe.promoType')}</Label>
          <Select id={`discount_type-${product.id}`} name="discount_type" defaultValue="percent">
            <option value="percent">{t('stripe.promoPercent')}</option>
            <option value="fixed">{t('stripe.promoFixed')}</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor={`discount_value-${product.id}`}>{t('stripe.promoValue')}</Label>
          <Input id={`discount_value-${product.id}`} name="discount_value" type="number" step="0.01" min="0" required />
        </Field>
        <Field>
          <Label htmlFor={`duration-${product.id}`}>{t('stripe.promoDuration')}</Label>
          <Select
            id={`duration-${product.id}`}
            name="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value as 'once' | 'forever' | 'repeating')}
          >
            <option value="once">{t('stripe.durationOnce')}</option>
            <option value="forever">{t('stripe.durationForever')}</option>
            <option value="repeating">{t('stripe.durationRepeatingLabel')}</option>
          </Select>
        </Field>
        {duration === 'repeating' ? (
          <Field>
            <Label htmlFor={`duration_in_months-${product.id}`}>{t('stripe.promoDurationMonths')}</Label>
            <Input
              id={`duration_in_months-${product.id}`}
              name="duration_in_months"
              type="number"
              min="1"
              step="1"
              defaultValue="3"
              required
            />
          </Field>
        ) : null}
        <Field>
          <Label htmlFor={`max_redemptions-${product.id}`}>{t('stripe.promoLimit')}</Label>
          <Input id={`max_redemptions-${product.id}`} name="max_redemptions" type="number" min="1" placeholder="100" />
        </Field>
        <Field>
          <Label htmlFor={`redeem_by-${product.id}`}>{t('stripe.promoExpires')}</Label>
          <Input id={`redeem_by-${product.id}`} name="redeem_by" type="datetime-local" />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? t('common.saving') : t('stripe.createPromoSubmit')}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
