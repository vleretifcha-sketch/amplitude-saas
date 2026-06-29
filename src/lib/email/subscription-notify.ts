import {
  getSubscriptionNotifySender,
  resolveSubscriptionNotifyRecipients,
  sendResendMessage,
} from '@/lib/email/server';
import { isOvhSmtpConfigured, sendViaOvhSmtp } from '@/lib/email/ovh-smtp';
import { DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL, buildSubscriptionNotifyContent } from '@/lib/email/subscription-notify-shared';
import { persistSubscriptionNotifyLog } from '@/lib/email/subscription-notify-log';
import { createAdminClient } from '@/lib/supabase/admin';

function recipientsNeedOvhSmtp(recipients: string[]): boolean {
  return recipients.some((email) => email.endsWith('@amplitudeapp.fr'));
}

export type SubscriptionNotifyResult =
  | { ok: true; id?: string; recipients: string[] }
  | { ok: false; error: string; recipients: string[] };

export async function sendSubscriptionAdminNotification(params: {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  planLabel?: string | null;
  amountLabel?: string | null;
}): Promise<SubscriptionNotifyResult> {
  const recipients = await resolveSubscriptionNotifyRecipients();
  const at = new Date().toISOString();

  try {
    let email = params.userEmail?.trim() || '';
    let name = params.userName?.trim() || '';

    if (!email) {
      const db = createAdminClient();
      const { data: profile } = await db
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', params.userId)
        .maybeSingle();
      email = profile?.email ?? '';
      name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || email;
    }

    const { subject, text, html } = buildSubscriptionNotifyContent({
      ...params,
      userEmail: email,
      userName: name,
    });

    const replyTo = email || DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL;

    if (recipientsNeedOvhSmtp(recipients) && isOvhSmtpConfigured()) {
      const ovhResult = await sendViaOvhSmtp({ to: recipients, subject, text, html, replyTo });
      if (ovhResult.ok) {
        console.info('[subscription-notify] sent via OVH SMTP →', recipients.join(', '));
        await persistSubscriptionNotifyLog({ at, ok: true, recipients, source: 'saas' });
        return { ok: true, recipients };
      }
      console.error('[subscription-notify] OVH SMTP failed:', ovhResult.error);
      await persistSubscriptionNotifyLog({
        at,
        ok: false,
        recipients,
        error: ovhResult.error,
        source: 'saas',
      });
      return { ok: false, error: ovhResult.error, recipients };
    }

    const sender = await getSubscriptionNotifySender();
    const result = await sendResendMessage({
      to: recipients,
      subject,
      text,
      html,
      replyTo,
      from: sender.from,
    });

    if (!result.ok) {
      console.error('[subscription-notify] send failed:', result.error, '→', recipients.join(', '));
      await persistSubscriptionNotifyLog({
        at,
        ok: false,
        recipients,
        error: result.error,
        source: 'saas',
      });
      return { ok: false, error: result.error, recipients };
    }

    console.info('[subscription-notify] sent', result.id ?? '(no id)', '→', recipients.join(', '));
    await persistSubscriptionNotifyLog({
      at,
      ok: true,
      recipients,
      resendId: result.id ?? null,
      source: 'saas',
    });
    return { ok: true, id: result.id, recipients };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[subscription-notify] error:', message);
    await persistSubscriptionNotifyLog({
      at,
      ok: false,
      recipients,
      error: message,
      source: 'saas',
    });
    return { ok: false, error: message, recipients };
  }
}

export async function sendSubscriptionNotifyTest(): Promise<SubscriptionNotifyResult> {
  return sendSubscriptionAdminNotification({
    userId: '00000000-0000-0000-0000-000000000000',
    userEmail: 'test@example.com',
    userName: 'Test notification',
    planLabel: 'Amplitude Pro (test)',
    amountLabel: '498,00 EUR/an',
  });
}
