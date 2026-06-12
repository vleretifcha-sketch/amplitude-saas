import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent';
import { createTranslator, getLocale } from '@/i18n';
import { isServerConfigured } from '@/lib/env';

export const revalidate = 30;

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const configured = isServerConfigured();

  return (
    <div className="space-y-8">
      {!configured ? (
        <p className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {t('login.configError')}
        </p>
      ) : null}
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
      <Suspense fallback={<PageLoadingSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </div>
  );
}
