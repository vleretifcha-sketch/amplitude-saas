import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewsletterSubscribersPage() {
  const t = createTranslator(await getLocale());

  return (
    <div>
      <PageHeader
        title={t('newsletter.subscribersTitle')}
        description={t('newsletter.subscribersDescription')}
        backHref="/newsletter/campaigns"
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('newsletter.colEmail')}</th>
              <th className="px-6 py-3">{t('newsletter.colStatus')}</th>
              <th className="px-6 py-3">{t('newsletter.colSubscribedAt')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted">
                {t('newsletter.emptySubscribers')}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
