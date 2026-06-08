import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { VideosTable, type VideoRow } from '@/components/videos/VideosTable';
import { createTranslator, getLocale } from '@/i18n';
import type { Video } from '@/lib/types';

export default async function VideosPage() {
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const [{ data }, { data: exercises }] = await Promise.all([
    db.from('videos').select('*, programs(title)').order('title'),
    db.from('video_exercises').select('video_id, library_exercise_id'),
  ]);
  const rawVideos = (data ?? []) as (Video & { programs: { title: string } | null })[];

  const exerciseCountByVideo = (exercises ?? []).reduce<Record<string, number>>((acc, row) => {
    if (!row.library_exercise_id) return acc;
    acc[row.video_id] = (acc[row.video_id] ?? 0) + 1;
    return acc;
  }, {});
  const legacyCountByVideo = (exercises ?? []).reduce<Record<string, number>>((acc, row) => {
    if (row.library_exercise_id) return acc;
    acc[row.video_id] = (acc[row.video_id] ?? 0) + 1;
    return acc;
  }, {});

  const videos: VideoRow[] = rawVideos.map((video) => {
    const legacyCount = legacyCountByVideo[video.id] ?? 0;
    const linkedCount = exerciseCountByVideo[video.id] ?? 0;
    const exerciseLabel =
      video.type === 'complementary'
        ? legacyCount
          ? t(legacyCount > 1 ? 'videos.importLegacyPlural' : 'videos.importLegacy', {
              count: legacyCount,
            })
          : t(linkedCount > 1 ? 'videos.exerciseCountPlural' : 'videos.exerciseCount', {
              count: linkedCount,
            })
        : t('common.dash');

    return {
      ...video,
      programTitle: video.programs?.title ?? video.program_id,
      exerciseLabel,
      exerciseCount: video.type === 'complementary' ? legacyCount || linkedCount : 0,
    };
  });

  return (
    <div>
      <PageHeader
        title={t('videos.title')}
        description={t('videos.description')}
        action={
          <Link href="/videos/new">
            <Button>{t('videos.new')}</Button>
          </Link>
        }
      />
      <VideosTable videos={videos} />
    </div>
  );
}
