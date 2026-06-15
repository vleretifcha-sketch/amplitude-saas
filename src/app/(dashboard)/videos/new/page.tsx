import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { VideoForm } from '@/components/videos/VideoForm';
import { createTranslator, getLocale } from '@/i18n';
import { getExerciseLibrary } from '@/lib/queries';

export default async function NewVideoPage() {
  const t = createTranslator(await getLocale());
  const library = await getExerciseLibrary();

  return (
    <div>
      <PageHeader title={t('videos.new')} backHref="/videos" />
      <Card>
        <VideoForm library={library} />
      </Card>
    </div>
  );
}
