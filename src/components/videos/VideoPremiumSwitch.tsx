'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setVideoPremium } from '@/actions/videos';
import { Switch } from '@/components/ui/Switch';
import { useLocale } from '@/i18n/client';

export function VideoPremiumSwitch({
  videoId,
  isPremium,
}: {
  videoId: string;
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
      await setVideoPremium(videoId, next);
      toast.success(next ? t('videos.premiumEnabledToast') : t('videos.premiumDisabledToast'));
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
        aria-label={t('videos.togglePremium')}
      />
      <span className="text-sm text-secondary">
        {checked ? t('videos.premium') : t('videos.free')}
      </span>
    </div>
  );
}
