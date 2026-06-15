import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewNewsletterCampaignPage() {
  const t = createTranslator(await getLocale());

  return (
    <div>
      <PageHeader
        title={t('newsletter.newCampaign')}
        description={t('newsletter.newCampaignDescription')}
        backHref="/newsletter/campaigns"
      />
      <Card>
        <form className="space-y-4">
          <Field>
            <Label htmlFor="subject">{t('newsletter.formSubject')}</Label>
            <Input id="subject" name="subject" placeholder={t('newsletter.formSubjectPlaceholder')} />
          </Field>
          <Field>
            <Label htmlFor="preview">{t('newsletter.formPreview')}</Label>
            <Input id="preview" name="preview" placeholder={t('newsletter.formPreviewPlaceholder')} />
          </Field>
          <Field>
            <Label htmlFor="body">{t('newsletter.formBody')}</Label>
            <Textarea id="body" name="body" rows={10} placeholder={t('newsletter.formBodyPlaceholder')} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary">
              {t('newsletter.saveDraft')}
            </Button>
            <Button type="button">{t('newsletter.sendCampaign')}</Button>
          </div>
          <p className="text-xs text-muted">{t('newsletter.comingSoonHint')}</p>
        </form>
      </Card>
    </div>
  );
}
