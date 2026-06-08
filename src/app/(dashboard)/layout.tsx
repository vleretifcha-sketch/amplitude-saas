import { Sidebar } from '@/components/layout/Sidebar';
import { getLocale } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <LocaleProvider initialLocale={locale}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </LocaleProvider>
  );
}
