import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { VideoForm } from '@/components/videos/VideoForm';
import { createTranslator, getLocale } from '@/i18n';
import { getExerciseLibrary, getProgramsList } from '@/lib/queries';

export default async function NewVideoPage() {
  const t = createTranslator(await getLocale());
  const [programs, library] = await Promise.all([getProgramsList(), getExerciseLibrary()]);

  return (
    <div>
      <PageHeader title={t('videos.new')} backHref="/videos" />
      <Card>
        <VideoForm programs={programs} library={library} />
      </Card>
    </div>
  );
}
