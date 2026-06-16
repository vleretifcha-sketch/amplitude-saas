import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StripeSettingsForm } from '@/components/settings/StripeSettingsForm';
import { EmailSettingsForm } from '@/components/settings/EmailSettingsForm';
import { getEmailConnectionStatus, getStripeConnectionStatus } from '@/actions/settings';
import { createTranslator, getLocale } from '@/i18n';

export default async function SettingsPage() {
  const t = createTranslator(await getLocale());
  const [stripeStatus, emailStatus] = await Promise.all([
    getStripeConnectionStatus(),
    getEmailConnectionStatus(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
      <Card>
        <h2 className="mb-2 text-lg font-medium">{t('settings.integrations')}</h2>
        <p className="mb-6 text-sm text-secondary">{t('settings.integrationsDescription')}</p>
        <StripeSettingsForm status={stripeStatus} />
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-medium">{t('settings.emailSectionTitle')}</h2>
        <p className="mb-6 text-sm text-secondary">{t('settings.emailSectionDescription')}</p>
        <EmailSettingsForm status={emailStatus} />
      </Card>
    </div>
  );
}
