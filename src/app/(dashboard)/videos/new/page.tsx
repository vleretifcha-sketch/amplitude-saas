import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { VideoForm } from '@/components/videos/VideoForm';
import { createTranslator, getLocale } from '@/i18n';
import type { Exercise } from '@/lib/types';

export default async function NewVideoPage() {
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const [{ data: programs }, { data: library }] = await Promise.all([
    db.from('programs').select('id, title').order('sort_order'),
    db.from('exercises').select('*').order('name'),
  ]);

  return (
    <div>
      <PageHeader title={t('videos.new')} backHref="/videos" />
      <Card>
        <VideoForm programs={programs ?? []} library={(library ?? []) as Exercise[]} />
      </Card>
    </div>
  );
}
