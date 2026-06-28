import { Suspense } from 'react';
import { TableLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';
import { SubscriptionsPageContent } from '@/components/users/SubscriptionsPageContent';
import { getLocale } from '@/i18n';

export const revalidate = 30;

export default async function SubscriptionsPage() {
  const locale = await getLocale();

  return (
    <Suspense fallback={<TableLoadingSkeleton rows={6} />}>
      <SubscriptionsPageContent locale={locale} />
    </Suspense>
  );
}
