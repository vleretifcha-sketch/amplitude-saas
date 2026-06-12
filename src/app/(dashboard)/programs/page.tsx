import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { createTranslator, getLocale } from '@/i18n';
import type { Program } from '@/lib/types';

export const revalidate = 30;

export default async function ProgramsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const db = createAdminClient();
  const { data } = await db
    .from('programs')
    .select('id, title, duration_weeks, is_premium, sort_order')
    .order('sort_order');
  const programs = (data ?? []) as Program[];

  return (
    <div>
      <PageHeader
        title={t('programs.title')}
        description={t('programs.description')}
        action={
          <Link href="/programs/new">
            <Button>{t('programs.new')}</Button>
          </Link>
        }
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('programs.colTitle')}</th>
              <th className="px-6 py-3">{t('programs.colPremium')}</th>
              <th className="px-6 py-3">{t('programs.colWeeks')}</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle/60 hover:bg-surface-muted/40">
                <td className="px-6 py-4">
                  <Link href={`/programs/${p.id}`} className="font-medium hover:text-accent">
                    {p.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Badge tone={p.is_premium ? 'accent' : 'success'}>
                    {p.is_premium ? t('programs.premium') : t('programs.free')}
                  </Badge>
                </td>
                <td className="px-6 py-4">{p.duration_weeks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
