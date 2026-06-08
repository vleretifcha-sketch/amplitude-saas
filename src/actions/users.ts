'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SubscriptionStatus } from '@/lib/types';

export async function updateUserSubscription(formData: FormData) {
  const db = createAdminClient();
  const userId = String(formData.get('user_id'));
  const status = String(formData.get('subscription_status')) as SubscriptionStatus;
  const expiresRaw = String(formData.get('subscription_expires_at') || '');
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  const { error: profileError } = await db
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  if (status === 'active' && expiresAt) {
    const { error: subError } = await db.from('subscriptions').upsert(
      {
        user_id: userId,
        product_id: 'amplitude_premium_monthly',
        status: 'active',
        price_monthly: 39,
        currency: 'EUR',
        expires_at: expiresAt,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,product_id' }
    );
    if (subError) throw new Error(subError.message);
  }

  if (status === 'expired' || status === 'none') {
    await db.from('subscriptions').update({ status: 'expired' }).eq('user_id', userId);
  }

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  revalidatePath('/subscriptions');
}
