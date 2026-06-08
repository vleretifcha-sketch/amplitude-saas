'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Label } from '@/components/ui/Input';
import { LanguageSwitcher, useLocale } from '@/i18n/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const errorParam = searchParams.get('error');
  const unauthorized = errorParam === 'unauthorized';
  const configError = errorParam === 'config';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unauthorized) setError(t('login.adminOnly'));
    else if (configError) setError(t('login.configError'));
  }, [unauthorized, configError, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError(t('login.serverError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Amplitude</p>
            <h1 className="mt-1 text-2xl font-semibold text-accent">{t('nav.admin')}</h1>
            <p className="mt-2 text-sm text-secondary">{t('login.subtitle')}</p>
          </div>
          <LanguageSwitcher className="shrink-0" />
        </div>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field>
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('login.loading') : t('login.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
