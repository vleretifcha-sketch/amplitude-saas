'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createUser } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { StripeProduct } from '@/lib/types';

function generatePassword() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function CreateUserForm({ stripeProducts = [] }: { stripeProducts?: StripeProduct[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [accessType, setAccessType] = useState<'free' | 'premium'>('free');

  const activeProducts = useMemo(
    () => stripeProducts.filter((product) => product.active),
    [stripeProducts]
  );

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      formData.set('password', password);
      formData.set('access_type', accessType);
      const id = await createUser(formData);
      toast.success(t('toast.created'));
      router.push(`/users/${id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted">
          {t('users.sectionAccount')}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="first_name">{t('users.formFirstName')}</Label>
            <Input id="first_name" name="first_name" required />
          </Field>
          <Field>
            <Label htmlFor="last_name">{t('users.formLastName')}</Label>
            <Input id="last_name" name="last_name" required />
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="password">{t('users.formPassword')}</Label>
            <div className="flex gap-2">
              <Input id="password" name="password" type="text" value={password} readOnly required />
              <Button type="button" variant="secondary" onClick={() => setPassword(generatePassword())}>
                {t('users.generatePassword')}
              </Button>
            </div>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted">
          {t('users.sectionSubscription')}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="access_type">{t('users.accessType')}</Label>
            <Select
              id="access_type"
              name="access_type"
              value={accessType}
              onChange={(e) => setAccessType(e.target.value as 'free' | 'premium')}
            >
              <option value="free">{t('users.accessFree')}</option>
              <option value="premium">{t('users.accessPremium')}</option>
            </Select>
          </Field>
          {accessType === 'premium' && activeProducts.length > 0 ? (
            <>
              <Field>
                <Label htmlFor="stripe_product_id">{t('users.stripeOffer')}</Label>
                <Select id="stripe_product_id" name="stripe_product_id" defaultValue="">
                  <option value="">{t('users.manualPremium')}</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <input type="hidden" name="subscription_plan" value="monthly" />
            </>
          ) : accessType === 'premium' ? (
            <>
              <Field>
                <Label htmlFor="subscription_status">{t('users.subStatus')}</Label>
                <Select id="subscription_status" name="subscription_status" defaultValue="active">
                  <option value="trial">{t('users.subTrial')}</option>
                  <option value="active">{t('users.subActive')}</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="subscription_expires_at">{t('users.subExpires')}</Label>
                <Input id="subscription_expires_at" name="subscription_expires_at" type="datetime-local" />
              </Field>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted">{t('users.createHint')}</p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? t('users.creating') : t('users.createSubmit')}
      </Button>
    </form>
  );
}
