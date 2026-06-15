import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { MethodForm } from '@/components/methods/MethodForm';
import { createTranslator, getLocale } from '@/i18n';
import type { Method, Program } from '@/lib/types';

export default async function MethodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const [{ data: method }, { data: programs }] = await Promise.all([
    db.from('methods').select('*').eq('id', id).single(),
    db.from('programs').select('id, title, duration_weeks, sort_order').eq('method_id', id).order('sort_order'),
  ]);

  if (!method) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={method.title} backHref="/methods" />
      <Card>
        <MethodForm method={method as Method} />
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{t('methods.programsTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('methods.programsHint')}</p>
          </div>
          <Link href={`/methods/${id}/programs/new`}>
            <Button>{t('methods.newProgram')}</Button>
          </Link>
        </div>

        {(programs ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t('methods.programsEmpty')}</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {(programs as Program[]).map((program) => (
              <li key={program.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Link
                    href={`/methods/${id}/programs/${program.id}`}
                    className="font-medium hover:text-accent"
                  >
                    {program.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {t('programs.formDuration')}: {program.duration_weeks}
                  </p>
                </div>
                <Link href={`/methods/${id}/programs/${program.id}`}>
                  <Button variant="secondary" size="sm">
                    {t('common.edit')}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
