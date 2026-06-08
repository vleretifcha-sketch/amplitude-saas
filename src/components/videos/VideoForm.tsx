'use client';

import { useState } from 'react';
import { upsertVideo } from '@/actions/videos';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { ExerciseListEditor } from '@/components/videos/ExerciseListEditor';
import { useLocale } from '@/i18n/client';
import type { Exercise, Program, Video, VideoExercise } from '@/lib/types';

export function VideoForm({
  video,
  programs,
  library = [],
  exercises = [],
}: {
  video?: Video;
  programs: Pick<Program, 'id' | 'title'>[];
  library?: Exercise[];
  exercises?: VideoExercise[];
}) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<Video['type']>(video?.type ?? 'signature');

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    try {
      const id = await upsertVideo(formData);
      window.location.href = `/videos/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} encType="multipart/form-data" className="space-y-4">
      {video ? <input type="hidden" name="id" value={video.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="program_id">{t('videos.formProgram')}</Label>
          <Select id="program_id" name="program_id" defaultValue={video?.program_id} required>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="title">{t('videos.formTitle')}</Label>
          <Input id="title" name="title" defaultValue={video?.title} required />
        </Field>
        <Field>
          <Label htmlFor="type">{t('videos.formType')}</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as Video['type'])}
          >
            <option value="signature">{t('videos.typeOptionSignature')}</option>
            <option value="complementary">{t('videos.typeOptionComplementary')}</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="vimeo_video_id">{t('videos.formVimeoId')}</Label>
          <Input id="vimeo_video_id" name="vimeo_video_id" defaultValue={video?.vimeo_video_id} required />
        </Field>
        <Field>
          <Label htmlFor="vimeo_hash">{t('videos.formVimeoHash')}</Label>
          <Input id="vimeo_hash" name="vimeo_hash" defaultValue={video?.vimeo_hash ?? ''} />
        </Field>
        <Field>
          <Label htmlFor="duration_seconds">{t('videos.formDuration')}</Label>
          <Input
            id="duration_seconds"
            name="duration_seconds"
            type="number"
            defaultValue={video?.duration_seconds ?? 0}
          />
        </Field>
        <Field>
          <Label htmlFor="status">{t('videos.formStatus')}</Label>
          <Select id="status" name="status" defaultValue={video?.status ?? 'draft'}>
            <option value="draft">{t('videos.statusDraft')}</option>
            <option value="published">{t('videos.statusPublished')}</option>
            <option value="archived">{t('videos.statusArchived')}</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="week_number">{t('videos.formWeek')}</Label>
          <Input id="week_number" name="week_number" type="number" defaultValue={video?.week_number ?? 1} />
        </Field>
        <Field>
          <Label htmlFor="order_in_week">{t('videos.formOrder')}</Label>
          <Input
            id="order_in_week"
            name="order_in_week"
            type="number"
            defaultValue={video?.order_in_week ?? 1}
          />
        </Field>
        <ImageUploadField
          className="md:col-span-2"
          label={t('videos.formThumbnail')}
          urlFieldName="thumbnail_url"
          fileFieldName="thumbnail_file"
          defaultUrl={video?.thumbnail_url}
        />
        <Field className="md:col-span-2">
          <Label htmlFor="description">{t('videos.formDescription')}</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={video?.description ?? ''} />
        </Field>

        {type === 'complementary' ? (
          <ExerciseListEditor library={library} initialExercises={exercises} />
        ) : null}
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}
