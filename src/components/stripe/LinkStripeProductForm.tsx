'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { linkStripeProduct } from '@/actions/stripe-products';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/i18n/client';

export function LinkStripeProductForm({ onLinked }: { onLinked?: () => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      await linkStripeProduct(formData);
      toast.success(t('stripe.productLinked'));
      setOpen(false);
      onLinked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {t('stripe.linkProduct')}
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-2xl space-y-4">
      <h3 className="text-lg font-medium">{t('stripe.linkProduct')}</h3>
      <p className="text-sm text-secondary">{t('stripe.linkProductHint')}</p>
      <form action={onSubmit} className="grid gap-4">
        <Field>
          <Label htmlFor="link_name">{t('stripe.formName')}</Label>
          <Input id="link_name" name="name" placeholder="Amplitude — Offre annuelle" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="stripe_product_id">{t('stripe.formStripeProductId')}</Label>
            <Input id="stripe_product_id" name="stripe_product_id" placeholder="prod_…" required />
          </Field>
          <Field>
            <Label htmlFor="stripe_price_id">{t('stripe.formStripePriceId')}</Label>
            <Input id="stripe_price_id" name="stripe_price_id" placeholder="price_…" required />
          </Field>
        </div>
        <Field>
          <Label htmlFor="payment_link_url">{t('stripe.formPaymentLinkUrl')}</Label>
          <Input
            id="payment_link_url"
            name="payment_link_url"
            type="url"
            placeholder="https://buy.stripe.com/…"
          />
        </Field>
        <Field>
          <Label htmlFor="link_sort_order">{t('stripe.formSortOrder')}</Label>
          <Input id="link_sort_order" name="sort_order" type="number" defaultValue={0} />
        </Field>
        <Field>
          <Label htmlFor="link_description">{t('stripe.formDescription')}</Label>
          <Textarea id="link_description" name="description" rows={2} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? t('common.saving') : t('stripe.linkProductSubmit')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
