import { PageHeader } from '@/components/ui/PageHeader';
import { NewsletterRecipientsTable } from '@/components/newsletter/NewsletterRecipientsTable';
import { fetchNonPremiumRecipients } from '@/lib/newsletter/server';
import { createTranslator, getDateLocale, getLocale } from '@/i18n';

export default async function NewsletterSubscribersPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const recipients = await fetchNonPremiumRecipients();

  return (
    <div>
      <PageHeader
        title={t('newsletter.subscribersTitle')}
        description={t('newsletter.subscribersDescription', { count: recipients.length })}
        backHref="/newsletter/campaigns"
      />
      <NewsletterRecipientsTable recipients={recipients} dateLocale={dateLocale} />
    </div>
  );
}
