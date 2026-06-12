import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { isAdminEmail } from '@/lib/auth';
import { getPublicSupabaseEnv } from '@/lib/env';
import { getLocale } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!getPublicSupabaseEnv()) {
    redirect('/login?error=config');
  }

  try {
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
  } catch {
    redirect('/login?error=config');
  }

  const locale = await getLocale();

  return (
    <LocaleProvider initialLocale={locale}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </LocaleProvider>
  );
}
