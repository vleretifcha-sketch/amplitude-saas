import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExerciseForm } from '@/components/exercises/ExerciseForm';
import type { Exercise } from '@/lib/types';

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createAdminClient();
  const { data } = await db.from('exercises').select('*').eq('id', id).single();
  if (!data) notFound();

  return (
    <div>
      <PageHeader title={data.name} backHref="/exercises" />
      <Card>
        <ExerciseForm exercise={data as Exercise} />
      </Card>
    </div>
  );
}
