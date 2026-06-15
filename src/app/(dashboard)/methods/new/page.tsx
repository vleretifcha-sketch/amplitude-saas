import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { MethodForm } from '@/components/methods/MethodForm';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewMethodPage() {
  const t = createTranslator(await getLocale());

  return (
    <div>
      <PageHeader title={t('methods.new')} backHref="/methods" />
      <Card>
        <MethodForm />
      </Card>
    </div>
  );
}
