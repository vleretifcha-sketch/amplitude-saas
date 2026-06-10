'use client';

import { useState } from 'react';
import { upsertLibraryExercise } from '@/actions/exercises';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Exercise } from '@/lib/types';

export function ExerciseForm({ exercise }: { exercise?: Exercise }) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    try {
      const id = await upsertLibraryExercise(formData);
      window.location.href = `/exercises/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
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
        <Field>
          <Label htmlFor="vimeo_video_id">{t('exercises.formVimeoId')}</Label>
          <Input
            id="vimeo_video_id"
            name="vimeo_video_id"
            defaultValue={exercise?.vimeo_video_id ?? ''}
            placeholder="123456789"
            required
          />
        </Field>
        <Field>
          <Label htmlFor="vimeo_hash">{t('exercises.formVimeoHash')}</Label>
          <Input
            id="vimeo_hash"
            name="vimeo_hash"
            defaultValue={exercise?.vimeo_hash ?? ''}
            placeholder="abc123"
          />
        </Field>
      </div>
      <p className="text-sm text-muted">{t('exercises.formHint')}</p>
      {exercise?.vimeo_video_id ? (
        <p className="text-sm text-secondary">
          {t('exercises.vimeoPreview')}{' '}
          <a
            href={`https://vimeo.com/${exercise.vimeo_video_id}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            vimeo.com/{exercise.vimeo_video_id}
          </a>
        </p>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}
