'use client';

import { useState } from 'react';
import { revokeUserSubscription, updateUserSubscription } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Profile } from '@/lib/types';

export function SubscriptionForm({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const expiresDefault = profile.subscription_expires_at
    ? profile.subscription_expires_at.slice(0, 16)
    : '';

  const hasPremiumAccess =
    profile.subscription_status === 'active' || profile.subscription_status === 'trial';

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

  async function onRevoke() {
    if (!window.confirm(t('users.revokeConfirm'))) return;
    setRevoking(true);
    setError('');
    try {
      await revokeUserSubscription(profile.id);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary">{t('users.subscriptionHint')}</p>
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
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading || revoking}>
            {loading ? t('users.subUpdating') : t('users.subUpdate')}
          </Button>
          {hasPremiumAccess ? (
            <Button type="button" variant="danger" disabled={loading || revoking} onClick={onRevoke}>
              {revoking ? t('users.revoking') : t('users.revokeAccess')}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
