import { createAdminClient } from '@/lib/supabase/admin';
import {
  SUBSCRIPTION_NOTIFY_LAST_LOG_SETTING,
  type SubscriptionNotifyLog,
} from '@/lib/email/subscription-notify-shared';

export async function getSubscriptionNotifyLastLog(): Promise<SubscriptionNotifyLog | null> {
  const db = createAdminClient();
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', SUBSCRIPTION_NOTIFY_LAST_LOG_SETTING)
    .maybeSingle();

  if (!data?.value?.trim()) return null;

  try {
    return JSON.parse(data.value) as SubscriptionNotifyLog;
  } catch {
    return null;
  }
}

export async function persistSubscriptionNotifyLog(log: SubscriptionNotifyLog): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from('app_settings').upsert(
    {
      key: SUBSCRIPTION_NOTIFY_LAST_LOG_SETTING,
      value: JSON.stringify(log),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    console.error('[subscription-notify] failed to persist log:', error.message);
  }
}
