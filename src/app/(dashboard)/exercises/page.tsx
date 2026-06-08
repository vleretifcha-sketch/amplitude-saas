import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ExercisesTable } from '@/components/exercises/ExercisesTable';
import { ImportPrescriptionsButton } from '@/components/exercises/ImportPrescriptionsButton';
import { createTranslator, getLocale } from '@/i18n';
import type { Exercise } from '@/lib/types';

export default async function ExercisesPage() {
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const [{ data }, { count: prescriptionCount }, { count: orphanCount }] = await Promise.all([
    db.from('exercises').select('*').order('name'),
    db.from('video_exercises').select('*', { count: 'exact', head: true }),
    db
      .from('video_exercises')
      .select('*', { count: 'exact', head: true })
      .is('library_exercise_id', null),
  ]);
  const exercises = (data ?? []) as Exercise[];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('exercises.title')}
        description={t('exercises.description')}
        action={
          <Link href="/exercises/new">
            <Button>{t('exercises.new')}</Button>
          </Link>
        }
      />

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
    </div>
  );
}
