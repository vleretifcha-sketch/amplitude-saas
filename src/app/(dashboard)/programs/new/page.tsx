import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewProgramPage() {
  const t = createTranslator(await getLocale());

  return (
    <div>
      <PageHeader title={t('programs.new')} backHref="/programs" />
      <Card>
        <ProgramForm />
      </Card>
    </div>
  );
}
