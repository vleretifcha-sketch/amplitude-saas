'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateUserProfile } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Profile } from '@/lib/types';

export function UserProfileForm({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      await updateUserProfile(formData);
      toast.success(t('toast.updated'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4 border-t border-border-subtle pt-4">
      <input type="hidden" name="user_id" value={profile.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="first_name">{t('users.formFirstName')}</Label>
          <Input id="first_name" name="first_name" defaultValue={profile.first_name ?? ''} />
        </Field>
        <Field>
          <Label htmlFor="last_name">{t('users.formLastName')}</Label>
          <Input id="last_name" name="last_name" defaultValue={profile.last_name ?? ''} />
        </Field>
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={loading}>
        {loading ? t('common.saving') : t('users.updateProfile')}
      </Button>
    </form>
  );
}
