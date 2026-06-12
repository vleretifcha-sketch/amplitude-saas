'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptSetting, maskSecretKey } from '@/lib/settings-crypto';
import {
  getStripeSecretKey,
  isStripeConnected,
  STRIPE_SECRET_SETTING_KEY,
} from '@/lib/stripe/server';

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
