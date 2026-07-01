import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MethodPublishSwitch } from '@/components/methods/MethodPublishSwitch';
import { createTranslator, getLocale } from '@/i18n';
import { translateStatus } from '@/i18n/translator';
import type { Method } from '@/lib/types';

export const revalidate = 30;

export default async function MethodsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const db = createAdminClient();
  const { data } = await db
    .from('methods')
    .select('id, title, sort_order, status')
    .order('sort_order');

  if (!data) {
    return (
      <div>
        <PageHeader title={t('methods.title')} description={t('methods.description')} />
        <Card className="p-6 text-sm text-muted">{t('methods.migrationError')}</Card>
      </div>
    );
  }

  const methods = data as unknown as Method[];

  return (
    <div>
      <PageHeader
        title={t('methods.title')}
        description={t('methods.description')}
        action={
          <Link href="/methods/new">
            <Button>{t('methods.new')}</Button>
          </Link>
        }
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('methods.colTitle')}</th>
              <th className="px-6 py-3">{t('methods.colPublished')}</th>
              <th className="px-6 py-3">{t('methods.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id} className="border-b border-border-subtle/60 hover:bg-surface-muted/40">
                <td className="px-6 py-4">
                  <Link href={`/methods/${method.id}`} className="font-medium hover:text-accent">
                    {method.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <MethodPublishSwitch methodId={method.id} published={method.status === 'published'} />
                </td>
                <td className="px-6 py-4">
                  <Badge tone={method.status === 'published' ? 'success' : 'muted'}>
                    {translateStatus(t, method.status ?? 'draft')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
