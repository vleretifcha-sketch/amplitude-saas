'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getNewsletterSender,
  sendBatchEmails,
  textToHtml,
} from '@/lib/email/server';
import type { NewsletterCampaign, NewsletterRecipient } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BATCH_SIZE = 100;

function parseCampaignFields(formData: FormData) {
  const subject = String(formData.get('subject') || '').trim();
  const preview = String(formData.get('preview') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!subject) throw new Error('Subject is required.');
  if (!body) throw new Error('Email body is required.');

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
  const { subject, preview, body } = parseCampaignFields(formData);
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

  if (error) throw new Error(error.message);

  revalidatePath('/newsletter/campaigns');
}

export async function sendNewsletterCampaign(formData: FormData) {
  const { subject, preview, body } = parseCampaignFields(formData);
  const sender = await getNewsletterSender();
  const recipients = await fetchNonPremiumRecipients();

  if (recipients.length === 0) {
    throw new Error('No free users to send to.');
  }

  const db = createAdminClient();
  const html = textToHtml(body, preview);
  let sentCount = 0;
  let failedCount = 0;

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
    } catch {
      failedCount += chunk.length;
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

  if (error) throw new Error(error.message);

  revalidatePath('/newsletter/campaigns');

  if (sentCount === 0) {
    throw new Error('Campaign could not be sent. Check your Resend configuration.');
  }

  return { sentCount, recipientCount: recipients.length, failedCount };
}
