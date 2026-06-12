'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteProgram, upsertProgram } from '@/actions/programs';
import { DeleteResourceButton } from '@/components/ui/DeleteResourceButton';
import {
  ProgramSessionsEditor,
  type ProgramVideoOption,
} from '@/components/programs/ProgramSessionsEditor';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { IMAGE_CROP_ASPECT } from '@/lib/crop-image';
import { useLocale } from '@/i18n/client';
import type { Program } from '@/lib/types';

function idsForProgram(
  linked: string[] | undefined,
  legacySingle: string | null | undefined,
  videos: ProgramVideoOption[],
  programId: string,
  type: ProgramVideoOption['type']
) {
  if (linked?.length) return linked;
  if (legacySingle) return [legacySingle];
  return videos.filter((v) => v.programId === programId && v.type === type).map((v) => v.id);
}

export function ProgramForm({
  program,
  programId,
  videos = [],
}: {
  program?: Program;
  programId?: string;
  videos?: ProgramVideoOption[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentProgramId = programId ?? program?.id ?? '';

  const signatureIds = program
    ? idsForProgram(
        program.signature_session_ids,
        program.signature_session_id,
        videos,
        currentProgramId,
        'signature'
      )
    : [];

  const complementaryIds = program
    ? idsForProgram(program.complementary_session_ids, null, videos, currentProgramId, 'complementary')
    : [];

  const mobilityIds = program?.mobility_session_ids?.filter(Boolean) ?? [];

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const id = await upsertProgram(formData);
      toast.success(program ? t('toast.saved') : t('toast.created'));
      router.push(`/programs/${id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} encType="multipart/form-data" className="space-y-4">
      {program ? <input type="hidden" name="id" value={program.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2">
          <Label htmlFor="title">{t('programs.formTitle')}</Label>
          <Input id="title" name="title" defaultValue={program?.title} required />
        </Field>
        <Field>
          <Label htmlFor="subtitle">{t('programs.formSubtitle')}</Label>
          <Input id="subtitle" name="subtitle" defaultValue={program?.subtitle ?? ''} />
        </Field>
        <Field>
          <Label htmlFor="duration_weeks">{t('programs.formDuration')}</Label>
          <Input
            id="duration_weeks"
            name="duration_weeks"
            type="number"
            defaultValue={program?.duration_weeks ?? 4}
          />
        </Field>
        <Field>
          <Label htmlFor="sort_order">{t('programs.formSortOrder')}</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={program?.sort_order ?? 0} />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="description">{t('programs.formDescription')}</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={program?.description ?? ''} />
        </Field>
        <ImageUploadField
          label={t('programs.formCover')}
          urlFieldName="cover_image_url"
          fileFieldName="cover_image_file"
          defaultUrl={program?.cover_image_url}
          cropAspect={IMAGE_CROP_ASPECT.programCover}
        />
        <Field>
          <Label htmlFor="tagline">{t('programs.formTagline')}</Label>
          <Input id="tagline" name="tagline" defaultValue={program?.tagline ?? ''} />
        </Field>

        {program && currentProgramId ? (
          <ProgramSessionsEditor
            programId={currentProgramId}
            signatureIds={signatureIds}
            complementaryIds={complementaryIds}
            mobilityIds={mobilityIds}
            videos={videos}
          />
        ) : null}

        <Field className="flex items-end gap-2">
          <input
            id="is_premium"
            name="is_premium"
            type="checkbox"
            defaultChecked={program?.is_premium ?? true}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="is_premium">{t('programs.formPremium')}</Label>
        </Field>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
      {program ? (
        <DeleteResourceButton
          label={t('programs.delete')}
          confirmMessage={t('programs.deleteConfirm', { name: program.title })}
          redirectTo="/programs"
          onDelete={() => deleteProgram(program.id)}
        />
      ) : null}
    </form>
  );
}
