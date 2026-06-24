import { createAdminClient } from '@/lib/supabase/admin';
import { decryptSetting } from '@/lib/settings-crypto';
import { getPublicAppUrl } from '@/lib/app-url';

export const RESEND_API_KEY_SETTING = 'resend_api_key';
export const NEWSLETTER_FROM_EMAIL_SETTING = 'newsletter_from_email';
export const NEWSLETTER_FROM_NAME_SETTING = 'newsletter_from_name';
export const NEWSLETTER_FOOTER_LOGO_URL_SETTING = 'newsletter_footer_logo_url';

const RESEND_API_URL = 'https://api.resend.com';

export type EmailConnectionStatus = {
  connected: boolean;
  fromEmail: string | null;
  fromName: string | null;
  hasApiKey: boolean;
  footerLogoUrl: string;
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

export async function getNewsletterFooterLogoUrl(): Promise<string> {
  const custom = await getSettingValue(NEWSLETTER_FOOTER_LOGO_URL_SETTING);
  return custom || getDefaultNewsletterFooterLogoUrl();
}

export async function getEmailConnectionStatus(): Promise<EmailConnectionStatus> {
  const [apiKey, fromEmail, fromName, footerLogoUrl] = await Promise.all([
    getResendApiKey(),
    getNewsletterFromEmail(),
    getNewsletterFromName(),
    getNewsletterFooterLogoUrl(),
  ]);

  return {
    connected: Boolean(apiKey && fromEmail),
    fromEmail,
    fromName,
    hasApiKey: Boolean(apiKey),
    footerLogoUrl,
  };
}

export async function isEmailConnected(): Promise<boolean> {
  const apiKey = await getResendApiKey();
  if (!apiKey) return false;

  try {
    const response = await fetch(`${RESEND_API_URL}/domains`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
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
    ? `<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview.trim())}</span>`
    : '';
  const logoUrl = footerLogoUrl?.trim();
  const footer =
    logoUrl && isSafeImageUrl(logoUrl)
      ? `<div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;text-align:center">
           <img src="${escapeHtml(logoUrl)}" alt="Amplitude" width="140" style="max-width:140px;width:140px;height:auto;display:inline-block;border:0" />
         </div>`
      : '';
  return `${preheader}<div style="font-family:sans-serif;line-height:1.6;color:#111;max-width:600px">${escaped}${footer}</div>`;
}

/** @deprecated Use buildCampaignHtml for newsletter sends. */
export function textToHtml(body: string, preview?: string | null): string {
  return buildCampaignHtml(body, preview);
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
