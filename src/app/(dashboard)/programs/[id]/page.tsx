import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramForm } from '@/components/programs/ProgramForm';
import type { Program } from '@/lib/types';

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: program }, { data: videos }] = await Promise.all([
    db.from('programs').select('*').eq('id', id).single(),
    db
      .from('videos')
      .select('id, title, type, program_id, programs(title)')
      .order('program_id')
      .order('week_number')
      .order('order_in_week'),
  ]);
  if (!program) notFound();

  type VideoOption = {
    id: string;
    title: string;
    type: string;
    program_id: string;
    programs: { title: string } | null;
  };

  const catalog = ((videos ?? []) as unknown as VideoOption[]).map((video) => ({
    id: video.id,
    title: video.title,
    type: video.type as 'signature' | 'complementary',
    programId: video.program_id,
    programTitle: video.programs?.title ?? video.program_id,
  }));

  return (
    <div>
      <PageHeader title={program.title} backHref="/programs" />
      <Card>
        <ProgramForm program={program as Program} programId={id} videos={catalog} />
      </Card>
    </div>
  );
}
