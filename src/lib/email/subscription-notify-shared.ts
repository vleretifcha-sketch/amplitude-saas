export const DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL = 'contact@amplitudeapp.fr';

const EMAIL_LIST_SPLIT = /[,;\n]\s*/;

export function parseEmailList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(EMAIL_LIST_SPLIT)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ),
  ];
}

export function mergeEmailLists(...lists: Array<string | null | undefined>): string[] {
  return [...new Set(lists.flatMap((list) => parseEmailList(list)))];
}

export type SubscriptionNotifyPayload = {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  planLabel?: string | null;
  amountLabel?: string | null;
};

export function buildSubscriptionNotifyContent(params: SubscriptionNotifyPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const email = params.userEmail?.trim() || '—';
  const name = params.userName?.trim() || email;
  const subject = `Nouvel abonnement Amplitude — ${params.planLabel ?? 'Nouveau client'} — ${name}`;
  const lines = [
    'Un nouvel abonnement vient d\'être activé sur Amplitude.',
    '',
    `Utilisateur : ${name}`,
    `Email : ${email}`,
    `ID : ${params.userId}`,
    params.planLabel ? `Offre : ${params.planLabel}` : null,
    params.amountLabel ? `Montant : ${params.amountLabel}` : null,
    '',
    '— Notification automatique Amplitude',
  ].filter(Boolean) as string[];

  const text = lines.join('\n');
  const html = lines.map((line) => `<p style="margin:0 0 8px">${line}</p>`).join('');

  return { subject, text, html };
}
