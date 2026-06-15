import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewsletterCampaignsPage() {
  const t = createTranslator(await getLocale());

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
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">{t('newsletter.emptyCampaignsTitle')}</p>
        <p className="mt-2 text-sm text-muted">{t('newsletter.emptyCampaignsHint')}</p>
        <Link href="/newsletter/campaigns/new" className="mt-6 inline-block">
          <Button variant="secondary">{t('newsletter.newCampaign')}</Button>
        </Link>
      </Card>
    </div>
  );
}
