import { PageHeader } from '@/components/ui/PageHeader';
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { RecentSubscriptionsList, SubscriptionChart } from '@/components/dashboard/DashboardWidgets';
import { createTranslator, getLocale } from '@/i18n';
import { getDashboardStats, getRecentSubscriptions, getSubscriptionChartRows } from '@/lib/data';
import { isServerConfigured } from '@/lib/env';

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const [stats, recentSubscriptions, chartRows] = await Promise.all([
    getDashboardStats(),
    getRecentSubscriptions(),
    getSubscriptionChartRows(),
  ]);
  const configured = isServerConfigured();

  return (
    <div className="space-y-8">
      {!configured ? (
        <p className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {t('login.configError')}
        </p>
      ) : null}
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
      <DashboardStatCards stats={stats} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SubscriptionChart rows={chartRows} />
        <RecentSubscriptionsList subscriptions={recentSubscriptions} />
      </div>
    </div>
  );
}
