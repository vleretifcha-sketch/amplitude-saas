import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { isAdminEmail } from '@/lib/auth';
import { getLocale } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!isAdminEmail(user.email)) {
    redirect('/login?error=unauthorized');
  }

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
