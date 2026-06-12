import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { TableLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';
import { ExercisesTableSection } from '@/components/exercises/ExercisesTableSection';
import { createTranslator, getLocale } from '@/i18n';

export const revalidate = 30;

export default async function ExercisesPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

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
      <Suspense fallback={<TableLoadingSkeleton rows={8} />}>
        <ExercisesTableSection locale={locale} />
      </Suspense>
    </div>
  );
}
