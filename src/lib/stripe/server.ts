import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptSetting } from '@/lib/settings-crypto';

export const STRIPE_SECRET_SETTING_KEY = 'stripe_secret_key';

export async function getStripeSecretKey(): Promise<string | null> {
  const db = createAdminClient();
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', STRIPE_SECRET_SETTING_KEY)
    .maybeSingle();

  if (!data?.value) return null;

  try {
    return decryptSetting(data.value);
  } catch {
    return null;
  }
}

export async function getStripeClient(): Promise<Stripe> {
  const secretKey = await getStripeSecretKey();
  if (!secretKey) {
    throw new Error('Stripe is not connected. Add your API key in Settings.');
  }
  return new Stripe(secretKey);
}

export async function isStripeConnected(): Promise<boolean> {
  const secretKey = await getStripeSecretKey();
  if (!secretKey) return false;

  try {
    const stripe = new Stripe(secretKey);
    await stripe.products.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}
