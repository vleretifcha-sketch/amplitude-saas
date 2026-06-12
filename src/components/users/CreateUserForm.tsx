'use client';

import { useState } from 'react';
import { createUser } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';

export function CreateUserForm() {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    try {
      const id = await createUser(formData);
      window.location.href = `/users/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
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
            <Input id="first_name" name="first_name" />
          </Field>
          <Field>
            <Label htmlFor="last_name">{t('users.formLastName')}</Label>
            <Input id="last_name" name="last_name" />
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="password">{t('users.formPassword')}</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted">
          {t('users.sectionSubscription')}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="subscription_status">{t('users.subStatus')}</Label>
            <Select id="subscription_status" name="subscription_status" defaultValue="none">
              <option value="none">{t('users.subNone')}</option>
              <option value="trial">{t('users.subTrial')}</option>
              <option value="active">{t('users.subActive')}</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="subscription_expires_at">{t('users.subExpires')}</Label>
            <Input id="subscription_expires_at" name="subscription_expires_at" type="datetime-local" />
          </Field>
        </div>
        <p className="mt-2 text-sm text-muted">{t('users.createHint')}</p>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t('users.creating') : t('users.createSubmit')}
      </Button>
    </form>
  );
}
