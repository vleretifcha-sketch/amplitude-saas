'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptSetting, maskSecretKey } from '@/lib/settings-crypto';
import {
  getStripeSecretKey,
  isStripeConnected,
  STRIPE_SECRET_SETTING_KEY,
} from '@/lib/stripe/server';
import {
  getEmailConnectionStatus as getEmailStatus,
  getResendApiKey,
  NEWSLETTER_FROM_EMAIL_SETTING,
  NEWSLETTER_FROM_NAME_SETTING,
  RESEND_API_KEY_SETTING,
  type EmailConnectionStatus,
} from '@/lib/email/server';

export type StripeConnectionStatus = {
  connected: boolean;
  maskedKey: string | null;
};

export async function getStripeConnectionStatus(): Promise<StripeConnectionStatus> {
  const secretKey = await getStripeSecretKey();
  if (!secretKey) {
    return { connected: false, maskedKey: null };
  }

  const connected = await isStripeConnected();
  return {
    connected,
    maskedKey: maskSecretKey(secretKey),
  };
}

export async function saveStripeSecretKey(formData: FormData) {
  const rawKey = String(formData.get('stripe_secret_key') || '').trim();
  if (!rawKey.startsWith('sk_test_') && !rawKey.startsWith('sk_live_')) {
    throw new Error('Invalid Stripe secret key format.');
  }

  const db = createAdminClient();
  const encrypted = encryptSetting(rawKey);

  const { error } = await db.from('app_settings').upsert(
    {
      key: STRIPE_SECRET_SETTING_KEY,
      value: encrypted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/users');
}

export async function disconnectStripe() {
  const db = createAdminClient();
  const { error } = await db.from('app_settings').delete().eq('key', STRIPE_SECRET_SETTING_KEY);
  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/users');
}

export async function getEmailConnectionStatus(): Promise<EmailConnectionStatus> {
  return getEmailStatus();
}

export async function saveEmailSettings(formData: FormData) {
  const rawKey = String(formData.get('resend_api_key') || '').trim();
  const fromEmail = String(formData.get('newsletter_from_email') || '').trim();
  const fromName = String(formData.get('newsletter_from_name') || '').trim();

  if (!fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    throw new Error('Invalid sender email address.');
  }

  const db = createAdminClient();
  const rows: { key: string; value: string; updated_at: string }[] = [
    {
      key: NEWSLETTER_FROM_EMAIL_SETTING,
      value: fromEmail,
      updated_at: new Date().toISOString(),
    },
    {
      key: NEWSLETTER_FROM_NAME_SETTING,
      value: fromName,
      updated_at: new Date().toISOString(),
    },
  ];

  if (rawKey) {
    if (!rawKey.startsWith('re_')) {
      throw new Error('Invalid Resend API key format.');
    }
    rows.push({
      key: RESEND_API_KEY_SETTING,
      value: encryptSetting(rawKey),
      updated_at: new Date().toISOString(),
    });
  } else {
    const existingKey = await getResendApiKey();
    if (!existingKey) {
      throw new Error('Resend API key is required.');
    }
  }

  const { error } = await db.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/newsletter');
}

export async function disconnectEmail() {
  const db = createAdminClient();
  const { error } = await db
    .from('app_settings')
    .delete()
    .in('key', [RESEND_API_KEY_SETTING, NEWSLETTER_FROM_EMAIL_SETTING, NEWSLETTER_FROM_NAME_SETTING]);

  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/newsletter');
}
