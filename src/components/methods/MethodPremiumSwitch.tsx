'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setMethodPremium } from '@/actions/methods';
import { Switch } from '@/components/ui/Switch';
import { useLocale } from '@/i18n/client';

export function MethodPremiumSwitch({
  methodId,
  isPremium,
}: {
  methodId: string;
  isPremium: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(isPremium);
  const [loading, setLoading] = useState(false);

  async function onCheckedChange(next: boolean) {
    const previous = checked;
    setChecked(next);
    setLoading(true);
    try {
      await setMethodPremium(methodId, next);
      toast.success(next ? t('methods.premiumEnabledToast') : t('methods.premiumDisabledToast'));
      router.refresh();
    } catch (error) {
      setChecked(previous);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={loading}
        aria-label={t('methods.togglePremium')}
      />
      <span className="text-sm text-secondary">
        {checked ? t('methods.premium') : t('methods.free')}
      </span>
    </div>
  );
}
