'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteVideo, upsertVideo } from '@/actions/videos';
import { Button } from '@/components/ui/Button';
import { DeleteResourceButton } from '@/components/ui/DeleteResourceButton';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { IMAGE_CROP_ASPECT } from '@/lib/crop-image';
import { ExerciseListEditor } from '@/components/videos/ExerciseListEditor';
import { useLocale } from '@/i18n/client';
import { isComplementarySessionType, isVideoOnlySessionType } from '@/lib/video-session';
import type { Exercise, Video, VideoExercise } from '@/lib/types';

export function VideoForm({
  video,
  library = [],
  exercises = [],
}: {
  video?: Video;
  library?: Exercise[];
  exercises?: VideoExercise[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<Video['type']>(video?.type ?? 'signature');

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const id = await upsertVideo(formData);
      toast.success(video ? t('toast.saved') : t('toast.created'));
      router.push(`/videos/${id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} encType="multipart/form-data" className="space-y-4">
      {video ? <input type="hidden" name="id" value={video.id} /> : null}
      <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-elevated p-4">
        <p className="text-sm text-secondary">{t('videos.catalogHint')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2">
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
            <option value="mobility">{t('videos.typeOptionMobility')}</option>
            <option value="complementary">{t('videos.typeOptionComplementary')}</option>
          </Select>
        </Field>
        {isVideoOnlySessionType(type) ? (
          <>
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
          </>
        ) : (
          <>
            <input type="hidden" name="vimeo_video_id" value="" />
            <input type="hidden" name="vimeo_hash" value="" />
            <input type="hidden" name="duration_seconds" value="0" />
            <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-elevated p-4 md:col-span-2">
              <p className="text-sm text-secondary">{t('videos.complementaryOnlyHint')}</p>
            </div>
          </>
        )}
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
          cropAspect={IMAGE_CROP_ASPECT.sessionThumbnail}
        />
        <Field className="md:col-span-2">
          <Label htmlFor="description">{t('videos.formDescription')}</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={video?.description ?? ''} />
        </Field>

        {isComplementarySessionType(type) ? (
          <ExerciseListEditor library={library} initialExercises={exercises} />
        ) : (
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-elevated p-4 md:col-span-2">
            <p className="text-sm text-secondary">
              {type === 'mobility' ? t('videos.mobilityOnlyHint') : t('videos.signatureOnlyHint')}
            </p>
          </div>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
      {video ? (
        <DeleteResourceButton
          label={t('videos.delete')}
          confirmMessage={t('videos.deleteConfirm', { name: video.title })}
          redirectTo="/videos"
          onDelete={() => deleteVideo(video.id)}
        />
      ) : null}
    </form>
  );
}
