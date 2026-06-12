import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { ExercisesTable } from '@/components/exercises/ExercisesTable';
import { ImportPrescriptionsButton } from '@/components/exercises/ImportPrescriptionsButton';
import { createTranslator } from '@/i18n';
import type { Exercise } from '@/lib/types';

export async function ExercisesTableSection({ locale }: { locale: 'fr' | 'en' }) {
  const t = createTranslator(locale);
  const db = createAdminClient();
  const [{ data }, { count: prescriptionCount }, { count: orphanCount }] = await Promise.all([
    db
      .from('exercises')
      .select('id, name, description, muscle_groups, vimeo_video_id, vimeo_hash, created_at, updated_at')
      .order('name'),
    db.from('video_exercises').select('id', { count: 'exact', head: true }),
    db.from('video_exercises').select('id', { count: 'exact', head: true }).is('library_exercise_id', null),
  ]);
  const exercises = (data ?? []) as Exercise[];

  return (
    <>
      {exercises.length === 0 && (prescriptionCount ?? 0) > 0 ? (
        <Card className="space-y-3 border-border bg-surface-elevated">
          <p className="text-sm text-secondary">{t('exercises.legacyBanner')}</p>
          <ImportPrescriptionsButton />
        </Card>
      ) : null}

      {exercises.length > 0 && (orphanCount ?? 0) > 0 ? (
        <Card className="text-sm text-secondary">
          {t('exercises.orphanBanner', { count: orphanCount ?? 0 })}{' '}
          <ImportPrescriptionsButton />
        </Card>
      ) : null}

      <ExercisesTable exercises={exercises} />
    </>
  );
}
