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
  methodId,
  program,
  videos = [],
}: {
  methodId: string;
  program?: Program;
  videos?: ProgramVideoOption[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const programId = program?.id ?? '';

  const signatureIds = program
    ? idsForProgram(
        program.signature_session_ids,
        program.signature_session_id,
        videos,
        programId,
        'signature'
      )
    : [];

  const complementaryIds = program
    ? idsForProgram(program.complementary_session_ids, null, videos, programId, 'complementary')
    : [];

  const mobilityIds = program?.mobility_session_ids?.filter(Boolean) ?? [];

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await upsertProgram(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(program ? t('toast.saved') : t('toast.created'));
      router.push(`/methods/${methodId}/programs/${result.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="method_id" value={methodId} />
      {program ? <input type="hidden" name="id" value={program.id} /> : null}
      <p className="text-sm text-secondary">{t('programs.curriculumHint')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2">
          <Label htmlFor="title">{t('programs.formTitle')}</Label>
          <Input id="title" name="title" defaultValue={program?.title} required />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="description">{t('programs.formDescription')}</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={program?.description ?? ''}
            placeholder={t('programs.formDescriptionPlaceholder')}
          />
          <p className="mt-1.5 text-xs text-muted">{t('programs.formDescriptionHint')}</p>
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

        {programId ? (
          <ProgramSessionsEditor
            programId={programId}
            signatureIds={signatureIds}
            complementaryIds={complementaryIds}
            mobilityIds={mobilityIds}
            videos={videos}
          />
        ) : (
          <p className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-elevated p-4 text-sm text-muted md:col-span-2">
            {t('programs.sessionsAfterCreate')}
          </p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? t('common.saving') : t('common.save')}
      </Button>
      {program ? (
        <DeleteResourceButton
          label={t('programs.delete')}
          confirmMessage={t('programs.deleteConfirm', { name: program.title })}
          redirectTo={`/methods/${methodId}`}
          onDelete={() => deleteProgram(methodId, program.id)}
        />
      ) : null}
    </form>
  );
}
