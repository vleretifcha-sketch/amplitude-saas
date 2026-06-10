import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { createTranslator, getLocale } from '@/i18n';

export default async function NewUserPage() {
  const t = createTranslator(await getLocale());

  return (
    <div>
      <PageHeader title={t('users.new')} backHref="/users" />
      <Card>
        <CreateUserForm />
      </Card>
    </div>
  );
}
