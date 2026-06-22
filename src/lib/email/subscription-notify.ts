import {
  formatFromAddress,
  getNewsletterFromEmail,
  getNewsletterFromName,
  getResendApiKey,
} from '@/lib/email/server';
import { createAdminClient } from '@/lib/supabase/admin';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_NOTIFY_EMAIL = 'contact@amplitudeapp.fr';

function notifyEmail(): string {
  return process.env.SUBSCRIPTION_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;
}

export async function sendSubscriptionAdminNotification(params: {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  planLabel?: string | null;
  amountLabel?: string | null;
}): Promise<void> {
  try {
    const apiKey = await getResendApiKey();
    const fromEmail = await getNewsletterFromEmail();
    if (!apiKey || !fromEmail) {
      console.warn('Subscription notify skipped: Resend not configured.');
      return;
    }

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

    const fromName = await getNewsletterFromName();
    const from = formatFromAddress(fromEmail, fromName);
    const subject = `Nouvel abonnement Amplitude — ${name || email || params.userId}`;
    const lines: string[] = [
      'Un nouvel abonnement vient d\'être activé.',
      '',
      `Utilisateur : ${name || '—'}`,
      `Email : ${email || '—'}`,
      `ID : ${params.userId}`,
    ];
    if (params.planLabel) lines.push(`Formule : ${params.planLabel}`);
    if (params.amountLabel) lines.push(`Montant : ${params.amountLabel}`);

    const text = lines.join('\n');
    const html = lines.map((line) => `<p>${line}</p>`).join('');

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [notifyEmail()],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      console.error('Subscription notify failed:', await response.text());
    }
  } catch (error) {
    console.error('Subscription notify error:', error);
  }
}
