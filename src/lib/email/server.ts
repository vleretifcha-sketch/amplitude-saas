import { createAdminClient } from '@/lib/supabase/admin';
import { decryptSetting } from '@/lib/settings-crypto';
import { getPublicAppUrl } from '@/lib/app-url';
import {
  DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL,
  mergeEmailLists,
  type SubscriptionNotifyLog,
} from '@/lib/email/subscription-notify-shared';
import { getSubscriptionNotifyLastLog } from '@/lib/email/subscription-notify-log';

export const RESEND_API_KEY_SETTING = 'resend_api_key';
export const NEWSLETTER_FROM_EMAIL_SETTING = 'newsletter_from_email';
export const NEWSLETTER_FROM_NAME_SETTING = 'newsletter_from_name';
export const NEWSLETTER_FOOTER_LOGO_URL_SETTING = 'newsletter_footer_logo_url';
export const SUBSCRIPTION_NOTIFY_EMAIL_SETTING = 'subscription_notify_email';

const RESEND_API_URL = 'https://api.resend.com';

export type ResendDomain = {
  name: string;
  status: string;
};

export type EmailConnectionStatus = {
  connected: boolean;
  fromEmail: string | null;
  fromName: string | null;
  notifyEmail: string | null;
  notifyRecipients: string[];
  notifyLastLog: SubscriptionNotifyLog | null;
  hasApiKey: boolean;
  keyDecryptOk: boolean;
  footerLogoUrl: string;
  domainName: string | null;
  domainStatus: string | null;
  domainVerified: boolean;
  resendDomains: ResendDomain[];
  issue: 'none' | 'missing_key' | 'decrypt_failed' | 'missing_from' | 'domain_not_verified' | 'resend_api_error';
  issueDetail: string | null;
};

async function getSettingValue(key: string): Promise<string | null> {
  const db = createAdminClient();
  const { data } = await db.from('app_settings').select('value').eq('key', key).maybeSingle();
  return data?.value?.trim() || null;
}

export async function getResendApiKey(): Promise<string | null> {
  const encrypted = await getSettingValue(RESEND_API_KEY_SETTING);
  if (!encrypted) return null;

  try {
    return decryptSetting(encrypted);
  } catch {
    return null;
  }
}

export async function getNewsletterFromEmail(): Promise<string | null> {
  return getSettingValue(NEWSLETTER_FROM_EMAIL_SETTING);
}

export async function getNewsletterFromName(): Promise<string | null> {
  return getSettingValue(NEWSLETTER_FROM_NAME_SETTING);
}

export function getDefaultNewsletterFooterLogoUrl(): string {
  return `${getPublicAppUrl()}/amplitude-logo.jpg`;
}

/** Ensures campaign emails always reference a public absolute logo URL. */
export function resolveNewsletterLogoUrl(raw: string | null | undefined): string {
  const trimmed = raw?.trim();
  const fallback = getDefaultNewsletterFooterLogoUrl();

  if (!trimmed) return fallback;

  try {
    const absolute = trimmed.startsWith('/') ? `${getPublicAppUrl()}${trimmed}` : trimmed;
    const parsed = new URL(absolute);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return fallback;
    return absolute;
  } catch {
    return fallback;
  }
}

export async function getNewsletterFooterLogoUrl(): Promise<string> {
  const custom = await getSettingValue(NEWSLETTER_FOOTER_LOGO_URL_SETTING);
  return resolveNewsletterLogoUrl(custom);
}

export async function getSubscriptionNotifyEmail(): Promise<string | null> {
  return getSettingValue(SUBSCRIPTION_NOTIFY_EMAIL_SETTING);
}

export async function resolveSubscriptionNotifyRecipients(): Promise<string[]> {
  const [fromSettings, fromEnv] = await Promise.all([
    getSubscriptionNotifyEmail(),
    Promise.resolve(process.env.SUBSCRIPTION_NOTIFY_EMAIL ?? null),
  ]);

  const recipients = mergeEmailLists(fromSettings, fromEnv);
  if (recipients.length > 0) return recipients;
  return [DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL];
}

export async function sendResendMessage(params: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const recipients = [...new Set(params.to.map((email) => email.trim().toLowerCase()))].filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, error: 'No notification recipients configured.' };
  }

  const status = await getEmailConnectionStatus();
  if (!status.keyDecryptOk || !status.fromEmail) {
    return { ok: false, error: 'Resend is not configured.' };
  }
  if (!status.domainVerified) {
    return {
      ok: false,
      error: status.issueDetail ?? 'Sender domain is not verified in Resend.',
    };
  }

  const apiKey = await getResendApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Resend API key cannot be decrypted. Re-save it in Settings.' };
  }

  const sender = await getNewsletterSender();
  const response = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender.from,
      to: recipients,
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    return { ok: false, error: parseResendError(await response.text()) };
  }

  const payload = (await response.json()) as { id?: string };
  return { ok: true, id: payload.id };
}

async function fetchResendDomains(apiKey: string): Promise<
  { ok: true; domains: ResendDomain[] } | { ok: false; error: string }
> {
  try {
    const response = await fetch(`${RESEND_API_URL}/domains`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, error: parseResendError(await response.text()) };
    }

    const payload = (await response.json()) as { data?: ResendDomain[] };
    return { ok: true, domains: payload.data ?? [] };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Impossible de contacter Resend.',
    };
  }
}

function domainFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const domain = email.split('@')[1]?.trim().toLowerCase();
  return domain || null;
}

export async function getEmailConnectionStatus(): Promise<EmailConnectionStatus> {
  const [encryptedKey, fromEmail, fromName, footerLogoUrl, notifyEmail, notifyRecipients, notifyLastLog] =
    await Promise.all([
    getSettingValue(RESEND_API_KEY_SETTING),
    getNewsletterFromEmail(),
    getNewsletterFromName(),
    getNewsletterFooterLogoUrl(),
    getSubscriptionNotifyEmail(),
    resolveSubscriptionNotifyRecipients(),
    getSubscriptionNotifyLastLog(),
  ]);

  const base = {
    fromEmail,
    fromName,
    notifyEmail,
    notifyRecipients,
    notifyLastLog,
    hasApiKey: Boolean(encryptedKey),
    keyDecryptOk: false,
    footerLogoUrl,
    domainName: domainFromEmail(fromEmail),
    domainStatus: null as string | null,
    domainVerified: false,
    resendDomains: [] as ResendDomain[],
    issue: 'none' as EmailConnectionStatus['issue'],
    issueDetail: null as string | null,
    connected: false,
  };

  if (!encryptedKey) {
    return { ...base, issue: 'missing_key' };
  }

  if (!fromEmail) {
    return { ...base, issue: 'missing_from' };
  }

  let apiKey: string | null = null;
  try {
    apiKey = await decryptSetting(encryptedKey);
    base.keyDecryptOk = true;
  } catch (error) {
    return {
      ...base,
      issue: 'decrypt_failed',
      issueDetail: error instanceof Error ? error.message : null,
    };
  }

  const domainsResult = await fetchResendDomains(apiKey);
  if (!domainsResult.ok) {
    return {
      ...base,
      issue: 'resend_api_error',
      issueDetail: domainsResult.error,
    };
  }

  const domainName = domainFromEmail(fromEmail);
  const matched = domainsResult.domains.find((domain) => domain.name === domainName);
  const domainVerified = matched?.status === 'verified';

  return {
    ...base,
    resendDomains: domainsResult.domains,
    domainName,
    domainStatus: matched?.status ?? 'not_found',
    domainVerified,
    issue: domainVerified ? 'none' : 'domain_not_verified',
    issueDetail: domainVerified
      ? null
      : matched
        ? `Statut Resend : ${matched.status}`
        : `Le domaine « ${domainName} » n’est pas ajouté dans Resend.`,
    connected: domainVerified,
  };
}

export async function isEmailConnected(): Promise<boolean> {
  const status = await getEmailConnectionStatus();
  return status.connected;
}

export function formatFromAddress(email: string, name?: string | null): string {
  const trimmedName = name?.trim();
  if (trimmedName) return `${trimmedName} <${email}>`;
  return email;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function renderCampaignLogo(logoUrl: string): string {
  const safeUrl = escapeHtml(logoUrl);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
  <tr>
    <td align="center" style="padding:0 0 24px">
      <img src="${safeUrl}" alt="Amplitude" width="140" height="auto" style="display:block;max-width:140px;width:140px;height:auto;border:0;outline:none;text-decoration:none" />
    </td>
  </tr>
</table>`;
}

export function buildCampaignHtml(
  body: string,
  preview?: string | null,
  footerLogoUrl?: string | null
): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  const preheader = preview?.trim()
    ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(preview.trim())}</span>`
    : '';
  const logoUrl = resolveNewsletterLogoUrl(footerLogoUrl);
  const header = isSafeImageUrl(logoUrl) ? renderCampaignLogo(logoUrl) : '';
  const footer = header
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:32px">
  <tr>
    <td style="padding-top:24px;border-top:1px solid #e5e5e5;text-align:center">
      <img src="${escapeHtml(logoUrl)}" alt="Amplitude" width="100" height="auto" style="display:inline-block;max-width:100px;width:100px;height:auto;border:0;opacity:0.85" />
    </td>
  </tr>
</table>`
    : '';

  return `${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff">
  <tr>
    <td align="center" style="padding:24px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;width:100%">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111111">
            ${header}
            <div style="font-size:16px">${escaped}</div>
            ${footer}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/** @deprecated Use buildCampaignHtml for newsletter sends. */
export function textToHtml(body: string, preview?: string | null): string {
  return buildCampaignHtml(body, preview, getDefaultNewsletterFooterLogoUrl());
}

type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendBatchResult = {
  sent: number;
  failed: number;
  lastError: string | null;
};

function parseResendError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: { message?: string } };
    return parsed.message ?? parsed.error?.message ?? body;
  } catch {
    return body || 'Failed to send emails via Resend.';
  }
}

async function sendSingleEmail(
  apiKey: string,
  from: string,
  email: OutboundEmail
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: parseResendError(await response.text()) };
  }

  return { ok: true };
}

async function sendBatchChunk(
  apiKey: string,
  from: string,
  emails: OutboundEmail[]
): Promise<SendBatchResult> {
  const batchPayload = emails.map((email) => ({
    from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  }));

  const response = await fetch(`${RESEND_API_URL}/emails/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batchPayload),
  });

  if (response.ok) {
    return { sent: emails.length, failed: 0, lastError: null };
  }

  const batchError = parseResendError(await response.text());

  // Resend batch is atomic: one invalid recipient fails the whole chunk.
  let sent = 0;
  let failed = 0;
  let lastError = batchError;

  for (const email of emails) {
    const result = await sendSingleEmail(apiKey, from, email);
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      lastError = result.error;
    }
  }

  return { sent, failed, lastError };
}

export async function sendBatchEmails(
  emails: OutboundEmail[],
  from: string
): Promise<SendBatchResult> {
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    throw new Error('Resend is not connected. Add your API key in Settings.');
  }

  if (emails.length === 0) return { sent: 0, failed: 0, lastError: null };

  return sendBatchChunk(apiKey, from, emails);
}

export async function sendTestEmail(to: string): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const trimmed = to.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Invalid recipient email.' };
  }

  const status = await getEmailConnectionStatus();
  if (!status.keyDecryptOk || !status.fromEmail) {
    return { ok: false, error: 'Resend is not configured.' };
  }
  if (!status.domainVerified) {
    return {
      ok: false,
      error:
        status.issueDetail ??
        'Sender domain is not verified in Resend. Add and verify the domain at resend.com/domains.',
    };
  }

  const apiKey = await getResendApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Resend API key cannot be decrypted. Re-save it in Settings.' };
  }

  const sender = await getNewsletterSender();
  const footerLogoUrl = await getNewsletterFooterLogoUrl();
  const subject = 'Test Amplitude — envoi Resend';
  const body =
    'Ceci est un email de test depuis le back-office Amplitude.\n\nSi vous le recevez, Resend est correctement configuré.';
  const html = buildCampaignHtml(body, null, footerLogoUrl);

  const response = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender.from,
      to: [trimmed],
      subject,
      html,
      text: body,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: parseResendError(await response.text()) };
  }

  const payload = (await response.json()) as { id?: string };
  return { ok: true, id: payload.id };
}

export async function getNewsletterSender(): Promise<{ from: string; fromEmail: string; fromName: string | null }> {
  const [fromEmail, fromName] = await Promise.all([getNewsletterFromEmail(), getNewsletterFromName()]);

  if (!fromEmail) {
    throw new Error('Sender email is not configured. Add it in Settings.');
  }

  return {
    from: formatFromAddress(fromEmail, fromName),
    fromEmail,
    fromName,
  };
}
