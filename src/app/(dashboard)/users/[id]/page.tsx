import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SubscriptionForm } from '@/components/users/SubscriptionForm';
import { createTranslator, getDateLocale, getLocale, translateStatus } from '@/i18n';
import type { Profile, Subscription } from '@/lib/types';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: profile }, { data: subs }, { count: sessions }] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).single(),
    db.from('subscriptions').select('*').eq('user_id', id),
    db.from('session_logs').select('*', { count: 'exact', head: true }).eq('user_id', id),
  ]);
  if (!profile) notFound();

  const p = profile as Profile;
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email;

  return (
    <div>
      <PageHeader title={name} description={p.email} backHref="/users" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-medium">{t('users.profile')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.onboarding')}</dt>
              <dd>{p.onboarding_completed ? t('users.onboardingDone') : t('users.onboardingPending')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.activeProgram')}</dt>
              <dd>{p.current_program_id ?? t('common.dash')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.completedSessions')}</dt>
              <dd>{sessions ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.colJoined')}</dt>
              <dd>{new Date(p.created_at).toLocaleString(dateLocale)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-medium">{t('users.subscription')}</h2>
          <SubscriptionForm profile={p} />
          {(subs as Subscription[] | null)?.length ? (
            <div className="mt-6 space-y-2 border-t border-border-subtle pt-4 text-sm">
              <p className="text-secondary">{t('users.subscriptionHistory')}</p>
              {(subs as Subscription[]).map((s) => (
                <div key={s.id} className="rounded-2xl bg-surface-muted p-3">
                  <p>
                    {s.product_id} — {translateStatus(t, s.status)} ({s.platform ?? 'n/a'})
                  </p>
                  <p className="text-muted">
                    {s.expires_at
                      ? t('users.expires', {
                          date: new Date(s.expires_at).toLocaleDateString(dateLocale),
                        })
                      : t('users.noExpiry')}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
