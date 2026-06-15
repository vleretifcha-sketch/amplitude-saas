import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewProgramInMethodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: methodId } = await params;
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const { data: method } = await db.from('methods').select('id, title').eq('id', methodId).single();
  if (!method) notFound();

  return (
    <div>
      <PageHeader
        title={t('methods.newProgram')}
        description={method.title}
        backHref={`/methods/${methodId}`}
      />
      <Card>
        <ProgramForm methodId={methodId} />
      </Card>
    </div>
  );
}
