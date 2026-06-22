'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { saveOnboardingImage } from '@/actions/settings';
import { isUnexpectedServerActionError } from '@/lib/action-error';
import { isFormDataUploadTooLarge } from '@/lib/form-upload';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { IMAGE_CROP_ASPECT } from '@/lib/crop-image';
import type { OnboardingImagesSettings } from '@/lib/onboarding/server';
import { useLocale } from '@/i18n/client';

export function OnboardingSettingsForm({ images }: { images: OnboardingImagesSettings }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const steps = [
        { step: 1 as const, url: images.image1 },
        { step: 2 as const, url: images.image2 },
        { step: 3 as const, url: images.image3 },
      ];

      for (const { step, url } of steps) {
        const single = new FormData();
        const file = formData.get(`onboarding_image_${step}_file`);
        const existingUrl = String(formData.get(`onboarding_image_${step}_url`) || url || '').trim();

        if (file instanceof File && file.size > 0) {
          single.append('image_file', file);
        }
        single.append('image_url', existingUrl);

        if (isFormDataUploadTooLarge(single)) {
          toast.error(t('upload.payloadTooLarge'));
          return;
        }

        const result = await saveOnboardingImage(step, single);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
      }

      toast.success(t('toast.saved'));
    } catch (e) {
      if (isUnexpectedServerActionError(e)) {
        toast.error(t('upload.payloadTooLarge'));
        return;
      }
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  const slides = [
    { step: 1, label: t('settings.onboardingPhoto1'), url: images.image1 },
    { step: 2, label: t('settings.onboardingPhoto2'), url: images.image2 },
    { step: 3, label: t('settings.onboardingPhoto3'), url: images.image3 },
  ] as const;

  return (
    <form action={onSubmit} encType="multipart/form-data" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {slides.map(({ step, label, url }) => (
          <ImageUploadField
            key={step}
            label={label}
            urlFieldName={`onboarding_image_${step}_url`}
            fileFieldName={`onboarding_image_${step}_file`}
            defaultUrl={url}
            cropAspect={IMAGE_CROP_ASPECT.onboardingPortrait}
          />
        ))}
      </div>
      <p className="text-sm text-muted">{t('settings.onboardingHint')}</p>
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}
