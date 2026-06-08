import { Suspense } from 'react';
import { getLocale } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <LocaleProvider initialLocale={locale}>
      <Suspense>{children}</Suspense>
    </LocaleProvider>
  );
}
