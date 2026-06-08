'use client';

import { useState } from 'react';
import { importLibraryFromPrescriptions } from '@/actions/exercises';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';

export function ImportPrescriptionsButton() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onImport() {
    setLoading(true);
    setMessage('');
    try {
      const count = await importLibraryFromPrescriptions();
      if (count === 0) {
        setMessage(t('exercises.importEmpty'));
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('common.error'));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" onClick={onImport} disabled={loading}>
        {loading ? t('exercises.importLoading') : t('exercises.importButton')}
      </Button>
      {message ? <p className="text-sm text-error">{message}</p> : null}
    </div>
  );
}
