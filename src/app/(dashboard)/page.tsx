import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { createTranslator, getLocale } from '@/i18n';
import { getDashboardStats } from '@/lib/data';

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const stats = await getDashboardStats();

  const statLabels: { key: keyof typeof stats; label: string }[] = [
    { key: 'users', label: t('dashboard.users') },
    { key: 'activeSubscriptions', label: t('dashboard.activeSubscriptions') },
    { key: 'programs', label: t('dashboard.programs') },
    { key: 'publishedVideos', label: t('dashboard.publishedSessions') },
    { key: 'sessionsThisMonth', label: t('dashboard.sessionsThisMonth') },
    { key: 'communityPosts', label: t('dashboard.communityPosts') },
  ];

  return (
    <div>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statLabels.map(({ key, label }) => (
          <Card key={key}>
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-accent">{stats[key]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
