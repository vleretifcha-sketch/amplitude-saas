import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { UsersTable } from '@/components/users/UsersTable';
import { createTranslator, getDateLocale, getLocale } from '@/i18n';
import type { Profile } from '@/lib/types';

export default async function UsersPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const db = createAdminClient();
  const { data } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  const users = (data ?? []) as Profile[];

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        action={
          <Link href="/users/new">
            <Button>{t('users.new')}</Button>
          </Link>
        }
      />
      <UsersTable users={users} dateLocale={dateLocale} />
    </div>
  );
}
