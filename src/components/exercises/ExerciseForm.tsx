'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteLibraryExercise, upsertLibraryExercise } from '@/actions/exercises';
import { Button } from '@/components/ui/Button';
import { DeleteResourceButton } from '@/components/ui/DeleteResourceButton';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Exercise } from '@/lib/types';
import { buildVimeoWatchUrl } from '@/lib/vimeo';

export function ExerciseForm({ exercise }: { exercise?: Exercise }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const id = await upsertLibraryExercise(formData);
      toast.success(exercise ? t('toast.saved') : t('toast.created'));
      router.push(`/exercises/${id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {exercise ? <input type="hidden" name="id" value={exercise.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2">
          <Label htmlFor="name">{t('exercises.formName')}</Label>
          <Input
            id="name"
            name="name"
            defaultValue={exercise?.name}
            placeholder={t('exercises.placeholderName')}
            required
          />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="muscle_groups">{t('exercises.formMuscle')}</Label>
          <Input
            id="muscle_groups"
            name="muscle_groups"
            defaultValue={exercise?.muscle_groups ?? ''}
            placeholder={t('exercises.placeholderMuscle')}
          />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="description">{t('exercises.formDescription')}</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={exercise?.description ?? ''}
            placeholder={t('exercises.placeholderDescription')}
          />
        </Field>
        <Field>
          <Label htmlFor="vimeo_video_id">{t('exercises.formVimeoId')}</Label>
          <Input
            id="vimeo_video_id"
            name="vimeo_video_id"
            defaultValue={exercise?.vimeo_video_id ?? ''}
            placeholder={t('exercises.placeholderVimeoId')}
            required
          />
        </Field>
        <Field>
          <Label htmlFor="vimeo_hash">{t('exercises.formVimeoHash')}</Label>
          <Input
            id="vimeo_hash"
            name="vimeo_hash"
            defaultValue={exercise?.vimeo_hash ?? ''}
            placeholder={t('exercises.placeholderVimeoHash')}
          />
        </Field>
      </div>
      <p className="text-sm text-muted">{t('exercises.vimeoUrlHint')}</p>
      <p className="text-sm text-muted">{t('exercises.formHint')}</p>
      {exercise?.vimeo_video_id ? (
        <p className="text-sm text-secondary">
          {t('exercises.vimeoPreview')}{' '}
          <a
            href={buildVimeoWatchUrl(exercise.vimeo_video_id, exercise.vimeo_hash)}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            {buildVimeoWatchUrl(exercise.vimeo_video_id, exercise.vimeo_hash)}
          </a>
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
      {exercise ? (
        <DeleteResourceButton
          label={t('exercises.delete')}
          confirmMessage={t('exercises.deleteConfirm', { name: exercise.name })}
          redirectTo="/exercises"
          onDelete={() => deleteLibraryExercise(exercise.id)}
        />
      ) : null}
    </form>
  );
}
