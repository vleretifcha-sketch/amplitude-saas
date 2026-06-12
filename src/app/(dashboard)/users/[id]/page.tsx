import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { DeleteUserButton } from '@/components/users/DeleteUserButton';
import { SubscriptionForm } from '@/components/users/SubscriptionForm';
import { UserProfileForm } from '@/components/users/UserProfileForm';
import { createTranslator, getDateLocale, getLocale, translateStatus } from '@/i18n';
import type { Profile, Subscription, SubscriptionStatus } from '@/lib/types';

const subTone: Record<SubscriptionStatus, 'success' | 'accent' | 'warning' | 'muted'> = {
  active: 'success',
  trial: 'accent',
  expired: 'warning',
  none: 'muted',
};

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

  const [{ data: profile }, { data: subs }, { count: sessions }, { data: recentSessions }] =
    await Promise.all([
      db.from('profiles').select('*').eq('id', id).single(),
      db.from('subscriptions').select('*').eq('user_id', id).order('started_at', { ascending: false }),
      db.from('session_logs').select('*', { count: 'exact', head: true }).eq('user_id', id),
      db
        .from('session_logs')
        .select('completed_at, videos(title)')
        .eq('user_id', id)
        .order('completed_at', { ascending: false })
        .limit(5),
    ]);

  if (!profile) notFound();

  const p = profile as Profile;
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email;

  const { data: activeProgram } = p.current_program_id
    ? await db.from('programs').select('title').eq('id', p.current_program_id).maybeSingle()
    : { data: null };

  return (
    <div>
      <PageHeader title={name} description={p.email} backHref="/users" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={subTone[p.subscription_status]}>{translateStatus(t, p.subscription_status)}</Badge>
        {p.onboarding_completed ? (
          <Badge tone="success">{t('users.onboardingDone')}</Badge>
        ) : (
          <Badge tone="warning">{t('users.onboardingPending')}</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-medium">{t('users.profile')}</h2>
          {p.avatar_url ? (
            <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar_url} alt="" className="max-h-40 w-full object-cover" />
            </div>
          ) : null}
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.colEmail')}</dt>
              <dd className="text-right">{p.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.userId')}</dt>
              <dd className="truncate text-right font-mono text-xs">{p.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.activeProgram')}</dt>
              <dd>{activeProgram?.title ?? t('common.dash')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.completedSessions')}</dt>
              <dd>{sessions ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.premiumPrompts')}</dt>
              <dd>{p.premium_prompt_count ?? 0}</dd>
            </div>
            {p.last_premium_prompt_at ? (
              <div className="flex justify-between gap-4">
                <dt className="text-secondary">{t('users.lastPremiumPrompt')}</dt>
                <dd>{new Date(p.last_premium_prompt_at).toLocaleString(dateLocale)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.subExpires')}</dt>
              <dd>
                {p.subscription_expires_at
                  ? new Date(p.subscription_expires_at).toLocaleString(dateLocale)
                  : t('users.noExpiry')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.colJoined')}</dt>
              <dd>{new Date(p.created_at).toLocaleString(dateLocale)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t('users.lastUpdated')}</dt>
              <dd>{new Date(p.updated_at).toLocaleString(dateLocale)}</dd>
            </div>
          </dl>
          <UserProfileForm profile={p} />
        </Card>

        <div className="space-y-6">
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
                      {s.started_at
                        ? `${t('users.startedAt', {
                            date: new Date(s.started_at).toLocaleDateString(dateLocale),
                          })} · `
                        : ''}
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

          <Card>
            <h2 className="mb-4 text-lg font-medium">{t('users.recentSessions')}</h2>
            {(recentSessions ?? []).length === 0 ? (
              <p className="text-sm text-muted">{t('users.noRecentSessions')}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(recentSessions ?? []).map((row, index) => {
                  const video = row.videos as { title: string } | { title: string }[] | null;
                  const title = Array.isArray(video) ? video[0]?.title : video?.title;
                  return (
                    <li
                      key={`${row.completed_at}-${index}`}
                      className="flex justify-between gap-4 rounded-2xl bg-surface-muted px-3 py-2"
                    >
                      <span>{title ?? t('common.dash')}</span>
                      <span className="text-muted">
                        {new Date(row.completed_at).toLocaleDateString(dateLocale)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-medium text-error">{t('users.dangerZone')}</h2>
        <p className="mb-4 text-sm text-secondary">{t('users.dangerHint')}</p>
        <DeleteUserButton userId={p.id} userName={name} />
      </Card>
    </div>
  );
}
