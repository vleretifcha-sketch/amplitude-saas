'use client';

import { useState } from 'react';
import { createUser } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label } from '@/components/ui/Input';
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
    <form action={onSubmit} className="space-y-4">
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
      <p className="text-sm text-muted">{t('users.createHint')}</p>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t('users.creating') : t('users.createSubmit')}
      </Button>
    </form>
  );
}
