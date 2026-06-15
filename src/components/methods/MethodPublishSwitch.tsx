'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setMethodPublished } from '@/actions/methods';
import { Switch } from '@/components/ui/Switch';
import { useLocale } from '@/i18n/client';

export function MethodPublishSwitch({
  methodId,
  published,
}: {
  methodId: string;
  published: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(published);
  const [loading, setLoading] = useState(false);

  async function onCheckedChange(next: boolean) {
    const previous = checked;
    setChecked(next);
    setLoading(true);
    try {
      await setMethodPublished(methodId, next);
      toast.success(next ? t('methods.publishedToast') : t('methods.unpublishedToast'));
      router.refresh();
    } catch (error) {
      setChecked(previous);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={loading}
      aria-label={t('methods.formPublished')}
    />
  );
}
