'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getNewsletterSender,
  sendBatchEmails,
  buildCampaignHtml,
  getNewsletterFooterLogoUrl,
} from '@/lib/email/server';
import type { NewsletterCampaign, NewsletterRecipient } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BATCH_SIZE = 100;

type NewsletterActionResult =
  | { ok: true; sentCount?: number; recipientCount?: number; failedCount?: number }
  | { ok: false; error: string };

function parseCampaignFields(formData: FormData): { subject: string; preview: string | null; body: string } | NewsletterActionResult {
  const subject = String(formData.get('subject') || '').trim();
  const preview = String(formData.get('preview') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!subject) return { ok: false, error: 'Subject is required.' };
  if (!body) return { ok: false, error: 'Email body is required.' };

  return { subject, preview: preview || null, body };
}

function isPremiumStatus(status: string) {
  return status === 'active' || status === 'trial';
}

export async function fetchNonPremiumRecipients(): Promise<NewsletterRecipient[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('profiles')
    .select('id, email, first_name, last_name, subscription_status, created_at')
    .in('subscription_status', ['none', 'expired'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const seen = new Set<string>();

  return (data ?? []).filter((profile) => {
    const email = profile.email?.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email) || seen.has(email)) return false;
    if (isPremiumStatus(profile.subscription_status)) return false;
    seen.add(email);
    return true;
  }) as NewsletterRecipient[];
}

export async function fetchNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw new Error(error.message);
  }

  return (data ?? []) as NewsletterCampaign[];
}

export async function saveNewsletterDraft(formData: FormData) {
  const parsed = parseCampaignFields(formData);
  if ('ok' in parsed) return parsed;
  const { subject, preview, body } = parsed;

  try {
    const recipients = await fetchNonPremiumRecipients();
    const db = createAdminClient();

    let fromEmail = 'pending@local';
    let fromName: string | null = null;
    try {
      const sender = await getNewsletterSender();
      fromEmail = sender.fromEmail;
      fromName = sender.fromName;
    } catch {
      // Brouillon possible avant configuration Resend.
    }

    const { error } = await db.from('newsletter_campaigns').insert({
      subject,
      preview,
      body,
      from_email: fromEmail,
      from_name: fromName,
      recipient_count: recipients.length,
      status: 'draft',
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/newsletter/campaigns');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to save draft.',
    };
  }
}

export async function sendNewsletterCampaign(formData: FormData) {
  const parsed = parseCampaignFields(formData);
  if ('ok' in parsed) return parsed;
  const { subject, preview, body } = parsed;

  try {
    const sender = await getNewsletterSender();
    const recipients = await fetchNonPremiumRecipients();

    if (recipients.length === 0) {
      return { ok: false, error: 'No free users to send to.' };
    }

    const db = createAdminClient();
    const footerLogoUrl = await getNewsletterFooterLogoUrl();
    const html = buildCampaignHtml(body, preview, footerLogoUrl);
    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;

    for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
      const chunk = recipients.slice(index, index + BATCH_SIZE);
      const emails = chunk.map((recipient) => ({
        to: recipient.email.trim(),
        subject,
        html,
        text: body,
      }));

      try {
        const result = await sendBatchEmails(emails, sender.from);
        sentCount += result.sent;
        failedCount += result.failed;
        if (result.lastError) lastError = result.lastError;
      } catch (error) {
        failedCount += chunk.length;
        lastError = error instanceof Error ? error.message : 'Failed to send emails via Resend.';
      }
    }

    const status = sentCount > 0 ? 'sent' : 'failed';
    const { error } = await db.from('newsletter_campaigns').insert({
      subject,
      preview,
      body,
      from_email: sender.fromEmail,
      from_name: sender.fromName,
      recipient_count: recipients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/newsletter/campaigns');

    if (sentCount === 0) {
      return {
        ok: false,
        error:
          lastError ??
          'Campaign could not be sent. Check your Resend configuration (API key, verified sender domain).',
      };
    }

    return { ok: true, sentCount, recipientCount: recipients.length, failedCount };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to send campaign.',
    };
  }
}
