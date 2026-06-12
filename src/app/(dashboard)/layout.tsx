import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavigationProgress } from '@/components/layout/NavigationProgress';
import { AppToaster } from '@/components/ui/AppToaster';
import { getPublicSupabaseEnv } from '@/lib/env';
import { getLocale } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!getPublicSupabaseEnv()) {
    redirect('/login?error=config');
  }

  const locale = await getLocale();

  return (
    <LocaleProvider initialLocale={locale}>
      <NavigationProgress />
      <AppToaster />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </LocaleProvider>
  );
}
