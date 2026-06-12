import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { ExercisesTable } from '@/components/exercises/ExercisesTable';
import { ImportPrescriptionsButton } from '@/components/exercises/ImportPrescriptionsButton';
import { createTranslator } from '@/i18n';
import { fetchExercisesForList } from '@/lib/queries';

export async function ExercisesTableSection({ locale }: { locale: 'fr' | 'en' }) {
  const t = createTranslator(locale);
  const db = createAdminClient();
  const [exercises, { count: prescriptionCount }, { count: orphanCount }] = await Promise.all([
    fetchExercisesForList(),
    db.from('video_exercises').select('id', { count: 'exact', head: true }),
    db.from('video_exercises').select('id', { count: 'exact', head: true }).is('library_exercise_id', null),
  ]);

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
