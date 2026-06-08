'use client';

import { useState } from 'react';
import { updateUserSubscription } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Profile } from '@/lib/types';

export function SubscriptionForm({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const expiresDefault = profile.subscription_expires_at
    ? profile.subscription_expires_at.slice(0, 16)
    : '';

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    try {
      await updateUserSubscription(formData);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="user_id" value={profile.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="subscription_status">{t('users.subStatus')}</Label>
          <Select
            id="subscription_status"
            name="subscription_status"
            defaultValue={profile.subscription_status}
          >
            <option value="none">{t('users.subNone')}</option>
            <option value="trial">{t('users.subTrial')}</option>
            <option value="active">{t('users.subActive')}</option>
            <option value="expired">{t('users.subExpired')}</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="subscription_expires_at">{t('users.subExpires')}</Label>
          <Input
            id="subscription_expires_at"
            name="subscription_expires_at"
            type="datetime-local"
            defaultValue={expiresDefault}
          />
        </Field>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t('users.subUpdating') : t('users.subUpdate')}
      </Button>
    </form>
  );
}
