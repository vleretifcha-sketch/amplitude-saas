'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTranslator, type Translator } from '@/i18n/translator';
import { LOCALE_COOKIE, type Locale } from '@/i18n/types';

type LocaleContextValue = {
  locale: Locale;
  t: Translator;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      writeLocaleCookie(next);
      setLocaleState(next);
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo(
    () => ({
      locale,
      t: createTranslator(locale),
      setLocale,
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={className}>
      <div className="flex gap-1 rounded-2xl bg-surface-muted p-1">
        {(['fr', 'en'] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              locale === code
                ? 'bg-button text-inverse'
                : 'text-secondary hover:text-foreground'
            }`}
          >
            {t(`lang.${code}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
