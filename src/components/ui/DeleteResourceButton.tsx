'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';

export function DeleteResourceButton({
  label,
  confirmMessage,
  onDelete,
  redirectTo,
}: {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<void>;
  redirectTo: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      await onDelete();
      toast.success(t('toast.deleted'));
      router.replace(redirectTo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-border-subtle pt-6">
      <Button type="button" variant="danger" size="sm" disabled={loading} onClick={handleClick}>
        {loading ? t('common.deleting') : label}
      </Button>
    </div>
  );
}
