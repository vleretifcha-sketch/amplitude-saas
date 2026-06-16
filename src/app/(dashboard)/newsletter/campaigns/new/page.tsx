import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { NewsletterCampaignForm } from '@/components/newsletter/NewsletterCampaignForm';
import { fetchNonPremiumRecipients } from '@/actions/newsletter';
import { getEmailConnectionStatus } from '@/actions/settings';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewNewsletterCampaignPage() {
  const t = createTranslator(await getLocale());
  const [emailStatus, recipients] = await Promise.all([
    getEmailConnectionStatus(),
    fetchNonPremiumRecipients(),
  ]);

  return (
    <div>
      <PageHeader
        title={t('newsletter.newCampaign')}
        description={t('newsletter.newCampaignDescription')}
        backHref="/newsletter/campaigns"
      />
      <Card>
        <NewsletterCampaignForm emailStatus={emailStatus} recipientCount={recipients.length} />
      </Card>
    </div>
  );
}
