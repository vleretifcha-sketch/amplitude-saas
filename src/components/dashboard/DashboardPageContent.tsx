import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { RecentSubscriptionsList, SubscriptionChart } from '@/components/dashboard/DashboardWidgets';
import { getDashboardStats, getRecentSubscriptions, getSubscriptionChartRows } from '@/lib/data';

export async function DashboardPageContent() {
  const [stats, recentSubscriptions, chartRows] = await Promise.all([
    getDashboardStats(),
    getRecentSubscriptions(),
    getSubscriptionChartRows(),
  ]);

  return (
    <>
      <DashboardStatCards stats={stats} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SubscriptionChart rows={chartRows} />
        <RecentSubscriptionsList subscriptions={recentSubscriptions} />
      </div>
    </>
  );
}
