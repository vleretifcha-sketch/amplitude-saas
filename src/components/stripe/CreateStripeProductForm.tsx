'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createStripeProduct } from '@/actions/stripe-products';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/i18n/client';

export function CreateStripeProductForm({ onCreated }: { onCreated?: () => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createStripeProduct(formData);
      toast.success(t('toast.created'));
      setOpen(false);
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        {t('stripe.createProduct')}
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-2xl space-y-4">
      <h3 className="text-lg font-medium">{t('stripe.createProduct')}</h3>
      <form action={onSubmit} className="grid gap-4">
        <Field>
          <Label htmlFor="name">{t('stripe.formName')}</Label>
          <Input id="name" name="name" placeholder="Amplitude Premium" required />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="billing_type">{t('stripe.formBillingType')}</Label>
            <Select id="billing_type" name="billing_type" defaultValue="annual">
              <option value="monthly">{t('stripe.billingMonthly')}</option>
              <option value="annual">{t('stripe.billingAnnual')}</option>
              <option value="lifetime">{t('stripe.billingLifetime')}</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="price">{t('stripe.formPrice')}</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0.01" placeholder="149" required />
          </Field>
        </div>
        <Field>
          <Label htmlFor="sort_order">{t('stripe.formSortOrder')}</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
        </Field>
        <Field>
          <Label htmlFor="description">{t('stripe.formDescription')}</Label>
          <Textarea id="description" name="description" rows={3} placeholder={t('stripe.formDescriptionPlaceholder')} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? t('common.saving') : t('stripe.createOnStripe')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
