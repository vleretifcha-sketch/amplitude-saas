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
  revalidatePath('/');
}

export async function updateUserProfile(formData: FormData) {
  const db = createAdminClient();
  const userId = String(formData.get('user_id'));
  const firstName = String(formData.get('first_name') || '').trim();
  const lastName = String(formData.get('last_name') || '').trim();

  const { error } = await db
    .from('profiles')
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  await db.auth.admin.updateUserById(userId, {
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function createUser(formData: FormData): Promise<string> {
  const db = createAdminClient();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const firstName = String(formData.get('first_name') || '').trim();
  const lastName = String(formData.get('last_name') || '').trim();

  if (!email || password.length < 8) {
    throw new Error('Email and password (min 8 characters) are required.');
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('User creation failed.');

  revalidatePath('/users');
  revalidatePath('/');
  return data.user.id;
}
