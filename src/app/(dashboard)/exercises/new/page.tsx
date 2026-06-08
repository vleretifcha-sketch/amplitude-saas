import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExerciseForm } from '@/components/exercises/ExerciseForm';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewExercisePage() {
  const t = createTranslator(await getLocale());

  return (
    <div>
      <PageHeader title={t('exercises.new')} backHref="/exercises" />
      <Card>
        <ExerciseForm />
      </Card>
    </div>
  );
}
