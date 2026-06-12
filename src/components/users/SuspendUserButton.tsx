'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { suspendUser } from '@/actions/users';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';

export function SuspendUserButton({ userId }: { userId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!window.confirm(t('users.suspendConfirm'))) return;
    setLoading(true);
    try {
      await suspendUser(userId);
      toast.success(t('toast.updated'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="danger" size="sm" disabled={loading} onClick={onClick}>
      {loading ? t('users.suspending') : t('users.suspend')}
    </Button>
  );
}
