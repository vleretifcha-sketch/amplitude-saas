import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fetchNewsletterCampaigns } from '@/lib/newsletter/server';
import { createTranslator, getDateLocale, getLocale } from '@/i18n';
import type { NewsletterCampaignStatus } from '@/lib/types';

const campaignStatusKey: Record<NewsletterCampaignStatus, 'newsletter.statusDraft' | 'newsletter.statusSent' | 'newsletter.statusFailed'> = {
  draft: 'newsletter.statusDraft',
  sent: 'newsletter.statusSent',
  failed: 'newsletter.statusFailed',
};

export default async function NewsletterCampaignsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const campaigns = await fetchNewsletterCampaigns();

  return (
    <div>
      <PageHeader
        title={t('newsletter.campaignsTitle')}
        description={t('newsletter.campaignsDescription')}
        action={
          <Link href="/newsletter/campaigns/new">
            <Button>{t('newsletter.newCampaign')}</Button>
          </Link>
        }
      />
      {campaigns.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-foreground">{t('newsletter.emptyCampaignsTitle')}</p>
          <p className="mt-2 text-sm text-muted">{t('newsletter.emptyCampaignsHint')}</p>
          <Link href="/newsletter/campaigns/new" className="mt-6 inline-block">
            <Button variant="secondary">{t('newsletter.newCampaign')}</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle text-secondary">
              <tr>
                <th className="px-6 py-3">{t('newsletter.colSubject')}</th>
                <th className="px-6 py-3">{t('newsletter.colStatus')}</th>
                <th className="px-6 py-3">{t('newsletter.colRecipients')}</th>
                <th className="px-6 py-3">{t('newsletter.colSentAt')}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{campaign.subject}</p>
                    {campaign.preview ? (
                      <p className="mt-1 text-xs text-muted">{campaign.preview}</p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={campaign.status === 'sent' ? 'success' : campaign.status === 'draft' ? 'muted' : 'warning'}>
                      {t(campaignStatusKey[campaign.status])}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-secondary">
                    {campaign.status === 'sent'
                      ? t('newsletter.sentCount', {
                          sent: campaign.sent_count,
                          total: campaign.recipient_count,
                        })
                      : campaign.recipient_count}
                  </td>
                  <td className="px-6 py-4 text-secondary">
                    {campaign.sent_at
                      ? new Date(campaign.sent_at).toLocaleString(dateLocale)
                      : new Date(campaign.created_at).toLocaleString(dateLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
