'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [error, setError] = useState('');

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    setError('');
    try {
      await onDelete();
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-border-subtle pt-6">
      {error ? <p className="mb-3 text-sm text-error">{error}</p> : null}
      <Button type="button" variant="danger" size="sm" disabled={loading} onClick={handleClick}>
        {loading ? t('common.deleting') : label}
      </Button>
    </div>
  );
}
