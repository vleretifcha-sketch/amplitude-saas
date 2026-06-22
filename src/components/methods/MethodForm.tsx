'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteMethod, upsertMethod } from '@/actions/methods';
import { isUnexpectedServerActionError } from '@/lib/action-error';
import { isFormDataUploadTooLarge } from '@/lib/form-upload';
import { DeleteResourceButton } from '@/components/ui/DeleteResourceButton';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { Switch } from '@/components/ui/Switch';
import { IMAGE_CROP_ASPECT } from '@/lib/crop-image';
import { useLocale } from '@/i18n/client';
import type { Method } from '@/lib/types';

export function MethodForm({ method }: { method?: Method }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(method?.status === 'published');

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isFormDataUploadTooLarge(formData)) {
        toast.error(t('upload.payloadTooLarge'));
        return;
      }
      const id = await upsertMethod(formData);
      toast.success(method ? t('toast.saved') : t('toast.created'));
      router.push(`/methods/${id}`);
      router.refresh();
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

  return (
    <form action={onSubmit} encType="multipart/form-data" className="space-y-4">
      {method ? <input type="hidden" name="id" value={method.id} /> : null}
      <input type="hidden" name="status" value={published ? 'published' : 'draft'} />
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-input)] border border-border bg-surface-elevated px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">{t('methods.formPublished')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('methods.formPublishedHint')}</p>
        </div>
        <Switch
          checked={published}
          onCheckedChange={setPublished}
          aria-label={t('methods.formPublished')}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2">
          <Label htmlFor="title">{t('methods.formTitle')}</Label>
          <Input id="title" name="title" defaultValue={method?.title} required />
        </Field>
        <Field>
          <Label htmlFor="subtitle">{t('methods.formSubtitle')}</Label>
          <Input id="subtitle" name="subtitle" defaultValue={method?.subtitle ?? ''} />
        </Field>
        <Field>
          <Label htmlFor="sort_order">{t('methods.formSortOrder')}</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={method?.sort_order ?? 0} />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="description">{t('methods.formDescription')}</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={method?.description ?? ''} />
        </Field>
        <ImageUploadField
          label={t('methods.formCover')}
          urlFieldName="cover_image_url"
          fileFieldName="cover_image_file"
          defaultUrl={method?.cover_image_url}
          cropAspect={IMAGE_CROP_ASPECT.programCover}
        />
        <Field>
          <Label htmlFor="tagline">{t('methods.formTagline')}</Label>
          <Input id="tagline" name="tagline" defaultValue={method?.tagline ?? ''} />
        </Field>
        <Field className="flex items-end gap-2">
          <input
            id="is_premium"
            name="is_premium"
            type="checkbox"
            defaultChecked={method?.is_premium ?? true}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="is_premium">{t('methods.formPremium')}</Label>
        </Field>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
      {method ? (
        <DeleteResourceButton
          label={t('methods.delete')}
          confirmMessage={t('methods.deleteConfirm', { name: method.title })}
          redirectTo="/methods"
          onDelete={() => deleteMethod(method.id)}
        />
      ) : null}
    </form>
  );
}
