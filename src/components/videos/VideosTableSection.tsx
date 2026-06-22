import { createAdminClient } from '@/lib/supabase/admin';
import { VideosTable, type VideoRow } from '@/components/videos/VideosTable';
import { createTranslator } from '@/i18n';
import { isComplementarySessionType } from '@/lib/video-session';
import type { Video } from '@/lib/types';

type VideoListRow = Pick<
  Video,
  'id' | 'title' | 'type' | 'status' | 'program_id' | 'week_number' | 'duration_seconds' | 'order_in_week' | 'is_premium'
> & {
  programs: { title: string } | { title: string }[] | null;
};

export async function VideosTableSection({ locale }: { locale: 'fr' | 'en' }) {
  const t = createTranslator(locale);
  const db = createAdminClient();
  const [{ data }, { data: exercises }] = await Promise.all([
    db
      .from('videos')
      .select(
        'id, title, type, status, program_id, week_number, duration_seconds, order_in_week, is_premium, programs(title)'
      )
      .order('title'),
    db.from('video_exercises').select('video_id, library_exercise_id'),
  ]);
  const rawVideos = (data ?? []) as VideoListRow[];

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
    const programRelation = Array.isArray(video.programs) ? video.programs[0] : video.programs;
    const exerciseLabel = isComplementarySessionType(video.type)
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
      description: '',
      thumbnail_url: null,
      vimeo_video_id: '',
      vimeo_hash: null,
      order_in_week: video.order_in_week ?? 0,
      published_at: null,
      is_premium: video.is_premium ?? true,
      created_at: '',
      updated_at: '',
      programTitle: programRelation?.title ?? (video.program_id ? video.program_id : t('common.dash')),
      exerciseLabel,
      exerciseCount: isComplementarySessionType(video.type) ? legacyCount || linkedCount : 0,
    };
  });

  return <VideosTable videos={videos} />;
}
