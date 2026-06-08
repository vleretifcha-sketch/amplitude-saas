import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { VideoForm } from '@/components/videos/VideoForm';
import type { Exercise, Video, VideoExercise } from '@/lib/types';

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: video }, { data: programs }, { data: exercises }, { data: library }] =
    await Promise.all([
      db.from('videos').select('*').eq('id', id).single(),
      db.from('programs').select('id, title').order('sort_order'),
      db.from('video_exercises').select('*').eq('video_id', id).order('sort_order'),
      db.from('exercises').select('*').order('name'),
    ]);
  if (!video) notFound();

  return (
    <div>
      <PageHeader title={video.title} backHref="/videos" />
      <Card>
        <VideoForm
          video={video as Video}
          programs={programs ?? []}
          library={(library ?? []) as Exercise[]}
          exercises={(exercises ?? []) as VideoExercise[]}
        />
      </Card>
    </div>
  );
}
