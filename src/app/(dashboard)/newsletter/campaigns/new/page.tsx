import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { NewsletterCampaignForm } from '@/components/newsletter/NewsletterCampaignForm';
import { fetchNonPremiumRecipients } from '@/lib/newsletter/server';
import { getEmailSettingsStatus } from '@/lib/settings/server';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewNewsletterCampaignPage() {
  const t = createTranslator(await getLocale());
  const [emailStatus, recipients] = await Promise.all([
    getEmailSettingsStatus(),
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
