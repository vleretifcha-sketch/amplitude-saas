import { Suspense } from 'react';
import { TableLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';
import { UsersPageContent } from '@/components/users/UsersPageContent';
import { getLocale } from '@/i18n';

export const revalidate = 30;

export default async function UsersPage() {
  const locale = await getLocale();

  return (
    <Suspense fallback={<TableLoadingSkeleton rows={10} />}>
      <UsersPageContent locale={locale} />
    </Suspense>
  );
}
