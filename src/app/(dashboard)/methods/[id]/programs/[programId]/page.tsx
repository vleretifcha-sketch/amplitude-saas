import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { createTranslator, getLocale } from '@/i18n';
import type { Program } from '@/lib/types';

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string; programId: string }>;
}) {
  const { id: methodId, programId } = await params;
  const t = createTranslator(await getLocale());
  const db = createAdminClient();

  const [{ data: method }, { data: program }, { data: videos }] = await Promise.all([
    db.from('methods').select('id, title').eq('id', methodId).single(),
    db.from('programs').select('*').eq('id', programId).eq('method_id', methodId).single(),
    db
      .from('videos')
      .select('id, title, type, program_id, programs(title)')
      .order('title'),
  ]);

  if (!method || !program) notFound();

  type VideoOption = {
    id: string;
    title: string;
    type: string;
    program_id: string | null;
    programs: { title: string } | null;
  };

  const catalog = ((videos ?? []) as unknown as VideoOption[]).map((video) => ({
    id: video.id,
    title: video.title,
    type: video.type as 'signature' | 'complementary' | 'mobility',
    programId: video.program_id,
    programTitle: video.programs?.title ?? '',
  }));

  return (
    <div>
      <PageHeader
        title={program.title}
        description={method.title}
        backHref={`/methods/${methodId}`}
      />
      <Card>
        <ProgramForm methodId={methodId} program={program as Program} videos={catalog} />
      </Card>
    </div>
  );
}
